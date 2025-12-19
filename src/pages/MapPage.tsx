import { useEffect, useMemo, useState, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Chip,
  List,
  ListItemButton,
  Divider,
  Card,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Backdrop,
  Collapse,
} from "@mui/material";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents, Circle } from "react-leaflet";
import L from "leaflet";
import { useQuery } from "@tanstack/react-query";
import { leafletFix } from "../components/LeafletFix";
import { listApprovedReports, Report, ReportType } from "../api/reports";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { useNotificationsStore } from "../store/notifications";
import { wsService } from "../api/websocket";
import FlashCard from "../components/FlashCard";
import DangerPulse from "../components/DangerPulse";
import FloatingSosButton from "../components/FloatingSosButton";
import LocationButton from "../components/LocationButton";
import StatsCard from "../components/StatsCard";
import ActivityChart from "../components/ActivityChart";
import OnboardingOverlay from "../components/OnboardingOverlay";
import {
  LocationOn,
  CheckCircle,
  Cancel,
  Warning,
  Report as ReportIcon,
  Close,
  Feedback,
  AccessTime,
  TrendingUp,
  Lightbulb,
  Pets,
  AcUnit,
  HelpOutline,
  Notifications,
  Info,
  Security,
  ExpandMore,
  Refresh,
} from "@mui/icons-material";
import { voteReport } from "../api/reports";
import { AnimatePresence } from "framer-motion";

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Компонент для создания анимированного маркера с учетом времени
function createAnimatedIcon(severity: number, createdAt: string) {
  const getColor = () => {
    if (severity >= 4) return "#f44336"; // Красный - опасность
    if (severity >= 3) return "#ff9800"; // Оранжевый - предупреждение
    return "#4caf50"; // Зеленый - все в порядке
  };

  // Вычисляем яркость на основе времени (новые инциденты ярче)
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const ageHours = (now - created) / (1000 * 60 * 60);
  const brightness = Math.max(0.6, 1 - ageHours / 48); // Затухание за 48 часов
  
  const color = getColor();
  const baseSize = 28;
  const size = baseSize + (severity * 2); // Размер зависит от severity
  const pulseSpeed = severity >= 4 ? "1.5s" : severity >= 3 ? "2s" : "3s"; // Быстрее для опасных

  return L.divIcon({
    className: "custom-animated-marker",
    html: `
      <div class="marker-container" style="
        position: relative;
        width: ${size + 20}px;
        height: ${size + 20}px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <div class="marker-pulse-ring" style="
          position: absolute;
          width: ${size + 8}px;
          height: ${size + 8}px;
          border-radius: 50%;
          border: 2px solid ${color};
          opacity: 0.6;
        "></div>
        <div class="marker-core" style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          position: relative;
          z-index: 1;
          opacity: ${brightness};
          filter: brightness(${brightness});
        "></div>
      </div>
    `,
    iconSize: [size + 20, size + 20],
    iconAnchor: [(size + 20) / 2, (size + 20) / 2],
  });
}


// Mock nearby incidents data
const mockIncidents = [
  { id: "1", type: "no_light" as ReportType, distance: 120, ttl: "истечёт через 18ч 30м", verified: true },
  { id: "2", type: "dogs" as ReportType, distance: 250, ttl: "истечёт через 12ч 15м", verified: true },
  { id: "3", type: "ice" as ReportType, distance: 380, ttl: "истечёт через 6ч 45м", verified: false },
  { id: "4", type: "other" as ReportType, distance: 450, ttl: "истечёт через 3ч 20м", verified: true },
  { id: "5", type: "no_light" as ReportType, distance: 520, ttl: "истечёт через 1ч 10м", verified: false },
  { id: "6", type: "dogs" as ReportType, distance: 680, ttl: "истечёт через 45м", verified: true },
];

// Live Feed Event Interface
interface LiveFeedEvent {
  id: string;
  type: ReportType;
  title: string;
  description: string;
  location: string;
  time: Date;
  severity: number;
  verified: boolean;
}

export default function MapPage() {
  const nav = useNavigate();
  const { token } = useAuthStore();
  const { setWsConnected } = useNotificationsStore();
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [filters, setFilters] = useState<ReportType[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeLayers, setActiveLayers] = useState<string[]>([]);
  const [liveFeedEvents, setLiveFeedEvents] = useState<LiveFeedEvent[]>([]);
  const [statsExpanded, setStatsExpanded] = useState(true);
  const [showMapHint, setShowMapHint] = useState(true);
  const [recommendationsExpanded, setRecommendationsExpanded] = useState(true);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => leafletFix(), []);

  // Проверка первого посещения для показа onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("sosmap_onboarding_seen");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  // Добавляем стили анимации
  useEffect(() => {
    if (!document.getElementById("marker-animations")) {
      const style = document.createElement("style");
      style.id = "marker-animations";
      style.textContent = `
        .custom-animated-marker .marker-container {
          transition: transform 0.3s ease;
        }
        .custom-animated-marker:hover .marker-container {
          transform: scale(1.3);
          z-index: 1000 !important;
        }
        .custom-animated-marker .marker-core {
          animation: markerPulse 2s ease-in-out infinite;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .custom-animated-marker:hover .marker-core {
          transform: scale(1.15);
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        }
        .custom-animated-marker .marker-pulse-ring {
          animation: ringPulse 2s ease-out infinite;
        }
        @keyframes markerPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes ringPulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Генерация Live Feed событий
  useEffect(() => {
    const eventTemplates: Omit<LiveFeedEvent, "id" | "time">[] = [
      { type: "no_light", title: "Отключение света", description: "Плановое отключение электроэнергии", location: "ул. Абая, 15", severity: 2, verified: true },
      { type: "dogs", title: "Агрессивные собаки", description: "Стая собак в районе парка", location: "Парк Победы", severity: 4, verified: true },
      { type: "ice", title: "Гололёд", description: "Скользкая дорога", location: "пр. Сатпаева", severity: 3, verified: false },
      { type: "other", title: "ДТП", description: "Авария на перекрёстке", location: "ул. Достык", severity: 5, verified: true },
    ];

    const interval = setInterval(() => {
      const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
      const newEvent: LiveFeedEvent = {
        ...template,
        id: `feed_${Date.now()}`,
        time: new Date(),
      };
      setLiveFeedEvents((prev) => [newEvent, ...prev].slice(0, 10));
      setLastUpdate(new Date());
    }, 8000 + Math.random() * 4000); // 8-12 секунд

    return () => clearInterval(interval);
  }, []);

  const { data: reports = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["reports", "approved"],
    queryFn: listApprovedReports,
  });

  // Connect WebSocket
  useEffect(() => {
    if (token) {
      wsService.connect();
      wsService.subscribe("sos_alert", () => {
        setLastUpdate(new Date());
        refetch();
      });
      setWsConnected(true);
    }
    return () => {
      wsService.disconnect();
      setWsConnected(false);
    };
  }, [token, setWsConnected, refetch]);

  const center = useMemo(() => userLocation || [42.9, 71.36] as [number, number], [userLocation]);

  const filteredReports = useMemo(() => {
    let filtered = reports;
    if (filters.length > 0) {
      filtered = filtered.filter(r => filters.includes(r.type));
    }
    if (userLocation) {
      filtered = filtered.map(r => ({
        ...r,
        distance: calculateDistance(userLocation.lat, userLocation.lng, r.lat, r.lng),
      })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    return filtered;
  }, [reports, filters, userLocation]);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleFilterToggle = (type: ReportType) => {
    setFilters(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      no_light: "Нет света",
      dogs: "Собаки",
      ice: "Гололёд",
      other: "Другое",
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: ReportType) => {
    const colors: Record<ReportType, string> = {
      no_light: "#ff9800",
      dogs: "#f44336",
      ice: "#2196f3",
      other: "#9e9e9e",
    };
    return colors[type] || "#9e9e9e";
  };

  const handleVote = async (incidentId: string, vote: "confirm" | "fake") => {
    if (!token) {
      nav("/login");
      return;
    }
    try {
      await voteReport(incidentId, vote);
      refetch();
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Vote error:", error);
    }
  };

  const handleQuickReport = () => {
    // Автоматически позиционируем карту на текущую локацию пользователя
    if (userLocation && mapRef.current) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 15);
    } else if (picked && mapRef.current) {
      mapRef.current.setView([picked.lat, picked.lng], 15);
    }

    // Переход на страницу создания отчета
    if (picked) {
      nav(`/report/new?lat=${picked.lat}&lng=${picked.lng}`);
    } else if (userLocation) {
      nav(`/report/new?lat=${userLocation.lat}&lng=${userLocation.lng}`);
    } else {
      nav("/report/new");
    }
  };

  const handleFeedbackSubmit = () => {
    // Здесь можно отправить feedback на сервер
    console.log("Feedback:", feedbackText);
    setFeedbackOpen(false);
    setFeedbackText("");
    alert("Спасибо за обратную связь!");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  const formatTimeAgo = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const seconds = Math.floor((new Date().getTime() - dateObj.getTime()) / 1000);
    if (seconds < 60) return "только что";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} мин назад`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ч назад`;
    const days = Math.floor(hours / 24);
    return `${days} дн. назад`;
  };

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    localStorage.setItem("sosmap_onboarding_seen", "true");
  };

  const handleRefreshMap = () => {
    refetch();
    setLastUpdate(new Date());
  };

  // Рекомендации по безопасности
  const safetyRecommendations = useMemo(() => {
    if (!userLocation) return null;
    
    const nearbyHighSeverity = filteredReports.filter(
      (r) => r.severity >= 4 && r.distance && r.distance < 500
    );
    
    const nearbyDogs = filteredReports.filter(
      (r) => r.type === "dogs" && r.distance && r.distance < 300
    );
    
    const nearbyNoLight = filteredReports.filter(
      (r) => r.type === "no_light" && r.distance && r.distance < 200
    );

    const recommendations: string[] = [];
    
    if (nearbyHighSeverity.length > 0) {
      recommendations.push(`⚠️ Внимание: ${nearbyHighSeverity.length} опасных инцидентов в радиусе 500м`);
    }
    
    if (nearbyDogs.length > 0) {
      recommendations.push(`🐕 Будьте осторожны: ${nearbyDogs.length} сообщений о собаках поблизости`);
    }
    
    if (nearbyNoLight.length > 0) {
      recommendations.push(`💡 В районе ${nearbyNoLight.length} участков без освещения`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push("✅ В вашем районе ситуация спокойная");
    }

    return recommendations;
  }, [userLocation, filteredReports]);


  // Статистика
  const stats = useMemo(() => {
    const typeCounts = filteredReports.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<ReportType, number>);

    const highSeverity = filteredReports.filter((r) => r.severity >= 4).length;
    const verifiedCount = filteredReports.filter((r) => r.status === "approved").length;
    const totalCount = filteredReports.length;

    // Данные для графика активности (последние 7 дней)
    const activityData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
        count: Math.floor(Math.random() * 10) + 1,
      };
    });

    return {
      total: totalCount,
      highSeverity,
      verified: verifiedCount,
      typeCounts,
      activityData,
      mostCommonType: Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "other",
    };
  }, [filteredReports]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", width: "100%", position: "relative" }}>
      {/* Statistics Panel */}
      <Collapse in={statsExpanded}>
        <Paper
          sx={{
            p: 2,
            borderRadius: 0,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Статистика инцидентов
            </Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <IconButton size="small" onClick={() => setStatsExpanded(false)}>
                <Close fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Всего инцидентов"
                value={stats.total}
                subtitle={`${stats.verified} подтверждено`}
                icon={<Warning />}
                color="#667eea"
                progress={stats.total > 0 ? (stats.verified / stats.total) * 100 : 0}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Высокая опасность"
                value={stats.highSeverity}
                subtitle="Уровень 4-5"
                icon={<Warning color="error" />}
                color="#f44336"
                progress={stats.total > 0 ? (stats.highSeverity / stats.total) * 100 : 0}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Популярный тип"
                value={getTypeLabel(stats.mostCommonType)}
                subtitle={`${stats.typeCounts[stats.mostCommonType as ReportType] || 0} случаев`}
                icon={
                  stats.mostCommonType === "no_light" ? <Lightbulb /> :
                  stats.mostCommonType === "dogs" ? <Pets /> :
                  stats.mostCommonType === "ice" ? <AcUnit /> : <HelpOutline />
                }
                color={getTypeColor(stats.mostCommonType as ReportType)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: "100%", p: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Активность (7 дней)
                </Typography>
                <ActivityChart data={stats.activityData} height={80} />
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {!statsExpanded && (
        <Button
          startIcon={<TrendingUp />}
          onClick={() => setStatsExpanded(true)}
          sx={{ position: "absolute", top: 8, left: 8, zIndex: 1000 }}
          size="small"
        >
          Показать статистику
        </Button>
      )}

      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Map - 72% */}
        <Box sx={{ width: "72%", position: "relative" }}>
          {/* Status Panel */}
          <Paper
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 1000,
              p: 1.5,
              borderRadius: 2,
              bgcolor: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AccessTime sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                Обновлено: {formatTime(lastUpdate)}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Typography variant="caption" color="text.secondary">
              Меток: {filteredReports.length}
            </Typography>
            <Divider orientation="vertical" flexItem />
            <Tooltip title="Обновить карту">
              <IconButton
                size="small"
                onClick={handleRefreshMap}
                sx={{ p: 0.5 }}
              >
                <Refresh sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Paper>

          {/* Layer Controls */}
          <Paper
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 1000,
              p: 1,
              borderRadius: 2,
              bgcolor: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            <ToggleButtonGroup
              orientation="vertical"
              value={activeLayers}
              onChange={(_, newLayers) => setActiveLayers(newLayers)}
              size="small"
            >
              <Tooltip title="Освещённость районов">
                <ToggleButton value="lighting" aria-label="lighting">
                  <Lightbulb fontSize="small" />
                </ToggleButton>
              </Tooltip>
              <Tooltip title="Опасные зоны">
                <ToggleButton value="danger" aria-label="danger">
                  <Warning fontSize="small" />
                </ToggleButton>
              </Tooltip>
              <Tooltip title="Маршруты">
                <ToggleButton value="routes" aria-label="routes">
                  <LocationOn fontSize="small" />
                </ToggleButton>
              </Tooltip>
            </ToggleButtonGroup>
          </Paper>


        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          ref={(map) => {
            if (map) mapRef.current = map;
          }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            errorTileUrl="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Crect width='256' height='256' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-family='Arial' font-size='14'%3EНет интернета%3C/text%3E%3C/svg%3E"
            maxNativeZoom={19}
            maxZoom={19}
          />

          <LocationButton onLocationFound={(lat: number, lng: number) => setUserLocation({ lat, lng })} />
          <ClickHandler onPick={(lat, lng) => setPicked({ lat, lng })} />

          {/* Lighting Layer */}
          {activeLayers.includes("lighting") && userLocation && (
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={500}
              pathOptions={{
                color: "#ffd700",
                fillColor: "#ffd700",
                fillOpacity: 0.1,
                weight: 2,
              }}
            />
          )}

          {/* Danger Zones Layer */}
          {activeLayers.includes("danger") && filteredReports
            .filter((r) => r.severity >= 4)
            .map((r) => (
              <Circle
                key={`danger_${r.id}`}
                center={[r.lat, r.lng]}
                radius={200}
                pathOptions={{
                  color: "#f44336",
                  fillColor: "#f44336",
                  fillOpacity: 0.15,
                  weight: 2,
                }}
              />
            ))}

          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>Ваше местоположение</Popup>
            </Marker>
          )}

          {!isLoading && !isError && filteredReports.map((r: Report & { distance?: number }) => {
            const icon = createAnimatedIcon(r.severity, r.createdAt);
            return (
              <Marker key={r.id} position={[r.lat, r.lng]} icon={icon}>
                <Popup>
                  <FlashCard triggerKey={r.id}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 250 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <DangerPulse severity={r.severity} size={32} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {getTypeLabel(r.type)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Уровень: {r.severity}/5
                      </Typography>
                      {r.description && (
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {r.description}
                        </Typography>
                      )}
                      {r.distance && (
                        <Typography variant="caption" color="text.secondary">
                          Расстояние: {Math.round(r.distance)} м
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {formatTimeAgo(r.createdAt)} • {new Date(r.createdAt).toLocaleString("ru-RU")}
                      </Typography>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => nav(`/incidents/${r.id}`)}
                        sx={{ mt: 1 }}
                        fullWidth
                      >
                        Подробнее
                      </Button>
                    </Box>
                  </FlashCard>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Map Hint */}
        {showMapHint && (
          <Paper
            sx={{
              position: "absolute",
              bottom: 100,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,
              p: 1.5,
              borderRadius: 2,
              bgcolor: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              display: "flex",
              alignItems: "center",
              gap: 1,
              maxWidth: "90%",
            }}
          >
            <Info sx={{ fontSize: 18, color: "primary.main" }} />
            <Typography variant="caption" color="text.secondary">
              Нажмите на метку, чтобы увидеть подробности инцидента
            </Typography>
            <IconButton
              size="small"
              onClick={() => setShowMapHint(false)}
              sx={{ p: 0.5, ml: 1 }}
            >
              <Close sx={{ fontSize: 16 }} />
            </IconButton>
          </Paper>
        )}

        {/* Quick Report Button */}
        <Button
          variant="contained"
          startIcon={<ReportIcon />}
          onClick={handleQuickReport}
          sx={{
            position: "absolute",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            borderRadius: 3,
            px: 3,
            py: 1.5,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            textTransform: "none",
          }}
        >
          Создать отчет
        </Button>

        {/* Feedback Button */}
        <IconButton
          onClick={() => setFeedbackOpen(true)}
          sx={{
            position: "absolute",
            bottom: 24,
            right: 24,
            zIndex: 1000,
            bgcolor: "primary.main",
            color: "white",
            "&:hover": { bgcolor: "primary.dark" },
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          <Feedback />
        </IconButton>

        <FloatingSosButton position={picked || userLocation} />
        </Box>
      </Box>

      {/* Sidebar - 28% */}
      <Paper
        sx={{
          width: "28%",
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        {/* Filters */}
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Фильтры
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {(["no_light", "dogs", "ice", "other"] as ReportType[]).map((type) => (
              <Chip
                key={type}
                label={getTypeLabel(type)}
                onClick={() => handleFilterToggle(type)}
                color={filters.includes(type) ? "primary" : "default"}
                sx={{
                  bgcolor: filters.includes(type) ? getTypeColor(type) : undefined,
                  color: filters.includes(type) ? "white" : undefined,
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Legend with Color Indication */}
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Легенда
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 2 }}>
            {(["no_light", "dogs", "ice", "other"] as ReportType[]).map((type) => (
              <Box key={type} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: getTypeColor(type) }} />
                <Typography variant="caption">{getTypeLabel(type)}</Typography>
              </Box>
            ))}
          </Box>
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
            Уровень угрозы:
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#f44336" }} />
              <Typography variant="caption">Красный - опасность (4-5)</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#ff9800" }} />
              <Typography variant="caption">Оранжевый - предупреждение (3)</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#4caf50" }} />
              <Typography variant="caption">Зеленый - норма (1-2)</Typography>
            </Box>
          </Box>
        </Box>

        {/* Live Feed Section */}
        <Box sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
          <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Notifications color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Live Feed
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              События в реальном времени
            </Typography>
          </Box>
          <Box sx={{ maxHeight: 200, overflowY: "auto" }}>
            {liveFeedEvents.length === 0 ? (
              <Box sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Нет новых событий
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {liveFeedEvents.map((event, index) => (
                  <Box key={event.id}>
                    <ListItemButton
                      sx={{
                        flexDirection: "column",
                        alignItems: "flex-start",
                        py: 1.5,
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%", mb: 0.5 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: event.severity >= 4 ? "#f44336" : event.severity >= 3 ? "#ff9800" : "#4caf50",
                            animation: "pulse 2s infinite",
                          }}
                        />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                          {event.title}
                        </Typography>
                        <Chip
                          label={event.verified ? "verified" : "guest"}
                          size="small"
                          color={event.verified ? "success" : "warning"}
                          sx={{ height: 18, fontSize: "0.6rem" }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                        {event.location} • {formatTimeAgo(event.time)}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
                        {event.description}
                      </Typography>
                    </ListItemButton>
                    {index < liveFeedEvents.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}
          </Box>
        </Box>

        {/* Nearby Incidents List */}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Nearby incidents
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {mockIncidents.length} найдено
            </Typography>
          </Box>

          <List sx={{ p: 0 }}>
            {mockIncidents.map((incident, index) => (
              <Box key={incident.id}>
                <ListItemButton
                  sx={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    py: 1.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%", mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                      {getTypeLabel(incident.type)}
                    </Typography>
                    <Chip
                      label={incident.verified ? "verified" : "guest"}
                      size="small"
                      color={incident.verified ? "success" : "warning"}
                      sx={{ height: 20, fontSize: "0.65rem" }}
                    />
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%", mb: 0.5 }}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      {incident.distance} м
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                    {incident.ttl}
                  </Typography>
                  {token && (
                    <Box sx={{ display: "flex", gap: 1, mt: 1, width: "100%" }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVote(incident.id, "confirm");
                        }}
                        sx={{ flex: 1, textTransform: "none" }}
                      >
                        Подтвердить
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVote(incident.id, "fake");
                        }}
                        sx={{ flex: 1, textTransform: "none" }}
                      >
                        Фейк
                      </Button>
                    </Box>
                  )}
                </ListItemButton>
                {index < mockIncidents.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </Box>
      </Paper>

      {/* Safety Recommendations Panel */}
      {safetyRecommendations && safetyRecommendations.length > 0 && (
        <Paper
          sx={{
            position: "absolute",
            bottom: 16,
            right: 16,
            zIndex: 1000,
            width: 320,
            maxHeight: recommendationsExpanded ? 300 : 50,
            overflow: "hidden",
            transition: "max-height 0.3s ease",
            bgcolor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <Box
            sx={{
              p: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              borderBottom: recommendationsExpanded ? "1px solid" : "none",
              borderColor: "divider",
            }}
            onClick={() => setRecommendationsExpanded(!recommendationsExpanded)}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Security sx={{ fontSize: 18, color: "warning.main" }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Рекомендации
              </Typography>
            </Box>
            <IconButton size="small" sx={{ p: 0.5 }}>
              <ExpandMore
                sx={{
                  transform: recommendationsExpanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s",
                }}
              />
            </IconButton>
          </Box>
          {recommendationsExpanded && (
            <Box sx={{ p: 1.5, pt: 1 }}>
              {safetyRecommendations.map((rec, index) => (
                <Typography
                  key={index}
                  variant="body2"
                  sx={{
                    mb: 1,
                    fontSize: "0.875rem",
                    lineHeight: 1.5,
                  }}
                >
                  {rec}
                </Typography>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* Feedback Dialog */}
      <Dialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Обратная связь</Typography>
            <IconButton onClick={() => setFeedbackOpen(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Как можно улучшить безопасность в этом районе?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Ваши предложения..."
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackOpen(false)}>Отмена</Button>
          <Button onClick={handleFeedbackSubmit} variant="contained" disabled={!feedbackText.trim()}>
            Отправить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Onboarding Overlay */}
      <AnimatePresence>
        {showOnboarding && (
          <Backdrop open sx={{ zIndex: 1400 }}>
            <OnboardingOverlay onClose={handleOnboardingClose} />
          </Backdrop>
        )}
      </AnimatePresence>

      {/* Help Tooltip Button */}
      <Box
        sx={{
          position: "absolute",
          bottom: 80,
          right: 24,
          zIndex: 1000,
        }}
      >
        <Tooltip title="Подсказки по использованию карты">
          <IconButton
            onClick={() => setShowOnboarding(true)}
            sx={{
              bgcolor: "info.main",
              color: "white",
              "&:hover": { bgcolor: "info.dark" },
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            <Info />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
