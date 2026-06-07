import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  createCustomerBooking,
  getCustomerSeatAvailability,
} from "../../api/customer-booking.api.js";
import { getBusDetails } from "../../api/bus.api.js";
import { BookingSummaryCard } from "../../components/BookingSummaryCard.jsx";
import { EmptyState } from "../../components/EmptyState.jsx";
import { ErrorAlert } from "../../components/ErrorAlert.jsx";
import { LoadingState } from "../../components/LoadingState.jsx";
import { PassengerFields } from "../../components/PassengerFields.jsx";
import { PaymentMethodSelector } from "../../components/PaymentMethodSelector.jsx";
import { SeatMap } from "../../components/SeatMap.jsx";
import { useAuthStore } from "../../store/auth.store.js";
import { MAX_SEATS_PER_BOOKING, useBookingStore } from "../../store/booking.store.js";
import { useSearchStore } from "../../store/search.store.js";
import { useUiStore } from "../../store/ui.store.js";
import { getSeatAvailabilitySeatNumbers } from "../../utils/booking.js";
import { queryKeys } from "../../utils/queryKeys.js";
import {
  findLocationPoint,
  formatLocationPoint,
  getLocationPointDescription,
  getLocationPointKey,
  getStopDisplayName,
  normalizeIntermediateStops,
  normalizeLocationPoints,
  toBookingPoint,
} from "../../utils/route-segments.js";

const CUSTOMER_BOOKING_TEST_VALUES = {
  busId: "6a0c3c30efd81d45bfa9ff01",
  routeId: "6a0c3e7db1c64d193b60ddb9",
  scheduleId: "6a0c3e7eb1c64d193b60ddc2",
  source: "lusaka",
  destination: "ndola",
  date: "2026-05-20",
};

function normalizeSeatNumber(value) {
  return String(value ?? "").trim();
}

function isLuggageLayoutCell(cell) {
  const rawType = String(cell?.type ?? cell?.kind ?? cell?.category ?? "").trim().toLowerCase();

  return (
    rawType.includes("luggage") ||
    rawType.includes("baggage") ||
    rawType.includes("bag")
  );
}

function getLayoutLuggageSeatNumbers(layout) {
  const seats = Array.isArray(layout?.seats) ? layout.seats : [];

  return seats
    .filter(isLuggageLayoutCell)
    .map((seat) =>
      normalizeSeatNumber(
        seat?.seatNumber ??
          seat?.number ??
          seat?.label ??
          seat?.name ??
          seat?.code ??
          seat?.id,
      ),
    )
    .filter(Boolean);
}

function getScheduleContext(id, searchParams) {
  const useTestingFallback =
    import.meta.env.DEV &&
    id === CUSTOMER_BOOKING_TEST_VALUES.busId &&
    !searchParams.get("scheduleId");

  return {
    busId: id,
    scheduleId:
      searchParams.get("scheduleId") ||
      (useTestingFallback ? CUSTOMER_BOOKING_TEST_VALUES.scheduleId : ""),
    routeId:
      searchParams.get("routeId") ||
      (useTestingFallback ? CUSTOMER_BOOKING_TEST_VALUES.routeId : ""),
    date:
      searchParams.get("date") || (useTestingFallback ? CUSTOMER_BOOKING_TEST_VALUES.date : ""),
    source:
      searchParams.get("source") ||
      (useTestingFallback ? CUSTOMER_BOOKING_TEST_VALUES.source : ""),
    destination:
      searchParams.get("destination") ||
      (useTestingFallback ? CUSTOMER_BOOKING_TEST_VALUES.destination : ""),
  };
}

function defaultPassenger(seatNumber) {
  return {
    seatNumber,
    passengerName: "",
    passengerAge: "",
    passengerGender: "",
  };
}

function isPassengerComplete(passenger) {
  return Boolean(
    passenger?.seatNumber &&
      String(passenger?.passengerName || "").trim() &&
      String(passenger?.passengerGender || "").trim() &&
      passenger?.passengerAge !== "" &&
      passenger?.passengerAge !== null &&
      passenger?.passengerAge !== undefined &&
      !Number.isNaN(Number(passenger?.passengerAge)),
  );
}

export function BusDetailsPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const addToast = useUiStore((state) => state.addToast);
  const clearRouteInputs = useSearchStore((state) => state.clearRouteInputs);
  const {
    scheduleContext: storedContext,
    selectedSeats,
    passengers,
    selectedPickupPoint,
    selectedDropPoint,
    contactEmail,
    contactPhone,
    paymentMethod,
    setScheduleContext,
    toggleSeat,
    syncPassengers,
    updatePassenger,
    setContactDetails,
    setSelectedPoints,
    resetBooking,
  } = useBookingStore();

  const [bookingError, setBookingError] = useState("");
  const [showSeatLimitModal, setShowSeatLimitModal] = useState(false);

  const scheduleContext = useMemo(
    () => getScheduleContext(id, new URLSearchParams(searchParamsKey)),
    [id, searchParamsKey],
  );

  useEffect(() => {
    setScheduleContext(scheduleContext);
  }, [scheduleContext, setScheduleContext]);

  const activeContext = storedContext || scheduleContext;
  const seatQueryParams = useMemo(
    () => ({
      date: activeContext?.date || "",
      routeId: activeContext?.routeId || "",
      scheduleId: activeContext?.scheduleId || "",
      source: activeContext?.source || "",
      destination: activeContext?.destination || "",
    }),
    [activeContext],
  );

  const busQuery = useQuery({
    queryKey: queryKeys.bus(id),
    queryFn: () => getBusDetails(id),
    enabled: Boolean(id),
  });

  const seatsQuery = useQuery({
    queryKey: queryKeys.busSeats(id, seatQueryParams),
    queryFn: () =>
      getCustomerSeatAvailability(id, {
        date: seatQueryParams.date,
        routeId: seatQueryParams.routeId || undefined,
        scheduleId: seatQueryParams.scheduleId || undefined,
        source: seatQueryParams.source || undefined,
        destination: seatQueryParams.destination || undefined,
      }),
    enabled: Boolean(
      id &&
        seatQueryParams.date &&
        seatQueryParams.scheduleId &&
        seatQueryParams.source &&
        seatQueryParams.destination,
    ),
  });

  const form = useForm({
    mode: "onChange",
    defaultValues: {
      pickupPointKey: selectedPickupPoint ? getLocationPointKey(selectedPickupPoint) : "",
      dropPointKey: selectedDropPoint ? getLocationPointKey(selectedDropPoint) : "",
      contactEmail: contactEmail || user?.email || "",
      contactPhone: contactPhone || user?.phone || "",
      paymentMethod: paymentMethod || "airtel_money",
      passengers: passengers.length ? passengers : [],
    },
  });

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid },
  } = form;

  const { fields, replace } = useFieldArray({
    control,
    name: "passengers",
  });

  const watchedPassengers = watch("passengers") || [];
  const selectedPickupKey = watch("pickupPointKey");
  const selectedDropKey = watch("dropPointKey");
  const watchedContactEmail = watch("contactEmail");
  const watchedContactPhone = watch("contactPhone");
  const watchedPaymentMethod = watch("paymentMethod");

  const bus = busQuery.data || {};
  const seatData = seatsQuery.data || {};
  const seatLimitMessage = `You can book a maximum of ${MAX_SEATS_PER_BOOKING} seats at a time.`;
  const availableSeatNumbers = useMemo(
    () => getSeatAvailabilitySeatNumbers(seatData.availableSeats),
    [seatData.availableSeats],
  );
  const bookedSeatNumbers = useMemo(
    () => getSeatAvailabilitySeatNumbers(seatData.bookedSeats),
    [seatData.bookedSeats],
  );
  const blockedSeatNumbers = useMemo(
    () => getSeatAvailabilitySeatNumbers(seatData.blockedSeats),
    [seatData.blockedSeats],
  );
  const layoutLuggageSeatNumbers = useMemo(
    () => getLayoutLuggageSeatNumbers(seatData.layout),
    [seatData.layout],
  );
  const visibleAvailableSeatCount = useMemo(() => {
    const restoredLayoutSlots = layoutLuggageSeatNumbers.filter(
      (seatNumber) => !availableSeatNumbers.includes(seatNumber),
    ).length;

    return availableSeatNumbers.length + restoredLayoutSlots;
  }, [availableSeatNumbers, layoutLuggageSeatNumbers]);
  const boardingPoints = useMemo(() => {
    const points =
      seatData.boardingPoints?.length > 0
        ? seatData.boardingPoints
        : activeContext?.boardingPoints || [];

    return normalizeLocationPoints(points);
  }, [activeContext?.boardingPoints, seatData.boardingPoints]);
  const droppingPoints = useMemo(() => {
    const points =
      seatData.droppingPoints?.length > 0
        ? seatData.droppingPoints
        : activeContext?.droppingPoints || [];

    return normalizeLocationPoints(points);
  }, [activeContext?.droppingPoints, seatData.droppingPoints]);
  const intermediateStops = useMemo(() => {
    const stops =
      seatData.intermediateStops?.length > 0
        ? seatData.intermediateStops
        : activeContext?.intermediateStops || [];

    return normalizeIntermediateStops(stops);
  }, [activeContext?.intermediateStops, seatData.intermediateStops]);
  const requiresPickup = boardingPoints.length > 0;
  const requiresDrop = droppingPoints.length > 0;
  const selectedPickupPointForForm = useMemo(
    () => (requiresPickup ? findLocationPoint(boardingPoints, selectedPickupKey) : null),
    [boardingPoints, requiresPickup, selectedPickupKey],
  );
  const selectedDropPointForForm = useMemo(
    () => (requiresDrop ? findLocationPoint(droppingPoints, selectedDropKey) : null),
    [droppingPoints, requiresDrop, selectedDropKey],
  );
  const basePrice = seatData.basePrice ?? bus.basePrice ?? 0;
  const currency = seatData.currency ?? bus.currency ?? "ZMW";

  useEffect(() => {
    const currentPassengerRows = getValues("passengers") || [];
    const currentSeatNumbers = currentPassengerRows.map((passenger) => passenger?.seatNumber);
    const sameSeatOrder =
      currentSeatNumbers.length === selectedSeats.length &&
      currentSeatNumbers.every((seatNumber, index) => seatNumber === selectedSeats[index]);

    if (sameSeatOrder) {
      return;
    }

    const passengerRows = selectedSeats.map((seatNumber) => {
      const existingPassenger = passengers.find((passenger) => passenger.seatNumber === seatNumber);
      const currentPassenger = currentPassengerRows.find(
        (passenger) => passenger?.seatNumber === seatNumber,
      );

      return currentPassenger || existingPassenger || defaultPassenger(seatNumber);
    });

    replace(passengerRows);
  }, [getValues, passengers, replace, selectedSeats]);

  useEffect(() => {
    if (!watchedContactEmail && user?.email) {
      setValue("contactEmail", user.email, { shouldDirty: false, shouldValidate: true });
    }

    if (!watchedContactPhone && user?.phone) {
      setValue("contactPhone", user.phone, { shouldDirty: false, shouldValidate: true });
    }
  }, [setValue, user?.email, user?.phone, watchedContactEmail, watchedContactPhone]);

  useEffect(() => {
    if (!availableSeatNumbers.length) {
      return;
    }

    const validSelectedSeats = selectedSeats.filter((seat) => availableSeatNumbers.includes(seat));

    if (validSelectedSeats.length !== selectedSeats.length) {
      syncPassengers(validSelectedSeats);
    }
  }, [availableSeatNumbers, selectedSeats, syncPassengers]);

  useEffect(() => {
    if (selectedSeats.length > MAX_SEATS_PER_BOOKING) {
      syncPassengers(selectedSeats.slice(0, MAX_SEATS_PER_BOOKING));
      setBookingError(seatLimitMessage);
    }
  }, [seatLimitMessage, selectedSeats, syncPassengers]);

  useEffect(() => {
    if (!showSeatLimitModal) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowSeatLimitModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSeatLimitModal]);

  useEffect(() => {
    if (requiresPickup && selectedPickupPoint && !selectedPickupKey) {
      const key = getLocationPointKey(selectedPickupPoint);
      if (findLocationPoint(boardingPoints, key)) {
        setValue("pickupPointKey", key, { shouldValidate: true });
      }
    }

    if (requiresDrop && selectedDropPoint && !selectedDropKey) {
      const key = getLocationPointKey(selectedDropPoint);
      if (findLocationPoint(droppingPoints, key)) {
        setValue("dropPointKey", key, { shouldValidate: true });
      }
    }
  }, [
    boardingPoints,
    droppingPoints,
    requiresDrop,
    requiresPickup,
    selectedDropKey,
    selectedDropPoint,
    selectedPickupKey,
    selectedPickupPoint,
    setValue,
  ]);

  useEffect(() => {
    if (requiresPickup && selectedPickupKey && !selectedPickupPointForForm) {
      setValue("pickupPointKey", "", { shouldValidate: true });
    }

    if (requiresDrop && selectedDropKey && !selectedDropPointForForm) {
      setValue("dropPointKey", "", { shouldValidate: true });
    }
  }, [
    requiresDrop,
    requiresPickup,
    selectedDropKey,
    selectedDropPointForForm,
    selectedPickupKey,
    selectedPickupPointForForm,
    setValue,
  ]);

  useEffect(() => {
    const subscription = watch((values) => {
      setContactDetails({
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone,
        paymentMethod: values.paymentMethod,
      });

      (values.passengers || []).forEach((passenger) => {
        updatePassenger(passenger.seatNumber, {
          seatNumber: passenger.seatNumber,
          passengerName: passenger.passengerName,
          passengerAge: passenger.passengerAge,
          passengerGender: passenger.passengerGender,
        });
      });
    });

    return () => subscription.unsubscribe();
  }, [setContactDetails, updatePassenger, watch]);

  useEffect(() => {
    setSelectedPoints({
      pickupPoint: requiresPickup ? selectedPickupPointForForm : null,
      dropPoint: requiresDrop ? selectedDropPointForForm : null,
    });
  }, [
    requiresDrop,
    requiresPickup,
    selectedDropPointForForm,
    selectedPickupPointForForm,
    setSelectedPoints,
  ]);

  const createBookingMutation = useMutation({
    mutationFn: createCustomerBooking,
    onSuccess: async (result) => {
      const booking = result?.booking || {};
      const bookingId = booking?._id || booking?.id;

      addToast({
        type: "success",
        title: "Booking created",
        message: result?.message || "Your booking has been created successfully.",
      });

      if (bookingId) {
        queryClient.setQueryData(queryKeys.booking(bookingId), result);
      }

      resetBooking();
      clearRouteInputs();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["bus-seats"] }),
      ]);

      if (bookingId) {
        navigate(`/bookings/${bookingId}`);
      }
    },
  });

  const hasRequiredTripContext = Boolean(
    activeContext?.scheduleId && activeContext?.source && activeContext?.destination,
  );
  const hasPassengerRows =
    watchedPassengers.length === selectedSeats.length &&
    watchedPassengers.every(isPassengerComplete);
  const canSubmit =
    hasRequiredTripContext &&
    selectedSeats.length > 0 &&
    Boolean(String(watchedContactEmail || "").trim()) &&
    Boolean(String(watchedContactPhone || "").trim()) &&
    Boolean(String(watchedPaymentMethod || "").trim()) &&
    hasPassengerRows &&
    (!requiresPickup || Boolean(selectedPickupPointForForm)) &&
    (!requiresDrop || Boolean(selectedDropPointForForm)) &&
    isValid &&
    !createBookingMutation.isPending;

  const onSubmit = (values) => {
    if (!selectedSeats.length) {
      setBookingError("Please choose at least one available seat.");
      return;
    }

    if (selectedSeats.length > MAX_SEATS_PER_BOOKING) {
      setBookingError(seatLimitMessage);
      return;
    }

    if (!activeContext?.scheduleId || !activeContext?.source || !activeContext?.destination) {
      setBookingError(
        "Trip segment information is missing. Please return to search results and select the bus again.",
      );
      return;
    }

    if (!token) {
      navigate(
        `/login?redirectTo=${encodeURIComponent(
          window.location.pathname + window.location.search,
        )}`,
      );
      return;
    }

    const passengerPayload = (values.passengers || []).map((passenger) => ({
      seatNumber: passenger?.seatNumber,
      passengerName: String(passenger?.passengerName || "").trim(),
      passengerAge: Number(passenger?.passengerAge),
      passengerGender: String(passenger?.passengerGender || "").trim(),
    }));

    if (
      passengerPayload.length !== selectedSeats.length ||
      passengerPayload.some((passenger) => !isPassengerComplete(passenger))
    ) {
      setBookingError("Please complete passenger details for every selected seat.");
      return;
    }

    if (!values.contactEmail || !values.contactPhone || !values.paymentMethod) {
      setBookingError("Contact email, phone, and payment method are required.");
      return;
    }

    if (requiresPickup && !selectedPickupPointForForm) {
      setBookingError("Please select a valid pickup point from the available boarding points.");
      return;
    }

    if (requiresDrop && !selectedDropPointForForm) {
      setBookingError("Please select a valid drop point from the available dropping points.");
      return;
    }

    setBookingError("");

    const payload = {
      scheduleId: activeContext.scheduleId,
      source: activeContext.source,
      destination: activeContext.destination,
      seats: passengerPayload,
      paymentMethod: values.paymentMethod,
      contactEmail: values.contactEmail,
      contactPhone: values.contactPhone,
    };

    const pickupCity = activeContext?.sourceStop?.city || activeContext?.source || "";
    const dropCity = activeContext?.destinationStop?.city || activeContext?.destination || "";
    const pickupPoint = toBookingPoint(selectedPickupPointForForm, pickupCity);
    const dropPoint = toBookingPoint(selectedDropPointForForm, dropCity);

    if (pickupPoint) {
      payload.pickupPoint = pickupPoint;
    }

    if (dropPoint) {
      payload.dropPoint = dropPoint;
    }

    createBookingMutation.mutate(payload);
  };

  const passengerDetailsSection = (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Passenger Details</h2>
      <p className="mt-1 text-sm text-slate-500">
        Each selected seat needs its own passenger information before booking.
      </p>

      {fields.length ? (
        <div className="mt-6">
          <PassengerFields fields={fields} register={register} errors={errors} />
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title="Select seats first"
            message="Passenger rows will appear as soon as you select one or more available seats."
          />
        </div>
      )}
    </div>
  );

  const pickupAndDropSection =
    requiresPickup || requiresDrop ? (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Pickup and drop</h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose from the boarding and dropping points returned for this route segment before payment.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {requiresPickup ? (
            <div>
              <label className="form-label">Pickup point</label>
              <select
                className="form-input"
                {...register("pickupPointKey", {
                  required: "Pickup point is required.",
                  validate: (value) =>
                    Boolean(findLocationPoint(boardingPoints, value)) ||
                    "Select a valid pickup point.",
                })}
              >
                <option value="">Select pickup point</option>
                {boardingPoints.map((point) => (
                  <option
                    key={getLocationPointKey(point)}
                    value={getLocationPointKey(point)}
                  >
                    {formatLocationPoint(point)}
                  </option>
                ))}
              </select>
              {errors.pickupPointKey ? (
                <p className="form-error">{errors.pickupPointKey.message}</p>
              ) : null}
            </div>
          ) : null}

          {requiresDrop ? (
            <div>
              <label className="form-label">Drop point</label>
              <select
                className="form-input"
                {...register("dropPointKey", {
                  required: "Drop point is required.",
                  validate: (value) =>
                    Boolean(findLocationPoint(droppingPoints, value)) ||
                    "Select a valid drop point.",
                })}
              >
                <option value="">Select drop point</option>
                {droppingPoints.map((point) => (
                  <option
                    key={getLocationPointKey(point)}
                    value={getLocationPointKey(point)}
                  >
                    {formatLocationPoint(point)}
                  </option>
                ))}
              </select>
              {errors.dropPointKey ? (
                <p className="form-error">{errors.dropPointKey.message}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {requiresPickup ? (
            <PointPreview title="Selected pickup" point={selectedPickupPointForForm} />
          ) : null}
          {requiresDrop ? (
            <PointPreview title="Selected drop" point={selectedDropPointForForm} />
          ) : null}
        </div>
      </div>
    ) : null;

  const contactAndPaymentSection = (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Contact and Payment</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="form-label">Contact Email</label>
          <input
            type="email"
            className="form-input"
            {...register("contactEmail", {
              required: "Contact email is required.",
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: "Please enter a valid email.",
              },
            })}
          />
          {errors.contactEmail ? (
            <p className="form-error">{errors.contactEmail.message}</p>
          ) : null}
        </div>

        <div>
          <label className="form-label">Contact Phone</label>
          <input
            type="tel"
            className="form-input"
            {...register("contactPhone", {
              required: "Contact phone is required.",
              pattern: {
                value: /^[0-9+\s-]{8,15}$/,
                message: "Please enter a valid phone number.",
              },
            })}
          />
          {errors.contactPhone ? (
            <p className="form-error">{errors.contactPhone.message}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <PaymentMethodSelector register={register} error={errors.paymentMethod} />
      </div>
    </div>
  );

  const bookingActionsSection = (
    <div className="space-y-4">
      {bookingError ? (
        <ErrorAlert error={{ message: bookingError }} title="Booking cannot continue" />
      ) : null}
      {createBookingMutation.error ? (
        <ErrorAlert error={createBookingMutation.error} title="Booking failed" />
      ) : null}

      <button
        type="button"
        onClick={handleSubmit(onSubmit)}
        disabled={!canSubmit}
        className="inline-flex w-full items-center justify-center rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {createBookingMutation.isPending ? "Creating booking..." : "Create booking"}
      </button>
    </div>
  );

  if (busQuery.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <LoadingState label="Loading bus details..." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          {!hasRequiredTripContext ? (
            <ErrorAlert
              error={{
                message:
                  "This page needs route segment details from a search result. Please search again and open a bus from the results list.",
              }}
            />
          ) : null}

          {seatsQuery.isLoading ? <LoadingState label="Loading seat availability..." /> : null}
          {seatsQuery.error ? <ErrorAlert error={seatsQuery.error} /> : null}

          {!seatsQuery.isLoading && !seatsQuery.error && activeContext?.scheduleId ? (
            <>
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Choose seats</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      You can book up to {MAX_SEATS_PER_BOOKING} seats in one booking.
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <SeatMap
                    layout={seatData.layout}
                    availableSeats={availableSeatNumbers}
                    bookedSeats={bookedSeatNumbers}
                    blockedSeats={blockedSeatNumbers}
                    selectedSeats={selectedSeats}
                    onToggleSeat={(seatNumber) => {
                      if (
                        !selectedSeats.includes(seatNumber) &&
                        selectedSeats.length >= MAX_SEATS_PER_BOOKING
                      ) {
                        setShowSeatLimitModal(true);
                        return;
                      }

                      toggleSeat(seatNumber);
                      setShowSeatLimitModal(false);
                      setBookingError("");
                    }}
                  />
                </div>
              </div>

              {intermediateStops.length ? (
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-slate-900">Route stations</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Intermediate stops between your selected pickup and drop segment.
                  </p>
                  <CompactTimeline
                    source={activeContext.source}
                    stops={intermediateStops}
                    destination={activeContext.destination}
                  />
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="space-y-6">
          <BookingSummaryCard
            source={activeContext.source || bus.source}
            destination={activeContext.destination || bus.destination}
            date={activeContext.date}
            departureTime={seatData.departureTime || bus.departureTime}
            arrivalTime={seatData.arrivalTime || bus.arrivalTime}
            selectedSeats={selectedSeats}
            basePrice={basePrice}
            currency={currency}
            pickupPoint={selectedPickupPointForForm}
            dropPoint={selectedDropPointForForm}
          />

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Trip Details</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Bus number</span>
                <span className="font-semibold text-slate-900">
                  {bus.busNumber || "Not provided"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Bus type</span>
                <span className="font-semibold text-slate-900">
                  {bus.busType || bus.type || "Standard"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Available seats</span>
                <span className="font-semibold text-slate-900">
                  {visibleAvailableSeatCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Boarding points</span>
                <span className="font-semibold text-slate-900">{boardingPoints.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Dropping points</span>
                <span className="font-semibold text-slate-900">{droppingPoints.length}</span>
              </div>
            </div>
          </div>

          {passengerDetailsSection}
          {pickupAndDropSection}
          {contactAndPaymentSection}
          {bookingActionsSection}
        </div>
      </div>

      <SeatLimitModal
        isOpen={showSeatLimitModal}
        message={seatLimitMessage}
        onClose={() => setShowSeatLimitModal(false)}
      />
    </div>
  );
}

function CompactTimeline({ source, stops, destination }) {
  const items = [source, ...stops.map(getStopDisplayName), destination].filter(Boolean);

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className="inline-flex items-center gap-2">
          <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {item}
          </span>
          {index < items.length - 1 ? <span className="text-slate-300">|</span> : null}
        </div>
      ))}
    </div>
  );
}

function PointPreview({ title, point }) {
  return (
    <div className="rounded-[1.5rem] bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
        {title}
      </p>
      <p className="mt-2 font-semibold text-slate-900">
        {point ? formatLocationPoint(point) : "Not selected"}
      </p>
      {point ? (
        <p className="mt-2 text-sm text-slate-500">
          {getLocationPointDescription(point) || "Exact pickup or drop details will appear here."}
        </p>
      ) : (
        <p className="mt-2 text-sm text-slate-500">
          Exact pickup or drop details will appear here.
        </p>
      )}
    </div>
  );
}

function SeatLimitModal({ isOpen, message, onClose }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="seat-limit-modal-title"
        className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="seat-limit-modal-title" className="text-xl font-semibold text-slate-900">
          Seat limit reached
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Okay
          </button>
        </div>
      </div>
    </div>
  );
}
