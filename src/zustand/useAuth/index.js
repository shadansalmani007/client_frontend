import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const ACCESS_TOKEN = "access-token";
const initialState = {
  name: "",
  email: "",
  mobile: "",
  token: null,
};
export const useAuth = create(
  persist(
    (set) => ({
      ...initialState,
      setName: (name) => set(() => ({ name })),
      setEmail: (email) => set(() => ({ email })),
      setMobile: (mobile) => set(() => ({ mobile })),
      setToken: (token) => set(() => ({ token })),
      clearToken: () => {
        set(() => ({ ...initialState }));
        localStorage.removeItem(ACCESS_TOKEN);
      },
    }),
    {
      name: ACCESS_TOKEN,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default useAuth;
