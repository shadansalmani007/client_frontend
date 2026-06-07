import {
  ArrowRight,
  BusFront,
  MapPinned,
  Star,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { SearchForm } from "../../components/SearchForm.jsx";
import { useAuthStore } from "../../store/auth.store.js";
import { useSearchStore } from "../../store/search.store.js";

const destinationCards = [
  {
    name: "Lusaka",
    route: "Capital city departures",
    image:
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=80",
    blurb: "Smooth city pickups, premium lounges, and fast connections to major routes.",
  },
  {
    name: "Ndola",
    route: "Copperbelt comfort rides",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    blurb: "Reliable intercity departures with roomy seating and flexible travel times.",
  },
  {
    name: "Livingstone",
    route: "Scenic long-distance trips",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    blurb: "Travel toward iconic destinations with modern coaches and cleaner boarding flow.",
  },
];

function toSearchQuery(values) {
  const params = new URLSearchParams(values);
  return `/search?${params.toString()}`;
}

export function HomePage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const filters = useSearchStore((state) => state.filters);
  const setFilters = useSearchStore((state) => state.setFilters);

  return (
    <div className="overflow-hidden bg-[linear-gradient(180deg,#fff7f8_0%,#ffffff_22%,#fffaf8_55%,#fff3f4_100%)]">
      <section className="relative isolate">
        <div className="absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(circle_at_top_left,rgba(207,61,79,0.22),transparent_38%),radial-gradient(circle_at_top_right,rgba(146,34,51,0.18),transparent_32%),linear-gradient(135deg,#fff6f7_0%,#ffffff_48%,#fff3f4_100%)]" />
        <div className="absolute left-[-7rem] top-24 -z-10 h-72 w-72 rounded-full bg-brand-200/35 blur-3xl" />
        <div className="absolute right-[-5rem] top-16 -z-10 h-80 w-80 rounded-full bg-rose-200/40 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="relative rounded-[2rem] border border-white/70 bg-white/80 p-3 shadow-[0_30px_100px_rgba(15,23,42,0.16)] backdrop-blur">
            <BusHeroScene />
            <div className="absolute inset-x-0 bottom-[50px] z-20 flex justify-end px-4 sm:px-8 lg:px-16">
              <div className="w-full max-w-[30rem] rounded-[1.6rem] border border-white/35 bg-white/18 p-2 shadow-[0_24px_70px_rgba(15,23,42,0.14)] backdrop-blur-md sm:p-2.5">
                <SearchForm
                  defaultValues={filters}
                  onSubmit={(values) => {
                    setFilters({
                      ...values,
                      activeLeg: "outbound",
                      page: 1,
                      limit: 10,
                    });
                    navigate(
                      toSearchQuery({
                        ...values,
                        activeLeg: "outbound",
                      }),
                    );
                  }}
                  hero
                  showTripType={false}
                  forceOneWay
                  submitLabel="Search live buses"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {!token ? (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-7 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-500">
                Plan your trip
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Search buses first, then login only when it is time to book.
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Everyone can search routes, compare schedules, and explore available buses from
                the home page. Signing in is only required when continuing to seat selection,
                booking, and checkout.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <Link
                  to="/login"
                  className="rounded-[1.5rem] bg-[linear-gradient(135deg,#922233_0%,#cf3d4f_70%,#fb7185_100%)] p-6 text-white shadow-lg shadow-brand-500/20 transition hover:-translate-y-0.5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                    Returning customer
                  </p>
                  <h3 className="mt-3 text-2xl font-black">Login and finish booking</h3>
                  <p className="mt-3 text-sm leading-7 text-white/85">
                    Keep searching freely, then sign in when you are ready to select seats and pay.
                  </p>
                </Link>

                <Link
                  to="/signup"
                  className="rounded-[1.5rem] border border-brand-100 bg-brand-50 p-6 transition hover:-translate-y-0.5 hover:border-brand-200"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">
                    New traveler
                  </p>
                  <h3 className="mt-3 text-2xl font-black text-slate-950">Create your account</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Join once and use the same smooth booking flow for every trip.
                  </p>
                </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-500">
              Top destinations
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Destinations worth the ride
            </h2>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {destinationCards.map((destination) => (
            <article
              key={destination.name}
              className="group overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.09)]"
            >
              <div className="relative overflow-hidden">
                <img
                  src={destination.image}
                  alt={destination.name}
                  className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.05),rgba(15,23,42,0.58))]" />
                <div className="absolute left-5 top-5 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
                  Featured
                </div>
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                      {destination.route}
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-white">{destination.name}</h3>
                  </div>
                  <div className="rounded-2xl bg-white/90 p-3 text-brand-600 shadow-lg">
                    <MapPinned className="h-5 w-5" />
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm leading-7 text-slate-600">{destination.blurb}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    Popular choice
                  </span>
                  {token ? (
                    <Link
                      to="/search"
                      className="text-sm font-semibold text-brand-600 transition hover:text-brand-700"
                    >
                      Search trips
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      className="text-sm font-semibold text-brand-600 transition hover:text-brand-700"
                    >
                      Login to book
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-[2.25rem] bg-slate-950 px-6 py-8 text-white shadow-[0_30px_100px_rgba(15,23,42,0.18)] sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
          <div>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              More visual, more modern, and clearer for guests.
            </h2>
            <p className="mt-4 inline-flex rounded-full border border-brand-300/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-300 backdrop-blur">
              Why this homepage works better
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <InfoTile title="Guest-friendly">
              Guests can search buses from the same animated home section as signed-in users.
            </InfoTile>
            <InfoTile title="Travel-led">
              Destination imagery gives the home page a stronger first impression.
            </InfoTile>
            <InfoTile title="On-brand">
              The existing red, rose, and soft neutral palette remains intact.
            </InfoTile>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoTile({ title, children }) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-white/72">{children}</p>
    </article>
  );
}

function BusHeroScene() {
  return (
    <div className="bus-scene relative overflow-hidden rounded-[1.6rem] p-5 sm:p-6">
      <div className="bus-scene__sun" />
      <div className="bus-scene__cloud bus-scene__cloud--one" />
      <div className="bus-scene__cloud bus-scene__cloud--two" />
      <div className="bus-scene__cloud bus-scene__cloud--three" />
      <div className="bus-scene__mountain bus-scene__mountain--one" />
      <div className="bus-scene__mountain bus-scene__mountain--two" />
      <div className="bus-scene__cityline" />

      <div className="bus-scene__road">
        <div className="bus-scene__road-markings" />
        <div className="bus-scene__bus-shadow" />
        <div className="bus-scene__bus">
          <div className="bus-scene__bus-accent" />
          <div className="bus-scene__bus-roof" />
          <div className="bus-scene__bus-window-row">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="bus-scene__bus-door" />
          <div className="bus-scene__bus-headlight" />
          <div className="bus-scene__bus-name">Likili Motorways</div>
          <div className="bus-scene__bus-logo">
            <BusFront className="h-5 w-5" />
          </div>
          <div className="bus-scene__wheel bus-scene__wheel--front" />
          <div className="bus-scene__wheel bus-scene__wheel--rear" />
        </div>
      </div>
    </div>
  );
}
