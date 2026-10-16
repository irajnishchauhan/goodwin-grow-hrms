import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export async function GET(
  _req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant = db.getTenantBySlug(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant workspace not found' }, { status: 404 });
    }

    const employees = db.getEmployees(tenant.id);
    const departments = db.getDepartments(tenant.id);

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
    const tenant = db.getTenantBySlug(tenantSlug);
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
    const tenant = db.getTenantBySlug(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('id');

    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'Employee ID is required' }, { status: 400 });
    }

    const deleted = db.deleteEmployee(tenant.id, employeeId);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Employee not found in this tenant workspace' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Employee removed successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting employee';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
