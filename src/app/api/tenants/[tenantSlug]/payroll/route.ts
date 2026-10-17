import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { SupabaseStore } from '@/lib/db/supabaseStore';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant = await SupabaseStore.getTenantBySlug(tenantSlug) || await db.getResolvedTenant(tenantSlug, true);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || undefined;

    let slips = await SupabaseStore.getSalarySlips(tenant.id);
    if (slips === null) {
      slips = db.getSalarySlips(tenant.id, month);
    } else if (month) {
      slips = slips.filter((s) => s.month === month);
    }

    const totalDisbursed = slips.reduce((sum, s) => sum + s.netPay, 0);

    const payload = {
      currency: tenant.currency,
      slips,
      totalNetDisbursed: totalDisbursed,
      totalSlipsCount: slips.length
    };

    return NextResponse.json(
      { success: true, data: payload },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching payroll';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant = await SupabaseStore.getTenantBySlug(tenantSlug) || await db.getResolvedTenant(tenantSlug, true);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { month } = body;
    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    const [supaEmps, supaAtt] = await Promise.all([
      SupabaseStore.getEmployees(tenant.id),
      SupabaseStore.getAttendance(tenant.id)
    ]);
    if (supaEmps && supaEmps.length > 0) {
      db.syncEmployees(supaEmps);
    }
    if (supaAtt && supaAtt.length > 0) {
      db.syncAttendance(supaAtt);
    }

    const slips = db.generatePayrollRun(tenant.id, month || '2026-10');
    // Save to Supabase in parallel
    await Promise.all(slips.map((slip) => SupabaseStore.saveSalarySlip(slip)));

    return NextResponse.json(
      {
        success: true,
        message: `Payroll executed successfully for ${slips.length} employees for ${month || '2026-10'}.`,
        data: { slips, count: slips.length }
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error generating payroll';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
