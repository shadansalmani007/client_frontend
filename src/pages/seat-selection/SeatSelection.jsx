import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LucideIcon from "../../components/LucideIcon.jsx";
import {
  ArrowRight,
  Bookmark,
  ChevronRight,
  Clipboard,
  HelpCircle,
  Info,
  LifeBuoy,
  MapPin,
  NotebookPen,
  SendHorizontal,
  ShieldCheck,
  Zap,
} from "lucide-react";

const SEARCH_STORAGE_KEY = "likili-search";
const SELECTED_BUS_STORAGE_KEY = "likili-selected-bus";
const SELECTED_SEATS_STORAGE_KEY = "likili-selected-seats";
const BOARDING_POINT_STORAGE_KEY = "likili-boarding-point";
const DROPPING_POINT_STORAGE_KEY = "likili-dropping-point";
const BOOKING_DRAFT_STORAGE_KEY = "likili-booking-draft";
const DRIVER_SEAT = "1D";

const syncSeatClasses = (selectedSeats) => {
  document.querySelectorAll(".seat").forEach((seat) => {
    const seatNumber = seat.dataset.seat;
    const isDriverSeat = seatNumber === DRIVER_SEAT;
    const isBooked = seat.classList.contains("booked") || isDriverSeat;

    if (isDriverSeat) {
      seat.classList.add("booked");
      seat.classList.remove("available", "selected");
      return;
    }

    if (isBooked) return;

    const isSelected = selectedSeats.includes(seatNumber);
    seat.classList.toggle("selected", isSelected);
    if (!seat.classList.contains("ladies")) {
      seat.classList.toggle("available", !isSelected);
    }
  });
};

const getSeatMapStats = () => {
  const seats = Array.from(document.querySelectorAll(".seat"));
  const selectableSeats = seats.filter(
    (seat) =>
      !seat.classList.contains("booked") && seat.dataset.seat !== DRIVER_SEAT,
  );
  const selectedSeats = selectableSeats.filter((seat) =>
    seat.classList.contains("selected"),
  );

  return {
    seatsLeft: Math.max(selectableSeats.length - selectedSeats.length, 0),
    selectedSeats: selectedSeats
      .map((seat) => seat.dataset.seat)
      .filter(Boolean),
  };
};

const readStorage = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

const formatDate = (value, options = { day: "numeric", month: "short" }) => {
  if (!value) return "Select date";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "Select date";
  return parsedDate.toLocaleDateString("en-US", options);
};

const SeatSelection = () => {
  const navigate = useNavigate();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatsLeft, setSeatsLeft] = useState(0);
  const [boardingPoint, setBoardingPoint] = useState(
    readStorage(BOARDING_POINT_STORAGE_KEY) || "Lusaka City Terminal",
  );
  const [droppingPoint, setDroppingPoint] = useState(
    readStorage(DROPPING_POINT_STORAGE_KEY) || "Ndola Main Terminal",
  );
  const [paymentError, setPaymentError] = useState("");
  const selectedBus = readStorage(SELECTED_BUS_STORAGE_KEY) || {};
  const searchData = readStorage(SEARCH_STORAGE_KEY) || {};
  const seatFare = Number(selectedBus.price || 0);
  const selectedCount = selectedSeats.length;
  const baseFare = selectedCount * seatFare;
  const serviceFee = selectedCount > 0 ? 5.5 : 0;
  const discount = selectedCount > 0 ? 5 : 0;
  const totalFare = Math.max(baseFare + serviceFee - discount, 0);
  const canContinue =
    selectedSeats.length > 0 && Boolean(boardingPoint) && Boolean(droppingPoint);

  const routeLabel = `${selectedBus.from || searchData.from || "From"} → ${
    selectedBus.to || searchData.to || "To"
  }`;
  const journeyDate = searchData.date || "";

  useEffect(() => {
    const savedSeats = readStorage(SELECTED_SEATS_STORAGE_KEY);
    if (Array.isArray(savedSeats) && savedSeats.length > 0) {
      const usableSavedSeats = savedSeats.filter(
        (seat) => seat !== DRIVER_SEAT,
      );
      setSelectedSeats(usableSavedSeats);
      window.setTimeout(() => {
        syncSeatClasses(usableSavedSeats);
        setSeatsLeft(getSeatMapStats().seatsLeft);
      });
      return;
    }

    setSelectedSeats([]);
    window.setTimeout(() => {
      syncSeatClasses([]);
      setSeatsLeft(getSeatMapStats().seatsLeft);
    });
  }, []);

  useEffect(() => {
    syncSeatClasses(selectedSeats);
    setSeatsLeft(getSeatMapStats().seatsLeft);
  }, [selectedSeats]);

  const handleSeatGridClick = (event) => {
    const seat = event.target.closest(".seat");
    const seatNumber = seat?.dataset.seat;

    if (
      !seat ||
      seat.classList.contains("booked") ||
      seatNumber === DRIVER_SEAT
    ) {
      return;
    }

    setSelectedSeats((currentSeats) => {
      const nextSeats = currentSeats.includes(seatNumber)
        ? currentSeats.filter((selectedSeat) => selectedSeat !== seatNumber)
        : [...currentSeats, seatNumber];

      syncSeatClasses(nextSeats);
      setSeatsLeft(getSeatMapStats().seatsLeft);
      localStorage.setItem(
        SELECTED_SEATS_STORAGE_KEY,
        JSON.stringify(nextSeats),
      );
      return nextSeats;
    });
    setPaymentError("");
  };

  const handleBoardingSelect = (point) => {
    setBoardingPoint(point);
    setPaymentError("");
    localStorage.setItem(BOARDING_POINT_STORAGE_KEY, JSON.stringify(point));
  };

  const handleDroppingSelect = (point) => {
    setDroppingPoint(point);
    setPaymentError("");
    localStorage.setItem(DROPPING_POINT_STORAGE_KEY, JSON.stringify(point));
  };

  const handleContinue = () => {
    if (!canContinue) {
      if (selectedSeats.length === 0) {
        setPaymentError("Please select at least 1 seat.");
        return;
      }
      if (!boardingPoint) {
        setPaymentError("Please select a boarding point.");
        return;
      }
      if (!droppingPoint) {
        setPaymentError("Please select a dropping point.");
        return;
      }
    }

    const bookingDraft = {
      selectedBus,
      searchData,
      selectedSeats,
      boardingPoint,
      droppingPoint,
      fare: {
        seatFare,
        baseFare,
        serviceFee,
        discount,
        totalFare,
      },
    };

    localStorage.setItem(
      SELECTED_SEATS_STORAGE_KEY,
      JSON.stringify(selectedSeats),
    );
    localStorage.setItem(
      BOARDING_POINT_STORAGE_KEY,
      JSON.stringify(boardingPoint),
    );
    localStorage.setItem(
      DROPPING_POINT_STORAGE_KEY,
      JSON.stringify(droppingPoint),
    );
    localStorage.setItem(BOOKING_DRAFT_STORAGE_KEY, JSON.stringify(bookingDraft));
    navigate("/checkout", { state: { bookingDraft } });
  };
  return (
    <>
      <nav className="bg-white sticky top-0 z-40 shadow-[0_2px_12px_rgba(44,62,80,0.07)]">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#c0392b]">
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm9 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM6 6h12v5H6V6z" />
              </svg>
            </div>

            <span className="text-sm font-bold text-[#c0392b]">
              Likili <span className="text-[#2c3e50]">Moterways</span>
            </span>
          </a>

          {/* Route info */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5">
            <span className="text-xs font-semibold text-slate-600">
              {routeLabel}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-400">
              {formatDate(journeyDate, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-semibold text-[#c0392b]">
              {searchData.passengers || "1"} Passenger
            </span>
          </div>

          {/* Help */}
          <a
            href="#"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#C0392B] transition"
          >
            <HelpCircle name="circle" className="w-4 h-4" />
            Help
          </a>
        </div>
      </nav>
      <div className="max-w-[1200px] mx-auto px-6 pt-6 pb-2">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4">
          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              navigate("/bus-listing");
            }}
            className="text-xs font-semibold text-slate-400 hover:text-[#C0392B] transition"
          >
            Search
          </a>

          <ChevronRight className="w-3 h-3 text-slate-300" />

          <span className="text-xs font-bold text-[#c0392b]">
            Seat Selection
          </span>

          <ChevronRight className="w-3 h-3 text-slate-300" />

          <span className="text-xs font-semibold text-slate-400">Payment</span>
        </div>

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-[#2C3E50]">
              Select Your Seat
            </h1>

            <p className="text-sm text-slate-500 font-medium mt-1">
              <span className="font-semibold text-[#2C3E50]">{routeLabel}</span>
              <span className="mx-2 text-slate-300">·</span>
              {selectedBus.name || "Likili Express"}
              <span className="mx-2 text-slate-300">·</span>
              {formatDate(journeyDate, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              <span className="mx-2 text-slate-300">·</span>
              Departs {selectedBus.departure || "22:00"}
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md border-2 border-slate-300 bg-white" />
              <span className="text-xs font-medium text-slate-500">
                Available
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md border-2 border-[#C0392B] bg-[#C0392B]" />
              <span className="text-xs font-medium text-slate-500">
                Selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md border-2 border-slate-200 bg-slate-100" />
              <span className="text-xs font-medium text-slate-500">Booked</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md border-2 border-pink-300 bg-pink-50" />
              <span className="text-xs font-medium text-slate-500">Ladies</span>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto px-6 pb-10">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 min-w-0 space-y-5">
            <div className="card" style={{ padding: "16px 20px" }}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#fff5f5" }}
                  >
                    <svg
                      className="w-7 h-7 text-[#c0392b]"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm9 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM6 6h12v5H6V6z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#2C3E50]">
                      {selectedBus.name || "Likili Express"} · BCJ 2503
                    </p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {selectedBus.type || "AC Sleeper"} ·{" "}
                      {selectedBus.seats || 57} Seats · ZONG TONG
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-lg font-extrabold text-[#2C3E50]">
                      {selectedBus.departure || "22:00"}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      {selectedBus.from || searchData.from || "Lusaka"}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <p className="text-xs font-bold text-[#c0392b]">
                      {selectedBus.duration || "05h 30m"}
                    </p>

                    <div className="flex items-center gap-1 w-24">
                      <div className="w-2 h-2 rounded-full border-2 border-[#c0392b] bg-white flex-shrink-0"></div>

                      <div className="flex-1 h-0.5 rounded-full bg-gradient-to-r from-[#c0392b] to-slate-200"></div>

                      <div className="w-2 h-2 rounded-full flex-shrink-0 bg-slate-200 border-2 border-slate-300"></div>
                    </div>

                    <p className="text-xs text-slate-400 font-medium">
                      Non-stop
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-lg font-extrabold text-[#2C3E50]">
                      {selectedBus.arrival || "03:30"}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      {selectedBus.to || searchData.to || "Ndola"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                    ★ 4.8
                  </span>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                    ❄️ AC
                  </span>
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                    📶 WiFi
                  </span>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-[#2C3E50]">Seat Map</h3>
                <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                  <span id="seats-left">{seatsLeft}</span> seats available
                </span>
              </div>
              <div className="relative mx-auto" style={{ maxWidth: "420px" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-slate-200"></div>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5">
                    <LucideIcon
                      name="circle"
                      className="w-4 h-4 text-slate-400"
                    />
                    <span className="text-xs font-bold text-slate-500">
                      FRONT · Driver
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-slate-200"></div>
                </div>
                <div className="flex justify-end mb-3 pr-2">
                  <div className="w-10 h-10 rounded-full border-4 border-slate-300 bg-slate-100 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-400 bg-slate-200"></div>
                  </div>
                </div>
                <div
                  className="space-y-3 px-2"
                  id="seat-grid"
                  onClick={handleSeatGridClick}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1"></div>
                    <div className="flex gap-2">
                      <div className="seat booked" data-seat="1C">
                        H
                      </div>
                      <div className="seat booked" data-seat="1D">
                        D
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5 text-center flex-shrink-0">
                      1
                    </span>
                    <div className="flex gap-2">
                      <div className="seat available" data-seat="3W">
                        3W
                      </div>
                      <div className="seat available" data-seat="4P">
                        4P
                      </div>
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex gap-2">
                      <div className="seat available" data-seat="2P">
                        2P
                      </div>
                      <div className="seat available" data-seat="1W">
                        1W
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5 text-center flex-shrink-0">
                      2
                    </span>
                    <div className="flex gap-2">
                      <div className="seat booked" data-seat="7W">
                        7W
                      </div>
                      <div className="seat booked" data-seat="8P">
                        8P
                      </div>
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex gap-2">
                      <div className="seat available" data-seat="6P">
                        6P
                      </div>
                      <div className="seat available" data-seat="5W">
                        5W
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5 text-center flex-shrink-0">
                      3
                    </span>
                    <div className="flex gap-2">
                      <div className="seat available" data-seat="11W">
                        11W
                      </div>
                      <div className="seat selected" data-seat="12P">
                        12P
                      </div>
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex gap-2">
                      <div className="seat selected" data-seat="10P">
                        10P
                      </div>
                      <div className="seat available" data-seat="9W">
                        9W
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5 text-center flex-shrink-0">
                      4
                    </span>
                    <div className="flex gap-2">
                      <div className="seat ladies" data-seat="15W">
                        15W
                      </div>
                      <div className="seat ladies" data-seat="16P">
                        16P
                      </div>
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex gap-2">
                      <div className="seat booked" data-seat="14P">
                        14P
                      </div>
                      <div className="seat booked" data-seat="13W">
                        13W
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5 text-center flex-shrink-0">
                      5
                    </span>
                    <div className="flex gap-2">
                      <div className="seat available" data-seat="19W">
                        19W
                      </div>
                      <div className="seat available" data-seat="20P">
                        20P
                      </div>
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex gap-2">
                      <div className="seat available" data-seat="18P">
                        18P
                      </div>
                      <div className="seat booked" data-seat="17W">
                        17W
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5 text-center flex-shrink-0">
                      6
                    </span>
                    <div className="flex gap-2">
                      <div className="seat booked" data-seat="X">
                        X
                      </div>
                      <div className="seat booked" data-seat="X">
                        X
                      </div>
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex gap-2">
                      <div className="seat available" data-seat="22P">
                        22P
                      </div>
                      <div className="seat available" data-seat="21W">
                        21W
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5 text-center flex-shrink-0">
                      7
                    </span>
                    <div className="flex gap-2">
                      <div className="seat booked" data-seat="X">
                        X
                      </div>
                      <div className="seat booked" data-seat="X">
                        X
                      </div>
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex gap-2">
                      <div className="seat available" data-seat="24P">
                        24P
                      </div>
                      <div className="seat available" data-seat="23W">
                        23W
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5 text-center flex-shrink-0">
                      8
                    </span>
                    <div className="flex gap-2">
                      <div className="seat booked" data-seat="X">
                        X
                      </div>
                      <div className="seat booked" data-seat="X">
                        X
                      </div>
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex gap-2">
                      <div className="seat booked" data-seat="26P">
                        26P
                      </div>
                      <div className="seat available" data-seat="25W">
                        25W
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5 text-center flex-shrink-0">
                      9
                    </span>
                    <div className="flex gap-2">
                      <div className="seat booked" data-seat="X">
                        X
                      </div>
                      <div className="seat booked" data-seat="X">
                        X
                      </div>
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex gap-2">
                      <div className="seat available" data-seat="28P">
                        28P
                      </div>
                      <div className="seat available" data-seat="27W">
                        27W
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5 text-center flex-shrink-0">
                      10
                    </span>
                    <div className="flex gap-2">
                      <div className="seat available" data-seat="29W">
                        29W
                      </div>
                      <div className="seat available" data-seat="30P">
                        30P
                      </div>
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex gap-2">
                      <div className="seat booked" data-seat="32P">
                        32P
                      </div>
                      <div className="seat available" data-seat="31W">
                        31W
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5 text-center flex-shrink-0">
                      11
                    </span>
                    <div className="flex gap-2">
                      <div className="seat available" data-seat="33W">
                        33W
                      </div>
                      <div className="seat available" data-seat="34P">
                        34P
                      </div>
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex gap-2">
                      <div className="seat booked" data-seat="36P">
                        36P
                      </div>
                      <div className="seat available" data-seat="35W">
                        35W
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5 text-center flex-shrink-0">
                      12
                    </span>
                    <div className="flex gap-2">
                      <div className="seat available" data-seat="37W">
                        37W
                      </div>
                      <div className="seat available" data-seat="38P">
                        38P
                      </div>
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex gap-2">
                      <div className="seat booked" data-seat="40P">
                        40P
                      </div>
                      <div className="seat available" data-seat="39W">
                        39W
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5 text-center flex-shrink-0">
                      13
                    </span>
                    <div className="flex gap-2">
                      <div className="seat available" data-seat="41W">
                        41W
                      </div>
                      <div className="seat available" data-seat="42P">
                        42P
                      </div>
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex gap-2">
                      <div className="seat booked" data-seat="44P">
                        44P
                      </div>
                      <div className="seat available" data-seat="43W">
                        43W
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5 text-center flex-shrink-0">
                      14
                    </span>
                    <div className="flex gap-2">
                      <div className="seat available" data-seat="45W">
                        45W
                      </div>
                      <div className="seat available" data-seat="46P">
                        46P
                      </div>
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex gap-2">
                      <div className="seat booked" data-seat="48P">
                        48P
                      </div>
                      <div className="seat available" data-seat="47W">
                        47W
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5 text-center flex-shrink-0">
                      15
                    </span>
                    <div className="flex gap-2">
                      <div className="seat available" data-seat="49W">
                        49W
                      </div>
                      <div className="seat available" data-seat="50P">
                        50P
                      </div>
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex gap-2">
                      <div className="seat booked" data-seat="52P">
                        52P
                      </div>
                      <div className="seat available" data-seat="51W">
                        51W
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 my-2">
                    <div className="flex-1 h-px bg-slate-200"></div>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                      Back Row
                    </span>
                    <div className="flex-1 h-px bg-slate-200"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5 text-center flex-shrink-0">
                      16
                    </span>
                    <div className="flex gap-2">
                      <div className="seat available" data-seat="53W">
                        53W
                      </div>
                      <div className="seat booked" data-seat="54B">
                        54B
                      </div>
                      <div className="seat available" data-seat="56P">
                        56P
                      </div>
                      <div className="seat available" data-seat="57P">
                        57P
                      </div>
                      <div className="seat booked" data-seat="55W">
                        55W
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-5">
                  <div className="flex-1 h-px bg-slate-200"></div>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5">
                    <LucideIcon
                      name="circle"
                      className="w-4 h-4 text-slate-400"
                    />
                    <span className="text-xs font-bold text-slate-500">
                      REAR · Exit
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-slate-200"></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#fff5f5] flex items-center justify-center flex-shrink-0">
                    <MapPin name="circle" className="w-4 h-4 text-[#c0392b]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#2C3E50]">
                    Boarding Point
                  </h3>
                </div>
                <div className="space-y-2.5">
                  <div
                    className={`point-option ${boardingPoint === "Lusaka City Terminal" ? "active" : ""} flex items-center justify-between`}
                    onClick={() => handleBoardingSelect("Lusaka City Terminal")}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="boarding"
                        checked={boardingPoint === "Lusaka City Terminal"}
                        onChange={() =>
                          handleBoardingSelect("Lusaka City Terminal")
                        }
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#2C3E50]">
                          Lusaka City Terminal
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          Cairo Road, Lusaka
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#c0392b]">
                      22:00
                    </span>
                  </div>
                  <div
                    className={`point-option ${boardingPoint === "Chilenje Bus Stop" ? "active" : ""} flex items-center justify-between`}
                    onClick={() => handleBoardingSelect("Chilenje Bus Stop")}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="boarding"
                        checked={boardingPoint === "Chilenje Bus Stop"}
                        onChange={() =>
                          handleBoardingSelect("Chilenje Bus Stop")
                        }
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#2C3E50]">
                          Chilenje Bus Stop
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          Chilenje South, Lusaka
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-500">
                      22:25
                    </span>
                  </div>
                  <div
                    className={`point-option ${boardingPoint === "Makeni Mall Stop" ? "active" : ""} flex items-center justify-between`}
                    onClick={() => handleBoardingSelect("Makeni Mall Stop")}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="boarding"
                        checked={boardingPoint === "Makeni Mall Stop"}
                        onChange={() =>
                          handleBoardingSelect("Makeni Mall Stop")
                        }
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#2C3E50]">
                          Makeni Mall Stop
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          Makeni, Lusaka
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-500">
                      22:45
                    </span>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] flex items-center justify-center flex-shrink-0">
                    <MapPin name="circle" className="w-4 h-4 text-[#16a34a]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#2C3E50]">
                    Dropping Point
                  </h3>
                </div>
                <div className="space-y-2.5">
                  <div
                    className={`point-option ${droppingPoint === "Ndola Main Terminal" ? "active" : ""} flex items-center justify-between`}
                    onClick={() => handleDroppingSelect("Ndola Main Terminal")}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="dropping"
                        checked={droppingPoint === "Ndola Main Terminal"}
                        onChange={() =>
                          handleDroppingSelect("Ndola Main Terminal")
                        }
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#2C3E50]">
                          Ndola Main Terminal
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          Broadway, Ndola
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-green-600">
                      03:30
                    </span>
                  </div>
                  <div
                    className={`point-option ${droppingPoint === "Ndola Town Centre" ? "active" : ""} flex items-center justify-between`}
                    onClick={() => handleDroppingSelect("Ndola Town Centre")}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="dropping"
                        checked={droppingPoint === "Ndola Town Centre"}
                        onChange={() =>
                          handleDroppingSelect("Ndola Town Centre")
                        }
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#2C3E50]">
                          Ndola Town Centre
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          Buteko Ave, Ndola
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-500">
                      03:45
                    </span>
                  </div>
                  <div
                    className={`point-option ${droppingPoint === "Mushili Township" ? "active" : ""} flex items-center justify-between`}
                    onClick={() => handleDroppingSelect("Mushili Township")}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="dropping"
                        checked={droppingPoint === "Mushili Township"}
                        onChange={() =>
                          handleDroppingSelect("Mushili Township")
                        }
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#2C3E50]">
                          Mushili Township
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          Mushili, Ndola
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-500">
                      04:00
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div
              className="rounded-2xl p-4 flex items-center gap-4"
              style={{
                background: "linear-gradient(135deg, #1a7a4a, #27ae60)",
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Zap name="circle" className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">
                  Travel in Comfort
                </p>
                <p className="text-xs text-green-100 font-medium mt-0.5">
                  WiFi · USB Charging · AC · Reclining Seats · Onboard Snacks
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                <span className="text-xs font-semibold text-white bg-white/20 px-3 py-1.5 rounded-full">
                  📶 WiFi
                </span>
                <span className="text-xs font-semibold text-white bg-white/20 px-3 py-1.5 rounded-full">
                  🔌 USB
                </span>
                <span className="text-xs font-semibold text-white bg-white/20 px-3 py-1.5 rounded-full">
                  ❄️ AC
                </span>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#fff5f5] flex items-center justify-center flex-shrink-0">
                  <Clipboard name="circle" className="w-4 h-4 text-[#c0392b]" />
                </div>
                <h3 className="text-sm font-bold text-[#2C3E50]">
                  Booking Summary
                </h3>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#2C3E50]">
                    {routeLabel}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {formatDate(journeyDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>
                    {selectedBus.departure || "22:00"} →{" "}
                    {selectedBus.arrival || "03:30"}
                  </span>
                  <span>{selectedBus.duration || "05h 30m"}</span>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5 tracking-[0.08em]">
                  Selected Seats
                </p>
                <div
                  className="flex flex-wrap gap-2"
                  id="selected-seats-display"
                >
                  {selectedSeats.length > 0 ? (
                    selectedSeats.map((seat) => (
                      <span
                        key={seat}
                        className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-[#C0392B] text-xs font-bold px-3 py-1.5 rounded-lg"
                      >
                        <Bookmark
                          name="Bookmark"
                          className="w-3 h-3 fill-[#c0392b]"
                        />
                        {seat}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">
                      No seats selected
                    </span>
                  )}
                </div>
                <p
                  className="text-xs text-slate-400 font-medium mt-2"
                  id="seat-count-text"
                >
                  {selectedCount} seats selected · Max 6
                </p>
              </div>

              <hr className="divider mb-4" />
              <div className="space-y-2.5 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">
                    Base Fare × {selectedCount}
                  </span>
                  <span className="font-semibold text-[#2C3E50]">
                    K{baseFare.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">
                    Service Fee
                  </span>
                  <span className="font-semibold text-[#2C3E50]">
                    K{serviceFee.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-[#16a34a]">Discount</span>
                  <span className="font-bold text-[#16a34a]">
                    – K{discount.toLocaleString()}
                  </span>
                </div>
              </div>

              <hr className="divider mb-4" />
              <div className="flex items-center justify-between mb-5">
                <span className="text-sm font-bold text-[#2C3E50]">Total</span>
                <div className="text-right">
                  <p className="text-xl font-extrabold text-[#c0392b]">
                    K{totalFare.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    incl. taxes
                  </p>
                </div>
              </div>
              <button
                onClick={handleContinue}
                disabled={!canContinue}
                className="cta-btn"
                id="continue-btn"
              >
                Continue to Passenger Details
                <span>→</span>
                {/* <ArrowRightIcon name="circle" className="w-4 h-4" /> */}
              </button>
              {paymentError ? (
                <p className="mt-3 text-xs font-semibold text-[#c0392b]">
                  {paymentError}
                </p>
              ) : null}
              <div className="mt-3 flex items-center justify-center gap-1.5">
                <ShieldCheck
                  name="circle"
                  className="w-3.5 h-3.5 text-green-500"
                />
                <span className="text-xs text-slate-400 font-semibold">
                  Secure & Instant Booking
                </span>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info name="circle" className="w-4 h-4 text-amber-500" />
                <p className="text-xs font-bold text-[#2C3E50]">
                  Cancellation Policy
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></div>
                  <p className="text-xs text-slate-500 font-medium">
                    24h+ before:
                    <span className="text-green-600 font-semibold">
                      Full refund
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></div>
                  <p className="text-xs text-slate-500 font-medium">
                    6–24h before:
                    <span className="text-amber-600 font-semibold">
                      50% refund
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></div>
                  <p className="text-xs text-slate-500 font-medium">
                    Under 6h:
                    <span className="text-red-600 font-semibold">
                      No refund
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] flex items-center justify-center flex-shrink-0">
                  <LifeBuoy name="circle" className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#2C3E50]">Need Help?</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Call
                    <a
                      href="tel:+260211123456"
                      className="text-[#C0392B] font-semibold hover:underline"
                    >
                      +260 211 123 456
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
                  <SendHorizontal className="w-4 h-4" />
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

export default SeatSelection;
