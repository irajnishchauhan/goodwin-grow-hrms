import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { SupabaseStore } from '@/lib/db/supabaseStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, newPassword } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email address is required.' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // 1. Look up user in Supabase or in-memory db
    let user = await SupabaseStore.getUserByEmail(trimmedEmail);
    if (!user) {
      user = db.getUserByEmail(trimmedEmail);
    }

    // Also check if employee exists in any tenant
    let employee = null;
    const tenants = await SupabaseStore.getTenants() || db.listTenants();
    for (const t of tenants) {
      const emps = await SupabaseStore.getEmployees(t.id) || db.getEmployees(t.id);
      const matched = emps.find((e) => e.workEmail?.toLowerCase() === trimmedEmail);
      if (matched) {
        employee = matched;
        break;
      }
    }

    if (!user && !employee) {
      return NextResponse.json(
        { success: false, error: 'No employee account found matching this email address.' },
        { status: 404 }
      );
    }

    // If newPassword is provided, reset it immediately (self-service reset)
    if (newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json(
          { success: false, error: 'Password must be at least 8 characters long.' },
          { status: 400 }
        );
      }

      // Update in Supabase
      await SupabaseStore.updateUserPassword(trimmedEmail, newPassword);

      // If user existed only in db or memory
      db.updateUserPassword(trimmedEmail, newPassword);

      // If user entity didn't exist yet but employee did, create active user
      if (!user && employee) {
        const newUser = {
          id: `user-${Date.now()}`,
          name: `${employee.firstName} ${employee.lastName}`,
          email: trimmedEmail,
          passwordHash: newPassword,
          isSuperAdmin: false,
          memberships: [
            {
              id: `m-${Date.now()}`,
              tenantId: employee.tenantId,
              tenantName: 'Workspace',
              tenantSlug: employee.tenantId.replace('tenant-', ''),
              role: 'EMPLOYEE' as any,
              status: 'ACTIVE' as any
            }
          ],
          activeTenantId: employee.tenantId,
          isActive: true,
          createdAt: new Date().toISOString()
        };
        await SupabaseStore.saveUser(newUser);
        db.syncUser(newUser);
        await SupabaseStore.updateEmployeeLoginStatus(employee.id, 'ACCEPTED', newUser.id);
      }

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully! You can now log in with your new password.'
      });
    }

    // If no newPassword provided yet, return verification success
    return NextResponse.json({
      success: true,
      message: 'Account verified. Please set your new password.',
      data: {
        email: trimmedEmail,
        employeeName: user?.name || (employee ? `${employee.firstName} ${employee.lastName}` : 'Employee')
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process password reset.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
