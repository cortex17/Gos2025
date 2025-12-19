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

export const useAuthStore = create<AuthState>((set, get) => ({
  token: getStoredToken(),
  role: getStoredRole(),
  setAuth: (token, role) => {
    try {
      console.log("[AuthStore] setAuth called with token:", token ? "exists" : "missing", "role:", role);
      
      // Сохраняем в localStorage
      localStorage.setItem(LS_TOKEN, token);
      localStorage.setItem(LS_ROLE, role);
      
      // Обновляем store синхронно
      set({ token, role });
      
      // Дополнительная проверка после установки
      const verifyToken = localStorage.getItem(LS_TOKEN);
      const verifyRole = localStorage.getItem(LS_ROLE);
      const currentState = get();
      
      console.log("[AuthStore] After setAuth:");
      console.log("  - localStorage token:", verifyToken ? "saved" : "missing");
      console.log("  - localStorage role:", verifyRole);
      console.log("  - store token:", currentState.token ? "exists" : "missing");
      console.log("  - store role:", currentState.role);
      
      // Если что-то не совпадает, принудительно обновляем
      if (verifyRole !== role || currentState.role !== role) {
        console.warn("[AuthStore] Mismatch detected, forcing update");
        localStorage.setItem(LS_ROLE, role);
        set({ token, role });
      }
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
