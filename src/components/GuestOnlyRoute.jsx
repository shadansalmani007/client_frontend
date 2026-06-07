import { Navigate, Outlet, useLocation, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/auth.store.js";

export function GuestOnlyRoute() {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();
  const [searchParams] = useSearchParams();

  if (!token) {
    return <Outlet />;
  }

  const redirectTo = searchParams.get("redirectTo") || location.state?.from || "/search";
  return <Navigate to={redirectTo} replace />;
}
