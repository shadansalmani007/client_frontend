import { useQuery } from "@tanstack/react-query";
import {
  ArrowRightLeft,
  BusFront,
  CalendarDays,
  MapPin,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchBuses } from "../../api/bus.api.js";
import { BusCard } from "../../components/BusCard.jsx";
import { EmptyState } from "../../components/EmptyState.jsx";
import { ErrorAlert } from "../../components/ErrorAlert.jsx";
import { Pagination } from "../../components/Pagination.jsx";
import { SearchForm } from "../../components/SearchForm.jsx";
import { useSearchStore } from "../../store/search.store.js";
import { formatDate, getTodayDateValue, isPastDate, parseTimeToMinutes } from "../../utils/format.js";
import { queryKeys } from "../../utils/queryKeys.js";

function parseFilters(searchParams, savedFilters) {
  const today = getTodayDateValue();
  const date = searchParams.get("date") || savedFilters.date || "";
  const normalizedDate = isPastDate(date, today) ? today : date;
  const returnDate = searchParams.get("returnDate") || savedFilters.returnDate || "";
  const normalizedReturnDate =
    returnDate && returnDate >= (normalizedDate || today) ? returnDate : "";

  return {
    source: searchParams.get("source") || savedFilters.source || "",
    destination: searchParams.get("destination") || savedFilters.destination || "",
    date: normalizedDate,
    returnDate: normalizedReturnDate,
    tripType: searchParams.get("tripType") || savedFilters.tripType || "one-way",
    activeLeg: searchParams.get("activeLeg") || savedFilters.activeLeg || "outbound",
    page: Number(searchParams.get("page") || savedFilters.page || 1),
    limit: Number(searchParams.get("limit") || savedFilters.limit || 10),
  };
}

function getActiveTripFilters(filters) {
  const isReturnLeg = filters.tripType === "return" && filters.activeLeg === "return";

  return {
    source: isReturnLeg ? filters.destination : filters.source,
    destination: isReturnLeg ? filters.source : filters.destination,
    date: isReturnLeg ? filters.returnDate : filters.date,
    page: filters.page,
    limit: filters.limit,
  };
}

function getDepartureMinutes(time) {
  const parsedMinutes = parseTimeToMinutes(time);
  if (Number.isNaN(parsedMinutes)) {
    return Number.POSITIVE_INFINITY;
  }

  return parsedMinutes;
}

function getBusPrice(bus) {
  return Number(bus?.basePrice ?? bus?.price ?? 0);
}

function buildDefaultRefinements() {
  return {
    departureTime: "all",
    price: "all",
  };
}

function getActiveRefinementBadges(refinements) {
  const badges = [];

  if (refinements.departureTime !== "all") {
    const matchingOption = TIME_FILTER_OPTIONS.find(
      (option) => option.value === refinements.departureTime,
    );
    badges.push(matchingOption?.label || "Departure time");
  }

  if (refinements.price !== "all") {
    const matchingOption = PRICE_OPTIONS.find((option) => option.value === refinements.price);
    badges.push(matchingOption?.label || "Price");
  }

  return badges;
}

function sortBuses(list, priceOrder) {
  const items = [...list];

  switch (priceOrder) {
    case "price-asc":
      return items.sort((a, b) => getBusPrice(a) - getBusPrice(b));
    case "price-desc":
      return items.sort((a, b) => getBusPrice(b) - getBusPrice(a));
    default:
      return items;
  }
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const savedFilters = useSearchStore((state) => state.filters);
  const setFilters = useSearchStore((state) => state.setFilters);
  const filters = useMemo(
    () => parseFilters(searchParams, savedFilters),
    [savedFilters, searchParams],
  );
  const hasReturnTrip = filters.tripType === "return" && Boolean(filters.returnDate);
  const activeTripFilters = useMemo(() => getActiveTripFilters(filters), [filters]);
  const canSearch = Boolean(
    filters.source &&
      filters.destination &&
      filters.date &&
      (filters.tripType !== "return" || filters.returnDate) &&
      activeTripFilters.date,
  );
  const [isSearchFormOpen, setIsSearchFormOpen] = useState(() => !canSearch);
  const [refinements, setRefinements] = useState(() => buildDefaultRefinements());

  const searchQuery = useQuery({
    queryKey: queryKeys.searchBuses(activeTripFilters),
    queryFn: () => searchBuses(activeTripFilters),
    enabled: canSearch,
  });

  const buses = useMemo(
    () =>
      searchQuery.data?.data ??
      searchQuery.data?.buses ??
      searchQuery.data?.results ??
      (Array.isArray(searchQuery.data) ? searchQuery.data : []),
    [searchQuery.data],
  );
  const pagination = searchQuery.data?.pagination ?? {};

  useEffect(() => {
    if (!canSearch) {
      setIsSearchFormOpen(true);
    }
  }, [canSearch]);

  useEffect(() => {
    if (filters.tripType !== "return" && filters.activeLeg !== "outbound") {
      const nextFilters = {
        ...filters,
        activeLeg: "outbound",
      };

      setFilters(nextFilters);
      setSearchParams(nextFilters);
    }
  }, [filters, setFilters, setSearchParams]);

  useEffect(() => {
    const rawDate = searchParams.get("date") || savedFilters.date || "";
    const rawReturnDate = searchParams.get("returnDate") || savedFilters.returnDate || "";
    const shouldSyncDate = rawDate !== filters.date;
    const shouldSyncReturnDate = rawReturnDate !== filters.returnDate;

    if (!shouldSyncDate && !shouldSyncReturnDate) {
      return;
    }

    setFilters(filters);
    setSearchParams(filters);
  }, [filters, savedFilters.date, savedFilters.returnDate, searchParams, setFilters, setSearchParams]);

  useEffect(() => {
    setRefinements(buildDefaultRefinements());
  }, [activeTripFilters.source, activeTripFilters.destination, activeTripFilters.date]);

  const filteredBuses = useMemo(() => {
    const refined = buses.filter((bus) => {
      const departureBucket = getTimeBucket(bus?.departureTime);

      return (
        (refinements.departureTime === "all" ||
          departureBucket === refinements.departureTime)
      );
    });

    return sortBuses(refined, refinements.price);
  }, [buses, refinements]);

  const activeRefinementBadges = useMemo(
    () => getActiveRefinementBadges(refinements),
    [refinements],
  );
  const refinementActive = activeRefinementBadges.length > 0;
  const summaryCountLabel = searchQuery.isLoading
    ? "Searching buses..."
    : `${filteredBuses.length} bus${filteredBuses.length === 1 ? "" : "es"} found`;
  const activeFilterCount = activeRefinementBadges.length;
  const routeLabel = `${activeTripFilters.source || "Source"} -> ${
    activeTripFilters.destination || "Destination"
  }`;
  const activeLegLabel = filters.activeLeg === "return" ? "Return" : "Onward";

  function handleSearchSubmit(values) {
    const nextFilters = {
      ...values,
      activeLeg: "outbound",
      page: 1,
      limit: filters.limit || 10,
    };

    setFilters(nextFilters);
    setSearchParams(nextFilters);
    setIsSearchFormOpen(false);
  }

  function handleClearFilters() {
    setRefinements(buildDefaultRefinements());
  }

  function handleLegChange(nextLeg) {
    const nextFilters = {
      ...filters,
      activeLeg: nextLeg,
      page: 1,
    };

    setFilters(nextFilters);
    setSearchParams(nextFilters);
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f8fb_0%,#f3f4f8_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <section className="mb-5">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.07)]">
            <div className="flex flex-col gap-4 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <TripMeta
                  icon={MapPin}
                  label={canSearch ? routeLabel : "Enter your route"}
                  strong
                />
                <TripMeta
                  icon={CalendarDays}
                  label={
                    canSearch
                      ? `${activeLegLabel}: ${formatDate(activeTripFilters.date)}`
                      : "Choose travel date"
                  }
                />
                <TripMeta icon={BusFront} label={summaryCountLabel} />
              </div>

              <button
                type="button"
                onClick={() => setIsSearchFormOpen((current) => !current)}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-200 hover:text-brand-600"
              >
                Modify Search
              </button>
            </div>

            {!canSearch || isSearchFormOpen ? (
              <div className="border-t border-slate-200/80 px-5 py-5 sm:px-6">
                <SearchForm
                  resultsPage
                  defaultValues={filters}
                  showTripType={false}
                  submitLabel="Search Buses"
                  onSubmit={handleSearchSubmit}
                />
              </div>
            ) : null}

            {canSearch && hasReturnTrip ? (
              <div className="border-t border-slate-200/80 bg-slate-50/70 px-5 py-4 sm:px-6">
                <TripLegSwitcher
                  activeLeg={filters.activeLeg}
                  outboundLabel={`${filters.source || "Source"} -> ${filters.destination || "Destination"}`}
                  returnLabel={`${filters.destination || "Destination"} -> ${filters.source || "Source"}`}
                  outboundDate={filters.date}
                  returnDate={filters.returnDate}
                  onChange={handleLegChange}
                />
              </div>
            ) : null}
          </div>
        </section>

        {!canSearch ? (
          <EmptyState
            title="Add your route and date to search buses"
            message="Once you enter your trip details, available buses will appear here in a cleaner booking-style layout."
          />
        ) : (
          <section className="space-y-4">
            {searchQuery.error ? (
              <ErrorAlert
                error={searchQuery.error}
                title="We couldn't load bus results"
                actionLabel="Retry"
                onAction={() => searchQuery.refetch()}
              />
            ) : null}

            {!searchQuery.isLoading && !searchQuery.error && buses.length ? (
              <section className="rounded-[1.8rem] border border-slate-200/80 bg-white px-5 py-4 shadow-sm sm:px-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      {activeRefinementBadges.length ? (
                        <div className="flex flex-wrap gap-2">
                          {activeRefinementBadges.map((badge) => (
                            <span
                              key={badge}
                              className="rounded-full bg-[#fff1f2] px-3 py-1 text-xs font-semibold text-brand-700"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <ResultsFilterBar
                    refinements={refinements}
                    activeFilterCount={activeFilterCount}
                    onDepartureChange={(value) =>
                      setRefinements((current) => ({ ...current, departureTime: value }))
                    }
                    onPriceChange={(value) =>
                      setRefinements((current) => ({ ...current, price: value }))
                    }
                    onClear={handleClearFilters}
                  />
                </div>
              </section>
            ) : null}

            {searchQuery.isLoading ? <SearchResultsSkeleton /> : null}

            {!searchQuery.isLoading && !searchQuery.error && !buses.length ? (
              <EmptyState
                title="No buses found for this route/date"
                message="Try another date or adjust your route to see more available trips."
                actionLabel="Modify Search"
                onAction={() => setIsSearchFormOpen(true)}
              />
            ) : null}

            {!searchQuery.isLoading && !searchQuery.error && buses.length && !filteredBuses.length ? (
              <EmptyState
                title="No buses match these filters"
                message="Clear one or more filters to bring the available buses back into view."
                actionLabel="Clear All Filters"
                onAction={handleClearFilters}
              />
            ) : null}

            {!searchQuery.isLoading && !searchQuery.error && filteredBuses.length ? (
              <div className="space-y-4">
                {filteredBuses.map((bus, index) => (
                  <BusCard
                    key={
                      bus.scheduleId ||
                      bus.busId ||
                      bus._id ||
                      bus.id ||
                      `${bus.departureTime || "bus"}-${index}`
                    }
                    bus={bus}
                    filters={activeTripFilters}
                  />
                ))}
              </div>
            ) : null}

            {!searchQuery.isLoading && !searchQuery.error && pagination.totalPages > 1 ? (
              <Pagination
                page={filters.page}
                totalPages={pagination.totalPages || 1}
                onPageChange={(page) => {
                  const nextFilters = {
                    ...filters,
                    page,
                  };

                  setFilters(nextFilters);
                  setSearchParams(nextFilters);
                }}
              />
            ) : null}
          </section>
        )}
      </div>
    </div>
  );
}

const TIME_FILTER_OPTIONS = [
  { value: "all", label: "Any time" },
  { value: "before-6", label: "Before 6 AM" },
  { value: "6-12", label: "6 AM - 12 PM" },
  { value: "12-18", label: "12 PM - 6 PM" },
  { value: "after-18", label: "After 6 PM" },
];

const PRICE_OPTIONS = [
  { value: "all", label: "All prices" },
  { value: "price-asc", label: "Low to high" },
  { value: "price-desc", label: "High to low" },
];

function getTimeBucket(time) {
  const minutes = getDepartureMinutes(time);

  if (!Number.isFinite(minutes)) {
    return "unknown";
  }

  if (minutes < 6 * 60) {
    return "before-6";
  }

  if (minutes < 12 * 60) {
    return "6-12";
  }

  if (minutes < 18 * 60) {
    return "12-18";
  }

  return "after-18";
}

function TripMeta({ icon: Icon, label, strong = false }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-slate-600">
      <Icon className="h-4 w-4 text-brand-500" />
      <span className={strong ? "font-bold text-slate-900" : "font-semibold"}>{label}</span>
    </div>
  );
}

function ResultsFilterBar({
  refinements,
  activeFilterCount,
  onDepartureChange,
  onPriceChange,
  onClear,
}) {
  return (
    <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50/80 p-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[190px_190px_auto] xl:items-end">
        <FilterSelect
          label="Departure"
          value={refinements.departureTime}
          onChange={onDepartureChange}
          options={TIME_FILTER_OPTIONS.map((option) => ({
            value: option.value,
            label: option.value === "all" ? "All departure times" : option.label,
          }))}
        />
        <FilterSelect
          label="Price"
          value={refinements.price}
          onChange={onPriceChange}
          options={PRICE_OPTIONS}
        />
        <div className="hidden xl:flex xl:items-end xl:justify-between xl:gap-3">
          <div className="min-w-0 flex-1" />
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-600"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between xl:hidden">
        <div />
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-600"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}

function TripLegSwitcher({
  activeLeg,
  outboundLabel,
  returnLabel,
  outboundDate,
  returnDate,
  onChange,
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">
          Return Trip
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Search one leg at a time so booking stays simple.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <TripLegButton
          active={activeLeg !== "return"}
          title="Onward"
          route={outboundLabel}
          date={outboundDate}
          onClick={() => onChange("outbound")}
        />
        <TripLegButton
          active={activeLeg === "return"}
          title="Return"
          route={returnLabel}
          date={returnDate}
          onClick={() => onChange("return")}
        />
      </div>
    </div>
  );
}

function TripLegButton({ active, title, route, date, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.2rem] border px-4 py-3 text-left transition ${
        active
          ? "border-brand-200 bg-white shadow-sm"
          : "border-slate-200 bg-white/70 hover:border-brand-200"
      }`}
    >
      <div className="flex items-center gap-2 text-brand-500">
        <ArrowRightLeft className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-[0.2em]">{title}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-900">{route}</p>
      <p className="mt-1 text-xs text-slate-500">{formatDate(date)}</p>
    </button>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="form-input border border-slate-200 bg-white shadow-none transition focus:border-brand-200"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-[1.8rem] border border-slate-200/80 bg-white px-5 py-4 shadow-sm sm:px-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-52 rounded-full bg-slate-200" />
          <div className="h-4 w-64 rounded-full bg-slate-200" />
        </div>
      </div>

      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="rounded-[1.9rem] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="animate-pulse grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)_180px] xl:items-center">
            <div className="space-y-4 xl:border-r xl:border-slate-100 xl:pr-6">
              <div className="h-6 w-40 rounded-full bg-slate-200" />
              <div className="h-4 w-28 rounded-full bg-slate-200" />
              <div className="flex gap-2">
                <div className="h-7 w-16 rounded-full bg-slate-200" />
                <div className="h-7 w-16 rounded-full bg-slate-200" />
              </div>
            </div>

            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
              <div className="space-y-3">
                <div className="h-8 w-20 rounded-full bg-slate-200" />
                <div className="h-4 w-24 rounded-full bg-slate-200" />
              </div>
              <div className="space-y-3">
                <div className="mx-auto h-5 w-20 rounded-full bg-slate-200" />
                <div className="h-1 w-full rounded-full bg-slate-200" />
              </div>
              <div className="justify-self-end space-y-3">
                <div className="h-8 w-20 rounded-full bg-slate-200" />
                <div className="h-4 w-24 rounded-full bg-slate-200" />
              </div>
            </div>

            <div className="space-y-3 xl:border-l xl:border-slate-100 xl:pl-6">
              <div className="h-8 w-24 rounded-full bg-slate-200" />
              <div className="h-5 w-28 rounded-full bg-slate-200" />
              <div className="h-12 w-full rounded-full bg-slate-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
