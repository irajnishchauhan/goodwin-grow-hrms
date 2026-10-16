import { createClient, SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

const DEFAULT_SUPABASE_URL = 'https://eidgnglpmfqqsdcwuqib.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_NGP3vs23VM0HstU6_CfCwA_fKY8NTa2';

export function getSupabaseAdmin(): SupabaseClient | null {
  if (adminClient) return adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return adminClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL) &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY ||
     process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
     DEFAULT_SUPABASE_KEY)
  );
}
