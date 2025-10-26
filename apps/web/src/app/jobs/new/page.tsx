"use client";
import * as React from "react";
import { jobsApi, type JobRequirement } from "@/services/api/jobs";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";

export default function NewJob() {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [reqs, setReqs] = React.useState<JobRequirement[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  const addReq = () =>
    setReqs((r) => [...r, { requirement: "", mustHave: true, weight: 1 }]);

  const updateReq = (idx: number, patch: Partial<JobRequirement>) =>
    setReqs((r) => r.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const removeReq = (idx: number) =>
    setReqs((r) => r.filter((_, i) => i !== idx));

  const onSubmit = async () => {
    try {
      setSubmitting(true);
      await jobsApi.create({ title, description, requirements: reqs });
      window.location.href = `/analysis/run`;
    } catch (e: any) {
      alert(e?.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">وظيفة جديدة</h1>
        <div className="text-sm text-muted-foreground">
          كل الحقول اختيارية ما عدا العنوان والوصف
        </div>
      </header>

      <section className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-semibold" htmlFor="job-title">
            العنوان
          </label>
          <Input
            id="job-title"
            placeholder="مثال: Senior React Engineer"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            dir="auto"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold" htmlFor="job-desc">
            الوصف
          </label>
          <TextArea
            id="job-desc"
            placeholder="اكتب الوصف أو الصق JD..."
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            dir="auto"
          />
          <p className="text-xs text-muted-foreground">
            سيمكنك لاحقًا توليد المتطلبات تلقائيًا من الوصف.
          </p>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur dark:border-border/40 dark:bg-card/40">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">المتطلبات</h2>
          <Button onClick={addReq} type="button">
            + إضافة متطلب
          </Button>
        </div>

        <div className="grid gap-3">
          {reqs.length === 0 && (
            <div className="rounded-lg border border-dashed border-border/50 bg-card/70 p-6 text-center text-sm text-muted-foreground dark:border-border/40 dark:bg-card/40">
              لا توجد متطلبات بعد — أضف أول متطلب.
            </div>
          )}

          {reqs.map((r, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border/50 bg-card/85 p-3 shadow-sm transition hover:shadow-md dark:border-border/40 dark:bg-card/50"
            >
              <div className="grid gap-3 md:grid-cols-12 md:items-center">
                <div className="md:col-span-6">
                  <Input
                    placeholder="Requirement (مثال: React, Next.js...)"
                    value={r.requirement}
                    onChange={(e) =>
                      updateReq(idx, { requirement: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center gap-2 md:col-span-3">
                  <input
                    id={`must-${idx}`}
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={r.mustHave}
                    onChange={(e) =>
                      updateReq(idx, { mustHave: e.target.checked })
                    }
                  />
                  <label htmlFor={`must-${idx}`} className="text-sm">
                    must-have
                  </label>
                </div>

                <div className="flex items-center gap-2 md:col-span-2">
                  <label className="text-sm text-muted-foreground">الوزن</label>
                  <input
                    aria-label="الوزن"
                    type="number"
                    step="0.1"
                    min={0}
                    className="w-24 rounded-md border border-border/50 bg-card/90 px-2 py-1 text-sm text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:border-border/40 dark:bg-card/50"
                    value={r.weight}
                    onChange={(e) =>
                      updateReq(idx, { weight: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="md:col-span-1">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => removeReq(idx)}
                  >
                    حذف
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="sticky bottom-6 mt-8 flex justify-end">
        <Button
          onClick={onSubmit}
          disabled={!title || !description || submitting}
          loading={submitting}
        >
          حفظ
        </Button>
      </div>
    </div>
  );
}
