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

    const cacheKey = `tenant_overview_${tenant.id}`;
    const cached = db.getCached<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    // High speed parallel fetching from Supabase
    const [departmentsRes, designationsRes, shiftsRes, leaveTypesRes, employeesRes] = await Promise.all([
      SupabaseStore.getDepartments(tenant.id),
      SupabaseStore.getDesignations(tenant.id),
      SupabaseStore.getShifts(tenant.id),
      SupabaseStore.getLeaveTypes(tenant.id),
      SupabaseStore.getEmployees(tenant.id)
    ]);

    const departments = departmentsRes && departmentsRes.length > 0 ? departmentsRes : db.getDepartments(tenant.id);
    const designations = designationsRes && designationsRes.length > 0 ? designationsRes : db.getDesignations(tenant.id);
    const shifts = shiftsRes && shiftsRes.length > 0 ? shiftsRes : db.getShifts(tenant.id);
    const leaveTypes = leaveTypesRes && leaveTypesRes.length > 0 ? leaveTypesRes : db.getLeaveTypes(tenant.id);
    const employees = employeesRes && employeesRes.length > 0 ? employeesRes : db.getEmployees(tenant.id);

    const payload = {
      tenant,
      departments,
      designations,
      shifts,
      leaveTypes,
      employeeCount: employees.length
    };

    db.setCached(cacheKey, payload, 30000);

    return NextResponse.json({
      success: true,
      data: payload
    });
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
    const tenant = await db.getResolvedTenant(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant workspace not found' }, { status: 404 });
    }

    const body = await req.json();
    const updatedTenant = db.updateTenant(tenant.id, body);
    db.invalidateCache(tenant.id);
    await SupabaseStore.saveTenant(updatedTenant);

    return NextResponse.json({
      success: true,
      message: 'Workspace settings saved successfully',
      data: { tenant: updatedTenant }
    });
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
    const tenant = await db.getResolvedTenant(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant workspace not found' }, { status: 404 });
    }

    const body = await req.json();
    const { action } = body;
    db.invalidateCache(tenant.id);

    switch (action) {
      case 'add-department': {
        const { name, code } = body;
        if (!name) return NextResponse.json({ success: false, error: 'Department name is required' }, { status: 400 });
        const dept = db.addDepartment(tenant.id, name, code);
        await SupabaseStore.saveDepartment(dept);
        return NextResponse.json({ success: true, message: 'Department added', data: dept });
      }

      case 'delete-department': {
        const { departmentId } = body;
        if (!departmentId) return NextResponse.json({ success: false, error: 'Department ID is required' }, { status: 400 });
        const success = db.deleteDepartment(tenant.id, departmentId);
        await SupabaseStore.deleteDepartment(tenant.id, departmentId);
        return NextResponse.json({ success, message: success ? 'Department deleted' : 'Department not found' });
      }

      case 'update-shift': {
        const { shiftId, ...shiftData } = body;
        const shift = db.updateShift(tenant.id, shiftId, shiftData);
        await SupabaseStore.saveShift(shift);
        return NextResponse.json({ success: true, message: 'Shift updated', data: shift });
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
        return NextResponse.json({ success: true, message: 'Shift added', data: shift });
      }

      case 'delete-shift': {
        const { shiftId } = body;
        if (!shiftId) return NextResponse.json({ success: false, error: 'Shift ID is required' }, { status: 400 });
        const success = db.deleteShift(tenant.id, shiftId);
        await SupabaseStore.deleteShift(tenant.id, shiftId);
        return NextResponse.json({ success, message: 'Shift deleted' });
      }

      case 'update-leave-type': {
        const { leaveTypeId, ...leaveData } = body;
        const lt = db.updateLeaveType(tenant.id, leaveTypeId, leaveData);
        await SupabaseStore.saveLeaveType(lt);
        return NextResponse.json({ success: true, message: 'Leave policy updated', data: lt });
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
        return NextResponse.json({ success: true, message: 'Leave policy created', data: lt });
      }

      case 'delete-leave-type': {
        const { leaveTypeId } = body;
        if (!leaveTypeId) return NextResponse.json({ success: false, error: 'Leave Type ID is required' }, { status: 400 });
        const success = db.deleteLeaveType(tenant.id, leaveTypeId);
        await SupabaseStore.deleteLeaveType(tenant.id, leaveTypeId);
        return NextResponse.json({ success, message: 'Leave type deleted' });
      }

      case 'toggle-step': {
        const { stepId, completed } = body;
        const updatedTenant = db.updateOnboardingStep(tenant.id, stepId, completed);
        await SupabaseStore.saveTenant(updatedTenant);
        return NextResponse.json({ success: true, message: 'Step updated', data: { tenant: updatedTenant } });
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
        });
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
    const tenant = await db.getResolvedTenant(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant workspace not found' }, { status: 404 });
    }

    const deleted = db.deleteTenant(tenant.id);
    await SupabaseStore.deleteTenant(tenant.id);

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Failed to delete workspace' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Workspace "${tenant.name}" and all associated data permanently deleted.`
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting workspace';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
