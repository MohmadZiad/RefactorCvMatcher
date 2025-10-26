import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { AnalysisService } from "../services/analysis-service";

const BatchPayloadSchema = z.object({
  jobId: z.string().min(1),
  cvIds: z.array(z.string().min(1)).min(1),
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
      return reply.status(400).send({ error: parseResult.error.message });
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
