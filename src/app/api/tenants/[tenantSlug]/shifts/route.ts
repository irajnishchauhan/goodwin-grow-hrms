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

    let [shifts, holidays] = await Promise.all([
      SupabaseStore.getShifts(tenant.id),
      SupabaseStore.getHolidays(tenant.id)
    ]);
    if (shifts === null) {
      shifts = db.getShifts(tenant.id);
    }
    if (holidays === null) {
      holidays = db.getHolidays(tenant.id);
    }

    const regularizations = db.getRegularizations(tenant.id);

    const payload = {
      shifts,
      holidays,
      regularizations
    };

    return NextResponse.json(
      { success: true, data: payload },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
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
    const tenant = await SupabaseStore.getTenantBySlug(tenantSlug) || await db.getResolvedTenant(tenantSlug, true);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { type } = body;
    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    if (type === 'REGULARIZATION') {
      const { employeeId, attendanceDate, requestedClockIn, requestedClockOut, reason } = body;
      const reg = db.createRegularization(tenant.id, {
        employeeId,
        attendanceDate,
        requestedClockIn,
        requestedClockOut,
        reason
      });
      return NextResponse.json(
        { success: true, data: reg, message: 'Regularization request submitted' },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
      );
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
      return NextResponse.json(
        { success: true, data: shift, message: 'New shift policy created' },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
      );
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
    const tenant = await SupabaseStore.getTenantBySlug(tenantSlug) || await db.getResolvedTenant(tenantSlug, true);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { regularizationId, status, reviewedBy } = body;
    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    const updated = db.updateRegularizationStatus(tenant.id, regularizationId, status, reviewedBy || 'Manager');
    return NextResponse.json(
      {
        success: true,
        data: updated,
        message: `Regularization request ${status}`
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating regularization';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
