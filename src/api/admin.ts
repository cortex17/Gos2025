import { http } from "./http";

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
  const { data } = await http.get("/admin/users");
  return data as User[];
}

export async function blockUser(userId: string): Promise<User> {
  const { data } = await http.post(`/admin/users/${userId}/block`);
  return data as User;
}

export async function unblockUser(userId: string): Promise<User> {
  const { data } = await http.post(`/admin/users/${userId}/unblock`);
  return data as User;
}

export async function getAnalytics(): Promise<Analytics> {
  const { data } = await http.get("/admin/analytics");
  return data as Analytics;
}

