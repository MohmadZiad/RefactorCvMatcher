"use client";
import * as React from "react";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { motion } from "framer-motion";
import { BadgeCheck, Flame } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type ReqItem = {
  requirement: string;
  mustHave: boolean;
  weight: number;
};

type Props = {
  onAdd: (item: ReqItem) => void;
  recent?: string[]; // اختياري: لعرض آخر إضافات
  dir?: "rtl" | "ltr"; // اختياري: تحكّم بالاتجاه
};

const IT_WORDS: string[] = [
  // … (نفس القائمة عندك) …
  "React",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Express",
  "NestJS",
  "GraphQL",
  "REST",
  "Tailwind CSS",
  "Sass",
  "CSS3",
  "HTML5",
  "Vite",
  "Webpack",
  "Babel",
  "Redux",
  "Zustand",
  "TanStack Query",
  "RxJS",
  "Jest",
  "Vitest",
  "Playwright",
  "Cypress",
  "Testing Library",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "SQLite",
  "Prisma",
  "TypeORM",
  "Drizzle",
  "Redis",
  "ElasticSearch",
  "Kafka",
  "RabbitMQ",
  "AWS",
  "GCP",
  "Azure",
  "Cloudflare",
  "Vercel",
  "Netlify",
  "Docker",
  "Kubernetes",
  "Terraform",
  "CI/CD",
  "GitHub Actions",
  "GitLab CI",
  "CircleCI",
  "Authentication",
  "OAuth2",
  "JWT",
  "SAML",
  "OpenID Connect",
  "Security",
  "OWASP",
  "ZAP",
  "Snyk",
  "SonarQube",
  "WebSockets",
  "Socket.io",
  "gRPC",
  "tRPC",
  "Microservices",
  "Event-driven",
  "DDD",
  "Clean Architecture",
  "SOLID",
  "Performance",
  "Caching",
  "CDN",
  "SSR",
  "SSG",
  "ISR",
  "i18n",
  "RTL",
  "Accessibility",
  "SEO",
  "Analytics",
  "Python",
  "Django",
  "Flask",
  "FastAPI",
  "Go",
  "Rust",
  "C#",
  ".NET",
  "Java",
  "Spring Boot",
  "Kotlin",
  "Agile",
  "Scrum",
  "Kanban",
  "Jira",
  "Confluence",
  "AI",
  "LLM",
  "Prompt Engineering",
  "RAG",
  "Embeddings",
  "Vector DB",
  "pgvector",
  "OpenAI API",
  "LangChain",
  "Whisper",
  "Vision",
  "Mobile",
  "React Native",
  "Expo",
  "PWA",
  "Design Systems",
  "Storybook",
  "Figma",
  "Shadcn UI",
  "Radix UI",
  "Logging",
  "Observability",
  "OpenTelemetry",
  "Sentry",
  "Datadog",
];

const WEIGHTS = [
  { value: 1, label: "w1", description: "أولوية عادية" },
  { value: 2, label: "w2", description: "أولوية متقدمة" },
  { value: 3, label: "w3", description: "حرج للوظيفة" },
];

export default function RequirementPicker({
  onAdd,
  recent = [],
  dir = "rtl",
}: Props) {
  const [q, setQ] = React.useState("");
  const [must, setMust] = React.useState(true);
  const [weight, setWeight] = React.useState(1);
  const [activeIndex, setActiveIndex] = React.useState(0);

  // بحث محسّن + ترتيب النتائج: يبدأ بالمطابقات البادئة ثم يحتوي
  const list = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return IT_WORDS.slice(0, 28);
    const starts: string[] = [];
    const contains: string[] = [];
    for (const w of IT_WORDS) {
      const lw = w.toLowerCase();
      if (lw.startsWith(s)) starts.push(w);
      else if (lw.includes(s)) contains.push(w);
    }
    return [...starts, ...contains];
  }, [q]);

  // لتقليل الضوضاء عند الكتابة: debounce إدخال البحث
  const debouncedSetQ = useDebouncedCallback(setQ, 140);

  const handleAdd = React.useCallback(
    (item: string) => {
      onAdd({ requirement: item, mustHave: must, weight });
    },
    [must, onAdd, weight]
  );

  // تنقل لوحة المفاتيح في الشبكة + Enter للإضافة
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!list.length) return;
    const cols = 2; // نفس grid-cols-2
    if (e.key === "ArrowRight")
      setActiveIndex((i) => Math.min(i + 1, list.length - 1));
    if (e.key === "ArrowLeft") setActiveIndex((i) => Math.max(i - 1, 0));
    if (e.key === "ArrowDown")
      setActiveIndex((i) => Math.min(i + cols, list.length - 1));
    if (e.key === "ArrowUp") setActiveIndex((i) => Math.max(i - cols, 0));
    if (e.key === "Home") setActiveIndex(0);
    if (e.key === "End") setActiveIndex(list.length - 1);
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd(list[activeIndex]);
    }
  };

  const highlight = React.useCallback(
    (text: string) => {
      const s = q.trim();
      if (!s) return text;
      const i = text.toLowerCase().indexOf(s.toLowerCase());
      if (i === -1) return text;
      return (
        <>
          {text.slice(0, i)}
          <mark className="rounded bg-primary/20 px-0.5">
            {text.slice(i, i + s.length)}
          </mark>
          {text.slice(i + s.length)}
        </>
      );
    },
    [q]
  );

  return (
    <section className="surface" dir={dir} aria-labelledby="req-lib-title">
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs tracking-[0.3em] text-foreground/50 [dir=ltr]:uppercase">
            Library
          </p>
          <h3
            id="req-lib-title"
            className="mt-1 text-base font-semibold text-foreground"
          >
            متطلبات جاهزة للوظائف التقنية
          </h3>
        </div>
        <span className="tag" aria-hidden>
          <Flame size={14} /> Top Skills
        </span>
      </div>

      {/* شريط تحكم */}
      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
        <Input
          aria-label="ابحث عن مهارة"
          inputMode="search"
          placeholder="ابحث عن React، DevOps…"
          className="h-11 rounded-xl"
          dir="auto"
          onChange={(e) => debouncedSetQ(e.target.value)}
        />

        {/* Must / Nice كزر مقسّم بدل checkbox لظهور الحالة */}
        <div
          role="group"
          aria-label="الأهمية"
          className="flex rounded-xl border border-border/60 bg-card/80 p-1 shadow-sm dark:border-border/40 dark:bg-card/50"
        >
          <ToggleChip
            pressed={must}
            onClick={() => setMust(true)}
            label="Must"
            ariaPressedLabel="مطلوب"
          />
          <ToggleChip
            pressed={!must}
            onClick={() => setMust(false)}
            label="Nice"
            ariaPressedLabel="محبّذ"
          />
        </div>

        {/* الأوزان */}
        <div
          role="group"
          aria-label="الوزن"
          className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/80 px-2 py-2 shadow-sm dark:border-border/40 dark:bg-card/50"
        >
          {WEIGHTS.map((w) => (
            <Button
              key={w.value}
              variant={w.value === weight ? "primary" : "ghost"}
              size="sm"
              aria-pressed={w.value === weight}
              title={w.description}
              className={cn(
                "h-8 rounded-lg px-3 text-[11px] uppercase tracking-[0.3em]",
                w.value === weight ? "shadow-soft" : "text-foreground/60"
              )}
              onClick={() => setWeight(w.value)}
            >
              {w.label}
            </Button>
          ))}
        </div>
      </div>

      {/* حديثًا */}
      {!!recent.length && (
        <div className="mt-3 flex flex-wrap gap-2">
          {recent.slice(0, 6).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleAdd(r)}
              className="chip text-xs"
              title="إضافة سريعة"
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {/* القائمة */}
      <div
        className="mt-5"
        onKeyDown={onKeyDown}
        role="grid"
        aria-label="قائمة المهارات"
        aria-rowcount={Math.ceil(list.length / 2)}
      >
        <ScrollArea.Root className="h-48 w-full overflow-hidden rounded-2xl border border-border/50 bg-card/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] dark:border-border/40 dark:bg-card/40">
          <ScrollArea.Viewport className="h-full w-full p-3">
            {list.length === 0 ? (
              <EmptyState query={q} />
            ) : (
              <div className="grid grid-cols-2 gap-2" role="rowgroup">
                {list.map((item, i) => (
                  <motion.button
                    key={item}
                    role="gridcell"
                    aria-label={`${item} • ${must ? "must" : "nice"} • ${
                      WEIGHTS.find((w) => w.value === weight)?.label
                    }`}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAdd(item)}
                    className={cn(
                      "group flex h-[58px] flex-col justify-center rounded-xl border border-border/50 bg-card/85 px-3 text-start text-xs font-medium text-foreground/80 transition hover:border-primary/40 hover:bg-primary/5 dark:border-border/40 dark:bg-card/50",
                      i === activeIndex && "ring-2 ring-ring"
                    )}
                    onMouseEnter={() => setActiveIndex(i)}
                  >
                    <span>{highlight(item)}</span>
                    <span className="mt-1 flex items-center gap-1 text-[10px] uppercase tracking-[0.25em] text-foreground/40">
                      <BadgeCheck size={12} /> {must ? "Must" : "Nice"} •{" "}
                      {WEIGHTS.find((w) => w.value === weight)?.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            )}
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar
            orientation="vertical"
            className="flex touch-none select-none bg-transparent p-1"
          >
            <ScrollArea.Thumb className="flex-1 rounded-full bg-gradient-to-b from-primary/60 to-secondary/60" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </div>

      <p className="mt-4 text-[11px] text-foreground/50">
        اضغط على أي مهارة لإضافتها مباشرة إلى متطلبات الوظيفة. سيتم حفظ حالة
        must والوزن الحالية.
      </p>
    </section>
  );
}

/* ---------- مكوّنات مساعدة صغيرة ---------- */

function ToggleChip({
  pressed,
  onClick,
  label,
  ariaPressedLabel,
}: {
  pressed: boolean;
  onClick: () => void;
  label: string;
  ariaPressedLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={cn(
        "chip h-8 rounded-lg px-3 text-[11px] uppercase tracking-[0.3em]",
        pressed ? "border-border bg-card text-foreground" : "text-foreground/60"
      )}
    >
      {label}
      <span className="sr-only">{pressed ? `: ${ariaPressedLabel}` : ""}</span>
    </button>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="grid h-full place-items-center text-center text-sm text-foreground/60">
      {query.trim() ? (
        <div>
          لا توجد نتائج لـ <span className="font-medium">{query}</span>.
          <div className="mt-1 text-xs text-foreground/50">
            جرّب كلمة عامة أو مرادفًا آخر.
          </div>
        </div>
      ) : (
        <div>لا عناصر للعرض.</div>
      )}
    </div>
  );
}

/* ---------- Hook: debounce بسيط ---------- */
function useDebouncedCallback<T extends (...args: any[]) => void>(
  fn: T,
  ms = 120
) {
  const ref = React.useRef<number | null>(null);
  return React.useCallback(
    (...args: Parameters<T>) => {
      if (ref.current) window.clearTimeout(ref.current);
      ref.current = window.setTimeout(() => fn(...args), ms);
    },
    [fn, ms]
  );
}
