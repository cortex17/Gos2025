import { Box, Card, CardContent, Typography, Chip, Grid, Avatar, LinearProgress, Container } from "@mui/material";
import { Person, Security, VpnKey, AdminPanelSettings, PersonOutline, TrendingUp, CheckCircle, Star, VerifiedUser, Block } from "@mui/icons-material";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/auth";
import { useQuery } from "@tanstack/react-query";
import { listApprovedReports } from "../api/reports";
import { getReputation } from "../api/reputation";
import { useEffect, useState } from "react";

const MotionCard = motion(Card);
const MotionAvatar = motion(Avatar);
const MotionBox = motion(Box);
const MotionTypography = motion(Typography);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
    },
  },
};

const avatarVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: { 
    scale: 1, 
    rotate: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 15,
    },
  },
} as const;

// const numberVariants = {
//   hidden: { opacity: 0, scale: 0 },
//   visible: (custom: number) => ({
//     opacity: 1,
//     scale: 1,
//       transition: {
//         delay: custom * 0.1,
//         type: "spring" as const,
//         stiffness: 200,
//       },
//   }),
// };

function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(increment * step, value);
      setDisplayValue(Math.floor(current));
      
      if (step >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue}</span>;
}

export default function ProfilePage() {
  const { role, token } = useAuthStore();
  
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["reports", "approved"],
    queryFn: listApprovedReports,
  });

  const { data: reputation } = useQuery({
    queryKey: ["reputation"],
    queryFn: () => getReputation(),
    enabled: !!token,
  });

  const getRoleLabel = (r: string | null) => {
    if (r === "admin") return "Администратор";
    if (r === "user") return "Пользователь";
    return "Не определено";
  };

  // const getRoleColor = (r: string | null) => {
  //   if (r === "admin") return "error";
  //   if (r === "user") return "primary";
  //   return "default";
  // };

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          pt: { xs: 8, md: 12 },
          pb: { xs: 6, md: 10 },
          background: role === "admin"
            ? "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ff6b6b 100%)"
            : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)",
          },
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Box sx={{ position: "relative", zIndex: 1, textAlign: "center", color: "white" }}>
              <MotionAvatar
                variants={avatarVariants}
                initial="hidden"
                animate="visible"
                sx={{
                  width: { xs: 100, md: 140 },
                  height: { xs: 100, md: 140 },
                  mx: "auto",
                  mb: 3,
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  border: "4px solid rgba(255, 255, 255, 0.3)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                }}
              >
                {role === "admin" ? (
                  <AdminPanelSettings sx={{ fontSize: { xs: 50, md: 70 } }} />
                ) : (
                  <Person sx={{ fontSize: { xs: 50, md: 70 } }} />
                )}
              </MotionAvatar>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    mb: 2,
                    fontSize: { xs: "2.5rem", md: "3.5rem" },
                    textShadow: "0 2px 20px rgba(0,0,0,0.2)",
                  }}
                >
                  Профиль пользователя
                </Typography>
              </motion.div>
              
              <MotionBox
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Chip
                  label={getRoleLabel(role)}
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.25)",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "1rem",
                    px: 2,
                    py: 3,
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                  }}
                  icon={role === "admin" ? <AdminPanelSettings /> : <PersonOutline />}
                />
              </MotionBox>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Grid container spacing={4}>
            {/* Статистика */}
            <Grid item xs={12} md={4}>
              <MotionCard
                variants={cardVariants}
                whileHover="hover"
                sx={{
                  height: "100%",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                    <TrendingUp sx={{ fontSize: 32 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      Статистика
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                      Всего одобренных отчетов
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                      <MotionTypography
                        variant="h2"
                        sx={{ fontWeight: 800 }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          delay: 0.5,
                          type: "spring",
                          stiffness: 200,
                        }}
                      >
                        <AnimatedCounter value={reports.length} />
                      </MotionTypography>
                      <Typography variant="h5" sx={{ opacity: 0.8 }}>
                        отчетов
                      </Typography>
                    </Box>
                    {isLoading && (
                      <LinearProgress
                        sx={{
                          mt: 2,
                          bgcolor: "rgba(255,255,255,0.2)",
                          "& .MuiLinearProgress-bar": {
                            bgcolor: "white",
                          },
                        }}
                      />
                    )}
                  </Box>

                  {role === "admin" && (
                    <MotionBox
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        bgcolor: "rgba(255, 255, 255, 0.15)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <VerifiedUser />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Администратор
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Полный доступ к системе модерации
                      </Typography>
                    </MotionBox>
                  )}
                </CardContent>
              </MotionCard>
            </Grid>

            {/* Информация о профиле */}
            <Grid item xs={12} md={8}>
              <MotionCard
                variants={cardVariants}
                whileHover="hover"
                sx={{ height: "100%" }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 4 }}>
                    Информация о профиле
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <MotionBox
                        sx={{
                          p: 3,
                          borderRadius: 2,
                          bgcolor: "background.default",
                          border: "2px solid",
                          borderColor: "divider",
                          height: "100%",
                        }}
                        whileHover={{ scale: 1.02, borderColor: "primary.main" }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                          <Security color="primary" sx={{ fontSize: 32 }} />
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Роль в системе
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {role ?? "Не авторизован"}
                            </Typography>
                          </Box>
                        </Box>
                      </MotionBox>
                    </Grid>

                    {reputation && (
                      <Grid item xs={12} sm={6}>
                        <MotionBox
                          sx={{
                            p: 3,
                            borderRadius: 2,
                            bgcolor: reputation.canCreateReports ? "success.light" : "error.light",
                            border: "2px solid",
                            borderColor: reputation.canCreateReports ? "success.main" : "error.main",
                            height: "100%",
                          }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                            {reputation.canCreateReports ? (
                              <Star color="success" sx={{ fontSize: 32 }} />
                            ) : (
                              <Block color="error" sx={{ fontSize: 32 }} />
                            )}
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Репутация
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {reputation.score}/100
                              </Typography>
                            </Box>
                          </Box>
                          {!reputation.canCreateReports && (
                            <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
                              Создание отчетов заблокировано
                            </Typography>
                          )}
                        </MotionBox>
                      </Grid>
                    )}

                    <Grid item xs={12} sm={6}>
                      <MotionBox
                        sx={{
                          p: 3,
                          borderRadius: 2,
                          bgcolor: "background.default",
                          border: "2px solid",
                          borderColor: "divider",
                          height: "100%",
                        }}
                        whileHover={{ scale: 1.02, borderColor: "primary.main" }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                          <VpnKey color="primary" sx={{ fontSize: 32 }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Токен доступа
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: "monospace",
                                fontSize: "0.9rem",
                                wordBreak: "break-all",
                              }}
                            >
                              {token ? `${token.slice(0, 16)}...${token.slice(-12)}` : "Отсутствует"}
                            </Typography>
                          </Box>
                        </Box>
                      </MotionBox>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <MotionBox
                        sx={{
                          p: 3,
                          borderRadius: 2,
                          bgcolor: "background.default",
                          border: "2px solid",
                          borderColor: "divider",
                        }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Star color="primary" sx={{ fontSize: 32 }} />
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Версия приложения
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              SOSMap v1.0
                            </Typography>
                          </Box>
                        </Box>
                      </MotionBox>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <MotionBox
                        sx={{
                          p: 3,
                          borderRadius: 2,
                          bgcolor: "background.default",
                          border: "2px solid",
                          borderColor: "divider",
                        }}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <CheckCircle color="primary" sx={{ fontSize: 32 }} />
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Статус авторизации
                            </Typography>
                            <Chip
                              label={token ? "Авторизован" : "Не авторизован"}
                              color={token ? "success" : "default"}
                              icon={token ? <CheckCircle /> : undefined}
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        </Box>
                      </MotionBox>
                    </Grid>
                  </Grid>
                </CardContent>
              </MotionCard>
            </Grid>
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
}

