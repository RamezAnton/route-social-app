import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken } from "../api/api";

export function RequireAuth() {
  const location = useLocation();
  if (!getToken()) {
    return (
      <Navigate to="/auth/login" replace state={{ from: location.pathname }} />
    );
  }
  return <Outlet />;
}
