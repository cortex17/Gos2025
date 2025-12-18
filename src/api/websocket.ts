import { useAuthStore } from "../store/auth";

export type WebSocketEvent = 
  | { type: "sos_alert"; data: { id: string; lat: number; lng: number; distance?: number } }
  | { type: "new_report"; data: { id: string; type: string; lat: number; lng: number } }
  | { type: "report_updated"; data: { id: string; status: string } }
  | { type: "panic_nearby"; data: { id: string; lat: number; lng: number; distance: number } };

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<(event: WebSocketEvent) => void>> = new Map();

  connect() {
    const token = useAuthStore.getState().token;
    const wsUrl = import.meta.env.VITE_WS_URL 
      || (import.meta.env.VITE_API_BASE_URL?.replace(/^http/, "ws") || "ws://localhost:8000") + "/ws";
    const fullUrl = `${wsUrl}${token ? `?token=${token}` : ""}`;

    try {
      this.ws = new WebSocket(fullUrl);

      this.ws.onopen = () => {
        console.log("[WebSocket] Connected");
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyListeners(data.type, data);
        } catch (error) {
          console.error("[WebSocket] Error parsing message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
      };

      this.ws.onclose = () => {
        console.log("[WebSocket] Disconnected");
        this.reconnect();
      };
    } catch (error) {
      console.error("[WebSocket] Connection error:", error);
      this.reconnect();
    }
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[WebSocket] Max reconnect attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    setTimeout(() => {
      console.log(`[WebSocket] Reconnecting (attempt ${this.reconnectAttempts})...`);
      this.connect();
    }, delay);
  }

  subscribe(eventType: string, callback: (event: WebSocketEvent) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Если WebSocket не подключен, подключаемся
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
    }

    // Возвращаем функцию отписки
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  private notifyListeners(eventType: string, event: WebSocketEvent) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => callback(event));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}

export const wsService = new WebSocketService();

