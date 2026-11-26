import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { env } from '@/lib/env';

/** Cliente del navegador. En este proyecto solo se usa para subir fotos a Storage desde el panel. */
export function createClient() {
  return createBrowserClient<Database>(env.supabaseUrl, env.supabasePublishableKey);
}
