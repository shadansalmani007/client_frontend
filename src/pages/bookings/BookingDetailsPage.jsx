import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, Download, LoaderCircle, WalletCards } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  cancelCustomerBooking,
  getCustomerBookingDetails,
} from "../../api/customer-booking.api.js";
import { ErrorAlert } from "../../components/ErrorAlert.jsx";
import { LoadingState } from "../../components/LoadingState.jsx";
import LucideIcon from "../../components/LucideIcon.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { TicketDetailsCard } from "../../components/TicketDetailsCard.jsx";
import { useSearchStore } from "../../store/search.store.js";
import { useUiStore } from "../../store/ui.store.js";
import {
  getBookingAmount,
  getBookingArrivalTime,
  getBookingBoardingPoint,
  getBookingBusName,
  getBookingBusNumber,
  getBookingCanCancel,
  getBookingContactEmail,
  getBookingContactPhone,
  getBookingDepartureTime,
  getBookingDestination,
  getBookingDroppingPoint,
  getBookingNumber,
  getBookingPassengerDetails,
  getBookingPaymentMethod,
  getBookingPaymentStatus,
  getBookingPayments,
  getBookingSeats,
  getBookingSource,
  getBookingTicketLabel,
  getBookingTravelDate,
  isSuccessfulPaymentStatus,
} from "../../utils/booking.js";
import { formatCurrency, formatDate } from "../../utils/format.js";
import { queryKeys } from "../../utils/queryKeys.js";
import {
  formatLocationPoint,
  getLocationPointDescription,
  normalizeLocationPoint,
} from "../../utils/route-segments.js";
import { downloadTripDetailsPdf } from "../../utils/trip-pdf.js";

export function BookingDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useUiStore((state) => state.addToast);
  const clearRouteInputs = useSearchStore((state) => state.clearRouteInputs);
  const setFilters = useSearchStore((state) => state.setFilters);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const bookingDetailsQuery = useQuery({
    queryKey: queryKeys.booking(id),
    queryFn: () => getCustomerBookingDetails(id),
    enabled: Boolean(id),
  });

  const cancelForm = useForm({
    defaultValues: {
      cancellationReason: "",
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (payload) => cancelCustomerBooking(id, payload),
    onSuccess: async (result) => {
      queryClient.setQueryData(queryKeys.booking(id), result);

      addToast({
        type: "success",
        title: "Booking cancelled",
        message: result?.message || "The booking was cancelled successfully.",
      });

      setShowCancelForm(false);
      cancelForm.reset();
      clearRouteInputs();

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.booking(id) }),
        queryClient.invalidateQueries({ queryKey: ["my-bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["bus-seats"] }),
      ]);
    },
  });

  if (bookingDetailsQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <LoadingState label="Loading booking details..." />
      </div>
    );
  }

  const details = bookingDetailsQuery.data || {};
  const booking = details.booking || {};
  const payments = getBookingPayments(details);
  const seats = getBookingSeats(booking);
  const passengerDetails = getBookingPassengerDetails(booking);
  const canCancel = getBookingCanCancel(details);
  const paymentStatus = getBookingPaymentStatus(details) || booking.paymentStatus;
  const paymentMethod = getBookingPaymentMethod({
    ...booking,
    payments,
  });
  const travelDate = getBookingTravelDate(booking);
  const sourceLabel = getBookingSource(booking);
  const destinationLabel = getBookingDestination(booking);
  const canBookReturnTrip = Boolean(sourceLabel && destinationLabel && travelDate);
  const hasSuccessfulPayment = isSuccessfulPaymentStatus(paymentStatus);
  const canMakePayment = !hasSuccessfulPayment;
  const verifiedTicketNumber = location.state?.ticketNumber || getBookingNumber(booking);
  const showPaymentSuccessBanner = Boolean(location.state?.paymentSuccessful);

  const handleDownloadPdf = async () => {
    if (!hasSuccessfulPayment) {
      addToast({
        type: "error",
        title: "Payment required",
        message: "Trip PDF is available only after payment is successful.",
      });
      return;
    }

    try {
      setIsExportingPdf(true);

      const bookingNumber = getBookingNumber(booking);
      const sourceLabel = getBookingSource(booking) || "SOURCE";
      const destinationLabel = getBookingDestination(booking) || "DESTINATION";
      const pickupPointLabel = formatPointForDownload(
        booking.pickupPoint,
        getBookingBoardingPoint(booking) || "Not available",
      );
      const dropPointLabel = formatPointForDownload(
        booking.dropPoint,
        getBookingDroppingPoint(booking) || "Not available",
      );

      downloadTripDetailsPdf({
        filename: buildTripPdfFilename({
          date: travelDate,
          source: sourceLabel,
          destination: destinationLabel,
          fallback: bookingNumber,
        }),
        title: "Likili Motorways Trip Details",
        subtitle: getBookingTicketLabel(booking),
        sections: [
          {
            title: "Travel Details",
            lines: [
              `Route: ${getBookingSource(booking) || "Source"} to ${getBookingDestination(booking) || "Destination"}`,
              `Travel date: ${formatDate(getBookingTravelDate(booking))}`,
              `Departure time: ${getBookingDepartureTime(booking) || "TBD"}`,
              `Arrival time: ${getBookingArrivalTime(booking) || "TBD"}`,
              `Bus name: ${getBookingBusName(booking) || "Not available"}`,
              `Bus number: ${getBookingBusNumber(booking) || "Not available"}`,
              `Seats: ${seats.length ? seats.join(", ") : "Pending"}`,
              `Pickup point: ${pickupPointLabel}`,
              `Drop point: ${dropPointLabel}`,
            ],
          },
          {
            title: "Passenger Details",
            lines: passengerDetails.length
              ? passengerDetails.flatMap((passenger, index) => [
                  `Passenger ${index + 1}: ${passenger.passengerName || "Not provided"}`,
                  `Seat: ${passenger.seatNumber || "Not assigned"} | Age: ${
                    passenger.passengerAge || "Not provided"
                  } | Gender: ${passenger.passengerGender || "Not provided"}`,
                ])
              : ["Passenger details are not available for this booking yet."],
          },
          {
            title: "Contact and Payment",
            lines: [
              `Email: ${getBookingContactEmail(booking) || "Not available"}`,
              `Phone: ${getBookingContactPhone(booking) || "Not available"}`,
              `Payment method: ${paymentMethod || "Not available"}`,
              `Payment status: ${paymentStatus || "Unpaid"}`,
              `Booking status: ${booking.bookingStatus || "Pending"}`,
              `Amount: ${formatCurrency(getBookingAmount(booking), booking.currency)}`,
            ],
          },
        ],
        footer: `Generated on ${new Date().toLocaleString()}`,
      });

      addToast({
        type: "success",
        title: "PDF ready",
        message: "Your trip details PDF has been downloaded.",
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "PDF download failed",
        message: error?.message || "We could not generate the trip PDF right now.",
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleBookReturnTrip = () => {
    if (!canBookReturnTrip) {
      addToast({
        type: "error",
        title: "Return trip unavailable",
        message: "We need the route and travel date before we can search return buses.",
      });
      return;
    }

    const nextFilters = {
      source: destinationLabel,
      destination: sourceLabel,
      date: travelDate,
      returnDate: "",
      tripType: "one-way",
      activeLeg: "outbound",
      page: 1,
      limit: 10,
    };

    setFilters(nextFilters);
    navigate(`/search?${new URLSearchParams(nextFilters).toString()}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-500">
              Booking Details
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">
              {getBookingTicketLabel(booking)}
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {canMakePayment ? (
              <button
                type="button"
                onClick={() => navigate(`/checkout/${id}`)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#fde68a_0%,#fbbf24_100%)] px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_16px_40px_rgba(251,191,36,0.28)] transition hover:-translate-y-0.5"
              >
                <WalletCards className="h-4 w-4" />
                Make Payment
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleBookReturnTrip}
              disabled={!canBookReturnTrip}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-5 py-3 text-sm font-semibold text-brand-600 transition hover:border-brand-300 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Book return trip
            </button>

            {hasSuccessfulPayment ? (
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isExportingPdf ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isExportingPdf ? "Preparing PDF..." : "Download trip PDF"}
              </button>
            ) : null}
          </div>
        </div>

        {bookingDetailsQuery.error ? <ErrorAlert error={bookingDetailsQuery.error} /> : null}
        {cancelMutation.error ? <ErrorAlert error={cancelMutation.error} /> : null}

        {showPaymentSuccessBanner ? (
          <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Payment Successful
            </p>
            <h2 className="mt-3 text-2xl font-bold text-emerald-950">
              Ticket No: {verifiedTicketNumber}
            </h2>
            <p className="mt-2 text-sm text-emerald-800">
              Your payment has been verified and your ticket is now ready.
            </p>
          </div>
        ) : null}

        <div className="space-y-6">
          <TicketDetailsCard booking={{ ...booking, payments, paymentStatus }} />

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">Travel Details</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <InfoTile
                    label="Route"
                    value={`${getBookingSource(booking) || "Source"} to ${getBookingDestination(booking) || "Destination"}`}
                  />
                  <InfoTile label="Travel date" value={formatDate(getBookingTravelDate(booking))} />
                  <InfoTile label="Departure time" value={getBookingDepartureTime(booking) || "TBD"} />
                  <InfoTile label="Seats" value={seats.length ? seats.join(", ") : "Pending"} />
                  <InfoTile
                    label="Pickup point"
                    value={
                      <PointDetails
                        point={booking.pickupPoint}
                        fallback={getBookingBoardingPoint(booking) || "Not available"}
                      />
                    }
                  />
                  <InfoTile
                    label="Drop point"
                    value={
                      <PointDetails
                        point={booking.dropPoint}
                        fallback={getBookingDroppingPoint(booking) || "Not available"}
                      />
                    }
                  />
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-brand-500 via-rose-500 to-orange-400 text-white shadow-lg shadow-brand-200/70">
                      <LucideIcon name="users" className="h-7 w-7" />
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      <h2 className="text-xl font-semibold text-slate-900">Passenger Details</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Traveler information for each reserved seat on this trip.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 lg:justify-end lg:self-center">
                    <PassengerSummaryChip
                      icon="users"
                      label="Passengers"
                      value={passengerDetails.length || 0}
                    />
                    <PassengerSummaryChip
                      icon="ticket"
                      label="Seats"
                      value={seats.length || passengerDetails.length || 0}
                    />
                  </div>
                </div>

                {passengerDetails.length ? (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {passengerDetails.map((passenger, index) => (
                      <div
                        key={`${passenger.seatNumber || "seat"}-${index}`}
                        className="overflow-hidden rounded-[1.75rem] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-orange-50 p-5 shadow-sm shadow-rose-100/60"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] bg-white text-brand-500 shadow-sm ring-1 ring-rose-100">
                              {passenger.passengerName ? (
                                <span className="text-lg font-bold uppercase tracking-wide">
                                  {getPassengerInitials(passenger.passengerName)}
                                </span>
                              ) : (
                                <LucideIcon name="user" className="h-6 w-6" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">
                                Passenger {index + 1}
                              </p>
                              <p className="mt-1 break-words text-lg font-semibold text-slate-900">
                                {passenger.passengerName || `Traveler ${index + 1}`}
                              </p>
                            </div>
                          </div>

                          <div className="inline-flex self-start rounded-full border border-rose-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm sm:shrink-0">
                            <div className="flex items-center gap-2">
                            <LucideIcon name="ticket" className="h-4 w-4 text-brand-500" />
                            {passenger.seatNumber || "Seat pending"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          <PassengerMetaItem
                            icon="user"
                            label="Seat"
                            value={passenger.seatNumber || "Not assigned"}
                          />
                          <PassengerMetaItem
                            icon="info"
                            label="Age"
                            value={passenger.passengerAge || "Not provided"}
                          />
                          <PassengerMetaItem
                            icon="users"
                            label="Gender"
                            value={passenger.passengerGender || "Not provided"}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    Passenger details are not available for this booking yet.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">Booking Summary</h2>
                <div className="mt-5 space-y-3 text-sm text-slate-600">
                  <SummaryRow
                    label="Ticket No"
                    value={getBookingNumber(booking)}
                  />
                  <SummaryRow
                    label="Booking status"
                    value={<StatusBadge status={booking.bookingStatus} fallback="Pending" />}
                  />
                  <SummaryRow
                    label="Payment status"
                    value={<StatusBadge status={paymentStatus} fallback="Unpaid" />}
                  />
                  <SummaryRow
                    label="Payment method"
                    value={paymentMethod || "Not available"}
                  />
                  <SummaryRow
                    label="Amount"
                    value={
                      <span className="text-xl font-bold text-brand-500">
                        {formatCurrency(getBookingAmount(booking), booking.currency)}
                      </span>
                    }
                  />
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">Contact Details</h2>
                <div className="mt-6 grid gap-4">
                  <InfoTile label="Email" value={getBookingContactEmail(booking) || "Not available"} />
                  <InfoTile label="Phone" value={getBookingContactPhone(booking) || "Not available"} />
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold text-slate-900">Cancel Booking</h2>
                  {canCancel ? (
                    <button
                      type="button"
                      onClick={() => setShowCancelForm((current) => !current)}
                      className="text-sm font-semibold text-brand-500"
                    >
                      {showCancelForm ? "Close" : "Cancel now"}
                    </button>
                  ) : null}
                </div>

                {canCancel ? (
                  showCancelForm ? (
                    <form
                      onSubmit={cancelForm.handleSubmit((values) => cancelMutation.mutate(values))}
                      className="mt-5 space-y-4"
                    >
                      <div>
                        <label className="form-label">Cancellation Reason</label>
                        <textarea
                          rows={4}
                          className="form-input"
                          {...cancelForm.register("cancellationReason", {
                            required: "Cancellation reason is required.",
                            minLength: {
                              value: 5,
                              message: "Please provide a short reason.",
                            },
                          })}
                        />
                        {cancelForm.formState.errors.cancellationReason ? (
                          <p className="form-error">
                            {cancelForm.formState.errors.cancellationReason.message}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="submit"
                        disabled={cancelMutation.isPending}
                        className="inline-flex w-full items-center justify-center rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {cancelMutation.isPending ? "Cancelling..." : "Confirm cancellation"}
                      </button>
                    </form>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">
                      This booking can still be cancelled according to the backend rules.
                    </p>
                  )
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    This booking can no longer be cancelled.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PassengerSummaryChip({ icon, label, value }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-500 shadow-sm">
        <LucideIcon name={icon} className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          {label}
        </p>
        <p className="text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function PassengerMetaItem({ icon, label, value }) {
  return (
    <div className="rounded-[1.1rem] border border-white/80 bg-white/80 p-3 text-center backdrop-blur">
      <div className="flex items-center justify-center gap-2 text-slate-400">
        <LucideIcon name={icon} className="h-4 w-4 text-brand-500" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">{label}</p>
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-[1.5rem] bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
        {label}
      </p>
      <div className="mt-2 font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function PointDetails({ point, fallback }) {
  const normalizedPoint = normalizeLocationPoint(point);

  if (!normalizedPoint) {
    return fallback;
  }

  return (
    <div className="space-y-1">
      <p>{formatLocationPoint(normalizedPoint)}</p>
      {getLocationPointDescription(normalizedPoint) ? (
        <p className="text-sm font-normal text-slate-500">
          {getLocationPointDescription(normalizedPoint)}
        </p>
      ) : null}
    </div>
  );
}

function formatPointForDownload(point, fallback) {
  const normalizedPoint = normalizeLocationPoint(point);

  if (!normalizedPoint) {
    return fallback;
  }

  const primary = formatLocationPoint(normalizedPoint);
  const description = getLocationPointDescription(normalizedPoint);

  return description ? `${primary} - ${description}` : primary;
}

function buildTripPdfFilename({ date, source, destination, fallback }) {
  const formattedDate = formatDateForFilename(date);
  const route = `${sanitizeFilenameSegment(source).toUpperCase()} TO ${sanitizeFilenameSegment(
    destination,
  ).toUpperCase()}`;

  if (formattedDate && route.replace(/\s+/g, "")) {
    return `Trip-${formattedDate}_(${route}).pdf`;
  }

  return `${sanitizeFilenameSegment(fallback || "trip-details")}.pdf`;
}

function formatDateForFilename(value) {
  if (!value) {
    return "";
  }

  const normalized = String(value).trim();
  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    return `${isoMatch[2]}-${isoMatch[3]}-${isoMatch[1]}`;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const year = String(parsed.getFullYear());
  return `${month}-${day}-${year}`;
}

function sanitizeFilenameSegment(value) {
  return String(value || "")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getPassengerInitials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}
