import { formatCurrency, formatDate } from "../utils/format.js";
import { formatLocationPoint } from "../utils/route-segments.js";
import { MAX_SEATS_PER_BOOKING } from "../store/booking.store.js";

export function BookingSummaryCard({
  source,
  destination,
  date,
  departureTime,
  arrivalTime,
  selectedSeats,
  basePrice,
  currency,
  pickupPoint,
  dropPoint,
}) {
  const totalAmount = Number(basePrice || 0) * selectedSeats.length;

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Booking Summary</h3>
      <div className="mt-4 space-y-3 text-sm text-slate-600">
        <div className="flex items-center justify-between">
          <span>Route</span>
          <span className="font-semibold text-slate-900">
            {source || "Source"} to {destination || "Destination"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Travel date</span>
          <span className="font-semibold text-slate-900">{formatDate(date)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Departure</span>
          <span className="font-semibold text-slate-900">
            {departureTime || "TBD"} to {arrivalTime || "TBD"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Seats</span>
          <span className="font-semibold text-slate-900">
            {selectedSeats.length ? selectedSeats.join(", ") : "No seats selected"}
          </span>
        </div>
        {pickupPoint ? (
          <div className="flex items-center justify-between gap-4">
            <span>Pickup</span>
            <span className="text-right font-semibold text-slate-900">
              {formatLocationPoint(pickupPoint)}
            </span>
          </div>
        ) : null}
        {dropPoint ? (
          <div className="flex items-center justify-between gap-4">
            <span>Drop</span>
            <span className="text-right font-semibold text-slate-900">
              {formatLocationPoint(dropPoint)}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-5 rounded-[1.5rem] bg-slate-50 p-4">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Total passengers</span>
          <span>{selectedSeats.length}</span>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Maximum {MAX_SEATS_PER_BOOKING} seats can be booked at a time.
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-base font-semibold text-slate-900">Estimated fare</span>
          <span className="text-2xl font-bold text-brand-500">
            {formatCurrency(totalAmount, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
