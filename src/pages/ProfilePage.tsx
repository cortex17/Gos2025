import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Avatar,
  LinearProgress,
  Container,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Person,
  AdminPanelSettings,
  TrendingUp,
  CheckCircle,
  Cancel,
  Warning,
  LocationOn,
  Notifications,
  Security,
  Star,
  VerifiedUser,
  EmojiEvents,
  Report,
  LocationSearching,
  Nightlight,
  Help,
  Home,
  Map,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/auth";
import { useQuery } from "@tanstack/react-query";
import { listApprovedReports } from "../api/reports";
import { getReputation } from "../api/reputation";
import styles from "./ProfilePage.module.css";

const MotionCard = motion(Card);

// Получить email из localStorage (fake API сохраняет его)
function getUserEmail(): string {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return "user@example.com";
    }
    const token = localStorage.getItem("sr_token");
    if (token?.startsWith("fake_token_")) {
      const email = localStorage.getItem("sr_email");
      return email || "user@example.com";
    }
    return "user@example.com";
  } catch (error) {
    console.error("Error reading localStorage:", error);
    return "user@example.com";
  }
}

// Получить имя пользователя
function getUserName(): string {
  const email = getUserEmail();
  return email.split("@")[0];
}

// Определить уровень репутации
function getReputationLevel(score: number): { level: string; color: string; next: number } {
  if (score >= 80) return { level: "Gold", color: "#FFD700", next: 100 };
  if (score >= 50) return { level: "Silver", color: "#C0C0C0", next: 80 };
  return { level: "Bronze", color: "#CD7F32", next: 50 };
}

// Mock данные для KPI
function getMockKPIData() {
  return {
    reputationChange: 12, // +12 за 7 дней
    reportsTotal: 8,
    reportsVerified: 6,
    reportsFake: 1,
    sosSent: 2,
    sosReceived: 5,
    nearbyAlerts: 12,
  };
}

// Mock история активности
function getMockActivity() {
  return [
    { type: "verified", text: "Отчёт подтверждён пользователями", time: "2 часа назад", icon: CheckCircle, color: "success" },
    { type: "fake", text: "Отчёт помечен как фейк", time: "5 часов назад", icon: Cancel, color: "error" },
    { type: "sos", text: "SOS получен рядом (350м)", time: "1 день назад", icon: Warning, color: "warning" },
    { type: "vote", text: "Вы подтвердили инцидент", time: "2 дня назад", icon: CheckCircle, color: "info" },
    { type: "report", text: "Создан новый отчёт", time: "3 дня назад", icon: Report, color: "primary" },
    { type: "verified", text: "Отчёт подтверждён пользователями", time: "4 дня назад", icon: CheckCircle, color: "success" },
    { type: "sos", text: "SOS получен рядом (180м)", time: "5 дней назад", icon: Warning, color: "warning" },
    { type: "vote", text: "Вы подтвердили инцидент", time: "6 дней назад", icon: CheckCircle, color: "info" },
  ];
}

// Mock бейджи
const badges = [
  { id: "first", name: "First Report", icon: Star, earned: true, description: "Создал первый отчёт" },
  { id: "verified5", name: "Verified x5", icon: VerifiedUser, earned: true, description: "5 отчётов подтверждены" },
  { id: "night", name: "Night Guardian", icon: Nightlight, earned: true, description: "Отчёты ночью" },
  { id: "helper", name: "Helper", icon: Help, earned: true, description: "Подтвердил 10 инцидентов" },
  { id: "sos", name: "SOS Hero", icon: Warning, earned: false, description: "Отправил 5 SOS" },
  { id: "gold", name: "Gold Member", icon: EmojiEvents, earned: false, description: "Достиг Gold уровня" },
];

export default function ProfilePage() {
  const { role, token } = useAuthStore();
  
  const [proximityEnabled, setProximityEnabled] = useState(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return localStorage.getItem("proximity_enabled") === "true";
      }
    } catch (error) {
      console.error("Error reading proximity_enabled:", error);
    }
    return false;
  });
  
  const [proximityRadius, setProximityRadius] = useState(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return localStorage.getItem("proximity_radius") || "500";
      }
    } catch (error) {
      console.error("Error reading proximity_radius:", error);
    }
    return "500";
  });
  
  const [geolocationStatus, setGeolocationStatus] = useState<"granted" | "denied" | "prompt">("prompt");
  
  const [homeZone, setHomeZone] = useState<{ lat: number; lng: number } | null>(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = localStorage.getItem("home_zone");
        if (saved) {
          return JSON.parse(saved);
        }
      }
    } catch (error) {
      console.error("Error reading home_zone:", error);
    }
    return null;
  });

  useQuery({
    queryKey: ["reports", "approved"],
    queryFn: listApprovedReports,
  });

  const { data: reputation } = useQuery({
    queryKey: ["reputation"],
    queryFn: () => getReputation(),
    enabled: !!token,
  });

  const kpiData = getMockKPIData();
  const activity = getMockActivity();
  const reputationScore = reputation?.score || 45;
  const reputationLevel = getReputationLevel(reputationScore);
  const userEmail = getUserEmail();
  const userName = getUserName();

  // Проверка статуса геолокации
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.permissions?.query({ name: "geolocation" as PermissionName }).then((result) => {
        if (result.state === "granted") {
          setGeolocationStatus("granted");
        } else if (result.state === "denied") {
          setGeolocationStatus("denied");
        } else {
          setGeolocationStatus("prompt");
        }
      }).catch(() => {
        setGeolocationStatus("prompt");
      });
    }
  }, []);

  // Сохранение настроек
  const handleProximityToggle = (enabled: boolean) => {
    setProximityEnabled(enabled);
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("proximity_enabled", String(enabled));
      }
    } catch (error) {
      console.error("Error saving proximity_enabled:", error);
    }
  };

  const handleRadiusChange = (radius: string) => {
    setProximityRadius(radius);
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("proximity_radius", radius);
      }
    } catch (error) {
      console.error("Error saving proximity_radius:", error);
    }
  };

  const requestGeolocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setGeolocationStatus("granted");
        },
        () => {
          setGeolocationStatus("denied");
        }
      );
    }
  };

  const handleSetHomeZone = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const zone = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setHomeZone(zone);
          try {
            if (typeof window !== "undefined" && window.localStorage) {
              localStorage.setItem("home_zone", JSON.stringify(zone));
            }
          } catch (error) {
            console.error("Error saving home_zone:", error);
          }
        },
        () => {
          alert("Не удалось получить геолокацию");
        }
      );
    }
  };

  const getRoleLabel = (r: string | null) => {
    if (r === "admin") return "Администратор";
    if (r === "user") return "Студент";
    return "Гость";
  };

  const progressToNext = ((reputationScore / reputationLevel.next) * 100).toFixed(0);

  return (
    <Box className={styles.profilePage}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        {/* Компактная шапка профиля */}
        <MotionCard
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.profileHeader}
        >
          <CardContent className={styles.headerContent}>
            <Box className={styles.headerMain}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: role === "admin" ? "error.main" : "primary.main",
                }}
              >
                {role === "admin" ? (
                  <AdminPanelSettings sx={{ fontSize: 32 }} />
                ) : (
                  <Person sx={{ fontSize: 32 }} />
                )}
              </Avatar>
              <Box className={styles.headerInfo}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {userName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userEmail}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                  <Chip
                    label={getRoleLabel(role)}
                    size="small"
                    color={role === "admin" ? "error" : "primary"}
                    icon={role === "admin" ? <AdminPanelSettings /> : <Person />}
                  />
                  <Chip
                    label={token ? "Verified" : "Guest"}
                    size="small"
                    color={token ? "success" : "default"}
                    icon={token ? <VerifiedUser /> : undefined}
                  />
                </Box>
              </Box>
            </Box>
            <Box className={styles.headerStats}>
              <Box className={styles.reputationBox}>
                <Typography variant="caption" color="text.secondary">
                  Репутация
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: reputationLevel.color }}>
                  {reputationScore}
                </Typography>
                <Chip
                  label={reputationLevel.level}
                  size="small"
                  sx={{
                    bgcolor: reputationLevel.color,
                    color: "white",
                    fontWeight: 600,
                    mt: 0.5,
                  }}
                />
              </Box>
            </Box>
          </CardContent>
        </MotionCard>

        {/* KPI Карточки */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Репутация тренд */}
          <Grid item xs={12} sm={6} md={3}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={styles.kpiCard}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <TrendingUp color="success" />
                  <Typography variant="body2" color="text.secondary">
                    Репутация (7д)
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  +{kpiData.reputationChange}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                  <TrendingUp sx={{ fontSize: 16, color: "success.main" }} />
                  <Typography variant="caption" color="success.main">
                    Растёт
                  </Typography>
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>

          {/* Мои отчёты */}
          <Grid item xs={12} sm={6} md={3}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={styles.kpiCard}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <Report color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Мои отчёты
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {kpiData.reportsTotal}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                  <Chip
                    label={`✓ ${kpiData.reportsVerified}`}
                    size="small"
                    color="success"
                    icon={<CheckCircle sx={{ fontSize: 14 }} />}
                  />
                  <Chip
                    label={`✗ ${kpiData.reportsFake}`}
                    size="small"
                    color="error"
                    icon={<Cancel sx={{ fontSize: 14 }} />}
                  />
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>

          {/* SOS */}
          <Grid item xs={12} sm={6} md={3}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={styles.kpiCard}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <Warning color="warning" />
                  <Typography variant="body2" color="text.secondary">
                    SOS
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {kpiData.sosSent}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  Получено: {kpiData.sosReceived}
                </Typography>
              </CardContent>
            </MotionCard>
          </Grid>

          {/* Nearby Alerts */}
          <Grid item xs={12} sm={6} md={3}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={styles.kpiCard}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <LocationOn color="error" />
                  <Typography variant="body2" color="text.secondary">
                    Оповещения рядом
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {kpiData.nearbyAlerts}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  За всё время
                </Typography>
              </CardContent>
            </MotionCard>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Настройки оповещений */}
          <Grid item xs={12} md={6}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={styles.settingsCard}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                  <Security color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Оповещения рядом
                  </Typography>
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={proximityEnabled}
                      onChange={(e) => handleProximityToggle(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Включить оповещения"
                  sx={{ mb: 2, display: "block" }}
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Радиус оповещений</InputLabel>
                  <Select
                    value={proximityRadius}
                    label="Радиус оповещений"
                    onChange={(e) => handleRadiusChange(e.target.value)}
                    disabled={!proximityEnabled}
                  >
                    <MenuItem value="200">200 м</MenuItem>
                    <MenuItem value="300">300 м</MenuItem>
                    <MenuItem value="500">500 м</MenuItem>
                    <MenuItem value="800">800 м</MenuItem>
                  </Select>
                </FormControl>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Геолокация
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <Chip
                      label={
                        geolocationStatus === "granted"
                          ? "Разрешена"
                          : geolocationStatus === "denied"
                          ? "Запрещена"
                          : "Не запрошена"
                      }
                      color={
                        geolocationStatus === "granted"
                          ? "success"
                          : geolocationStatus === "denied"
                          ? "error"
                          : "default"
                      }
                      size="small"
                      icon={<LocationSearching sx={{ fontSize: 14 }} />}
                    />
                    {geolocationStatus !== "granted" && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={requestGeolocation}
                        startIcon={<LocationSearching />}
                      >
                        Запросить
                      </Button>
                    )}
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Домашняя зона
                  </Typography>
                  {homeZone ? (
                    <Box>
                      <Chip
                        label={`${homeZone.lat.toFixed(4)}, ${homeZone.lng.toFixed(4)}`}
                        size="small"
                        icon={<Home sx={{ fontSize: 14 }} />}
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        Статистика в вашем районе за неделю: {Math.floor(Math.random() * 15 + 5)} инцидентов
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleSetHomeZone}
                        startIcon={<Map />}
                      >
                        Изменить
                      </Button>
                    </Box>
                  ) : (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleSetHomeZone}
                      startIcon={<Map />}
                      fullWidth
                    >
                      Установить домашнюю зону
                    </Button>
                  )}
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>

          {/* Бейджи и прогресс */}
          <Grid item xs={12} md={6}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className={styles.settingsCard}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                  <EmojiEvents color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Бейджи
                  </Typography>
                </Box>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {badges.map((badge) => {
                    const Icon = badge.icon;
                    return (
                      <Grid item xs={6} sm={4} key={badge.id}>
                        <Box
                          className={styles.badgeItem}
                          sx={{
                            opacity: badge.earned ? 1 : 0.4,
                            filter: badge.earned ? "none" : "grayscale(100%)",
                          }}
                        >
                          <Icon
                            sx={{
                              fontSize: 32,
                              color: badge.earned ? "primary.main" : "text.disabled",
                            }}
                          />
                          <Typography variant="caption" sx={{ mt: 0.5, textAlign: "center" }}>
                            {badge.name}
                          </Typography>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Прогресс до {reputationLevel.level}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {reputationScore} / {reputationLevel.next}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Number(progressToNext)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: "divider",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: reputationLevel.color,
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>

          {/* История активности */}
          <Grid item xs={12}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className={styles.settingsCard}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                  <Notifications color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    История активности
                  </Typography>
                </Box>

                <List>
                  {activity.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <ListItem key={idx} className={styles.activityItem}>
                        <ListItemIcon>
                          <Icon color={item.color as any} />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          secondary={item.time}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </CardContent>
            </MotionCard>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
