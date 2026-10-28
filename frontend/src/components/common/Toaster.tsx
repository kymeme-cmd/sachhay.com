// ============================================================
// Component: Toaster - Hiển thị các toast đang hoạt động
// ============================================================

import { Link } from "react-router-dom";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { useToastStore, type ToastType } from "@/store/toast";

const styles: Record<ToastType, { icon: JSX.Element; color: string }> = {
  success: { icon: <CheckCircle size={20} />, color: "text-green-600" },
  error: { icon: <AlertCircle size={20} />, color: "text-red-600" },
  info: { icon: <Info size={20} />, color: "text-blue-600" },
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div
      aria-live="polite"
      className="fixed z-[60] bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex items-start gap-3 rounded-xl bg-light border border-gray-200 shadow-lg px-4 py-3 animate-slide-up"
        >
          <span className={`mt-0.5 ${styles[t.type].color}`}>{styles[t.type].icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800">{t.message}</p>
            {t.action && (
              <Link
                to={t.action.to}
                onClick={() => dismiss(t.id)}
                className="inline-block mt-1 text-sm font-semibold text-accent hover:underline"
              >
                {t.action.label} →
              </Link>
            )}
          </div>
          <button onClick={() => dismiss(t.id)} className="text-gray-400 hover:text-gray-600" aria-label="Đóng thông báo">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
