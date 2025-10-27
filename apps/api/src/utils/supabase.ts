import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

import { env } from "../env";

export type Supabase = SupabaseClient | undefined;

export function createSupabaseClient(): Supabase {
  if (!env.isSupabaseReady || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE) {
    return undefined;
  }

  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
