import { Card, CardContent, Typography, Box, Chip, IconButton } from "@mui/material";
import { LocationOn, AccessTime, Warning, ArrowForward } from "@mui/icons-material";
import { motion } from "framer-motion";
import { Report } from "../api/reports";
import { useNavigate } from "react-router-dom";

interface ReportCardProps {
  report: Report;
  index?: number;
}

export default function ReportCard({ report, index = 0 }: ReportCardProps) {
  const nav = useNavigate();

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      no_light: "Нет света",
      dogs: "Собаки",
      ice: "Гололёд",
      other: "Другое",
    };
    return labels[type] || type;
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return "error";
    if (severity >= 3) return "warning";
    return "default";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -4, scale: 1.01 }}
    >
      <Card
        sx={{
          cursor: "pointer",
          transition: "all 0.3s",
          border: "1px solid",
          borderColor: "divider",
          "&:hover": {
            boxShadow: 6,
            borderColor: "primary.main",
          },
        }}
        onClick={() => nav(`/report/${report.id}`)}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Warning
                  sx={{
                    fontSize: 24,
                    color: getSeverityColor(report.severity) === "error" ? "error.main" : "warning.main",
                  }}
                />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {getTypeLabel(report.type)}
                </Typography>
                <Chip
                  label={`Уровень: ${report.severity}/5`}
                  size="small"
                  color={getSeverityColor(report.severity)}
                  sx={{ ml: "auto" }}
                />
              </Box>
              {report.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {report.description.length > 100
                    ? `${report.description.substring(0, 100)}...`
                    : report.description}
                </Typography>
              )}
            </Box>
            <IconButton
              size="small"
              sx={{
                bgcolor: "primary.main",
                color: "white",
                "&:hover": { bgcolor: "primary.dark" },
              }}
            >
              <ArrowForward />
            </IconButton>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <LocationOn fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <AccessTime fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {new Date(report.createdAt).toLocaleString("ru-RU", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Typography>
            </Box>
            <Chip
              label={report.status === "approved" ? "Одобрено" : report.status === "pending" ? "На модерации" : "Отклонено"}
              size="small"
              color={report.status === "approved" ? "success" : report.status === "pending" ? "warning" : "default"}
              sx={{ ml: "auto" }}
            />
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}

