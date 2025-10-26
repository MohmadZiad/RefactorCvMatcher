import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.string().optional(),
  PORT: z.coerce.number().default(4000),
  API_ORIGIN: z.string().default("http://localhost:3000"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
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
  const isSupabaseReady = Boolean(
    values.SUPABASE_URL && values.SUPABASE_SERVICE_ROLE_KEY && values.SUPABASE_STORAGE_BUCKET
  );

  return {
    ...values,
    isSupabaseReady,
  };
})();
