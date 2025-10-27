import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.string().optional(),
  PORT: z.coerce.number().default(4000),
  API_ORIGIN: z.string().default("http://localhost:3000"),
  SUPABASE_URL: z.string().url().optional(),
  // New preferred key
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  // Deprecated fallback (kept for backward compat)
  SUPABASE_SERVICE_ROLE: z.string().min(1).optional(),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).optional(),
  SUPABASE_CV_TABLE: z.string().min(1).optional(),
});

type Env = z.infer<typeof EnvSchema> & {
  isSupabaseReady: boolean;
};

export const env: Env = (() => {
  const parsed = EnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.format();
    throw new Error(`Invalid environment variables: ${JSON.stringify(formatted)}`);
  }

  const values = parsed.data;

  // Pull out deprecated key to manage it separately
  const { SUPABASE_SERVICE_ROLE, ...rest } = values;

  // Prefer the new key, but fall back to the deprecated one with a warning
  let serviceRoleKey = rest.SUPABASE_SERVICE_ROLE_KEY ?? null;

  if (!serviceRoleKey && SUPABASE_SERVICE_ROLE) {
    console.warn(
      "[env] SUPABASE_SERVICE_ROLE is deprecated. Please migrate to SUPABASE_SERVICE_ROLE_KEY."
    );
    serviceRoleKey = SUPABASE_SERVICE_ROLE;
  }

  const isSupabaseReady = Boolean(
    rest.SUPABASE_URL && serviceRoleKey && rest.SUPABASE_STORAGE_BUCKET
  );

  return {
    ...rest,
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey ?? undefined,
    isSupabaseReady,
  };
})();
