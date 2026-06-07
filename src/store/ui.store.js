import { create } from "zustand";

export const useUiStore = create((set) => ({
  toasts: [],
  addToast: ({ title, message, type = "info" }) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id: crypto.randomUUID(),
          title,
          message,
          type,
        },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));
