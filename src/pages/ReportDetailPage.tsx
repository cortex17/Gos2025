import { Box, Card, CardContent, Typography, Container, Chip, Grid, Skeleton } from "@mui/material";
import { LocationOn, Warning, CalendarToday, CheckCircle, Cancel, Pending } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { getReport } from "../api/reports";
import DangerPulse from "../components/DangerPulse";
import VoteButtons from "../components/VoteButtons";
import ShareButton from "../components/ShareButton";

export default function ReportDetailPage() {
  const { id } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["report", id],
    queryFn: () => getReport(id!),
    enabled: !!id,
  });

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      no_light: "Нет света",
      dogs: "Стая собак",
      ice: "Гололёд",
      other: "Другое",
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "На модерации",
      approved: "Одобрен",
      rejected: "Отклонен",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string): "default" | "success" | "error" | "warning" => {
    if (status === "approved") return "success";
    if (status === "rejected") return "error";
    return "warning";
  };

  const getStatusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle />;
    if (status === "rejected") return <Cancel />;
    return <Pending />;
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Skeleton height={60} sx={{ mb: 3 }} />
        <Skeleton height={400} />
      </Container>
    );
  }

  if (isError || !data) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="h6" color="error">
              Отчет не найден
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Hero Section */}
      <Box
        sx={{
          width: "100%",
          py: { xs: 6, md: 8 },
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
            <DangerPulse severity={data.severity} size={64} />
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 800,
                  mb: 1,
                  fontSize: { xs: "2rem", md: "3rem" },
                }}
              >
                {getTypeLabel(data.type)}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                Детали отчета #{data.id.slice(0, 8)}
              </Typography>
            </Box>
            <ShareButton
              title={`Инцидент: ${getTypeLabel(data.type)}`}
              text={data.description || `Инцидент уровня ${data.severity}/5`}
              url={`/report/${data.id}`}
            />
          </Box>
        </Container>
      </Box>

      {/* Content */}
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Box>
                    <Typography variant="overline" color="text.secondary" sx={{ fontSize: 12, fontWeight: 600 }}>
                      Описание
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1, fontSize: 16 }}>
                      {data.description || "Описание отсутствует"}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LocationOn color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Координаты
                      </Typography>
                      <Typography variant="body1" sx={{ ml: "auto", fontFamily: "monospace" }}>
                        {data.lat.toFixed(6)}, {data.lng.toFixed(6)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Warning color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Уровень опасности
                      </Typography>
                      <Chip
                        label={`${data.severity}/5`}
                        color={data.severity >= 4 ? "error" : data.severity >= 3 ? "warning" : "default"}
                        sx={{ ml: "auto" }}
                      />
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CalendarToday color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Дата создания
                      </Typography>
                      <Typography variant="body1" sx={{ ml: "auto" }}>
                        {new Date(data.createdAt).toLocaleDateString("ru-RU", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                    Статус
                  </Typography>
                  <Chip
                    icon={getStatusIcon(data.status)}
                    label={getStatusLabel(data.status)}
                    color={getStatusColor(data.status)}
                    sx={{ width: "100%", justifyContent: "flex-start", py: 2.5 }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent sx={{ p: 3 }}>
                  <VoteButtons reportId={data.id} />
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
