import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { SupabaseStore } from '@/lib/db/supabaseStore';

export async function GET(
  _req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant = await db.getResolvedTenant(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant workspace not found' }, { status: 404 });
    }

    // High speed parallel fetching from Supabase
    const [employeesRes, departmentsRes] = await Promise.all([
      SupabaseStore.getEmployees(tenant.id),
      SupabaseStore.getDepartments(tenant.id)
    ]);

    let employees = employeesRes && employeesRes.length > 0 ? employeesRes : db.getEmployees(tenant.id);
    if (employeesRes && employeesRes.length > 0) {
      db.syncEmployees(employeesRes);
    }

    let departments = departmentsRes && departmentsRes.length > 0 ? departmentsRes : db.getDepartments(tenant.id);

    return NextResponse.json({
      success: true,
      data: {
        tenant,
        employees,
        departments,
        totalCount: employees.length,
        capacity: tenant.maxEmployees
      }
    });
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
    const tenant = await db.getResolvedTenant(tenantSlug);
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

    return NextResponse.json({
      success: true,
      message: `Employee ${newEmp.firstName} ${newEmp.lastName} added successfully to ${tenant.name}.`,
      data: newEmp
    });
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
    const tenant = await db.getResolvedTenant(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('id');

    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'Employee ID is required' }, { status: 400 });
    }

    const deleted = db.deleteEmployee(tenant.id, employeeId);
    await SupabaseStore.deleteEmployee(tenant.id, employeeId);

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Employee not found in this tenant workspace' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Employee removed successfully' });
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
    const tenant = await db.getResolvedTenant(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant workspace not found' }, { status: 404 });
    }

    const body = await req.json();

    // Batch update mode (e.g. from the Organization Hierarchy Assigner)
    if (body.updates && Array.isArray(body.updates)) {
      for (const item of body.updates) {
        if (!item.id) continue;
        db.updateEmployee(tenant.id, item.id, {
          reportingManagerId: item.reportingManagerId ?? null,
          reportingManagerName: item.reportingManagerName ?? 'Executive Management'
        });
        await SupabaseStore.updateEmployee(tenant.id, item.id, {
          reportingManagerId: item.reportingManagerId ?? null,
          reportingManagerName: item.reportingManagerName ?? 'Executive Management'
        });
      }

      if (body.rootLeaderId !== undefined) {
        tenant.orgTreeRootId = body.rootLeaderId;
        db.upsertTenant(tenant);
      }

      const refreshedEmployees =
        (await SupabaseStore.getEmployees(tenant.id)) || db.getEmployees(tenant.id);

      return NextResponse.json({
        success: true,
        message: 'Organization hierarchy updated successfully',
        data: {
          employees: refreshedEmployees,
          orgTreeRootId: tenant.orgTreeRootId
        }
      });
    }

    // Single employee update mode
    const { employeeId, reportingManagerId, reportingManagerName, designationTitle, departmentId, departmentName } = body;
    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'Employee ID is required' }, { status: 400 });
    }

    const updatedEmp = db.updateEmployee(tenant.id, employeeId, {
      ...(reportingManagerId !== undefined && { reportingManagerId }),
      ...(reportingManagerName !== undefined && { reportingManagerName }),
      ...(designationTitle !== undefined && { designationTitle }),
      ...(departmentId !== undefined && { departmentId }),
      ...(departmentName !== undefined && { departmentName })
    });

    await SupabaseStore.updateEmployee(tenant.id, employeeId, {
      ...(reportingManagerId !== undefined && { reportingManagerId }),
      ...(reportingManagerName !== undefined && { reportingManagerName }),
      ...(designationTitle !== undefined && { designationTitle }),
      ...(departmentId !== undefined && { departmentId }),
      ...(departmentName !== undefined && { departmentName })
    });

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmp
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating employee';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
