// ============================================================
// Toast Store (Zustand) - Thông báo nhỏ góc màn hình
// ============================================================

import { create } from "zustand";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  /** Liên kết hành động tùy chọn, ví dụ "Xem giỏ hàng" */
  action?: { label: string; to: string };
}

interface ToastState {
  toasts: Toast[];
  show: (toast: Omit<Toast, "id">, durationMs?: number) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;
const MAX_TOASTS = 3;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show: (toast, durationMs = 3000) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }].slice(-MAX_TOASTS) }));
    setTimeout(() => get().dismiss(id), durationMs);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Gọi nhanh từ bất kỳ đâu (kể cả ngoài component) */
export const toast = {
  success: (message: string, action?: Toast["action"]) => useToastStore.getState().show({ type: "success", message, action }),
  error: (message: string, action?: Toast["action"]) => useToastStore.getState().show({ type: "error", message, action }, 4000),
  info: (message: string, action?: Toast["action"]) => useToastStore.getState().show({ type: "info", message, action }),
};
