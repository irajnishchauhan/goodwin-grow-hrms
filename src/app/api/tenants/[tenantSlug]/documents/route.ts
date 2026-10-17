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
    const tenant =
      (await SupabaseStore.getTenantBySlug(tenantSlug)) ||
      (await db.getResolvedTenant(tenantSlug, true));
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant workspace not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || undefined;

    let documents = await SupabaseStore.getDocuments(tenant.id, employeeId);
    if (documents === null || documents.length === 0) {
      documents = db.getDocuments(tenant.id, employeeId);
      // Sync in-memory default documents to Supabase if any exist
      if (documents.length > 0) {
        await Promise.all(documents.map((d) => SupabaseStore.saveDocument(d)));
      }
    } else {
      db.setDocumentsForTenant(tenant.id, documents);
    }

    const payload = {
      documents,
      totalCount: documents.length
    };

    return NextResponse.json(
      { success: true, data: payload },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
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
    const tenant =
      (await SupabaseStore.getTenantBySlug(tenantSlug)) ||
      (await db.getResolvedTenant(tenantSlug, true));
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { employeeId, title, documentType, fileName, fileSize } = body;
    if (!employeeId || !title) {
      return NextResponse.json({ success: false, error: 'Employee and document title are required' }, { status: 400 });
    }

    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    let emp = db.getEmployeeById(tenant.id, employeeId);
    if (!emp) {
      const supaEmployees = await SupabaseStore.getEmployees(tenant.id);
      if (supaEmployees && supaEmployees.length > 0) {
        db.syncEmployees(supaEmployees);
        emp = db.getEmployeeById(tenant.id, employeeId);
      }
    }
    const employeeName = emp ? `${emp.firstName} ${emp.lastName}` : body.employeeName || 'Assigned Employee';

    const doc = db.uploadDocument(tenant.id, {
      employeeId,
      employeeName,
      title: title.trim(),
      documentType: documentType || 'CONTRACT',
      fileName: fileName || `${title.replace(/\s+/g, '_')}.pdf`,
      fileSize: fileSize || '1.6 MB'
    });

    await SupabaseStore.saveDocument(doc);

    return NextResponse.json(
      { success: true, data: doc, message: 'Document added to employee vault successfully' },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error uploading document';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant =
      (await SupabaseStore.getTenantBySlug(tenantSlug)) ||
      (await db.getResolvedTenant(tenantSlug, true));
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { id, title, documentType, employeeId } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Document ID is required' }, { status: 400 });
    }

    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    let employeeName: string | undefined = body.employeeName;
    if (employeeId) {
      let emp = db.getEmployeeById(tenant.id, employeeId);
      if (!emp) {
        const supaEmployees = await SupabaseStore.getEmployees(tenant.id);
        if (supaEmployees && supaEmployees.length > 0) {
          db.syncEmployees(supaEmployees);
          emp = db.getEmployeeById(tenant.id, employeeId);
        }
      }
      if (emp) {
        employeeName = `${emp.firstName} ${emp.lastName}`;
      }
    }

    const updated = db.updateDocument(tenant.id, id, {
      ...(title ? { title: title.trim() } : {}),
      ...(documentType ? { documentType } : {}),
      ...(employeeId ? { employeeId } : {}),
      ...(employeeName ? { employeeName } : {})
    });

    await SupabaseStore.updateDocument({
      id,
      tenantId: tenant.id,
      title,
      documentType,
      employeeId,
      employeeName
    });

    return NextResponse.json(
      { success: true, data: updated, message: 'Document updated successfully' },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating document';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant =
      (await SupabaseStore.getTenantBySlug(tenantSlug)) ||
      (await db.getResolvedTenant(tenantSlug, true));
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const idsParam = searchParams.get('ids');

    let idsToDelete: string[] = [];
    if (id) {
      idsToDelete = [id];
    } else if (idsParam) {
      idsToDelete = idsParam.split(',').map((x) => x.trim()).filter(Boolean);
    } else {
      const body = await req.json().catch(() => ({}));
      if (body.id) idsToDelete = [body.id];
      if (Array.isArray(body.ids)) idsToDelete = body.ids;
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json({ success: false, error: 'No document ID specified for deletion' }, { status: 400 });
    }

    db.deleteDocumentsBulk(tenant.id, idsToDelete);
    await SupabaseStore.deleteDocumentsBulk(tenant.id, idsToDelete);

    return NextResponse.json(
      {
        success: true,
        message: `${idsToDelete.length} document(s) permanently deleted from vault`
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting document';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
