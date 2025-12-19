import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Container,
  Grid,
  Button,
  Backdrop,
  IconButton,
  Chip,
  Stack,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useNotificationsStore } from "../store/notifications";
import {
  LocationOn,
  Warning,
  Security,
  LocalFireDepartment,
  Map as MapIcon,
  RadioButtonChecked,
  RadioButtonUnchecked,
  Close,
  TrendingUp,
  TrendingDown,
  LocationSearching,
} from "@mui/icons-material";
import Header from "../components/Header";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import { leafletFix } from "../components/LeafletFix";

type FeedEventType = "lighting" | "dog" | "crime" | "car_crash" | "sos" | "ice";
type FeedEventLevel = "verified" | "guest";

interface FeedEvent {
  id: string;
  type: FeedEventType;
  title: string;
  timeAgo: string;
  timestamp: Date;
  level: FeedEventLevel;
}

interface NearbyIncident {
  id: string;
  type: FeedEventType;
  distance: number;
  ttl: string;
  level: FeedEventLevel;
  lat: number;
  lng: number;
}

// Mock данные для Nearby List
const mockNearby: NearbyIncident[] = [
  { id: "n1", type: "lighting", distance: 120, ttl: "18ч 30м", level: "verified", lat: 43.2225, lng: 76.8515 },
  { id: "n2", type: "dog", distance: 250, ttl: "12ч 15м", level: "verified", lat: 43.2230, lng: 76.8520 },
  { id: "n3", type: "crime", distance: 380, ttl: "6ч 45м", level: "guest", lat: 43.2235, lng: 76.8525 },
  { id: "n4", type: "car_crash", distance: 450, ttl: "3ч 20м", level: "verified", lat: 43.2240, lng: 76.8530 },
  { id: "n5", type: "lighting", distance: 520, ttl: "1ч 10м", level: "guest", lat: 43.2245, lng: 76.8535 },
  { id: "n6", type: "sos", distance: 680, ttl: "45м", level: "verified", lat: 43.2250, lng: 76.8540 },
];

// Mock данные для Live Feed
const initialMockFeed: FeedEvent[] = [
  { id: "f1", type: "lighting", title: "Отсутствие освещения", timeAgo: "2 мин назад", timestamp: new Date(Date.now() - 120000), level: "verified" },
  { id: "f2", type: "dog", title: "Стая бездомных собак", timeAgo: "5 мин назад", timestamp: new Date(Date.now() - 300000), level: "verified" },
  { id: "f3", type: "crime", title: "Подозрительная активность", timeAgo: "12 мин назад", timestamp: new Date(Date.now() - 720000), level: "guest" },
  { id: "f4", type: "car_crash", title: "ДТП на перекрестке", timeAgo: "18 мин назад", timestamp: new Date(Date.now() - 1080000), level: "verified" },
  { id: "f5", type: "sos", title: "🚨 SOS сигнал", timeAgo: "25 мин назад", timestamp: new Date(Date.now() - 1500000), level: "verified" },
  { id: "f6", type: "ice", title: "Скользкая дорога", timeAgo: "32 мин назад", timestamp: new Date(Date.now() - 1920000), level: "verified" },
  { id: "f7", type: "lighting", title: "Не работает фонарь", timeAgo: "45 мин назад", timestamp: new Date(Date.now() - 2700000), level: "guest" },
  { id: "f8", type: "dog", title: "Агрессивные собаки", timeAgo: "1 час назад", timestamp: new Date(Date.now() - 3600000), level: "verified" },
];

const newEventTemplates: Array<{ type: FeedEventType; title: string; level: FeedEventLevel }> = [
  { type: "lighting", title: "Отсутствие освещения", level: "verified" },
  { type: "dog", title: "Стая бездомных собак", level: "verified" },
  { type: "crime", title: "Подозрительная активность", level: "guest" },
  { type: "car_crash", title: "ДТП на дороге", level: "verified" },
  { type: "sos", title: "🚨 SOS сигнал", level: "verified" },
  { type: "ice", title: "Обледенение", level: "verified" },
];

function getTypeIcon(type: FeedEventType) {
  switch (type) {
    case "sos":
      return <Warning color="error" />;
    case "lighting":
      return <LocationOn color="warning" />;
    case "dog":
      return <Warning color="warning" />;
    case "crime":
      return <Security color="error" />;
    case "car_crash":
      return <LocalFireDepartment color="error" />;
    case "ice":
      return <LocationOn color="info" />;
  }
}

function getTypeLabel(type: FeedEventType): string {
  const labels: Record<FeedEventType, string> = {
    lighting: "Освещение",
    dog: "Собаки",
    crime: "Преступление",
    car_crash: "ДТП",
    sos: "SOS",
    ice: "Гололед",
  };
  return labels[type] || type;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "только что";
  if (diffMins < 60) return `${diffMins} мин назад`;
  if (diffHours < 24) return `${diffHours} час назад`;
  return `${Math.floor(diffHours / 24)} дн. назад`;
}

export default function PulsePage() {
  const nav = useNavigate();
  const { wsConnected } = useNotificationsStore();
  const [geoEnabled, setGeoEnabled] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>(initialMockFeed);
  const [realtimeCounter, setRealtimeCounter] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => leafletFix(), []);

  // Проверка геолокации
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.permissions?.query({ name: "geolocation" as PermissionName }).then((result) => {
        setGeoEnabled(result.state === "granted");
        if (result.state === "granted") {
          navigator.geolocation.getCurrentPosition((pos) => {
            setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          });
        }
      }).catch(() => {
        setGeoEnabled(false);
      });
    }
  }, []);

  // Имитация realtime добавления событий
  useEffect(() => {
    if (realtimeCounter >= 10) return; // Останавливаем после 10 добавлений

    const interval = setInterval(() => {
      const template = newEventTemplates[Math.floor(Math.random() * newEventTemplates.length)];
      const newEvent: FeedEvent = {
        id: `feed_${Date.now()}`,
        type: template.type,
        title: template.title,
        timeAgo: "только что",
        timestamp: new Date(),
        level: template.level,
      };
      setFeedEvents((prev) => [newEvent, ...prev].slice(0, 20));
      setRealtimeCounter((prev) => prev + 1);
    }, 10000 + Math.random() * 2000); // 10-12 секунд

    return () => clearInterval(interval);
  }, [realtimeCounter]);

  // Обновление timeAgo каждую минуту
  useEffect(() => {
    const interval = setInterval(() => {
      setFeedEvents((prev) =>
        prev.map((e) => ({
          ...e,
          timeAgo: formatTimeAgo(e.timestamp),
        }))
      );
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Check if onboarding needed
  useEffect(() => {
    const onboarded = localStorage.getItem("sosmap_onboarded");
    if (onboarded !== "1") {
      setShowOnboarding(true);
    }
  }, []);

  // Request geolocation
  const requestGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoEnabled(true);
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          alert("Геолокация не разрешена");
        }
      );
    } else {
      alert("Геолокация не поддерживается");
    }
  };

  // Статистика с трендами
  const stats = useMemo(() => {
    const incidents = feedEvents.filter((e) => e.type !== "sos").length;
    const sosCount = feedEvents.filter((e) => e.type === "sos").length;
    const topType = feedEvents.reduce((acc, e) => {
      if (e.type !== "sos") {
        acc[e.type] = (acc[e.type] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    const topTypeKey = Object.entries(topType).sort((a, b) => b[1] - a[1])[0]?.[0] || "lighting";

    return {
      active: incidents + sosCount,
      activeTrend: +2,
      sos24h: sosCount,
      sosTrend: +1,
      topType: topTypeKey as FeedEventType,
    };
  }, [feedEvents]);

  // Подсчет инцидентов в радиусе
  const nearbyStats = useMemo(() => {
    if (!geoEnabled) return { incidents: 0, accidents: 0 };
    const incidents = mockNearby.filter((n) => n.type !== "car_crash" && n.type !== "sos").length;
    const accidents = mockNearby.filter((n) => n.type === "car_crash").length;
    return { incidents, accidents };
  }, [geoEnabled]);

  const handleOnboardingNext = () => {
    if (onboardingStep < 2) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      localStorage.setItem("sosmap_onboarded", "1");
      setShowOnboarding(false);
    }
  };

  const handleOnboardingSkip = () => {
    localStorage.setItem("sosmap_onboarded", "1");
    setShowOnboarding(false);
  };

  const handleOpenMap = (id: string, lat?: number, lng?: number) => {
    if (lat && lng) {
      nav(`/map?focus=${id}&lat=${lat}&lng=${lng}`);
    } else {
      nav(`/map?focus=${id}`);
    }
  };

  const center = userLocation || [43.2220, 76.8512] as [number, number];

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "background.default", display: "flex", flexDirection: "column" }}>
      <Header showAuthButtons={true} />
      
      {/* Индикатор LIVE/OFF для Pulse */}
      <Box 
        sx={{ 
          position: "fixed", 
          top: { xs: 80, sm: 90 }, 
          right: 16, 
          zIndex: 999, // Ниже хедера, но выше контента
          display: "flex",
          alignItems: "center",
          gap: 1,
          bgcolor: "background.paper",
          px: 2,
          py: 1,
          borderRadius: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        {wsConnected ? (
          <RadioButtonChecked sx={{ color: "#4caf50", fontSize: 16, animation: "pulse 2s infinite" }} />
        ) : (
          <RadioButtonUnchecked sx={{ color: "#f44336", fontSize: 16 }} />
        )}
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 700, 
            fontSize: { xs: "0.7rem", sm: "0.875rem" },
          }}
        >
          {wsConnected ? "LIVE" : "OFF"}
        </Typography>
      </Box>

      <Container 
        maxWidth="xl" 
        sx={{ 
          py: { xs: 3, md: 4 },
          pt: { xs: "90px", sm: "100px" }, // Отступ сверху, чтобы контент не перекрывался хедером
        }}
      >
        {/* Situation Now Banner */}
        {geoEnabled ? (
          <Alert
            severity="info"
            icon={<LocationOn />}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              В радиусе 500м: {nearbyStats.incidents} инцидентов, {nearbyStats.accidents} ДТП
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Рекомендуем маршрут через освещённые улицы
            </Typography>
          </Alert>
        ) : (
          <Alert
            severity="warning"
            icon={<LocationSearching />}
            action={
              <Button size="small" onClick={requestGeolocation}>
                Разрешить
              </Button>
            }
            sx={{ mb: 3, borderRadius: 2 }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Включите геолокацию → покажем опасности рядом
            </Typography>
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* KPI Cards with Trends */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Security sx={{ fontSize: 40, color: "primary.main" }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.active}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                      {stats.activeTrend >= 0 ? (
                        <TrendingUp sx={{ fontSize: 16, color: "success.main" }} />
                      ) : (
                        <TrendingDown sx={{ fontSize: 16, color: "error.main" }} />
                      )}
                      <Typography variant="caption" color={stats.activeTrend >= 0 ? "success.main" : "error.main"}>
                        {stats.activeTrend >= 0 ? "+" : ""}{stats.activeTrend} за 24ч
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Active incidents
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <LocalFireDepartment sx={{ fontSize: 40, color: "error.main" }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.sos24h}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                      {stats.sosTrend >= 0 ? (
                        <TrendingUp sx={{ fontSize: 16, color: "success.main" }} />
                      ) : (
                        <TrendingDown sx={{ fontSize: 16, color: "error.main" }} />
                      )}
                      <Typography variant="caption" color={stats.sosTrend >= 0 ? "success.main" : "error.main"}>
                        {stats.sosTrend >= 0 ? "+" : ""}{stats.sosTrend} за 24ч
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      SOS 24h
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Warning sx={{ fontSize: 40, color: "warning.main" }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {getTypeLabel(stats.topType)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Top type
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Hot Zones */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Опасные зоны за 24ч
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip
                    label="Район Абая"
                    color="error"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                  <Chip
                    label="Район Сатпаева"
                    color="warning"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                  <Chip
                    label="Район Достык"
                    color="warning"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Top type
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {getTypeLabel(stats.topType)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      (42% от всех)
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Live Feed - 2 Columns */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Nearby Threats
                </Typography>
                <Grid container spacing={2}>
                  {/* Left: MiniMapPreview */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ height: 260, borderRadius: 2, overflow: "hidden", border: 1, borderColor: "divider" }}>
                      <MapContainer
                        center={center}
                        zoom={13}
                        style={{ height: "100%", width: "100%" }}
                        zoomControl={false}
                        attributionControl={false}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          errorTileUrl="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Crect width='256' height='256' fill='%23f0f0f0'/%3E%3C/svg%3E"
                        />
                        {userLocation && (
                          <Circle
                            center={[userLocation.lat, userLocation.lng]}
                            radius={500}
                            pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.1 }}
                          />
                        )}
                        {mockNearby.slice(0, 6).map((incident, idx) => (
                          <Marker
                            key={incident.id}
                            position={[incident.lat, incident.lng]}
                          >
                            {idx < 2 && (
                              <motion.div
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                style={{ position: "absolute", top: -10, left: -10 }}
                              >
                                <Box
                                  sx={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: "50%",
                                    bgcolor: incident.type === "sos" ? "error.main" : "warning.main",
                                    opacity: 0.6,
                                  }}
                                />
                              </motion.div>
                            )}
                          </Marker>
                        ))}
                      </MapContainer>
                    </Box>
                  </Grid>

                  {/* Right: NearbyList */}
                  <Grid item xs={12} md={6}>
                    <Stack spacing={1.5} sx={{ maxHeight: 260, overflowY: "auto", pr: 1 }}>
                      {mockNearby.slice(0, 4).map((incident) => (
                        <Card
                          key={incident.id}
                          sx={{
                            border: incident.type === "sos" ? "2px solid" : "1px solid",
                            borderColor: incident.type === "sos" ? "error.main" : "divider",
                            borderRadius: 2,
                          }}
                        >
                          <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                              {getTypeIcon(incident.type)}
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                                {getTypeLabel(incident.type)}
                              </Typography>
                              <Chip
                                label={incident.level === "verified" ? "verified" : "guest"}
                                size="small"
                                color={incident.level === "verified" ? "success" : "default"}
                                sx={{ height: 20, fontSize: "0.65rem" }}
                              />
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                {incident.distance} м • TTL: {incident.ttl}
                              </Typography>
                            </Box>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<MapIcon sx={{ fontSize: 14 }} />}
                              onClick={() => handleOpenMap(incident.id, incident.lat, incident.lng)}
                              sx={{ fontSize: "0.7rem", py: 0.5, px: 1 }}
                              fullWidth
                            >
                              Открыть на карте
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Live Feed Events */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Последние события
                </Typography>
                <Stack spacing={1} sx={{ maxHeight: 400, overflowY: "auto" }}>
                  {feedEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <Card
                        sx={{
                          bgcolor: event.type === "sos" ? "error.light" : "background.paper",
                          border: event.type === "sos" ? "2px solid" : "1px solid",
                          borderColor: event.type === "sos" ? "error.main" : "divider",
                          borderRadius: 2,
                        }}
                      >
                        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                          <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                            <Box sx={{ mt: 0.5 }}>{getTypeIcon(event.type)}</Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                {event.title}
                              </Typography>
                              <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                              <Typography variant="caption" color="text.secondary">
                                  {event.timeAgo}
                              </Typography>
                                <Chip
                                  label={event.level === "verified" ? "verified" : "guest"}
                                  size="small"
                                  color={event.level === "verified" ? "success" : "default"}
                                  sx={{ height: 18, fontSize: "0.65rem" }}
                                />
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Onboarding Overlay */}
      <AnimatePresence>
        {showOnboarding && (
          <Backdrop
            open
            sx={{
              bgcolor: "rgba(0, 0, 0, 0.8)",
              zIndex: 1400,
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <Card sx={{ maxWidth: 500, p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Добро пожаловать в SOSMap
                  </Typography>
                  <IconButton onClick={handleOnboardingSkip} size="small">
                    <Close />
                  </IconButton>
                </Box>

                {onboardingStep === 0 && (
                  <Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      Разрешите геолокацию для получения предупреждений о ближайших опасностях
                    </Typography>
                    <Button variant="contained" onClick={requestGeolocation} fullWidth>
                      Разрешить геолокацию
                    </Button>
                  </Box>
                )}

                {onboardingStep === 1 && (
                  <Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      Нажмите и удерживайте кнопку SOS для отправки сигнала тревоги
                    </Typography>
                    <Button variant="contained" onClick={handleOnboardingNext} fullWidth>
                      Понятно
                    </Button>
                  </Box>
                )}

                {onboardingStep === 2 && (
                  <Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      Клик по карте позволяет создать отчет за 10 секунд
                    </Typography>
                    <Button variant="contained" onClick={handleOnboardingNext} fullWidth>
                      Начать
                    </Button>
                  </Box>
                )}

                <Box sx={{ display: "flex", gap: 1, mt: 2, justifyContent: "center" }}>
                  {[0, 1, 2].map((step) => (
                    <Box
                      key={step}
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: onboardingStep === step ? "primary.main" : "action.disabled",
                      }}
                    />
                  ))}
                </Box>
              </Card>
            </motion.div>
          </Backdrop>
        )}
      </AnimatePresence>
    </Box>
  );
}
