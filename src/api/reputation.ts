import { http } from "./http";

export type Reputation = {
  userId: string;
  score: number; // 0-100
  canCreateReports: boolean;
  totalReports: number;
  confirmedReports: number;
  fakeReports: number;
};

export async function getReputation(userId?: string): Promise<Reputation> {
  const endpoint = userId ? `/users/${userId}/reputation` : "/me/reputation";
  const { data } = await http.get(endpoint);
  return data as Reputation;
}

export async function getUserReputation(userId: string): Promise<Reputation> {
  const { data } = await http.get(`/users/${userId}/reputation`);
  return data as Reputation;
}

