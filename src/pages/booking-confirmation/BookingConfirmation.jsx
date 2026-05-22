import {
  ArrowLeftRightIcon,
  CalendarDaysIcon,
  CircleQuestionMark,
  DownloadIcon,
  SendHorizonalIcon,
  WifiIcon,
} from "lucide-react/dist/cjs/lucide-react.js";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const checkoutBooking =
    location.state?.checkoutBooking || readStorage(CHECKOUT_BOOKING_STORAGE_KEY);

  useEffect(() => {
    if (!checkoutBooking?.selectedSeats?.length) {
      navigate("/checkout", { replace: true });
    }
  }, [checkoutBooking, navigate]);

  const selectedBus = checkoutBooking?.selectedBus || {};
  const searchData = checkoutBooking?.searchData || {};
  const passengerDetails = checkoutBooking?.passengerDetails || {};
  const passengers = Array.isArray(checkoutBooking?.passengers)
    ? checkoutBooking.passengers
    : Array.isArray(passengerDetails.passengers)
      ? passengerDetails.passengers
      : passengerDetails.fullName
        ? [passengerDetails]
        : [];
  const selectedSeats = checkoutBooking?.selectedSeats || [];
  const fare = checkoutBooking?.fare || {};
  const seatLabel = selectedSeats.join(", ") || "No seat";
  const selectedCount = selectedSeats.length;
  const ticketId = `LK-${selectedBus.id || "BUS"}-${selectedSeats.join("").replace(/[^a-z0-9]/gi, "") || "TICKET"}`;
  const baseFare = Number(fare.baseFare || 0);
  const taxesAndFees = Number((Number(fare.serviceFee || 0) + Number(fare.vat || 0)).toFixed(2));
  const totalPaid = Number(fare.totalAmount || fare.totalFare || baseFare + taxesAndFees - Number(fare.discount || 0));
  const journeyDate = formatDate(searchData.date);
  const passengerNames =
    passengers
      .map((passenger) => passenger.fullName?.trim())
      .filter(Boolean)
      .join(", ") || `${selectedCount || 1} Adult`;
  const amenities = selectedBus.amenities?.length
    ? selectedBus.amenities
    : ["Wi-Fi", "USB Charging", "AC"];
  const handleDownloadTicket = () => {
    const ticketWindow = window.open("", "_blank", "width=900,height=700");
    if (!ticketWindow) return;

    ticketWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${ticketId}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #1f2937; margin: 32px; }
            .ticket { border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
            .header { background: #c0392b; color: white; padding: 24px; }
            .section { padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
            .label { font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 700; }
            .value { font-size: 16px; font-weight: 700; margin-top: 4px; }
            .total { font-size: 24px; color: #c0392b; font-weight: 800; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <h1>Likili Motorways Ticket</h1>
              <p>Ticket ID: ${ticketId}</p>
            </div>
            <div class="section grid">
              <div><div class="label">From</div><div class="value">${selectedBus.from || searchData.from || "From"}</div></div>
              <div><div class="label">To</div><div class="value">${selectedBus.to || searchData.to || "To"}</div></div>
              <div><div class="label">Boarding</div><div class="value">${checkoutBooking?.boardingPoint || "Boarding point"}</div></div>
              <div><div class="label">Dropping</div><div class="value">${checkoutBooking?.droppingPoint || "Dropping point"}</div></div>
              <div><div class="label">Date</div><div class="value">${journeyDate}</div></div>
              <div><div class="label">Departure</div><div class="value">${selectedBus.departure || "Departure"}</div></div>
              <div><div class="label">Seats</div><div class="value">${seatLabel}</div></div>
              <div><div class="label">Passengers</div><div class="value">${passengerNames}</div></div>
            </div>
            <div class="section grid">
              <div><div class="label">Bus</div><div class="value">${selectedBus.name || "Likili Motorways"}</div></div>
              <div><div class="label">Bus Type</div><div class="value">${selectedBus.type || "AC Sleeper"}</div></div>
              <div><div class="label">Base Fare</div><div class="value">K${baseFare.toLocaleString()}</div></div>
              <div><div class="label">Taxes & Fees</div><div class="value">K${taxesAndFees.toLocaleString()}</div></div>
            </div>
            <div class="section">
              <div class="label">Total Paid</div>
              <div class="total">K${totalPaid.toLocaleString()}</div>
            </div>
          </div>
          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    ticketWindow.document.close();
  };

  return (
    <>
      {/* ===================== NAVBAR ===================== */}
      <nav className="bg-white sticky top-0 z-40 shadow-[0_2px_12px_rgba(44,62,80,0.07)]">
        <div className="max-w-[1200px] mx-auto px-6 py-0 flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#c0392b]">
              <svg
                class="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm9 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM6 6h12v5H6V6z" />
              </svg>
            </div>
            <div className="text-lg font-bold text-[#c0392b] letter-spacing-[-0.3px]">
              Likili <span className="text-[#2c3e50]">Moterways</span>
            </div>
          </a>

          {/* Nav Links */}
          {/* <div className="hidden md:flex items-center gap-1">
            <a
              href="#"
              className="px-4 py-2 text-sm font-500 text-slate-600 hover:text-[#C0392B] rounded-lg hover:bg-red-50 transition font-medium"
            >
              Routes
            </a>
            <a
              href="#"
              className="px-4 py-2 text-sm font-500 text-slate-600 hover:text-[#C0392B] rounded-lg hover:bg-red-50 transition font-medium"
            >
              Offers
            </a>
            <a
              href="#"
              className="px-4 py-2 text-sm font-500 text-slate-600 hover:text-[#C0392B] rounded-lg hover:bg-red-50 transition font-medium"
            >
              Track Bus
            </a>
            <a
              href="#"
              className="px-4 py-2 text-sm font-500 text-slate-600 hover:text-[#C0392B] rounded-lg hover:bg-red-50 transition font-medium"
            >
              Support
            </a>
          </div> */}
          <a
            href="#"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#C0392B] transition"
          >
            <CircleQuestionMark name="CircleQuestionMark" className="w-4 h-4" />
            Help
          </a>
          {/* Auth */}
          {/* <div className="flex items-center gap-3">
            <a
              href="#"
              className="bg-[#c0392b] text-sm font-semibold text-white px-5 py-2 rounded-lg "
            >
              Login
            </a>
            <a
              href="#"
              className="text-sm font-semibold text-white px-5 py-2 rounded-lg transition"
              style={{ background: "#c0392b" }}
            >
              Sign Up
            </a>
          </div> */}
        </div>
      </nav>

      {/* ═══════════════════════════════════════════
             MAIN CONTENT
        ═══════════════════════════════════════════ */}
      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 pb-16">
        {/* ── CONFIRMATION BANNER ── */}
        <div className="gradient-banner relative rounded-2xl overflow-hidden mb-6 fade-in-up min-h-[200px]">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-[200px] h-[200px] bg-white/10 rounded-full" />
          <div className="absolute -bottom-16 -left-8 w-[240px] h-[240px] bg-white/5 rounded-full" />
          <div className="absolute top-5 left-15 w-[80px] h-[80px] bg-white/10 rounded-full" />

          <div className="relative z-10 flex flex-col items-center justify-center text-center py-10 px-6">
            {/* Check icon */}
            <div className="check-pulse w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-5 shadow-lg">
              <svg
                className="w-8 h-8 text-[#c0392b]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-[-0.5px]">
              Booking Confirmed!
            </h1>

            <p className="text-red-100 text-base sm:text-lg font-medium mb-4">
              Your journey with Likili is all set. Pack your bags!
            </p>

            <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-sm font-semibold px-4 py-1.5 rounded-full border border-white/30">
              <span className="w-2 h-2 bg-green-300 rounded-full inline-block"></span>
              Payment Successful
            </span>
          </div>
        </div>

        {/* ── TICKET + FARE GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          {/* LEFT: Ticket Details */}
          <div className="lg:col-span-2 fade-in-up-2">
            <div className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
              {/* Ticket Header */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                      Ticket ID
                    </p>
                    <p className="text-md font-semibold tracking-[-0.3px] text-gray-900">
                      {ticketId}
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full border border-green-200">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    Confirmed
                  </span>
                </div>
              </div>

              {/* Route */}
              <div className="px-6 py-5">
                <div className="flex items-center gap-3 sm:gap-5">
                  {/* From */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      From
                    </p>
                    <p className="text-lg sm:text-xl font-black text-gray-900 leading-tight">
                      {selectedBus.from || searchData.from || "From"}
                    </p>
                    <p className="text-sm text-gray-500 font-medium mt-0.5">
                      {checkoutBooking?.boardingPoint || "Boarding point"}
                    </p>
                  </div>

                  {/* Middle */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <p className="text-xs font-semibold text-gray-400">
                      {selectedBus.duration || "Duration"}
                    </p>

                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full border-2 border-red-600"></div>
                      <div className="w-12 sm:w-16 h-0.5 bg-gradient-to-r from-red-600 to-red-400"></div>
                      <svg
                        class="w-4 h-4 text-brand"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </div>

                    <p className="text-xs text-gray-400">Direct</p>
                  </div>

                  {/* To */}
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      To
                    </p>
                    <p className="text-lg sm:text-xl font-black text-gray-900 leading-tight">
                      {selectedBus.to || searchData.to || "To"}
                    </p>
                    <p className="text-sm text-gray-500 font-medium mt-0.5">
                      {checkoutBooking?.droppingPoint || "Dropping point"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="relative mx-0 my-1">
                <div className="ticket-notch-left"></div>
                <div className="mx-6 border-t border-dashed border-gray-200"></div>
                <div className="ticket-notch-right"></div>
              </div>

              {/* Details */}
              <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Date", value: journeyDate },
                  { label: "Departure", value: selectedBus.departure || "Departure" },
                  {
                    label: selectedCount === 1 ? "Passenger" : "Passengers",
                    value: passengerNames,
                  },
                  { label: "Seat", value: "14A — Window" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center mt-0.5">
                      <CalendarDaysIcon
                        name="circle"
                        className="w-4 h-4 text-red-600"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
                        {item.label === "Seat"
                          ? selectedCount === 1
                            ? "Seat"
                            : "Seats"
                          : item.label}
                      </p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">
                        {item.label === "Seat" ? seatLabel : item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Operator */}
              <div className="px-6 pb-6">
                <div className="bg-gray-50 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                      <ArrowLeftRightIcon
                        name="circle"
                        className="w-5 h-5 text-red-600"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Operated by</p>
                      <p className="text-sm font-bold text-gray-800">
                        {selectedBus.name || "Likili Motorways"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {amenities.map((a, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-white border border-gray-200 px-2.5 py-1 rounded-lg"
                      >
                        <WifiIcon
                          name="circle"
                          className="w-3 h-3 text-red-600"
                        />
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Fare Summary */}
          <div className="lg:col-span-1 fade-in-up-3">
            <div className="bg-white rounded-2xl p-6 h-full flex flex-col shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
              <h2 className="text-base font-black text-gray-900 mb-5 tracking-[-0.2px]">
                Fare Summary
              </h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Base Fare</span>
                  <span className="text-sm font-semibold">
                    K{baseFare.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Taxes & Fees</span>
                  <span className="text-sm font-semibold">
                    K{taxesAndFees.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Seat Selection</span>
                  <span className="text-sm font-semibold">
                    {selectedCount} selected
                  </span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200 my-3"></div>

              <div className="flex justify-between mb-5">
                <span className="text-sm font-bold">Total Paid</span>
                <span className="text-2xl font-black text-red-600 tracking-[-0.5px]">
                  K{totalPaid.toLocaleString()}
                </span>
              </div>

              <div className="flex-1"></div>

              <div className="space-y-3">
                <button
                  onClick={handleDownloadTicket}
                  className="w-full bg-red-600 text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  <DownloadIcon className="w-4 h-4" />
                  Download Ticket
                </button>

                <button
                  onClick={() => navigate("/my-bookings")}
                  className="w-full border border-gray-200 font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  Go to My Bookings
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="mt-12 bg-[#1a2535] text-[#94a3b8]">
        <div className="max-w-[1200px] mx-auto px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#c0392b] flex items-center justify-center">
                  <svg
                    class="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm9 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM6 6h12v5H6V6z" />
                  </svg>
                </div>
                <span className="text-base font-bold text-[#c0392b]">
                  Likili <span className="text-white">Motorways</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                Zambia's most trusted intercity bus booking platform. Safe,
                reliable, and affordable travel across the country.
              </p>
              <div class="flex gap-3 mt-5">
                <a
                  href="#"
                  class="w-8 h-8 rounded-lg bg-slate-700 hover:bg-[#C0392B] flex items-center justify-center transition"
                >
                  <svg
                    class="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="#"
                  class="w-8 h-8 rounded-lg bg-slate-700 hover:bg-[#C0392B] flex items-center justify-center transition"
                >
                  <svg
                    class="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a
                  href="#"
                  class="w-8 h-8 rounded-lg bg-slate-700 hover:bg-[#C0392B] flex items-center justify-center transition"
                >
                  <svg
                    class="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="#"
                    className="text-sm text-slate-400 hover:text-white transition"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-slate-400 hover:text-white transition"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-slate-400 hover:text-white transition"
                  >
                    Press & Media
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-slate-400 hover:text-white transition"
                  >
                    Partner with Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-slate-400 hover:text-white transition"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            {/* Policies */}
            <div>
              <h4 className="text-sm font-bold text-white mb-4">Policies</h4>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="#"
                    className="text-sm text-slate-400 hover:text-white transition"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-slate-400 hover:text-white transition"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-slate-400 hover:text-white transition"
                  >
                    Refund Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-slate-400 hover:text-white transition"
                  >
                    Cancellation Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-slate-400 hover:text-white transition"
                  >
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-sm font-bold text-white mb-4">
                Stay Updated
              </h4>
              <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                Get the latest offers and travel updates delivered to your
                inbox.
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="footer-input text-slate-700 bg-white rounded-l-[8px] text-[13px] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c0392b] transition flex-1"
                />
                <button className="flex-shrink-0 px-4 py-2.5 text-sm font-bold bg-[#c0392b] rounded-r-[8px] text-white transition">
                  <SendHorizonalIcon className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                No spam. Unsubscribe anytime.
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-700 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              © 2024 Likili Moterways. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500">🇿🇲 Zambia</span>
              <span className="text-xs text-slate-500">ZMW (K)</span>
              <span className="text-xs text-slate-500">English</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default BookingConfirmation;
