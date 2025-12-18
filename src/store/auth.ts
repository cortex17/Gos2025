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

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem(LS_TOKEN),
  role: (localStorage.getItem(LS_ROLE) as Role | null) ?? null,
  setAuth: (token, role) => {
    localStorage.setItem(LS_TOKEN, token);
    localStorage.setItem(LS_ROLE, role);
    set({ token, role });
  },
  logout: () => {
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_ROLE);
    set({ token: null, role: null });
  },
}));
