import {
  CalendarDays,
  CircleQuestionMark,
  MapPin,
  TicketCheck,
  User,
} from "lucide-react";

const CHECKOUT_BOOKING_STORAGE_KEY = "likili-checkout-booking";

const readStorage = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

const formatDate = (value, options = { day: "numeric", month: "short", year: "numeric" }) => {
  if (!value) return "Select date";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "Select date";
  return parsedDate.toLocaleDateString("en-US", options);
};

const MyBookings = () => {
  const booking = readStorage(CHECKOUT_BOOKING_STORAGE_KEY);
  const selectedBus = booking?.selectedBus || {};
  const searchData = booking?.searchData || {};
  const passengerDetails = booking?.passengerDetails || {};
  const passengers = Array.isArray(booking?.passengers)
    ? booking.passengers
    : Array.isArray(passengerDetails.passengers)
      ? passengerDetails.passengers
      : [];
  const selectedSeats = booking?.selectedSeats || [];
  const fare = booking?.fare || {};
  const ticketId = `LK-${selectedBus.id || "BUS"}-${selectedSeats.join("").replace(/[^a-z0-9]/gi, "") || "TICKET"}`;
  const passengerNames =
    passengers
      .map((passenger) => passenger.fullName?.trim())
      .filter(Boolean)
      .join(", ") || "Passenger details";
  const seatLabel = selectedSeats.join(", ") || "No seat";
  const totalPaid = Number(fare.totalAmount || fare.totalFare || 0);

  return (
    <>
      <nav className="bg-white sticky top-0 z-40 shadow-[0_2px_12px_rgba(44,62,80,0.07)]">
        <div className="max-w-[1200px] mx-auto px-6 py-0 flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#c0392b]">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm9 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM6 6h12v5H6V6z" />
              </svg>
            </div>
            <div className="text-lg font-bold text-[#c0392b] letter-spacing-[-0.3px]">
              Likili <span className="text-[#2c3e50]">Moterways</span>
            </div>
          </a>

          <a
            href="#"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#C0392B] transition"
          >
            <CircleQuestionMark className="w-4 h-4" />
            Help
          </a>
        </div>
      </nav>

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 pb-16">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-[#2C3E50]">My Bookings</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              View your confirmed Likili Motorways tickets.
            </p>
          </div>
        </div>

        {booking ? (
          <div className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <TicketCheck className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Ticket ID
                  </p>
                  <p className="text-md font-semibold tracking-[-0.3px] text-gray-900">
                    {ticketId}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full border border-green-200">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Confirmed
              </span>
            </div>

            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Route</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">
                  {selectedBus.from || searchData.from || "From"} →{" "}
                  {selectedBus.to || searchData.to || "To"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Date</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">
                  {formatDate(searchData.date)} · {selectedBus.departure || "Departure"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
                  {selectedSeats.length === 1 ? "Seat" : "Seats"}
                </p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{seatLabel}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Total Paid</p>
                <p className="text-lg font-black text-red-600 mt-0.5">
                  K{totalPaid.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                <MapPin className="w-4 h-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Boarding</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">
                    {booking.boardingPoint || "Boarding point"}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                <CalendarDays className="w-4 h-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Bus</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">
                    {selectedBus.name || "Likili Motorways"}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                <User className="w-4 h-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Passengers</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{passengerNames}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
            <p className="text-sm font-semibold text-slate-500">No bookings found.</p>
          </div>
        )}
      </main>
    </>
  );
};

export default MyBookings;
