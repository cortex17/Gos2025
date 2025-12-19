import { useState, useEffect } from "react";
import { Box, Button, Card, CardContent, TextField, Typography, Alert, Tabs, Tab, Divider } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { loginApi, registerApi } from "../api/auth";
import { useAuthStore } from "../store/auth";

// Экспортируем getState для проверки роли вне компонента
const getAuthState = () => useAuthStore.getState();
import { motion } from "framer-motion";
import { AdminPanelSettings, Person } from "@mui/icons-material";
import styles from "./AuthPage.module.css";
import Header from "../components/Header";

export default function AuthPage() {
  const nav = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);

  const isRegister = location.pathname === "/register";
  const [activeTab, setActiveTab] = useState(isRegister ? 1 : 0);

  useEffect(() => {
    setActiveTab(location.pathname === "/register" ? 1 : 0);
  }, [location.pathname]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setErr(null);
    nav(newValue === 0 ? "/login" : "/register");
  };

  async function onLogin() {
    setErr(null);
    if (!email || !password) {
      setErr("Заполните все поля");
      return;
    }
    setLoading(true);
    try {
      const data = await loginApi(email, password);
      console.log("[AuthPage] Login successful, role:", data.role);
      setAuth(data.access_token, data.role as "user" | "admin");
      
      // Проверяем сохраненную роль
      const savedRole = localStorage.getItem("sr_role");
      console.log("[AuthPage] Saved role in localStorage:", savedRole);
      
      if (data.role === "admin") {
        console.log("[AuthPage] Redirecting to /admin");
        nav("/admin");
      } else {
        nav("/pulse");
      }
    } catch (e: any) {
      console.error("[AuthPage] Login error:", e);
      setErr((e?.message || e?.response?.data?.message) ?? "Ошибка входа. Проверьте данные.");
    } finally {
      setLoading(false);
    }
  }

  async function onRegister() {
    setErr(null);
    
    if (!email || !password || !name) {
      setErr("Заполните все обязательные поля");
      return;
    }
    
    if (password !== confirmPassword) {
      setErr("Пароли не совпадают");
      return;
    }
    
    if (password.length < 6) {
      setErr("Пароль должен быть не менее 6 символов");
      return;
    }

    setLoading(true);
    try {
      const data = await registerApi(email, password, name);
      setAuth(data.access_token, data.role as "user" | "admin");
      // Устанавливаем флаг для показа onboarding
      localStorage.setItem("sosmap_onboarded", "0");
      nav(data.role === "admin" ? "/admin" : "/pulse");
    } catch (e: any) {
      console.error("Registration error:", e);
      const errorMessage = e?.message || 
        e?.response?.data?.detail || 
        e?.response?.data?.message ||
        "Ошибка регистрации. Попробуйте снова.";
      setErr(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // Быстрый вход как админ
  async function quickLoginAsAdmin() {
    setLoading(true);
    setErr(null);
    try {
      const data = await loginApi("admin@test.com", "admin123");
      console.log("[QuickLoginAdmin] Login data:", data);
      setAuth(data.access_token, data.role as "user" | "admin");
      
      // Проверяем сохраненную роль
      const savedRole = localStorage.getItem("sr_role");
      const savedToken = localStorage.getItem("sr_token");
      console.log("[QuickLoginAdmin] Saved role:", savedRole, "token:", savedToken ? "exists" : "missing");
      
      // Небольшая задержка для обновления store
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Проверяем роль в store
      const authState = useAuthStore.getState();
      const currentRole = authState.role;
      console.log("[QuickLoginAdmin] Current role in store:", currentRole, "Full state:", authState);
      
      if (currentRole === "admin") {
        nav("/admin");
      } else {
        console.error("[QuickLoginAdmin] Role mismatch! Expected admin, got:", currentRole);
        setErr("Ошибка: роль админа не установлена. Попробуйте войти через форму.");
      }
    } catch (e: any) {
      console.error("[QuickLoginAdmin] Error:", e);
      setErr("Ошибка быстрого входа. Попробуйте войти через форму.");
    } finally {
      setLoading(false);
    }
  }

  // Быстрый вход как пользователь
  async function quickLoginAsUser() {
    setLoading(true);
    setErr(null);
    try {
      const data = await loginApi("student1@test.com", "student123");
      setAuth(data.access_token, data.role as "user" | "admin");
      nav("/pulse");
    } catch (e: any) {
      setErr("Ошибка быстрого входа. Попробуйте войти через форму.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header showAuthButtons={false} />
      <Box 
        className={styles.authPage} 
        sx={{ 
          flex: 1,
          pt: { xs: "70px", sm: "80px" }, // Отступ сверху, чтобы контент не перекрывался хедером
        }}
      >
        {/* Night City + Radar Background */}
      <Box className={styles.radarContainer}>
        <Box className={styles.radarCircle}>
          {/* Radar Rings */}
          <Box className={styles.radarRing} style={{ width: "100%", height: "100%" }} />
          <Box className={styles.radarRing} style={{ width: "75%", height: "75%" }} />
          <Box className={styles.radarRing} style={{ width: "50%", height: "50%" }} />
          <Box className={styles.radarRing} style={{ width: "25%", height: "25%" }} />
          
          {/* Cross Axes */}
          <Box className={styles.radarAxis} style={{ transform: "rotate(0deg)" }} />
          <Box className={styles.radarAxis} style={{ transform: "rotate(90deg)" }} />
          <Box className={styles.radarAxis} style={{ transform: "rotate(45deg)" }} />
          <Box className={styles.radarAxis} style={{ transform: "rotate(135deg)" }} />
          
          {/* Sweep Beam */}
          <Box className={styles.radarSweep} />
          
          {/* Ping Points */}
          <Box className={styles.pingPoint} style={{ top: "20%", left: "30%", animationDelay: "0s" }} />
          <Box className={styles.pingPoint} style={{ top: "45%", left: "60%", animationDelay: "1s" }} />
          <Box className={styles.pingPoint} style={{ top: "70%", left: "25%", animationDelay: "2s" }} />
          <Box className={styles.pingPoint} style={{ top: "35%", left: "75%", animationDelay: "1.5s" }} />
          <Box className={styles.pingPoint} style={{ top: "80%", left: "55%", animationDelay: "2.5s" }} />
          <Box className={styles.pingPoint} style={{ top: "15%", left: "50%", animationDelay: "0.7s" }} />
        </Box>
      </Box>

      {/* Glass Card */}
      <Box className={styles.cardContainer}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className={styles.glassCard}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Box sx={{ textAlign: "center", mb: 4 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    mb: 1,
                    fontSize: { xs: "2rem", md: "2.5rem" },
                    color: "white",
                  }}
                >
                  SOSMap
                </Typography>
                <Typography variant="body1" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                  {activeTab === 0 ? "Войдите в систему" : "Создайте аккаунт"}
                </Typography>
              </Box>

              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                sx={{ 
                  mb: 3,
                  "& .MuiTab-root": {
                    color: "rgba(255, 255, 255, 0.6)",
                    fontWeight: 500,
                    fontSize: "1rem",
                    textTransform: "none",
                    "&.Mui-selected": {
                      color: "white",
                      fontWeight: 700,
                    },
                  },
                  "& .MuiTabs-indicator": {
                    height: 3,
                    background: "white",
                  },
                }}
                variant="fullWidth"
              >
                <Tab label="Вход" />
                <Tab label="Регистрация" />
              </Tabs>

              {err && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {err}
                </Alert>
              )}

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {activeTab === 1 && (
                  <TextField
                    label="Имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    required
                    disabled={loading}
                    onKeyPress={(e) => e.key === "Enter" && !loading && onRegister()}
                    sx={{
                      "& .MuiInputLabel-root": { color: "rgba(255, 255, 255, 0.7)" },
                      "& .MuiOutlinedInput-root": {
                        color: "white",
                        "& fieldset": { borderColor: "rgba(255, 255, 255, 0.3)" },
                        "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.5)" },
                        "&.Mui-focused fieldset": { borderColor: "white" },
                      },
                    }}
                  />
                )}
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  required
                  disabled={loading}
                  onKeyPress={(e) => e.key === "Enter" && !loading && (activeTab === 0 ? onLogin() : onRegister())}
                  sx={{
                    "& .MuiInputLabel-root": { color: "rgba(255, 255, 255, 0.7)" },
                    "& .MuiOutlinedInput-root": {
                      color: "white",
                      "& fieldset": { borderColor: "rgba(255, 255, 255, 0.3)" },
                      "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.5)" },
                      "&.Mui-focused fieldset": { borderColor: "white" },
                    },
                  }}
                />
                <TextField
                  label="Пароль"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  required
                  disabled={loading}
                  onKeyPress={(e) => e.key === "Enter" && !loading && (activeTab === 0 ? onLogin() : onRegister())}
                  sx={{
                    "& .MuiInputLabel-root": { color: "rgba(255, 255, 255, 0.7)" },
                    "& .MuiOutlinedInput-root": {
                      color: "white",
                      "& fieldset": { borderColor: "rgba(255, 255, 255, 0.3)" },
                      "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.5)" },
                      "&.Mui-focused fieldset": { borderColor: "white" },
                    },
                  }}
                />
                {activeTab === 1 && (
                  <TextField
                    label="Подтвердите пароль"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    fullWidth
                    required
                    disabled={loading}
                    onKeyPress={(e) => e.key === "Enter" && !loading && onRegister()}
                    sx={{
                      "& .MuiInputLabel-root": { color: "rgba(255, 255, 255, 0.7)" },
                      "& .MuiOutlinedInput-root": {
                        color: "white",
                        "& fieldset": { borderColor: "rgba(255, 255, 255, 0.3)" },
                        "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.5)" },
                        "&.Mui-focused fieldset": { borderColor: "white" },
                      },
                    }}
                  />
                )}
                <Button
                  variant="contained"
                  onClick={activeTab === 0 ? onLogin : onRegister}
                  fullWidth
                  size="large"
                  disabled={loading}
                  sx={{
                    mt: 1,
                    py: 1.5,
                    bgcolor: "white",
                    color: "#1a1a1a",
                    fontWeight: 600,
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.9)",
                    },
                    "&:disabled": {
                      bgcolor: "rgba(255, 255, 255, 0.3)",
                      color: "rgba(255, 255, 255, 0.5)",
                    },
                  }}
                >
                  {loading ? (activeTab === 0 ? "Вход..." : "Регистрация...") : (activeTab === 0 ? "Войти" : "Зарегистрироваться")}
                </Button>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2, borderColor: "rgba(255, 255, 255, 0.2)" }}>
                  <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", px: 1 }}>
                    Быстрый вход
                  </Typography>
                </Divider>
                <Box sx={{ display: "flex", gap: 1.5, flexDirection: { xs: "column", sm: "row" } }}>
                  <Button
                    variant="outlined"
                    size="medium"
                    onClick={quickLoginAsAdmin}
                    disabled={loading}
                    startIcon={<AdminPanelSettings />}
                    fullWidth
                    sx={{
                      textTransform: "none",
                      borderColor: "rgba(255, 255, 255, 0.3)",
                      color: "rgba(255, 255, 255, 0.9)",
                      fontWeight: 600,
                      "&:hover": {
                        borderColor: "rgba(244, 67, 54, 0.8)",
                        background: "rgba(244, 67, 54, 0.2)",
                        color: "white",
                      },
                      "&:disabled": {
                        borderColor: "rgba(255, 255, 255, 0.1)",
                        color: "rgba(255, 255, 255, 0.3)",
                      },
                    }}
                  >
                    Войти как Админ
                  </Button>
                  <Button
                    variant="outlined"
                    size="medium"
                    onClick={quickLoginAsUser}
                    disabled={loading}
                    startIcon={<Person />}
                    fullWidth
                    sx={{
                      textTransform: "none",
                      borderColor: "rgba(255, 255, 255, 0.3)",
                      color: "rgba(255, 255, 255, 0.9)",
                      fontWeight: 600,
                      "&:hover": {
                        borderColor: "rgba(33, 150, 243, 0.8)",
                        background: "rgba(33, 150, 243, 0.2)",
                        color: "white",
                      },
                      "&:disabled": {
                        borderColor: "rgba(255, 255, 255, 0.1)",
                        color: "rgba(255, 255, 255, 0.3)",
                      },
                    }}
                  >
                    Войти как Пользователь
                  </Button>
                </Box>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => nav("/pulse")}
                  fullWidth
                  sx={{
                    textTransform: "none",
                    color: "rgba(255, 255, 255, 0.7)",
                    mt: 1.5,
                    fontSize: "0.875rem",
                    "&:hover": {
                      color: "rgba(255, 255, 255, 0.9)",
                      background: "rgba(255, 255, 255, 0.05)",
                    },
                  }}
                >
                  Продолжить без входа
                </Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
      </Box>
    </Box>
  );
}
