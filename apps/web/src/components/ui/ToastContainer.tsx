"use client";

import clsx from "clsx";

import type { ToastMessage } from "@/lib/hooks/useToast";

const VARIANT_STYLES: Record<string, string> = {
  success: "bg-emerald-500/90 text-white",
  error: "bg-red-500/90 text-white",
  info: "bg-slate-900/90 text-white",
};

type ToastContainerProps = {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
};

export function ToastContainer({ messages, onDismiss }: ToastContainerProps) {
  if (messages.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[1000] flex flex-col items-center gap-3 px-4">
      {messages.map((toast) => {
        const variantClass = VARIANT_STYLES[toast.variant ?? "info"] ?? VARIANT_STYLES.info;
        return (
          <div
            key={toast.id}
            className={clsx(
              "pointer-events-auto w-full max-w-md rounded-2xl px-5 py-3 shadow-xl backdrop-blur",
              variantClass
            )}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 text-right">
                <p className="text-sm font-semibold leading-tight">{toast.title}</p>
                {toast.description && (
                  <p className="mt-1 text-xs text-white/90 leading-relaxed">{toast.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-white/90 transition hover:bg-white/25"
              >
                إغلاق
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
