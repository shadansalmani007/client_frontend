import { lazy, Suspense } from "react";
import { createBrowserRouter, Outlet } from "react-router-dom";
import { GuestOnlyRoute } from "../components/GuestOnlyRoute.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import { ProtectedRoute } from "../components/ProtectedRoute.jsx";
import { RootLayout } from "../layouts/RootLayout.jsx";

const HomePage = lazy(() =>
  import("../pages/home/HomePage.jsx").then((module) => ({
    default: module.HomePage,
  })),
);
const SearchPage = lazy(() =>
  import("../pages/search/SearchPage.jsx").then((module) => ({
    default: module.SearchPage,
  })),
);
const LoginPage = lazy(() =>
  import("../pages/auth/LoginPage.jsx").then((module) => ({
    default: module.LoginPage,
  })),
);
const SignupPage = lazy(() =>
  import("../pages/auth/SignupPage.jsx").then((module) => ({
    default: module.SignupPage,
  })),
);
const BusDetailsPage = lazy(() =>
  import("../pages/buses/BusDetailsPage.jsx").then((module) => ({
    default: module.BusDetailsPage,
  })),
);
const CheckoutPage = lazy(() =>
  import("../pages/checkout/CheckoutPage.jsx").then((module) => ({
    default: module.CheckoutPage,
  })),
);
const MyBookingsPage = lazy(() =>
  import("../pages/bookings/MyBookingsPage.jsx").then((module) => ({
    default: module.MyBookingsPage,
  })),
);
const BookingDetailsPage = lazy(() =>
  import("../pages/bookings/BookingDetailsPage.jsx").then((module) => ({
    default: module.BookingDetailsPage,
  })),
);
const ProfilePage = lazy(() =>
  import("../pages/profile/ProfilePage.jsx").then((module) => ({
    default: module.ProfilePage,
  })),
);

function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center px-4 text-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">
          Not Found
        </p>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          That page does not exist.
        </h1>
      </div>
    </div>
  );
}

function RouteFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <LoadingState label="Loading page..." />
    </div>
  );
}

function renderLazyPage(PageComponent) {
  return (
    <Suspense fallback={<RouteFallback />}>
      <PageComponent />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    element: (
      <RootLayout>
        <Outlet />
      </RootLayout>
    ),
    children: [
      {
        path: "/",
        element: renderLazyPage(HomePage),
      },
      {
        path: "/search",
        element: renderLazyPage(SearchPage),
      },
      {
        path: "/buses/:id",
        element: renderLazyPage(BusDetailsPage),
      },
      {
        element: <GuestOnlyRoute />,
        children: [
          {
            path: "/login",
            element: renderLazyPage(LoginPage),
          },
          {
            path: "/signup",
            element: renderLazyPage(SignupPage),
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "/checkout/:bookingId",
            element: renderLazyPage(CheckoutPage),
          },
          {
            path: "/bookings",
            element: renderLazyPage(MyBookingsPage),
          },
          {
            path: "/bookings/:id",
            element: renderLazyPage(BookingDetailsPage),
          },
          {
            path: "/profile",
            element: renderLazyPage(ProfilePage),
          },
        ],
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
