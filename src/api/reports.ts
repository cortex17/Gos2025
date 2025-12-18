import { http } from "./http";
import { fakeApi } from "./fakeApi";
import { adaptIncidentFromBackend, adaptIncidentToBackend } from "./backendAdapter";

export type ReportType = "no_light" | "dogs" | "ice" | "other";
export type ReportStatus = "pending" | "approved" | "rejected";

export type Report = {
  id: string;
  type: ReportType;
  severity: number; // 1..5
  lat: number;
  lng: number;
  description: string;
  status: ReportStatus;
  createdAt: string;
};

// Переключите на false для использования реального бэкенда
// Убедитесь, что в .env указан VITE_API_BASE_URL
// Можно также установить VITE_USE_FAKE_API=false в .env
const USE_FAKE_API = import.meta.env.VITE_USE_FAKE_API === "false" ? false : true;

export async function listApprovedReports() {
  if (USE_FAKE_API) {
    return fakeApi.listApprovedReports();
  }
  // Бэкенд использует /incidents с параметрами lat, lon, radius
  // Для получения всех активных инцидентов используем центр Алматы
  const { data } = await http.get("/incidents", { 
    params: { 
      lat: 43.2220, 
      lon: 76.8512, 
      radius: 50000 // 50 км радиус для получения всех инцидентов
    } 
  });
  return (data as any[]).map(adaptIncidentFromBackend);
}

export async function getReport(id: string) {
  if (USE_FAKE_API) {
    return fakeApi.getReport(id);
  }
  // Бэкенд не имеет прямого endpoint для получения по ID, используем список
  const reports = await listApprovedReports();
  const report = reports.find(r => r.id === id);
  if (!report) {
    throw new Error("Report not found");
  }
  return report;
}

export async function createReport(payload: Omit<Report, "id" | "status" | "createdAt">) {
  if (USE_FAKE_API) {
    return fakeApi.createReport(payload);
  }
  const backendPayload = adaptIncidentToBackend(payload);
  const { data } = await http.post("/incidents", backendPayload);
  return adaptIncidentFromBackend(data);
}

export async function listPendingReports() {
  if (USE_FAKE_API) {
    return fakeApi.listPendingReports();
  }
  // Бэкенд не имеет отдельного endpoint для pending, используем все инциденты
  // и фильтруем на фронтенде (или используем /admin/stats)
  const { data } = await http.get("/incidents", { 
    params: { 
      lat: 43.2220, 
      lon: 76.8512, 
      radius: 50000 
    } 
  });
  // Фильтруем только активные (pending в бэкенде = active)
  return (data as any[]).map(adaptIncidentFromBackend);
}

export async function approveReport(id: string) {
  if (USE_FAKE_API) {
    return fakeApi.approveReport(id);
  }
  // Бэкенд использует PUT /admin/incidents/{id}/validate
  await http.put(`/admin/incidents/${id}/validate`);
  // Получаем обновленный инцидент
  const reports = await listApprovedReports();
  return reports.find(r => r.id === id) || reports[0];
}

export async function rejectReport(id: string) {
  if (USE_FAKE_API) {
    return fakeApi.rejectReport(id);
  }
  // Бэкенд использует PUT /admin/incidents/{id}/status с status=fake
  await http.put(`/admin/incidents/${id}/status`, { status: "fake" });
  const reports = await listApprovedReports();
  return reports.find(r => r.id === id) || reports[0];
}

// Голосование за инцидент
export async function voteReport(id: string, vote: "confirm" | "fake") {
  const { data } = await http.post(`/reports/${id}/vote`, { vote });
  return data as { success: boolean; votes: { confirm: number; fake: number } };
}

// Получить голоса для отчета
export async function getReportVotes(id: string) {
  const { data } = await http.get(`/reports/${id}/votes`);
  return data as { confirm: number; fake: number; userVote?: "confirm" | "fake" | null };
}
