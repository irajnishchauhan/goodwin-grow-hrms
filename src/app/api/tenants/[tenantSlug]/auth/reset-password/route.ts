import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { SupabaseStore } from '@/lib/db/supabaseStore';

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
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { email, newPassword } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, error: 'Employee email is required' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const finalPassword =
      newPassword && newPassword.trim().length >= 6
        ? newPassword.trim()
        : `Goodwin@${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Update in Supabase users table
    await SupabaseStore.updateUserPassword(trimmedEmail, finalPassword);

    // 2. Update in memory db
    db.updateUserPassword(trimmedEmail, finalPassword);

    // 3. Ensure employee login status is marked ACCEPTED
    const employees = await SupabaseStore.getEmployees(tenant.id) || db.getEmployees(tenant.id);
    const emp = employees.find((e) => e.workEmail?.toLowerCase() === trimmedEmail);
    if (emp) {
      emp.loginStatus = 'ACCEPTED';
      await SupabaseStore.saveEmployee(emp);
      db.upsertEmployee(emp);
    }

    return NextResponse.json({
      success: true,
      message: `Password successfully updated for ${trimmedEmail}`,
      data: {
        email: trimmedEmail,
        temporaryPassword: finalPassword
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error resetting employee password';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
