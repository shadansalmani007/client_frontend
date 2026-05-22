import { useEffect, useState, useRef } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Headphones,
  LogOut,
  Map,
  MapPinned,
  SendHorizontal,
  ShieldCheck,
  Star,
  WalletCards,
  Wifi,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import useSearch from "../../zustand/useSearch";
import useAuth from "../../zustand/useAuth";

const cities = [
  "Lusaka",
  "Kasama",
  "Kabwe",
  "Kapiri Mposhi",
  "Mkushi",
  "Serenje",
  "Mpika",
  "Chipili",
  "Luwingu",
  "Ndola",
  "Kitwe",
  "Solwezi",
  "Chingola",
  "Chembe",
  "Kashikishi",
  "Samfya",
  "Manyama",
  "Mwense",
  "Mufulira",
  "Sabina",
  "Mwinilunga",
  "Ikelenge",
  "Kasempa",
  "Mpulungu",
  "Kisasa",
];

const offers = [
  [
    "Limited time",
    "First Trip Discount",
    "Unlock instant savings on your first premium interstate ride.",
    "CRIMSONNEW",
  ],
  [
    "Weekend",
    "Family Lounge Upgrade",
    "Priority boarding and lounge access for group journeys.",
    "LIKILIFAM",
  ],
  [
    "Business",
    "Executive Flex Pass",
    "Change departure times with no rebooking fee on selected routes.",
    "FLEXRIDE",
  ],
];

const routes = [
  ["Lusaka", "Ndola", "5h 30m", "From ZMW 320"],
  ["Lusaka", "Livingstone", "7h 45m", "From ZMW 420"],
  ["Kitwe", "Chipata", "9h 10m", "From ZMW 510"],
];

const gallery = [
  "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1556122071-e404eaedb77f?auto=format&fit=crop&w=1400&q=80",
];

const faqs = [
  [
    "Can I change my departure after booking?",
    "Yes. Flexible fares can be changed from your booking dashboard up to two hours before departure.",
  ],
  [
    "Do premium coaches include Wi-Fi?",
    "Selected long-distance coaches include Wi-Fi, charging points, reclining seats, and curated rest stops.",
  ],
  [
    "How early should I arrive?",
    "Arrive at least 30 minutes before departure so check-in and baggage handling stay relaxed.",
  ],
];

const SEARCH_STORAGE_KEY = "likili-search";

const Home = () => {
  const [slide, setSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [searchError, setSearchError] = useState("");
  const fromRef = useRef(null);
  const toRef = useRef(null);

  const { from, to, date, passengers, setFrom, setTo, setDate, setSearch } =
    useSearch();
  const { mobile, token, clearToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlide((current) => (current + 1) % gallery.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  const handleFromChange = (e) => {
    const value = e.target.value;
    setFrom(value);
    if (value.length > 0) {
      const filtered = cities.filter((city) =>
        city.toLowerCase().includes(value.toLowerCase()),
      );
      setFromSuggestions(filtered);
      setShowFromSuggestions(true);
    } else {
      setFromSuggestions([]);
      setShowFromSuggestions(false);
    }
  };

  const handleToChange = (e) => {
    const value = e.target.value;
    setTo(value);
    if (value.length > 0) {
      const filtered = cities.filter((city) =>
        city.toLowerCase().includes(value.toLowerCase()),
      );
      setToSuggestions(filtered);
      setShowToSuggestions(true);
    } else {
      setToSuggestions([]);
      setShowToSuggestions(false);
    }
  };

  const selectFromSuggestion = (city) => {
    setFrom(city);
    setFromSuggestions([]);
    setShowFromSuggestions(false);
  };

  const selectToSuggestion = (city) => {
    setTo(city);
    setToSuggestions([]);
    setShowToSuggestions(false);
  };

  const isSearchEnabled = Boolean(from && to && date);

  const handleSearch = (e) => {
    e.preventDefault();
    const today = new Date().toISOString().split("T")[0];
    const searchData = {
      from: from.trim(),
      to: to.trim(),
      date,
      passengers: passengers || "1",
    };

    if (!searchData.from || !searchData.to || !searchData.date) {
      setSearchError("Please fill all search fields.");
      return;
    }

    if (searchData.date < today) {
      setSearchError("Please select today or a future date.");
      return;
    }

    setSearchError("");
    setSearch(
      searchData.from,
      searchData.to,
      searchData.date,
      searchData.passengers,
    );
    localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(searchData));
    navigate("/bus-listing", { replace: false });
  };

  const handleLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fromRef.current && !fromRef.current.contains(event.target)) {
        setShowFromSuggestions(false);
      }
      if (toRef.current && !toRef.current.contains(event.target)) {
        setShowToSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div class="home-page font-sans text-ink antialiased">
      <header class="absolute inset-x-0 top-0 z-30">
        <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
          <a
            href="#"
            class="text-lg font-extrabold tracking-tight text-brand-500 text-white"
          >
            Likili Moterways
          </a>
          <nav class="hidden items-center gap-8 text-sm font-medium text-white/80 md:flex">
            <a href="#offers" class="transition hover:text-white">
              Offers
            </a>
            <a href="#routes" class="transition hover:text-white">
              Routes
            </a>
            <a href="#gallery" class="transition hover:text-white">
              Gallery
            </a>
            <a href="#support" class="transition hover:text-white">
              Support
            </a>
          </nav>
          <div class="flex items-center gap-4 text-sm font-medium">
            {!token ? (
              <Link
                to="/login"
                class="hidden inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-white backdrop-blur transition hover:bg-white/20"
              >
                Login
              </Link>
            ) : null}
            {token ? (
              <button
                type="button"
                onClick={handleLogout}
                class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-white backdrop-blur transition hover:bg-white/20"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            ) : null}
            <Link
              to="/bus-listing"
              class="rounded-full bg-brand-500 px-5 py-2.5 text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600"
            >
              Manage Booking
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section class="relative overflow-hidden">
          <div class="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1800&q=80"
              alt="Luxury coach on a mountain highway"
              class="h-full w-full object-cover object-left -scale-x-100 transform"
            />
            <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,15,25,0.78),rgba(11,15,25,0.18)_45%,rgba(11,15,25,0.72))]"></div>
            <div class="absolute inset-0 bg-grain"></div>
          </div>

          <div class="relative mx-auto flex min-h-[790px] max-w-7xl flex-col justify-end px-6 pb-10 pt-28 lg:px-8">
            <div class="max-w-2xl pb-16">
              <p class="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/80 backdrop-blur">
                Elevated travel
              </p>
              <h1 class="max-w-xl text-5xl font-extrabold leading-[0.92] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Redefining the
                <span class="text-brand-100">Transcontinental</span>
                Journey
              </h1>
              <p class="mt-6 max-w-lg text-sm leading-7 text-white/75 sm:text-base">
                Experience curated schedules, plush seating, and luxury pit
                stops while seamlessly connecting 2,000+ destinations across the
                country.
              </p>
              {token ? (
                <p class="mt-4 text-sm font-semibold text-white/85">
                  Logged in as {mobile}
                </p>
              ) : null}
              <div class="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#routes"
                  class="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:bg-brand-50"
                >
                  Explore routes
                  <ArrowRight className="h-4 w-4 text-gray-600" />
                </a>
                <div class="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm text-white/80 backdrop-blur">
                  2,300+ premium departures every week
                </div>
              </div>
            </div>

            <div class="rounded-[34px] bg-white/95 px-6 py-4 shadow-card backdrop-blur">
              <form
                onSubmit={handleSearch}
                class="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_1.2fr_1fr_0.64fr]"
              >
                <div ref={fromRef} class="relative">
                  <label class="flex items-center gap-3">
                    <i
                      data-lucide="map-pinned"
                      class="h-5 w-5 text-brand-500"
                    ></i>
                    <span class="min-w-0">
                      <span class="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                        From
                      </span>
                      <input
                        type="text"
                        value={from}
                        onChange={(e) => {
                          handleFromChange(e);
                          setSearchError("");
                        }}
                        placeholder="Live City"
                        class="mt-1 w-full bg-transparent text-xl font-medium text-slate-700 outline-none placeholder:text-slate-500 sm:text-[1.05rem]"
                      />
                    </span>
                  </label>
                  {showFromSuggestions && fromSuggestions.length > 0 && (
                    <div class="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                      {fromSuggestions.map((city, index) => (
                        <div
                          key={index}
                          onClick={() => selectFromSuggestion(city)}
                          class="px-4 py-2 hover:bg-slate-50 cursor-pointer text-slate-700"
                        >
                          {city}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div ref={toRef} class="relative">
                  <label class="flex items-center gap-3">
                    <i data-lucide="map" class="h-5 w-5 text-brand-500"></i>
                    <span class="min-w-0">
                      <span class="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Destination
                      </span>
                      <input
                        type="text"
                        value={to}
                        onChange={(e) => {
                          handleToChange(e);
                          setSearchError("");
                        }}
                        placeholder="Destination"
                        class="mt-1 w-full bg-transparent text-xl font-medium text-slate-700 outline-none placeholder:text-slate-500 sm:text-[1.05rem]"
                      />
                    </span>
                  </label>
                  {showToSuggestions && toSuggestions.length > 0 && (
                    <div class="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                      {toSuggestions.map((city, index) => (
                        <div
                          key={index}
                          onClick={() => selectToSuggestion(city)}
                          class="px-4 py-2 hover:bg-slate-50 cursor-pointer text-slate-700"
                        >
                          {city}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <label class="flex items-center gap-3">
                  <i
                    data-lucide="calendar-days"
                    class="h-5 w-5 text-brand-500"
                  ></i>
                  <span class="min-w-0">
                    <span class="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Departure
                    </span>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value);
                        setSearchError("");
                      }}
                      placeholder="Pick date"
                      class="mt-1 w-full bg-transparent text-xl font-medium text-slate-700 outline-none placeholder:text-slate-500 sm:text-[1.05rem]"
                    />
                  </span>
                </label>
                <button
                  type="submit"
                  onClick={handleSearch}
                  className={`inline-flex w-full items-center justify-center gap-3 rounded-[26px] px-3 py-2 text-base font-semibold uppercase tracking-[0.28em] text-white shadow-lg min-h-12 transition ${
                    isSearchEnabled
                      ? "bg-[#b82e40] shadow-brand-500/10 hover:brightness-105"
                      : "bg-[linear-gradient(135deg,#d9b0b8,#c98a95)] shadow-none text-slate-600 cursor-not-allowed bg-[#cf3d4f]"
                  }`}
                >
                  <span>Search</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
                {searchError && (
                  <p class="text-sm font-semibold text-[#c0392b] md:col-span-2 xl:col-span-4">
                    {searchError}
                  </p>
                )}
              </form>
            </div>
          </div>
        </section>

        <section id="offers" class="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div class="mb-8 flex items-end justify-between gap-4">
            <div>
              <p class="section-label text-xs font-semibold uppercase text-brand-500">
                Curated perks
              </p>
              <h2 class="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Offers for You
              </h2>
            </div>
            <div class="hidden items-center gap-2 sm:flex">
              <button class="rounded-full border border-slate-200 bg-white p-3 text-slate-500 transition hover:border-brand-200 hover:text-brand-500">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button class="rounded-full border border-slate-200 bg-white p-3 text-slate-500 transition hover:border-brand-200 hover:text-brand-500">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div class="grid gap-5 lg:grid-cols-3">
            <article class="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#df5962,#b9354b)] p-6 text-white shadow-soft">
              <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
                Limited time
              </p>
              <h3 class="mt-10 text-3xl font-extrabold leading-tight">
                First Trip Discount
              </h3>
              <p class="mt-3 max-w-xs text-sm text-white/80">
                Unlock instant savings on your first premium interstate ride.
              </p>
              <div class="mt-10 flex items-center justify-between">
                <div>
                  <p class="text-[11px] uppercase tracking-[0.24em] text-white/60">
                    Code
                  </p>
                  <p class="mt-2 text-sm font-semibold">CRIMSONNEW</p>
                </div>
                <a
                  href="#"
                  class="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                >
                  Get offer
                </a>
              </div>
            </article>

            <article class="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#3952ff,#5937d4)] p-6 text-white shadow-soft">
              <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
                Instant save
              </p>
              <h3 class="mt-10 text-3xl font-extrabold leading-tight">
                Instant Cashback
              </h3>
              <p class="mt-3 max-w-xs text-sm text-white/80">
                Pay by wallet and receive credits for your next long-haul
                booking.
              </p>
              <div class="mt-10 flex items-center justify-between">
                <div>
                  <p class="text-[11px] uppercase tracking-[0.24em] text-white/60">
                    Reward
                  </p>
                  <p class="mt-2 text-sm font-semibold">$50 reward</p>
                </div>
                <a
                  href="#"
                  class="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                >
                  Redeem
                </a>
              </div>
            </article>

            <article class="relative overflow-hidden rounded-[28px] bg-slate-950 p-6 text-white shadow-soft">
              <img
                src="https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1000&q=80"
                alt="Luxury lounge"
                class="absolute inset-0 h-full w-full object-cover opacity-25"
              />
              <div class="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.82),rgba(15,23,42,0.4))]"></div>
              <div class="relative">
                <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/60">
                  Elite perks
                </p>
                <h3 class="mt-10 text-3xl font-extrabold leading-tight">
                  Premium Lounge Access
                </h3>
                <p class="mt-3 max-w-xs text-sm text-white/80">
                  Travel with complimentary refreshments and quiet workspace
                  entry.
                </p>
                <div class="mt-10 flex items-center justify-between">
                  <div>
                    <p class="text-[11px] uppercase tracking-[0.24em] text-white/60">
                      Access
                    </p>
                    <p class="mt-2 text-sm font-semibold">Gold exclusive</p>
                  </div>
                  <a
                    href="#"
                    class="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                  >
                    Explore
                  </a>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="border-y border-slate-200/80 bg-white">
          <div class="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <div class="mb-8">
              <div class="flex items-center gap-2 text-sm font-semibold text-ink">
                <i
                  data-lucide="badge-percent"
                  class="h-4 w-4 text-brand-500"
                ></i>
                Bus Booking Offers &amp; Discounts
              </div>
            </div>

            <div class="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
              <article class="relative overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,#0586c9,#40bdf7)] p-5 text-white shadow-soft">
                <div class="flex h-full flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div class="max-w-sm">
                    <p class="text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
                      Summer special
                    </p>
                    <h3 class="mt-3 text-3xl font-extrabold leading-tight">
                      Summer Is Here!
                    </h3>
                    <p class="mt-3 text-sm leading-6 text-white/85">
                      Up to 20% off for scenic weekend routes and sleeper
                      coaches.
                    </p>
                  </div>
                  <div class="rounded-3xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                    <img
                      src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=500&q=80"
                      alt="Coach route"
                      class="h-24 w-40 rounded-2xl object-cover"
                    />
                  </div>
                </div>
              </article>

              <article class="rounded-[26px] bg-[#eef6e9] p-5 shadow-soft">
                <div class="flex h-full flex-col justify-between">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Save more
                    </p>
                    <div class="mt-3 flex items-start justify-between gap-3">
                      <div>
                        <p class="text-5xl font-extrabold tracking-tight text-ink">
                          $50
                        </p>
                        <p class="mt-2 text-sm text-slate-600">
                          Back to back returns
                        </p>
                      </div>
                      <span class="inline-flex rounded-full bg-black px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                        37%
                      </span>
                    </div>
                  </div>
                  <p class="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                    Bundle the way you travel
                  </p>
                </div>
              </article>

              <article class="rounded-[26px] bg-[#d7eef0] p-5 shadow-soft">
                <p class="inline-flex rounded-full bg-[#f4bf26] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-900">
                  Active
                </p>
                <div class="mt-6 flex items-end gap-6">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Flat fare
                    </p>
                    <p class="mt-2 text-3xl font-extrabold text-ink">$60</p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Weekend combo
                    </p>
                    <p class="mt-2 text-2xl font-extrabold text-ink">$100</p>
                  </div>
                </div>
                <p class="mt-4 text-sm leading-6 text-slate-600">
                  Pair two luxury routes and save on the total ticket value.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section class="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div class="mb-8">
            <p class="section-label text-xs font-semibold uppercase text-brand-500">
              Discover
            </p>
            <h2 class="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Discover Your Journey
            </h2>
            <p class="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Pick a favorite route or city and enjoy curated drop points,
              lounge upgrades, and better overnight comfort.
            </p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <article class="group overflow-hidden rounded-[24px] bg-white p-2 shadow-soft">
              <img
                src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80"
                alt="Lucknow"
                class="h-52 w-full rounded-[18px] object-cover transition duration-500 group-hover:scale-105"
              />
              <div class="-mt-8 px-3 pb-3">
                <div class="rounded-2xl bg-white px-4 py-3 shadow-lg">
                  <h3 class="text-sm font-semibold">Lucknow</h3>
                </div>
              </div>
            </article>
            <article class="group overflow-hidden rounded-[24px] bg-white p-2 shadow-soft">
              <img
                src="https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80"
                alt="Delhi"
                class="h-52 w-full rounded-[18px] object-cover transition duration-500 group-hover:scale-105"
              />
              <div class="-mt-8 px-3 pb-3">
                <div class="rounded-2xl bg-white px-4 py-3 shadow-lg">
                  <h3 class="text-sm font-semibold">Delhi</h3>
                </div>
              </div>
            </article>
            <article class="group overflow-hidden rounded-[24px] bg-white p-2 shadow-soft">
              <img
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
                alt="Goa"
                class="h-52 w-full rounded-[18px] object-cover transition duration-500 group-hover:scale-105"
              />
              <div class="-mt-8 px-3 pb-3">
                <div class="rounded-2xl bg-white px-4 py-3 shadow-lg">
                  <h3 class="text-sm font-semibold">Goa</h3>
                </div>
              </div>
            </article>
            <article class="group overflow-hidden rounded-[24px] bg-white p-2 shadow-soft">
              <img
                src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80"
                alt="Madurai"
                class="h-52 w-full rounded-[18px] object-cover transition duration-500 group-hover:scale-105"
              />
              <div class="-mt-8 px-3 pb-3">
                <div class="rounded-2xl bg-white px-4 py-3 shadow-lg">
                  <h3 class="text-sm font-semibold">Madurai</h3>
                </div>
              </div>
            </article>
            <article class="group overflow-hidden rounded-[24px] bg-white p-2 shadow-soft">
              <img
                src="https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=800&q=80"
                alt="Trivpet"
                class="h-52 w-full rounded-[18px] object-cover transition duration-500 group-hover:scale-105"
              />
              <div class="-mt-8 px-3 pb-3">
                <div class="rounded-2xl bg-white px-4 py-3 shadow-lg">
                  <h3 class="text-sm font-semibold">Trivpet</h3>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section id="gallery" class="border-y border-slate-200/80 bg-white">
          <div class="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <div class="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p class="section-label text-xs font-semibold uppercase text-brand-500">
                  Visual journey
                </p>
                <h2 class="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Photo Gallery
                </h2>
                <p class="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  A moving look at the coaches, premium interiors, and lounge
                  spaces that shape the Likili Moterways experience.
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button class="rounded-full bg-brand-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                  All
                </button>
                <button class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Lounge
                </button>
                <button class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Bus
                </button>
                <button class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Safety
                </button>
                <button class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Comfort
                </button>
              </div>
            </div>

            <div class="gallery-carousel" data-carousel>
              <div class="gallery-carousel-track" data-carousel-track>
                <div class="gallery-carousel-slide">
                  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-[0.58fr_1.35fr_1.35fr_1fr]">
                    <article class="overflow-hidden rounded-[28px] shadow-soft">
                      <img
                        src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80"
                        alt="Premium workspace lounge"
                        class="h-72 w-full object-cover xl:h-[360px]"
                      />
                    </article>
                    <article class="overflow-hidden rounded-[34px] shadow-soft">
                      <img
                        src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80"
                        alt="Coach exterior"
                        class="h-72 w-full object-cover xl:h-[360px]"
                      />
                    </article>
                    <article class="overflow-hidden rounded-[34px] shadow-soft">
                      <img
                        src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80"
                        alt="Urban skyline stop"
                        class="h-72 w-full object-cover xl:h-[360px]"
                      />
                    </article>
                    <article class="overflow-hidden rounded-[28px] shadow-soft">
                      <img
                        src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80"
                        alt="Comfort suite"
                        class="h-72 w-full object-cover xl:h-[360px]"
                      />
                    </article>
                  </div>
                </div>
                <div class="gallery-carousel-slide">
                  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-[0.58fr_1.35fr_1.35fr_1fr]">
                    <article class="overflow-hidden rounded-[28px] shadow-soft">
                      <img
                        src="https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80"
                        alt="Traveler lounge cafe"
                        class="h-72 w-full object-cover xl:h-[360px]"
                      />
                    </article>
                    <article class="overflow-hidden rounded-[34px] shadow-soft">
                      <img
                        src="https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=80"
                        alt="Luxury aisle interior"
                        class="h-72 w-full object-cover xl:h-[360px]"
                      />
                    </article>
                    <article class="overflow-hidden rounded-[34px] shadow-soft">
                      <img
                        src="https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80"
                        alt="Modern architecture exterior"
                        class="h-72 w-full object-cover xl:h-[360px]"
                      />
                    </article>
                    <article class="overflow-hidden rounded-[28px] shadow-soft">
                      <img
                        src="https://images.unsplash.com/photo-1505692952047-1a78307da8f2?auto=format&fit=crop&w=900&q=80"
                        alt="Premium comfort room"
                        class="h-72 w-full object-cover xl:h-[360px]"
                      />
                    </article>
                  </div>
                </div>
              </div>

              <div class="mt-8 flex items-center justify-between gap-4">
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    data-carousel-prev
                    class="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    data-carousel-next
                    class="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    data-carousel-dot="0"
                    class="gallery-carousel-dot h-2.5 w-2.5 rounded-full bg-slate-300 transition-all duration-300"
                  ></button>
                  <button
                    type="button"
                    data-carousel-dot="1"
                    class="gallery-carousel-dot h-2.5 w-2.5 rounded-full bg-slate-300 transition-all duration-300"
                  ></button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div class="rounded-[32px] border border-slate-200 bg-white px-6 py-10 shadow-soft">
            <p class="text-center text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-400">
              Official development partner
            </p>
            <div class="mt-8 grid gap-4 text-sm font-medium text-slate-500 sm:grid-cols-2 lg:grid-cols-6">
              <div class="flex items-center justify-center gap-3 rounded-full border border-slate-200 px-4 py-3">
                <span class="h-3 w-3 rounded-full bg-slate-200"></span>MSRTC
              </div>
              <div class="flex items-center justify-center gap-3 rounded-full border border-slate-200 px-4 py-3">
                <span class="h-3 w-3 rounded-full bg-slate-200"></span>KSRTC
              </div>
              <div class="flex items-center justify-center gap-3 rounded-full border border-slate-200 px-4 py-3">
                <span class="h-3 w-3 rounded-full bg-slate-200"></span>UPSRTC
              </div>
              <div class="flex items-center justify-center gap-3 rounded-full border border-slate-200 px-4 py-3">
                <span class="h-3 w-3 rounded-full bg-slate-200"></span>GSRTC
              </div>
              <div class="flex items-center justify-center gap-3 rounded-full border border-slate-200 px-4 py-3">
                <span class="h-3 w-3 rounded-full bg-slate-200"></span>RSRTC
              </div>
              <div class="flex items-center justify-center gap-3 rounded-full border border-slate-200 px-4 py-3">
                <span class="h-3 w-3 rounded-full bg-slate-200"></span>Private+
              </div>
            </div>
          </div>
        </section>

        <section id="routes" class="border-y border-slate-200/80 bg-white">
          <div class="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <div class="mb-10">
              <p class="section-label text-xs font-semibold uppercase text-brand-500">
                Regional choice
              </p>
              <h2 class="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Most Traveled Routes
              </h2>
            </div>

            <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <article class="group overflow-hidden rounded-[28px] border border-slate-200 bg-white p-3 shadow-soft transition duration-300 hover:border-slate-300 hover:bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80"
                  alt="Mumbai to Goa"
                  class="h-56 w-full rounded-[20px] object-cover"
                />
                <div class="px-2 pb-2 pt-4">
                  <h3 class="text-lg font-semibold">Mumbai to Goa</h3>
                  <p class="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                    Every day | 11 hr 30 min
                  </p>
                  <div class="mt-5 flex items-center justify-between">
                    <div>
                      <p class="text-xs uppercase tracking-[0.2em] text-slate-400">
                        From
                      </p>
                      <p class="mt-1 text-xl font-extrabold text-brand-500">
                        $29
                      </p>
                    </div>
                    <button class="rounded-full border border-slate-200 p-3 text-slate-500 transition duration-300 group-hover:bg-white">
                      <ArrowRight className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </article>

              <article class="group overflow-hidden rounded-[28px] border border-slate-200 bg-white p-3 shadow-soft transition duration-300 hover:border-slate-300 hover:bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=900&q=80"
                  alt="Bangalore to Chennai"
                  class="h-56 w-full rounded-[20px] object-cover"
                />
                <div class="px-2 pb-2 pt-4">
                  <h3 class="text-lg font-semibold">Bangalore to Chennai</h3>
                  <p class="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                    Every 45 min | 6 hr 20 min
                  </p>
                  <div class="mt-5 flex items-center justify-between">
                    <div>
                      <p class="text-xs uppercase tracking-[0.2em] text-slate-400">
                        From
                      </p>
                      <p class="mt-1 text-xl font-extrabold text-brand-500">
                        $18
                      </p>
                    </div>
                    <button class="rounded-full border border-slate-200 p-3 text-slate-500 transition duration-300 group-hover:bg-white">
                      <ArrowRight className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </article>

              <article class="group overflow-hidden rounded-[28px] border border-slate-200 bg-white p-3 shadow-soft transition duration-300 hover:border-slate-300 hover:bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=900&q=80"
                  alt="Pune to Hyderabad"
                  class="h-56 w-full rounded-[20px] object-cover"
                />
                <div class="px-2 pb-2 pt-4">
                  <h3 class="text-lg font-semibold">Pune to Hyderabad</h3>
                  <p class="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                    132 trips/d | 14 hr 10 min
                  </p>
                  <div class="mt-5 flex items-center justify-between">
                    <div>
                      <p class="text-xs uppercase tracking-[0.2em] text-slate-400">
                        From
                      </p>
                      <p class="mt-1 text-xl font-extrabold text-brand-500">
                        $22
                      </p>
                    </div>
                    <button class="rounded-full border border-slate-200 p-3 text-slate-500 transition duration-300 group-hover:bg-white">
                      <ArrowRight className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </article>

              <article class="group overflow-hidden rounded-[28px] border border-slate-200 bg-white p-3 shadow-soft transition duration-300 hover:border-slate-300 hover:bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=900&q=80"
                  alt="Delhi to Agra"
                  class="h-56 w-full rounded-[20px] object-cover"
                />
                <div class="px-2 pb-2 pt-4">
                  <h3 class="text-lg font-semibold">Delhi to Agra</h3>
                  <p class="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                    54 trips/d | 4 hr 40 min
                  </p>
                  <div class="mt-5 flex items-center justify-between">
                    <div>
                      <p class="text-xs uppercase tracking-[0.2em] text-slate-400">
                        From
                      </p>
                      <p class="mt-1 text-xl font-extrabold text-brand-500">
                        $12
                      </p>
                    </div>
                    <button class="rounded-full border border-slate-200 p-3 text-slate-500 transition duration-300 group-hover:bg-white">
                      <ArrowRight className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section class="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div class="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p class="section-label text-xs font-semibold uppercase text-brand-500">
                Core values
              </p>
              <h2 class="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Why Likili Moterways?
              </h2>
              <div class="mt-10 grid gap-4 sm:grid-cols-2">
                <article class="rounded-[24px] bg-white p-6 shadow-soft">
                  <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 class="mt-5 text-lg font-semibold">Safe Passage</h3>
                  <p class="mt-3 text-sm leading-7 text-slate-600">
                    Every departure is GPS-backed, driver-audited, and supported
                    by live route monitoring.
                  </p>
                </article>
                <article class="rounded-[24px] bg-white p-6 shadow-soft">
                  <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
                    <WalletCards className="h-5 w-5" />
                  </div>
                  <h3 class="mt-5 text-lg font-semibold">No Hidden Costs</h3>
                  <p class="mt-3 text-sm leading-7 text-slate-600">
                    Transparent pricing, seat upgrades, and extra luggage
                    details from the first click.
                  </p>
                </article>
                <article class="rounded-[24px] bg-white p-6 shadow-soft">
                  <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
                    <Headphones className="h-5 w-5" />
                  </div>
                  <h3 class="mt-5 text-lg font-semibold">24/7 Support</h3>
                  <p class="mt-3 text-sm leading-7 text-slate-600">
                    Dedicated trip assistants stay available before boarding, en
                    route, and at arrival.
                  </p>
                </article>
                <article class="rounded-[24px] bg-white p-6 shadow-soft">
                  <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
                    <MapPinned className="h-5 w-5 " />
                  </div>
                  <h3 class="mt-5 text-lg font-semibold">Live Tracking</h3>
                  <p class="mt-3 text-sm leading-7 text-slate-600">
                    Share your route with family and get sharp ETAs on every
                    stop and service break.
                  </p>
                </article>
              </div>
            </div>

            <div class="relative overflow-hidden rounded-[34px] shadow-card">
              <img
                src="https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=80"
                alt="Luxury vehicle interior"
                class="h-full min-h-[520px] w-full object-cover"
              />
              <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,15,25,0.08),rgba(11,15,25,0.38))]"></div>
              <div class="absolute bottom-6 left-6 rounded-[24px] bg-white px-5 py-4 shadow-soft">
                <div class="flex items-center gap-3">
                  <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <Star className="h-5 w-5" />
                  </div>
                  <div>
                    <p class="text-2xl font-extrabold">4.8/5</p>
                    <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Verified luxury comfort score
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="border-y border-slate-200/80 bg-white">
          <div class="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <div class="text-center">
              <p class="section-label text-xs font-semibold uppercase text-brand-500">
                The journal
              </p>
              <h2 class="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Traveler Stories
              </h2>
            </div>

            <div class="mt-14 grid gap-8 lg:grid-cols-3">
              <article class="rounded-[28px] bg-mist p-8">
                <div class="flex items-center gap-1 text-brand-500">
                  <i data-lucide="star" class="h-4 w-4 fill-current"></i>
                  <i data-lucide="star" class="h-4 w-4 fill-current"></i>
                  <i data-lucide="star" class="h-4 w-4 fill-current"></i>
                  <i data-lucide="star" class="h-4 w-4 fill-current"></i>
                  <i data-lucide="star" class="h-4 w-4 fill-current"></i>
                </div>
                <p class="mt-6 text-sm leading-8 text-slate-700">
                  "The seats felt more like business class than road travel. The
                  sleeper coach was spotless and the rest stops felt curated."
                </p>
                <div class="mt-8">
                  <p class="font-semibold">Sarah Jenkins</p>
                  <p class="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                    Travel blogger
                  </p>
                </div>
              </article>

              <article class="rounded-[28px] bg-mist p-8">
                <div class="flex items-center gap-1 text-brand-500">
                  <i data-lucide="star" class="h-4 w-4 fill-current"></i>
                  <i data-lucide="star" class="h-4 w-4 fill-current"></i>
                  <i data-lucide="star" class="h-4 w-4 fill-current"></i>
                  <i data-lucide="star" class="h-4 w-4 fill-current"></i>
                  <i data-lucide="star" class="h-4 w-4 fill-current"></i>
                </div>
                <p class="mt-6 text-sm leading-8 text-slate-700">
                  "Likili Moterways made business travel across state lines
                  genuinely easy. The onboard Wi-Fi actually worked and boarding
                  was quick."
                </p>
                <div class="mt-8">
                  <p class="font-semibold">David Chen</p>
                  <p class="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                    Consultant, Travalex
                  </p>
                </div>
              </article>

              <article class="rounded-[28px] bg-mist p-8">
                <div class="flex items-center gap-1 text-brand-500">
                  <i data-lucide="star" class="h-4 w-4 fill-current"></i>
                  <i data-lucide="star" class="h-4 w-4 fill-current"></i>
                  <i data-lucide="star" class="h-4 w-4 fill-current"></i>
                  <i data-lucide="star" class="h-4 w-4 fill-current"></i>
                  <i data-lucide="star" class="h-4 w-4 fill-current"></i>
                </div>
                <p class="mt-6 text-sm leading-8 text-slate-700">
                  "Booked for my whole family. The pickup process was smooth and
                  the staff was exceptionally mindful with our luggage."
                </p>
                <div class="mt-8">
                  <p class="font-semibold">Aarohi Verma</p>
                  <p class="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                    Frequent traveler
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="support" class="mx-auto max-w-4xl px-6 py-20 lg:px-8">
          <div class="text-center">
            <h2 class="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Common Inquiries
            </h2>
          </div>

          <div class="mt-12 space-y-4">
            <article class="overflow-hidden rounded-[24px] bg-white shadow-soft">
              <button
                type="button"
                class="faq-trigger flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span class="text-sm font-semibold text-ink sm:text-base">
                  How do I cancel my booking?
                </span>
                <i
                  data-lucide="chevron-down"
                  class="h-5 w-5 shrink-0 text-slate-400 transition"
                ></i>
              </button>
              <div class="faq-content px-6 pb-6 text-sm leading-7 text-slate-600">
                You can manage your reservation from the "Manage Booking"
                section and cancel based on route operator rules. Refund timing
                and protection details appear before confirmation.
              </div>
            </article>

            <article class="overflow-hidden rounded-[24px] bg-white shadow-soft">
              <button
                type="button"
                class="faq-trigger flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span class="text-sm font-semibold text-ink sm:text-base">
                  Is travel insurance included?
                </span>
                <i
                  data-lucide="chevron-down"
                  class="h-5 w-5 shrink-0 text-slate-400 transition"
                ></i>
              </button>
              <div
                class="faq-content px-6 pb-6 text-sm leading-7 text-slate-600"
                hidden
              >
                Insurance is offered as an optional add-on during checkout, with
                route-specific coverage for delays, missed connections, and
                luggage incidents.
              </div>
            </article>

            <article class="overflow-hidden rounded-[24px] bg-white shadow-soft">
              <button
                type="button"
                class="faq-trigger flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span class="text-sm font-semibold text-ink sm:text-base">
                  What safety measures are in place?
                </span>
                <i
                  data-lucide="chevron-down"
                  class="h-5 w-5 shrink-0 text-slate-400 transition"
                ></i>
              </button>
              <div
                class="faq-content px-6 pb-6 text-sm leading-7 text-slate-600"
                hidden
              >
                Likili Moterways partners with operators that support live GPS,
                trained crew rotation, sanitization routines, and emergency
                escalation teams available around the clock.
              </div>
            </article>
          </div>
        </section>
      </main>

      <footer class="border-t border-slate-200 bg-white">
        <div class="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div class="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
            <div>
              <a
                href="#"
                class="text-lg font-extrabold tracking-tight text-brand-500"
              >
                Likili Moterways
              </a>
              <p class="mt-5 max-w-sm text-sm leading-7 text-slate-600">
                Luxury intercity bus journeys with trusted operators, seamless
                booking, and customer-first travel support across India.
              </p>
              <div class="mt-6 flex items-center gap-3">
                <a
                  href="#"
                  aria-label="Facebook"
                  class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition duration-300 hover:-translate-y-1 hover:scale-110 hover:border-slate-300 hover:bg-slate-100 hover:text-black hover:shadow-lg hover:shadow-slate-300/40"
                >
                  <svg
                    viewBox="0 0 24 24"
                    class="h-4 w-4 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M13.5 21v-7h2.3l.4-3h-2.7V9.1c0-.9.3-1.6 1.7-1.6H16V4.9c-.4-.1-1.3-.2-2.4-.2-2.4 0-4.1 1.5-4.1 4.3V11H7v3h2.5v7h4Z"></path>
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="X"
                  class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition duration-300 hover:-translate-y-1 hover:scale-110 hover:border-slate-300 hover:bg-slate-100 hover:text-black hover:shadow-lg hover:shadow-slate-300/40"
                >
                  <svg
                    viewBox="0 0 24 24"
                    class="h-4 w-4 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M18.9 3H22l-6.8 7.8L23 21h-6.2l-4.9-6.4L6.4 21H3.3l7.3-8.4L1 3h6.4l4.4 5.8L18.9 3Zm-1.1 16h1.7L6.5 4.9H4.7L17.8 19Z"></path>
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="Instagram"
                  class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition duration-300 hover:-translate-y-1 hover:scale-110 hover:border-slate-300 hover:bg-slate-100 hover:text-black hover:shadow-lg hover:shadow-slate-300/40"
                >
                  <svg viewBox="0 0 24 24" class="h-4 w-4" aria-hidden="true">
                    <rect
                      x="3.5"
                      y="3.5"
                      width="17"
                      height="17"
                      rx="4.5"
                      stroke="currentColor"
                      stroke-width="2"
                      fill="none"
                    ></rect>
                    <circle
                      cx="12"
                      cy="12"
                      r="3.6"
                      stroke="currentColor"
                      stroke-width="2"
                      fill="none"
                    ></circle>
                    <circle
                      cx="17.2"
                      cy="6.8"
                      r="1.1"
                      fill="currentColor"
                    ></circle>
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                Company
              </p>
              <ul class="mt-5 space-y-3 text-sm text-slate-600">
                <li>
                  <a href="#" class="transition hover:text-brand-500">
                    About us
                  </a>
                </li>
                <li>
                  <a href="#" class="transition hover:text-brand-500">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" class="transition hover:text-brand-500">
                    Partnerships
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                Support
              </p>
              <ul class="mt-5 space-y-3 text-sm text-slate-600">
                <li>
                  <a href="#" class="transition hover:text-brand-500">
                    Help center
                  </a>
                </li>
                <li>
                  <a href="#" class="transition hover:text-brand-500">
                    Travel tips
                  </a>
                </li>
                <li>
                  <a href="#" class="transition hover:text-brand-500">
                    Contact support
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                Stay Updated
              </p>
              <p class="mt-5 text-sm leading-7 text-slate-600">
                Subscribe for seasonal offers and new premium route launches.
              </p>
              <form class="mt-5 flex rounded-full border border-slate-200 bg-mist p-2">
                <input
                  type="email"
                  placeholder="Your email"
                  class="w-full bg-transparent px-4 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  class="flex h-11 w-20 cursor-pointer items-center justify-center rounded-full bg-brand-500 text-white transition hover:bg-brand-600"
                >
                  <SendHorizontal className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          <div class="fade-divider mt-12 h-px w-full"></div>
          <div class="mt-6 flex flex-col gap-3 text-xs uppercase tracking-[0.18em] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>
              @ 2026 Likili Moterways. Luxury journeys, carefully connected.
            </p>
            <p>Terms | Privacy | Cookies</p>
          </div>
        </div>
      </footer>

      <script src="https://unpkg.com/lucide@latest"></script>
      <script src="js/script.js"></script>
    </div>
  );
};

export default Home;

function SearchField({ icon, label, placeholder }) {
  return (
    <label className="flex items-center gap-3">
      <span className="text-brand-500 [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          {label}
        </span>
        <input
          type="text"
          placeholder={placeholder}
          className="mt-1 w-full bg-transparent text-xl font-medium text-slate-700 outline-none placeholder:text-slate-500 sm:text-[1.05rem]"
        />
      </span>
    </label>
  );
}

function SectionTitle({ label, title }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <p className="section-label text-xs font-semibold uppercase text-brand-500">
          {label}
        </p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {title}
        </h2>
      </div>
      <div className="hidden items-center gap-2 sm:flex">
        <button className="rounded-full border border-slate-200 bg-white p-3 text-slate-500 transition hover:border-brand-200 hover:text-brand-500">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <button className="rounded-full border border-slate-200 bg-white p-3 text-slate-500 transition hover:border-brand-200 hover:text-brand-500">
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function FooterLinks({ title, links }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
        {title}
      </p>
      <ul className="mt-5 space-y-3 text-sm text-slate-600">
        {links.map((link) => (
          <li key={link}>
            <a href="#" className="transition hover:text-brand-500">
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
