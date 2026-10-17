import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { SupabaseStore } from '@/lib/db/supabaseStore';
import { Employee } from '@/lib/types';

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
    const date = searchParams.get('date') || undefined;

    const [supaRecords, supaEmployees, supaRegularizations] = await Promise.all([
      SupabaseStore.getAttendance(tenant.id),
      SupabaseStore.getEmployees(tenant.id),
      SupabaseStore.getRegularizations(tenant.id)
    ]);

    if (supaEmployees && supaEmployees.length > 0) {
      db.syncEmployees(supaEmployees);
    }

    if (supaRegularizations && supaRegularizations.length > 0) {
      db.syncRegularizations(supaRegularizations);
    }

    let records = supaRecords !== null ? supaRecords : db.getAttendance(tenant.id, date);
    if (date) {
      records = records.filter((r) => r.date === date);
    }

    let employees = supaEmployees !== null ? supaEmployees : db.getEmployees(tenant.id);
    let regularizations = supaRegularizations !== null ? supaRegularizations : db.getRegularizations(tenant.id);

    const payload = {
      records,
      employees,
      regularizations,
      presentCount: records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE_ENTRY').length,
      totalEmployees: employees.length,
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
    const tenant = await SupabaseStore.getTenantBySlug(tenantSlug) || await db.getResolvedTenant(tenantSlug, true);
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

      // Ensure employee is in memory db
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

    // Standard Clock-in / Clock-out punch
    const employeeId = body.employeeId;
    const rawAction = body.action || body.type;
    const notes = body.notes;

    if (!employeeId || !rawAction) {
      return NextResponse.json({ success: false, error: 'Employee ID and action (IN/OUT) required' }, { status: 400 });
    }

    const action: 'IN' | 'OUT' = (rawAction === 'PUNCH_IN' || rawAction === 'IN') ? 'IN' : 'OUT';

    // Ensure employee exists in db memory before punching
    let emp = db.getEmployeeById(tenant.id, employeeId);
    if (!emp) {
      const emps = await SupabaseStore.getEmployees(tenant.id);
      if (emps && emps.length > 0) {
        db.syncEmployees(emps);
        emp = db.getEmployeeById(tenant.id, employeeId);
      }
    }
    if (!emp) {
      const allEmps = db.getEmployees(tenant.id);
      emp = allEmps.find((e) => e.id === employeeId) || null;
      if (!emp) {
        const placeholderEmp: Employee = {
          id: employeeId,
          tenantId: tenant.id,
          employeeCode: 'EMP-GEN',
          firstName: 'Team',
          lastName: 'Member',
          workEmail: 'employee@goodwin.local',
          phone: '+91 99999 00000',
          gender: 'MALE',
          joiningDate: '2024-01-01',
          departmentId: 'dept-gen',
          designationId: 'desig-gen',
          departmentName: 'General',
          designationTitle: 'Team Member',
          employmentType: 'FULL_TIME',
          status: 'ACTIVE',
          loginStatus: 'ACCEPTED',
          monthlySalary: 30000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.upsertEmployee(placeholderEmp);
        emp = placeholderEmp;
      }
    }

    const record = db.recordPunch(tenant.id, employeeId, action, notes);
    await SupabaseStore.saveAttendance(record);

    return NextResponse.json(
      {
        success: true,
        message: `Punch ${action === 'IN' ? 'In' : 'Out'} logged at ${new Date().toLocaleTimeString()}`,
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
    const tenant = await SupabaseStore.getTenantBySlug(tenantSlug) || await db.getResolvedTenant(tenantSlug, true);
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

    // Sync latest regularizations from Supabase
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

    // If approved, sync and persist the updated/created attendance record
    if (status === 'APPROVED') {
      const att = db.getAttendance(tenant.id, updated.attendanceDate).find((a) => a.employeeId === updated.employeeId);
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
