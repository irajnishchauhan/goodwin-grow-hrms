import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { SupabaseStore } from '@/lib/db/supabaseStore';
import { Employee } from '@/lib/types';

export async function GET(
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
    const date = searchParams.get('date') || undefined;

    const [supaRecords, supaEmployees] = await Promise.all([
      SupabaseStore.getAttendance(tenant.id),
      SupabaseStore.getEmployees(tenant.id)
    ]);

    let records = supaRecords && supaRecords.length > 0 ? supaRecords : db.getAttendance(tenant.id, date);
    if (supaRecords && date) {
      records = records.filter((r) => r.date === date);
    }

    let employees = supaEmployees && supaEmployees.length > 0 ? supaEmployees : db.getEmployees(tenant.id);

    return NextResponse.json({
      success: true,
      data: {
        records,
        presentCount: records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE_ENTRY').length,
        totalEmployees: employees.length
      }
    });
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
    const tenant = await db.getResolvedTenant(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { employeeId, action, notes } = body;

    if (!employeeId || !action) {
      return NextResponse.json({ success: false, error: 'Employee ID and action (IN/OUT) required' }, { status: 400 });
    }

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

    return NextResponse.json({
      success: true,
      message: `Punch ${action === 'IN' ? 'In' : 'Out'} logged at ${new Date().toLocaleTimeString()}`,
      data: record
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error recording punch';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
