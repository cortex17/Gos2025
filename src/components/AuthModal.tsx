import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, TextField, Button, Tabs, Tab, Alert, Box, Typography } from "@mui/material";
import { loginApi, registerApi } from "../api/auth";
import { useAuthStore } from "../store/auth";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  action?: string; // "report", "vote", "sos"
}

export default function AuthModal({ open, onClose, onSuccess, action }: AuthModalProps) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const getActionText = () => {
    switch (action) {
      case "report": return "создать отчет";
      case "vote": return "проголосовать";
      case "sos": return "отправить SOS";
      default: return "выполнить действие";
    }
  };

  const handleLogin = async () => {
    setErr(null);
    if (!email || !password) {
      setErr("Заполните все поля");
      return;
    }
    try {
      const data = await loginApi(email, password);
      setAuth(data.access_token, data.role as "user" | "admin");
      onSuccess?.();
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Ошибка входа");
    }
  };

  const handleRegister = async () => {
    setErr(null);
    if (!email || !password || !name) {
      setErr("Заполните все поля");
      return;
    }
    if (password !== confirmPassword) {
      setErr("Пароли не совпадают");
      return;
    }
    try {
      const data = await registerApi(email, password, name);
      setAuth(data.access_token, data.role as "user" | "admin");
      onSuccess?.();
      onClose();
    } catch (e: any) {
      console.error("[AuthModal] Registration error:", e);
      const errorMessage = e?.message || 
        e?.response?.data?.detail || 
        e?.response?.data?.message ||
        "Ошибка регистрации. Попробуйте снова.";
      setErr(errorMessage);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Требуется авторизация
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Войдите или зарегистрируйтесь, чтобы {getActionText()}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setErr(null); }} sx={{ mb: 3 }}>
          <Tab label="Вход" />
          <Tab label="Регистрация" />
        </Tabs>

        {err && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {err}
          </Alert>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {tab === 1 && (
            <TextField
              label="Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />
          )}
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
          />
          <TextField
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
          />
          {tab === 1 && (
            <TextField
              label="Подтвердите пароль"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
            />
          )}
          <Button
            variant="contained"
            onClick={tab === 0 ? handleLogin : handleRegister}
            fullWidth
            size="large"
            sx={{ mt: 1 }}
          >
            {tab === 0 ? "Войти" : "Зарегистрироваться"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

