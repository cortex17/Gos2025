import { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Typography, Container, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { loginApi } from "../api/auth";
import { useAuthStore } from "../store/auth";
import { AdminPanelSettings } from "@mui/icons-material";

export default function QuickAdminLogin() {
  const nav = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Автоматический вход при загрузке страницы
  useEffect(() => {
    handleQuickLogin();
  }, []);

  async function handleQuickLogin() {
    setLoading(true);
    setError(null);
    
    try {
      console.log("[QuickAdminLogin] Starting automatic admin login...");
      
      // Очищаем старые данные
      localStorage.removeItem("sr_token");
      localStorage.removeItem("sr_role");
      
      // Выполняем вход
      const data = await loginApi("admin@test.com", "admin123");
      console.log("[QuickAdminLogin] Login successful:", data);
      
      if (!data || !data.access_token || data.role !== "admin") {
        throw new Error("Failed to login as admin");
      }
      
      // Устанавливаем авторизацию
      setAuth(data.access_token, data.role);
      
      // Принудительно проверяем сохранение
      const savedRole = localStorage.getItem("sr_role");
      if (savedRole !== "admin") {
        localStorage.setItem("sr_role", "admin");
        localStorage.setItem("sr_token", data.access_token);
        console.log("[QuickAdminLogin] Manually saved admin role");
      }
      
      // Небольшая задержка для обновления store
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Переходим на админ панель
      console.log("[QuickAdminLogin] Redirecting to /admin");
      nav("/admin", { replace: true });
      
    } catch (e: any) {
      console.error("[QuickAdminLogin] Error:", e);
      setError(e?.message || "Ошибка входа. Попробуйте нажать кнопку ниже.");
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            bgcolor: "white",
            borderRadius: 4,
            p: 4,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <AdminPanelSettings
            sx={{
              fontSize: 64,
              color: "primary.main",
              mb: 2,
            }}
          />
          
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Быстрый вход в админ панель
          </Typography>
          
          {loading ? (
            <>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Выполняется вход...
              </Typography>
            </>
          ) : error ? (
            <>
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
              <Button
                variant="contained"
                size="large"
                startIcon={<AdminPanelSettings />}
                onClick={handleQuickLogin}
                sx={{ mt: 2 }}
              >
                Попробовать снова
              </Button>
            </>
          ) : (
            <Typography variant="body1" color="text.secondary">
              Перенаправление...
            </Typography>
          )}
          
          <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: "divider" }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Или перейдите на обычную страницу входа:
            </Typography>
            <Button
              variant="outlined"
              onClick={() => nav("/login")}
              size="small"
            >
              Страница входа
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
