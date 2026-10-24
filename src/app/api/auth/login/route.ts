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
    let supaUser = await SupabaseStore.getUserByEmail(trimmedEmail);
    if (supaUser) {
      db.syncUser(supaUser);
    } else {
      // Check if email belongs to an existing employee in tenant workforce
      const tenants = (await SupabaseStore.getTenants()) || [db.getTenantById('tenant-goodwin-batteries-fleet')!];
      for (const t of tenants) {
        if (!t) continue;
        const emps = (await SupabaseStore.getEmployees(t.id)) || db.getEmployees(t.id);
        const emp = emps.find((e) => e.workEmail?.toLowerCase() === trimmedEmail.toLowerCase());
        if (emp) {
          const isOwner =
            trimmedEmail.toLowerCase().includes('rajnish') ||
            emp.designationTitle?.toLowerCase().includes('director') ||
            emp.designationTitle?.toLowerCase().includes('owner');
          const role = isOwner ? 'COMPANY_ADMIN' : 'EMPLOYEE';
          const newUser = {
            id: `user-${emp.id}`,
            name: `${emp.firstName} ${emp.lastName}`,
            email: trimmedEmail,
            passwordHash: 'password123',
            isSuperAdmin: false,
            memberships: [
              {
                id: `m-${emp.id}`,
                tenantId: t.id,
                tenantName: t.name,
                tenantSlug: t.slug,
                role: role as any,
                status: 'ACTIVE' as const
              }
            ],
            activeTenantId: t.id,
            isActive: true,
            createdAt: new Date().toISOString()
          };
          db.syncUser(newUser);
          break;
        }
      }
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
