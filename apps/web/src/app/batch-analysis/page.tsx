"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import { Modal } from "@/components/ui/Modal";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/lib/hooks/useToast";
import { cn } from "@/lib/utils";

const MAX_CVS = Number(process.env.NEXT_PUBLIC_MAX_CVS ?? 50);

type CvRecord = {
  id: string;
  filename: string;
  url?: string | null;
};

type JobRequirement = {
  requirement: string;
  must: boolean;
  weight: number;
};

type JobRecord = {
  id: string;
  title: string;
  description: string;
  requirements?: JobRequirement[];
};

type AnalysisSummaryRow = {
  cvId: string;
  score: number;
  status: string;
  mustMiss: string[];
  improve: string[];
  matchedExamples?: string[];
};

type AnalysisTopEntry = {
  rank: number;
  cvId: string;
  score: number;
  why: string;
};

type BatchAnalysisResponse = {
  jobId: string;
  summaryTable: AnalysisSummaryRow[];
  top: AnalysisTopEntry[];
  tieBreakNotes?: string;
};

type EvidenceState = {
  open: boolean;
  cvId?: string;
  items?: string[];
};

type CvListResponse = { items: CvRecord[] } | CvRecord[];

function normaliseCvResponse(payload: CvListResponse): CvRecord[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  return payload.items ?? [];
}

export default function BatchAnalysisPage() {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [job, setJob] = useState<JobRecord | null>(null);
  const [jobLoading, setJobLoading] = useState(false);

  const [allCvs, setAllCvs] = useState<CvRecord[]>([]);
  const [selectedCvIds, setSelectedCvIds] = useState<string[]>([]);
  const [cvSearch, setCvSearch] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [result, setResult] = useState<BatchAnalysisResponse | null>(null);
  const [evidence, setEvidence] = useState<EvidenceState>({ open: false });

  const dropRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { messages, dismiss, push } = useToast();

  const filteredCvs = useMemo(() => {
    if (!cvSearch) return allCvs;
    const query = cvSearch.toLowerCase();
    return allCvs.filter((cv) => {
      const haystack = `${cv.filename ?? ""} ${cv.id} ${cv.url ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [allCvs, cvSearch]);

  const loadCvs = useCallback(async () => {
    try {
      const payload = await apiFetch<CvListResponse>("/api/cv");
      const items = normaliseCvResponse(payload);
      setAllCvs(items);
    } catch (error) {
      const message = error instanceof Error ? error.message : "تعذر تحميل السير الذاتية";
      push({
        title: "فشل تحميل السير الذاتية",
        description: message,
        variant: "error",
      });
    }
  }, [push]);

  useEffect(() => {
    void loadCvs();
  }, [loadCvs]);

  const handleJobCreate = useCallback(async () => {
    if (!jobTitle.trim() || !jobDescription.trim()) {
      push({
        title: "أكمل بيانات الوظيفة",
        description: "الرجاء إدخال العنوان ووصف الوظيفة قبل الإنشاء.",
        variant: "error",
      });
      return;
    }

    setJobLoading(true);
    try {
      const created = await apiFetch<JobRecord>("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: jobTitle.trim(), description: jobDescription.trim() }),
      });
      setJob(created);
      push({
        title: "تم إنشاء الوظيفة بنجاح",
        description: `ID: ${created.id}`,
        variant: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "فشل إنشاء الوظيفة";
      push({ title: "تعذر إنشاء الوظيفة", description: message, variant: "error" });
    } finally {
      setJobLoading(false);
    }
  }, [jobDescription, jobTitle, push]);

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const record = await apiFetch<CvRecord>("/api/cv/upload", {
          method: "POST",
          body: formData,
        });
        push({
          title: "تم رفع السيرة الذاتية",
          description: record.filename,
          variant: "success",
        });
        await loadCvs();
        setSelectedCvIds((prev) => {
          if (prev.includes(record.id)) return prev;
          const next = [...prev, record.id];
          return next.slice(0, MAX_CVS);
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "فشل رفع الملف";
        push({ title: "تعذر رفع السيرة الذاتية", description: message, variant: "error" });
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [loadCvs, push]
  );

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        void handleUpload(file);
      }
    },
    [handleUpload]
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.target === dropRef.current) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file) {
        void handleUpload(file);
      }
    },
    [handleUpload]
  );

  const toggleSelect = useCallback(
    (cvId: string) => {
      setSelectedCvIds((prev) => {
        if (prev.includes(cvId)) {
          return prev.filter((id) => id !== cvId);
        }
        if (prev.length >= MAX_CVS) {
          push({
            title: `لا يمكنك اختيار أكثر من ${MAX_CVS} سير ذاتية`,
            variant: "error",
          });
          return prev;
        }
        return [...prev, cvId];
      });
    },
    [push]
  );

  const runBatchAnalysis = useCallback(async () => {
    if (!job) {
      push({ title: "أنشئ الوظيفة أولًا", variant: "error" });
      return;
    }
    if (selectedCvIds.length === 0) {
      push({ title: "اختر السير الذاتية", description: "حدد ملفًا واحدًا على الأقل للتحليل", variant: "error" });
      return;
    }

    setAnalysisLoading(true);
    try {
      const payload = {
        jobId: job.id,
        cvIds: selectedCvIds.slice(0, MAX_CVS),
        topK: 3,
        strictMust: true,
      };
      const response = await apiFetch<BatchAnalysisResponse>("/api/analyses/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setResult(response);
      push({ title: "تم اكتمال التحليل", description: "أفضل النتائج جاهزة" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "تعذر تشغيل التحليل";
      push({ title: "خطأ أثناء التحليل", description: message, variant: "error" });
    } finally {
      setAnalysisLoading(false);
    }
  }, [job, push, selectedCvIds]);

  const selectedChips = useMemo(() => {
    return selectedCvIds.map((id) => {
      const label = allCvs.find((cv) => cv.id === id)?.filename ?? id;
      return { id, label };
    });
  }, [allCvs, selectedCvIds]);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#fffaf4] via-[#fff3df] to-[#ffe0c2] py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,153,0,0.08),transparent),radial-gradient(circle_at_80%_0%,rgba(249,115,22,0.12),transparent)]" />
      <div className="relative z-10 mx-auto max-w-6xl space-y-10 px-6">
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-orange-600">تحليل دفعة من السير الذاتية</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-foreground/70">
            اصنع وصف الوظيفة، ارفع السير الذاتية، ثم شغّل تحليلاً جماعيًا يحاكي تجربة منصات الاحتراف مثل LinkedIn.
          </p>
        </div>

        <section className="rounded-[36px] border border-orange-200/60 bg-white/80 p-8 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex-1 space-y-4">
              <header className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-orange-700">تعريف الوظيفة</h2>
                {job?.id && (
                  <span className="rounded-full bg-emerald-100 px-4 py-1 text-xs font-semibold text-emerald-700">
                    تم الإنشاء • ID: {job.id}
                  </span>
                )}
              </header>

              <div className="space-y-3 text-right">
                <input
                  type="text"
                  dir="rtl"
                  placeholder="عنوان الوظيفة — مثال: مهندس برمجيات الواجهة"
                  className="w-full rounded-3xl border border-orange-200/60 bg-white/70 px-5 py-3 text-sm shadow-inner focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  value={jobTitle}
                  onChange={(event) => setJobTitle(event.target.value)}
                />
                <textarea
                  dir="rtl"
                  placeholder="ألصق وصف الوظيفة الكامل، البنود والمهارات، أو متطلبات الوظيفة باللغة العربية أو الإنجليزية"
                  className="w-full min-h-[160px] rounded-3xl border border-orange-200/60 bg-white/70 px-5 py-4 text-sm leading-7 shadow-inner focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handleJobCreate()}
                  disabled={jobLoading}
                  className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {jobLoading ? "... جاري الإنشاء" : "إنشاء الوظيفة"}
                </button>
                <p className="text-xs text-foreground/60">
                  سنقترح المتطلبات تلقائيًا فور الإنشاء، مع تمييز الضروري بلون مختلف.
                </p>
              </div>
            </div>
          </div>

          {job?.requirements && job.requirements.length > 0 && (
            <div className="mt-6 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/50">
                المتطلبات المستنتجة
              </p>
              <div className="flex flex-wrap justify-end gap-2" dir="rtl">
                {job.requirements.map((item) => (
                  <span
                    key={`${item.requirement}-${item.must}`}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold",
                      item.must
                        ? "bg-red-100/80 text-red-700 border border-red-200"
                        : "bg-amber-100/70 text-amber-700 border border-amber-200"
                    )}
                  >
                    {item.requirement}
                    <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-medium text-foreground/70">
                      {item.must ? "Must" : "Nice"} • وزن {item.weight}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-[36px] border border-orange-200/60 bg-white/80 p-8 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex-1 space-y-6">
              <header className="flex flex-col items-start justify-between gap-3 text-right md:flex-row md:items-center">
                <div>
                  <h2 className="text-xl font-semibold text-orange-700">السير الذاتية</h2>
                  <p className="text-xs text-foreground/60">
                    اختر حتى {MAX_CVS} ملفًا (المختار: {selectedCvIds.length}). كل رفع يضاف تلقائيًا للقائمة المختارة.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    dir="rtl"
                    type="search"
                    placeholder="ابحث بالاسم أو الرابط"
                    className="w-52 rounded-full border border-orange-200/60 bg-white/70 px-4 py-2 text-xs focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                    value={cvSearch}
                    onChange={(event) => setCvSearch(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full border border-orange-300 bg-white px-4 py-2 text-xs font-semibold text-orange-700 shadow-sm transition hover:bg-orange-50"
                  >
                    اختيار ملف
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.rtf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </header>

              <div
                ref={dropRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-10 text-center transition",
                  isDragging ? "border-orange-400 bg-amber-50/70" : "border-orange-200/80 bg-white/60"
                )}
              >
                <p className="text-sm font-semibold text-orange-600">اسحب الملف وأفلته هنا</p>
                <p className="text-xs text-foreground/60">
                  يدعم PDF وWord. لا يتم تجاوز الحد الأعلى، ستظهر رسالة عند بلوغه.
                </p>
                {uploading && <span className="text-xs text-orange-500">... جاري الرفع</span>}
              </div>

              {selectedChips.length > 0 && (
                <div className="flex flex-wrap justify-end gap-2" dir="rtl">
                  {selectedChips.map((chip) => (
                    <span
                      key={chip.id}
                      className="inline-flex items-center gap-2 rounded-full bg-orange-100/80 px-4 py-1 text-xs font-medium text-orange-800"
                    >
                      {chip.label}
                      <button
                        type="button"
                        onClick={() => toggleSelect(chip.id)}
                        className="rounded-full bg-orange-200/90 px-2 py-0.5 text-[10px] font-semibold text-orange-900 transition hover:bg-orange-300"
                      >
                        إزالة
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2" dir="rtl">
                {filteredCvs.map((cv) => {
                  const selected = selectedCvIds.includes(cv.id);
                  return (
                    <button
                      key={cv.id}
                      type="button"
                      onClick={() => toggleSelect(cv.id)}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-3xl border px-5 py-4 text-right shadow-sm transition",
                        selected
                          ? "border-amber-400 bg-amber-50"
                          : "border-orange-100 bg-white hover:border-orange-300 hover:bg-orange-50"
                      )}
                    >
                      <div className="w-full text-sm font-semibold text-slate-800">
                        {cv.filename || cv.id}
                      </div>
                      <div className="flex w-full items-center justify-between gap-2 text-[11px] text-foreground/60">
                        <span>ID: {cv.id}</span>
                        {cv.url && (
                          <a
                            href={cv.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="rounded-full border border-orange-200/70 px-3 py-1 text-[10px] font-semibold text-orange-700 transition hover:bg-orange-50"
                          >
                            فتح الرابط
                          </a>
                        )}
                      </div>
                      <span
                        className={cn(
                          "mt-1 rounded-full px-3 py-1 text-[10px] font-semibold",
                          selected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {selected ? "✓ مُضاف" : "اضغط للإضافة"}
                      </span>
                    </button>
                  );
                })}
                {filteredCvs.length === 0 && (
                  <div className="col-span-full rounded-3xl border border-orange-100/70 bg-white/70 p-6 text-center text-sm text-foreground/50">
                    لا توجد سير ذاتية مطابقة للبحث الحالي.
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => void runBatchAnalysis()}
                  disabled={analysisLoading || !job || selectedCvIds.length === 0}
                  className="w-full rounded-3xl bg-gradient-to-r from-orange-500 to-amber-400 py-4 text-lg font-semibold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {analysisLoading ? "... جاري التحليل" : "بدء التحليل الجماعي"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {result && (
          <section className="space-y-10 rounded-[36px] border border-orange-200/60 bg-white/85 p-8 shadow-xl backdrop-blur">
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-orange-700">أفضل المرشحين</h3>
              <p className="mt-2 text-sm text-foreground/60">عرض لأعلى 3 ملفات متوافقة مع الوظيفة المحددة.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3" dir="rtl">
              {result.top.map((entry) => (
                <div
                  key={entry.cvId}
                  className="rounded-3xl border border-orange-100 bg-gradient-to-br from-white via-white to-amber-50/80 p-6 text-right shadow-md"
                >
                  <div className="flex items-center justify-between text-xs text-orange-500">
                    <span>المرتبة #{entry.rank}</span>
                    <span>الدرجة {entry.score}</span>
                  </div>
                  <h4 className="mt-2 text-lg font-semibold text-slate-800">{entry.cvId}</h4>
                  <p className="mt-3 text-sm leading-7 text-foreground/70">{entry.why}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-orange-100/70 bg-white/90 p-4 shadow" dir="rtl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-right text-sm">
                  <thead className="sticky top-0 bg-white text-xs font-semibold uppercase tracking-[0.3em] text-orange-600">
                    <tr>
                      <th className="p-3">CV</th>
                      <th className="p-3">Score</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3">Must Missing</th>
                      <th className="p-3">التحسينات</th>
                      <th className="p-3">الأدلة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100/60">
                    {result.summaryTable.map((row) => (
                      <tr key={row.cvId} className="align-top">
                        <td className="p-3 text-sm font-semibold text-slate-800">{row.cvId}</td>
                        <td className="p-3 text-sm font-semibold text-orange-600">{row.score}</td>
                        <td className="p-3 text-xs font-semibold text-foreground/70">{row.status}</td>
                        <td className="p-3 text-xs text-red-600">
                          {row.mustMiss.length > 0 ? row.mustMiss.join("، ") : "لا يوجد"}
                        </td>
                        <td className="p-3 text-xs text-amber-700">
                          {row.improve.length > 0 ? row.improve.join("، ") : "لا يوجد"}
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() =>
                              setEvidence({
                                open: true,
                                cvId: row.cvId,
                                items: row.matchedExamples ?? [],
                              })
                            }
                            className="rounded-full border border-orange-200 px-3 py-1 text-[11px] font-semibold text-orange-700 transition hover:bg-orange-50"
                          >
                            عرض الأدلة
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {result.tieBreakNotes && (
                <p className="mt-4 text-center text-xs text-foreground/60">{result.tieBreakNotes}</p>
              )}
            </div>
          </section>
        )}
      </div>

      <ToastContainer messages={messages} onDismiss={dismiss} />
      <Modal
        title={`الأدلة المطابقة${evidence.cvId ? ` • ${evidence.cvId}` : ""}`}
        description="تفاصيل الكلمات أو الأدلة التي ساهمت في رفع التقييم"
        open={evidence.open}
        onClose={() => setEvidence({ open: false })}
      >
        {evidence.items && evidence.items.length > 0 ? (
          <ul className="space-y-2">
            {evidence.items.map((item, index) => (
              <li key={`${item}-${index}`} className="rounded-2xl bg-amber-50/80 px-4 py-2 text-sm text-foreground/70">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-foreground/60">لا توجد أدلة مسجّلة لهذا الملف. نوصي بالمراجعة اليدوية.</p>
        )}
      </Modal>
    </div>
  );
}
