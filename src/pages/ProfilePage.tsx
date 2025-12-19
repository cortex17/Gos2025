import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Chip, 
  Grid, 
  Avatar, 
  LinearProgress, 
  Container,
  IconButton,
  Tooltip,
  Badge,
  CircularProgress,
} from "@mui/material";
import { 
  Person, 
  Security, 
  AdminPanelSettings, 
  PersonOutline, 
  CheckCircle, 
  Star, 
  VerifiedUser, 
  Block,
  CameraAlt,
  EmojiEvents,
  Timeline,
  LocationOn,
  AutoAwesome,
  WorkspacePremium,
  Warning,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/auth";
import { useQuery } from "@tanstack/react-query";
import { listApprovedReports } from "../api/reports";
import { getReputation } from "../api/reputation";
import { useEffect, useState, useRef } from "react";
import ActivityChart from "../components/ActivityChart";

const MotionCard = motion(Card);
const MotionAvatar = motion(Avatar);
const MotionBox = motion(Box);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
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

// Mock данные для наград
const badges = [
  { id: "first", name: "Первый шаг", icon: Star, earned: true, description: "Создал первый отчёт", color: "#FFD700" },
  { id: "verified5", name: "Проверенный", icon: VerifiedUser, earned: true, description: "5 отчётов подтверждены", color: "#4CAF50" },
  { id: "helper", name: "Помощник", icon: CheckCircle, earned: true, description: "Подтвердил 10 инцидентов", color: "#2196F3" },
  { id: "night", name: "Ночной страж", icon: Warning, earned: false, description: "Отчёты ночью", color: "#9C27B0" },
  { id: "sos", name: "SOS Герой", icon: LocationOn, earned: false, description: "Отправил 5 SOS", color: "#F44336" },
  { id: "gold", name: "Золотой член", icon: WorkspacePremium, earned: false, description: "Достиг Gold уровня", color: "#FF9800" },
];

// Mock данные для активности (7 дней)
const getActivityData = () => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
      count: Math.floor(Math.random() * 8) + 1,
    };
  });
};

export default function ProfilePage() {
  const { role, token } = useAuthStore();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem("profile_avatar") || null;
    } catch {
      return null;
    }
  });
  const [userName] = useState<string>(() => {
    try {
      return localStorage.getItem("profile_name") || "Пользователь";
    } catch {
      return "Пользователь";
    }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["reports", "approved"],
    queryFn: listApprovedReports,
  });

  const { data: reputation } = useQuery({
    queryKey: ["reputation"],
    queryFn: () => getReputation(),
    enabled: !!token,
  });

  const activityData = getActivityData();
  const earnedBadges = badges.filter(b => b.earned);
  const totalReports = reports.length;
  const verifiedReports = reports.filter(r => r.status === "approved").length;
  const reputationScore = reputation?.score || 0;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarUrl(result);
        try {
          localStorage.setItem("profile_avatar", result);
        } catch (err) {
          console.error("Failed to save avatar:", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getRoleLabel = (r: string | null) => {
    if (r === "admin") return "Администратор";
    if (r === "user") return "Пользователь";
    return "Не определено";
  };

  const getReputationLevel = (score: number) => {
    if (score >= 80) return { level: "Gold", color: "#FFD700", next: 100 };
    if (score >= 50) return { level: "Silver", color: "#C0C0C0", next: 80 };
    return { level: "Bronze", color: "#CD7F32", next: 50 };
  };

  const reputationLevel = getReputationLevel(reputationScore);
  const progressToNext = ((reputationScore / reputationLevel.next) * 100).toFixed(0);

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
              {/* Аватар с возможностью загрузки */}
              <Box sx={{ position: "relative", display: "inline-block", mb: 3 }}>
                <MotionAvatar
                  variants={avatarVariants}
                  initial="hidden"
                  animate="visible"
                  src={avatarUrl || undefined}
                  sx={{
                    width: { xs: 120, md: 160 },
                    height: { xs: 120, md: 160 },
                    mx: "auto",
                    bgcolor: "rgba(255, 255, 255, 0.2)",
                    border: "4px solid rgba(255, 255, 255, 0.3)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "scale(1.05)",
                      borderColor: "rgba(255, 255, 255, 0.5)",
                    },
                  }}
                  onClick={handleAvatarClick}
                >
                  {!avatarUrl && (role === "admin" ? (
                    <AdminPanelSettings sx={{ fontSize: { xs: 60, md: 80 } }} />
                  ) : (
                    <Person sx={{ fontSize: { xs: 60, md: 80 } }} />
                  ))}
                </MotionAvatar>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleAvatarChange}
                />
                <Tooltip title="Нажмите, чтобы загрузить фото" arrow>
                  <IconButton
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      right: { xs: "calc(50% - 60px)", md: "calc(50% - 80px)" },
                      bgcolor: "primary.main",
                      color: "white",
                      border: "3px solid white",
                      "&:hover": {
                        bgcolor: "primary.dark",
                        transform: "scale(1.1)",
                      },
                      transition: "all 0.3s ease",
                    }}
                    onClick={handleAvatarClick}
                  >
                    <CameraAlt />
                  </IconButton>
                </Tooltip>
              </Box>
              
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
                    mb: 1,
                    fontSize: { xs: "2.5rem", md: "3.5rem" },
                    textShadow: "0 2px 20px rgba(0,0,0,0.2)",
                    fontFamily: "'Inter', 'Roboto', sans-serif",
                  }}
                >
                  {userName}
                </Typography>
              </motion.div>
              
              <MotionBox
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                sx={{ display: "flex", gap: 1, justifyContent: "center", flexWrap: "wrap", mb: 2 }}
              >
                <Chip
                  label={getRoleLabel(role)}
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.25)",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    px: 2,
                    py: 2.5,
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                  }}
                  icon={role === "admin" ? <AdminPanelSettings /> : <PersonOutline />}
                />
                {reputation && (
                  <Chip
                    label={`Репутация: ${reputationScore}/100`}
                    sx={{
                      bgcolor: "rgba(255, 255, 255, 0.25)",
                      color: "white",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      px: 2,
                      py: 2.5,
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                    }}
                    icon={<Star />}
                  />
                )}
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
            {/* Статистика с графиком */}
            <Grid item xs={12} md={8}>
              <MotionCard
                variants={cardVariants}
                whileHover="hover"
                sx={{
                  height: "100%",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: 200,
                    height: 200,
                    background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
                    borderRadius: "50%",
                    transform: "translate(30%, -30%)",
                  }}
                />
                <CardContent sx={{ p: 4, position: "relative", zIndex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                    <Timeline sx={{ fontSize: 32 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: "'Inter', 'Roboto', sans-serif" }}>
                      Статистика активности
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={6} sm={3}>
                      <MotionBox
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
                          <AnimatedCounter value={totalReports} />
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Всего отчётов
                        </Typography>
                      </MotionBox>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <MotionBox
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
                          <AnimatedCounter value={verifiedReports} />
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Подтверждено
                        </Typography>
                      </MotionBox>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <MotionBox
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
                          {earnedBadges.length}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Наград получено
                        </Typography>
                      </MotionBox>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <MotionBox
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
                          {reputationScore}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Репутация
                        </Typography>
                      </MotionBox>
                    </Grid>
                  </Grid>

                  {/* График активности */}
                  <Box sx={{ mt: 4, bgcolor: "rgba(255, 255, 255, 0.1)", borderRadius: 2, p: 2, backdropFilter: "blur(10px)" }}>
                    <Typography variant="body2" sx={{ mb: 2, opacity: 0.9, fontWeight: 600 }}>
                      Активность за последние 7 дней
                    </Typography>
                    <ActivityChart data={activityData} height={100} />
                  </Box>

                  {isLoading && (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                      <CircularProgress sx={{ color: "white" }} size={24} />
                    </Box>
                  )}
                </CardContent>
              </MotionCard>
            </Grid>

            {/* Прогресс репутации */}
            <Grid item xs={12} md={4}>
              <MotionCard
                variants={cardVariants}
                whileHover="hover"
                sx={{ height: "100%" }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                    <AutoAwesome color="primary" sx={{ fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: "'Inter', 'Roboto', sans-serif" }}>
                      Уровень репутации
                    </Typography>
                  </Box>
                  
                  <Box sx={{ textAlign: "center", mb: 3 }}>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                    >
                      <Chip
                        label={reputationLevel.level}
                        sx={{
                          fontSize: "1.2rem",
                          fontWeight: 700,
                          height: 40,
                          px: 3,
                          bgcolor: reputationLevel.color,
                          color: "white",
                          boxShadow: `0 4px 12px ${reputationLevel.color}40`,
                        }}
                        icon={<WorkspacePremium />}
                      />
                    </motion.div>
                    <Typography variant="h4" sx={{ fontWeight: 800, mt: 2, mb: 1, color: reputationLevel.color }}>
                      {reputationScore}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      До следующего уровня: {reputationLevel.next - reputationScore} очков
                    </Typography>
                  </Box>

                  <Box sx={{ position: "relative" }}>
                    <LinearProgress
                      variant="determinate"
                      value={Number(progressToNext)}
                      sx={{
                        height: 16,
                        borderRadius: 8,
                        bgcolor: "divider",
                        overflow: "hidden",
                        "& .MuiLinearProgress-bar": {
                          bgcolor: reputationLevel.color,
                          transition: "width 1s ease-out",
                          boxShadow: `0 0 10px ${reputationLevel.color}`,
                        },
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        position: "absolute",
                        right: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontWeight: 700,
                        color: reputationLevel.color,
                      }}
                    >
                      {progressToNext}%
                    </Typography>
                  </Box>
                </CardContent>
              </MotionCard>
            </Grid>

            {/* Награды */}
            <Grid item xs={12}>
              <MotionCard
                variants={cardVariants}
                whileHover="hover"
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                    <EmojiEvents color="primary" sx={{ fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: "'Inter', 'Roboto', sans-serif" }}>
                      Награды и достижения
                    </Typography>
                    <Chip 
                      label={`${earnedBadges.length}/${badges.length}`} 
                      size="small" 
                      color="primary"
                      sx={{ ml: "auto" }}
                    />
                  </Box>
                  
                  <Grid container spacing={2}>
                    <AnimatePresence>
                      {badges.map((badge, index) => {
                        const Icon = badge.icon;
                        return (
                          <Grid item xs={6} sm={4} md={2} key={badge.id}>
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8, y: 20 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                              whileHover={{ scale: 1.1, y: -5 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Tooltip title={badge.description} arrow>
                                <Card
                                  sx={{
                                    p: 2,
                                    textAlign: "center",
                                    cursor: "pointer",
                                    bgcolor: badge.earned ? "background.paper" : "action.disabledBackground",
                                    border: `2px solid ${badge.earned ? badge.color : "divider"}`,
                                    opacity: badge.earned ? 1 : 0.5,
                                    transition: "all 0.3s ease",
                                    position: "relative",
                                    "&:hover": {
                                      boxShadow: badge.earned ? `0 8px 16px ${badge.color}40` : "none",
                                    },
                                  }}
                                >
                                  {badge.earned && (
                                    <Badge
                                      badgeContent={<CheckCircle sx={{ fontSize: 16, color: badge.color }} />}
                                      sx={{
                                        position: "absolute",
                                        top: 4,
                                        right: 4,
                                      }}
                                    />
                                  )}
                                  <Icon
                                    sx={{
                                      fontSize: 40,
                                      color: badge.earned ? badge.color : "text.disabled",
                                      mb: 1,
                                    }}
                                  />
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      display: "block",
                                      fontWeight: 600,
                                      fontSize: "0.75rem",
                                      color: badge.earned ? "text.primary" : "text.disabled",
                                    }}
                                  >
                                    {badge.name}
                                  </Typography>
                                </Card>
                              </Tooltip>
                            </motion.div>
                          </Grid>
                        );
                      })}
                    </AnimatePresence>
                  </Grid>
                </CardContent>
              </MotionCard>
            </Grid>

            {/* Информация о профиле */}
            <Grid item xs={12}>
              <MotionCard
                variants={cardVariants}
                whileHover="hover"
              >
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, fontFamily: "'Inter', 'Roboto', sans-serif" }}>
                    Информация о профиле
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
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
                              {getRoleLabel(role)}
                            </Typography>
                          </Box>
                        </Box>
                      </MotionBox>
                    </Grid>

                    {reputation && (
                      <Grid item xs={12} sm={6} md={3}>
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
                                Статус
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {reputation.canCreateReports ? "Активен" : "Заблокирован"}
                              </Typography>
                            </Box>
                          </Box>
                        </MotionBox>
                      </Grid>
                    )}

                    <Grid item xs={12} sm={6} md={3}>
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

                    <Grid item xs={12} sm={6} md={3}>
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
