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
    const {
      name,
      slug,
      companyCode,
      industry,
      businessEmail,
      businessPhone,
      registeredAddress,
      city,
      state,
      country,
      postalCode,
      website,
      timezone,
      currency,
      financialYear,
      primaryColor,
      planId,
      maxEmployees,
      adminName,
      adminEmail,
      adminPhone,
      adminDesignation,
      adminRole
    } = body;

    if (!name || !slug || !adminEmail || !adminName) {
      return NextResponse.json(
        { success: false, error: 'Company Name, Slug, Admin Name, and Admin Email are required.' },
        { status: 400 }
      );
    }

    const result = db.createTenant({
      name,
      slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
      companyCode: companyCode?.trim().toUpperCase(),
      industry,
      businessEmail: businessEmail || adminEmail,
      businessPhone,
      registeredAddress,
      city,
      state,
      country: country || 'India',
      postalCode,
      website,
      timezone: timezone || 'Asia/Kolkata',
      currency: currency || 'INR',
      financialYear: financialYear || 'April - March',
      primaryColor: primaryColor || '#059669',
      planId: planId || 'growth',
      maxEmployees: maxEmployees || 100,
      adminName,
      adminEmail,
      adminPhone,
      adminDesignation: adminDesignation || 'Managing Director & Company Admin',
      adminRole: adminRole || 'COMPANY_ADMIN'
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
