import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { SupabaseStore } from '@/lib/db/supabaseStore';
import { Holiday } from '@/lib/types';

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
    const yearParam = searchParams.get('year');
    const filterYear = yearParam ? parseInt(yearParam, 10) : undefined;

    let holidays: Holiday[] | null = await SupabaseStore.getHolidays(tenant.id);
    if (holidays && holidays.length > 0) {
      db.syncHolidays(holidays);
    } else {
      holidays = db.getHolidays(tenant.id);
      if (holidays.length > 0) {
        await SupabaseStore.saveHolidaysBatch(tenant.id, holidays);
      }
    }

    let result = db.getHolidays(tenant.id, filterYear);

    // If tenant has no holidays at all, automatically seed current year standard holidays
    if (result.length === 0 && (!filterYear || filterYear === 2026)) {
      const seeded = db.seedStandardHolidays(tenant.id, filterYear || 2026);
      await SupabaseStore.saveHolidaysBatch(tenant.id, seeded);
      result = db.getHolidays(tenant.id, filterYear);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          holidays: result,
          year: filterYear || 'ALL',
          totalCount: result.length
        }
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching holidays';
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
      return NextResponse.json({ success: false, error: 'Tenant workspace not found' }, { status: 404 });
    }

    const body = await req.json();
    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);
    SupabaseStore.invalidate(tenant.id);
    SupabaseStore.invalidate(tenantSlug);

    // 1. Bulk Seeding Action
    if (body.action === 'SEED') {
      const year = Number(body.year) || new Date().getFullYear();
      const seeded = db.seedStandardHolidays(tenant.id, year);
      await SupabaseStore.saveHolidaysBatch(tenant.id, seeded);

      return NextResponse.json(
        {
          success: true,
          message: `Successfully populated standard public holidays for calendar year ${year}`,
          data: seeded
        },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
      );
    }

    // 2. Create Single Holiday
    const { name, date, isOptional } = body;
    if (!name || !date) {
      return NextResponse.json(
        { success: false, error: 'Holiday name and date (YYYY-MM-DD) are required' },
        { status: 400 }
      );
    }

    const holiday = db.createHoliday(tenant.id, {
      name,
      date,
      isOptional: Boolean(isOptional)
    });

    await SupabaseStore.saveHoliday(holiday);

    return NextResponse.json(
      {
        success: true,
        message: `Holiday "${holiday.name}" created successfully for ${holiday.date}`,
        data: holiday
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error creating holiday';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function PUT(
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

    const body = await req.json();
    const { id, name, date, isOptional } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Holiday ID is required' }, { status: 400 });
    }

    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);
    SupabaseStore.invalidate(tenant.id);
    SupabaseStore.invalidate(tenantSlug);

    const updated = db.updateHoliday(tenant.id, id, {
      name,
      date,
      isOptional
    });

    if (!updated) {
      // If not found in memory, create/upsert it
      const dayOfWeek = date
        ? new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
        : 'Monday';
      const synthesized: Holiday = {
        id,
        tenantId: tenant.id,
        name: name || 'Holiday',
        date: date || '2026-01-01',
        dayOfWeek,
        isOptional: Boolean(isOptional)
      };
      await SupabaseStore.saveHoliday(synthesized);
      return NextResponse.json(
        {
          success: true,
          message: 'Holiday updated successfully',
          data: synthesized
        },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
      );
    }

    await SupabaseStore.saveHoliday(updated);

    return NextResponse.json(
      {
        success: true,
        message: `Holiday "${updated.name}" updated successfully`,
        data: updated
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating holiday';
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
      return NextResponse.json({ success: false, error: 'Tenant workspace not found' }, { status: 404 });
    }

    const url = new URL(req.url);
    let holidayId = url.searchParams.get('id');

    if (!holidayId) {
      try {
        const body = await req.json();
        holidayId = body.id;
      } catch {
        // no body
      }
    }

    if (!holidayId) {
      return NextResponse.json({ success: false, error: 'Holiday ID is required for deletion' }, { status: 400 });
    }

    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);
    SupabaseStore.invalidate(tenant.id);
    SupabaseStore.invalidate(tenantSlug);

    db.deleteHoliday(tenant.id, holidayId);
    await SupabaseStore.deleteHoliday(tenant.id, holidayId);

    return NextResponse.json(
      { success: true, message: 'Holiday deleted successfully' },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting holiday';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
