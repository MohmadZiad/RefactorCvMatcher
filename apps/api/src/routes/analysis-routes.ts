import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { AnalysisService } from "../services/analysis-service";

const BatchPayloadSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  cvIds: z
    .array(z.string().min(1, "Each CV ID must be a non-empty string"))
    .min(1, "At least one CV ID is required")
    .refine(
      (ids) => ids.every((id) => id !== null && id !== undefined),
      "CV IDs cannot contain null or undefined values"
    ),
  topK: z.number().int().positive().max(50).optional(),
  strictMust: z.boolean().optional(),
});

export async function registerAnalysisRoutes(
  app: FastifyInstance,
  analysisService: AnalysisService
) {
  app.post("/api/analyses/batch", async (request, reply) => {
    const parseResult = BatchPayloadSchema.safeParse(request.body);

    if (!parseResult.success) {
      app.log.warn({ error: parseResult.error }, "Invalid batch payload");
      return reply.status(400).send({
        error: "Validation failed",
        details: parseResult.error.errors,
      });
    }

    try {
      const response = await analysisService.runBatch(parseResult.data);
      return reply.status(200).send(response);
    } catch (error) {
      if (error instanceof Error && error.message === "JOB_NOT_FOUND") {
        return reply.status(404).send({ error: "Job not found" });
      }

      if (error instanceof Error && error.message === "CVS_NOT_FOUND") {
        return reply.status(404).send({ error: "CVs not found" });
      }

      app.log.error({ err: error }, "Failed to run batch analysis");
      return reply.status(500).send({ error: "Failed to run batch analysis" });
    }
  });
}
