import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { SupabaseStore } from '@/lib/db/supabaseStore';
import { Employee, AttendanceRecord } from '@/lib/types';
import {
  buildDailyWorkforceRoster,
  evaluateAttendanceStatus,
  DEFAULT_SHIFT_POLICY,
  formatDateInTimezone,
  formatTimeInTimezone,
  formatTimeTo12Hour
} from '@/lib/attendanceCalculator';

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

    const timezone = tenant.timezone || 'Asia/Kolkata';
    const { searchParams } = new URL(req.url);
    const targetDate = searchParams.get('date') || formatDateInTimezone(new Date(), timezone);

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

    if (searchParams.get('reset') === 'true') {
      db.clearExcludedAttendanceKeys(tenant.id, targetDate);
    }

    // Collect excluded deleted employees for this date
    const excludedEmployeeIds = new Set<string>();
    employees.forEach((emp) => {
      const hasPunch = realPunchRecords.some(
        (r) => r.employeeId === emp.id && r.date === targetDate && Boolean(r.clockInTime)
      );
      if (hasPunch) {
        db.clearExcludedAttendanceKey(tenant.id, emp.id, targetDate);
      } else if (db.isAttendanceKeyExcluded(tenant.id, emp.id, targetDate)) {
        excludedEmployeeIds.add(emp.id);
      }
    });

    // Build the complete daily attendance roster for all workforce members as per industry standards
    const { roster, stats } = buildDailyWorkforceRoster({
      date: targetDate,
      employees,
      punchRecords: realPunchRecords,
      leaveApplications: leaves,
      shifts,
      tenantId: tenant.id,
      excludedEmployeeIds,
      timezone
    });

    // Real logged attendance records (only actual punches, admin marks, and approved leaves)
    const rosterPunches = roster.filter(
      (r) => !r.id.startsWith('absent-') && !r.id.startsWith('off-')
    );

    // Merge with any direct target date punch records to ensure 100% visibility
    const targetDatePunches = realPunchRecords.filter(
      (r) => r.date === targetDate && Boolean(r.clockInTime)
    );
    const recordMap = new Map<string, AttendanceRecord>();
    rosterPunches.forEach((r) => recordMap.set(r.employeeId, r));
    targetDatePunches.forEach((r) => {
      if (!recordMap.has(r.employeeId)) {
        recordMap.set(r.employeeId, r);
      }
    });
    const loggedRecords = Array.from(recordMap.values());

    const payload = {
      records: loggedRecords,
      roster,
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
    const timezone = body.timezone || tenant.timezone || 'Asia/Kolkata';
    const clientTime = body.clientTime || body.time;
    const clientDate = body.clientDate || body.date;

    if (!employeeId || !rawAction) {
      return NextResponse.json(
        { success: false, error: 'Employee ID and action (IN/OUT) required' },
        { status: 400 }
      );
    }

    const action: 'IN' | 'OUT' = rawAction === 'PUNCH_IN' || rawAction === 'IN' ? 'IN' : 'OUT';

    const [supaRecords, supaEmployees, supaShifts] = await Promise.all([
      SupabaseStore.getAttendance(tenant.id),
      SupabaseStore.getEmployees(tenant.id),
      SupabaseStore.getShifts(tenant.id)
    ]);
    if (supaEmployees && supaEmployees.length > 0) {
      db.syncEmployees(supaEmployees);
    }
    if (supaRecords && supaRecords.length > 0) {
      db.syncAttendance(supaRecords);
    }
    if (supaShifts && supaShifts.length > 0) {
      db.syncShifts(supaShifts);
    }

    const emp = db.getEmployeeById(tenant.id, employeeId);
    if (!emp) {
      return NextResponse.json(
        { success: false, error: 'Employee not found for attendance punch' },
        { status: 404 }
      );
    }

    const today = clientDate || formatDateInTimezone(new Date(), timezone);
    db.clearExcludedAttendanceKey(tenant.id, employeeId, today);

    const record = db.recordPunch(
      tenant.id,
      employeeId,
      action,
      notes,
      clientTime,
      clientDate,
      timezone
    );
    await SupabaseStore.saveAttendance(record);
    SupabaseStore.invalidate(tenant.id);
    SupabaseStore.invalidate(tenantSlug);

    const loggedDisplayTime =
      action === 'IN' ? record.clockInTime : record.clockOutTime || record.clockInTime;

    return NextResponse.json(
      {
        success: true,
        message: `Clock ${action === 'IN' ? 'In' : 'Out'} logged at ${loggedDisplayTime} (${record.status})`,
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

export async function PUT(
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
    const {
      recordId,
      employeeId,
      date,
      clockInTime,
      clockOutTime,
      workingHours,
      status,
      notes,
      shiftName
    } = body;

    if (!employeeId || !date) {
      return NextResponse.json(
        { success: false, error: 'Employee ID and date are required' },
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

    const employeeName =
      body.employeeName || (emp ? `${emp.firstName} ${emp.lastName}`.trim() : 'Employee');

    // Resolve shift policy
    const shifts = (await SupabaseStore.getShifts(tenant.id)) || db.getShifts(tenant.id);
    const assignedShift =
      shifts.find((s) => s.name === (shiftName || emp?.shiftName) || s.isDefault) || shifts[0];

    const policy = assignedShift
      ? {
          startTime: assignedShift.startTime || '09:00',
          endTime: assignedShift.endTime || '18:00',
          graceMinutes: assignedShift.graceMinutes ?? 15,
          fullDayMinHours: 7.5,
          halfDayMinHours: 4.0
        }
      : DEFAULT_SHIFT_POLICY;

    const formattedClockIn = clockInTime ? formatTimeTo12Hour(clockInTime) : null;
    const formattedClockOut = clockOutTime ? formatTimeTo12Hour(clockOutTime) : null;

    let computedStatus = status;
    let computedHours = workingHours;

    if (!status || status === 'PRESENT' || status === 'LATE_ENTRY' || status === 'HALF_DAY') {
      if (formattedClockIn) {
        const evalRes = evaluateAttendanceStatus(formattedClockIn, formattedClockOut, policy);
        if (!status) computedStatus = evalRes.status;
        if (computedHours === undefined || computedHours === null) computedHours = evalRes.workingHours;
      }
    }

    const effectiveRecordId =
      recordId &&
      !recordId.startsWith('absent-') &&
      !recordId.startsWith('leave-') &&
      !recordId.startsWith('off-')
        ? recordId
        : `att-${Date.now()}`;

    const updatedRecord = db.updateAttendanceRecord(tenant.id, effectiveRecordId, {
      id: effectiveRecordId,
      tenantId: tenant.id,
      employeeId,
      employeeName,
      date,
      clockInTime: formattedClockIn || undefined,
      clockOutTime: formattedClockOut || undefined,
      workingHours: Number(computedHours) || 0,
      status: computedStatus || 'PRESENT',
      notes: notes || 'Updated by Super Admin',
      shiftName: assignedShift?.name || shiftName || 'General Day Shift'
    });

    await SupabaseStore.saveAttendance(updatedRecord);

    SupabaseStore.invalidate(tenant.id);
    SupabaseStore.invalidate(tenantSlug);
    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    return NextResponse.json(
      {
        success: true,
        message: `Attendance for ${employeeName} updated successfully`,
        data: updatedRecord
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating attendance record';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
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

    let recordId: string | null = null;
    let employeeId: string | null = null;
    let date: string | null = null;
    let deleteAllForDate: string | null = null;

    const url = new URL(req.url);
    recordId = url.searchParams.get('recordId') || url.searchParams.get('id');
    employeeId = url.searchParams.get('employeeId');
    date = url.searchParams.get('date');
    deleteAllForDate = url.searchParams.get('deleteAllForDate');

    let items: { recordId?: string; employeeId?: string; date?: string }[] = [];

    if (req.headers.get('content-type')?.includes('application/json')) {
      const body = await req.json().catch(() => ({}));
      recordId = body.recordId || body.id || recordId;
      employeeId = body.employeeId || employeeId;
      date = body.date || date;
      deleteAllForDate = body.deleteAllForDate || deleteAllForDate;

      if (Array.isArray(body.items)) {
        items = body.items;
      } else if (Array.isArray(body.recordIds)) {
        items = body.recordIds.map((id: string) => ({ recordId: id, date: date || undefined }));
      }
    }

    // Handle Bulk Deletion
    if (items.length > 0 || deleteAllForDate) {
      db.deleteAttendanceRecords(tenant.id, items, deleteAllForDate || undefined);
      await SupabaseStore.deleteAttendanceRecords(tenant.id, items, deleteAllForDate || undefined);

      SupabaseStore.invalidate(tenant.id);
      SupabaseStore.invalidate(tenantSlug);
      db.invalidateCache(tenant.id);
      db.invalidateCache(tenantSlug);

      return NextResponse.json(
        {
          success: true,
          message: deleteAllForDate
            ? `All attendance records for ${deleteAllForDate} deleted and reset to Unpunched successfully`
            : `${items.length} attendance record(s) deleted and reset to Unpunched successfully`,
          count: items.length
        },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
      );
    }

    // Handle Single Record Deletion
    if (!recordId && (!employeeId || !date)) {
      return NextResponse.json(
        { success: false, error: 'Record ID or (Employee ID + Date) required to delete' },
        { status: 400 }
      );
    }

    db.deleteAttendanceRecord(
      tenant.id,
      recordId || '',
      employeeId || undefined,
      date || undefined
    );
    await SupabaseStore.deleteAttendance(
      tenant.id,
      recordId || '',
      employeeId || undefined,
      date || undefined
    );

    SupabaseStore.invalidate(tenant.id);
    SupabaseStore.invalidate(tenantSlug);
    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    return NextResponse.json(
      { success: true, message: 'Attendance record deleted and reset to Unpunched successfully' },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting attendance record';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
