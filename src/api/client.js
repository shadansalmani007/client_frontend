import axios from "axios";
import { useAuthStore } from "../store/auth.store.js";
import { useUiStore } from "../store/ui.store.js";
import { ApiError } from "../utils/api.js";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://bus-booking-backend-seven.vercel.app/api");

function createApiError(error) {
  if (error instanceof ApiError) {
    return error;
  }

  const payload = error?.response?.data;
  return new ApiError(
    payload?.message || error?.message || "Request failed. Please try again.",
    {
      status: error?.response?.status ?? null,
      errors: payload?.errors ?? [],
      data: payload?.data,
    },
  );
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const payload = response.data;

    if (payload?.success === false) {
      throw new ApiError(payload.message || "Request failed.", {
        status: response.status,
        errors: payload.errors ?? [],
        data: payload.data,
      });
    }

    return payload;
  },
  (error) => {
    const apiError = createApiError(error);
    const token = useAuthStore.getState().token;
    const { addToast } = useUiStore.getState();

    if (apiError.status === 401 && token) {
      useAuthStore.getState().clearAuth();
      addToast({
        type: "error",
        title: "Session expired",
        message: "Please log in again to continue.",
      });

      if (window.location.pathname !== "/login") {
        const redirectTo =
          window.location.pathname + window.location.search + window.location.hash;
        window.location.assign(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
      }
    } else if (apiError.status === 403) {
      addToast({
        type: "error",
        title: "Access denied",
        message: apiError.message,
      });
    } else if (!error?.config?.meta?.suppressGlobalErrorToast) {
      addToast({
        type: "error",
        title: "Request failed",
        message: apiError.message,
      });
    }

    return Promise.reject(apiError);
  },
);
