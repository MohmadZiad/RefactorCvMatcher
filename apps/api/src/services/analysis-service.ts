import type { CvService } from "./cv-service";
import type { JobService } from "./job-service";
import type {
  AnalysisSummaryRow,
  AnalysisTopEntry,
  BatchAnalysisPayload,
  BatchAnalysisResponse,
  LoadedContext,
} from "../types/analysis";
import type { JobRequirement } from "../types/job";

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesRequirement(requirement: JobRequirement, source: string): boolean {
  const requirementTokens = normalise(requirement.requirement).split(" ");
  const sourceText = normalise(source);
  return requirementTokens.every((token) => (token ? sourceText.includes(token) : true));
}

function buildWhyText(cvLabel: string, matched: string[], missingMust: string[]): string {
  const parts: string[] = [];

  if (matched.length > 0) {
    parts.push(`تطابق مع: ${matched.join("، ")}`);
  }

  if (missingMust.length > 0) {
    parts.push(`ينقصه متطلبات أساسية: ${missingMust.join("، ")}`);
  }

  if (parts.length === 0) {
    parts.push("لم يتم العثور على أدلة قوية، نوصي بمراجعة يدوية");
  }

  return `${cvLabel}: ${parts.join(". ")}`;
}

export class AnalysisService {
  constructor(private readonly cvService: CvService, private readonly jobService: JobService) {}

  private async loadContext(jobId: string, cvIds: string[]): Promise<LoadedContext> {
    const job = this.jobService.getJob(jobId);
    if (!job) {
      throw new Error("JOB_NOT_FOUND");
    }

    const cvs = await this.cvService.findByIds(cvIds);
    if (cvs.length === 0) {
      throw new Error("CVS_NOT_FOUND");
    }

    return { job, cvs };
  }

  async runBatch(payload: BatchAnalysisPayload): Promise<BatchAnalysisResponse> {
    const { job, cvs } = await this.loadContext(payload.jobId, payload.cvIds);
    const topK = Math.max(1, payload.topK ?? 3);

    const summary: AnalysisSummaryRow[] = cvs.map((cv) => {
      const matched: string[] = [];
      const mustMiss: string[] = [];
      const improve: string[] = [];
      let score = 0;

      job.requirements.forEach((requirement) => {
        const sourceText = `${cv.filename} ${cv.url ?? ""}`;
        const matchedRequirement = matchesRequirement(requirement, sourceText);

        if (matchedRequirement) {
          matched.push(requirement.requirement);
          score += requirement.weight * (requirement.must ? 2.2 : 1.3);
        } else if (requirement.must) {
          mustMiss.push(requirement.requirement);
          if (payload.strictMust) {
            score -= requirement.weight * 1.5;
          }
        } else {
          improve.push(requirement.requirement);
          score += requirement.weight * 0.2;
        }
      });

      const normalisedScore = Number(Math.max(score, 0).toFixed(2));
      const status = mustMiss.length > 0 ? "Requires Review" : "OK";

      return {
        cvId: cv.id,
        score: normalisedScore,
        status,
        mustMiss,
        improve,
        matchedExamples: matched,
      };
    });

    const sorted = summary
      .slice()
      .sort((a, b) => {
        if (a.mustMiss.length !== b.mustMiss.length) {
          return a.mustMiss.length - b.mustMiss.length;
        }
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.cvId.localeCompare(b.cvId);
      });

    const top: AnalysisTopEntry[] = sorted.slice(0, topK).map((row, index) => ({
      rank: index + 1,
      cvId: row.cvId,
      score: row.score,
      why: buildWhyText(row.cvId, row.matchedExamples ?? [], row.mustMiss),
    }));

    return {
      jobId: job.id,
      summaryTable: summary,
      top,
      tieBreakNotes: "نفضّل must ثم nice-to-have ثم الأدلة.",
    };
  }
}
