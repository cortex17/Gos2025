import { AppBar, Toolbar, Typography, Button, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import ThemeToggle from "./ThemeToggle";

export default function SimpleNav() {
  const nav = useNavigate();
  const { token, logout } = useAuthStore();

  return (
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
              background: "linear-gradient(135deg, #2196f3 0%, #1976d2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
            onClick={() => nav("/pulse")}
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
          {token ? (
            <>
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
            </>
          ) : (
            <>
              <ThemeToggle />
              <Button
                variant="contained"
                onClick={() => nav("/login")}
                sx={{ textTransform: "none" }}
              >
                Войти
              </Button>
            </>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}

