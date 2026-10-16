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
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    let invitations = await SupabaseStore.getInvitations(tenant.id);
    if (!invitations || invitations.length === 0) {
      invitations = db.getInvitations(tenant.id);
    }

    let employees = await SupabaseStore.getEmployees(tenant.id);
    if (!employees || employees.length === 0) {
      employees = db.getEmployees(tenant.id);
    }

    const activatedCount = employees.filter((e) => e.loginStatus === 'ACCEPTED').length;
    const pendingCount = employees.filter((e) => e.loginStatus === 'PENDING').length;
    const notInvitedCount = employees.filter((e) => e.loginStatus === 'NOT_INVITED' || !e.loginStatus).length;

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
    const tenant = db.getTenantBySlug(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { employeeId, role } = body;

    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'Employee ID is required' }, { status: 400 });
    }

    const invitation = db.sendInvitation(tenant.id, employeeId, role || 'EMPLOYEE');
    await SupabaseStore.saveInvitation(invitation);

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
    const tenant = db.getTenantBySlug(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { invitationId, action } = body;

    if (action === 'RESEND') {
      const inv = db.resendInvitation(tenant.id, invitationId);
      if (inv) {
        await SupabaseStore.saveInvitation(inv);
      }
      return NextResponse.json({ success: true, message: 'Invitation resent successfully', data: inv });
    } else if (action === 'REVOKE') {
      db.revokeInvitation(tenant.id, invitationId);
      return NextResponse.json({ success: true, message: 'Invitation revoked successfully' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error modifying invitation';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
