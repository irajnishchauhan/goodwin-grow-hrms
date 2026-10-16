import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { SupabaseStore } from '@/lib/db/supabaseStore';

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
      return NextResponse.json({ success: false, error: 'Tenant workspace not found' }, { status: 404 });
    }

    let shifts = await SupabaseStore.getShifts(tenant.id);
    if (!shifts || shifts.length === 0) {
      shifts = db.getShifts(tenant.id);
    }

    let holidays = await SupabaseStore.getHolidays(tenant.id);
    if (!holidays || holidays.length === 0) {
      holidays = db.getHolidays(tenant.id);
    }

    const regularizations = db.getRegularizations(tenant.id);

    return NextResponse.json({
      success: true,
      data: {
        shifts,
        holidays,
        regularizations
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching shift/holiday data';
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
    const { type } = body;

    if (type === 'REGULARIZATION') {
      const { employeeId, attendanceDate, requestedClockIn, requestedClockOut, reason } = body;
      const reg = db.createRegularization(tenant.id, {
        employeeId,
        attendanceDate,
        requestedClockIn,
        requestedClockOut,
        reason
      });
      return NextResponse.json({ success: true, data: reg, message: 'Regularization request submitted' });
    } else {
      // Create Shift
      const { name, startTime, endTime, graceMinutes, color } = body;
      const shift = db.createShift(tenant.id, {
        name,
        startTime,
        endTime,
        graceMinutes: Number(graceMinutes) || 15,
        isDefault: false,
        color: color || '#3B82F6'
      });
      return NextResponse.json({ success: true, data: shift, message: 'New shift policy created' });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error submitting shift item';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function PATCH(
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
    const { regularizationId, status, reviewedBy } = body;

    const updated = db.updateRegularizationStatus(tenant.id, regularizationId, status, reviewedBy || 'Manager');
    return NextResponse.json({
      success: true,
      data: updated,
      message: `Regularization request ${status}`
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating regularization';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
