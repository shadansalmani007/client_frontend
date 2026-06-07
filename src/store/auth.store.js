import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const initialState = {
  token: null,
  user: null,
};

export const useAuthStore = create(
  persist(
    (set) => ({
      ...initialState,
      setAuth: ({ token, user }) =>
        set({
          token: token ?? null,
          user: user ?? null,
        }),
      setUser: (user) => set({ user }),
      clearAuth: () => set(initialState),
    }),
    {
      name: "customer-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    },
  ),
);
