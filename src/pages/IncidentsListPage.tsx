import { useState, useMemo } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  Chip,
} from "@mui/material";
import { Search, FilterList, AccessTime } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { listApprovedReports, Report, ReportType } from "../api/reports";
import ExportButton from "../components/ExportButton";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function IncidentsListPage() {
  const nav = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ReportType | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<number | "all">("all");

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["reports", "approved"],
    queryFn: listApprovedReports,
  });

  const formatTTL = (createdAt: string, ttlHours: number = 24) => {
    const created = new Date(createdAt).getTime();
    const expires = created + ttlHours * 60 * 60 * 1000;
    const now = Date.now();
    const remaining = expires - now;
    
    if (remaining <= 0) return { text: "Истёк", expired: true };
    
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) return { text: `Истечёт через ${hours}ч ${minutes}м`, expired: false };
    return { text: `Истечёт через ${minutes}м`, expired: false };
  };

  const filteredReports = useMemo(() => {
    return reports.filter((r: Report) => {
      const matchesSearch =
        search === "" ||
        r.description?.toLowerCase().includes(search.toLowerCase()) ||
        r.type.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || r.type === typeFilter;
      const matchesSeverity = severityFilter === "all" || r.severity === severityFilter;
      return matchesSearch && matchesType && matchesSeverity;
    }).filter(r => {
      // Скрываем просроченные
      const ttl = formatTTL(r.createdAt);
      return !ttl.expired;
    });
  }, [reports, search, typeFilter, severityFilter]);

  const stats = useMemo(() => {
    return {
      total: filteredReports.length,
      byType: filteredReports.reduce((acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      highSeverity: filteredReports.filter((r) => r.severity >= 4).length,
    };
  }, [filteredReports]);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      no_light: "Нет света",
      dogs: "Собаки",
      ice: "Гололёд",
      other: "Другое",
    };
    return labels[type] || type;
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4 }}>
      <Container maxWidth="xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ mb: 4 }}>
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
              Инциденты
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Просмотр активных инцидентов с TTL
            </Typography>
          </Box>
        </motion.div>

        {/* Filters */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Поиск..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Тип"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as ReportType | "all")}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FilterList />
                      </InputAdornment>
                    ),
                  }}
                >
                  <MenuItem value="all">Все типы</MenuItem>
                  <MenuItem value="no_light">Нет света</MenuItem>
                  <MenuItem value="dogs">Собаки</MenuItem>
                  <MenuItem value="ice">Гололёд</MenuItem>
                  <MenuItem value="other">Другое</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Уровень опасности"
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value as number | "all")}
                >
                  <MenuItem value="all">Все уровни</MenuItem>
                  <MenuItem value={1}>1 - Низкий</MenuItem>
                  <MenuItem value={2}>2 - Ниже среднего</MenuItem>
                  <MenuItem value={3}>3 - Средний</MenuItem>
                  <MenuItem value={4}>4 - Высокий</MenuItem>
                  <MenuItem value={5}>5 - Критический</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Активных инцидентов
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: 700, color: "error.main" }}>
                  {stats.highSeverity}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Высокий риск (≥4)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: 700, color: "primary.main" }}>
                  {Object.keys(stats.byType).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Типов инцидентов
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Reports Grid */}
        {isLoading ? (
          <Typography>Загрузка...</Typography>
        ) : filteredReports.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                Инциденты не найдены
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              <ExportButton data={filteredReports} filename="incidents" />
            </Box>
            <Grid container spacing={3}>
              {filteredReports.map((report: Report) => {
                const ttl = formatTTL(report.createdAt);
                return (
                  <Grid item xs={12} sm={6} md={4} key={report.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card
                        sx={{
                          height: "100%",
                          cursor: "pointer",
                          "&:hover": { boxShadow: 6 },
                        }}
                        onClick={() => nav(`/incidents/${report.id}`)}
                      >
                        <CardContent>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                              {getTypeLabel(report.type)}
                            </Typography>
                            <Chip
                              label={`${report.severity}/5`}
                              size="small"
                              color={report.severity >= 4 ? "error" : report.severity >= 3 ? "warning" : "default"}
                            />
                          </Box>
                          {report.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {report.description.length > 100
                                ? `${report.description.substring(0, 100)}...`
                                : report.description}
                            </Typography>
                          )}
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
                            <AccessTime fontSize="small" color="action" />
                            <Typography variant="caption" color={ttl.expired ? "error.main" : "text.secondary"}>
                              {ttl.text}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}
      </Container>
    </Box>
  );
}

