"use client";

import { useCallback, useMemo, useState } from "react";

export type ToastVariant = "success" | "error" | "info";

export type ToastMessage = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

const DEFAULT_DURATION = 5000;

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `toast_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function useToast() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);

  const push = useCallback(
    (message: Omit<ToastMessage, "id">) => {
      const id = createId();
      const next: ToastMessage = {
        id,
        duration: DEFAULT_DURATION,
        variant: "info",
        ...message,
      };

      setMessages((current) => [...current, next]);

      if (next.duration && next.duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, next.duration);
      }
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      push,
      dismiss,
      messages,
    }),
    [dismiss, messages, push]
  );

  return api;
}
