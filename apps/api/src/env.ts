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
  // New optional alias (deprecated)
  STORAGE_BUCKET: z.string().min(1).optional(),
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

  // Extract keys for migration handling
  const { SUPABASE_SERVICE_ROLE, STORAGE_BUCKET, SUPABASE_STORAGE_BUCKET, ...rest } = values;

  // Handle service role migration
  let serviceRoleKey = rest.SUPABASE_SERVICE_ROLE_KEY ?? null;
  if (!serviceRoleKey && SUPABASE_SERVICE_ROLE) {
    console.warn(
      "[env] SUPABASE_SERVICE_ROLE is deprecated. Please migrate to SUPABASE_SERVICE_ROLE_KEY."
    );
    serviceRoleKey = SUPABASE_SERVICE_ROLE;
  }

  // Handle storage bucket migration
  let storageBucket = SUPABASE_STORAGE_BUCKET ?? null;
  if (!storageBucket && STORAGE_BUCKET) {
    console.warn(
      "[env] STORAGE_BUCKET is deprecated. Please migrate to SUPABASE_STORAGE_BUCKET."
    );
    storageBucket = STORAGE_BUCKET;
  }

  const isSupabaseReady = Boolean(
    rest.SUPABASE_URL && serviceRoleKey && storageBucket
  );

  return {
    ...rest,
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey ?? undefined,
    SUPABASE_STORAGE_BUCKET: storageBucket ?? undefined,
    isSupabaseReady,
  };
})();
