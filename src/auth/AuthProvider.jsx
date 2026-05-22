import useAuth from "../zustand/useAuth";
import { Navigate, useLocation } from "react-router-dom";

const AuthProvider = ({ children }) => {
  const { token } = useAuth((s) => s);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
};

export default AuthProvider;
