import { Link, Outlet, useLocation } from "react-router-dom";

export default function AuthLayout() {
  const { pathname } = useLocation();
  const path = pathname?.split("/");
  const hideHeader = [
    "/seat-selection",
    "/seat-selection.html",
    "/checkout",
    "/booking-confirmation",
    "/my-bookings",
  ].includes(pathname);
  return (
    <main className="flex w-full flex-col h-full">
      {!hideHeader ? (
        <header className="absolute inset-x-0 top-0 z-30">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
            <Link
              to="/"
              className="text-lg font-extrabold tracking-tight text-white"
            >
              Likili Moterways
            </Link>
            <nav className="hidden items-center gap-8 text-sm font-medium text-white/80 md:flex">
              <a href="#offers" className="transition hover:text-white">
                Offers
              </a>
              <a href="#routes" className="transition hover:text-white">
                Routes
              </a>
              <a href="#gallery" className="transition hover:text-white">
                Gallery
              </a>
              <a href="#support" className="transition hover:text-white">
                Support
              </a>
            </nav>
            <div className="flex items-center gap-4 text-sm font-medium">
              <Link
                to="/"
                className="hidden text-white/80 transition hover:text-white sm:block"
              >
                Home
              </Link>
              <Link
                to="/booking-confirmation"
                className="rounded-full bg-brand-500 px-5 py-2.5 text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600"
              >
                Manage Booking
              </Link>
            </div>
          </div>
        </header>
      ) : null}
      <div>
        <Outlet />
      </div>
    </main>
  );
}
