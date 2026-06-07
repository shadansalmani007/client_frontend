import { formatLocationPoint } from "./route-segments.js";

export function getBookingId(booking) {
  return booking?._id || booking?.id || booking?.bookingId || booking?.booking?._id;
}

function normalizeTicketNumber(value) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return "";
  }

  const prefixedMatch = normalized.match(/^bk(?:\s*[:\-\s]\s*|\s+)?(.+)$/i);

  if (!prefixedMatch) {
    return normalized;
  }

  const suffix = String(prefixedMatch[1] || "").trim();

  return suffix ? `Bk-${suffix}` : "Bk";
}

export function getBookingNumber(booking) {
  return normalizeTicketNumber(booking?.bookingNumber || getBookingId(booking) || "Booking");
}

export function getBookingTicketLabel(booking) {
  return `Ticket No: ${getBookingNumber(booking)}`;
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function getResponseData(payload) {
  return payload?.data ?? payload ?? {};
}

export function getSeatAvailabilitySeatNumbers(seats) {
  return asArray(seats)
    .map((seat) =>
      typeof seat === "string"
        ? seat
        : firstDefined(seat?.seatNumber, seat?.number, seat?.label, seat?.seat),
    )
    .filter(Boolean);
}

export function getBookingSource(booking) {
  return firstDefined(
    booking?.source,
    booking?.from,
    booking?.route?.source,
    booking?.route?.from,
    booking?.routeId?.source,
    booking?.routeId?.from,
    booking?.schedule?.source,
    booking?.schedule?.from,
    booking?.schedule?.route?.source,
    booking?.schedule?.route?.from,
    booking?.scheduleId?.route?.source,
    booking?.scheduleId?.route?.from,
    booking?.origin?.name,
  );
}

export function getBookingDestination(booking) {
  return firstDefined(
    booking?.destination,
    booking?.to,
    booking?.route?.destination,
    booking?.route?.to,
    booking?.routeId?.destination,
    booking?.routeId?.to,
    booking?.schedule?.destination,
    booking?.schedule?.to,
    booking?.schedule?.route?.destination,
    booking?.schedule?.route?.to,
    booking?.scheduleId?.route?.destination,
    booking?.scheduleId?.route?.to,
    booking?.destinationStop?.name,
  );
}

export function getBookingTravelDate(booking) {
  return firstDefined(
    booking?.travelDate,
    booking?.departureDate,
    booking?.date,
    booking?.journeyDate,
    booking?.schedule?.travelDate,
    booking?.schedule?.departureDate,
    booking?.schedule?.date,
    booking?.scheduleId?.travelDate,
    booking?.scheduleId?.departureDate,
    booking?.scheduleId?.date,
  );
}

export function getBookingDepartureTime(booking) {
  return firstDefined(
    booking?.departureTime,
    booking?.schedule?.departureTime,
    booking?.scheduleId?.departureTime,
    booking?.bus?.departureTime,
    booking?.busId?.departureTime,
  );
}

export function getBookingArrivalTime(booking) {
  return firstDefined(
    booking?.arrivalTime,
    booking?.schedule?.arrivalTime,
    booking?.scheduleId?.arrivalTime,
    booking?.bus?.arrivalTime,
    booking?.busId?.arrivalTime,
  );
}

export function getBookingBusName(booking) {
  return firstDefined(
    booking?.busName,
    booking?.bus?.busName,
    booking?.bus?.name,
    booking?.busId?.busName,
    booking?.busId?.name,
    booking?.schedule?.bus?.busName,
    booking?.schedule?.bus?.name,
    booking?.scheduleId?.bus?.busName,
    booking?.scheduleId?.bus?.name,
  );
}

export function getBookingBusNumber(booking) {
  return firstDefined(
    booking?.busNumber,
    booking?.bus?.busNumber,
    booking?.busId?.busNumber,
    booking?.schedule?.bus?.busNumber,
    booking?.scheduleId?.bus?.busNumber,
  );
}

export function getBookingBoardingPoint(booking) {
  return firstDefined(
    formatLocationPoint(booking?.pickupPoint),
    booking?.boardingPoint,
    booking?.boarding?.name,
    booking?.boardingStop?.name,
  );
}

export function getBookingDroppingPoint(booking) {
  return firstDefined(
    formatLocationPoint(booking?.dropPoint),
    booking?.droppingPoint,
    booking?.dropping?.name,
    booking?.droppingStop?.name,
  );
}

export function getBookingContactEmail(booking) {
  return firstDefined(
    booking?.contactEmail,
    booking?.customer?.email,
    booking?.user?.email,
    booking?.userId?.email,
  );
}

export function getBookingContactPhone(booking) {
  return firstDefined(
    booking?.contactPhone,
    booking?.phoneNumber,
    booking?.customer?.phone,
    booking?.user?.phone,
    booking?.userId?.phone,
  );
}

export function getBookingPaymentMethod(booking) {
  return firstDefined(
    booking?.paymentMethod,
    booking?.payment?.provider,
    booking?.paymentDetails?.provider,
    booking?.payments?.[0]?.provider,
  );
}

export function getBookingSeats(booking) {
  const seats = asArray(booking?.seats);

  return seats
    .map((seat) =>
      typeof seat === "string"
        ? seat
        : seat?.seatNumber || seat?.number || seat?.label,
    )
    .filter(Boolean);
}

export function getBookingPassengers(booking) {
  const seats = asArray(booking?.seats);

  return seats
    .map((seat) => firstDefined(seat?.passengerName, seat?.name, seat?.passenger?.name))
    .filter(Boolean);
}

export function getBookingPassengerDetails(booking) {
  return asArray(booking?.seats)
    .map((seat) =>
      typeof seat === "string"
        ? {
            seatNumber: seat,
            passengerName: "",
            passengerAge: "",
            passengerGender: "",
          }
        : {
            seatNumber: firstDefined(seat?.seatNumber, seat?.number, seat?.label),
            passengerName: firstDefined(
              seat?.passengerName,
              seat?.name,
              seat?.passenger?.name,
            ),
            passengerAge: firstDefined(seat?.passengerAge, seat?.age, seat?.passenger?.age),
            passengerGender: firstDefined(
              seat?.passengerGender,
              seat?.gender,
              seat?.passenger?.gender,
            ),
          },
    )
    .filter(
      (seat) =>
        seat.seatNumber || seat.passengerName || seat.passengerAge || seat.passengerGender,
    );
}

export function getBookingAmount(booking) {
  return (
    booking?.amount ??
    booking?.totalAmount ??
    booking?.fareAmount ??
    booking?.fare?.totalAmount ??
    booking?.fare?.amount ??
    booking?.payment?.amount ??
    booking?.paymentDetails?.amount ??
    booking?.payments?.[0]?.amount ??
    booking?.paymentAmount ??
    booking?.basePrice ??
    0
  );
}

export function getBookingPaymentId(booking, payment) {
  return (
    payment?._id ||
    payment?.paymentId ||
    payment?.payment?._id ||
    booking?.payment?._id ||
    booking?.paymentId ||
    booking?.paymentDetails?._id ||
    booking?.payments?.[0]?._id ||
    null
  );
}

export function getBookingPayments(details) {
  return asArray(details?.payments || details?.booking?.payments);
}

export function getBookingPaymentStatus(details) {
  return firstDefined(
    getBookingPayments(details)?.[0]?.status,
    details?.booking?.paymentStatus,
  );
}

export function getBookingCanCancel(details) {
  if (typeof details?.meta?.canCancel === "boolean") {
    return details.meta.canCancel;
  }

  return !String(details?.booking?.bookingStatus || "").toLowerCase().includes("cancel");
}

export function getBookingSeatAvailability(details) {
  return details?.seatAvailability || null;
}

export function getBookingList(payload) {
  const data = getResponseData(payload);

  return asArray(
    data?.bookings ||
      data?.items ||
      data?.results ||
      data?.data ||
      data,
  );
}

export function getPagination(payload) {
  const data = getResponseData(payload);

  return (
    data?.pagination ||
    payload?.pagination ||
    {
      page: data?.page,
      limit: data?.limit,
      total: data?.total,
      totalPages: data?.totalPages,
    }
  );
}

export function getBookingCategory(booking, now = new Date()) {
  const status = String(booking?.bookingStatus || "").toLowerCase();

  if (status === "cancelled") {
    return "cancelled";
  }

  const travelDate = new Date(getBookingTravelDate(booking));
  if (Number.isNaN(travelDate.getTime())) {
    return "upcoming";
  }

  return travelDate < now ? "past" : "upcoming";
}

export function categorizeBookings(bookings, now = new Date()) {
  return bookings.reduce(
    (categories, booking) => {
      const category = getBookingCategory(booking, now);
      categories[category].push(booking);
      return categories;
    },
    {
      upcoming: [],
      past: [],
      cancelled: [],
    },
  );
}
