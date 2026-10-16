import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { SupabaseStore } from '@/lib/db/supabaseStore';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawToken = searchParams.get('token');

    if (!rawToken) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    const token = rawToken.trim();

    // 1. Try local memory
    let invitation = db.getInvitationByToken(token);

    // 2. Try Supabase
    if (!invitation) {
      invitation = await SupabaseStore.getInvitationByToken(token);
      if (invitation) {
        db.syncInvitation(invitation);
      }
    }

    if (!invitation) {
      return NextResponse.json({ success: false, error: 'Invalid or expired invitation token.' }, { status: 404 });
    }

    if (invitation.status === 'ACCEPTED') {
      return NextResponse.json({
        success: false,
        error: 'This account invitation has already been activated. Please login directly.'
      }, { status: 400 });
    }

    if (invitation.status === 'REVOKED') {
      return NextResponse.json({
        success: false,
        error: 'This invitation has been revoked by the company administrator.'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        token: invitation.token, // Return canonical token
        tenantName: invitation.tenantName,
        employeeName: invitation.employeeName,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error validating invitation';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token: rawToken, password, fullName } = body;

    if (!rawToken || !password) {
      return NextResponse.json(
        { success: false, error: 'Token and password are required' },
        { status: 400 }
      );
    }

    const token = rawToken.trim();

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // 1. Find invitation in memory or Supabase
    let invitation = db.getInvitationByToken(token);
    if (!invitation) {
      invitation = await SupabaseStore.getInvitationByToken(token);
      if (invitation) {
        db.syncInvitation(invitation);
      }
    }

    if (!invitation) {
      return NextResponse.json({ success: false, error: 'Invalid or expired invitation token.' }, { status: 404 });
    }

    // 2. Ensure tenant exists in memory
    let tenant = db.getTenantById(invitation.tenantId);
    if (!tenant) {
      const supaTenant = await SupabaseStore.getTenantById(invitation.tenantId);
      if (supaTenant) {
        db.upsertTenant(supaTenant);
        tenant = supaTenant;
      }
    }

    // 3. Ensure employee exists in memory
    let emp = db.getEmployeeById(invitation.tenantId, invitation.employeeId);
    if (!emp) {
      const emps = await SupabaseStore.getEmployees(invitation.tenantId);
      if (emps && emps.length > 0) {
        db.syncEmployees(emps);
        emp = db.getEmployeeById(invitation.tenantId, invitation.employeeId);
      }
    }

    // 4. Activate in memory db
    const { user, tenantSlug } = db.activateAccount(invitation.token, password, fullName);

    // 5. Persist all updates to Supabase
    // a. Update invitation
    const updatedInv = db.getInvitationByToken(invitation.token);
    if (updatedInv) {
      await SupabaseStore.saveInvitation(updatedInv);
    }

    // b. Update employee login status
    const updatedEmp = db.getEmployeeById(invitation.tenantId, invitation.employeeId);
    if (updatedEmp) {
      await SupabaseStore.saveEmployee(updatedEmp);
    }

    // c. Save user entity and memberships in Supabase
    await SupabaseStore.saveUser(user);

    return NextResponse.json({
      success: true,
      message: 'Account successfully activated! Welcome to Goodwin Grow HRMS.',
      data: {
        user,
        redirectUrl: `/app/${tenantSlug}/my-dashboard`
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Activation failed';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
