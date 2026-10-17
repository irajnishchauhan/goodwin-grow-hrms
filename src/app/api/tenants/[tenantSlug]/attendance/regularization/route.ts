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
    const tenant = (await SupabaseStore.getTenantBySlug(tenantSlug)) || (await db.getResolvedTenant(tenantSlug, true));
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const supaRegs = await SupabaseStore.getRegularizations(tenant.id);
    if (supaRegs && supaRegs.length > 0) {
      db.syncRegularizations(supaRegs);
    }

    const regularizations = supaRegs !== null ? supaRegs : db.getRegularizations(tenant.id);

    return NextResponse.json(
      { success: true, data: regularizations },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching regularizations';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant = (await SupabaseStore.getTenantBySlug(tenantSlug)) || (await db.getResolvedTenant(tenantSlug, true));
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
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

    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    if (!employeeId || !attendanceDate) {
      return NextResponse.json(
        { success: false, error: 'Employee ID and attendance date required' },
        { status: 400 }
      );
    }

    // Ensure employee in memory
    let emp = db.getEmployeeById(tenant.id, employeeId);
    if (!emp) {
      const emps = await SupabaseStore.getEmployees(tenant.id);
      if (emps && emps.length > 0) {
        db.syncEmployees(emps);
        emp = db.getEmployeeById(tenant.id, employeeId);
      }
    }

    const reg = db.createRegularization(tenant.id, {
      employeeId,
      attendanceDate,
      requestedClockIn: requestedClockIn || '09:00',
      requestedClockOut: requestedClockOut || '18:00',
      reason: reason || 'Biometric sync correction',
      managerId: managerId || emp?.reportingManagerId,
      managerName: managerName || emp?.reportingManagerName || 'Executive Lead',
      employeeName: employeeName || (emp ? `${emp.firstName} ${emp.lastName}` : undefined)
    });

    await SupabaseStore.saveRegularization(reg);

    return NextResponse.json(
      {
        success: true,
        message: 'Regularization request submitted successfully for manager approval',
        data: reg
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error submitting regularization request';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant = (await SupabaseStore.getTenantBySlug(tenantSlug)) || (await db.getResolvedTenant(tenantSlug, true));
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { regularizationId, status, reviewedBy, comment } = body;
    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    if (!regularizationId || !status) {
      return NextResponse.json(
        { success: false, error: 'Regularization ID and status required' },
        { status: 400 }
      );
    }

    const supaRegs = await SupabaseStore.getRegularizations(tenant.id);
    if (supaRegs && supaRegs.length > 0) {
      db.syncRegularizations(supaRegs);
    }

    const updated = db.updateRegularizationStatus(
      tenant.id,
      regularizationId,
      status,
      reviewedBy || 'Manager Approver',
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
        message: `Regularization request ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully`,
        data: updated
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating regularization status';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
