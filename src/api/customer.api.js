import { apiClient } from "./client.js";

export function getProfile() {
  return apiClient.get("/customers/me").then((response) => response.data);
}

export function updateProfile(payload) {
  return apiClient
    .patch("/customers/me", payload)
    .then((response) => response.data);
}
