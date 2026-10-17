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

    // Direct parallel fetching from Supabase PostgreSQL
    const [departmentsRes, designationsRes, shiftsRes, leaveTypesRes, employeesRes] = await Promise.all([
      SupabaseStore.getDepartments(tenant.id),
      SupabaseStore.getDesignations(tenant.id),
      SupabaseStore.getShifts(tenant.id),
      SupabaseStore.getLeaveTypes(tenant.id),
      SupabaseStore.getEmployees(tenant.id)
    ]);

    if (shiftsRes && shiftsRes.length > 0) {
      db.syncShifts(shiftsRes);
    }

    const departments = departmentsRes !== null ? departmentsRes : db.getDepartments(tenant.id);
    const designations = designationsRes !== null ? designationsRes : db.getDesignations(tenant.id);
    const shifts = shiftsRes !== null ? shiftsRes : db.getShifts(tenant.id);
    const leaveTypes = leaveTypesRes !== null ? leaveTypesRes : db.getLeaveTypes(tenant.id);
    const employees = employeesRes !== null ? employeesRes : db.getEmployees(tenant.id);

    const payload = {
      tenant,
      departments,
      designations,
      shifts,
      leaveTypes,
      employeeCount: employees.length
    };

    return NextResponse.json(
      { success: true, data: payload },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching tenant configuration';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(
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
    const updatedTenant = { ...tenant, ...body, updatedAt: new Date().toISOString() };
    await SupabaseStore.saveTenant(updatedTenant);
    db.upsertTenant(updatedTenant);
    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    return NextResponse.json(
      {
        success: true,
        message: 'Workspace settings saved successfully to PostgreSQL',
        data: { tenant: updatedTenant }
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update tenant';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
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
    const { action } = body;
    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    const noStoreHeader = { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } };

    switch (action) {
      case 'add-department': {
        const { name, code } = body;
        if (!name) return NextResponse.json({ success: false, error: 'Department name is required' }, { status: 400 });
        const dept = db.addDepartment(tenant.id, name, code);
        await SupabaseStore.saveDepartment(dept);
        return NextResponse.json({ success: true, message: 'Department added', data: dept }, noStoreHeader);
      }

      case 'delete-department': {
        const { departmentId } = body;
        if (!departmentId) return NextResponse.json({ success: false, error: 'Department ID is required' }, { status: 400 });
        db.deleteDepartment(tenant.id, departmentId);
        await SupabaseStore.deleteDepartment(tenant.id, departmentId);
        return NextResponse.json({ success: true, message: 'Department deleted' }, noStoreHeader);
      }

      case 'update-shift': {
        const { shiftId, ...shiftData } = body;
        const shift = db.updateShift(tenant.id, shiftId, shiftData);
        await SupabaseStore.saveShift(shift);
        return NextResponse.json({ success: true, message: 'Shift updated', data: shift }, noStoreHeader);
      }

      case 'add-shift': {
        const { name, startTime, endTime, graceMinutes, isDefault, color } = body;
        const shift = db.createShift(tenant.id, {
          name: name || 'Custom Shift',
          startTime: startTime || '09:00',
          endTime: endTime || '18:00',
          graceMinutes: Number(graceMinutes) || 15,
          isDefault: Boolean(isDefault),
          color: color || '#3B82F6'
        });
        await SupabaseStore.saveShift(shift);
        return NextResponse.json({ success: true, message: 'Shift added', data: shift }, noStoreHeader);
      }

      case 'delete-shift': {
        const { shiftId, shiftName } = body;
        if (!shiftId && !shiftName) return NextResponse.json({ success: false, error: 'Shift ID or Name is required' }, { status: 400 });
        if (shiftId) db.deleteShift(tenant.id, shiftId);
        if (shiftName) db.deleteShift(tenant.id, shiftName);
        await SupabaseStore.deleteShift(tenant.id, shiftId || '', shiftName || undefined);
        return NextResponse.json({ success: true, message: 'Shift deleted' }, noStoreHeader);
      }

      case 'update-leave-type': {
        const { leaveTypeId, ...leaveData } = body;
        const lt = db.updateLeaveType(tenant.id, leaveTypeId, leaveData);
        await SupabaseStore.saveLeaveType(lt);
        return NextResponse.json({ success: true, message: 'Leave policy updated', data: lt }, noStoreHeader);
      }

      case 'add-leave-type': {
        const { name, code, daysPerYear, color, isPaid } = body;
        const lt = db.createLeaveType(tenant.id, {
          name: name || 'Custom Leave',
          code: code || 'LV',
          daysPerYear: Number(daysPerYear) || 10,
          color: color || '#3B82F6',
          isPaid: isPaid ?? true
        });
        await SupabaseStore.saveLeaveType(lt);
        return NextResponse.json({ success: true, message: 'Leave policy created', data: lt }, noStoreHeader);
      }

      case 'delete-leave-type': {
        const { leaveTypeId } = body;
        if (!leaveTypeId) return NextResponse.json({ success: false, error: 'Leave Type ID is required' }, { status: 400 });
        db.deleteLeaveType(tenant.id, leaveTypeId);
        await SupabaseStore.deleteLeaveType(tenant.id, leaveTypeId);
        return NextResponse.json({ success: true, message: 'Leave type deleted' }, noStoreHeader);
      }

      case 'toggle-step': {
        const { stepId, completed } = body;
        const updatedTenant = db.updateOnboardingStep(tenant.id, stepId, completed);
        await SupabaseStore.saveTenant(updatedTenant);
        return NextResponse.json({ success: true, message: 'Step updated', data: { tenant: updatedTenant } }, noStoreHeader);
      }

      case 'clear-workspace': {
        db.clearWorkspaceData(tenant.id);
        await SupabaseStore.clearTenantData(tenant.id);
        const updatedTenant = db.getTenantById(tenant.id) || tenant;
        await SupabaseStore.saveTenant(updatedTenant);
        return NextResponse.json({
          success: true,
          message: `Workspace "${tenant.name}" data completely cleared for fresh setup.`,
          data: { tenant: updatedTenant }
        }, noStoreHeader);
      }

      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Operation failed';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant = await SupabaseStore.getTenantBySlug(tenantSlug) || await db.getResolvedTenant(tenantSlug, true);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant workspace not found' }, { status: 404 });
    }

    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);
    const deleted = db.deleteTenant(tenant.id);
    await SupabaseStore.deleteTenant(tenant.id);

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Failed to delete workspace' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Workspace "${tenant.name}" and all associated data permanently deleted.`
    }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting workspace';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
