import { apiClient } from "./client.js";

export function createBooking(payload) {
  return apiClient.post("/bookings", payload).then((response) => response.data);
}

export function getMyBookings(params) {
  return apiClient
    .get("/bookings/my", {
      params,
    })
    .then((response) => response);
}

export function getBookingById(id) {
  return apiClient.get(`/bookings/${id}`).then((response) => response.data);
}

export function cancelBooking(id, payload) {
  return apiClient
    .patch(`/bookings/${id}/cancel`, payload)
    .then((response) => response.data);
}
