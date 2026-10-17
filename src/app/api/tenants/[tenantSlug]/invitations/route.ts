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
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const [invitationsRes, employeesRes] = await Promise.all([
      SupabaseStore.getInvitations(tenant.id),
      SupabaseStore.getEmployees(tenant.id)
    ]);

    let invitations = invitationsRes && invitationsRes.length > 0 ? invitationsRes : db.getInvitations(tenant.id);
    let employees = employeesRes && employeesRes.length > 0 ? employeesRes : db.getEmployees(tenant.id);

    // Reliable stats calculation checking both invitations and employee loginStatus
    const pendingInvEmpIds = new Set(
      invitations.filter((i) => i.status === 'PENDING').map((i) => i.employeeId)
    );
    const acceptedInvEmpIds = new Set(
      invitations.filter((i) => i.status === 'ACCEPTED').map((i) => i.employeeId)
    );

    const activatedCount = employees.filter(
      (e) => e.loginStatus === 'ACCEPTED' || acceptedInvEmpIds.has(e.id)
    ).length;

    const pendingCount = employees.filter(
      (e) => (e.loginStatus === 'PENDING' || pendingInvEmpIds.has(e.id)) && !acceptedInvEmpIds.has(e.id)
    ).length;

    const notInvitedCount = Math.max(0, employees.length - activatedCount - pendingCount);

    return NextResponse.json({
      success: true,
      data: {
        invitations,
        stats: {
          totalEmployees: employees.length,
          activatedCount,
          pendingCount,
          notInvitedCount,
          activationRate: employees.length > 0 ? Math.round((activatedCount / employees.length) * 100) : 0
        }
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching invitations';
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
    const { employeeId, role } = body;

    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'Employee ID is required' }, { status: 400 });
    }

    // Ensure employee is in memory db
    let emp = db.getEmployeeById(tenant.id, employeeId);
    if (!emp) {
      const emps = await SupabaseStore.getEmployees(tenant.id);
      if (emps && emps.length > 0) {
        db.syncEmployees(emps);
        emp = db.getEmployeeById(tenant.id, employeeId);
      }
    }

    const invitation = db.sendInvitation(tenant.id, employeeId, role || 'EMPLOYEE');
    await SupabaseStore.saveInvitation(invitation);
    await SupabaseStore.updateEmployeeLoginStatus(employeeId, 'PENDING');

    return NextResponse.json({
      success: true,
      message: `Invitation generated and dispatched to ${invitation.email}`,
      data: invitation
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error sending invitation';
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
    const { invitationId, action } = body;

    if (action === 'RESEND') {
      const inv = db.resendInvitation(tenant.id, invitationId);
      if (inv) {
        await SupabaseStore.saveInvitation(inv);
        await SupabaseStore.updateEmployeeLoginStatus(inv.employeeId, 'PENDING');
      }
      return NextResponse.json({ success: true, message: 'Invitation resent successfully', data: inv });
    } else if (action === 'REVOKE') {
      const inv = db.getInvitations(tenant.id).find((i) => i.id === invitationId);
      db.revokeInvitation(tenant.id, invitationId);
      if (inv) {
        await SupabaseStore.saveInvitation(inv);
        await SupabaseStore.updateEmployeeLoginStatus(inv.employeeId, 'REVOKED');
      }
      return NextResponse.json({ success: true, message: 'Invitation revoked successfully' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error modifying invitation';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
