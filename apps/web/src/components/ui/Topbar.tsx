"use client";

import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Languages, Moon, Sparkles, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useLang, type Lang } from "@/components/ui/theme-provider";

type LangOption = {
  value: Lang;
  label: string;
  badge: string;
  description: Record<Lang, string>;
};

const LANG_OPTIONS: LangOption[] = [
  {
    value: "ar",
    label: "العربية",
    badge: "RTL",
    description: {
      ar: "واجهة عربية كاملة من اليمين إلى اليسار",
      en: "Right-to-left Arabic interface",
    },
  },
  {
    value: "en",
    label: "English",
    badge: "LTR",
    description: {
      ar: "واجهة إنجليزية من اليسار إلى اليمين",
      en: "Left-to-right English interface",
    },
  },
];

const TEXT = {
  ar: {
    brand: "مطابق السير الذاتية",
    tagline: "مساحة موحدة لتحليل السير الذاتية ومتطلبات الوظائف لحظيًا.",
    beta: "MVP",
    language: "اللغة",
    theme: "المظهر",
    light: "فاتح",
    dark: "داكن",
    themeTooltip: "تبديل نمط الألوان",
  },
  en: {
    brand: "CV Matcher Console",
    tagline: "Unified workspace for instant CV-to-job intelligence.",
    beta: "Beta",
    language: "Language",
    theme: "Appearance",
    light: "Light",
    dark: "Dark",
    themeTooltip: "Toggle color theme",
  },
} satisfies Record<Lang, Record<string, string>>;

export default function Topbar() {
  const { lang, setLang } = useLang();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const strings = TEXT[lang];
  const isDark = resolvedTheme === "dark";

  const toggleTheme = React.useCallback(() => {
    const next = (isDark ? "light" : "dark") as "light" | "dark";
    setTheme(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme", next);
      window.dispatchEvent(new CustomEvent("theme-change", { detail: next === "dark" }));
    }
  }, [isDark, setTheme]);

  return (
    <Tooltip.Provider delayDuration={120} skipDelayDuration={0} disableHoverableContent>
      <header className="sticky top-0 z-50 pb-4">
        <div className="container">
          <div className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-[2.25rem] border border-border/60 bg-card/85 px-5 py-4 shadow-soft transition-colors supports-[backdrop-filter]:backdrop-blur-[28px] dark:border-border/40 dark:bg-card/60">
            {/* خلفية تفاعلية خفيفة */}
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-transparent to-secondary/20" />
              <motion.div
                aria-hidden
                className="absolute left-1/2 top-[-40%] h-56 w-56 -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/22 via-secondary/20 to-transparent blur-3xl"
                animate={{ rotate: [0, 12, -8, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
              />
            </div>

            {/* علامة وبراندينغ */}
            <div className="flex items-center gap-4">
              <div className="relative flex size-12 items-center justify-center rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-secondary text-primary-foreground shadow-[0_20px_45px_-30px_rgba(249,115,22,0.55)]">
                <Sparkles size={18} />
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-3xl bg-white/35"
                  initial={{ opacity: 0.4, scale: 0.8 }}
                  animate={{ opacity: 0.18, scale: 1.2 }}
                  transition={{ duration: 3.6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                />
              </div>
              <div className="flex flex-col gap-1 text-start">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-lg font-semibold tracking-tight text-foreground dark:text-white">
                    {strings.brand}
                  </p>
                  <span className="chip hidden md:inline-flex">{strings.beta}</span>
                </div>
                <p className="max-w-[26rem] text-xs text-foreground/60 dark:text-foreground/70 md:text-sm">
                  {strings.tagline}
                </p>
              </div>
            </div>

            {/* أدوات: اللغة + الثيم */}
            <div className="flex items-center gap-2">
              {/* لغة */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <Button variant="glass" size="sm" className="gap-3 px-4 py-2.5">
                    <Languages size={16} />
                    <span className="flex flex-col items-start leading-tight">
                      <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/50">
                        {strings.language}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.28em]">
                        {lang.toUpperCase()}
                      </span>
                    </span>
                    <motion.span
                      aria-hidden
                      layoutId="topbar-lang-indicator"
                      className="absolute inset-x-3 bottom-1 h-px rounded-full bg-gradient-to-r from-transparent via-primary/60 to-transparent"
                    />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    sideOffset={12}
                    align="end"
                    className="z-50 min-w-[220px] overflow-hidden rounded-2xl border border-border/60 bg-card/90 p-1.5 shadow-soft backdrop-blur-2xl dark:border-border/40 dark:bg-card/60"
                  >
                    <DropdownMenu.Label className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-foreground/50 dark:text-white/50">
                      {strings.language}
                    </DropdownMenu.Label>
                    <div className="space-y-1.5">
                      {LANG_OPTIONS.map((option) => {
                        const active = option.value === lang;
                        const description = option.description[lang];
                        return (
                          <DropdownMenu.Item
                            key={option.value}
                            onSelect={() => setLang(option.value)}
                            className={cn(
                              "relative flex cursor-pointer flex-col gap-1 rounded-xl px-3 py-2.5 text-start text-xs font-medium text-foreground/70 outline-none transition hover:bg-primary/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:text-foreground/80 dark:hover:bg-primary/10",
                              active && "text-primary",
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold">{option.label}</span>
                              <span
                                className={cn(
                                  "rounded-full px-2 py-[2px] text-[10px] font-semibold uppercase tracking-[0.3em]",
                                  active
                                    ? "bg-primary/20 text-primary"
                                    : "bg-muted/60 text-muted-foreground dark:bg-muted/30",
                                )}
                              >
                                {option.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-foreground/55 dark:text-white/55">{description}</p>
                            <AnimatePresence>
                              {active && (
                                <motion.span
                                  layoutId="lang-active-glow"
                                  className="pointer-events-none absolute inset-0 -z-10 rounded-xl bg-primary/10"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ type: "spring", stiffness: 210, damping: 24 }}
                                />
                              )}
                            </AnimatePresence>
                          </DropdownMenu.Item>
                        );
                      })}
                    </div>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>

              {/* ثيم */}
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Button variant="glass" size="sm" className="gap-3 px-4 py-2.5" onClick={toggleTheme}>
                    <span className="relative flex items-center justify-center">
                      <AnimatePresence mode="wait" initial={false}>
                        {isDark ? (
                          <motion.span
                            key="sun"
                            initial={{ rotate: -45, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 45, opacity: 0 }}
                            transition={{ duration: 0.28, ease: "easeOut" }}
                          >
                            <SunMedium size={16} />
                          </motion.span>
                        ) : (
                          <motion.span
                            key="moon"
                            initial={{ rotate: 45, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -45, opacity: 0 }}
                            transition={{ duration: 0.28, ease: "easeOut" }}
                          >
                            <Moon size={16} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                    <span className="flex flex-col items-start leading-tight">
                      <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/50">
                        {strings.theme}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.28em]">
                        {mounted ? (isDark ? strings.dark : strings.light) : ""}
                      </span>
                    </span>
                    <motion.span
                      aria-hidden
                      layoutId="topbar-theme-indicator"
                      className="absolute inset-x-3 bottom-1 h-px rounded-full bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                    />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content className="rounded-lg border border-border/50 bg-card/90 px-3 py-1 text-xs text-foreground shadow backdrop-blur dark:border-border/40 dark:bg-card/60">
                  {strings.themeTooltip}
                </Tooltip.Content>
              </Tooltip.Root>
            </div>
          </div>
        </div>
      </header>
    </Tooltip.Provider>
  );
}
