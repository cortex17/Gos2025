import { useState, useEffect } from "react";
import { Box, Button, Card, CardContent, TextField, Typography, Alert, Tabs, Tab } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { loginApi, registerApi } from "../api/auth";
import { useAuthStore } from "../store/auth";
import { motion } from "framer-motion";
import styles from "./AuthPage.module.css";

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
      setAuth(data.access_token, data.role as "user" | "admin");
      nav(data.role === "admin" ? "/admin" : "/pulse");
    } catch (e: any) {
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

  return (
    <Box className={styles.authPage}>
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

              <Box sx={{ mt: 3, textAlign: "center" }}>
                <Button
                  variant="outlined"
                  size="medium"
                  onClick={() => nav("/pulse")}
                  fullWidth
                  sx={{
                    textTransform: "none",
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    color: "rgba(255, 255, 255, 0.9)",
                    "&:hover": {
                      borderColor: "rgba(255, 255, 255, 0.5)",
                      background: "rgba(255, 255, 255, 0.1)",
                    },
                  }}
                >
                  Перейти в режим просмотра
                </Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
    </Box>
  );
}
