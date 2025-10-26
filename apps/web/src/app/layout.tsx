// apps/web/src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import {
  Plus_Jakarta_Sans as PlusJakartaSans,
  Tajawal,
  JetBrains_Mono as JetBrainsMono,
} from "next/font/google";
import "./globals.css";
import Topbar from "@/components/ui/Topbar";
import Chatbot from "@/components/Chatbot";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Fonts:
 * - نستخدم next/font لحقن متغيرات CSS (بدون FOUT)
 * - متوافقة مع المتغيرات المستخدمة في globals.css
 */
const display = PlusJakartaSans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const sans = PlusJakartaSans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const arabic = Tajawal({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const mono = JetBrainsMono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/**
 * Metadata + Viewport
 */
export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "CV Matcher",
  description: "Premium bilingual CV matching console with instant insights.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8ff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b10" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* تهيئة مبكرة للّغة/الاتجاه والثيم لتجنب الفلاش */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  try {
    var root = document.documentElement;
    var storage = window.localStorage;
    var lang = storage.getItem("lang") || root.getAttribute("lang") || "ar";
    var theme = storage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    root.setAttribute("lang", lang);
    root.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    root.dataset.lang = lang;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.dataset.theme = theme;
    if (document.body) {
      document.body.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
      document.body.dataset.lang = lang;
    }
  } catch (error) {}
})();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={cn(
          "min-h-dvh bg-background font-sans text-foreground antialiased",
          display.variable,
          sans.variable,
          arabic.variable,
          mono.variable,
          "relative overflow-x-hidden"
        )}
      >
        <ThemeProvider>
          <a href="#main" className="skip-link">
            تخط إلى المحتوى / Skip to content
          </a>

          {/* خلفيات زخرفية لطيفة */}
          <div className="pointer-events-none fixed inset-0 -z-30">
            <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_100%_0%,rgba(249,115,22,0.16),transparent_45%),radial-gradient(140%_140%_at_0%_100%,rgba(255,189,135,0.18),transparent_52%)]" />
            <div
              aria-hidden
              className="absolute left-1/2 top-[-28rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-[conic-gradient(from_140deg_at_50%_50%,rgba(249,115,22,0.28),rgba(255,189,135,0.24),rgba(255,223,199,0.22),rgba(249,115,22,0.28))] opacity-70 blur-3xl dark:opacity-60"
            />
            <div
              aria-hidden
              className="absolute right-[12%] top-[20%] h-56 w-56 rounded-[40%] bg-gradient-to-br from-primary/35 via-secondary/25 to-transparent blur-2xl dark:from-primary/30 dark:via-secondary/20"
            />
            <div
              aria-hidden
              className="absolute left-[18%] bottom-[12%] h-72 w-72 rounded-[50%] bg-gradient-to-br from-accent/25 via-primary/18 to-transparent blur-2xl dark:from-accent/18 dark:via-primary/15"
            />
          </div>

          <div className="pointer-events-none fixed inset-x-0 top-0 z-[-10] h-40 bg-gradient-to-b from-background via-background/70 to-transparent dark:from-[#120d0a] dark:via-[#120d0a]/75" />

          <div className="relative z-10 flex min-h-dvh flex-col">
            <Topbar />

            <main id="main" className="relative z-10 flex-1 pb-24 pt-10">
              <div className="container">
                <div className="mx-auto w-full max-w-6xl space-y-12 md:space-y-16">
                  {children}
                </div>
              </div>
            </main>

            <footer className="relative z-10 mt-auto bg-transparent pb-12">
              <div className="container">
                <div className="group mx-auto flex w-full max-w-5xl flex-col gap-5 rounded-[2rem] border border-border/50 bg-card/85 p-6 shadow-soft backdrop-blur-2xl transition-colors dark:border-border/40 dark:bg-card/60 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-secondary text-primary-foreground shadow-[0_18px_45px_-30px_rgba(249,115,22,0.65)]">
                      <span className="text-xl">⚡</span>
                      <span
                        className="absolute inset-0 rounded-2xl bg-white/30 opacity-0 transition-opacity duration-500 group-hover:opacity-40"
                        aria-hidden
                      />
                    </div>
                    <div className="space-y-1 text-start">
                      <p className="font-display text-sm font-semibold tracking-[0.18em] text-foreground/70">
                        {process.env.NEXT_PUBLIC_APP_NAME || "CV Matcher"}
                      </p>
                      <p className="text-xs text-foreground/50">
                        {new Date().getFullYear()} © Crafted for bilingual, accessible talent intelligence.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-start gap-3 text-[11px] uppercase tracking-[0.4em] text-foreground/45 sm:justify-end">
                    <span>Next.js</span>
                    <span className="inline-block h-0.5 w-6 rounded-full bg-foreground/20" />
                    <span>Tailwind</span>
                    <span className="inline-block h-0.5 w-6 rounded-full bg-foreground/20" />
                    <span>Motion</span>
                  </div>
                </div>
              </div>
            </footer>
          </div>

          <Chatbot />
          <Toaster richColors position="top-center" expand />
        </ThemeProvider>
      </body>
    </html>
  );
}
