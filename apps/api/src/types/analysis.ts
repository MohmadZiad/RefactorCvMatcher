import type { CvRecord } from "./cv";
import type { JobRecord } from "./job";

export type AnalysisSummaryRow = {
  cvId: string;
  score: number;
  status: string;
  mustMiss: string[];
  improve: string[];
  matchedExamples?: string[];
};

export type AnalysisTopEntry = {
  rank: number;
  cvId: string;
  score: number;
  why: string;
};

export type BatchAnalysisPayload = {
  jobId: string;
  cvIds: string[];
  topK?: number;
  strictMust?: boolean;
};

export type BatchAnalysisResponse = {
  jobId: string;
  summaryTable: AnalysisSummaryRow[];
  top: AnalysisTopEntry[];
  tieBreakNotes: string;
};

export type LoadedContext = {
  job: JobRecord;
  cvs: CvRecord[];
};
