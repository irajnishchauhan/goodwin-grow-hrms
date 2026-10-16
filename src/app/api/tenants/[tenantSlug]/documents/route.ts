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
      return NextResponse.json({ success: false, error: 'Tenant workspace not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || undefined;

    let documents = await SupabaseStore.getDocuments(tenant.id, employeeId);
    if (!documents || documents.length === 0) {
      documents = db.getDocuments(tenant.id, employeeId);
    }

    return NextResponse.json({ success: true, data: { documents } });
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
    const tenant = db.getTenantBySlug(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { employeeId, title, documentType, fileName, fileSize } = body;

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
