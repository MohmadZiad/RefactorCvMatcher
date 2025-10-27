import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { JobService } from "../services/job-service";

const JobPayloadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
});

const RequirementItemSchema = z.object({
  id: z.string().uuid().optional(),
  requirement: z.string().min(1),
  mustHave: z.boolean().default(false),
  weight: z.number().int().min(0).max(10),
});

const AddRequirementsSchema = z.object({
  items: z.array(RequirementItemSchema).min(1),
});

const UpdateRequirementSchema = z.object({
  requirement: z.string().min(1).optional(),
  mustHave: z.boolean().optional(),
  weight: z.number().int().min(0).max(10).optional(),
});

const SuggestFromJDSchema = z.object({
  jdText: z.string().min(10, "JD text is too short"),
});

export async function registerJobRoutes(app: FastifyInstance, jobService: JobService) {
  // Create job
  app.post("/api/jobs", async (request, reply) => {
    const parsed = JobPayloadSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.message });
    }
    try {
      const job = await jobService.createJob(parsed.data.title, parsed.data.description);
      return reply.status(200).send(job);
    } catch (err) {
      app.log.error({ err }, "Failed to create job");
      return reply.status(500).send({ error: "Failed to create job" });
    }
  });

  // List jobs
  app.get("/api/jobs", async (_req, reply) => {
    try {
      const items = await jobService.list();
      return reply.status(200).send({ items });
    } catch (err) {
      app.log.error({ err }, "Failed to list jobs");
      return reply.status(500).send({ error: "Failed to load jobs" });
    }
  });

  // Get single job
  app.get("/api/jobs/:id", async (request, reply) => {
    const id = (request.params as { id: string })?.id;
    if (!id) return reply.status(400).send({ error: "Job id is required" });
    try {
      const job = await jobService.getById(id);
      if (!job) return reply.status(404).send({ error: "Job not found" });
      return reply.status(200).send(job);
    } catch (err) {
      app.log.error({ err }, "Failed to get job");
      return reply.status(500).send({ error: "Failed to load job" });
    }
  });

  // Add requirements to a job
  app.post("/api/jobs/:id/requirements", async (request, reply) => {
    const id = (request.params as { id: string })?.id;
    if (!id) return reply.status(400).send({ error: "Job id is required" });

    const parsed = AddRequirementsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.message });
    }
    try {
      await jobService.addRequirements(id, parsed.data.items);
      return reply.status(200).send({ ok: true });
    } catch (err) {
      app.log.error({ err }, "Failed to add requirements");
      return reply.status(500).send({ error: "Failed to add requirements" });
    }
  });

  // Update single requirement
  app.patch("/api/jobs/requirements/:reqId", async (request, reply) => {
    const reqId = (request.params as { reqId: string })?.reqId;
    if (!reqId) return reply.status(400).send({ error: "Requirement id is required" });

    const parsed = UpdateRequirementSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.message });
    }
    try {
      await jobService.updateRequirement(reqId, parsed.data);
      return reply.status(200).send({ ok: true });
    } catch (err) {
      app.log.error({ err }, "Failed to update requirement");
      return reply.status(500).send({ error: "Failed to update requirement" });
    }
  });

  // Delete single requirement
  app.delete("/api/jobs/requirements/:reqId", async (request, reply) => {
    const reqId = (request.params as { reqId: string })?.reqId;
    if (!reqId) return reply.status(400).send({ error: "Requirement id is required" });
    try {
      await jobService.deleteRequirement(reqId);
      return reply.status(200).send({ ok: true });
    } catch (err) {
      app.log.error({ err }, "Failed to delete requirement");
      return reply.status(500).send({ error: "Failed to delete requirement" });
    }
  });

  // Suggest requirements from JD
  app.post("/api/jobs/suggest", async (request, reply) => {
    const parsed = SuggestFromJDSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.message });
    }
    try {
      const items = await jobService.suggestFromJD(parsed.data.jdText);
      return reply.status(200).send({ items });
    } catch (err) {
      app.log.error({ err }, "Failed to suggest requirements");
      return reply.status(500).send({ error: "Failed to suggest requirements" });
    }
  });
}
