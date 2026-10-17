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
    const [employeesRes, departmentsRes, invitationsRes, membershipsRes] = await Promise.all([
      SupabaseStore.getEmployees(tenant.id),
      SupabaseStore.getDepartments(tenant.id),
      SupabaseStore.getInvitations(tenant.id),
      SupabaseStore.getTenantMemberships(tenant.id)
    ]);

    let employees = employeesRes !== null ? employeesRes : db.getEmployees(tenant.id);
    let invitations = invitationsRes !== null ? invitationsRes : db.getInvitations(tenant.id);

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
        emailLower.includes('rajnish') ||
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
    const { firstName, lastName, workEmail, phone, gender, departmentId, designationTitle, monthlySalary, panOrTaxId, bankAccountNumber, bankName } = body;

    if (!firstName || !lastName || !workEmail || !departmentId || !designationTitle || !monthlySalary) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, work email, department, designation, and salary are required.' },
        { status: 400 }
      );
    }

    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    const newEmp = db.createEmployee(tenant.id, {
      firstName,
      lastName,
      workEmail,
      phone: phone || '+1 555-0000',
      gender: gender || 'OTHER',
      departmentId,
      designationTitle,
      monthlySalary: Number(monthlySalary),
      panOrTaxId,
      bankAccountNumber,
      bankName
    });

    // Save to Supabase PostgreSQL asynchronously
    await SupabaseStore.saveEmployee(newEmp);

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
    const employeeId = searchParams.get('id');

    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'Employee ID is required' }, { status: 400 });
    }

    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);
    const deleted = db.deleteEmployee(tenant.id, employeeId);
    await SupabaseStore.deleteEmployee(tenant.id, employeeId);

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Employee not found in this tenant workspace' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: 'Employee removed successfully' },
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

    await SupabaseStore.updateEmployee(tenant.id, employeeId, updates);
    const updatedEmp = db.updateEmployee(tenant.id, employeeId, updates);
    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

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
