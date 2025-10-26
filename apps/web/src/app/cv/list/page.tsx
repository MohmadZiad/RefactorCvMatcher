"use client";
import * as React from "react";
import { cvApi, type CV, buildPublicUrl } from "@/services/api/cv";
import { Button } from "@/components/ui/Button";

export default function CVList() {
  const [items, setItems] = React.useState<CV[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    cvApi
      .list()
      .then((r) => setItems(r.items))
      .catch((e) => alert(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold">قائمة السير الذاتية</h1>

      {loading ? (
        <div className="rounded-xl border border-border/50 bg-card/80 p-6 text-center shadow-sm dark:border-border/40 dark:bg-card/40">
          Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/50 bg-card/80 p-8 text-center text-sm text-muted-foreground shadow-sm dark:border-border/40 dark:bg-card/40">
          لا توجد ملفات بعد. ارفع أول CV من صفحة الرفع.
        </div>
      ) : (
        <ul className="divide-y divide-border/40 rounded-2xl border border-border/60 bg-card/80 shadow-sm backdrop-blur dark:border-border/40 dark:bg-card/40">
          {items.map((i) => {
            const publicUrl = buildPublicUrl(i);
            const created = i.createdAt
              ? new Date(i.createdAt).toLocaleString()
              : "—";
            return (
              <li key={i.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{i.id.slice(0, 8)}…</span>
                  <span className="text-sm text-muted-foreground">
                    {i.originalFilename || "بدون اسم"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {publicUrl && (
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm underline"
                    >
                      عرض الملف
                    </a>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {created}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(i.id).catch(() => {});
                    }}
                  >
                    نسخ المعرّف
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
