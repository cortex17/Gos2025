import { useEffect, useMemo, useState } from "react";
import { Box, Button, Typography, Container, Paper, Tooltip, Badge, IconButton, Fade } from "@mui/material";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useQuery } from "@tanstack/react-query";
import { leafletFix } from "../components/LeafletFix";
import { listApprovedReports, Report, ReportType } from "../api/reports";
import { useNavigate } from "react-router-dom";
import { panic } from "../api/panic";
import SosButton from "../components/SosButton";
import FlashCard from "../components/FlashCard";
import MapHUD from "../components/MapHUD";
import DangerPulse from "../components/DangerPulse";
import FloatingSosButton from "../components/FloatingSosButton";
import ProximityAlert from "../components/ProximityAlert";
import LocationButton from "../components/LocationButton";
import RadiusFilter from "../components/RadiusFilter";
import StatsCard from "../components/StatsCard";
import { motion } from "framer-motion";
import {
  Warning,
  Report as ReportIcon,
  AccessTime,
  Lightbulb,
  Pets,
  AcUnit,
  HelpOutline,
  Notifications,
  Info,
  DarkMode,
  LightMode,
} from "@mui/icons-material";

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Компонент для создания анимированного маркера с иконками
function createAnimatedIcon(severity: number, createdAt: string, type: ReportType) {
  const getColor = () => {
    if (severity >= 4) return "#f44336";
    if (severity >= 3) return "#ff9800";
    return "#4caf50";
  };

  const getIcon = () => {
    switch (type) {
      case "no_light": return "💡";
      case "dogs": return "🐕";
      case "ice": return "🧊";
      default: return "⚠️";
    }
  };

  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const ageHours = (now - created) / (1000 * 60 * 60);
  const brightness = Math.max(0.6, 1 - ageHours / 48);
  
  const color = getColor();
  const icon = getIcon();
  const baseSize = 28;
  const size = baseSize + (severity * 2);

  return L.divIcon({
    className: "custom-animated-marker-dashboard",
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
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${size * 0.4}px;
        ">${icon}</div>
      </div>
    `,
    iconSize: [size + 20, size + 20],
    iconAnchor: [(size + 20) / 2, (size + 20) / 2],
  });
}

export default function DashboardMapPage() {
  const nav = useNavigate();
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [filters, setFilters] = useState<ReportType[]>([]);
  const [nightMode, setNightMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dashboardNightMode");
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(1000);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [newIncidentsCount, setNewIncidentsCount] = useState(0);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => leafletFix(), []);

  // Сохранение настройки ночного режима
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("dashboardNightMode", JSON.stringify(nightMode));
    }
  }, [nightMode]);

  // Добавляем стили анимации для меток
  useEffect(() => {
    if (!document.getElementById("marker-animations-dashboard")) {
      const style = document.createElement("style");
      style.id = "marker-animations-dashboard";
      style.textContent = `
        .custom-animated-marker-dashboard {
          animation: markerAppear 0.6s ease-out;
        }
        .custom-animated-marker-dashboard .marker-container {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .custom-animated-marker-dashboard:hover .marker-container {
          transform: scale(1.5) !important;
          z-index: 1000 !important;
        }
        .custom-animated-marker-dashboard .marker-core {
          animation: markerPulse 2s ease-in-out infinite;
          cursor: pointer;
          transition: transform 0.3s, box-shadow 0.3s, filter 0.3s;
        }
        .custom-animated-marker-dashboard:hover .marker-core {
          transform: scale(1.25);
          box-shadow: 0 8px 24px rgba(0,0,0,0.6);
          filter: brightness(1.3) drop-shadow(0 0 8px currentColor);
        }
        .custom-animated-marker-dashboard .marker-pulse-ring {
          animation: ringPulse 2s ease-out infinite;
        }
        @keyframes markerAppear {
          0% { 
            opacity: 0;
            transform: scale(0) rotate(-180deg);
          }
          60% {
            transform: scale(1.3) rotate(10deg);
          }
          100% { 
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        @keyframes markerPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes ringPulse {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Имитация новых инцидентов
  useEffect(() => {
    const interval = setInterval(() => {
      setNewIncidentsCount((prev) => prev + 1);
      setLastUpdate(new Date());
    }, 15000); // Каждые 15 секунд
    return () => clearInterval(interval);
  }, []);

  const { data: reports = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["reports", "approved"],
    queryFn: listApprovedReports,
  });

  // Автоматическое обновление каждые 30 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  const center = useMemo(() => [42.9, 71.36] as [number, number], []); // change to your city

  // Функция расчета расстояния должна быть объявлена ДО использования
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // Радиус Земли в метрах
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

  const filteredReports = useMemo(() => {
    let filtered = reports;
    
    // Фильтр по типу
    if (filters.length > 0) {
      filtered = filtered.filter(r => filters.includes(r.type));
    }
    
    // Фильтр по радиусу от пользователя
    if (userLocation) {
      filtered = filtered.filter(r => {
        const distance = calculateDistance(userLocation.lat, userLocation.lng, r.lat, r.lng);
        return distance <= radius;
      });
    }
    
    return filtered;
  }, [reports, filters, userLocation, radius]);

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

  // Статистика
  const stats = useMemo(() => {
    const typeCounts = filteredReports.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<ReportType, number>);

    const highSeverity = filteredReports.filter((r) => r.severity >= 4).length;
    const verifiedCount = filteredReports.filter((r) => r.status === "approved").length;
    const totalCount = filteredReports.length;

    return {
      total: totalCount,
      highSeverity,
      verified: verifiedCount,
      typeCounts,
      mostCommonType: Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "other",
    };
  }, [filteredReports]);

  const tileUrl = nightMode 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  async function onPanic() {
    if (!picked) return;
    await panic({ lat: picked.lat, lng: picked.lng });
    alert("SOS sent (MVP)");
  }


  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Hero Section */}
      <Box
        sx={{
          width: "100%",
          pt: { xs: 6, md: 10 },
          pb: { xs: 6, md: 10 },
          background: "linear-gradient(135deg, #2196f3 0%, #1976d2 100%)",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 800,
                mb: 2,
                fontSize: { xs: "2rem", md: "3rem" },
              }}
            >
              Интерактивная карта безопасности
            </Typography>
            <Typography
              variant="h6"
              sx={{
                opacity: 0.9,
                mb: 4,
                maxWidth: 600,
                fontWeight: 400,
              }}
            >
              Отслеживайте инциденты в реальном времени, создавайте отчеты и получайте помощь в критических ситуациях
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
              <Tooltip title="Нажмите и удерживайте для отправки SOS сигнала" arrow>
                <Box>
              <SosButton disabled={!picked} onClick={onPanic} />
                </Box>
              </Tooltip>
              <Tooltip title="Создать отчет об инциденте в выбранной точке" arrow>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
              <Button
                variant="contained"
                disabled={!picked}
                onClick={() => nav(`/report/new?lat=${picked!.lat}&lng=${picked!.lng}`)}
                    startIcon={<ReportIcon />}
                sx={{
                      bgcolor: "rgba(255, 255, 255, 0.25)",
                  color: "white",
                      backdropFilter: "blur(10px)",
                      "&:hover": { 
                        bgcolor: "rgba(255, 255, 255, 0.35)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                      },
                      "&:disabled": {
                        bgcolor: "rgba(255, 255, 255, 0.1)",
                        color: "rgba(255, 255, 255, 0.5)",
                      },
                  textTransform: "none",
                  px: 3,
                      py: 1.5,
                      transition: "all 0.3s ease",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                Создать отчет
              </Button>
                </motion.div>
              </Tooltip>
            </Box>
            {picked && (
              <Typography variant="body2" sx={{ mt: 2, opacity: 0.8 }}>
                Выбрано: {picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}
              </Typography>
            )}
          </Box>
        </Container>
      </Box>

      {/* Statistics Panel */}
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
          <StatsCard
            title="Активных инцидентов"
            value={stats.total}
            subtitle={`${stats.verified} подтверждено`}
            icon={<Warning />}
            color="#2196f3"
            progress={stats.total > 0 ? (stats.verified / stats.total) * 100 : 0}
          />
          <StatsCard
            title="Высокая опасность"
            value={stats.highSeverity}
            subtitle="Уровень 4-5"
            icon={<Warning color="error" />}
            color="#f44336"
            progress={stats.total > 0 ? (stats.highSeverity / stats.total) * 100 : 0}
          />
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
          <StatsCard
            title="Обновлено"
            value={lastUpdate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            subtitle={newIncidentsCount > 0 ? `+${newIncidentsCount} новых` : "Актуально"}
            icon={<AccessTime />}
            color="#4caf50"
          />
        </Box>
      </Container>

      {/* Map Section */}
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
        <Box sx={{ height: { xs: 400, md: 600 }, borderRadius: 3, overflow: "hidden", position: "relative", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution={nightMode ? '&copy; CARTO' : '&copy; OpenStreetMap contributors'}
            url={tileUrl}
            errorTileUrl="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Crect width='256' height='256' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-family='Arial' font-size='14'%3EНет интернета%3C/text%3E%3C/svg%3E"
            maxNativeZoom={19}
            maxZoom={19}
          />
          <LocationButton onLocationFound={(lat: number, lng: number) => setUserLocation({ lat, lng })} />
          <ClickHandler onPick={(lat, lng) => setPicked({ lat, lng })} />

          {!isLoading && !isError && filteredReports.map((r: Report) => {
            const icon = createAnimatedIcon(r.severity, r.createdAt, r.type);
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
                      Уровень опасности: {r.severity}/5
                    </Typography>
                    {r.description && (
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {r.description}
                      </Typography>
                    )}
                      <Typography variant="caption" color="text.secondary">
                        {formatTimeAgo(r.createdAt)} • {new Date(r.createdAt).toLocaleString("ru-RU")}
                      </Typography>
                    <Button 
                      size="small" 
                      variant="contained" 
                      onClick={() => nav(`/report/${r.id}`)}
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
        
        {/* Status Panel */}
        <Paper
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
            zIndex: 1000,
            p: 1.5,
            borderRadius: 2,
            bgcolor: nightMode ? "rgba(25, 25, 35, 0.9)" : "rgba(255, 255, 255, 0.95)",
            color: nightMode ? "#e0e0e0" : "text.primary",
            backdropFilter: "blur(10px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            gap: 2,
            border: nightMode ? "1px solid rgba(255, 215, 0, 0.2)" : "none",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AccessTime sx={{ fontSize: 16, color: nightMode ? "#ffd700" : "text.secondary" }} />
            <Typography variant="caption" sx={{ color: nightMode ? "#e0e0e0" : "text.secondary" }}>
              Обновлено: {lastUpdate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            </Typography>
          </Box>
          <Box sx={{ width: 1, height: 20, bgcolor: nightMode ? "rgba(255, 215, 0, 0.3)" : "divider" }} />
          <Typography variant="caption" sx={{ color: nightMode ? "#e0e0e0" : "text.secondary" }}>
            Меток: {filteredReports.length}
          </Typography>
        </Paper>

        {/* Night Mode Toggle Button */}
        <Tooltip title={nightMode ? "Переключить на дневную карту" : "Переключить на ночную карту"} arrow>
          <IconButton
            onClick={() => setNightMode(!nightMode)}
            sx={{
              position: "absolute",
              top: 16,
              right: newIncidentsCount > 0 ? 80 : 16,
              zIndex: 1000,
              bgcolor: nightMode ? "rgba(25, 25, 35, 0.9)" : "rgba(255, 255, 255, 0.95)",
              color: nightMode ? "#ffd700" : "text.primary",
              backdropFilter: "blur(10px)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              "&:hover": {
                bgcolor: nightMode ? "rgba(25, 25, 35, 1)" : "rgba(255, 255, 255, 1)",
                transform: "scale(1.1) rotate(15deg)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
              },
              transition: "all 0.3s ease",
            }}
          >
            {nightMode ? <LightMode /> : <DarkMode />}
          </IconButton>
        </Tooltip>

        {/* Notification Badge */}
        {newIncidentsCount > 0 && (
          <Tooltip title={`${newIncidentsCount} новых инцидентов`} arrow>
            <IconButton
              onClick={() => {
                setNewIncidentsCount(0);
                refetch();
              }}
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                zIndex: 1000,
                bgcolor: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 1)",
                  transform: "scale(1.1)",
                },
                transition: "all 0.3s ease",
              }}
            >
              <Badge
                badgeContent={newIncidentsCount}
                color="error"
                sx={{
                  "& .MuiBadge-badge": {
                    animation: "pulse 2s infinite",
                  },
                }}
              >
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>
        )}
        
        <MapHUD
          incidentCount={filteredReports.length}
          filters={filters}
          onFilterToggle={handleFilterToggle}
          nightMode={nightMode}
          onNightModeToggle={() => setNightMode(!nightMode)}
        />
        </Box>

        {/* Hint with Animation */}
        {showHint && (
          <Fade in={showHint}>
            <Paper
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: "info.light",
                color: "info.contrastText",
                display: "flex",
                alignItems: "center",
                gap: 1,
                position: "relative",
              }}
            >
              <Info sx={{ fontSize: 20 }} />
              <Typography variant="body2" sx={{ flex: 1 }}>
                Кликните на карту, чтобы выбрать местоположение и создать отчет. Наведите курсор на метку для подробностей.
          </Typography>
              <IconButton
                size="small"
                onClick={() => setShowHint(false)}
                sx={{ color: "inherit" }}
              >
                <Box component="span" sx={{ fontSize: 18 }}>×</Box>
              </IconButton>
            </Paper>
          </Fade>
        )}
      </Container>

      <FloatingSosButton position={picked} />
      <ProximityAlert userLocation={picked || userLocation} reports={filteredReports} />
      {userLocation && (
        <RadiusFilter
          userLocation={userLocation}
          radius={radius}
          onRadiusChange={setRadius}
        />
      )}
    </Box>
  );
}
