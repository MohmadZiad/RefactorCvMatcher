import { nanoid } from "nanoid";

import type { JobRecord, JobRequirement } from "../types/job";

const COMMON_KEYWORDS: Array<{ keyword: RegExp; must: boolean; weight: number }> = [
  { keyword: /typescript|تيب سكربت/i, must: true, weight: 3 },
  { keyword: /javascript|جافا سكربت/i, must: true, weight: 2 },
  { keyword: /react/i, must: false, weight: 2 },
  { keyword: /next\.js|nextjs|نكست/i, must: false, weight: 2 },
  { keyword: /node\.js|nodejs|نود/i, must: true, weight: 2 },
  { keyword: /aws|amazon web services/i, must: false, weight: 1.5 },
  { keyword: /sql|mysql|postgres/i, must: true, weight: 2 },
  { keyword: /devops|ci\/?cd/i, must: false, weight: 1.5 },
  { keyword: /ai|machine learning|ذكاء اصطناعي/i, must: false, weight: 1.5 },
  { keyword: /communication|تواصل/i, must: false, weight: 1 },
];

function sanitizeRequirement(requirement: string): string {
  return requirement.replace(/^[\p{P}\p{Zs}]+/gu, "").replace(/[\p{P}\p{Zs}]+$/gu, "");
}

function heuristicRequirements(description: string): JobRequirement[] {
  const lines = description
    .split(/\r?\n+/)
    .map((line) => sanitizeRequirement(line.trim()))
    .filter(Boolean);

  const requirements: JobRequirement[] = [];

  lines.forEach((line) => {
    const must = /\b(يجب|خبرة|أساسي|must)\b/i.test(line);
    const weight = must ? 3 : 2;
    requirements.push({ requirement: line, must, weight });
  });

  COMMON_KEYWORDS.forEach(({ keyword, must, weight }) => {
    if (description.match(keyword)) {
      const requirement = description.match(keyword)?.[0] ?? "";
      if (requirement) {
        const normalized = requirement.length < 4 ? requirement.toUpperCase() : requirement;
        if (!requirements.some((item) => item.requirement.toLowerCase().includes(normalized.toLowerCase()))) {
          requirements.push({
            requirement: normalized,
            must,
            weight,
          });
        }
      }
    }
  });

  if (requirements.length === 0) {
    requirements.push({ requirement: "تحليل عام للخبرات والمهارات التقنية", must: true, weight: 2 });
  }

  return requirements.slice(0, 12);
}

export class JobService {
  private readonly jobs = new Map<string, JobRecord>();

  async createJob(title: string, description: string): Promise<JobRecord> {
    const id = `job_${nanoid(10)}`;
    const requirements = heuristicRequirements(description || title);

    const job: JobRecord = {
      id,
      title,
      description,
      requirements,
    };

    this.jobs.set(job.id, job);
    return job;
  }

  getJob(jobId: string): JobRecord | undefined {
    return this.jobs.get(jobId);
  }
}
