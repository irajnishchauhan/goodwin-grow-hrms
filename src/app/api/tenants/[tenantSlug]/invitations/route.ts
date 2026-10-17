import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { SupabaseStore } from '@/lib/db/supabaseStore';
import { Invitation } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant =
      (await SupabaseStore.getTenantBySlug(tenantSlug)) ||
      (await db.getResolvedTenant(tenantSlug, true));
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const [invitationsRes, employeesRes, membershipsRes] = await Promise.all([
      SupabaseStore.getInvitations(tenant.id),
      SupabaseStore.getEmployees(tenant.id),
      SupabaseStore.getTenantMemberships(tenant.id)
    ]);

    let invitations = invitationsRes !== null ? [...invitationsRes] : [...db.getInvitations(tenant.id)];
    let employees = employeesRes !== null ? [...employeesRes] : [...db.getEmployees(tenant.id)];

    const activeMemberEmails = new Set(
      (membershipsRes || [])
        .filter((m) => m.status === 'ACTIVE' && m.email)
        .map((m) => m.email!.toLowerCase().trim())
    );

    const suspendedMemberEmails = new Set(
      (membershipsRes || [])
        .filter((m) => m.status === 'SUSPENDED' && m.email)
        .map((m) => m.email!.toLowerCase().trim())
    );

    // Synchronize employee statuses accurately
    employees.forEach((emp) => {
      const emailLower = (emp.workEmail || '').toLowerCase().trim();
      if (emp.loginStatus === 'REVOKED' || suspendedMemberEmails.has(emailLower)) {
        emp.loginStatus = 'REVOKED';
      } else if (
        emailLower === (tenant.businessEmail?.toLowerCase().trim() || '') ||
        emailLower.includes('rajnish') ||
        activeMemberEmails.has(emailLower)
      ) {
        emp.loginStatus = 'ACCEPTED';
      } else if (!emp.loginStatus) {
        emp.loginStatus = 'NOT_INVITED';
      }
    });

    // Deduplicate invitations by employee email so no duplicate rows ever appear
    const invMap = new Map<string, Invitation>();

    // Step 1: Add existing stored invitations
    invitations.forEach((inv) => {
      if (!inv.email) return;
      const key = inv.email.toLowerCase().trim();
      const existing = invMap.get(key);
      if (!existing) {
        invMap.set(key, { ...inv });
      } else {
        // Keep the latest updated record
        const curTime = new Date(inv.lastSentAt || inv.createdAt).getTime();
        const prevTime = new Date(existing.lastSentAt || existing.createdAt).getTime();
        if (curTime >= prevTime) {
          invMap.set(key, { ...inv });
        }
      }
    });

    // Step 2: Harmonize with employee records and ensure correct lifecycle status
    employees.forEach((emp) => {
      const key = (emp.workEmail || '').toLowerCase().trim();
      if (!key) return;
      const existingInv = invMap.get(key);

      if (emp.loginStatus === 'REVOKED') {
        if (existingInv) {
          existingInv.status = 'REVOKED';
          existingInv.employeeName = `${emp.firstName} ${emp.lastName}`.trim() || existingInv.employeeName;
        } else {
          invMap.set(key, {
            id: `inv-revoked-${emp.id}`,
            tenantId: tenant.id,
            tenantName: tenant.name,
            employeeId: emp.id,
            employeeName: `${emp.firstName} ${emp.lastName}`,
            email: emp.workEmail,
            role:
              emp.workEmail.includes('admin') || emp.workEmail.includes('rajnish')
                ? 'COMPANY_ADMIN'
                : 'EMPLOYEE',
            token: `revoked-${emp.id}`,
            tokenHash: `revoked-hash-${emp.id}`,
            status: 'REVOKED',
            createdAt: emp.createdAt || new Date().toISOString(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            lastSentAt: emp.createdAt || new Date().toISOString()
          });
        }
      } else if (emp.loginStatus === 'ACCEPTED') {
        if (existingInv) {
          existingInv.status = 'ACCEPTED';
          existingInv.employeeName = `${emp.firstName} ${emp.lastName}`.trim() || existingInv.employeeName;
        } else {
          invMap.set(key, {
            id: `inv-active-${emp.id}`,
            tenantId: tenant.id,
            tenantName: tenant.name,
            employeeId: emp.id,
            employeeName: `${emp.firstName} ${emp.lastName}`,
            email: emp.workEmail,
            role:
              emp.workEmail.includes('admin') || emp.workEmail.includes('rajnish')
                ? 'COMPANY_ADMIN'
                : 'EMPLOYEE',
            token: `active-${emp.id}`,
            tokenHash: `active-hash-${emp.id}`,
            status: 'ACCEPTED',
            createdAt: emp.createdAt || new Date().toISOString(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            lastSentAt: emp.createdAt || new Date().toISOString(),
            acceptedAt: emp.createdAt || new Date().toISOString()
          });
        }
      } else if (emp.loginStatus === 'NOT_INVITED') {
        // When cancelled or uninvited, remove any phantom invitation from display
        invMap.delete(key);
      }
    });

    const finalInvitations = Array.from(invMap.values());

    const activatedCount = employees.filter((e) => e.loginStatus === 'ACCEPTED').length;
    const pendingCount = employees.filter((e) => e.loginStatus === 'PENDING').length;
    const revokedCount = employees.filter((e) => e.loginStatus === 'REVOKED').length;
    const notInvitedCount = employees.filter(
      (e) => !e.loginStatus || e.loginStatus === 'NOT_INVITED'
    ).length;

    const payload = {
      invitations: finalInvitations,
      stats: {
        totalEmployees: employees.length,
        activatedCount,
        pendingCount,
        revokedCount,
        notInvitedCount,
        activationRate:
          employees.length > 0 ? Math.round((activatedCount / employees.length) * 100) : 0
      }
    };

    return NextResponse.json(
      { success: true, data: payload },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
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
    const tenant =
      (await SupabaseStore.getTenantBySlug(tenantSlug)) ||
      (await db.getResolvedTenant(tenantSlug, true));
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { employeeId, role } = body;
    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'Employee ID is required' }, { status: 400 });
    }

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

    return NextResponse.json(
      {
        success: true,
        message: `Invitation generated and dispatched to ${invitation.email}`,
        data: invitation
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
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
    const tenant =
      (await SupabaseStore.getTenantBySlug(tenantSlug)) ||
      (await db.getResolvedTenant(tenantSlug, true));
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { invitationId, employeeId, email, action, role } = body;
    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    if (action === 'RESEND') {
      let inv: Invitation | null = null;
      try {
        if (invitationId && !invitationId.startsWith('inv-')) {
          inv = db.resendInvitation(tenant.id, invitationId);
        }
      } catch {
        // Fallback to reinvite
      }

      if (!inv) {
        inv = db.reinviteEmployee(tenant.id, invitationId, employeeId, email, role || 'EMPLOYEE');
      }

      if (inv) {
        await SupabaseStore.saveInvitation(inv);
        await SupabaseStore.updateEmployeeLoginStatus(inv.employeeId, 'PENDING');
      }

      return NextResponse.json(
        { success: true, message: 'Invitation resent successfully', data: inv },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
      );
    } else if (action === 'REINVITE') {
      const inv = db.reinviteEmployee(
        tenant.id,
        invitationId,
        employeeId,
        email,
        role || 'EMPLOYEE'
      );
      if (inv) {
        await SupabaseStore.saveInvitation(inv);
        await SupabaseStore.updateEmployeeLoginStatus(inv.employeeId, 'PENDING');
      }

      return NextResponse.json(
        { success: true, message: 'Invitation restored and generated successfully', data: inv },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
      );
    } else if (action === 'REVOKE') {
      db.revokeInvitation(tenant.id, invitationId, employeeId, email);
      await SupabaseStore.revokeInvitation(tenant.id, invitationId, employeeId, email);

      return NextResponse.json(
        { success: true, message: 'Invitation and login access successfully revoked' },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
      );
    } else if (action === 'CANCEL') {
      db.cancelInvitation(tenant.id, invitationId, employeeId, email);
      await SupabaseStore.deleteInvitation(tenant.id, invitationId, employeeId, email);

      return NextResponse.json(
        { success: true, message: 'Invitation cancelled and employee reset to uninvited' },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
      );
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error modifying invitation';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant =
      (await SupabaseStore.getTenantBySlug(tenantSlug)) ||
      (await db.getResolvedTenant(tenantSlug, true));
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const invitationId = searchParams.get('invitationId') || undefined;
    const employeeId = searchParams.get('employeeId') || undefined;
    const email = searchParams.get('email') || undefined;

    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    db.cancelInvitation(tenant.id, invitationId, employeeId, email);
    await SupabaseStore.deleteInvitation(tenant.id, invitationId, employeeId, email);

    return NextResponse.json(
      { success: true, message: 'Invitation cancelled and employee reset to uninvited' },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting invitation';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
