import { useState } from "react";
import { Box, Button, Card, CardContent, TextField, Typography, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { loginApi } from "../api/auth";
import { useAuthStore } from "../store/auth";
import { motion } from "framer-motion";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const nav = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    setErr(null);
    setSuccess(null);
    if (!email || !password) {
      setErr("Заполните все поля");
      return;
    }
    setLoading(true);
    try {
      const data = await loginApi(email, password);
      setAuth(data.access_token, data.role as "user" | "admin");
      nav(data.role === "admin" ? "/admin" : "/dashboard");
    } catch (e: any) {
      setErr((e?.message || e?.response?.data?.message) ?? "Ошибка входа. Проверьте данные.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box className={styles.loginPage}>
      {/* Radar Background */}
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
                    background: "linear-gradient(135deg, #2196f3 0%, #1976d2 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Вход
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Войдите в систему для доступа к карте безопасности
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
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  required
                  disabled={loading}
                  onKeyPress={(e) => e.key === "Enter" && !loading && onLogin()}
                />
                <TextField
                  label="Пароль"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  required
                  disabled={loading}
                  onKeyPress={(e) => e.key === "Enter" && !loading && onLogin()}
                />
                <Button
                  variant="contained"
                  onClick={onLogin}
                  fullWidth
                  size="large"
                  disabled={loading}
                  sx={{
                    mt: 1,
                    py: 1.5,
                    background: "linear-gradient(135deg, #2196f3 0%, #1976d2 100%)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #1976d2 0%, #2196f3 100%)",
                    },
                    "&:disabled": {
                      opacity: 0.6,
                    },
                  }}
                >
                  {loading ? "Вход..." : "Войти"}
                </Button>
              </Box>

              <Box sx={{ mt: 3, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Нет аккаунта?{" "}
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => nav("/register")}
                    sx={{
                      textTransform: "none",
                      color: "primary.main",
                      fontWeight: 600,
                    }}
                  >
                    Зарегистрироваться
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
