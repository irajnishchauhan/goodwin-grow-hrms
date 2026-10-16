import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

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

    const { user, token } = db.loginUser(email, password);

    let redirectUrl = '/';
    if (user.isSuperAdmin) {
      redirectUrl = '/super-admin';
    } else if (user.memberships.length === 1) {
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
    } else if (user.memberships.length > 1) {
      redirectUrl = `/select-company?userId=${user.id}`;
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
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return NextResponse.json({ success: false, error: message }, { status: 401 });
  }
}
