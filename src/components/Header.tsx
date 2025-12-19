import { useEffect, useState } from "react";
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Container, 
  Tooltip,
} from "@mui/material";
import { 
  RadioButtonChecked,
  Map as MapIcon,
  Assessment,
  Person,
  AdminPanelSettings,
  Logout,
  Home,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import ThemeToggle from "./ThemeToggle";
import { motion } from "framer-motion";

const MotionButton = motion(Button);
const MotionBox = motion(Box);

interface HeaderProps {
  showAuthButtons?: boolean;
}

export default function Header({ showAuthButtons = true }: HeaderProps) {
  const nav = useNavigate();
  const location = useLocation();
  const { role, logout, token } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => {
    if (path === "/dashboard" && location.pathname === "/map") return true;
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const navItems = [
    { 
      label: "Pulse", 
      path: "/pulse", 
      tooltip: "Живая лента событий и инцидентов",
      icon: RadioButtonChecked,
      color: "#f44336",
    },
    { 
      label: "Карта", 
      path: "/dashboard", 
      tooltip: "Интерактивная карта безопасности",
      icon: MapIcon,
      color: "#2196f3",
    },
    { 
      label: "Отчеты", 
      path: "/reports", 
      tooltip: "Список всех отчетов и инцидентов",
      icon: Assessment,
      color: "#ff9800",
    },
    { 
      label: "Профиль", 
      path: "/profile", 
      tooltip: "Ваш профиль и статистика",
      icon: Person,
      color: "#9c27b0",
    },
  ];

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{ 
        top: 0,
        left: 0,
        right: 0,
        width: "100%",
        zIndex: "9999 !important", // Очень высокий z-index для отображения поверх всех элементов
        opacity: "1 !important", // Всегда видимый
        visibility: "visible !important", // Всегда видимый
        display: "block !important", // Всегда отображается
        position: "fixed !important", // Фиксированное позиционирование
        background: scrolled 
          ? "linear-gradient(135deg, rgba(33, 33, 33, 0.95) 0%, rgba(66, 66, 66, 0.95) 100%)"
          : "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%)",
        backdropFilter: "blur(20px)",
        borderBottom: scrolled ? "none" : "1px solid",
        borderColor: "divider",
        transition: "background 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.05)",
        // Гарантируем, что хедер всегда видим при любых условиях
        "&:hover": {
          opacity: "1 !important",
          visibility: "visible !important",
          display: "block !important",
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: scrolled 
            ? "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)"
            : "none",
          pointerEvents: "none",
        },
      }}
    >
      <Container maxWidth="xl">
        <Toolbar 
          component="header"
          sx={{ 
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: { xs: 2, sm: 3, md: 4 }, // Увеличенные общие отступы между секциями
            px: { xs: 3, sm: 4, md: 5 }, // Увеличенные горизонтальные отступы контейнера
            py: { xs: 1.5, sm: 2 },
            minHeight: { xs: "70px !important", sm: "80px !important" },
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Логотип */}
          <Tooltip title="Главная страница" arrow>
            <MotionBox
              onClick={() => nav("/dashboard")}
              onHoverStart={() => setLogoHovered(true)}
              onHoverEnd={() => setLogoHovered(false)}
              whileHover={{ 
                scale: 1.08,
                x: 5,
              }}
              whileTap={{ scale: 0.95 }}
              sx={{ 
                cursor: "pointer",
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 1,
                marginRight: { xs: 5, sm: 6, md: 8 }, // Увеличенный отступ между логотипом и элементами меню (64px на больших экранах)
                flexShrink: 0, // Предотвращаем сжатие логотипа
              }}
            >
              <motion.div
                animate={{
                  rotate: logoHovered ? [0, -10, 10, -10, 0] : 0,
                  scale: logoHovered ? 1.1 : 1,
                }}
                transition={{ duration: 0.5 }}
              >
                <Home 
                  sx={{ 
                    fontSize: { xs: 28, sm: 32, md: 36 },
                    color: scrolled ? "white" : "#f44336",
                    filter: logoHovered ? "drop-shadow(0 0 12px rgba(244, 67, 54, 0.6))" : "none",
                    transition: "all 0.3s ease",
                  }} 
                />
              </motion.div>
              <Typography
                variant="h5"
                sx={{ 
                  fontWeight: 900,
                  fontSize: { xs: "1.5rem", sm: "1.875rem", md: "2.25rem" },
                  background: scrolled
                    ? "linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)"
                    : "linear-gradient(135deg, #f44336 0%, #e53935 50%, #d32f2f 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontFamily: "'Inter', 'Roboto', sans-serif",
                  letterSpacing: "-0.03em",
                  position: "relative",
                  textShadow: logoHovered ? "0 0 20px rgba(244, 67, 54, 0.4)" : "none",
                  transition: "all 0.3s ease",
                }}
              >
                SOSMap
              </Typography>
            </MotionBox>
          </Tooltip>

          {/* Навигационные кнопки */}
          <Box
            component="nav"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 2, sm: 2.5, md: 3 }, // Увеличенные равномерные отступы между элементами навигации (24px на больших экранах)
              flex: 1,
              justifyContent: { xs: "flex-start", sm: "center" },
              marginLeft: { xs: 2, sm: 3 }, // Дополнительный отступ от логотипа
            }}
          >
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Tooltip 
                key={item.path} 
                title={item.tooltip} 
                arrow 
                placement="bottom"
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: item.color,
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    },
                  },
                }}
              >
                <MotionButton
                  variant="text"
                  onClick={() => nav(item.path)}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  whileHover={{ 
                    scale: 1.1,
                    y: -4,
                  }}
                  whileTap={{ scale: 0.95 }}
                  sx={{
                    textTransform: "none",
                    fontWeight: active ? 700 : 600,
                    fontSize: { xs: "0.8rem", sm: "0.9rem", md: "1rem" },
                    color: active 
                      ? (scrolled ? "white" : item.color)
                      : (scrolled ? "rgba(255,255,255,0.8)" : "text.primary"),
                    position: "relative",
                    px: { xs: 1, sm: 1.5, md: 2 },
                    py: { xs: 0.75, sm: 1 },
                    borderRadius: 3,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    bgcolor: active 
                      ? (scrolled 
                          ? "rgba(255,255,255,0.2)" 
                          : `${item.color}15`)
                      : "transparent",
                    border: active 
                      ? `2px solid ${scrolled ? "rgba(255,255,255,0.3)" : item.color}`
                      : "2px solid transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      bottom: -2,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: active ? "60%" : "0%",
                      height: 3,
                      background: `linear-gradient(90deg, ${item.color} 0%, ${item.color}80 100%)`,
                      borderRadius: "2px 2px 0 0",
                      transition: "width 0.3s ease",
                    },
                    "&:hover": {
                      bgcolor: scrolled 
                        ? "rgba(255,255,255,0.15)" 
                        : `${item.color}20`,
                      borderColor: scrolled ? "rgba(255,255,255,0.4)" : item.color,
                      boxShadow: `0 4px 16px ${item.color}30`,
                      "&::before": {
                        width: "60%",
                      },
                    },
                  }}
                >
                  <Icon 
                    sx={{ 
                      fontSize: { xs: 18, sm: 20, md: 22 },
                      color: active 
                        ? (scrolled ? "white" : item.color)
                        : "inherit",
                      transition: "all 0.3s ease",
                    }} 
                  />
                  <Box
                    component="span"
                    sx={{
                      display: { xs: "none", sm: "inline" },
                    }}
                  >
                    {item.label}
                  </Box>
                </MotionButton>
              </Tooltip>
            );
          })}
          </Box>

          {/* Кнопка Админ */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 2, sm: 2.5, md: 3 }, // Увеличенные отступы между правыми элементами
              marginLeft: { xs: 4, sm: 5 }, // Увеличенный отступ от навигации
              flexShrink: 0, // Предотвращаем сжатие правых элементов
            }}
          >
            {role === "admin" && showAuthButtons && (
              <Tooltip title="Панель администратора" arrow>
                <MotionButton
                  variant="outlined"
                  onClick={() => nav("/admin")}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ 
                    scale: 1.1,
                    rotate: [0, -5, 5, -5, 0],
                  }}
                  whileTap={{ scale: 0.9 }}
                  sx={{
                    textTransform: "none",
                    borderColor: scrolled ? "rgba(255,255,255,0.5)" : "error.main",
                    color: scrolled ? "white" : "error.main",
                    fontWeight: 700,
                    px: 2,
                    borderRadius: 2,
                    bgcolor: scrolled ? "rgba(244, 67, 54, 0.2)" : "transparent",
                    "&:hover": {
                      borderColor: "error.dark",
                      bgcolor: scrolled ? "rgba(244, 67, 54, 0.3)" : "error.light",
                      color: "error.dark",
                      boxShadow: "0 4px 16px rgba(244, 67, 54, 0.4)",
                    },
                  }}
                >
                  <AdminPanelSettings sx={{ mr: 0.5, fontSize: 18 }} />
                  <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                    Админ
                  </Box>
                </MotionButton>
              </Tooltip>
            )}

            {/* Быстрый вход в админ панель (всегда видимый) */}
            <Tooltip title="Быстрый вход в админ панель" arrow>
              <MotionButton
                variant="contained"
                color="error"
                size="small"
                onClick={() => nav("/admin-login")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  px: 1.5,
                  py: 0.5,
                  minWidth: "auto",
                  fontSize: "0.75rem",
                  display: { xs: "none", sm: "flex" },
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <AdminPanelSettings sx={{ fontSize: 16 }} />
                <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
                  Админ
                </Box>
              </MotionButton>
            </Tooltip>

            {/* Переключатель темы */}
            <ThemeToggle />

            {/* Кнопки авторизации или Выход */}
            {showAuthButtons && (
              <>
                {token ? (
                  <Tooltip title="Выйти из аккаунта" arrow>
                    <MotionButton
                      variant="outlined"
                      onClick={() => {
                        logout();
                        nav("/login");
                      }}
                      whileHover={{ 
                        scale: 1.1,
                        rotate: [0, -10, 10, 0],
                      }}
                      whileTap={{ scale: 0.9 }}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        borderColor: scrolled ? "rgba(255,255,255,0.4)" : "divider",
                        color: scrolled ? "white" : "text.primary",
                        px: 2,
                        borderRadius: 2,
                        transition: "all 0.3s ease",
                        "&:hover": {
                          borderColor: "error.main",
                          bgcolor: scrolled ? "rgba(244, 67, 54, 0.2)" : "error.light",
                          color: "error.main",
                          boxShadow: "0 4px 16px rgba(244, 67, 54, 0.3)",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <Logout sx={{ mr: 0.5, fontSize: 18 }} />
                      <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                        Выход
                      </Box>
                    </MotionButton>
                  </Tooltip>
                ) : (
                  <>
                    <Button
                      variant="text"
                      onClick={() => nav("/login")}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        color: scrolled ? "white" : "text.primary",
                      }}
                    >
                      Войти
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => nav("/register")}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        bgcolor: scrolled ? "rgba(255,255,255,0.2)" : "primary.main",
                        color: scrolled ? "white" : "white",
                        "&:hover": {
                          bgcolor: scrolled ? "rgba(255,255,255,0.3)" : "primary.dark",
                        },
                      }}
                    >
                      Регистрация
                    </Button>
                  </>
                )}
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

