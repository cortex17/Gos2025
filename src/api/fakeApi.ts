import { Report } from "./reports";
import { User, Analytics } from "./admin";

const STORAGE_KEY = "sosmap_reports";

// Задержка 600-1200мс
const delay = () => new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 600));

// Случайная ошибка (1 из 10)
const shouldError = () => Math.random() < 0.1;

// Начальные данные для демонстрации
const initialReports: Report[] = [
  {
    id: "demo_1",
    type: "no_light",
    severity: 3,
    lat: 42.9,
    lng: 71.36,
    description: "Отсутствует освещение на участке дороги",
    status: "approved",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo_2",
    type: "dogs",
    severity: 4,
    lat: 42.91,
    lng: 71.37,
    description: "Стая бездомных собак",
    status: "approved",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo_3",
    type: "ice",
    severity: 2,
    lat: 42.89,
    lng: 71.35,
    description: "Скользкая дорога",
    status: "approved",
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
];

// Получить данные из localStorage
function getStoredReports(): Report[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Если нет данных, инициализируем начальными
    saveReports(initialReports);
    return initialReports;
  } catch {
    // В случае ошибки возвращаем начальные данные
    try {
      saveReports(initialReports);
    } catch {}
    return initialReports;
  }
}

// Сохранить данные в localStorage
function saveReports(reports: Report[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

// Генерация ID
function generateId(): string {
  return `fake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const fakeApi = {
  async listApprovedReports(): Promise<Report[]> {
    await delay();
    
    if (shouldError()) {
      throw new Error("Failed to load reports");
    }

    const reports = getStoredReports();
    return reports.filter(r => r.status === "approved");
  },

  async listPendingReports(): Promise<Report[]> {
    await delay();
    
    if (shouldError()) {
      throw new Error("Failed to load pending reports");
    }

    const reports = getStoredReports();
    return reports.filter(r => r.status === "pending");
  },

  async getReport(id: string): Promise<Report> {
    await delay();
    
    if (shouldError()) {
      throw new Error("Failed to load report");
    }

    const reports = getStoredReports();
    const report = reports.find(r => r.id === id);
    
    if (!report) {
      throw new Error("Report not found");
    }

    return report;
  },

  async createReport(payload: Omit<Report, "id" | "status" | "createdAt">): Promise<Report> {
    await delay();
    
    if (shouldError()) {
      throw new Error("Failed to create report");
    }

    const reports = getStoredReports();
    const newReport: Report = {
      ...payload,
      id: generateId(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    reports.push(newReport);
    saveReports(reports);

    return newReport;
  },

  async approveReport(id: string): Promise<Report> {
    await delay();
    
    if (shouldError()) {
      throw new Error("Failed to approve report");
    }

    const reports = getStoredReports();
    const report = reports.find(r => r.id === id);
    
    if (!report) {
      throw new Error("Report not found");
    }

    report.status = "approved";
    saveReports(reports);

    return report;
  },

  async rejectReport(id: string): Promise<Report> {
    await delay();
    
    if (shouldError()) {
      throw new Error("Failed to reject report");
    }

    const reports = getStoredReports();
    const report = reports.find(r => r.id === id);
    
    if (!report) {
      throw new Error("Report not found");
    }

    report.status = "rejected";
    saveReports(reports);

    return report;
  },

  // Admin functions
  async getUsers(): Promise<User[]> {
    await delay();
    
    if (shouldError()) {
      throw new Error("Failed to load users");
    }

    // Получаем пользователей из auth fake API
    const FAKE_USERS_KEY = "sosmap_fake_users";
    try {
      const stored = localStorage.getItem(FAKE_USERS_KEY);
      if (stored) {
        const users = JSON.parse(stored);
        return users.map((u: any) => ({
          id: u.id,
          email: u.email,
          role: u.role,
          reputation: Math.floor(Math.random() * 100),
          isBlocked: false,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        }));
      }
    } catch {}

    // Возвращаем дефолтных пользователей
    return [
      {
        id: "fake_admin_1",
        email: "admin@test.com",
        role: "admin" as const,
        reputation: 100,
        isBlocked: false,
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "fake_user_1",
        email: "student1@test.com",
        role: "user" as const,
        reputation: 75,
        isBlocked: false,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  },

  async blockUser(userId: string): Promise<User> {
    await delay();
    
    if (shouldError()) {
      throw new Error("Failed to block user");
    }

    const users = await fakeApi.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      throw new Error("User not found");
    }

    user.isBlocked = true;
    // В реальном приложении сохраняли бы в БД
    return user;
  },

  async unblockUser(userId: string): Promise<User> {
    await delay();
    
    if (shouldError()) {
      throw new Error("Failed to unblock user");
    }

    const users = await fakeApi.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      throw new Error("User not found");
    }

    user.isBlocked = false;
    return user;
  },

  async getAnalytics(): Promise<Analytics> {
    await delay();
    
    if (shouldError()) {
      throw new Error("Failed to load analytics");
    }

    const reports = getStoredReports();
    const totalReports = reports.length;
    const pendingReports = reports.filter(r => r.status === "pending").length;
    const approvedReports = reports.filter(r => r.status === "approved").length;
    const rejectedReports = reports.filter(r => r.status === "rejected").length;

    // Группируем по зонам для highRiskZones
    const zoneMap = new Map<string, { lat: number; lng: number; count: number; totalSeverity: number }>();
    
    reports.forEach(r => {
      // Округляем координаты для группировки
      const zoneKey = `${Math.round(r.lat * 100) / 100}_${Math.round(r.lng * 100) / 100}`;
      const existing = zoneMap.get(zoneKey);
      
      if (existing) {
        existing.count++;
        existing.totalSeverity += r.severity;
      } else {
        zoneMap.set(zoneKey, {
          lat: r.lat,
          lng: r.lng,
          count: 1,
          totalSeverity: r.severity,
        });
      }
    });

    const highRiskZones = Array.from(zoneMap.values())
      .filter(zone => zone.count >= 2) // Минимум 2 инцидента в зоне
      .map(zone => ({
        lat: zone.lat,
        lng: zone.lng,
        count: zone.count,
        avgSeverity: zone.totalSeverity / zone.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Топ 5 зон

    return {
      totalReports,
      pendingReports,
      approvedReports,
      rejectedReports,
      highRiskZones,
    };
  },
};

// Инициализация с примерами данных
if (getStoredReports().length === 0) {
  const sampleReports: Report[] = [
    {
      id: "sample_1",
      type: "no_light",
      severity: 4,
      lat: 42.9,
      lng: 71.36,
      description: "Отсутствует освещение на участке дороги",
      status: "approved",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "sample_2",
      type: "dogs",
      severity: 3,
      lat: 42.91,
      lng: 71.37,
      description: "Бродячие собаки в районе",
      status: "approved",
      createdAt: new Date(Date.now() - 43200000).toISOString(),
    },
    {
      id: "sample_3",
      type: "ice",
      severity: 5,
      lat: 42.89,
      lng: 71.35,
      description: "Очень скользко, гололёд",
      status: "approved",
      createdAt: new Date(Date.now() - 21600000).toISOString(),
    },
  ];
  saveReports(sampleReports);
}

