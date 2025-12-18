import { useState } from "react";
import { Box, Button, Card, CardContent, TextField, Typography, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { registerApi } from "../api/auth";
import { useAuthStore } from "../store/auth";
import { motion } from "framer-motion";
import styles from "./RegisterPage.module.css";

export default function RegisterPage() {
  const nav = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onRegister() {
    setErr(null);
    setSuccess(null);
    
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
      setSuccess("Регистрация успешна! Выполняется вход...");
      setTimeout(() => {
        nav(data.role === "admin" ? "/admin" : "/dashboard");
      }, 1000);
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
    <Box className={styles.registerPage}>
      {/* Night City Background is in CSS via ::before (street lights) and ::after (vignette) */}
      {/* Grain texture is applied via background-image in CSS */}
      
      {/* Radar Background - overlays night city */}
      <Box className={styles.radarContainer}>
        <Box className={styles.radarCircle}>
          {/* Radar Rings */}
          <Box className={styles.radarRing} style={{ width: "100%", height: "100%" }} />
          <Box className={styles.radarRing} style={{ width: "75%", height: "75%" }} />
          <Box className={styles.radarRing} style={{ width: "50%", height: "50%" }} />
          <Box className={styles.radarRing} style={{ width: "25%", height: "25%" }} />
          
          {/* Cross Axes (Crosshair) */}
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
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Регистрация
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Создайте аккаунт для доступа к карте безопасности
                </Typography>
              </Box>

              {err && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {err}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                  {success}
                </Alert>
              )}

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <TextField
                  label="Имя"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  required
                  disabled={loading}
                  onKeyPress={(e) => e.key === "Enter" && !loading && onRegister()}
                />
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  required
                  disabled={loading}
                  onKeyPress={(e) => e.key === "Enter" && !loading && onRegister()}
                />
                <TextField
                  label="Пароль"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  required
                  disabled={loading}
                  onKeyPress={(e) => e.key === "Enter" && !loading && onRegister()}
                />
                <TextField
                  label="Подтвердите пароль"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  fullWidth
                  required
                  disabled={loading}
                  onKeyPress={(e) => e.key === "Enter" && !loading && onRegister()}
                />
                <Button
                  variant="contained"
                  onClick={onRegister}
                  fullWidth
                  size="large"
                  disabled={loading}
                  sx={{
                    mt: 1,
                    py: 1.5,
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
                    },
                    "&:disabled": {
                      opacity: 0.6,
                    },
                  }}
                >
                  {loading ? "Регистрация..." : "Зарегистрироваться"}
                </Button>
              </Box>

              <Box sx={{ mt: 3, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Уже есть аккаунт?{" "}
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => nav("/login")}
                    sx={{
                      textTransform: "none",
                      color: "primary.main",
                      fontWeight: 600,
                    }}
                  >
                    Войти
                  </Button>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
    </Box>
  );
}

