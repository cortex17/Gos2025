// Адаптер для преобразования данных между фронтендом и бэкендом

import { Report, ReportType, ReportStatus } from "./reports";

// Маппинг типов инцидентов
const incidentTypeMap: Record<string, ReportType> = {
  lighting: "no_light",
  dog: "dogs",
  harassment: "ice", // временно
  crime: "other",
  other: "other",
};

const reportTypeToBackend: Record<ReportType, string> = {
  no_light: "lighting",
  dogs: "dog",
  ice: "harassment", // временно
  other: "other",
};

// Маппинг статусов
const statusMap: Record<string, ReportStatus> = {
  active: "approved",
  resolved: "approved",
  fake: "rejected",
};

// Преобразование инцидента бэкенда в формат фронтенда
export function adaptIncidentFromBackend(backendIncident: any): Report {
  return {
    id: String(backendIncident.id),
    type: incidentTypeMap[backendIncident.type] || "other",
    severity: 3, // Бэкенд не имеет severity, используем дефолт
    lat: backendIncident.latitude || backendIncident.lat,
    lng: backendIncident.longitude || backendIncident.lng,
    description: backendIncident.description || "",
    status: statusMap[backendIncident.status] || "approved",
    createdAt: backendIncident.created_at || backendIncident.createdAt,
  };
}

// Преобразование данных фронтенда для отправки в бэкенд
export function adaptIncidentToBackend(report: Omit<Report, "id" | "status" | "createdAt">) {
  return {
    type: reportTypeToBackend[report.type] || "other",
    description: report.description,
    latitude: report.lat,
    longitude: report.lng,
  };
}

