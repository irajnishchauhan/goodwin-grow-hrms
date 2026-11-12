import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { SupabaseStore } from '@/lib/db/supabaseStore';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant = await SupabaseStore.getTenantBySlug(tenantSlug) || await db.getResolvedTenant(tenantSlug, true);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const defaultMonth = new Date().toISOString().slice(0, 7);
    const targetMonth = searchParams.get('month') || defaultMonth;
    const [yearNum, monthNum] = targetMonth.split('-').map(Number);
    const totalCalendarDays = yearNum && monthNum ? new Date(yearNum, monthNum, 0).getDate() : 30;

    const [supaSlips, supaAtt, supaEmps, supaLeaves, supaHolidays] = await Promise.all([
      SupabaseStore.getSalarySlips(tenant.id),
      SupabaseStore.getAttendance(tenant.id),
      SupabaseStore.getEmployees(tenant.id),
      SupabaseStore.getLeaveApplications(tenant.id),
      SupabaseStore.getHolidays(tenant.id)
    ]);

    if (supaAtt !== null) {
      db.setAttendanceForTenant(tenant.id, supaAtt);
    }
    if (supaEmps && supaEmps.length > 0) {
      db.syncEmployees(supaEmps);
    }
    if (supaLeaves && supaLeaves.length > 0) {
      db.syncLeaveApplications(supaLeaves);
    }
    if (supaHolidays && supaHolidays.length > 0) {
      db.syncHolidays(supaHolidays);
    }
    if (supaSlips && supaSlips.length > 0) {
      db.syncSalarySlips(supaSlips);
    }

    const employees = supaEmps !== null ? supaEmps : db.getEmployees(tenant.id);
    const empById = new Map(employees.map((e) => [e.id, e]));

    const existingForMonth = (supaSlips || []).filter((s) => s.month === targetMonth);
    let slips = existingForMonth;

    if (slips.length === 0) {
      slips = db.generatePayrollRun(tenant.id, targetMonth);
      await Promise.all(slips.map((s) => SupabaseStore.saveSalarySlip(s)));
    } else {
      // Filter out test/benchmark records to evaluate real payable attendance
      const validAttendance = (supaAtt || []).filter((a) => {
        if (!a.date.startsWith(targetMonth)) return false;
        const noteLower = (a.notes || '').toLowerCase();
        return !noteLower.includes('benchmark') && !noteLower.includes('test punch');
      });

      const monthApprovedLeaves = (supaLeaves || []).filter(
        (l) =>
          l.status === 'APPROVED' &&
          (l.startDate.startsWith(targetMonth) || l.endDate.startsWith(targetMonth))
      );

      // Strict enforcement of "No Entry = No Pay" (checking both attendance & approved leaves)
      slips = slips.map((slip) => {
        const emp = empById.get(slip.employeeId);
        const enrichedSlip = {
          ...slip,
          totalCalendarDays: slip.totalCalendarDays ?? totalCalendarDays,
          designationTitle: slip.designationTitle || emp?.designationTitle,
          bankName: slip.bankName || emp?.bankName,
          bankAccountNumber: slip.bankAccountNumber || emp?.bankAccountNumber,
          ifscCode: slip.ifscCode || emp?.ifscCode,
          panOrTaxId: slip.panOrTaxId || emp?.panOrTaxId,
          uan: slip.uan || emp?.uan,
          taxRegime: slip.taxRegime || emp?.taxRegime || 'NEW',
          workLocation: slip.workLocation || emp?.workLocation,
          joiningDate: slip.joiningDate || emp?.joiningDate
        };

        const empAtt = validAttendance.filter((a) => a.employeeId === slip.employeeId);
        const empLeaves = monthApprovedLeaves.filter((l) => l.employeeId === slip.employeeId);
        if (
          empAtt.length === 0 &&
          empLeaves.length === 0 &&
          (enrichedSlip.netPay > 0 || enrichedSlip.totalDeductions > 0 || enrichedSlip.paymentStatus === 'PAID')
        ) {
          const corrected = {
            ...enrichedSlip,
            basicPay: 0,
            hra: 0,
            specialAllowance: 0,
            grossSalary: 0,
            providentFund: 0,
            esi: 0,
            professionalTax: 0,
            taxDeduction: 0,
            totalDeductions: 0,
            netPay: 0,
            payableDays: 0,
            lopDays: totalCalendarDays,
            paymentStatus: 'PENDING' as const
          };
          SupabaseStore.saveSalarySlip(corrected).catch(() => {});
          return corrected;
        }
        return enrichedSlip;
      });
    }

    const totalDisbursed = slips.reduce((sum, s) => sum + s.netPay, 0);

    const payload = {
      currency: tenant.currency,
      slips,
      totalNetDisbursed: totalDisbursed,
      totalSlipsCount: slips.length
    };

    return NextResponse.json(
      { success: true, data: payload },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching payroll';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant = await SupabaseStore.getTenantBySlug(tenantSlug) || await db.getResolvedTenant(tenantSlug, true);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const targetMonth = body.month || new Date().toISOString().slice(0, 7);
    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    const [supaEmps, supaAtt, supaLeaves, supaHolidays, supaSlips] = await Promise.all([
      SupabaseStore.getEmployees(tenant.id),
      SupabaseStore.getAttendance(tenant.id),
      SupabaseStore.getLeaveApplications(tenant.id),
      SupabaseStore.getHolidays(tenant.id),
      SupabaseStore.getSalarySlips(tenant.id)
    ]);
    if (supaEmps && supaEmps.length > 0) {
      db.syncEmployees(supaEmps);
    }
    if (supaAtt !== null) {
      db.setAttendanceForTenant(tenant.id, supaAtt);
    }
    if (supaLeaves && supaLeaves.length > 0) {
      db.syncLeaveApplications(supaLeaves);
    }
    if (supaHolidays && supaHolidays.length > 0) {
      db.syncHolidays(supaHolidays);
    }
    if (supaSlips && supaSlips.length > 0) {
      db.syncSalarySlips(supaSlips);
    }

    const slips = db.generatePayrollRun(tenant.id, targetMonth);
    // Save to Supabase in parallel
    await Promise.all(slips.map((slip) => SupabaseStore.saveSalarySlip(slip)));

    return NextResponse.json(
      {
        success: true,
        message: `Payroll executed successfully for ${slips.length} employees for ${targetMonth}.`,
        data: { slips, count: slips.length }
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error generating payroll';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant = (await SupabaseStore.getTenantBySlug(tenantSlug)) || (await db.getResolvedTenant(tenantSlug, true));
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { action, slipId, month, confirmedBy, reference, paymentReference } = body;
    const finalRef = paymentReference || reference;
    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    const supaSlips = await SupabaseStore.getSalarySlips(tenant.id);
    if (supaSlips && supaSlips.length > 0) {
      db.syncSalarySlips(supaSlips);
    }

    if (action === 'CONFIRM_ALL') {
      const targetMonth = month || new Date().toISOString().slice(0, 7);
      const updatedSlips = db.confirmAllSalaryPayments(
        tenant.id,
        targetMonth,
        confirmedBy || 'Company Finance',
        finalRef
      );
      if (updatedSlips.length === 0) {
        return NextResponse.json(
          { success: false, error: `No salary slips found for ${targetMonth} to confirm.` },
          { status: 404 }
        );
      }
      await Promise.all(updatedSlips.map((s) => SupabaseStore.saveSalarySlip(s)));

      // Emit in-app persistent notifications for all employees
      const curr = tenant.currency || 'INR';
      try {
        const notifs = updatedSlips.map((s) =>
          db.createNotification(tenant.id, {
            title: `Salary Disbursed for ${s.month}`,
            message: `Your net salary of ${curr} ${s.netPay.toLocaleString('en-IN')} for ${s.month} has been marked as PAID. Official payslip PDF is ready in your portal.`,
            type: 'SALARY_PAID',
            employeeId: s.employeeId,
            linkUrl: `/app/${tenantSlug}/payroll?tab=slips`
          })
        );
        await Promise.all(notifs.map((n) => SupabaseStore.saveNotification(n)));
      } catch (e) {
        console.warn('Failed to broadcast payroll notifications:', e);
      }

      return NextResponse.json({
        success: true,
        message: `Payment confirmed and marked as PAID for all ${updatedSlips.length} employees for ${targetMonth}.`,
        data: updatedSlips
      });
    }

    if (!slipId) {
      return NextResponse.json({ success: false, error: 'Salary slip ID required' }, { status: 400 });
    }

    const updatedSlip = db.confirmSalaryPayment(
      tenant.id,
      slipId,
      confirmedBy || 'Company Finance',
      finalRef
    );
    if (!updatedSlip) {
      return NextResponse.json({ success: false, error: 'Salary slip not found' }, { status: 404 });
    }

    await SupabaseStore.saveSalarySlip(updatedSlip);

    // Emit in-app notification for single employee
    try {
      const notif = db.createNotification(tenant.id, {
        title: `Salary Disbursed for ${updatedSlip.month}`,
        message: `Your net salary of ₹${updatedSlip.netPay.toLocaleString('en-IN')} for ${updatedSlip.month} has been marked as PAID. Official payslip PDF is ready in your portal.`,
        type: 'SALARY_PAID',
        employeeId: updatedSlip.employeeId,
        linkUrl: `/app/${tenantSlug}/payroll?tab=slips`
      });
      await SupabaseStore.saveNotification(notif);
    } catch (e) {
      console.warn('Failed to send employee payroll notification:', e);
    }

    return NextResponse.json({
      success: true,
      message: `Salary slip payment confirmed and marked as PAID.`,
      data: updatedSlip
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error confirming payment';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
