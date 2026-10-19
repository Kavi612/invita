"use client";

import React, { createContext, useContext, useSyncExternalStore } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

type ToastListener = () => void;

let toastsState: ToastItem[] = [];
const listeners = new Set<ToastListener>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot() {
  return toastsState;
}

const EMPTY_TOASTS: ToastItem[] = [];

function getServerSnapshot(): ToastItem[] {
  return EMPTY_TOASTS;
}

export const toast = {
  show(title: string, options?: { description?: string; type?: ToastType; duration?: number }) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const duration = options?.duration ?? 4500;
    const item: ToastItem = {
      id,
      title,
      description: options?.description,
      type: options?.type || "info",
      duration,
    };

    toastsState = [...toastsState, item];
    notify();

    if (duration > 0) {
      setTimeout(() => {
        toast.dismiss(id);
      }, duration);
    }
    return id;
  },
  success(title: string, description?: string) {
    return toast.show(title, { description, type: "success" });
  },
  error(title: string, description?: string) {
    return toast.show(title, { description, type: "error", duration: 6000 });
  },
  warning(title: string, description?: string) {
    return toast.show(title, { description, type: "warning" });
  },
  info(title: string, description?: string) {
    return toast.show(title, { description, type: "info" });
  },
  dismiss(id: string) {
    toastsState = toastsState.filter((t) => t.id !== id);
    notify();
  },
  clear() {
    toastsState = [];
    notify();
  },
};

const ToastContext = createContext<{
  toasts: ToastItem[];
  dismiss: (id: string) => void;
}>({
  toasts: [],
  dismiss: toast.dismiss,
});

export function useToast() {
  return useContext(ToastContext);
}

export function Toaster() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
            item.type === "success"
              ? "bg-emerald-950/90 border-emerald-700/60 text-emerald-100"
              : item.type === "error"
              ? "bg-red-950/90 border-red-700/60 text-red-100"
              : item.type === "warning"
              ? "bg-amber-950/90 border-amber-700/60 text-amber-100"
              : "bg-zinc-900/90 border-zinc-700/60 text-zinc-100"
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {item.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {item.type === "error" && <AlertCircle className="w-5 h-5 text-red-400" />}
            {item.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-400" />}
            {item.type === "info" && <Info className="w-5 h-5 text-sky-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold leading-tight">{item.title}</h4>
            {item.description && (
              <p className="mt-1 text-xs opacity-90 leading-relaxed break-words">{item.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => toast.dismiss(item.id)}
            className="shrink-0 -mr-1 -mt-1 p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-white/10 transition-colors"
            aria-label="Dismiss toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
