import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth.store.js";

export function ProtectedRoute() {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();

  if (!token) {
    return (
      <Navigate
        to={`/login?redirectTo=${encodeURIComponent(
          location.pathname + location.search,
        )}`}
        replace
      />
    );
  }

  return <Outlet />;
}
