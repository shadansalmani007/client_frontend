import { apiClient } from "./client.js";
import {
  categorizeBookings,
  getBookingList,
  getPagination,
  getResponseData,
} from "../utils/booking.js";
import { normalizeSeatLayoutResponse } from "../utils/seat-map.js";
import "../types/customer-booking.types.js";

function normalizeBookingDetailsResponse(payload) {
  const data = getResponseData(payload);
  const ticket = data?.ticket && typeof data.ticket === "object" ? data.ticket : null;
  const bookingSource = data?.booking ?? data?.ticket?.booking ?? data?.ticket ?? data ?? {};
  const booking =
    ticket && ticket !== bookingSource
      ? { ...bookingSource, ticket }
      : bookingSource;

  return {
    booking,
    payments:
      data?.payments ??
      data?.booking?.payments ??
      data?.ticket?.payments ??
      data?.ticket?.booking?.payments ??
      [],
    seatAvailability: data?.seatAvailability ?? null,
    meta: data?.meta ?? payload?.meta ?? {},
    message: payload?.message ?? data?.message ?? "",
  };
}

function normalizeBookingListResponse(payload) {
  const bookings = getBookingList(payload);

  return {
    bookings,
    pagination: getPagination(payload) || {},
    categories: categorizeBookings(bookings),
    message: payload?.message ?? "",
  };
}

/**
 * @param {object} payload
 * @returns {Promise<import("../types/customer-booking.types.js").CustomerBookingDetailsResponse>}
 */
export async function createCustomerBooking(payload) {
  const response = await apiClient.post("/bookings", payload);
  return normalizeBookingDetailsResponse(response);
}

/**
 * @param {object} params
 * @returns {Promise<import("../types/customer-booking.types.js").CustomerBookingListResponse>}
 */
export async function getMyCustomerBookings(params) {
  const query = Object.fromEntries(
    Object.entries({
      page: params?.page,
      limit: params?.limit,
      bookingStatus: params?.bookingStatus,
      paymentStatus: params?.paymentStatus,
    }).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );

  const response = await apiClient.get("/bookings/my", {
    params: query,
  });

  return normalizeBookingListResponse(response);
}

/**
 * @param {string} bookingId
 * @returns {Promise<import("../types/customer-booking.types.js").CustomerBookingDetailsResponse>}
 */
export async function getCustomerBookingDetails(bookingId) {
  const response = await apiClient.get(`/bookings/${bookingId}`);
  return normalizeBookingDetailsResponse(response);
}

/**
 * @param {string} bookingId
 * @param {{ cancellationReason: string }} payload
 * @returns {Promise<import("../types/customer-booking.types.js").CustomerBookingDetailsResponse>}
 */
export async function cancelCustomerBooking(bookingId, payload) {
  const response = await apiClient.patch(`/bookings/${bookingId}/cancel`, payload);
  return normalizeBookingDetailsResponse(response);
}

/**
 * @param {string} busId
 * @param {{ date: string, routeId?: string, scheduleId?: string, source?: string, destination?: string }} query
 * @returns {Promise<import("../types/customer-booking.types.js").CustomerSeatAvailability>}
 */
export async function getCustomerSeatAvailability(busId, query) {
  const response = await apiClient.get(`/buses/${busId}/seats`, {
    params: query,
  });

  return normalizeSeatLayoutResponse(getResponseData(response));
}
