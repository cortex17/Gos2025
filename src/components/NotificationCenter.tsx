import { useState, useEffect } from "react";
import {
  Box,
  IconButton,
  Badge,
  Drawer,
  Typography,
  List,
  ListItem,
  Divider,
  Chip,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
  Stack,
} from "@mui/material";
import {
  Notifications,
  Close,
  Warning,
  Report,
  LocalPolice,
  CarCrash,
  Settings,
  CheckCircle,
  Cancel,
  Help,
  LocationOn,
  Map,
  LocationSearching,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { wsService, WebSocketEvent } from "../api/websocket";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";

type NotificationKind = "sos" | "incident" | "accident" | "system";
type NotificationType = "lighting" | "dog" | "crime" | "ice" | "car_crash" | "road_block" | "sos";
type NotificationLevel = "verified" | "guest_unverified";

interface Notification {
  id: string;
  kind: NotificationKind;
  type: NotificationType;
  title: string;
  message: string;
  timeAgo: string;
  distanceM?: number;
  level: NotificationLevel;
  lat?: number;
  lng?: number;
}

// Mock уведомления для демонстрации
const mockNotifications: Notification[] = [
  {
    id: "mock_1",
    kind: "sos",
    type: "sos",
    title: "🚨 Активный SOS сигнал",
    message: "Требуется помощь в районе Абая-Достык",
    timeAgo: "2 мин назад",
    distanceM: 420,
    level: "verified",
    lat: 43.2220,
    lng: 76.8512,
  },
  {
    id: "mock_2",
    kind: "incident",
    type: "lighting",
    title: "Отсутствие освещения",
    message: "Темный участок на проспекте Абая",
    timeAgo: "15 мин назад",
    distanceM: 180,
    level: "verified",
    lat: 43.2230,
    lng: 76.8520,
  },
  {
    id: "mock_3",
    kind: "accident",
    type: "car_crash",
    title: "ДТП на перекрестке",
    message: "Столкновение двух автомобилей",
    timeAgo: "25 мин назад",
    distanceM: 650,
    level: "verified",
    lat: 43.2240,
    lng: 76.8530,
  },
  {
    id: "mock_4",
    kind: "incident",
    type: "dog",
    title: "Стая бездомных собак",
    message: "Агрессивное поведение",
    timeAgo: "1 час назад",
    distanceM: 320,
    level: "guest_unverified",
    lat: 43.2210,
    lng: 76.8500,
  },
  {
    id: "mock_5",
    kind: "incident",
    type: "crime",
    title: "Подозрительная активность",
    message: "Неизвестные лица в районе парка",
    timeAgo: "1 час назад",
    distanceM: 890,
    level: "verified",
    lat: 43.2200,
    lng: 76.8490,
  },
  {
    id: "mock_6",
    kind: "sos",
    type: "sos",
    title: "🚨 Требуется помощь",
    message: "Экстренная ситуация",
    timeAgo: "2 часа назад",
    distanceM: 1200,
    level: "verified",
    lat: 43.2250,
    lng: 76.8540,
  },
  {
    id: "mock_7",
    kind: "incident",
    type: "ice",
    title: "Скользкая дорога",
    message: "Обледенение на тротуаре",
    timeAgo: "3 часа назад",
    distanceM: 250,
    level: "verified",
    lat: 43.2190,
    lng: 76.8480,
  },
  {
    id: "mock_8",
    kind: "accident",
    type: "road_block",
    title: "Перекрытие дороги",
    message: "Движение ограничено",
    timeAgo: "4 часа назад",
    distanceM: 1500,
    level: "verified",
    lat: 43.2260,
    lng: 76.8550,
  },
  {
    id: "mock_9",
    kind: "system",
    type: "lighting",
    title: "Системное обновление",
    message: "Добавлены новые типы инцидентов",
    timeAgo: "1 день назад",
    level: "verified",
  },
  {
    id: "mock_10",
    kind: "incident",
    type: "dog",
    title: "Бездомные собаки",
    message: "Район центрального парка",
    timeAgo: "1 день назад",
    distanceM: 2100,
    level: "guest_unverified",
    lat: 43.2180,
    lng: 76.8470,
  },
  {
    id: "mock_11",
    kind: "sos",
    type: "sos",
    title: "🚨 SOS сигнал",
    message: "Требуется медицинская помощь",
    timeAgo: "2 дня назад",
    distanceM: 3500,
    level: "verified",
    lat: 43.2270,
    lng: 76.8560,
  },
  {
    id: "mock_12",
    kind: "incident",
    type: "lighting",
    title: "Не работает освещение",
    message: "Улица Сатпаева",
    timeAgo: "2 дня назад",
    distanceM: 1800,
    level: "verified",
    lat: 43.2170,
    lng: 76.8460,
  },
];

function getTypeIcon(type: NotificationType) {
  switch (type) {
    case "sos":
      return <Warning color="error" />;
    case "lighting":
      return <Report color="warning" />;
    case "dog":
      return <Report color="warning" />;
    case "crime":
      return <LocalPolice color="error" />;
    case "ice":
      return <Report color="info" />;
    case "car_crash":
      return <CarCrash color="error" />;
    case "road_block":
      return <CarCrash color="warning" />;
    default:
      return <Report />;
  }
}

function getTypeLabel(type: NotificationType): string {
  const labels: Record<NotificationType, string> = {
    sos: "SOS",
    lighting: "Освещение",
    dog: "Собаки",
    crime: "Преступление",
    ice: "Гололед",
    car_crash: "ДТП",
    road_block: "Перекрытие",
  };
  return labels[type] || type;
}

export default function NotificationCenter() {
  const { token } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<WebSocketEvent & { id: string; timestamp: Date }>>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [geolocationEnabled, setGeolocationEnabled] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (!token) return;
    const unsubscribeSos = wsService.subscribe("sos_alert", (event) => {
      setNotifications(prev => [{
        ...event,
        id: `sos_${Date.now()}`,
        timestamp: new Date(),
      }, ...prev].slice(0, 50));
    });

    const unsubscribeReport = wsService.subscribe("new_report", (event) => {
      setNotifications(prev => [{
        ...event,
        id: `report_${Date.now()}`,
        timestamp: new Date(),
      }, ...prev].slice(0, 50));
    });

    const unsubscribePanic = wsService.subscribe("panic_nearby", (event) => {
      setNotifications(prev => [{
        ...event,
        id: `panic_${Date.now()}`,
        timestamp: new Date(),
      }, ...prev].slice(0, 50));
    });

    return () => {
      unsubscribeSos();
      unsubscribeReport();
      unsubscribePanic();
    };
  }, [token]);

  // Проверка статуса геолокации
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.permissions?.query({ name: "geolocation" as PermissionName }).then((result) => {
        setGeolocationEnabled(result.state === "granted");
      }).catch(() => {
        setGeolocationEnabled(false);
      });
    }
  }, []);

  const handleRequestGeolocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setGeolocationEnabled(true);
        },
        () => {
          alert("Не удалось получить доступ к геолокации");
        }
      );
    }
  };

  // Объединяем реальные и mock уведомления
  const allNotifications = notifications.length > 0 
    ? notifications.map(n => ({
        id: n.id,
        kind: n.type.includes("sos") || n.type.includes("panic") ? "sos" as NotificationKind : "incident" as NotificationKind,
        type: (n.data as any)?.type || "lighting" as NotificationType,
        title: n.type === "sos_alert" ? "🚨 SOS сигнал" : n.type === "panic_nearby" ? "⚠️ SOS поблизости" : "📋 Новый отчет",
        message: (n.data as any)?.description || "Новое событие",
        timeAgo: formatTimeAgo(n.timestamp),
        distanceM: (n.data as any)?.distance,
        level: "verified" as NotificationLevel,
        lat: (n.data as any)?.lat,
        lng: (n.data as any)?.lng,
      }))
    : mockNotifications;

  // Фильтрация по табам
  const filteredNotifications = allNotifications.filter((notif) => {
    if (activeTab === 0) return true; // Все
    if (activeTab === 1) return notif.kind === "sos";
    if (activeTab === 2) return notif.kind === "incident";
    if (activeTab === 3) return notif.kind === "accident";
    if (activeTab === 4) return notif.kind === "system";
    return true;
  });

  const handleOpenMap = (notif: Notification) => {
    if (notif.lat && notif.lng) {
      nav(`/map?focus=${notif.id}&lat=${notif.lat}&lng=${notif.lng}`);
    } else {
      nav("/map");
    }
    setOpen(false);
  };

  const handleConfirm = (id: string) => {
    alert(`Подтверждено: ${id}`);
  };

  const handleFake = (id: string) => {
    alert(`Помечено как фейк: ${id}`);
  };

  const handleHelp = (id: string) => {
    alert(`Помощь отправлена: ${id}`);
  };

  if (!token) return null;

  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        sx={{
          position: "fixed",
          top: 80,
          right: 24,
          zIndex: 1000,
          bgcolor: "background.paper",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <Badge badgeContent={allNotifications.length} color="error">
          <Notifications />
        </Badge>
      </IconButton>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: { width: { xs: "100%", sm: 420 }, display: "flex", flexDirection: "column" }
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Уведомления
          </Typography>
          <IconButton onClick={() => setOpen(false)} size="small">
            <Close />
          </IconButton>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 48 }}
          >
            <Tab label="Все" sx={{ minWidth: 60, px: 1 }} />
            <Tab label="SOS" sx={{ minWidth: 60, px: 1 }} />
            <Tab label="Инциденты" sx={{ minWidth: 80, px: 1 }} />
            <Tab label="ДТП/Аварии" sx={{ minWidth: 100, px: 1 }} />
            <Tab label="Системные" sx={{ minWidth: 90, px: 1 }} />
          </Tabs>
        </Box>

        {/* Geolocation Alert */}
        {!geolocationEnabled && (
          <Alert
            severity="info"
            icon={<LocationSearching />}
            sx={{ m: 2, mb: 1 }}
            action={
              <Button size="small" onClick={handleRequestGeolocation}>
                Разрешить
              </Button>
            }
          >
            <Typography variant="caption" sx={{ display: "block", fontWeight: 600, mb: 0.5 }}>
              Включите геолокацию
            </Typography>
            <Typography variant="caption">
              Будем присылать ближайшие опасности
            </Typography>
          </Alert>
        )}

        {/* Notifications List */}
        <Box sx={{ flex: 1, overflowY: "auto", p: 1 }}>
          {filteredNotifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Нет уведомлений в этой категории
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1}>
              {filteredNotifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card
                    sx={{
                      borderRadius: 2,
                      border: notif.kind === "sos" ? "2px solid" : "1px solid",
                      borderColor: notif.kind === "sos" ? "error.main" : "divider",
                      boxShadow: notif.kind === "sos" ? "0 2px 8px rgba(244, 67, 54, 0.2)" : "none",
                    }}
                  >
                    <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                      {/* Header */}
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1 }}>
                        <Box sx={{ mt: 0.5 }}>
                          {getTypeIcon(notif.type)}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {notif.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            {notif.message}
                          </Typography>
                          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                            {notif.distanceM && (
                              <Chip
                                label={`${notif.distanceM} м от вас`}
                                size="small"
                                icon={<LocationOn sx={{ fontSize: 14 }} />}
                                sx={{ height: 20, fontSize: "0.65rem" }}
                              />
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {notif.timeAgo}
                            </Typography>
                            <Chip
                              label={notif.level === "verified" ? "verified" : "guest"}
                              size="small"
                              color={notif.level === "verified" ? "success" : "default"}
                              sx={{ height: 20, fontSize: "0.65rem" }}
                            />
                          </Box>
                        </Box>
                      </Box>

                      {/* Actions */}
                      <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Map sx={{ fontSize: 14 }} />}
                          onClick={() => handleOpenMap(notif)}
                          sx={{ fontSize: "0.7rem", py: 0.5, px: 1 }}
                        >
                          На карте
                        </Button>
                        {notif.kind === "incident" && (
                          <>
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              startIcon={<CheckCircle sx={{ fontSize: 14 }} />}
                              onClick={() => handleConfirm(notif.id)}
                              sx={{ fontSize: "0.7rem", py: 0.5, px: 1 }}
                            >
                              Подтвердить
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<Cancel sx={{ fontSize: 14 }} />}
                              onClick={() => handleFake(notif.id)}
                              sx={{ fontSize: "0.7rem", py: 0.5, px: 1 }}
                            >
                              Фейк
                            </Button>
                          </>
                        )}
                        {notif.kind === "sos" && (
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<Help sx={{ fontSize: 14 }} />}
                            onClick={() => handleHelp(notif.id)}
                            sx={{ fontSize: "0.7rem", py: 0.5, px: 1 }}
                          >
                            Помочь
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </Stack>
          )}
        </Box>
      </Drawer>
    </>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "только что";
  if (diffMins < 60) return `${diffMins} мин назад`;
  if (diffHours < 24) return `${diffHours} час назад`;
  return `${diffDays} дн. назад`;
}
