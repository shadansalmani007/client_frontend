import {
  ArrowRight,
  BusFront,
  Snowflake,
  Star,
  UtensilsCrossed,
  Wifi,
} from "lucide-react";
import { Link, createSearchParams } from "react-router-dom";
import { useBookingStore } from "../store/booking.store.js";
import { getResolvedFare } from "../utils/fare.js";
import { calculateDuration, formatCurrency, hasDateTimePassed } from "../utils/format.js";
import {
  formatLocationPoint,
  getRouteStopArrivalTime,
  getRouteStopDepartureTime,
  getPointCity,
  normalizeIntermediateStops,
  normalizeLocationPoints,
  normalizeRouteStop,
} from "../utils/route-segments.js";

function createBusHref(bus, fallbackFilters) {
  const resolvedFare = getResolvedFare(bus) ?? 0;
  const params = createSearchParams({
    scheduleId: bus.scheduleId || "",
    routeId: bus.routeId || "",
    date: fallbackFilters.date || "",
    source: fallbackFilters.source || bus.source || "",
    destination: fallbackFilters.destination || bus.destination || "",
    basePrice: String(resolvedFare),
    currency: bus.currency || "",
  });

  return `/buses/${bus.busId || bus._id || bus.id}?${params.toString()}`;
}

function getBusType(bus) {
  return bus.busType || bus.type || "Standard";
}

function getPrimaryPointLabel(pointList, fallbackLabel) {
  return formatLocationPoint(pointList[0]) || fallbackLabel || "Not provided";
}

function getSeatCapacity(bus) {
  const value = Number(bus.totalSeats ?? bus.seats ?? bus.capacity ?? 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function getAmenityMeta(amenity) {
  const normalized = String(amenity || "").toLowerCase();

  if (normalized.includes("wifi")) {
    return {
      icon: Wifi,
      label: "WiFi",
      className: "bg-emerald-50 text-emerald-700",
    };
  }

  if (normalized.includes("ac") || normalized.includes("air")) {
    return {
      icon: Snowflake,
      label: "AC",
      className: "bg-blue-50 text-blue-700",
    };
  }

  if (normalized.includes("meal") || normalized.includes("food")) {
    return {
      icon: UtensilsCrossed,
      label: "Meals",
      className: "bg-amber-50 text-amber-700",
    };
  }

  return {
    icon: BusFront,
    label: amenity,
    className: "bg-slate-100 text-slate-700",
  };
}

export function BusCard({ bus, filters }) {
  const setScheduleContext = useBookingStore((state) => state.setScheduleContext);
  const sourceStop = normalizeRouteStop(bus.sourceStop);
  const destinationStop = normalizeRouteStop(bus.destinationStop);
  const resolvedFare = getResolvedFare(bus) ?? 0;
  const amenities = Array.isArray(bus.amenities) ? bus.amenities.filter(Boolean) : [];
  const intermediateStops = normalizeIntermediateStops(bus.intermediateStops);
  const boardingPoints = normalizeLocationPoints(bus.boardingPoints);
  const droppingPoints = normalizeLocationPoints(bus.droppingPoints);
  const sourceLabel =
    bus.source || sourceStop?.city || getPointCity(boardingPoints[0]) || filters.source || "Source";
  const destinationLabel =
    bus.destination ||
    destinationStop?.city ||
    getPointCity(droppingPoints[0]) ||
    filters.destination ||
    "Destination";
  const pickupLabel = getPrimaryPointLabel(
    boardingPoints,
    sourceStop?.name || sourceStop?.city || sourceLabel,
  );
  const dropLabel = getPrimaryPointLabel(
    droppingPoints,
    destinationStop?.name || destinationStop?.city || destinationLabel,
  );
  const departureDisplayTime = getRouteStopDepartureTime(
    sourceStop,
    bus.effectiveDepartureTime || bus.departureTime,
  );
  const arrivalDisplayTime = getRouteStopArrivalTime(
    destinationStop,
    bus.effectiveArrivalTime || bus.arrivalTime,
  );
  const duration =
    calculateDuration(departureDisplayTime, arrivalDisplayTime) ||
    bus.duration ||
    "Duration unavailable";
  const busType = getBusType(bus);
  const price = formatCurrency(resolvedFare, bus.currency);
  const availableSeats = Number(bus.availableSeats ?? 0);
  const seatCapacity = getSeatCapacity(bus);
  const stopsLabel = intermediateStops.length
    ? `${intermediateStops.length} stop${intermediateStops.length === 1 ? "" : "s"}`
    : "Non-stop";
  const rating = Number(bus.rating);
  const ratingAvailable = Number.isFinite(rating) && rating > 0;
  const displayAmenities = amenities.slice(0, 3).map(getAmenityMeta);
  const seatsMetaLabel = seatCapacity ? `${seatCapacity} seats` : `${availableSeats} seats`;
  const departurePassed = hasDateTimePassed(
    filters.date || bus.departureDate || bus.date || "",
    departureDisplayTime,
  );
  const seatAvailabilityLabel =
    departurePassed
      ? "Departure passed"
      : availableSeats > 0
      ? `Only ${availableSeats} seat${availableSeats === 1 ? "" : "s"} left`
      : "Sold out";
  const canSelectSeats = availableSeats > 0 && !departurePassed;

  return (
    <article className="group rounded-[1.9rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)_190px] xl:items-center xl:gap-6">
        <div className="space-y-4 xl:border-r xl:border-slate-100 xl:pr-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff3ef] text-brand-500">
              <BusFront className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-lg font-black tracking-tight text-slate-950 sm:text-xl">
                {bus.busName || bus.name || "Unnamed bus"}
              </h3>

              {ratingAvailable ? (
                <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white">
                  <Star className="h-3 w-3 fill-current" />
                  {rating.toFixed(1)}
                </div>
              ) : null}

              <p className="mt-2 text-sm text-slate-500">
                {busType} - {seatsMetaLabel}
              </p>
            </div>
          </div>

          {displayAmenities.length ? (
            <div className="flex flex-wrap gap-2">
              {displayAmenities.map((amenity) => {
                const Icon = amenity.icon;

                return (
                  <span
                    key={`${amenity.label}-${bus.scheduleId || bus.id || amenity.label}`}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${amenity.className}`}
                  >
                    <Icon className="h-3 w-3" />
                    {amenity.label}
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="xl:px-2">
          <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,96px)_minmax(0,1fr)_minmax(0,96px)] sm:gap-5">
            <div className="text-left">
              <p className="text-sm font-bold uppercase tracking-[0.08em] text-slate-700 sm:text-[15px]">
                {sourceLabel}
              </p>
            </div>

            <div className="min-w-0 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">
                {duration}
              </p>
              <div className="mt-3 flex items-center gap-2 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-brand-500 bg-white" />
                <span className="h-0.5 flex-1 bg-slate-200" />
                <span className="min-w-fit text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {stopsLabel}
                </span>
                <span className="h-0.5 flex-1 bg-slate-200" />
                <span className="h-2.5 w-2.5 rounded-full border-2 border-slate-300 bg-white" />
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-sm font-bold uppercase tracking-[0.08em] text-slate-700 sm:text-[15px]">
                {destinationLabel}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-[13px] text-slate-500 sm:grid-cols-2 sm:gap-3">
            <div className="rounded-xl bg-slate-50 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Pickup
              </p>
              <p className="mt-1 truncate font-semibold text-slate-700">{pickupLabel}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {departureDisplayTime || "TBD"}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2.5 sm:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Drop
              </p>
              <p className="mt-1 truncate font-semibold text-slate-700">{dropLabel}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {arrivalDisplayTime || "TBD"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 xl:border-l xl:border-slate-100 xl:pl-5">
          <div className="xl:text-right">
            <p className="text-[2rem] font-black tracking-tight text-brand-600 sm:text-[2.15rem]">
              {price}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">per person</p>
          </div>

          <div className="mt-5 flex xl:justify-end">
            <span
              className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                canSelectSeats
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {seatAvailabilityLabel}
            </span>
          </div>

          {departurePassed ? (
            <p className="text-xs text-amber-700 xl:text-right">
              This trip has already departed from {sourceLabel} at {departureDisplayTime}.
            </p>
          ) : null}

          {canSelectSeats ? (
            <Link
              to={createBusHref(bus, filters)}
              onClick={() =>
                setScheduleContext({
                  busId: bus.busId || bus._id || bus.id || "",
                  scheduleId: bus.scheduleId || "",
                  routeId: bus.routeId || "",
                  date: filters.date || bus.departureDate || "",
                  source: filters.source || bus.source || "",
                  destination: filters.destination || bus.destination || "",
                  basePrice: resolvedFare,
                  currency: bus.currency || "",
                  sourceStop,
                  destinationStop,
                  boardingPoints,
                  droppingPoints,
                  intermediateStops,
                })
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-[1rem] bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-600 xl:rounded-full"
            >
              Select Seats
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <span className="inline-flex w-full items-center justify-center rounded-[1rem] bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-500 xl:rounded-full">
              {departurePassed ? "Booking closed" : "Sold out"}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
