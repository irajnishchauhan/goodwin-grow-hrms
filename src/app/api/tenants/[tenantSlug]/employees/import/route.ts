import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

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
    const { rows } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'No employee records provided in payload' }, { status: 400 });
    }

    const result = db.bulkImportEmployees(tenant.id, rows);

    return NextResponse.json({
      success: true,
      message: `Import completed: ${result.importedCount} employees added, ${result.failedCount} rows flagged.`,
      data: result
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error importing employee batch';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
