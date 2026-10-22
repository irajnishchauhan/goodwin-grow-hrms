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
    const tenant = (await SupabaseStore.getTenantBySlug(tenantSlug)) || (await db.getResolvedTenant(tenantSlug, true));
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || searchParams.get('email') || undefined;

    const notifications = db.getNotifications(tenant.id, employeeId);
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json(
      {
        success: true,
        data: {
          notifications,
          unreadCount
        }
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching notifications';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant = (await SupabaseStore.getTenantBySlug(tenantSlug)) || (await db.getResolvedTenant(tenantSlug, true));
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { id, markAll, employeeId } = body;

    if (markAll) {
      db.markAllNotificationsRead(tenant.id, employeeId);
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Notification ID required' }, { status: 400 });
    }

    const updated = db.markNotificationRead(tenant.id, id);
    return NextResponse.json({ success: updated, message: updated ? 'Notification marked as read' : 'Notification not found' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating notification';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
