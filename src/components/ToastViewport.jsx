import { useEffect } from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { useUiStore } from "../store/ui.store.js";

const iconMap = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
};

export function ToastViewport() {
  const toasts = useUiStore((state) => state.toasts);
  const removeToast = useUiStore((state) => state.removeToast);

  useEffect(() => {
    const timers = toasts.map((toast) =>
      window.setTimeout(() => removeToast(toast.id), 4500),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [removeToast, toasts]);

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-50 flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type] || Info;

        return (
          <div
            key={toast.id}
            className="pointer-events-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-slate-100 p-2 text-brand-500">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{toast.title}</p>
                <p className="mt-1 text-sm text-slate-600">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 transition hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
