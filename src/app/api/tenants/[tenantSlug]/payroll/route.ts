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
    const targetMonth = searchParams.get('month') || '2026-10';

    const [supaSlips, supaAtt, supaEmps] = await Promise.all([
      SupabaseStore.getSalarySlips(tenant.id),
      SupabaseStore.getAttendance(tenant.id),
      SupabaseStore.getEmployees(tenant.id)
    ]);

    if (supaAtt !== null) {
      db.setAttendanceForTenant(tenant.id, supaAtt);
    }
    if (supaEmps && supaEmps.length > 0) {
      db.syncEmployees(supaEmps);
    }

    let slips = supaSlips;
    if (slips === null || slips.length === 0) {
      slips = db.generatePayrollRun(tenant.id, targetMonth);
      await Promise.all(slips.map((s) => SupabaseStore.saveSalarySlip(s)));
    } else {
      // Filter out test/benchmark records to evaluate real payable attendance
      const validAttendance = (supaAtt || []).filter((a) => {
        if (!a.date.startsWith(targetMonth)) return false;
        const noteLower = (a.notes || '').toLowerCase();
        return !noteLower.includes('benchmark') && !noteLower.includes('test punch');
      });

      // Strict enforcement of "No Entry = No Pay":
      // If an employee has 0 valid logged shifts/leaves in the month, their earned pay must be 0
      slips = slips.map((slip) => {
        if (slip.month !== targetMonth) return slip;
        const empAtt = validAttendance.filter((a) => a.employeeId === slip.employeeId);
        if (empAtt.length === 0 && (slip.netPay > 0 || slip.paymentStatus === 'PAID')) {
          const corrected = {
            ...slip,
            basicPay: 0,
            hra: 0,
            specialAllowance: 0,
            grossSalary: 0,
            netPay: 0,
            paymentStatus: 'PENDING' as const
          };
          SupabaseStore.saveSalarySlip(corrected).catch(() => {});
          return corrected;
        }
        return slip;
      });

      if (searchParams.get('month')) {
        slips = slips.filter((s) => s.month === targetMonth);
      }
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
    const targetMonth = body.month || '2026-10';
    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    const [supaEmps, supaAtt] = await Promise.all([
      SupabaseStore.getEmployees(tenant.id),
      SupabaseStore.getAttendance(tenant.id)
    ]);
    if (supaEmps && supaEmps.length > 0) {
      db.syncEmployees(supaEmps);
    }
    if (supaAtt !== null) {
      db.setAttendanceForTenant(tenant.id, supaAtt);
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
      const targetMonth = month || '2026-10';
      const updatedSlips = db.confirmAllSalaryPayments(
        tenant.id,
        targetMonth,
        confirmedBy || 'Company Finance',
        finalRef
      );
      await Promise.all(updatedSlips.map((s) => SupabaseStore.saveSalarySlip(s)));
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
