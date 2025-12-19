import { create } from "zustand";

type Role = "user" | "admin";

type AuthState = {
  token: string | null;
  role: Role | null;
  setAuth: (token: string, role: Role) => void;
  logout: () => void;
};

const LS_TOKEN = "sr_token";
const LS_ROLE = "sr_role";

// Функция для безопасного чтения из localStorage
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LS_TOKEN);
  } catch {
    return null;
  }
}

function getStoredRole(): Role | null {
  if (typeof window === "undefined") return null;
  try {
    const role = localStorage.getItem(LS_ROLE);
    return (role === "admin" || role === "user") ? role : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: getStoredToken(),
  role: getStoredRole(),
  setAuth: (token, role) => {
    try {
      localStorage.setItem(LS_TOKEN, token);
      localStorage.setItem(LS_ROLE, role);
      console.log("[AuthStore] setAuth called with role:", role);
      set({ token, role });
      
      // Дополнительная проверка после установки
      const verifyToken = localStorage.getItem(LS_TOKEN);
      const verifyRole = localStorage.getItem(LS_ROLE);
      console.log("[AuthStore] Verification - token:", verifyToken ? "saved" : "missing", "role:", verifyRole);
    } catch (error) {
      console.error("[AuthStore] Error saving auth:", error);
    }
  },
  logout: () => {
    try {
      localStorage.removeItem(LS_TOKEN);
      localStorage.removeItem(LS_ROLE);
      set({ token: null, role: null });
    } catch (error) {
      console.error("[AuthStore] Error during logout:", error);
    }
  },
}));
