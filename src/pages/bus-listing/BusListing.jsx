import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useSearch from "../../zustand/useSearch";
import useBuses from "../../zustand/useBuses";
import useAuth from "../../zustand/useAuth";
// import LucideIcon from "../components/LucideIcon.jsx";
import LucideIcon from "../../components/LucideIcon.jsx";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Map,
  MapPinned,
  Search,
  SendHorizontal,
  ShieldCheck,
  Star,
  WalletCards,
  Wifi,
} from "lucide-react";

const SEARCH_STORAGE_KEY = "likili-search";
const SELECTED_BUS_STORAGE_KEY = "likili-selected-bus";

const getSavedSearch = () => {
  try {
    return JSON.parse(localStorage.getItem(SEARCH_STORAGE_KEY) || "null");
  } catch {
    localStorage.removeItem(SEARCH_STORAGE_KEY);
    return null;
  }
};

const formatSearchDate = (value, options) => {
  if (!value) return "Select date";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "Select date";
  return parsedDate.toLocaleDateString("en-US", options);
};

const BusListing = () => {
  const navigate = useNavigate();
  const { from, to, date, passengers, setSearch } = useSearch();
  const { buses, loadBuses, setSelectedBus } = useBuses();
  const { token } = useAuth();
  const [isModifyOpen, setIsModifyOpen] = useState(false);
  const [modifyForm, setModifyForm] = useState({
    from: "",
    to: "",
    date: "",
    passengers: "1",
  });
  const [departureFilter, setDepartureFilter] = useState("all");

  useEffect(() => {
    if (from && to && date) {
      return;
    }
    const savedSearch = getSavedSearch();
    if (savedSearch?.from && savedSearch?.to && savedSearch?.date) {
      setSearch(
        savedSearch.from,
        savedSearch.to,
        savedSearch.date,
        savedSearch.passengers || "1",
      );
    }
  }, [from, to, date, setSearch]);

  useEffect(() => {
    if (from && to) {
      loadBuses(from, to);
    }
  }, [from, to, loadBuses]);

  useEffect(() => {
    setModifyForm({
      from: from || "",
      to: to || "",
      date: date || "",
      passengers: passengers || "1",
    });
  }, [from, to, date, passengers]);

  const filteredBuses = useMemo(() => {
    if (departureFilter === "all") return buses;
    return buses.filter((bus) => {
      const hour = Number((bus.departure || "0").split(":")[0]);
      if (departureFilter === "morning") return hour >= 6 && hour < 12;
      if (departureFilter === "afternoon") return hour >= 12 && hour < 16;
      if (departureFilter === "evening") return hour >= 16 && hour < 21;
      if (departureFilter === "night") return hour >= 21 || hour < 6;
      return true;
    });
  }, [buses, departureFilter]);

  const handleModifySubmit = (event) => {
    event.preventDefault();
    const updatedSearch = {
      from: modifyForm.from.trim(),
      to: modifyForm.to.trim(),
      date: modifyForm.date,
      passengers: modifyForm.passengers || "1",
    };

    if (!updatedSearch.from || !updatedSearch.to || !updatedSearch.date) {
      return;
    }

    setSearch(
      updatedSearch.from,
      updatedSearch.to,
      updatedSearch.date,
      updatedSearch.passengers,
    );
    localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(updatedSearch));
    loadBuses(updatedSearch.from, updatedSearch.to);
    setIsModifyOpen(false);
  };

  const handleSelectSeats = (bus) => {
    setSelectedBus(bus);
    localStorage.setItem(SELECTED_BUS_STORAGE_KEY, JSON.stringify(bus));
    if (!token) {
      navigate("/login", { state: { from: "/seat-selection.html" } });
      return;
    }
    navigate("/seat-selection.html");
  };
  return (
    <>
      {/* ===================== NAVBAR ===================== */}
      <nav className="bg-white sticky top-0 z-40 shadow-[0_2px_12px_rgba(44,62,80,0.07)]">
        <div className="max-w-[1200px] mx-auto px-6 py-0 flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#c0392b]">
              <svg
                class="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm9 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM6 6h12v5H6V6z" />
              </svg>
            </div>
            <div className="text-lg font-bold text-[#c0392b] letter-spacing-[-0.3px]">
              Likili <span className="text-[#2c3e50]">Moterways</span>
            </div>
          </a>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            <a
              href="#"
              className="px-4 py-2 text-sm font-500 text-slate-600 hover:text-[#C0392B] rounded-lg hover:bg-red-50 transition font-medium"
            >
              Routes
            </a>
            <a
              href="#"
              className="px-4 py-2 text-sm font-500 text-slate-600 hover:text-[#C0392B] rounded-lg hover:bg-red-50 transition font-medium"
            >
              Offers
            </a>
            <a
              href="#"
              className="px-4 py-2 text-sm font-500 text-slate-600 hover:text-[#C0392B] rounded-lg hover:bg-red-50 transition font-medium"
            >
              Track Bus
            </a>
            <a
              href="#"
              className="px-4 py-2 text-sm font-500 text-slate-600 hover:text-[#C0392B] rounded-lg hover:bg-red-50 transition font-medium"
            >
              Support
            </a>
          </div>

          {/* Auth */}
          <div className="flex items-center gap-3">
            <a
              href="#"
              className="bg-[#c0392b] text-sm font-semibold text-white px-5 py-2 rounded-lg "
            >
              Login
            </a>
            {/* <a
              href="#"
              className="text-sm font-semibold text-white px-5 py-2 rounded-lg transition"
              style={{ background: "#c0392b" }}
            >
              Sign Up
            </a> */}
          </div>
        </div>
      </nav>

      {/* ===================== SEARCH SUMMARY STRIP ===================== */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Route */}
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-[#c0392b]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span
                className="text-sm font-bold text-[#2C3E50]"
                style={{ fontWeight: 700 }}
              >
                {from || "From"}
              </span>
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
              <span
                className="text-sm font-bold text-[#2C3E50]"
                style={{ fontWeight: 700 }}
              >
                {to || "To"}
              </span>
            </div>
            {/* Divider */}
            <span className="text-slate-300 hidden sm:inline">|</span>
            {/* Date */}
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm font-semibold text-slate-600">
                {formatSearchDate(date, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            {/* Passengers */}
            <span className="text-slate-300 hidden sm:inline">|</span>
            <div className="flex items-center gap-2">
              <svg
                class="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="text-sm font-semibold text-slate-600">
                {passengers || "1"} Passenger
              </span>
            </div>
          </div>
          {/* Modify Search */}
          <button
            type="button"
            onClick={() => setIsModifyOpen(true)}
            className="flex items-center gap-2 text-sm font-semibold text-[#2C3E50] bg-white border border-slate-300 hover:border-[#C0392B] hover:text-[#C0392B] px-4 py-2 rounded-full transition"
            style={{ borderRadius: "999px" }}
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Modify Search
          </button>
        </div>
      </div>

      {isModifyOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="card w-full max-w-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#2C3E50]">
                Modify Search
              </h3>
              <button
                type="button"
                onClick={() => setIsModifyOpen(false)}
                className="text-xs font-semibold hover:underline text-[#c0392b]"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleModifySubmit} className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={modifyForm.from}
                onChange={(event) =>
                  setModifyForm((current) => ({
                    ...current,
                    from: event.target.value,
                  }))
                }
                placeholder="From"
                className="footer-input text-slate-700 bg-white rounded-[8px] text-[13px] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c0392b] transition"
              />
              <input
                type="text"
                value={modifyForm.to}
                onChange={(event) =>
                  setModifyForm((current) => ({
                    ...current,
                    to: event.target.value,
                  }))
                }
                placeholder="To"
                className="footer-input text-slate-700 bg-white rounded-[8px] text-[13px] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c0392b] transition"
              />
              <input
                type="date"
                value={modifyForm.date}
                onChange={(event) =>
                  setModifyForm((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
                className="footer-input text-slate-700 bg-white rounded-[8px] text-[13px] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c0392b] transition"
              />
              <input
                type="number"
                min="1"
                value={modifyForm.passengers}
                onChange={(event) =>
                  setModifyForm((current) => ({
                    ...current,
                    passengers: event.target.value,
                  }))
                }
                placeholder="Passengers"
                className="footer-input text-slate-700 bg-white rounded-[8px] text-[13px] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c0392b] transition"
              />
              <button
                type="submit"
                className="sm:col-span-2 flex-shrink-0 px-4 py-2.5 text-sm font-bold bg-[#c0392b] rounded-[8px] text-white transition"
              >
                Update Search
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {/* ===================== MAIN CONTENT ===================== */}
      <div className="max-w-[1200px] mx-auto px-6 py-7">
        <div className="flex gap-6 items-start">
          {/* ===================== LEFT SIDEBAR ===================== */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="card-sm p-5 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#2C3E50]">Filters</h3>
                <button className="text-xs font-semibold hover:underline text-[#c0392b]">
                  Clear All
                </button>
              </div>

              <hr className="divider" />

              {/* Seat Type */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 letter-spacing-[0.08em]">
                  Seat Type
                </p>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-[#C0392B] transition">
                      Sleeper
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-[#C0392B] transition">
                      Seater
                    </span>
                  </label>
                </div>
              </div>

              <hr className="divider" />

              {/* Departure Time */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 letter-spacing-[0.08em]">
                  Departure Time
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setDepartureFilter("night")}
                    className={`pill ${departureFilter === "night" ? "active" : ""} text-xs`}
                  >
                    Before 6 AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepartureFilter("morning")}
                    className={`pill ${departureFilter === "morning" ? "active" : ""} text-xs`}
                  >
                    6 AM – 12 PM
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepartureFilter("afternoon")}
                    className={`pill ${departureFilter === "afternoon" ? "active" : ""} text-xs`}
                  >
                    12 PM – 4 PM
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepartureFilter("evening")}
                    className={`pill ${departureFilter === "evening" ? "active" : ""} text-xs`}
                  >
                    4 PM – 9 PM
                  </button>
                </div>
              </div>

              <hr className="divider" />

              {/* Price Range */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest letter-spacing-[0.08em]">
                    Price Range
                  </p>
                  <span className="text-xs font-bold text-[#2C3E50]">
                    K500 – K3,500
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="3500"
                  defaultValue="3500"
                  className="w-full h-1.5 rounded-full"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1.5 font-medium">
                  <span>K500</span>
                  <span>K3,500</span>
                </div>
              </div>

              <hr className="divider" />

              {/* Boarding Point */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 letter-spacing-[0.08em]">
                  Boarding Point
                </p>
                {/* Search */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-3">
                  {/* <LucideIcon
                    name="circle"
                    className="w-3.5 h-3.5 text-slate-400 flex-shrink-0"
                  /> */}
                  <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search boarding point"
                    className="bg-transparent text-xs text-slate-600 outline-none w-full placeholder-slate-400"
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-[#C0392B] transition">
                      Ndola
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-[#C0392B] transition">
                      Kitwe
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-[#C0392B] transition">
                      Chingola
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* ===================== RIGHT CONTENT ===================== */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Results Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl px-5 py-3 boxshadow-[0_2px_10px_rgba(44,62,80,0.06)]">
              <div>
                <span className="text-sm font-bold text-[#2C3E50]">
                  {filteredBuses.length} Buses found
                </span>
                <span className="text-sm text-slate-400 font-medium">
                  · {from} → {to} ·{" "}
                  {formatSearchDate(date, {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400 font-medium mr-1">
                  Sort:
                </span>
                <button className="sort-btn active">Departure</button>
                <button className="sort-btn">Price</button>
                <button className="sort-btn">Duration</button>
                <button className="sort-btn">Rating</button>
              </div>
            </div>

            {/* Bus Cards */}
            {filteredBuses.length > 0 ? (
              filteredBuses.map((bus) => (
                <div key={bus.id} className="bus-card p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                    {/* Left: Operator Info */}
                    <div className="sm:w-48 flex-shrink-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#fff5f5]">
                          <svg
                            className="w-6 h-6 text-[#c0392b]"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm9 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM6 6h12v5H6V6z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#2C3E50]">
                            {bus.name}
                          </p>
                          <span className="rating-badge">★ {bus.rating}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 font-medium mb-2">
                        {bus.type} · {bus.seats} seats
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(bus.amenities || []).map((amenity, index) => (
                          <span
                            key={index}
                            className={`tag-${amenity.toLowerCase().replace(/\s+/g, "")}`}
                          >
                            {amenity === "WiFi"
                              ? "📶"
                              : amenity === "AC"
                                ? "❄️"
                                : amenity === "Meals"
                                  ? "🍽️"
                                  : amenity === "USB"
                                    ? "🔌"
                                    : ""}{" "}
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="hidden sm:block w-px self-stretch bg-slate-100"></div>

                    {/* Center: Time */}
                    <div className="flex-1 flex items-center justify-center gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-extrabold text-[#2C3E50]">
                          {bus.departure}
                        </p>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">
                          {bus.from}
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-1 flex-1 max-w-[120px]">
                        <p className="text-xs font-bold text-[#c0392b]">
                          {bus.duration}
                        </p>
                        <div className="w-full flex items-center gap-1">
                          <div className="w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 border-[#c0392b] bg-[#fff]"></div>
                          <div className="flex-1 h-0.5 rounded-full bg-[linear-gradient(90deg,_#c0392b_60%,_#e2e8f0_60%)]"></div>
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#e2e8f0] border-2 border-[#cbd5e1]"></div>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">
                          Non-stop
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-extrabold text-[#2C3E50]">
                          {bus.arrival}
                        </p>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">
                          {bus.to}
                        </p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="hidden sm:block w-px self-stretch bg-slate-100"></div>

                    {/* Right: Price & CTA */}
                    <div className="sm:w-40 flex-shrink-0 flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="text-2xl font-extrabold text-[#c0392b]">
                          K{Number(bus.price || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          per person
                        </p>
                      </div>
                      <span className="tag-seats">
                        {bus.availableSeats} seats left
                      </span>
                      <button
                        onClick={() => handleSelectSeats(bus)}
                        className="w-full text-sm font-bold text-white py-2.5 rounded-xl transition mt-1 bg-[#c0392b]"
                      >
                        Select Seats →
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500">No buses found for this route.</p>
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <button className="w-9 h-9 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 flex items-center justify-center transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-9 h-9 rounded-xl font-bold bg-[#c0392b] text-sm text-white shadow-sm">
                1
              </button>
              <button className="w-9 h-9 rounded-xl border border-slate-200 text-slate-500 font-semibold text-sm hover:bg-slate-50 transition">
                2
              </button>
              <button className="w-9 h-9 rounded-xl border border-slate-200 text-slate-500 font-semibold text-sm hover:bg-slate-50 transition">
                3
              </button>
              <button className="w-9 h-9 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 flex items-center justify-center transition">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== FOOTER ===================== */}
      <footer className="mt-12 bg-[#1a2535] text-[#94a3b8]">
        <div className="max-w-[1200px] mx-auto px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#c0392b] flex items-center justify-center">
                  <svg
                    class="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm9 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM6 6h12v5H6V6z" />
                  </svg>
                </div>
                <span className="text-base font-bold text-[#c0392b]">
                  Likili <span className="text-white">Motorways</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                Zambia's most trusted intercity bus booking platform. Safe,
                reliable, and affordable travel across the country.
              </p>
              <div class="flex gap-3 mt-5">
                <a
                  href="#"
                  class="w-8 h-8 rounded-lg bg-slate-700 hover:bg-[#C0392B] flex items-center justify-center transition"
                >
                  <svg
                    class="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="#"
                  class="w-8 h-8 rounded-lg bg-slate-700 hover:bg-[#C0392B] flex items-center justify-center transition"
                >
                  <svg
                    class="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a
                  href="#"
                  class="w-8 h-8 rounded-lg bg-slate-700 hover:bg-[#C0392B] flex items-center justify-center transition"
                >
                  <svg
                    class="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="#"
                    className="text-sm text-slate-400 hover:text-white transition"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-slate-400 hover:text-white transition"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-slate-400 hover:text-white transition"
                  >
                    Press & Media
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-slate-400 hover:text-white transition"
                  >
                    Partner with Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-slate-400 hover:text-white transition"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            {/* Policies */}
            <div>
              <h4 className="text-sm font-bold text-white mb-4">Policies</h4>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="#"
                    className="text-sm text-slate-400 hover:text-white transition"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-slate-400 hover:text-white transition"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-slate-400 hover:text-white transition"
                  >
                    Refund Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-slate-400 hover:text-white transition"
                  >
                    Cancellation Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-slate-400 hover:text-white transition"
                  >
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-sm font-bold text-white mb-4">
                Stay Updated
              </h4>
              <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                Get the latest offers and travel updates delivered to your
                inbox.
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="footer-input text-slate-700 bg-white rounded-l-[8px] text-[13px] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c0392b] transition flex-1"
                />
                <button className="flex-shrink-0 px-4 py-2.5 text-sm font-bold bg-[#c0392b] rounded-r-[8px] text-white transition">
                  <SendHorizontal className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                No spam. Unsubscribe anytime.
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-700 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              © 2024 Likili Moterways. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500">🇿🇲 Zambia</span>
              <span className="text-xs text-slate-500">ZMW (K)</span>
              <span className="text-xs text-slate-500">English</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default BusListing;
