import { useEffect, useMemo, useState } from "react";
import { Box, Card, CardContent, Typography, Container, Grid, Avatar, Button, AppBar, Toolbar, Backdrop, IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { useNotificationsStore } from "../store/notifications";
import { LocationOn, Warning, Security, LocalFireDepartment, Map as MapIcon, AddAlert, RadioButtonChecked, RadioButtonUnchecked, Close } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

export default function PulsePage() {
  const nav = useNavigate();
  const { token } = useAuthStore();
  const { wsConnected, sosEvents } = useNotificationsStore();
  const [nearbyCount] = useState(2); // Mock: 2 инцидента
  const [geoEnabled, setGeoEnabled] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

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
        () => {
          setGeoEnabled(true);
        },
        () => {
          alert("Геолокация не разрешена");
        }
      );
    } else {
      alert("Геолокация не поддерживается");
    }
  };

  // Mock stats
  const stats = useMemo(() => ({
    active: 12,
    sos24h: 3,
    topType: "no_light",
  }), []);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      no_light: "Нет света",
      dogs: "Собаки",
      ice: "Гололёд",
      other: "Другое",
    };
    return labels[type] || type;
  };

  const handleQuickAction = (action: "sos" | "report" | "map") => {
    if (!token) {
      if (action === "map") {
        nav("/login?redirectTo=/map");
      } else if (action === "report") {
        nav("/login?redirectTo=/report/new");
      } else if (action === "sos") {
        // SOS modal будет открыт через FloatingSosButton
        alert("Для отправки SOS необходимо войти в систему");
      }
      return;
    }

    if (action === "map") {
      nav("/map");
    } else if (action === "report") {
      nav("/report/new");
    }
  };

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

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Operational Bar */}
      <AppBar 
        position="sticky" 
        sx={{ 
          bgcolor: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", flexWrap: "wrap", gap: 2, py: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {wsConnected ? (
                <RadioButtonChecked sx={{ color: "#4caf50", fontSize: 16 }} />
              ) : (
                <RadioButtonUnchecked sx={{ color: "#f44336", fontSize: 16 }} />
              )}
              <Typography variant="body2" sx={{ fontWeight: 600, color: "white" }}>
                {wsConnected ? "LIVE" : "OFF"}
              </Typography>
            </Box>
            {geoEnabled ? (
              <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                В радиусе 500м: {nearbyCount} инцидентов
              </Typography>
            ) : (
              <Button
                size="small"
                variant="outlined"
                onClick={requestGeolocation}
                sx={{ 
                  textTransform: "none",
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  color: "white",
                  "&:hover": {
                    borderColor: "rgba(255, 255, 255, 0.5)",
                  },
                }}
              >
                Разрешить геолокацию
              </Button>
            )}
          </Box>
          
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddAlert />}
              onClick={() => handleQuickAction("sos")}
              sx={{ 
                textTransform: "none",
                borderColor: "rgba(255, 255, 255, 0.3)",
                color: "white",
                "&:hover": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                },
              }}
            >
              SOS
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Warning />}
              onClick={() => handleQuickAction("report")}
              sx={{ 
                textTransform: "none",
                borderColor: "rgba(255, 255, 255, 0.3)",
                color: "white",
                "&:hover": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                },
              }}
            >
              Создать отчет
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<MapIcon />}
              onClick={() => handleQuickAction("map")}
              sx={{ 
                textTransform: "none",
                bgcolor: "white",
                color: "#1a1a1a",
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.9)",
                },
              }}
            >
              Открыть карту
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
        <Grid container spacing={3}>
          {/* KPI Cards */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Security sx={{ fontSize: 40, color: "primary.main" }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.active}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
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
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.sos24h}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
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
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {getTypeLabel(stats.topType)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Top type
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Live Feed */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Live Feed
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, maxHeight: 400, overflowY: "auto" }}>
                  {sosEvents.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                      Нет событий
                    </Typography>
                  ) : (
                    sosEvents.slice(0, 5).map((event) => (
                      <Card key={event.id} sx={{ bgcolor: event.type === "sos" ? "error.light" : "background.paper" }}>
                        <CardContent sx={{ p: 1.5 }}>
                          <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                            <Avatar sx={{ bgcolor: event.type === "sos" ? "error.main" : "info.main", width: 32, height: 32 }}>
                              {event.type === "sos" ? <Warning /> : <LocationOn />}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                {event.type === "sos" ? "🚨 SOS Alert" : "Новый инцидент"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {event.timestamp.toLocaleTimeString("ru-RU")}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </Box>
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
