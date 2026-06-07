import { apiClient } from "./client.js";

export function initiatePayment(payload) {
  return apiClient
    .post("/payments/initiate", payload)
    .then((response) => response.data);
}

export function verifyFlutterwavePayment(payload, options = {}) {
  return apiClient.post("/payments/flutterwave/verify", payload, options);
}

export function verifyPayment(payload) {
  return apiClient
    .post("/payments/verify", payload)
    .then((response) => response.data);
}

export function getPaymentDetails(id) {
  return apiClient.get(`/payments/${id}`).then((response) => response.data);
}
