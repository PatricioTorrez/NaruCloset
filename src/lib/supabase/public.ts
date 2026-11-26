import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { env } from '@/lib/env';

/**
 * Cliente anónimo sin cookies para el catálogo público.
 * Se puede usar dentro de 'use cache': no depende de la petición. RLS limita lo visible.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
