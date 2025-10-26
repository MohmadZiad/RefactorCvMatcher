// apps/web/src/components/ui/ScoreGauge.tsx
"use client";

import * as React from "react";
import type { Lang } from "@/components/ui/theme-provider";

type Props = {
  value: number;
  size?: number;
};

const LABELS: Record<Lang, { heading: string; sub: string }> = {
  ar: { heading: "نتيجة التطابق", sub: "من 10" },
  en: { heading: "Match score", sub: "out of 10" },
};

export default function ScoreGauge({ value, size = 160 }: Props) {
  const clamped = Math.max(0, Math.min(10, Number.isFinite(value) ? Number(value) : 0));
  const radius = size / 2 - 14;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * (clamped / 10);
  const remainder = circumference - progress;

  const gradientId = React.useId();
  const glowId = React.useId();

  // مزامنة اللغة مع <html lang="...">
  const [lang, setLang] = React.useState<Lang>(() => {
    if (typeof document !== "undefined") {
      const attribute = document.documentElement.getAttribute("lang");
      if (attribute === "en") return "en";
    }
    return "ar";
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const update = (next?: Lang | null) => {
      const resolved = next ?? ((document.documentElement.getAttribute("lang") as Lang | null) ?? "ar");
      if (resolved === "ar" || resolved === "en") setLang((prev) => (prev === resolved ? prev : resolved));
    };

    update();

    const handleLangEvent = (event: Event) => {
      const custom = event as CustomEvent<Lang>;
      update(custom.detail ?? null);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "lang" && event.newValue) update(event.newValue as Lang);
    };

    window.addEventListener("lang-change", handleLangEvent as EventListener);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("lang-change", handleLangEvent as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Ticks حول الدائرة
  const ticks = React.useMemo(() => {
    const segments = 40;
    return Array.from({ length: segments }).map((_, index) => {
      const angle = (index / segments) * Math.PI * 2;
      const isMajor = index % 5 === 0;
      const inner = radius - (isMajor ? 6 : 4);
      const outer = radius - (isMajor ? 1 : 2);
      const x1 = size / 2 + inner * Math.cos(angle);
      const y1 = size / 2 + inner * Math.sin(angle);
      const x2 = size / 2 + outer * Math.cos(angle);
      const y2 = size / 2 + outer * Math.sin(angle);
      return { x1, y1, x2, y2, key: index, isMajor };
    });
  }, [radius, size]);

  const labels = LABELS[lang];
  const score = clamped.toFixed(1);

  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={10}
      aria-valuenow={Number(score)}
      aria-valuetext={`${score} / 10`}
      className="relative isolate flex w-full max-w-xs flex-col items-center justify-center gap-4"
      style={{ width: size + 24 }}
    >
      {/* خلفية ناعمة */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 rounded-[48px] bg-gradient-to-br from-primary/20 via-secondary/15 to-transparent blur-3xl"
      />

      <div className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="block drop-shadow-[0_12px_40px_rgba(59,130,246,0.15)]"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(var(--primary))" />
              <stop offset="50%" stopColor="rgb(var(--secondary))" />
              <stop offset="100%" stopColor="rgb(var(--accent))" />
            </linearGradient>
            <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Ticks */}
          <g strokeLinecap="round">
            {ticks.map((tick) => (
              <line
                key={tick.key}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke={tick.isMajor ? "rgba(148,163,184,0.5)" : "rgba(148,163,184,0.25)"}
                strokeWidth={tick.isMajor ? 2 : 1}
              />
            ))}
          </g>

          {/* المسار الخلفي */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(148,163,184,0.2)"
            strokeWidth={12}
            fill="none"
          />

          {/* التقدّم */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={`${progress} ${remainder}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            fill="none"
            filter={`url(#${glowId})`}
            style={{ transition: "stroke-dasharray 0.6s ease, stroke 0.6s ease" }}
          />
        </svg>

        {/* الرقم في المركز */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-semibold text-4xl tracking-tight text-foreground md:text-[2.8rem]">
            {score}
          </span>
          <span className="text-[0.7rem] uppercase tracking-[0.45em] text-foreground/50">/ 10</span>
        </div>

        <div
          aria-hidden
          className="absolute inset-4 -z-10 rounded-full bg-gradient-to-br from-primary/15 via-secondary/10 to-transparent blur-2xl"
        />
      </div>

      {/* عناوين تحت العداد */}
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-sm font-semibold text-foreground dark:text-white">{labels.heading}</span>
        <span className="text-[0.7rem] uppercase tracking-[0.35em] text-foreground/50 dark:text-white/50">
          {labels.sub}
        </span>
      </div>
    </div>
  );
}
