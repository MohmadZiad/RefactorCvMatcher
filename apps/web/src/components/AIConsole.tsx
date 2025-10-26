// =============================
// apps/web/src/components/AIConsole.tsx
// =============================
"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Paperclip,
  Send,
  FileText,
  Loader2,
  CheckCircle2,
  Sparkles,
  Trash2,
  Mic,
  MicOff,
  ShieldCheck,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cvApi } from "@/services/api/cv";
import { jobsApi, type JobRequirement } from "@/services/api/jobs";
import { analysesApi, type Analysis } from "@/services/api/analyses";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import RequirementPicker, {
  type ReqItem,
} from "@/components/RequirementPicker";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import { cn } from "@/lib/utils";

// ----------------------------------------
// Helpers
// ----------------------------------------

type Msg = {
  id: string;
  role: "bot" | "user" | "sys";
  content: React.ReactNode;
};

function getLangFromStorage(): Lang {
  try {
    if (typeof window !== "undefined") {
      return (window.localStorage.getItem("lang") as Lang) || "ar";
    }
  } catch {}
  return "ar";
}

function useLang(): Lang {
  const [lang, setLang] = useState<Lang>("ar");
  useEffect(() => {
    setLang(getLangFromStorage());
    const onStorage = () => setLang(getLangFromStorage());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return lang;
}

function parseRequirements(text: string): JobRequirement[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line
        .split(/[，,|،]/)
        .map((p) => p.trim())
        .filter(Boolean);
      const requirement = parts[0] || line;
      const mustHave = parts.some((p) => /^must/i.test(p) || /^ضروري/.test(p));
      const weightPart = parts.find((p) => /^\d+(\.\d+)?$/.test(p));
      const weight = weightPart ? Number(weightPart) : 1;
      return { requirement, mustHave, weight } as JobRequirement;
    });
}

function extractLines(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^[\s•\-–\d\.)]+/, "").trim())
    .filter(Boolean);
}

function useAutoScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const scrollToBottom = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);
  return { ref, scrollToBottom } as const;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="tag text-[11px] uppercase tracking-[0.2em] text-foreground/60">
      {children}
    </span>
  );
}

// ----------------------------------------
// AIConsole Component
// ----------------------------------------

export default function AIConsole() {
  const lang = useLang();
  const tt = (k: string) => t(lang, k);

  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "m0",
      role: "bot",
      content: (
        <div>
          <div className="font-semibold">{tt("chat.title")}</div>
          <div className="mt-1 text-sm opacity-80">{tt("chat.hello")}</div>
          <ul className="mt-2 list-disc ps-5 text-xs opacity-70">
            <li>
              1) اكتب المتطلبات (سطر لكل متطلب) مع must و/أو وزن (مثال: 2).
            </li>
            <li>2) ارفع الـCV (PDF/DOCX).</li>
            <li>3) اضغط {tt("chat.run")} لعرض النتيجة.</li>
          </ul>
        </div>
      ),
    },
  ]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reqText, setReqText] = useState("");
  const [reqs, setReqs] = useState<JobRequirement[]>([]);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [peekBreakdown, setPeekBreakdown] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  const { ref: listRef, scrollToBottom } = useAutoScroll<HTMLDivElement>();
  useEffect(() => scrollToBottom(), [messages, result, scrollToBottom]);

  const push = (m: Omit<Msg, "id">) =>
    setMessages((s) => [
      ...s,
      { ...m, id: Math.random().toString(36).slice(2) },
    ]);

  const onSendReqs = () => {
    if (!reqText.trim()) return;
    const parsed = parseRequirements(reqText);
    setReqs(parsed);
    push({
      role: "user",
      content: (
        <div>
          <div className="font-medium">Job Requirements</div>
          <ul className="mt-1 list-disc ps-5 text-sm">
            {parsed.map((r, i) => (
              <li key={i}>
                {r.requirement} {r.mustHave ? "• must" : ""}{" "}
                {r.weight !== 1 ? `• w=${r.weight}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ),
    });
    push({
      role: "bot",
      content: (
        <div className="text-sm">
          ✅ تم استلام المتطلبات. ارفع الـCV ثم اضغط {tt("chat.run")}.
        </div>
      ),
    });
    setReqText("");
  };

  const onQuickAdd = (item: ReqItem) => {
    const line = `${item.requirement}${item.mustHave ? ", must" : ""}, ${item.weight}`;
    setReqText((prev) => (prev ? `${prev}\n${line}` : line));
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    setCvFile(f);
    push({
      role: "user",
      content: (
        <div className="inline-flex items-center gap-2">
          <FileText className="size-4" />
          <span className="text-sm">{f.name}</span>
        </div>
      ),
    });
  };

  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startVoice = () => {
    try {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;
      if (!SpeechRecognition)
        return alert("متصفحك لا يدعم تحويل الكلام إلى نص.");
      const rec = new SpeechRecognition();
      rec.lang = lang === "ar" ? "ar-JO" : "en-US";
      rec.continuous = false;
      rec.interimResults = false;
      rec.onresult = (e: any) => {
        const txt = e.results?.[0]?.[0]?.transcript || "";
        if (txt) setReqText((p) => (p ? `${p}\n${txt}` : txt));
      };
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
      setListening(true);
      rec.start();
    } catch (_) {
      setListening(false);
    }
  };

  const stopVoice = () => {
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    setListening(false);
  };

  const handleAISuggest = async () => {
    if (!title.trim() && !description.trim() && !reqText.trim()) {
      const note =
        lang === "ar"
          ? "أدخل عنوانًا أو وصفًا للوظيفة قبل طلب الاقتراحات."
          : "Add a job title or description before asking for suggestions.";
      setAiFeedback(note);
      push({
        role: "bot",
        content: <div className="text-sm">{note}</div>,
      });
      return;
    }

    setAiFeedback(null);
    setAiSuggesting(true);

    try {
      const instructions =
        lang === "ar"
          ? "أنت مساعد توظيف يكتب متطلبات تقنية موجزة بالعربية. أعد قائمة مختصرة (حتى 8 عناصر) بعبارات تبدأ بفعل أو وصف المهارة. اشِر إلى (must) إذا كانت ضرورية، وضع رقم الوزن بين 1-3 في نهاية السطر بهذا الشكل: , must, 2."
          : "You are a hiring assistant that writes concise technical requirements in English. Return up to 8 bullet-style lines, each optionally marking must-have items with 'must' and ending with a numeric weight like ', must, 2'.";

      const userPrompt = [
        lang === "ar" ? `عنوان الوظيفة: ${title || "—"}` : `Job title: ${title || "—"}`,
        lang === "ar"
          ? `وصف الوظيفة: ${description || "—"}`
          : `Job description: ${description || "—"}`,
        reqText.trim()
          ? lang === "ar"
            ? `متطلبات مبدئية:
${reqText}`
            : `Draft requirements:
${reqText}`
          : lang === "ar"
            ? "لا توجد متطلبات مبدئية."
            : "No draft requirements provided.",
        lang === "ar"
          ? "أعطني المتطلبات المقترحة كسطور منفصلة."
          : "Provide the suggested requirements as separate lines.",
      ].join("\n\n");

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang,
          intent: "requirements",
          context: {
            title,
            description,
          },
          messages: [
            { role: "system", content: instructions },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || "failed");
      }

      const text = await response.text();
      const lines = extractLines(text).slice(0, 12);

      if (!lines.length) {
        throw new Error(lang === "ar" ? "لم يتم العثور على اقتراحات." : "No suggestions were returned.");
      }

      const suggestionBlock = lines.join("\n");
      setReqText(suggestionBlock);
      const parsed = parseRequirements(suggestionBlock);
      setReqs(parsed);
      setAiFeedback(
        lang === "ar"
          ? "تم توليد المتطلبات. راجعها ثم اضغط على تأكيد المتطلبات."
          : "Suggestions ready – review then confirm the requirements.",
      );
      push({
        role: "bot",
        content: (
          <div>
            <div className="font-semibold">
              {lang === "ar" ? "اقتراحات الذكاء" : "AI Suggestions"}
            </div>
            <ul className="mt-1 list-disc ps-5 text-xs opacity-75">
              {lines.slice(0, 6).map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        ),
      });
    } catch (error: any) {
      const message =
        typeof error?.message === "string" && error.message
          ? error.message
          : lang === "ar"
            ? "تعذر جلب الاقتراحات."
            : "Could not fetch suggestions.";
      setAiFeedback(message);
      push({
        role: "bot",
        content: <div className="text-sm text-destructive">{message}</div>,
      });
    } finally {
      setAiSuggesting(false);
    }
  };

  const run = async () => {
    if (!cvFile || reqs.length === 0) {
      push({
        role: "bot",
        content: (
          <div className="text-sm">
            {lang === "ar"
              ? "رجاءً أدخل المتطلبات وارفع CV أولًا."
              : "Please add requirements and upload a CV first."}
          </div>
        ),
      });
      return;
    }
    setLoading(true);
    setResult(null);
    push({
      role: "user",
      content: (
        <div className="inline-flex items-center gap-2">
          <Send className="size-4" /> {tt("chat.run")}
        </div>
      ),
    });

    try {
      const job = await jobsApi.create({
        title: title || (lang === "ar" ? "وظيفة بدون عنوان" : "Untitled Job"),
        description: description || "—",
        requirements: reqs,
      });
      const uploaded = await cvApi.upload(cvFile);
      push({
        role: "sys",
        content: (
          <div
            aria-live="polite"
            className="inline-flex items-center gap-2 text-xs opacity-70"
          >
            <Loader2 className="size-4 animate-spin" /> {tt("chat.running")}
          </div>
        ),
      });
      const a = await analysesApi.run({ jobId: job.id, cvId: uploaded.cvId });
      const final = await analysesApi.get(a.id);
      setResult(final);
      push({
        role: "bot",
        content: (
          <div>
            <div className="inline-flex items-center gap-2 text-success">
              <CheckCircle2 className="size-5" /> {tt("chat.done")}
            </div>
            <div className="mt-2 text-sm">
              <b>{tt("chat.score")}</b>:{" "}
              {typeof final.score === "number" ? final.score.toFixed(2) : "-"} /
              10
            </div>
            {Array.isArray(final.breakdown) && (
              <div className="mt-3 max-h-56 overflow-auto rounded-2xl border border-border/40">
                <table className="w-full text-xs">
                  <thead className="bg-muted/60 text-muted-foreground dark:bg-muted/30">
                    <tr>
                      <th className="p-2 text-start">Requirement</th>
                      <th className="p-2">Must</th>
                      <th className="p-2">W</th>
                      <th className="p-2">Sim%</th>
                      <th className="p-2">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {final.breakdown.map((r: any, i: number) => (
                      <tr
                        key={i}
                        className="border-t border-border/30"
                      >
                        <td className="p-2">{r.requirement}</td>
                        <td className="p-2 text-center">
                          {r.mustHave ? "✓" : "—"}
                        </td>
                        <td className="p-2 text-center">{r.weight}</td>
                        <td className="p-2 text-center">
                          {(r.similarity * 100).toFixed(1)}%
                        </td>
                        <td className="p-2 text-center">
                          {r.score10?.toFixed?.(2) ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {final.gaps && (
              <div className="mt-3 space-y-1 text-xs opacity-80">
                <div>
                  <b>{tt("chat.gaps")}</b>
                </div>
                <div>
                  must-missing: {final.gaps.mustHaveMissing?.join(", ") || "—"}
                </div>
                <div>improve: {final.gaps.improve?.join(", ") || "—"}</div>
              </div>
            )}
          </div>
        ),
      });
    } catch (e: any) {
      push({
        role: "bot",
        content: (
          <div className="text-sm text-destructive">
            Error: {e?.message || "failed"}
          </div>
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative mx-auto max-w-5xl">
      <div className="surface space-y-6 p-5 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.35em] text-foreground/50">
              AI Workflow
            </p>
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
              {tt("chat.title")}
            </h2>
            <p className="text-sm text-foreground/60">
              {tt("chat.hello")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-foreground/60">
            <Chip>
              <ShieldCheck className="size-3" /> Zero-trust
            </Chip>
            <Chip>
              <Info className="size-3" /> Beta
            </Chip>
            <Chip>
              <Sparkles className="size-3" /> Motion-ready
            </Chip>
          </div>
        </div>

        <div
          ref={listRef}
          className="rounded-[26px] border border-border/60 bg-card/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-md dark:border-border/40 dark:bg-card/40"
          aria-live="polite"
        >
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-lg ring-1 ring-inset",
                  m.role === "user" &&
                    "ms-auto bg-gradient-to-br from-primary via-primary/90 to-secondary text-primary-foreground ring-white/10",
                  m.role === "bot" &&
                    "me-auto bg-card/90 text-foreground ring-foreground/8 dark:bg-card/50",
                  m.role === "sys" &&
                    "mx-auto bg-muted/70 text-muted-foreground text-xs ring-transparent dark:bg-muted/30",
                )}
              >
                {m.content}
              </motion.div>
            ))}
          </AnimatePresence>

          {result && (
            <div className="me-auto mt-3 max-w-[80%] rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success shadow-sm">
              <div className="text-sm">
                <b>{tt("chat.score")}:</b> {result.score?.toFixed?.(2) ?? "-"} /
                10
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {result.gaps?.mustHaveMissing?.map((g) => (
                  <Chip key={"m" + g}>Must: {g}</Chip>
                ))}
                {result.gaps?.improve?.map((g) => (
                  <Chip key={"i" + g}>Improve: {g}</Chip>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Control */}
        <div className="grid gap-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder={lang === "ar" ? "Job Title (اختياري)" : "Job Title (optional)"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12 rounded-2xl"
              dir="auto"
            />
            <Input
              placeholder={
                lang === "ar"
                  ? "Job Description (اختياري)"
                  : "Job Description (optional)"
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-12 rounded-2xl"
              dir="auto"
            />
          </div>

          <div className="rounded-[26px] border border-border/60 bg-card/80 p-4 shadow-sm dark:border-border/40 dark:bg-card/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-foreground/40">
                  {lang === "ar" ? "تفاصيل المتطلبات" : "Requirements"}
                </p>
                <p className="text-sm text-foreground/60">
                  {lang === "ar"
                    ? "سطر لكل متطلب • استخدم must / وزن إن احتجت"
                    : "One requirement per line • add must / weight if needed"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAISuggest}
                  loading={aiSuggesting}
                  className="gap-2"
                >
                  <Sparkles className="size-4" />
                  {lang === "ar" ? "اقترح المتطلبات بالذكاء" : "AI Suggest"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={onSendReqs} className="gap-2">
                  <CheckCircle2 className="size-4" />
                  {lang === "ar" ? "تأكيد المتطلبات" : "Confirm Requirements"}
                </Button>
              </div>
            </div>

            {aiFeedback && (
              <p className="mt-2 text-xs text-foreground/60" dir="auto">
                {aiFeedback}
              </p>
            )}

            <div className="mt-4">
              <RequirementPicker onAdd={onQuickAdd} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <TextArea
                value={reqText}
                onChange={(e) => setReqText(e.target.value)}
                rows={5}
                placeholder={
                  lang === "ar"
                    ? `مثال:\nReact, must, 2\nTypeScript, 1\nTailwind`
                    : `Example:\nReact, must, 2\nTypeScript, 1\nTailwind`
                }
                className="min-h-[164px] rounded-2xl font-mono text-xs leading-relaxed"
                dir="auto"
              />
              <div className="flex flex-col gap-2 sm:items-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onSendReqs}
                  className="whitespace-nowrap"
                >
                  {lang === "ar" ? "أضف المتطلبات" : "Add Requirements"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setReqText("")}>
                  {lang === "ar" ? "مسح" : "Clear"}
                </Button>
              </div>
            </div>

            {reqs.length > 0 && (
              <div className="mt-4 rounded-2xl border border-border/50 bg-card/85 p-4 shadow-sm dark:border-border/40 dark:bg-card/40">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.28em] text-foreground/60">
                    {lang === "ar" ? "متطلبات" : "Requirements"} ({reqs.length})
                  </div>
                  <button
                    onClick={() => setExpanded((v) => !v)}
                    className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.28em] text-foreground/50 transition hover:text-foreground"
                  >
                    {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    {lang === "ar" ? "عرض" : "Toggle"}
                  </button>
                </div>
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                        {reqs.map((r, i) => (
                          <li
                            key={i}
                      className="flex items-center justify-between rounded-xl border border-border/40 bg-card/80 px-3 py-2 text-xs text-foreground/80 shadow-sm dark:border-border/40 dark:bg-card/50"
                    >
                      <span className="truncate">
                        {r.requirement}
                        {r.mustHave && (
                          <span className="ms-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-700">
                                  must
                                </span>
                              )}
                              {r.weight !== 1 && (
                                <span className="ms-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700">
                                  w{r.weight}
                                </span>
                              )}
                            </span>
                            <button
                              onClick={() =>
                                setReqs((prev) => prev.filter((_, idx) => idx !== i))
                              }
                              className="text-rose-500 transition hover:text-rose-600"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant={listening ? "secondary" : "ghost"}
                    onClick={listening ? stopVoice : startVoice}
                    className="gap-2"
                  >
                    {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                    {listening
                      ? lang === "ar"
                        ? "إيقاف الإملاء"
                        : "Stop Dictation"
                      : lang === "ar"
                        ? "إضافة صوتية"
                        : "Voice Add"}
                  </Button>
                  <p className="text-xs text-foreground/50">
                    {lang === "ar"
                      ? "استخدم صوتك لإضافة المتطلبات بسرعة."
                      : "Use voice dictation to add skills instantly."}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3 border-t border-border/40 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <label
                htmlFor="cvfile"
                className="group inline-flex cursor-pointer items-center gap-3 rounded-2xl border border-border/60 bg-card/80 px-4 py-2 text-sm text-foreground/70 shadow-sm transition hover:border-primary/40 hover:text-foreground dark:border-border/40 dark:bg-card/50"
              >
                <span className="grid size-9 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-soft">
                  <Paperclip className="size-4" />
                </span>
                <input
                  id="cvfile"
                  type="file"
                  accept=".pdf,.docx"
                  onChange={onPickFile}
                  className="hidden"
                />
                <span className="max-w-[220px] truncate text-start">
                  {cvFile
                    ? cvFile.name
                    : lang === "ar"
                      ? "أرفق CV (PDF/DOCX)"
                      : "Attach CV (PDF/DOCX)"}
                </span>
              </label>

              <div className="flex items-center gap-2 sm:justify-end">
                <Button onClick={run} disabled={loading} className="gap-2">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  {loading
                    ? lang === "ar"
                      ? "جاري العمل…"
                      : "Working…"
                    : tt("chat.run")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-xs uppercase tracking-[0.4em] text-foreground/40">
        Next.js • Tailwind • Motion
      </p>
    </section>
  );
}
