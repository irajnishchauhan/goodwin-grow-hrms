import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { SupabaseStore } from '@/lib/db/supabaseStore';
import { Employee } from '@/lib/types';
import { buildDailyWorkforceRoster } from '@/lib/attendanceCalculator';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant =
      (await SupabaseStore.getTenantBySlug(tenantSlug)) ||
      (await db.getResolvedTenant(tenantSlug, true));
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const targetDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const [supaRecords, supaEmployees, supaRegularizations, supaShifts, supaLeaves] =
      await Promise.all([
        SupabaseStore.getAttendance(tenant.id),
        SupabaseStore.getEmployees(tenant.id),
        SupabaseStore.getRegularizations(tenant.id),
        SupabaseStore.getShifts(tenant.id),
        SupabaseStore.getLeaveApplications(tenant.id)
      ]);

    if (supaEmployees && supaEmployees.length > 0) {
      db.syncEmployees(supaEmployees);
    }

    if (supaRegularizations && supaRegularizations.length > 0) {
      db.syncRegularizations(supaRegularizations);
    }

    const employees = supaEmployees !== null ? supaEmployees : db.getEmployees(tenant.id);
    const regularizations =
      supaRegularizations !== null ? supaRegularizations : db.getRegularizations(tenant.id);
    const shifts = supaShifts !== null ? supaShifts : db.getShifts(tenant.id);
    const leaves = supaLeaves !== null ? supaLeaves : db.getLeaveApplications(tenant.id);

    // Filter out any automated/test benchmark entries
    const rawAttendance = supaRecords !== null ? supaRecords : db.getAttendance(tenant.id);
    const realPunchRecords = rawAttendance.filter((r) => {
      const noteLower = (r.notes || '').toLowerCase();
      return !noteLower.includes('benchmark') && !noteLower.includes('test punch');
    });

    // Build the complete daily attendance roster for all workforce members as per industry standards
    const { roster, stats } = buildDailyWorkforceRoster({
      date: targetDate,
      employees,
      punchRecords: realPunchRecords,
      leaveApplications: leaves,
      shifts,
      tenantId: tenant.id
    });

    const payload = {
      records: roster,
      employees,
      regularizations,
      shifts,
      stats,
      date: targetDate,
      pendingRegularizationsCount: regularizations.filter((r) => r.status === 'PENDING').length
    };

    return NextResponse.json(
      { success: true, data: payload },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching attendance';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant =
      (await SupabaseStore.getTenantBySlug(tenantSlug)) ||
      (await db.getResolvedTenant(tenantSlug, true));
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    // Check if this is a regularization request
    const isRegularization =
      body.action === 'REGULARIZATION' ||
      body.type === 'REGULARIZATION' ||
      Boolean(body.requestedClockIn && body.attendanceDate);

    if (isRegularization) {
      const {
        employeeId,
        attendanceDate,
        requestedClockIn,
        requestedClockOut,
        reason,
        managerId,
        managerName,
        employeeName
      } = body;

      if (!employeeId || !attendanceDate) {
        return NextResponse.json(
          { success: false, error: 'Employee ID and attendance date required' },
          { status: 400 }
        );
      }

      let emp = db.getEmployeeById(tenant.id, employeeId);
      if (!emp) {
        const emps = await SupabaseStore.getEmployees(tenant.id);
        if (emps && emps.length > 0) {
          db.syncEmployees(emps);
          emp = db.getEmployeeById(tenant.id, employeeId);
        }
      }

      const reg = db.createRegularization(tenant.id, {
        employeeId,
        attendanceDate,
        requestedClockIn: requestedClockIn || '09:00',
        requestedClockOut: requestedClockOut || '18:00',
        reason: reason || 'Shift time adjustment requested',
        managerId: managerId || emp?.reportingManagerId,
        managerName: managerName || emp?.reportingManagerName || 'Executive Lead',
        employeeName: employeeName || (emp ? `${emp.firstName} ${emp.lastName}` : undefined)
      });

      await SupabaseStore.saveRegularization(reg);

      return NextResponse.json(
        {
          success: true,
          message: 'Attendance regularization request submitted successfully for manager approval',
          data: reg
        },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
      );
    }

    // Standard Clock-in / Clock-out punch (Initiated by Employee Only)
    const employeeId = body.employeeId;
    const rawAction = body.action || body.type;
    const notes = body.notes;

    if (!employeeId || !rawAction) {
      return NextResponse.json(
        { success: false, error: 'Employee ID and action (IN/OUT) required' },
        { status: 400 }
      );
    }

    const action: 'IN' | 'OUT' = rawAction === 'PUNCH_IN' || rawAction === 'IN' ? 'IN' : 'OUT';

    let emp = db.getEmployeeById(tenant.id, employeeId);
    if (!emp) {
      const emps = await SupabaseStore.getEmployees(tenant.id);
      if (emps && emps.length > 0) {
        db.syncEmployees(emps);
        emp = db.getEmployeeById(tenant.id, employeeId);
      }
    }

    if (!emp) {
      return NextResponse.json(
        { success: false, error: 'Employee not found for attendance punch' },
        { status: 404 }
      );
    }

    const record = db.recordPunch(tenant.id, employeeId, action, notes);
    await SupabaseStore.saveAttendance(record);

    return NextResponse.json(
      {
        success: true,
        message: `Clock ${action === 'IN' ? 'In' : 'Out'} logged at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${record.status})`,
        data: record
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error processing attendance request';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant =
      (await SupabaseStore.getTenantBySlug(tenantSlug)) ||
      (await db.getResolvedTenant(tenantSlug, true));
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { regularizationId, status, reviewedBy, comment } = body;
    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    if (!regularizationId || !status) {
      return NextResponse.json(
        { success: false, error: 'Regularization ID and status (APPROVED/REJECTED) required' },
        { status: 400 }
      );
    }

    const supaRegs = await SupabaseStore.getRegularizations(tenant.id);
    if (supaRegs && supaRegs.length > 0) {
      db.syncRegularizations(supaRegs);
    }

    const updated = db.updateRegularizationStatus(
      tenant.id,
      regularizationId,
      status,
      reviewedBy || 'Manager Approver',
      comment
    );

    await SupabaseStore.saveRegularization(updated);

    if (status === 'APPROVED') {
      const att = db
        .getAttendance(tenant.id, updated.attendanceDate)
        .find((a) => a.employeeId === updated.employeeId);
      if (att) {
        await SupabaseStore.saveAttendance(att);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Regularization request ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully`,
        data: updated
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating regularization status';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
