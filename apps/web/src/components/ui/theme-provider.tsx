"use client";

import * as React from "react";
import { ThemeProvider as NextThemeProvider } from "next-themes";

type Props = React.ComponentProps<typeof NextThemeProvider>;

export type Lang = "ar" | "en";

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

const LangContext = React.createContext<LangContextValue | undefined>(undefined);

function getInitialLang(): Lang {
  if (typeof document !== "undefined") {
    const attribute = document.documentElement.getAttribute("lang");
    if (attribute === "ar" || attribute === "en") return attribute as Lang;
  }
  return "ar";
}

export function ThemeProvider({ children, ...props }: Props) {
  const [lang, setLangState] = React.useState<Lang>(getInitialLang);
  const langRef = React.useRef<Lang>(lang);

  const updateDom = React.useCallback((next: Lang) => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.setAttribute("lang", next);
      root.setAttribute("dir", next === "ar" ? "rtl" : "ltr");
      root.dataset.lang = next;

      if (document.body) {
        document.body.setAttribute("dir", next === "ar" ? "rtl" : "ltr");
        document.body.dataset.lang = next;
      }
    }
  }, []);

  const persistAndEmit = React.useCallback((next: Lang) => {
    if (typeof window === "undefined") return;
    const storage = window.localStorage;
    if (storage.getItem("lang") !== next) storage.setItem("lang", next);
    window.dispatchEvent(new CustomEvent<Lang>("lang-change", { detail: next }));
  }, []);

  const setLang = React.useCallback(
    (next: Lang) => {
      if (langRef.current === next) {
        updateDom(next);
        return;
      }
      langRef.current = next;
      setLangState(next);
      updateDom(next);
      persistAndEmit(next);
    },
    [persistAndEmit, updateDom],
  );

  React.useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const storageValue = (window.localStorage.getItem("lang") as Lang | null) ?? langRef.current;
    const domValue = (document.documentElement.getAttribute("lang") as Lang | null) ?? storageValue;
    const initial = domValue === "ar" || domValue === "en" ? domValue : "ar";

    langRef.current = initial;
    setLangState(initial);
    updateDom(initial);

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== "lang" || !event.newValue) return;
      const value = event.newValue === "ar" || event.newValue === "en" ? (event.newValue as Lang) : "ar";
      if (langRef.current === value) return;
      langRef.current = value;
      setLangState(value);
      updateDom(value);
    };

    const handleCustom = (event: Event) => {
      const custom = event as CustomEvent<Lang>;
      const value = custom.detail;
      if (!value || (value !== "ar" && value !== "en") || langRef.current === value) return;
      langRef.current = value;
      setLangState(value);
      updateDom(value);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("lang-change", handleCustom as EventListener);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("lang-change", handleCustom as EventListener);
    };
  }, [updateDom]);

  const contextValue = React.useMemo<LangContextValue>(() => ({ lang, setLang }), [lang, setLang]);

  return (
    <LangContext.Provider value={contextValue}>
      <NextThemeProvider
        attribute="class"
        storageKey="theme"
        enableSystem
        defaultTheme="system"
        disableTransitionOnChange
        themes={["light", "dark"]}
        {...props}
      >
        {children}
      </NextThemeProvider>
    </LangContext.Provider>
  );
}

export function useLang() {
  const context = React.useContext(LangContext);
  if (!context) throw new Error("useLang must be used within ThemeProvider");
  return context;
}
