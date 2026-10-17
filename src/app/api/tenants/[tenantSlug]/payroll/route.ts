import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { SupabaseStore } from '@/lib/db/supabaseStore';

export async function GET(
  req: Request,
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

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || undefined;

    let slips = await SupabaseStore.getSalarySlips(tenant.id);
    if (!slips || slips.length === 0) {
      slips = db.getSalarySlips(tenant.id, month);
    } else if (month) {
      slips = slips.filter((s) => s.month === month);
    }

    const totalDisbursed = slips.reduce((sum, s) => sum + s.netPay, 0);

    return NextResponse.json({
      success: true,
      data: {
        currency: tenant.currency,
        slips,
        totalNetDisbursed: totalDisbursed,
        totalSlipsCount: slips.length
      }
    });
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
    let tenant = db.getTenantBySlug(tenantSlug);
    if (!tenant) {
      tenant = await SupabaseStore.getTenantBySlug(tenantSlug);
      if (tenant) db.upsertTenant(tenant);
    }
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { month } = body;

    const supaEmps = await SupabaseStore.getEmployees(tenant.id);
    if (supaEmps && supaEmps.length > 0) {
      db.syncEmployees(supaEmps);
    }
    const supaAtt = await SupabaseStore.getAttendance(tenant.id);
    if (supaAtt && supaAtt.length > 0) {
      db.syncAttendance(supaAtt);
    }

    const slips = db.generatePayrollRun(tenant.id, month || '2026-10');
    // Save to Supabase
    for (const slip of slips) {
      await SupabaseStore.saveSalarySlip(slip);
    }

    return NextResponse.json({
      success: true,
      message: `Payroll executed successfully for ${slips.length} employees for ${month || '2026-10'}.`,
      data: { slips, count: slips.length }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error generating payroll';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
