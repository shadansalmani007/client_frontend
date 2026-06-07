import {
  getBookingAmount,
  getBookingArrivalTime,
  getBookingDepartureTime,
  getBookingDestination,
  getBookingTicketLabel,
  getBookingSeats,
  getBookingSource,
  getBookingTravelDate,
} from "../utils/booking.js";
import { formatCurrency, formatDate } from "../utils/format.js";
import { StatusBadge } from "./StatusBadge.jsx";

export function TicketDetailsCard({ booking }) {
  const seats = getBookingSeats(booking);
  const departureTime = getBookingDepartureTime(booking);
  const arrivalTime = getBookingArrivalTime(booking);

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-500">
            Ticket
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            {getBookingTicketLabel(booking)}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={booking?.bookingStatus} fallback="Pending" />
          <StatusBadge status={booking?.paymentStatus} fallback="Unpaid" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <InfoItem
          label="Route"
          value={`${getBookingSource(booking) || "Source"} to ${getBookingDestination(booking) || "Destination"}`}
        />
        <InfoItem label="Travel date" value={formatDate(getBookingTravelDate(booking))} />
        <InfoItem label="Seats" value={seats.length ? seats.join(", ") : "Not assigned"} />
        <InfoItem
          label="Amount"
          value={formatCurrency(getBookingAmount(booking), booking?.currency)}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <InfoItem label="Departure" value={departureTime || "TBD"} />
        <InfoItem label="Arrival" value={arrivalTime || "TBD"} />
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-[1.5rem] bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 font-semibold text-slate-900">{value}</p>
    </div>
  );
}
