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
} from "@mui/material";
import { Search, FilterList } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { listApprovedReports, Report, ReportType } from "../api/reports";
import ReportCard from "../components/ReportCard";
import ExportButton from "../components/ExportButton";
import { motion } from "framer-motion";

export default function ReportsListPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ReportType | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<number | "all">("all");

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["reports", "approved"],
    queryFn: listApprovedReports,
  });

  const filteredReports = useMemo(() => {
    return reports.filter((r: Report) => {
      const matchesSearch =
        search === "" ||
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.type.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || r.type === typeFilter;
      const matchesSeverity = severityFilter === "all" || r.severity === severityFilter;
      return matchesSearch && matchesType && matchesSeverity;
    });
  }, [reports, search, typeFilter, severityFilter]);

  const stats = useMemo(() => {
    return {
      total: reports.length,
      byType: reports.reduce((acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      highSeverity: reports.filter((r) => r.severity >= 4).length,
    };
  }, [reports]);

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
              Отчеты об инцидентах
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Просмотр и управление всеми зарегистрированными инцидентами
            </Typography>
          </Box>
        </motion.div>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: 700, color: "primary.main" }}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Всего отчетов
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
                  Высокий риск
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: 700, color: "warning.main" }}>
                  {Object.keys(stats.byType).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Типов инцидентов
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Фильтры и поиск
              </Typography>
              <ExportButton data={filteredReports} filename="incidents" />
            </Box>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Поиск по описанию или типу..."
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
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  select
                  label="Тип инцидента"
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
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  select
                  label="Уровень опасности"
                  value={severityFilter}
                  onChange={(e) =>
                    setSeverityFilter(e.target.value === "all" ? "all" : Number(e.target.value))
                  }
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

        {/* Results */}
        {isLoading ? (
          <Box sx={{ display: "grid", gap: 2 }}>
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent>
                  <Box sx={{ height: 120 }} />
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : filteredReports.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                Нет отчетов
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Попробуйте изменить фильтры поиска
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {filteredReports.map((report, index) => (
              <Grid item xs={12} md={6} lg={4} key={report.id}>
                <ReportCard report={report} index={index} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
