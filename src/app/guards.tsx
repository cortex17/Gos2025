import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/auth";

export function RequireAuth() {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { token, role } = useAuthStore();
  
  // Дополнительная проверка из localStorage на случай, если store не обновился
  const storedRole = typeof window !== "undefined" ? localStorage.getItem("sr_role") : null;
  const storedToken = typeof window !== "undefined" ? localStorage.getItem("sr_token") : null;
  
  console.log("[RequireAdmin] Store - token:", token ? "exists" : "missing", "role:", role);
  console.log("[RequireAdmin] localStorage - token:", storedToken ? "exists" : "missing", "role:", storedRole);
  
  if (!token && !storedToken) {
    console.warn("[RequireAdmin] No token found, redirecting to login");
    return <Navigate to="/login" replace />;
  }
  
  const effectiveRole = role || (storedRole === "admin" ? "admin" : storedRole === "user" ? "user" : null);
  
  if (effectiveRole !== "admin") {
    console.warn("[RequireAdmin] Access denied. Current role:", effectiveRole, "Store role:", role, "Stored role:", storedRole);
    return <Navigate to="/dashboard" replace />;
  }
  
  console.log("[RequireAdmin] Access granted for admin");
  return <Outlet />;
}
