import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { getMyCustomerBookings } from "../../api/customer-booking.api.js";
import { EmptyState } from "../../components/EmptyState.jsx";
import { LoadingState } from "../../components/LoadingState.jsx";
import { Pagination } from "../../components/Pagination.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import {
  getBookingAmount,
  getBookingDestination,
  getBookingId,
  getBookingTicketLabel,
  getBookingSeats,
  getBookingSource,
  getBookingTravelDate,
} from "../../utils/booking.js";
import { formatCurrency, formatDate } from "../../utils/format.js";
import { queryKeys } from "../../utils/queryKeys.js";

function parseFilters(searchParams) {
  return {
    page: Number(searchParams.get("page") || 1),
    limit: Number(searchParams.get("limit") || 10),
    bookingStatus: searchParams.get("bookingStatus") || "",
    paymentStatus: searchParams.get("paymentStatus") || "",
  };
}

function buildBookingSearchParams(filters) {
  return Object.fromEntries(
    Object.entries({
      page: filters.page,
      limit: filters.limit,
      bookingStatus: filters.bookingStatus,
      paymentStatus: filters.paymentStatus,
    }).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

export function MyBookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseFilters(searchParams);

  const bookingsQuery = useQuery({
    queryKey: queryKeys.myBookings(filters),
    queryFn: () => getMyCustomerBookings(filters),
  });

  const { register, handleSubmit } = useForm({
    defaultValues: filters,
  });

  const bookings = bookingsQuery.data?.bookings ?? [];
  const pagination = bookingsQuery.data?.pagination ?? {};
  const categories = useMemo(
    () =>
      bookingsQuery.data?.categories ?? {
        upcoming: [],
        past: [],
        cancelled: [],
      },
    [bookingsQuery.data?.categories],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-500">
            My Bookings
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Your trip history</h1>
        </div>

        <form
          onSubmit={handleSubmit((values) =>
            setSearchParams(
              buildBookingSearchParams({
                ...values,
                page: 1,
                limit: filters.limit,
              }),
            ),
          )}
          className="grid gap-3 sm:grid-cols-3"
        >
          <select className="form-input" {...register("bookingStatus")}>
            <option value="">All booking statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
          <select className="form-input" {...register("paymentStatus")}>
            <option value="">All payment statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <button
            type="submit"
            className="rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-600"
          >
            Apply filters
          </button>
        </form>
      </div>

      <div className="mt-8 space-y-5">
        {bookingsQuery.isLoading ? <LoadingState label="Loading bookings..." /> : null}

        {!bookingsQuery.isLoading && !bookings.length ? (
          <EmptyState
            title="No bookings found"
            message="Your confirmed and pending trips will appear here once you create them."
          />
        ) : null}

        {!bookingsQuery.isLoading && bookings.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            <CategorySummaryCard label="Upcoming trips" count={categories.upcoming.length} />
            <CategorySummaryCard label="Past trips" count={categories.past.length} />
            <CategorySummaryCard label="Cancelled trips" count={categories.cancelled.length} />
          </div>
        ) : null}

        <BookingSection title="Upcoming Trips" bookings={categories.upcoming} />
        <BookingSection title="Past Trips" bookings={categories.past} />
        <BookingSection title="Cancelled Trips" bookings={categories.cancelled} />

        <Pagination
          page={filters.page}
          totalPages={pagination.totalPages || 1}
          onPageChange={(page) =>
            setSearchParams(
              buildBookingSearchParams({
                ...filters,
                page,
              }),
            )
          }
        />
      </div>
    </div>
  );
}

function CategorySummaryCard({ label, count }) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{count}</p>
    </div>
  );
}

function BookingSection({ title, bookings }) {
  if (!bookings.length) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">
          Live data from your customer booking history.
        </p>
      </div>

      {bookings.map((booking) => (
        <article
          key={getBookingId(booking)}
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={booking.bookingStatus} fallback="Pending" />
                <StatusBadge status={booking.paymentStatus} fallback="Unpaid" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {getBookingTicketLabel(booking)}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {getBookingSource(booking) || "Source"} to{" "}
                  {getBookingDestination(booking) || "Destination"}
                </p>
              </div>
              <div className="flex flex-wrap gap-5 text-sm text-slate-600">
                <span>Travel date: {formatDate(getBookingTravelDate(booking))}</span>
                <span>
                  Seats: {getBookingSeats(booking).length ? getBookingSeats(booking).join(", ") : "Pending"}
                </span>
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-slate-50 p-5 lg:min-w-[260px]">
              <p className="text-sm text-slate-500">Amount</p>
              <p className="mt-1 text-2xl font-bold text-brand-500">
                {formatCurrency(getBookingAmount(booking), booking.currency)}
              </p>

              <Link
                to={`/bookings/${getBookingId(booking)}`}
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-600"
              >
                View details
              </Link>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
