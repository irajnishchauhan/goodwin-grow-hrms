import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export async function GET(
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
    const date = searchParams.get('date') || undefined;

    const records = db.getAttendance(tenant.id, date);
    const employees = db.getEmployees(tenant.id);

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
    const tenant = db.getTenantBySlug(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { employeeId, action, notes } = body;

    if (!employeeId || !action) {
      return NextResponse.json({ success: false, error: 'Employee ID and action (IN/OUT) required' }, { status: 400 });
    }

    const record = db.recordPunch(tenant.id, employeeId, action, notes);
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
