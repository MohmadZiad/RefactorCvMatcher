"use client";

import clsx from "clsx";
import { useEffect, type ReactNode } from "react";

type ModalProps = {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  children?: ReactNode;
};

export function Modal({ title, description, open, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="text-right">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={clsx(
              "rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition",
              "hover:bg-slate-100"
            )}
          >
            إغلاق
          </button>
        </div>

        {children && <div className="mt-4 max-h-[60vh] overflow-y-auto text-right text-sm leading-7">{children}</div>}
      </div>
    </div>
  );
}
