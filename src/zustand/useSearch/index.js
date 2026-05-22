import { create } from "zustand";

const useSearch = create((set) => ({
  from: "",
  to: "",
  date: "",
  passengers: "1",
  setFrom: (from) => set({ from }),
  setTo: (to) => set({ to }),
  setDate: (date) => set({ date }),
  setPassengers: (passengers) => set({ passengers }),
  setSearch: (from, to, date, passengers = "1") =>
    set({ from, to, date, passengers }),
  clearSearch: () => set({ from: "", to: "", date: "", passengers: "1" }),
}));

export default useSearch;
