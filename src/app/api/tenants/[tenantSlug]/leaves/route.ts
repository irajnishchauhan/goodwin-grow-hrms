import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { SupabaseStore } from '@/lib/db/supabaseStore';
import { Employee, LeaveType } from '@/lib/types';

export async function GET(
  _req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    let tenant = db.getTenantBySlug(tenantSlug);
    if (!tenant) {
      tenant = await SupabaseStore.getTenantBySlug(tenantSlug);
    }
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    let leaveTypes = await SupabaseStore.getLeaveTypes(tenant.id);
    if (!leaveTypes || leaveTypes.length === 0) {
      leaveTypes = db.getLeaveTypes(tenant.id);
    }
    if (!leaveTypes || leaveTypes.length === 0) {
      const defaultTypes = [
        {
          id: `lt-${tenant.id}-cl`,
          tenantId: tenant.id,
          name: 'Casual Leave (CL)',
          code: 'CL',
          daysPerYear: 12,
          color: '#3B82F6',
          isPaid: true
        },
        {
          id: `lt-${tenant.id}-sl`,
          tenantId: tenant.id,
          name: 'Sick / Medical Leave (SL)',
          code: 'SL',
          daysPerYear: 10,
          color: '#EF4444',
          isPaid: true
        },
        {
          id: `lt-${tenant.id}-pl`,
          tenantId: tenant.id,
          name: 'Privilege Leave (PL)',
          code: 'PL',
          daysPerYear: 18,
          color: '#10B981',
          isPaid: true
        }
      ];

      for (const lt of defaultTypes) {
        try {
          db.createLeaveType(tenant.id, {
            name: lt.name,
            code: lt.code,
            daysPerYear: lt.daysPerYear,
            color: lt.color,
            isPaid: lt.isPaid
          });
          await SupabaseStore.saveLeaveType(lt);
        } catch {
          // ignore duplicate in memory
        }
      }
      leaveTypes = defaultTypes;
    }

    let applications = await SupabaseStore.getLeaveApplications(tenant.id);
    if (!applications || applications.length === 0) {
      applications = db.getLeaveApplications(tenant.id);
    }

    return NextResponse.json({
      success: true,
      data: {
        leaveTypes,
        applications,
        pendingCount: applications.filter((a) => a.status === 'PENDING').length,
        approvedCount: applications.filter((a) => a.status === 'APPROVED').length
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching leave data';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    let tenant = db.getTenantBySlug(tenantSlug);
    if (!tenant) {
      tenant = await SupabaseStore.getTenantBySlug(tenantSlug);
      if (tenant) db.upsertTenant(tenant);
    }
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { employeeId, leaveTypeId, startDate, endDate, totalDays, reason } = body;

    if (!employeeId || !leaveTypeId || !startDate || !endDate || !reason) {
      return NextResponse.json({ success: false, error: 'Missing required leave fields' }, { status: 400 });
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

    // Ensure leave types are seeded in memory if needed
    let leaveType = db.getLeaveTypes(tenant.id).find((lt) => lt.id === leaveTypeId);
    if (!leaveType) {
      const supaTypes = await SupabaseStore.getLeaveTypes(tenant.id);
      const match = supaTypes?.find((lt) => lt.id === leaveTypeId);
      if (match) {
        db.createLeaveType(tenant.id, match);
      }
    }

    const newApp = db.createLeaveApplication(tenant.id, {
      employeeId,
      leaveTypeId,
      startDate,
      endDate,
      totalDays: Number(totalDays) || 1,
      reason
    });

    await SupabaseStore.saveLeaveApplication(newApp);

    return NextResponse.json({
      success: true,
      message: 'Leave application submitted successfully for HR approval',
      data: newApp
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error submitting leave';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    let tenant = db.getTenantBySlug(tenantSlug);
    if (!tenant) {
      tenant = await SupabaseStore.getTenantBySlug(tenantSlug);
      if (tenant) db.upsertTenant(tenant);
    }
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { leaveId, status, reviewedBy, comment } = body;

    if (!leaveId || !status) {
      return NextResponse.json({ success: false, error: 'Leave ID and new status required' }, { status: 400 });
    }

    const updated = db.updateLeaveStatus(tenant.id, leaveId, status, reviewedBy || 'HR Admin', comment);
    if (updated) {
      await SupabaseStore.saveLeaveApplication(updated);
    }

    return NextResponse.json({
      success: true,
      message: `Leave status updated to ${status}`,
      data: updated
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating leave';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
