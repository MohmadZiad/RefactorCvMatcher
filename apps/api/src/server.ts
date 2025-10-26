import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";

import { env } from "./env";
import { createSupabaseClient } from "./utils/supabase";
import { CvService } from "./services/cv-service";
import { JobService } from "./services/job-service";
import { AnalysisService } from "./services/analysis-service";
import { registerCvRoutes } from "./routes/cv-routes";
import { registerJobRoutes } from "./routes/job-routes";
import { registerAnalysisRoutes } from "./routes/analysis-routes";

export async function buildServer() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: env.API_ORIGIN,
    credentials: false,
  });

  await app.register(multipart, {
    limits: {
      fileSize: 8 * 1024 * 1024,
      files: 1,
    },
  });

  const supabase = createSupabaseClient();
  const cvService = new CvService(supabase);
  const jobService = new JobService();
  const analysisService = new AnalysisService(cvService, jobService);

  await registerCvRoutes(app, cvService);
  await registerJobRoutes(app, jobService);
  await registerAnalysisRoutes(app, analysisService);

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}

if (process.env.NODE_ENV !== "test") {
  buildServer()
    .then((app) =>
      app.listen({ port: env.PORT, host: "0.0.0.0" }).then(() => {
        app.log.info(`API listening on http://0.0.0.0:${env.PORT}`);
      })
    )
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
