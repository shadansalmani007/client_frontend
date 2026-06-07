import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const defaultFilters = {
  source: "",
  destination: "",
  date: "",
  returnDate: "",
  tripType: "one-way",
  activeLeg: "outbound",
  page: 1,
  limit: 10,
};

export const useSearchStore = create(
  persist(
    (set) => ({
      filters: defaultFilters,
      setFilters: (filters) =>
        set((state) => ({
          filters: {
            ...state.filters,
            ...filters,
          },
        })),
      resetFilters: () => set({ filters: defaultFilters }),
      clearRouteInputs: () =>
        set((state) => ({
          filters: {
            ...state.filters,
            source: "",
            destination: "",
            date: "",
            returnDate: "",
            tripType: "one-way",
            activeLeg: "outbound",
            page: 1,
          },
        })),
    }),
    {
      name: "customer-search",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
