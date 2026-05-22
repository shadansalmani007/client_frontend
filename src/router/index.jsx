import { lazy } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import BusListing from "../pages/bus-listing/BusListing";
import Home from "../pages/home/LandingPage";
import Login from "../pages/login/Login";
import Checkout from "../pages/checkout/CheckOut";
import SeatSelection from "../pages/seat-selection/SeatSelection";
import BookingConfirmation from "../pages/booking-confirmation/BookingConfirmation";
import MyBookings from "../pages/my-bookings/MyBookings";

import AuthLayout from "../layout/AuthLayout";
import AuthProvider from "../auth/AuthProvider";
import AuthRemover from "../auth/AuthRemover";

export const router = createBrowserRouter([
  {
    element: (
      <AuthProvider>
        <AuthLayout />
      </AuthProvider>
    ),
    errorElement: "Error Element",
    children: [
      {
        path: "seat-selection",
        element: <SeatSelection />,
        id: "seat-selection",
      },
      {
        path: "seat-selection.html",
        element: <SeatSelection />,
        id: "seat-selection-html",
      },
      {
        path: "checkout",
        element: <Checkout />,
        id: "checkout",
      },
      {
        path: "booking-confirmation",
        element: <BookingConfirmation />,
        id: "booking-confirmation",
      },
      {
        path: "my-bookings",
        element: <MyBookings />,
        id: "my-bookings",
      },
    ],
  },
  {
    element: (
      <AuthRemover>
        <Outlet />
      </AuthRemover>
    ),
    errorElement: <div> Error 500</div>,
    children: [
      {
        index: true,
        element: <Home />,
        id: "home",
      },
      {
        path: "login",
        element: <Login />,
        id: "login",
      },
      {
        path: "bus-listing",
        element: <BusListing />,
        id: "bus-listing",
      },
      {
        path: "bus-listing.html",
        element: <BusListing />,
        id: "bus-listing-html",
      },
    ],
  },
  {
    path: "unauthorized",
    element: <div> Unauthorized</div>,
  },
  {
    path: "*",
    element: <div> Page Not Found</div>,
  },
]);
