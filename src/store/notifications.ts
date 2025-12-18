import { create } from "zustand";

type SosEvent = {
  id: string;
  type: "sos" | "report";
  lat: number;
  lng: number;
  timestamp: Date;
  data?: any;
};

type NotificationsState = {
  wsConnected: boolean;
  sosEvents: SosEvent[];
  setWsConnected: (connected: boolean) => void;
  addSosEvent: (event: SosEvent) => void;
  clearEvents: () => void;
};

export const useNotificationsStore = create<NotificationsState>((set) => ({
  wsConnected: false,
  sosEvents: [],
  setWsConnected: (connected) => set({ wsConnected: connected }),
  addSosEvent: (event) =>
    set((state) => ({
      sosEvents: [event, ...state.sosEvents].slice(0, 50), // Храним последние 50
    })),
  clearEvents: () => set({ sosEvents: [] }),
}));

