import useAuth from "../zustand/useAuth";
import { Navigate, useLocation } from "react-router-dom";

const AuthRemover = ({ children }) => {
  const { token } = useAuth((s) => s);
  const location = useLocation();

  if (token && location.pathname === "/login") {
    return <Navigate to={location.state?.from || "/"} replace />;
  }

  return children;
};

export default AuthRemover;
