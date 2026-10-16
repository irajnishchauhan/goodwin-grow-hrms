import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://eidgnglpmfqqsdcwuqib.supabase.co';
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'sb_publishable_NGP3vs23VM0HstU6_CfCwA_fKY8NTa2';

  return createBrowserClient(supabaseUrl, supabaseKey);
}
