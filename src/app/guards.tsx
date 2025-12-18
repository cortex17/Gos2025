import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/auth";

export function RequireAuth() {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { token, role } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
