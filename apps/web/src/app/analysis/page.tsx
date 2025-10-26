"use client";
import * as React from "react";
import { cvApi } from "@/services/api/cv";
import { jobsApi } from "@/services/api/jobs";
import { analysesApi } from "@/services/api/analyses";
import { Button } from "@/components/ui/Button";

export default function RunAnalysis() {
  const [cvs, setCvs] = React.useState<any[]>([]);
  const [jobs, setJobs] = React.useState<any[]>([]);
  const [cvId, setCvId] = React.useState("");
  const [jobId, setJobId] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    Promise.all([cvApi.list(), jobsApi.list()])
      .then(([cvRes, jobRes]) => {
        setCvs(cvRes.items);
        setJobs(jobRes.items);
      })
      .catch((e) => setErr(e?.message || "Failed"));
  }, []);

  const run = async () => {
    setLoading(true);
    try {
      const a = await analysesApi.run({ jobId, cvId });
      window.location.href = `/analysis/${a.id}`;
    } catch (e: any) {
      alert(e?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/85 px-6 py-8 shadow-soft backdrop-blur dark:border-border/40 dark:bg-card/50">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_120%_at_0%_0%,rgba(249,115,22,0.18),transparent),radial-gradient(50%_120%_at_100%_100%,rgba(255,189,135,0.16),transparent)]" />
        <p className="text-xs uppercase tracking-[0.32em] text-foreground/50">Orchestrate Analysis</p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">تشغيل التحليل</h1>
        <p className="mt-2 max-w-xl text-sm text-foreground/60">
          اختر سيرة ذاتية ووظيفة للمطابقة والحصول على النتيجة التفصيلية. الواجهة تحافظ على نفس التدفق، لكن بتجربة متطورة وحديثة.
        </p>
      </header>

      {err && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive shadow-sm">
          {err}
        </div>
      )}

      <div className="rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-soft backdrop-blur dark:border-border/40 dark:bg-card/40">
        <div className="grid gap-5">
          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.28em] text-foreground/50">CV</label>
            <select
              value={cvId}
              onChange={(e) => setCvId(e.target.value)}
              className="w-full rounded-2xl border border-border/60 bg-card/90 px-4 py-3 text-sm text-foreground/80 shadow-ring focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:border-border/40 dark:bg-card/50"
            >
              <option value="">— اختر CV —</option>
              {cvs.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.originalFilename || c.id.slice(0, 10)}
                </option>
              ))}
            </select>
            {cvs.length === 0 && (
              <p className="text-xs text-foreground/50">
                لا توجد سير — ارفع من صفحة <span className="font-semibold text-foreground">رفع السيرة الذاتية</span>.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.28em] text-foreground/50">Job</label>
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="w-full rounded-2xl border border-border/60 bg-card/90 px-4 py-3 text-sm text-foreground/80 shadow-ring focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:border-border/40 dark:bg-card/50"
            >
              <option value="">— اختر وظيفة —</option>
              {jobs.map((j: any) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
            {jobs.length === 0 && (
              <p className="text-xs text-foreground/50">
                لا توجد وظائف — أنشئ واحدة من صفحة <span className="font-semibold text-foreground">وظيفة جديدة</span>.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-muted/70 px-4 py-3 text-xs uppercase tracking-[0.3em] text-muted-foreground dark:border-border/40 dark:bg-muted/30">
            <span>متطلبات كاملة • لا تغيير في المنطق</span>
            <span>⚡ 10 ثواني تقريبًا</span>
          </div>

          <div className="pt-2">
            <Button onClick={run} disabled={!cvId || !jobId} loading={loading} className="w-full justify-center gap-2">
              حلّل الآن
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
