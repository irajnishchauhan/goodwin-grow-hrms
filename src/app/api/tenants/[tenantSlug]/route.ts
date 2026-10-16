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

    let departments = await SupabaseStore.getDepartments(tenant.id);
    if (!departments || departments.length === 0) {
      departments = db.getDepartments(tenant.id);
    }

    let designations = await SupabaseStore.getDesignations(tenant.id);
    if (!designations || designations.length === 0) {
      designations = db.getDesignations(tenant.id);
    }

    let shifts = await SupabaseStore.getShifts(tenant.id);
    if (!shifts || shifts.length === 0) {
      shifts = db.getShifts(tenant.id);
    }

    let leaveTypes = await SupabaseStore.getLeaveTypes(tenant.id);
    if (!leaveTypes || leaveTypes.length === 0) {
      leaveTypes = db.getLeaveTypes(tenant.id);
    }

    let employees = await SupabaseStore.getEmployees(tenant.id);
    if (!employees || employees.length === 0) {
      employees = db.getEmployees(tenant.id);
    }

    return NextResponse.json({
      success: true,
      data: {
        tenant,
        departments,
        designations,
        shifts,
        leaveTypes,
        employeeCount: employees.length
      }
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
    let tenant = db.getTenantBySlug(tenantSlug);
    if (!tenant) {
      tenant = await SupabaseStore.getTenantBySlug(tenantSlug);
      if (tenant) db.upsertTenant(tenant);
    }
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant workspace not found' }, { status: 404 });
    }

    const body = await req.json();
    const updatedTenant = db.updateTenant(tenant.id, body);
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
    let tenant = db.getTenantBySlug(tenantSlug);
    if (!tenant) {
      tenant = await SupabaseStore.getTenantBySlug(tenantSlug);
      if (tenant) db.upsertTenant(tenant);
    }
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant workspace not found' }, { status: 404 });
    }

    const body = await req.json();
    const { action } = body;

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
        return NextResponse.json({ success, message: success ? 'Department deleted' : 'Department not found' });
      }

      case 'update-shift': {
        const { shiftId, ...shiftData } = body;
        const shift = db.updateShift(tenant.id, shiftId, shiftData);
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
        return NextResponse.json({ success: true, message: 'Shift added', data: shift });
      }

      case 'update-leave-type': {
        const { leaveTypeId, ...leaveData } = body;
        const lt = db.updateLeaveType(tenant.id, leaveTypeId, leaveData);
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
        return NextResponse.json({ success: true, message: 'Leave policy created', data: lt });
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
    let tenant = db.getTenantBySlug(tenantSlug);
    if (!tenant) {
      tenant = await SupabaseStore.getTenantBySlug(tenantSlug);
    }
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
