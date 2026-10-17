import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { SupabaseStore } from '@/lib/db/supabaseStore';

export async function GET(
  req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant = await db.getResolvedTenant(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant workspace not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || undefined;
    const cacheKey = `documents_${tenant.id}_${employeeId || 'all'}`;

    const cached = db.getCached<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    let documents = await SupabaseStore.getDocuments(tenant.id, employeeId);
    if (!documents || documents.length === 0) {
      documents = db.getDocuments(tenant.id, employeeId);
    }

    const payload = { documents };
    db.setCached(cacheKey, payload, 30000);

    return NextResponse.json({ success: true, data: payload });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching documents';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant = await db.getResolvedTenant(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { employeeId, title, documentType, fileName, fileSize } = body;
    db.invalidateCache(tenant.id);

    const doc = db.uploadDocument(tenant.id, {
      employeeId,
      title,
      documentType,
      fileName,
      fileSize: fileSize || '1.2 MB'
    });

    await SupabaseStore.saveDocument(doc);

    return NextResponse.json({ success: true, data: doc, message: 'Document added to employee vault' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error uploading document';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
