import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

import { env } from "../env";

export type Supabase = SupabaseClient | undefined;

export function createSupabaseClient(): Supabase {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, isSupabaseReady } = env;

  if (!isSupabaseReady || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return undefined;
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
