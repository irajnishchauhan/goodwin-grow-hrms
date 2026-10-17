import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { SupabaseStore } from '@/lib/db/supabaseStore';

export const dynamic = 'force-dynamic';

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
    const { rows } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'No employee records provided in payload' }, { status: 400 });
    }

    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    const result = db.bulkImportEmployees(tenant.id, rows);

    // Persist all imported employees to Supabase in parallel
    if (result.importedEmployees && result.importedEmployees.length > 0) {
      await Promise.all(result.importedEmployees.map((emp) => SupabaseStore.saveEmployee(emp)));
    }

    return NextResponse.json(
      {
        success: true,
        message: `Import completed: ${result.importedCount} employees added, ${result.failedCount} rows flagged.`,
        data: result
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error importing employee batch';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
