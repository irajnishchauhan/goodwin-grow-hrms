import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { SupabaseStore } from '@/lib/db/supabaseStore';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant = await SupabaseStore.getTenantBySlug(tenantSlug) || await db.getResolvedTenant(tenantSlug, true);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant workspace not found' }, { status: 404 });
    }

    // Direct fetch from Supabase PostgreSQL
    const [employeesRes, departmentsRes, invitationsRes, membershipsRes, shiftsRes] = await Promise.all([
      SupabaseStore.getEmployees(tenant.id),
      SupabaseStore.getDepartments(tenant.id),
      SupabaseStore.getInvitations(tenant.id),
      SupabaseStore.getTenantMemberships(tenant.id),
      SupabaseStore.getShifts(tenant.id)
    ]);

    let employees = employeesRes !== null ? employeesRes : db.getEmployees(tenant.id);
    let invitations = invitationsRes !== null ? invitationsRes : db.getInvitations(tenant.id);
    let shifts = shiftsRes !== null ? shiftsRes : db.getShifts(tenant.id);

    const acceptedInvEmpIds = new Set(
      invitations.filter((i) => i.status === 'ACCEPTED').map((i) => i.employeeId)
    );
    const pendingInvEmpIds = new Set(
      invitations.filter((i) => i.status === 'PENDING').map((i) => i.employeeId)
    );
    const activeMemberEmails = new Set(
      (membershipsRes || []).filter((m) => m.status === 'ACTIVE' && m.email).map((m) => m.email!.toLowerCase())
    );

    // Sync effective login status
    employees.forEach((emp) => {
      const emailLower = (emp.workEmail || '').toLowerCase();
      const isOwnerOrActive =
        emailLower === (tenant.businessEmail?.toLowerCase() || '') ||
        emailLower === 'rajnish.chauhan@goodwinbatteries.com' ||
        emailLower === 'rajnish.goodwinbatteries@gmail.com' ||
        activeMemberEmails.has(emailLower) ||
        acceptedInvEmpIds.has(emp.id) ||
        emp.loginStatus === 'ACCEPTED';

      if (isOwnerOrActive) {
        emp.loginStatus = 'ACCEPTED';
      } else if (pendingInvEmpIds.has(emp.id)) {
        emp.loginStatus = 'PENDING';
      }
    });

    if (employeesRes && employeesRes.length > 0) {
      db.syncEmployees(employees);
    }

    let departments = departmentsRes !== null ? departmentsRes : db.getDepartments(tenant.id);

    const payload = {
      tenant,
      employees,
      departments,
      shifts,
      totalCount: employees.length,
      capacity: tenant.maxEmployees
    };

    return NextResponse.json(
      { success: true, data: payload },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching employees';
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
      return NextResponse.json({ success: false, error: 'Tenant workspace not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      workEmail,
      personalEmail,
      phone,
      gender,
      departmentId,
      designationTitle,
      employmentType,
      monthlySalary,
      panOrTaxId,
      bankAccountNumber,
      bankName,
      ifscCode,
      uan,
      aadhaarNumber,
      taxRegime,
      workLocation,
      shiftName,
      joiningDate
    } = body;

    if (!firstName || !lastName || !workEmail || !departmentId || !designationTitle || !monthlySalary) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, work email, department, designation, and salary are required.' },
        { status: 400 }
      );
    }

    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    // Hydrate from Supabase before creating so employeeCode sequence doesn't collide on cold start
    const [existingEmps, existingDepts] = await Promise.all([
      SupabaseStore.getEmployees(tenant.id),
      SupabaseStore.getDepartments(tenant.id)
    ]);
    if (existingEmps && existingEmps.length > 0) {
      db.syncEmployees(existingEmps);
    }

    const newEmp = db.createEmployee(tenant.id, {
      firstName,
      lastName,
      workEmail,
      personalEmail,
      phone: phone || '+91 80 4912 8800',
      gender: gender || 'OTHER',
      departmentId,
      designationTitle,
      employmentType: employmentType || 'FULL_TIME',
      monthlySalary: Number(monthlySalary),
      panOrTaxId,
      bankAccountNumber,
      bankName,
      ifscCode,
      uan,
      aadhaarNumber,
      taxRegime: taxRegime || 'NEW',
      workLocation: workLocation || `${tenant.city} Facility`,
      shiftName: shiftName || 'General Day Shift',
      joiningDate: joiningDate || new Date().toISOString().split('T')[0]
    });

    if (!newEmp.departmentName && existingDepts) {
      const deptMatch = existingDepts.find((d) => d.id === departmentId);
      if (deptMatch) newEmp.departmentName = deptMatch.name;
    }

    // Save to Supabase PostgreSQL and invalidate cache so Payroll & Directory see the new employee immediately
    await SupabaseStore.saveEmployee(newEmp);
    SupabaseStore.invalidate(tenant.id);
    SupabaseStore.invalidate(tenantSlug);

    return NextResponse.json(
      {
        success: true,
        message: `Employee ${newEmp.firstName} ${newEmp.lastName} added successfully to ${tenant.name}.`,
        data: newEmp
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error adding employee';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
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
    let employeeId = searchParams.get('id');

    if (!employeeId) {
      try {
        const body = await req.json();
        employeeId = body.employeeId || body.id;
      } catch {
        // Body might be empty
      }
    }

    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'Employee ID is required' }, { status: 400 });
    }

    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);
    const deletedInMemory = db.deleteEmployee(tenant.id, employeeId);
    const deletedInSupa = await SupabaseStore.deleteEmployee(tenant.id, employeeId);
    SupabaseStore.invalidate(tenant.id);
    SupabaseStore.invalidate(tenantSlug);

    if (!deletedInMemory && !deletedInSupa) {
      return NextResponse.json({ success: false, error: 'Employee not found in this tenant workspace' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: 'Employee permanently removed from tenant workspace' },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting employee';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
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
      return NextResponse.json({ success: false, error: 'Tenant workspace not found' }, { status: 404 });
    }

    const body = await req.json();
    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    // Batch update mode (e.g. from the Organization Hierarchy Assigner)
    if (body.updates && Array.isArray(body.updates)) {
      await Promise.all(
        body.updates.map(async (item: any) => {
          if (!item.id) return;
          const patch = {
            reportingManagerId: item.reportingManagerId ?? null,
            reportingManagerName: item.reportingManagerName ?? 'Executive Management'
          };
          db.updateEmployee(tenant.id, item.id, patch);
          await SupabaseStore.updateEmployee(tenant.id, item.id, patch);
        })
      );

      if (body.rootLeaderId !== undefined) {
        tenant.orgTreeRootId = body.rootLeaderId;
        db.upsertTenant(tenant);
        await SupabaseStore.saveTenant(tenant);
      }

      db.invalidateCache(tenant.id);
      db.invalidateCache(tenantSlug);

      const refreshedEmployees = (await SupabaseStore.getEmployees(tenant.id)) || db.getEmployees(tenant.id);
      if (refreshedEmployees) {
        db.syncEmployees(refreshedEmployees);
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Organization hierarchy updated successfully',
          data: {
            employees: refreshedEmployees,
            orgTreeRootId: tenant.orgTreeRootId
          }
        },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
      );
    }

    // Single employee update mode
    const { employeeId, ...updates } = body;
    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'Employee ID is required' }, { status: 400 });
    }

    // Auto-revoke login and security credentials upon offboarding
    if (updates.status === 'EXITED' || updates.status === 'ARCHIVED') {
      updates.loginStatus = 'REVOKED';
      try {
        const invitations = (await SupabaseStore.getInvitations(tenant.id)) || db.getInvitations(tenant.id);
        const empInv = invitations.find(
          (i) => i.employeeId === employeeId || (updates.workEmail && i.email.toLowerCase() === updates.workEmail.toLowerCase())
        );
        if (empInv && empInv.status !== 'REVOKED') {
          db.revokeInvitation(tenant.id, empInv.id);
          await SupabaseStore.saveInvitation({ ...empInv, status: 'REVOKED' });
        }
      } catch (e) {
        console.warn('Could not revoke active invitations for offboarded employee:', e);
      }
    }

    // If departmentId is provided and departmentName not given, resolve it
    if (updates.departmentId && !updates.departmentName) {
      const depts = (await SupabaseStore.getDepartments(tenant.id)) || db.getDepartments(tenant.id);
      const match = depts.find((d) => d.id === updates.departmentId);
      if (match) {
        updates.departmentName = match.name;
      }
    }

    // Hydrate from Supabase before updating so in-memory store has full employee record on cold start
    const supaEmployees = await SupabaseStore.getEmployees(tenant.id);
    if (supaEmployees && supaEmployees.length > 0) {
      db.syncEmployees(supaEmployees);
    }

    const supaUpdated = await SupabaseStore.updateEmployee(tenant.id, employeeId, updates);
    if (SupabaseStore.isConnected() && !supaUpdated) {
      return NextResponse.json(
        { success: false, error: 'Failed to persist employee update to database' },
        { status: 500 }
      );
    }
    const updatedEmp = db.updateEmployee(tenant.id, employeeId, updates);
    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);
    SupabaseStore.invalidate(tenant.id);
    SupabaseStore.invalidate(tenantSlug);

    // Sync pending current-month payroll slip when employee salary, tax regime, bank, or status changes
    const payrollRelevantFields = [
      'monthlySalary', 'taxRegime', 'status', 'firstName', 'lastName',
      'departmentId', 'departmentName', 'designationTitle',
      'bankName', 'bankAccountNumber', 'ifscCode', 'panOrTaxId', 'uan', 'workLocation'
    ];
    if (payrollRelevantFields.some((f) => updates[f] !== undefined)) {
      try {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const [supaAtt, supaLeaves, supaHolidays, supaSlips] = await Promise.all([
          SupabaseStore.getAttendance(tenant.id),
          SupabaseStore.getLeaveApplications(tenant.id),
          SupabaseStore.getHolidays(tenant.id),
          SupabaseStore.getSalarySlips(tenant.id)
        ]);
        if (supaAtt !== null) db.setAttendanceForTenant(tenant.id, supaAtt);
        if (supaLeaves && supaLeaves.length > 0) db.syncLeaveApplications(supaLeaves);
        if (supaHolidays && supaHolidays.length > 0) db.syncHolidays(supaHolidays);
        if (supaSlips && supaSlips.length > 0) db.syncSalarySlips(supaSlips);

        const refreshedSlips = db.generatePayrollRun(tenant.id, currentMonth);
        const empSlip = refreshedSlips.find((s) => s.employeeId === employeeId && s.paymentStatus !== 'PAID');
        if (empSlip) {
          await SupabaseStore.saveSalarySlip(empSlip);
        }
      } catch (syncErr) {
        console.warn('Non-blocking payroll sync after employee update:', syncErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Employee updated successfully',
        data: updatedEmp
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating employee';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
