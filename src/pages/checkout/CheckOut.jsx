import {
  Banknote,
  Calculator as CalculatorIcon,
  Calendar,
  Check as CheckIcon,
  ChevronDown as ChevronDownIcon,
  CircleQuestionMark,
  CreditCard as CreditCardIcon,
  HandCoins as HandCoinsIcon,
  Landmark as LandmarkIcon,
  Lock as LockIcon,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Smartphone,
  Tag as TagIcon,
  User,
  Users2,
} from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const BOOKING_DRAFT_STORAGE_KEY = "likili-booking-draft";
const PASSENGER_DETAILS_STORAGE_KEY = "likili-passenger-details";
const CHECKOUT_BOOKING_STORAGE_KEY = "likili-checkout-booking";

const readStorage = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

const createBlankPassenger = () => ({
  fullName: "",
  age: "",
  gender: "",
});

const defaultPassengerDetails = {
  passengers: [],
  email: "",
  countryCode: "+260",
  phone: "",
  mobileMoneyNumber: "097 456 7890",
  acceptedTerms: true,
};

const normalizePassengerDetails = (savedDetails) => {
  if (!savedDetails) return defaultPassengerDetails;

  const savedPassengers = Array.isArray(savedDetails.passengers)
    ? savedDetails.passengers
    : savedDetails.fullName || savedDetails.age || savedDetails.gender
      ? [
          {
            fullName: savedDetails.fullName || "",
            age: savedDetails.age || "",
            gender: savedDetails.gender || "",
          },
        ]
      : [];

  return {
    ...defaultPassengerDetails,
    ...savedDetails,
    passengers: savedPassengers,
  };
};

const formatDate = (value, options = { day: "numeric", month: "short" }) => {
  if (!value) return "Select date";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "Select date";
  return parsedDate.toLocaleDateString("en-US", options);
};

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [bookingDraft, setBookingDraft] = useState(
    location.state?.bookingDraft || readStorage(BOOKING_DRAFT_STORAGE_KEY),
  );
  const [passengerDetails, setPassengerDetails] = useState(() =>
    normalizePassengerDetails(readStorage(PASSENGER_DETAILS_STORAGE_KEY)),
  );
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    if (!bookingDraft?.selectedSeats?.length) {
      navigate("/seat-selection", { replace: true });
    }
  }, [bookingDraft, navigate]);

  const selectedBus = bookingDraft?.selectedBus || {};
  const searchData = bookingDraft?.searchData || {};
  const selectedSeats = bookingDraft?.selectedSeats || [];
  const fare = bookingDraft?.fare || {};
  const seatLabel = selectedSeats.join(", ") || "No seat";
  const selectedCount = selectedSeats.length;
  const passengers = passengerDetails.passengers || [];
  const routeLabel = `${selectedBus.from || searchData.from || "From"} → ${
    selectedBus.to || searchData.to || "To"
  }`;
  const journeyDate = searchData.date || "";
  const baseFare = Number(fare.baseFare || 0);
  const serviceFee = Number(fare.serviceFee || 0);
  const vat = Number((baseFare * 0.16).toFixed(2));
  const discount = Number(fare.discount || 0);
  const totalAmount = Number((baseFare + serviceFee + vat - discount).toFixed(2));
  const formattedJourneyDate = formatDate(journeyDate, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const canPay =
    passengers.length === selectedCount &&
    passengers.every(
      (passenger) =>
        passenger.fullName?.trim() &&
        Number(passenger.age) > 0 &&
        passenger.gender,
    ) &&
    passengerDetails.email.trim() &&
    passengerDetails.phone.trim() &&
    passengerDetails.mobileMoneyNumber.trim() &&
    passengerDetails.acceptedTerms;

  useEffect(() => {
    if (!selectedCount) return;

    setPassengerDetails((currentDetails) => {
      const currentPassengers = currentDetails.passengers || [];
      if (currentPassengers.length === selectedCount) return currentDetails;

      const nextPassengerDetails = {
        ...currentDetails,
        passengers: Array.from({ length: selectedCount }, (_, index) => ({
          ...createBlankPassenger(),
          ...(currentPassengers[index] || {}),
        })),
      };

      localStorage.setItem(
        PASSENGER_DETAILS_STORAGE_KEY,
        JSON.stringify(nextPassengerDetails),
      );
      return nextPassengerDetails;
    });
  }, [selectedCount]);

  const updatePassengerDetails = (field, value) => {
    const nextPassengerDetails = { ...passengerDetails, [field]: value };
    setPassengerDetails(nextPassengerDetails);
    setCheckoutError("");
    localStorage.setItem(
      PASSENGER_DETAILS_STORAGE_KEY,
      JSON.stringify(nextPassengerDetails),
    );
  };

  const updatePassenger = (index, field, value) => {
    const nextPassengerDetails = {
      ...passengerDetails,
      passengers: passengers.map((passenger, passengerIndex) =>
        passengerIndex === index
          ? { ...passenger, [field]: value }
          : passenger,
      ),
    };

    setPassengerDetails(nextPassengerDetails);
    setCheckoutError("");
    localStorage.setItem(
      PASSENGER_DETAILS_STORAGE_KEY,
      JSON.stringify(nextPassengerDetails),
    );
  };

  const handlePayNow = () => {
    if (!canPay) {
      setCheckoutError("Please complete all passenger details before payment.");
      return;
    }

    const checkoutBooking = {
      ...bookingDraft,
      passengerDetails,
      passengers,
      fare: {
        ...fare,
        vat,
        totalAmount,
      },
    };

    localStorage.setItem(
      CHECKOUT_BOOKING_STORAGE_KEY,
      JSON.stringify(checkoutBooking),
    );
    navigate("/booking-confirmation", { state: { checkoutBooking } });
  };

  return (
    <>
      <header className="bg-white sticky top-0 z-40 shadow-[0_2px_12px_rgba(44,62,80,0.07)]">
        <div className="max-w-[1100px] mx-auto px-6 py-0">
          <div className="flex items-center justify-between h-14 border-b border-slate-100">
            <a href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-7 h-7 rounded-lg flex bg-[#c0392b] items-center justify-center">
                <svg
                  class="w-4 h-4 text-white"
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

            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5">
              <MapPin name="circle" className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600">
                {routeLabel}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-400 font-medium">
                {formattedJourneyDate}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-semibold text-[#c0392b]">
                {selectedCount === 1 ? "Seat" : "Seats"} {seatLabel}
              </span>
            </div>

            <a
              href="#"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#C0392B] transition"
            >
              <CircleQuestionMark
                name="CircleQuestionMark"
                className="w-4 h-4"
              />
              Help
            </a>
          </div>
          <div className="flex items-center justify-center gap-0 py-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-[#dcfce7] border-2 border-green-600">
                <CheckIcon
                  name="circle"
                  className="w-3.5 h-3.5 text-[#16a34a]"
                />
              </div>
              <span className="text-xs font-semibold step-done hidden sm:inline">
                Seat Selection
              </span>
            </div>
            <div className="flex items-center mx-3">
              <div className="h-0.5 w-12 sm:w-20 rounded-full bg-[#16a34a]"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex bg-[#c0392b] border-2 border-[#c0392b] items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                2
              </div>
              <span className="text-xs font-bold step-active hidden sm:inline">
                Details & Payment
              </span>
            </div>
            <div className="flex items-center mx-3">
              <div className="h-0.5 w-12 sm:w-20 rounded-full bg-slate-200"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-slate-400 text-xs font-bold bg-slate-100 border-2 border-slate-200">
                3
              </div>
              <span className="text-xs font-medium step-inactive hidden sm:inline">
                Confirm
              </span>
            </div>
          </div>
          <div className="h-1 bg-slate-100 rounded-full mb-0 -mx-6 relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 rounded-full transition-all w-[66%] bg-gradient-to-r from-[#16a34a] to-[#22c55e]"></div>
          </div>
        </div>
      </header>
      <main className="max-w-[1100px] mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 min-w-0 space-y-5">
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex bg-[#fff5f5] items-center justify-center flex-shrink-0">
                    <User name="circle" className="w-5 h-5 text-[#c0392b]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#2C3E50]">
                      Passenger Details
                    </h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Enter details as per your ID proof
                    </p>
                  </div>
                </div>
                <span className="seat-badge">
                  <CheckIcon name="circle" className="w-3.5 h-3.5" />
                  {selectedCount === 1 ? "Seat" : "Seats"} {seatLabel}
                </span>
              </div>

              <hr className="divider mb-5" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {passengers.map((passenger, index) => (
                  <Fragment key={selectedSeats[index] || index}>
                    <div className="sm:col-span-2">
                      <label className="form-label">Full Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <User
                            name="circle"
                            className="w-4 h-4 text-slate-400"
                          />
                        </div>
                        <input
                          type="text"
                          className="form-input !pl-[35px]"
                          placeholder="e.g. Chanda Mwale"
                          value={passenger.fullName || ""}
                          onChange={(event) =>
                            updatePassenger(index, "fullName", event.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Age</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Calendar
                            name="circle"
                            className="w-4 h-4 text-slate-400"
                          />
                        </div>
                        <input
                          type="number"
                          className="form-input !pl-[35px]"
                          placeholder="e.g. 28"
                          min="1"
                          max="120"
                          value={passenger.age || ""}
                          onChange={(event) =>
                            updatePassenger(index, "age", event.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Gender</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                          <Users2
                            name="circle"
                            className="w-4 h-4 text-slate-400"
                          />
                        </div>
                        <select
                          className="form-input !pl-[35px] appearance-none pr-8"
                          value={passenger.gender || ""}
                          onChange={(event) =>
                            updatePassenger(index, "gender", event.target.value)
                          }
                        >
                          <option value="" disabled>
                            Select gender
                          </option>
                          <option>Male</option>
                          <option>Female</option>
                          <option>Non-binary</option>
                          <option>Prefer not to say</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <ChevronDownIcon
                            name="circle"
                            className="w-4.5 h-4.5 text-slate-400"
                          />
                        </div>
                      </div>
                    </div>
                  </Fragment>
                ))}
                <div className="sm:col-span-2">
                  <label className="form-label">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail name="circle" className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      className="form-input !pl-[35px]"
                      placeholder="e.g. chanda@email.com"
                      value={passengerDetails.email}
                      onChange={(event) =>
                        updatePassengerDetails("email", event.target.value)
                      }
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 font-medium">
                    📩 Ticket will be sent to this email
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label">Mobile Number</label>
                  <div className="flex gap-2">
                    <div className="relative flex-shrink-0">
                      <select className="form-input !pr-7 pl-3 appearance-none w-[110px]">
                        <option>🇿🇲 +260</option>
                        <option>🇿🇦 +27</option>
                        <option>🇰🇪 +254</option>
                        <option>🇳🇬 +234</option>
                        <option>🇬🇧 +44</option>
                        <option>🇺🇸 +1</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                        <ChevronDownIcon
                          name="circle"
                          className="w-3.5 h-3.5 text-slate-400"
                        />
                      </div>
                    </div>
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Phone
                          name="circle"
                          className="w-4 h-4 text-slate-400"
                        />
                      </div>
                      <input
                        type="tel"
                        className="form-input !pl-[35px]"
                        placeholder="e.g. 097 123 4567"
                        value={passengerDetails.phone}
                        onChange={(event) =>
                          updatePassengerDetails("phone", event.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex items-start gap-3 bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                <input
                  type="checkbox"
                  className="mt-0.5 flex-shrink-0"
                  checked={passengerDetails.acceptedTerms}
                  onChange={(event) =>
                    updatePassengerDetails("acceptedTerms", event.target.checked)
                  }
                />
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  I confirm that the passenger details are accurate and I agree
                  to the
                  <a
                    href="#"
                    className="text-[#C0392B] hover:underline font-semibold"
                  >
                    Terms & Conditions
                  </a>
                  and
                  <a
                    href="#"
                    className="text-[#C0392B] hover:underline font-semibold"
                  >
                    Cancellation Policy
                  </a>
                  .
                </p>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-[#fff5f5] flex items-center justify-center flex-shrink-0">
                  <Banknote name="circle" className="w-5 h-5 text-[#C0392B]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#2C3E50]">
                    Payment Method
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Choose your preferred payment option
                  </p>
                </div>
              </div>

              <hr className="divider mb-5" />

              <div className="space-y-3">
                <div className="pay-option active">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" defaultChecked />
                    <div className="w-9 h-9 rounded-lg bg-[#e8faf0] flex items-center justify-center flex-shrink-0">
                      <Smartphone
                        name="circle"
                        className="w-5 h-5 text-green-600"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#2C3E50]">
                        Mobile Money
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        Airtel Money / MTN / Zamtel
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                      Popular
                    </span>
                  </div>
                  <div className="mt-4 pl-12">
                    <label className="form-label">Mobile Money Number</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Phone
                            name="circle"
                            className="w-4 h-4 text-slate-400"
                          />
                        </div>
                        <input
                          type="tel"
                          className="form-input !pl-[35px]"
                          placeholder="e.g. 097 123 4567"
                          value={passengerDetails.mobileMoneyNumber}
                          onChange={(event) =>
                            updatePassengerDetails(
                              "mobileMoneyNumber",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                      <button className="bg-white border-[1.5px] border-[#c0392b] text-[#c0392b] text-[13px] font-bold px-[18px] py-[9px] rounded-[9px] cursor-pointer transition-all duration-150 hover:bg-[#c0392b] hover:text-white">
                        Verify
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 font-medium">
                      💬 You'll receive a prompt on your phone to confirm
                      payment
                    </p>
                  </div>
                </div>
                <div className="pay-option">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" />
                    <div className="w-9 h-9 rounded-lg flex bg-[#eef2ff] items-center justify-center flex-shrink-0">
                      <CreditCardIcon
                        name="circle"
                        className="w-5 h-5 text-indigo-600"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#2C3E50]">
                        Credit / Debit Card
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        Visa, Mastercard, Verve
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-8 h-5 rounded bg-blue-600 flex items-center justify-center">
                        <span className="text-white text-[8px] font-black tracking-tight">
                          VISA
                        </span>
                      </div>
                      <div className="w-8 h-5 rounded bg-slate-100 flex items-center justify-center overflow-hidden">
                        <div className="flex">
                          <div className="w-3 h-3 rounded-full bg-red-500 opacity-90"></div>
                          <div className="w-3 h-3 rounded-full bg-amber-400 opacity-90 -ml-1.5"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pay-option">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" />
                    <div className="w-9 h-9 rounded-lg  bg-[#fef3c7] flex items-center justify-center flex-shrink-0">
                      <LandmarkIcon
                        name="circle"
                        className="w-5 h-5 text-amber-600"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#2C3E50]">
                        Bank Transfer
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        Zanaco, FNB, Stanbic, Atlas Mara
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pay-option">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" />
                    <div className="w-9 h-9 rounded-lg flex bg-[#f0fdf4] items-center justify-center flex-shrink-0">
                      <HandCoinsIcon
                        name="circle"
                        className="w-5 h-5 text-emerald-600"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#2C3E50]">
                        Pay at Terminal
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        Reserve now, pay at the bus terminal
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                      Hold 2h
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2.5 bg-slate-50 rounded-xl p-3 border border-slate-100">
                <ShieldCheck
                  name="circle"
                  className="w-4 h-4 text-green-600 flex-shrink-0"
                />
                <p className="text-xs text-slate-500 font-medium">
                  Your payment is secured with 256-bit SSL encryption
                </p>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
            <div className="card">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-[#fff5f5] flex items-center justify-center flex-shrink-0">
                  <CalculatorIcon
                    name="circle"
                    className="w-4.5 h-4.5 text-[#c0392b]"
                  />
                </div>
                <h2 className="text-base font-bold text-[#2C3E50]">
                  Fare Summary
                </h2>
              </div>
              <div className="bg-slate-50 rounded-xl p-3.5 mb-4 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#c0392b]"></div>
                    <span className="text-sm font-bold text-[#2C3E50]">
                      {selectedBus.from || searchData.from || "From"}
                    </span>
                  </div>
                  <svg
                    class="w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#2C3E50]">
                      {selectedBus.to || searchData.to || "To"}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>
                    {formattedJourneyDate} · {selectedBus.departure || "22:00"}
                  </span>
                  <span className="text-end">
                    {selectedCount === 1 ? "Seat" : "Seats"} {seatLabel} ·{" "}
                    {selectedBus.type || "AC Sleeper"}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-400 font-medium">
                  <span>{selectedCount} Passenger{selectedCount === 1 ? "" : "s"}</span>
                  <span> · </span>
                  <span>
                    {passengers
                      .map((passenger) => passenger.fullName?.trim())
                      .filter(Boolean)
                      .join(", ") || "Passenger details pending"}
                  </span>
                </div>
              </div>

              <hr className="divider mb-4" />
              <div className="space-y-3">
                <div className="fare-row">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-medium">
                      Base Fare
                    </span>
                    <span
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold cursor-help shrink-0"
                      title="Standard ticket price"
                    >
                      i
                    </span>
                  </div>
                  <span className="font-semibold text-[#2C3E50]">
                    K{baseFare.toLocaleString()}
                  </span>
                </div>

                <div className="fare-row">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-medium">
                      Service Fee
                    </span>
                    <span
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold cursor-help shrink-0"
                      title="Standard ticket price"
                    >
                      i
                    </span>
                  </div>
                  <span className="font-semibold text-[#2C3E50]">
                    K{serviceFee.toLocaleString()}
                  </span>
                </div>

                <div className="fare-row">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-medium">
                      VAT (16%)
                    </span>
                    <span
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold cursor-help shrink-0"
                      title="Standard ticket price"
                    >
                      i
                    </span>
                  </div>
                  <span className="font-semibold text-[#2C3E50]">
                    K{vat.toLocaleString()}
                  </span>
                </div>

                <div className="fare-row">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#16a34a]">
                      Promo Discount
                    </span>
                    <span className="text-xs font-bold text-[#16a34a] bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                      FIRST10
                    </span>
                  </div>
                  <span className="font-bold text-[#16a34a]">
                    – K{discount.toLocaleString()}
                  </span>
                </div>
              </div>

              <hr className="divider my-4" />
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-[#2C3E50]">
                  Total Amount
                </span>
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-[#c0392b]">
                    K{totalAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    incl. all taxes
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <TagIcon
                        name="circle"
                        className="w-4 h-4 text-slate-400"
                      />
                    </div>
                    <input
                      type="text"
                      className="form-input !pl-8.5 text-sm bg-[#f0fdf4] border border-[#bbf7d0]"
                      placeholder="Promo code"
                      defaultValue="FIRST10"
                    />
                  </div>
                  <button className="text-[13px] font-bold px-[18px] py-[9px] rounded-[9px] cursor-pointer transition-all duration-150 bg-[#e8faf0] border border-[#16a34a] text-[#16a34a]">
                    <CheckIcon name="circle" className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button className="pay-now-btn mt-5" onClick={handlePayNow}>
                <LockIcon name="circle" className="w-5 h-5" />
                PAY NOW · K{totalAmount.toLocaleString()}
              </button>
              {checkoutError ? (
                <p className="mt-3 text-xs font-semibold text-[#c0392b]">
                  {checkoutError}
                </p>
              ) : null}
              <div className="mt-3 flex items-center justify-center gap-4">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck
                    name="circle"
                    className="w-3.5 h-3.5 text-green-600"
                  />
                  <span className="text-xs text-slate-400 font-semibold">
                    PCI-DSS Compliant
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck
                    name="circle"
                    className="w-3.5 h-3.5 text-green-600"
                  />
                  <span className="text-xs text-slate-400 font-semibold">
                    256-bit SSL
                  </span>
                </div>
              </div>
            </div>
            <div className="insurance-card cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#fff5f5] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <ShieldCheck
                    name="circle"
                    className="w-5 h-5 text-[#c0392b]"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-[#2C3E50]">
                      Travel Insurance
                    </p>
                    <span className="text-xs font-bold text-white bg-[#c0392b] px-2 py-0.5 rounded-full">
                      + K49
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                    Covers trip cancellation, medical emergencies & lost baggage
                    up to K5,000.
                  </p>
                  <label className="flex items-center gap-2 mt-2.5 cursor-pointer">
                    <input type="checkbox" />
                    <span className="text-xs font-semibold text-[#2C3E50]">
                      Add travel insurance
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <CircleQuestionMark
                  name="circle"
                  className="w-4 h-4 text-amber-500 flex-shrink-0"
                />
                <p className="text-xs font-bold text-[#2C3E50]">
                  Cancellation Policy
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                  <p className="text-xs text-slate-500 font-medium">
                    Cancel 24h+ before:
                    <span className="text-green-600 font-semibold">
                      Full refund
                    </span>
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></div>
                  <p className="text-xs text-slate-500 font-medium">
                    Cancel 6–24h before:
                    <span className="text-amber-600 font-semibold">
                      50% refund
                    </span>
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                  <p className="text-xs text-slate-500 font-medium">
                    Cancel under 6h:
                    <span className="text-red-600 font-semibold">
                      No refund
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="mt-10 border-t border-slate-200 bg-white">
        <div className="max-w-[1100px] mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400 font-medium">
            © 2024 Likili Moterways. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <a
              href="#"
              className="text-xs text-slate-500 hover:text-[#C0392B] font-medium transition"
            >
              Privacy Policy
            </a>
            <span className="text-slate-200">|</span>
            <a
              href="#"
              className="text-xs text-slate-500 hover:text-[#C0392B] font-medium transition"
            >
              Terms of Service
            </a>
            <span className="text-slate-200">|</span>
            <a
              href="#"
              className="text-xs text-slate-500 hover:text-[#C0392B] font-medium transition"
            >
              Help Center
            </a>
          </div>
        </div>
      </footer>
    </>
  );
};
export default Checkout;
