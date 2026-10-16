import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export async function GET() {
  try {
    const tenants = db.listTenants();
    const allEmployees = tenants.flatMap((t) => db.getEmployees(t.id));
    const auditLogs = db.getAuditLogs();

    const mrr = tenants.reduce((acc, t) => {
      if (t.planId === 'starter') return acc + 99;
      if (t.planId === 'growth') return acc + 299;
      if (t.planId === 'enterprise') return acc + 799;
      return acc;
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        tenants,
        stats: {
          totalTenants: tenants.length,
          activeTenants: tenants.filter((t) => t.status === 'ACTIVE').length,
          totalEmployees: allEmployees.length,
          mrrUSD: mrr,
          arrUSD: mrr * 12
        },
        recentAuditLogs: auditLogs.slice(0, 8)
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch tenants';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, slug, primaryColor, planId, maxEmployees, currency, country, adminName, adminEmail } = body;

    if (!name || !slug || !adminEmail || !adminName) {
      return NextResponse.json(
        { success: false, error: 'Company Name, Slug, Admin Name, and Admin Email are required.' },
        { status: 400 }
      );
    }

    const result = db.createTenant({
      name,
      slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
      primaryColor: primaryColor || '#059669',
      planId: planId || 'growth',
      maxEmployees: maxEmployees || 50,
      currency: currency || 'USD',
      country: country || 'United States',
      adminName,
      adminEmail
    });

    return NextResponse.json({
      success: true,
      message: `Tenant "${result.tenant.name}" successfully provisioned with isolated workspace.`,
      data: result
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to provision tenant';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
