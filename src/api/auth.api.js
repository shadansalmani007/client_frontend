import { apiClient } from "./client.js";

export function registerCustomer(payload) {
  return apiClient.post("/auth/register", payload).then((response) => response.data);
}

export function loginCustomer(payload) {
  return apiClient.post("/auth/login", payload).then((response) => response.data);
}

export function googleLogin(credential) {
  return apiClient
    .post("/auth/google-login", { credential })
    .then((response) => response.data);
}

export function getCurrentUser() {
  return apiClient.get("/auth/me").then((response) => response.data);
}
