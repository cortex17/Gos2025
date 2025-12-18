import { useEffect } from "react";
import { AppBar, Toolbar, Typography, Button, Box, Container } from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import PageTransition from "../components/PageTransition";
import NotificationCenter from "../components/NotificationCenter";
import ThemeToggle from "../components/ThemeToggle";
import { wsService } from "../api/websocket";

export function AppLayout() {
  const nav = useNavigate();
  const { role, logout, token } = useAuthStore();

  useEffect(() => {
    // Подключаем WebSocket при монтировании
    if (token) {
      wsService.connect();
    }

    return () => {
      wsService.disconnect();
    };
  }, [token]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ gap: 3, py: 1 }}>
            <Typography
              variant="h5"
              sx={{ 
                flexGrow: 1, 
                cursor: "pointer",
                fontWeight: 700,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
              onClick={() => nav("/dashboard")}
            >
              SOSMap
            </Typography>
            <Button 
              variant="text" 
              onClick={() => nav("/pulse")}
              sx={{ textTransform: "none", fontWeight: 500 }}
            >
              Pulse
            </Button>
            <Button 
              variant="text" 
              onClick={() => nav("/dashboard")}
              sx={{ textTransform: "none", fontWeight: 500 }}
            >
              Карта
            </Button>
            <Button 
              variant="text" 
              onClick={() => nav("/reports")}
              sx={{ textTransform: "none", fontWeight: 500 }}
            >
              Отчеты
            </Button>
            <Button 
              variant="text" 
              onClick={() => nav("/profile")}
              sx={{ textTransform: "none", fontWeight: 500 }}
            >
              Профиль
            </Button>
            {role === "admin" && (
              <Button 
                variant="outlined" 
                onClick={() => nav("/admin")}
                sx={{ textTransform: "none" }}
              >
                Админ
              </Button>
            )}
            <ThemeToggle />
            <Button
              variant="outlined"
              onClick={() => {
                logout();
                nav("/login");
              }}
              sx={{ textTransform: "none" }}
            >
              Выход
            </Button>
          </Toolbar>
        </Container>
      </AppBar>
      <Box sx={{ flex: 1 }}>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </Box>

      <NotificationCenter />
    </Box>
  );
}
