import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export async function GET(
  _req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant = db.getTenantBySlug(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const leaveTypes = db.getLeaveTypes(tenant.id);
    const applications = db.getLeaveApplications(tenant.id);

    return NextResponse.json({
      success: true,
      data: {
        leaveTypes,
        applications,
        pendingCount: applications.filter((a) => a.status === 'PENDING').length,
        approvedCount: applications.filter((a) => a.status === 'APPROVED').length
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching leave data';
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
    const { employeeId, leaveTypeId, startDate, endDate, totalDays, reason } = body;

    if (!employeeId || !leaveTypeId || !startDate || !endDate || !reason) {
      return NextResponse.json({ success: false, error: 'Missing required leave fields' }, { status: 400 });
    }

    const newApp = db.createLeaveApplication(tenant.id, {
      employeeId,
      leaveTypeId,
      startDate,
      endDate,
      totalDays: Number(totalDays) || 1,
      reason
    });

    return NextResponse.json({
      success: true,
      message: 'Leave application submitted successfully for HR approval',
      data: newApp
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error submitting leave';
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
    const { leaveId, status, reviewedBy, comment } = body;

    if (!leaveId || !status) {
      return NextResponse.json({ success: false, error: 'Leave ID and new status required' }, { status: 400 });
    }

    const updated = db.updateLeaveStatus(tenant.id, leaveId, status, reviewedBy || 'HR Admin', comment);
    return NextResponse.json({
      success: true,
      message: `Leave status updated to ${status}`,
      data: updated
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating leave';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
