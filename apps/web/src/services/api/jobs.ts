import { http } from "../http";

export type JobRequirement = {
  id?: string;
  requirement: string;
  mustHave: boolean;
  weight: number; // 0..10
};

export type Job = {
  id: string;
  title: string;
  description: string;
  requirements: JobRequirement[];
  createdAt?: string;
};

export const jobsApi = {
  create(input: {
    title: string;
    description: string;
    requirements?: JobRequirement[];
  }) {
    return http.post<Job>("/jobs", input);
  },

  list() {
    return http.get<{ items: Job[] }>("/jobs");
  },

  get(id: string) {
    return http.get<Job>(`/jobs/${id}`);
  },

  addRequirements(jobId: string, items: JobRequirement[]) {
    return http.post<{ ok: true }>(`/jobs/${jobId}/requirements`, { items });
  },

  updateRequirement(id: string, payload: Partial<JobRequirement>) {
    return http.patch<{ ok: true }>(`/jobs/requirements/${id}`, payload);
  },

  deleteRequirement(id: string) {
    return http.delete<{ ok: true }>(`/jobs/requirements/${id}`);
  },

  // اقتراح متطلبات من وصف وظيفي (JD)
  suggestFromJD(jdText: string) {
    return http.post<{ items: JobRequirement[] }>("/jobs/suggest", { jdText });
  },
};
