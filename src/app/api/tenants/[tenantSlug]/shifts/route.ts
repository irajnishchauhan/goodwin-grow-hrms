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

    const cacheKey = `shifts_${tenant.id}`;
    const cached = db.getCached<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    let [shifts, holidays] = await Promise.all([
      SupabaseStore.getShifts(tenant.id),
      SupabaseStore.getHolidays(tenant.id)
    ]);
    if (!shifts || shifts.length === 0) {
      shifts = db.getShifts(tenant.id);
    }
    if (!holidays || holidays.length === 0) {
      holidays = db.getHolidays(tenant.id);
    }

    const regularizations = db.getRegularizations(tenant.id);

    const payload = {
      shifts,
      holidays,
      regularizations
    };

    db.setCached(cacheKey, payload, 30000);

    return NextResponse.json({
      success: true,
      data: payload
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
    const tenant = await db.getResolvedTenant(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { type } = body;
    db.invalidateCache(tenant.id);

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
      await SupabaseStore.saveShift(shift);
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
    const tenant = await db.getResolvedTenant(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { regularizationId, status, reviewedBy } = body;
    db.invalidateCache(tenant.id);

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
