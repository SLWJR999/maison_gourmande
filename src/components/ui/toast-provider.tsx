"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  description?: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toast: (message: string, options?: { description?: string; tone?: ToastTone }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue["toast"]>(
    (message, options) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((current) => [
        ...current.slice(-2),
        {
          id,
          message,
          description: options?.description,
          tone: options?.tone ?? "success",
        },
      ]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
      }, 5000);
    },
    [],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-center gap-2 sm:left-auto sm:right-5 sm:top-5 sm:items-end"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-white p-4 shadow-float animate-fade-up",
              item.tone === "error" && "border-red-200",
              item.tone === "success" && "border-mauve-200",
              item.tone === "info" && "border-brown/15",
            )}
            role="status"
          >
            <span
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                item.tone === "success" && "bg-mauve-100 text-mauve-700",
                item.tone === "error" && "bg-red-50 text-red-600",
                item.tone === "info" && "bg-cream text-brown",
              )}
            >
              {item.tone === "success" ? (
                <CheckCircle2 className="h-4.5 w-4.5" size={18} />
              ) : item.tone === "error" ? (
                <XCircle size={18} />
              ) : (
                <Info size={18} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-brown">{item.message}</p>
              {item.description ? (
                <p className="mt-0.5 text-xs leading-relaxed text-brown-soft">
                  {item.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="rounded-full p-1 text-brown-light transition hover:bg-cream hover:text-brown"
              aria-label="Fermer la notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast doit être utilisé dans ToastProvider");
  return context;
}
