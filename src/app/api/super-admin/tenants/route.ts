import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { SupabaseStore } from '@/lib/db/supabaseStore';
import { Tenant } from '@/lib/types';

export async function GET() {
  try {
    const supabaseTenants = await SupabaseStore.getTenants();

    let tenants: Tenant[];
    if (supabaseTenants !== null) {
      // Supabase PostgreSQL is connected: It is the authoritative single source of truth.
      tenants = supabaseTenants;
      db.setTenants(supabaseTenants);
    } else {
      // Supabase is unreachable/unconfigured: fallback to local in-memory store
      tenants = db.listTenants();
    }

    let totalEmployees = 0;
    for (const t of tenants) {
      if (SupabaseStore.isConnected()) {
        const emps = await SupabaseStore.getEmployees(t.id);
        totalEmployees += (emps ? emps.length : db.getEmployees(t.id).length);
      } else {
        totalEmployees += db.getEmployees(t.id).length;
      }
    }

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
          totalEmployees,
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

    if (result.tenant) {
      await SupabaseStore.saveTenant(result.tenant);
    }

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

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Tenant ID is required for editing' }, { status: 400 });
    }

    let existing = db.getTenantById(id);
    if (!existing) {
      const allTenants = await SupabaseStore.getTenants();
      existing = allTenants?.find((t) => t.id === id) || null;
      if (existing) {
        db.upsertTenant(existing);
      }
    }

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Tenant workspace not found' }, { status: 404 });
    }

    const updated = db.updateTenant(id, updates);
    await SupabaseStore.saveTenant(updated);

    return NextResponse.json({
      success: true,
      message: `Workspace "${updated.name}" updated successfully`,
      data: { tenant: updated }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating tenant';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('id');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID is required for deletion' }, { status: 400 });
    }

    let existing = db.getTenantById(tenantId) || db.getTenantBySlug(tenantId);
    if (!existing) {
      const allTenants = await SupabaseStore.getTenants();
      existing = allTenants?.find((t) => t.id === tenantId || t.slug === tenantId) || null;
    }
    const targetId = existing ? existing.id : tenantId;
    const targetSlug = existing ? existing.slug : tenantId;
    const companyName = existing ? existing.name : tenantId;

    db.deleteTenant(targetId);
    db.deleteTenant(targetSlug);
    await SupabaseStore.deleteTenant(targetId);

    // Refresh memory store from live Supabase
    const refreshedTenants = await SupabaseStore.getTenants();
    if (refreshedTenants !== null) {
      db.setTenants(refreshedTenants);
    }

    return NextResponse.json({
      success: true,
      message: `Workspace "${companyName}" and all associated data permanently deleted.`
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting tenant';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

