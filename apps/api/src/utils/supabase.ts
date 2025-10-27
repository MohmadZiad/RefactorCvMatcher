import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

import { env } from "../env";

export type Supabase = SupabaseClient | undefined;

export function createSupabaseClient(): Supabase {
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!env.isSupabaseReady || !env.SUPABASE_URL || !serviceRoleKey) {
    return undefined;
  }

  return createClient(env.SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
