import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";

interface HeatMapProps {
  data: Array<{ lat: number; lng: number; count: number; severity: number }>;
  onPointClick?: (point: { lat: number; lng: number }) => void;
}

export default function HeatMap({ data, onPointClick }: HeatMapProps) {
  if (data.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Нет данных для отображения
        </Typography>
      </Box>
    );
  }

  // Группируем точки по зонам (округление координат)
  const zones = new Map<string, { lat: number; lng: number; count: number; maxSeverity: number }>();
  
  data.forEach(item => {
    const zoneKey = `${Math.round(item.lat * 10) / 10}_${Math.round(item.lng * 10) / 10}`;
    const existing = zones.get(zoneKey);
    if (existing) {
      existing.count += item.count;
      existing.maxSeverity = Math.max(existing.maxSeverity, item.severity);
    } else {
      zones.set(zoneKey, {
        lat: Math.round(item.lat * 10) / 10,
        lng: Math.round(item.lng * 10) / 10,
        count: item.count,
        maxSeverity: item.severity,
      });
    }
  });

  const maxCount = Math.max(...Array.from(zones.values()).map(z => z.count));

  return (
    <Box sx={{ position: "relative", width: "100%", height: 300, bgcolor: "background.default", borderRadius: 2, overflow: "hidden" }}>
      {Array.from(zones.values()).map((zone, index) => {
        const intensity = zone.count / maxCount;
        const size = 20 + intensity * 40;
        const opacity = 0.3 + intensity * 0.5;
        const color = zone.maxSeverity >= 4 ? "#f44336" : zone.maxSeverity >= 3 ? "#ff9800" : "#4caf50";
        
        return (
          <motion.div
            key={index}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onPointClick?.({ lat: zone.lat, lng: zone.lng })}
            style={{
              position: "absolute",
              left: `${((zone.lng + 180) / 360) * 100}%`,
              top: `${((90 - zone.lat) / 180) * 100}%`,
              width: size,
              height: size,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${color}${Math.round(opacity * 255).toString(16)} 0%, ${color}00 70%)`,
              cursor: "pointer",
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}
      <Box sx={{ position: "absolute", bottom: 16, left: 16, bgcolor: "background.paper", p: 1.5, borderRadius: 1, boxShadow: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
          Зоны опасности
        </Typography>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#4caf50" }} />
          <Typography variant="caption">Низкая</Typography>
          <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#ff9800", ml: 1 }} />
          <Typography variant="caption">Средняя</Typography>
          <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#f44336", ml: 1 }} />
          <Typography variant="caption">Высокая</Typography>
        </Box>
      </Box>
    </Box>
  );
}

