import { http } from "../http";

export type PerRequirement = {
  requirement: string;
  mustHave: boolean;
  weight: number;
  similarity: number;
  score10: number;
  bestChunk?: { section: string; content: string };
};

export type Analysis = {
  id: string;
  jobId: string;
  cvId: string;
  status: string;
  score?: number;
  breakdown?: PerRequirement[];
  gaps?: { mustHaveMissing: string[]; improve: string[] };
  model?: string;
  createdAt: string;
};

type RunInput = {
  jobId: string;
  cvId: string;
  topK?: number;
  strictMust?: boolean;
};

export const analysesApi = {
  // يشغّل الـbatch لملف واحد ويرجّع Analysis واحد
  async run(input: RunInput) {
    // ✅ التحقق من أن cvId موجود وصالح
    if (!input.cvId || input.cvId.trim() === "") {
      throw new Error("CV ID is required");
    }

    if (!input.jobId || input.jobId.trim() === "") {
      throw new Error("Job ID is required");
    }

    const payload = {
      jobId: input.jobId,
      cvIds: [input.cvId],
      ...(input.topK ? { topK: input.topK } : {}),
      ...(typeof input.strictMust === "boolean"
        ? { strictMust: input.strictMust }
        : {}),
    };

    const res = await http.post<Analysis[] | Analysis>(
      "/analyses/batch",
      payload
    );

    const single: Analysis | undefined = Array.isArray(res) ? res[0] : res;
    if (!single) {
      throw new Error("Analysis not created");
    }
    return single;
  },

  get(id: string) {
    if (!id || id.trim() === "") {
      throw new Error("Analysis ID is required");
    }
    return http.get<Analysis>(`/analyses/${id}`);
  },

  byCv(cvId: string) {
    if (!cvId || cvId.trim() === "") {
      throw new Error("CV ID is required");
    }
    return http.get<Analysis[]>(`/analyses/by-cv/${cvId}`);
  },
};
