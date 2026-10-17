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

    const [supaRegs] = await Promise.all([
      SupabaseStore.getRegularizations(tenant.id)
    ]);
    if (supaRegs && supaRegs.length > 0) {
      db.syncRegularizations(supaRegs);
    }

    const regularizations = supaRegs !== null ? supaRegs : db.getRegularizations(tenant.id);

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
      const {
        employeeId,
        attendanceDate,
        requestedClockIn,
        requestedClockOut,
        reason,
        managerId,
        managerName,
        employeeName
      } = body;

      const reg = db.createRegularization(tenant.id, {
        employeeId,
        attendanceDate,
        requestedClockIn,
        requestedClockOut,
        reason,
        managerId,
        managerName,
        employeeName
      });
      await SupabaseStore.saveRegularization(reg);

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
    const { regularizationId, status, reviewedBy, comment } = body;
    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    const supaRegs = await SupabaseStore.getRegularizations(tenant.id);
    if (supaRegs && supaRegs.length > 0) {
      db.syncRegularizations(supaRegs);
    }

    const updated = db.updateRegularizationStatus(
      tenant.id,
      regularizationId,
      status,
      reviewedBy || 'Manager',
      comment
    );
    await SupabaseStore.saveRegularization(updated);

    if (status === 'APPROVED') {
      const att = db.getAttendance(tenant.id, updated.attendanceDate).find((a) => a.employeeId === updated.employeeId);
      if (att) {
        await SupabaseStore.saveAttendance(att);
      }
    }

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

export async function DELETE(
  req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant = (await SupabaseStore.getTenantBySlug(tenantSlug)) || (await db.getResolvedTenant(tenantSlug, true));
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const shiftId = searchParams.get('shiftId') || searchParams.get('id') || body.shiftId;
    const shiftName = searchParams.get('shiftName') || searchParams.get('name') || body.shiftName;

    if (!shiftId && !shiftName) {
      return NextResponse.json({ success: false, error: 'Shift ID or Name required' }, { status: 400 });
    }

    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    if (shiftId) db.deleteShift(tenant.id, shiftId);
    if (shiftName) db.deleteShift(tenant.id, shiftName);
    await SupabaseStore.deleteShift(tenant.id, shiftId || '', shiftName || undefined);

    return NextResponse.json(
      { success: true, message: 'Shift deleted successfully' },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting shift';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
