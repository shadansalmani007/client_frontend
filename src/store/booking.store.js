import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const defaultPassenger = (seatNumber) => ({
  seatNumber,
  passengerName: "",
  passengerAge: "",
  passengerGender: "",
});

export const MAX_SEATS_PER_BOOKING = 5;

const initialState = {
  scheduleContext: null,
  selectedSeats: [],
  passengers: [],
  selectedPickupPoint: null,
  selectedDropPoint: null,
  contactEmail: "",
  contactPhone: "",
  paymentMethod: "airtel_money",
};

function isSameSchedule(nextContext, currentContext) {
  if (!nextContext || !currentContext) {
    return false;
  }

  return (
    nextContext.busId === currentContext.busId &&
    nextContext.scheduleId === currentContext.scheduleId &&
    nextContext.date === currentContext.date
  );
}

function isSameScheduleContext(nextContext, currentContext) {
  if (!nextContext || !currentContext) {
    return false;
  }

  return (
    nextContext.busId === currentContext.busId &&
    nextContext.scheduleId === currentContext.scheduleId &&
    nextContext.routeId === currentContext.routeId &&
    nextContext.date === currentContext.date &&
    nextContext.source === currentContext.source &&
    nextContext.destination === currentContext.destination
  );
}

function isSamePassenger(nextPassenger, currentPassenger) {
  if (!nextPassenger || !currentPassenger) {
    return false;
  }

  return (
    nextPassenger.seatNumber === currentPassenger.seatNumber &&
    nextPassenger.passengerName === currentPassenger.passengerName &&
    nextPassenger.passengerAge === currentPassenger.passengerAge &&
    nextPassenger.passengerGender === currentPassenger.passengerGender
  );
}

function areSamePassengers(nextPassengers, currentPassengers) {
  if (nextPassengers.length !== currentPassengers.length) {
    return false;
  }

  return nextPassengers.every((passenger, index) =>
    isSamePassenger(passenger, currentPassengers[index]),
  );
}

export const useBookingStore = create(
  persist(
    (set) => ({
      ...initialState,
      setScheduleContext: (scheduleContext) =>
        set((state) => {
          if (isSameScheduleContext(scheduleContext, state.scheduleContext)) {
            return state;
          }

          if (isSameSchedule(scheduleContext, state.scheduleContext)) {
            return {
              scheduleContext: {
                ...state.scheduleContext,
                ...scheduleContext,
              },
            };
          }

          return {
            ...initialState,
            scheduleContext,
          };
        }),
      toggleSeat: (seatNumber) =>
        set((state) => {
          const isSelected = state.selectedSeats.includes(seatNumber);

          if (!isSelected && state.selectedSeats.length >= MAX_SEATS_PER_BOOKING) {
            return state;
          }

          const selectedSeats = isSelected
            ? state.selectedSeats.filter((seat) => seat !== seatNumber)
            : [...state.selectedSeats, seatNumber];

          const passengers = selectedSeats.map((seat) => {
            const existingPassenger = state.passengers.find(
              (passenger) => passenger.seatNumber === seat,
            );

            return existingPassenger ?? defaultPassenger(seat);
          });

          return {
            selectedSeats,
            passengers,
          };
        }),
      syncPassengers: (seats) =>
        set((state) => {
          const normalizedSeats = seats.slice(0, MAX_SEATS_PER_BOOKING);
          const passengers = normalizedSeats.map((seat) => {
            const existingPassenger = state.passengers.find(
              (passenger) => passenger.seatNumber === seat,
            );

            return existingPassenger ?? defaultPassenger(seat);
          });

          const sameSeats =
            normalizedSeats.length === state.selectedSeats.length &&
            normalizedSeats.every((seat, index) => seat === state.selectedSeats[index]);

          if (sameSeats && areSamePassengers(passengers, state.passengers)) {
            return state;
          }

          return {
            selectedSeats: normalizedSeats,
            passengers,
          };
        }),
      updatePassenger: (seatNumber, updates) =>
        set((state) => {
          let hasChanged = false;

          const passengers = state.passengers.map((passenger) => {
            if (passenger.seatNumber !== seatNumber) {
              return passenger;
            }

            const nextPassenger = { ...passenger, ...updates };

            if (isSamePassenger(nextPassenger, passenger)) {
              return passenger;
            }

            hasChanged = true;
            return nextPassenger;
          });

          return hasChanged ? { passengers } : state;
        }),
      setContactDetails: (details) =>
        set((state) => {
          const contactEmail = details.contactEmail ?? state.contactEmail;
          const contactPhone = details.contactPhone ?? state.contactPhone;
          const paymentMethod = details.paymentMethod ?? state.paymentMethod;

          if (
            contactEmail === state.contactEmail &&
            contactPhone === state.contactPhone &&
            paymentMethod === state.paymentMethod
          ) {
            return state;
          }

          return {
            contactEmail,
            contactPhone,
            paymentMethod,
          };
        }),
      setSelectedPoints: ({ pickupPoint, dropPoint }) =>
        set((state) => {
          const nextPickupPoint =
            pickupPoint === undefined ? state.selectedPickupPoint : pickupPoint;
          const nextDropPoint =
            dropPoint === undefined ? state.selectedDropPoint : dropPoint;

          if (
            JSON.stringify(nextPickupPoint) === JSON.stringify(state.selectedPickupPoint) &&
            JSON.stringify(nextDropPoint) === JSON.stringify(state.selectedDropPoint)
          ) {
            return state;
          }

          return {
            selectedPickupPoint: nextPickupPoint,
            selectedDropPoint: nextDropPoint,
          };
        }),
      resetBooking: () => set(initialState),
    }),
    {
      name: "customer-booking",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
