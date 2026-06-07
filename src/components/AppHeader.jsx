import { googleLogout } from "@react-oauth/google";
import { Menu, Search, UserCircle2 } from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store.js";

const navLinkClass = ({ isActive }) =>
  `transition hover:text-brand-500 ${isActive ? "text-brand-500" : "text-slate-600"}`;

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isHomePage = location.pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      {isHomePage ? (
        <div className="px-4 pt-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl text-center">
            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
              Travel beautifully, book confidently.
            </h1>
          </div>
        </div>
      ) : null}

      <div className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/20">
              <Menu className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight text-slate-900">
                Likili Motorways
              </p>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Customer App
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
            <NavLink to="/" className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/search" className={navLinkClass}>
              Search
            </NavLink>
            {token ? (
              <>
                <NavLink to="/bookings" className={navLinkClass}>
                  My Bookings
                </NavLink>
                <NavLink to="/profile" className={navLinkClass}>
                  Profile
                </NavLink>
              </>
            ) : null}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/search")}
              className="hidden items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand-200 hover:text-brand-500 sm:inline-flex"
            >
              <Search className="h-4 w-4" />
              Find buses
            </button>

            {token ? (
              <>
                <Link
                  to="/profile"
                  className="hidden items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 sm:inline-flex"
                >
                  <UserCircle2 className="h-4 w-4" />
                  {user?.name || "Profile"}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    googleLogout();
                    clearAuth();
                    navigate("/login", { replace: true });
                  }}
                  className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-500"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-600"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
