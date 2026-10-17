import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { SupabaseStore } from '@/lib/db/supabaseStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim();

    // 1. Sync user from Supabase if not in memory or to verify latest credentials
    const supaUser = await SupabaseStore.getUserByEmail(trimmedEmail);
    if (supaUser) {
      db.syncUser(supaUser);
    }

    // 2. Perform login verification
    const { user, token } = db.loginUser(trimmedEmail, password);

    let redirectUrl = '/';
    if (user.isSuperAdmin) {
      redirectUrl = '/super-admin';
    } else if (user.memberships && user.memberships.length === 1) {
      const membership = user.memberships[0];
      const slug = membership.tenantSlug;
      if (membership.role === 'COMPANY_ADMIN') {
        redirectUrl = `/app/${slug}`;
      } else if (membership.role === 'HR_ADMIN') {
        redirectUrl = `/app/${slug}/employees`;
      } else if (membership.role === 'MANAGER') {
        redirectUrl = `/app/${slug}/attendance`;
      } else {
        redirectUrl = `/app/${slug}/my-dashboard`;
      }
    } else if (user.memberships && user.memberships.length > 1) {
      redirectUrl = `/select-company?userId=${user.id}`;
    } else {
      redirectUrl = `/app/${user.activeTenantId?.replace('tenant-', '') || 'goodwin-batteries-fleet'}/my-dashboard`;
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token,
        redirectUrl
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid email or password. Please verify your credentials.';
    return NextResponse.json({ success: false, error: message }, { status: 401 });
  }
}
