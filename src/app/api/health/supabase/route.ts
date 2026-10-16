import { NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/admin';

export async function GET() {
  const configured = isSupabaseConfigured();

  if (!configured) {
    return NextResponse.json({
      status: 'awaiting_configuration',
      message: 'Supabase credentials not yet provided in .env.local',
      instructions: {
        step1: 'Create a free project at https://database.new',
        step2: 'Run the SQL script from supabase/schema.sql in the Supabase SQL Editor',
        step3: 'Run the seed data from supabase/seed.sql in the Supabase SQL Editor',
        step4: 'Copy Project URL & Anon/Service Key into .env.local'
      },
      envVariablesRequired: [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY'
      ]
    });
  }

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error('Failed to initialize Supabase admin client');

    const { data: tenants, error: tenantErr } = await supabase.from('tenants').select('count');
    const { data: employees, error: empErr } = await supabase.from('employees').select('count');

    if (tenantErr) {
      return NextResponse.json({
        status: 'schema_uninitialized',
        message: 'Connected to Supabase project, but tables are not yet created.',
        error: tenantErr.message,
        actionRequired: 'Run the SQL script in supabase/schema.sql in the Supabase SQL Editor.'
      }, { status: 200 });
    }

    return NextResponse.json({
      status: 'connected',
      message: 'Supabase PostgreSQL database is active, healthy, and connected.',
      data: {
        tenantsCount: tenants?.[0]?.count ?? 0,
        employeesCount: employees?.[0]?.count ?? 0
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database check failed';
    return NextResponse.json({
      status: 'error',
      message
    }, { status: 500 });
  }
}
