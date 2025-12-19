import { http } from "./http";
import { fakeApi } from "./fakeApi";

// Проверка, использовать ли Fake API
const USE_FAKE_API = import.meta.env.VITE_USE_FAKE_API !== "false";

export type User = {
  id: string;
  email: string;
  role: "user" | "admin";
  reputation?: number;
  isBlocked?: boolean;
  createdAt: string;
};

export type Analytics = {
  totalReports: number;
  pendingReports: number;
  approvedReports: number;
  rejectedReports: number;
  highRiskZones: Array<{
    lat: number;
    lng: number;
    count: number;
    avgSeverity: number;
  }>;
};

export async function getUsers(): Promise<User[]> {
  if (USE_FAKE_API) {
    return fakeApi.getUsers();
  }
  const { data } = await http.get("/admin/users");
  return data as User[];
}

export async function blockUser(userId: string): Promise<User> {
  if (USE_FAKE_API) {
    return fakeApi.blockUser(userId);
  }
  const { data } = await http.post(`/admin/users/${userId}/block`);
  return data as User;
}

export async function unblockUser(userId: string): Promise<User> {
  if (USE_FAKE_API) {
    return fakeApi.unblockUser(userId);
  }
  const { data } = await http.post(`/admin/users/${userId}/unblock`);
  return data as User;
}

export async function getAnalytics(): Promise<Analytics> {
  if (USE_FAKE_API) {
    return fakeApi.getAnalytics();
  }
  const { data } = await http.get("/admin/analytics");
  return data as Analytics;
}

