import { http } from "./http";

export type PanicEvent = {
  id: string;
  lat: number;
  lng: number;
  active: boolean;
  createdAt: string;
  expiresAt: string;
};

export async function panic(payload: { lat: number; lng: number }) {
  const { data } = await http.post("/panic", payload);
  return data as PanicEvent;
}

export async function panicNear(params: { lat: number; lng: number; radius: number }) {
  const { data } = await http.get("/panic/near", { params });
  return data as PanicEvent[];
}
