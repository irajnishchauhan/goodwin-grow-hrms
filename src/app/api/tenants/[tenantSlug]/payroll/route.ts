import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export async function GET(
  req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant = db.getTenantBySlug(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || undefined;

    const slips = db.getSalarySlips(tenant.id, month);
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
    const tenant = db.getTenantBySlug(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { month } = body;

    const slips = db.generatePayrollRun(tenant.id, month || '2026-10');
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
