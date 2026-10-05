"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

type ToastKind = "success" | "error";
type ToastItem = { id: number; kind: ToastKind; message: string };

const DURATION_MS = 3500;
const MAX_VISIBLE = 3;

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++nextId.current;
      setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), { id, kind, message }]);
      setTimeout(() => dismissToast(id), DURATION_MS);
    },
    [dismissToast],
  );

  return { toasts, showToast, dismissToast };
}

type ToasterProps = {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
};

export function Toaster({ toasts, onDismiss }: ToasterProps) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => {
        const Icon = toast.kind === "success" ? CircleCheck : CircleAlert;
        return (
          <div
            key={toast.id}
            role={toast.kind === "error" ? "alert" : "status"}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-stone-900 py-3 pl-4 pr-2 text-sm text-white shadow-xl shadow-stone-900/20 motion-safe:animate-toast-in"
          >
            <Icon
              className={`size-5 shrink-0 ${toast.kind === "success" ? "text-emerald-400" : "text-rose-400"}`}
              aria-hidden
            />
            <p className="min-w-0 flex-1 [overflow-wrap:anywhere]">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Tutup notifikasi"
              className="-my-1 grid size-11 shrink-0 place-items-center rounded-full text-stone-400 transition hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
