export const queryKeys = {
  authUser: ["auth-user"],
  searchBuses: (filters) => ["search-buses", filters],
  bus: (id) => ["bus", id],
  busSeats: (id, query) => ["bus-seats", id, query],
  myBookings: (filters) => ["my-bookings", filters],
  booking: (id) => ["booking", id],
  payment: (id) => ["payment", id],
  profile: ["profile"],
};
