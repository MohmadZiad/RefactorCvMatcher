import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { JobService } from "../services/job-service";

const JobPayloadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
});

export async function registerJobRoutes(app: FastifyInstance, jobService: JobService) {
  app.post("/api/jobs", async (request, reply) => {
    const parseResult = JobPayloadSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.message });
    }

    const { title, description } = parseResult.data;

    try {
      const job = await jobService.createJob(title, description);
      return reply.status(200).send(job);
    } catch (error) {
      app.log.error({ err: error }, "Failed to create job");
      return reply.status(500).send({ error: "Failed to create job" });
    }
  });
}
