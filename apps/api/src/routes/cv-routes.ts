import type { FastifyInstance } from "fastify";

import { CvService } from "../services/cv-service";

export async function registerCvRoutes(app: FastifyInstance, cvService: CvService) {
  app.post("/api/cv/upload", async (request, reply) => {
    const file = await request.file();
    if (!file) {
      return reply.status(400).send({ error: "No file" });
    }

    try {
      const buffer = await file.toBuffer();
      const record = await cvService.uploadCv(buffer, file.filename, file.mimetype);
      return reply.status(200).send(record);
    } catch (error) {
      request.log.error({ err: error }, "Failed to upload CV");
      return reply.status(500).send({ error: "Upload failed" });
    }
  });

  app.get("/api/cv", async (_request, reply) => {
    try {
      const items = await cvService.list();
      return reply.status(200).send({ items });
    } catch (error) {
      app.log.error({ err: error }, "Failed to list CVs");
      return reply.status(500).send({ error: "Failed to load CVs" });
    }
  });
}
