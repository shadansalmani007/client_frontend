import { apiClient } from "./client.js";

export async function searchBuses(filters) {
  return apiClient.get("/search/buses", {
    params: {
      source: filters.source,
      destination: filters.destination,
      date: filters.date,
      page: filters.page,
      limit: filters.limit,
    },
  });
}

export function getBusDetails(id) {
  return apiClient.get(`/buses/${id}`).then((response) => response.data);
}

export function getSeatAvailability(id, query) {
  return apiClient
    .get(`/buses/${id}/seats`, {
      params: query,
    })
    .then((response) => response.data);
}
