import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { getPaymentDetails } from "../../api/payment.api.js";
import { getCustomerBookingDetails } from "../../api/customer-booking.api.js";
import { FlutterwavePaymentButton } from "../../components/FlutterwavePaymentButton.jsx";
import { ErrorAlert } from "../../components/ErrorAlert.jsx";
import { LoadingState } from "../../components/LoadingState.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { useAuthStore } from "../../store/auth.store.js";
import {
  getBookingAmount,
  getBookingContactEmail,
  getBookingContactPhone,
  getBookingPaymentId,
  getBookingPaymentStatus,
  getBookingPassengers,
  getBookingSeats,
  getBookingTicketLabel,
} from "../../utils/booking.js";
import { formatCurrency, formatDate } from "../../utils/format.js";
import { queryKeys } from "../../utils/queryKeys.js";

export function CheckoutPage() {
  const { bookingId } = useParams();
  const user = useAuthStore((state) => state.user);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  const bookingQuery = useQuery({
    queryKey: queryKeys.booking(bookingId),
    queryFn: () => getCustomerBookingDetails(bookingId),
    enabled: Boolean(bookingId),
  });

  const bookingDetails = bookingQuery.data || {};
  const booking = bookingDetails.booking || {};
  const bookingPayments = bookingDetails.payments || [];
  const paymentId = getBookingPaymentId(booking, bookingPayments[0]);

  const paymentQuery = useQuery({
    queryKey: queryKeys.payment(paymentId),
    queryFn: () => getPaymentDetails(paymentId),
    enabled: Boolean(paymentId),
  });

  const paymentRecord = paymentQuery.data || bookingPayments[0] || {};
  const seats = getBookingSeats(booking);
  const amount = Number(
    getBookingAmount({ ...booking, payment: paymentRecord, payments: [paymentRecord] }),
  ) || 0;
  const currency = "ZMW";
  const paymentStatus =
    getBookingPaymentStatus({ booking, payments: paymentRecord?._id ? [paymentRecord] : bookingPayments }) ||
    booking.paymentStatus;
  const paymentStatusValue = String(paymentStatus || "").toLowerCase();
  const isAlreadyPaid = ["paid", "successful", "completed", "complete", "verified"].includes(
    paymentStatusValue,
  );
  const customerName =
    booking?.customer?.name ||
    booking?.user?.name ||
    user?.name ||
    getBookingPassengers(booking)[0] ||
    "Likili Traveler";
  const customerEmail = getBookingContactEmail(booking) || user?.email || "";
  const customerPhone = getBookingContactPhone(booking) || user?.phone || "";

  if (bookingQuery.isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <LoadingState label="Loading booking..." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-500">
                  Checkout
                </p>
                <h1 className="mt-3 text-3xl font-bold text-slate-900">Complete your payment</h1>
                <p className="mt-2 text-sm text-slate-500">{getBookingTicketLabel(booking)}</p>
              </div>
              <div className="flex gap-2">
                <StatusBadge status={booking.bookingStatus} fallback="Pending" />
                <StatusBadge status={paymentStatus} fallback="Unpaid" />
              </div>
            </div>
          </div>

          {bookingQuery.error ? <ErrorAlert error={bookingQuery.error} /> : null}
          {paymentQuery.error ? <ErrorAlert error={paymentQuery.error} /> : null}

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Mobile money payment</h2>
            <p className="mt-2 text-sm text-slate-500">
              Select Airtel Money, MTN Money, or Zamtel Money, then continue with Flutterwave checkout.
            </p>

            {!import.meta.env.VITE_FLW_PUBLIC_KEY?.trim() ? (
              <div className="mt-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Flutterwave setup is not complete yet.</p>
                <p className="mt-2">
                  Add <code>VITE_FLW_PUBLIC_KEY</code> to your local <code>.env</code> before testing payment.
                </p>
              </div>
            ) : null}

            {!amount || amount <= 0 ? (
              <div className="mt-6 rounded-[1.5rem] border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <p className="font-semibold">Booking amount is missing.</p>
                <p className="mt-2">
                  Flutterwave cannot start with <code>0.00</code>. Please refresh this booking or check the fare returned by the API.
                </p>
              </div>
            ) : null}

            {isVerifyingPayment ? (
              <div className="mt-6 rounded-[1.5rem] border border-brand-200 bg-brand-50 p-4 text-sm text-brand-700">
                <p className="font-semibold">Verifying payment...</p>
                <p className="mt-2">
                  Please wait while we confirm your payment with the backend before showing your ticket.
                </p>
              </div>
            ) : null}

            <div className="mt-6">
              <FlutterwavePaymentButton
                bookingId={bookingId}
                amount={amount}
                currency={currency}
                customerName={customerName}
                customerEmail={customerEmail}
                customerPhone={customerPhone}
                paymentId={paymentId}
                onVerificationStateChange={setIsVerifyingPayment}
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Payment Status</h2>
            <p className="mt-2 text-sm text-slate-500">
              Payment is verified only after the backend confirm step returns success.
            </p>

            {paymentQuery.isLoading ? (
              <div className="mt-6">
                <LoadingState label="Loading payment details..." />
              </div>
            ) : paymentRecord?._id ? (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <InfoTile label="Payment ID" value={paymentRecord._id || "Pending"} />
                <InfoTile
                  label="Provider"
                  value={paymentRecord.provider || booking.paymentMethod || "Flutterwave"}
                />
                <InfoTile
                  label="Status"
                  value={paymentRecord.status || paymentStatus || "Pending"}
                />
              </div>
            ) : (
              <p className="mt-6 text-sm text-slate-500">
                No verified payment record yet. Complete Flutterwave checkout above first.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Trip Summary</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Route</span>
                <span className="font-semibold text-slate-900">
                  {booking.source || "Source"} to {booking.destination || "Destination"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Travel date</span>
                <span className="font-semibold text-slate-900">
                  {formatDate(booking.travelDate || booking.departureDate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Seats</span>
                <span className="font-semibold text-slate-900">
                  {seats.length ? seats.join(", ") : "Pending"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total amount</span>
                <span className="text-xl font-bold text-brand-500">
                  {formatCurrency(amount, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Booking payment state</span>
                <span className="font-semibold text-slate-900">
                  {isAlreadyPaid ? "Verified" : "Awaiting verification"}
                </span>
              </div>
            </div>
          </div>

          <Link
            to={`/bookings/${bookingId}`}
            aria-disabled={isVerifyingPayment}
            onClick={(event) => {
              if (isVerifyingPayment) {
                event.preventDefault();
              }
            }}
            className={`inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-500 ${
              isVerifyingPayment ? "pointer-events-none opacity-60" : ""
            }`}
          >
            View booking details
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-[1.5rem] bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 font-semibold text-slate-900">{value}</p>
    </div>
  );
}
