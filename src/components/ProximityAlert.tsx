import { useEffect, useState, useRef } from "react";
import { Alert, AlertTitle, IconButton, Box } from "@mui/material";
import { Warning, Close } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { Report } from "../api/reports";
import { panicNear, PanicEvent } from "../api/panic";

interface ProximityAlertProps {
  userLocation: { lat: number; lng: number } | null;
  reports: Report[];
  radius?: number; // радиус в метрах
  cooldown?: number; // cooldown в миллисекундах
}

export default function ProximityAlert({ 
  userLocation, 
  reports, 
  radius = 500,
  cooldown = 30000 // 30 секунд
}: ProximityAlertProps) {
  const [alert, setAlert] = useState<{ type: "report" | "panic"; data: Report | PanicEvent; distance: number } | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const lastAlertTime = useRef<number>(0);
  const checkInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Функция расчета расстояния (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // радиус Земли в метрах
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (!userLocation) {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
        checkInterval.current = null;
      }
      return;
    }

    const checkProximity = async () => {
      const now = Date.now();
      
      // Проверяем cooldown
      if (now - lastAlertTime.current < cooldown) {
        return;
      }

      // Проверяем инциденты
      for (const report of reports) {
        if (dismissed.has(report.id)) continue;

        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          report.lat,
          report.lng
        );

        if (distance <= radius && report.severity >= 3) {
          setAlert({
            type: "report",
            data: report,
            distance: Math.round(distance),
          });
          lastAlertTime.current = now;
          return;
        }
      }

      // Проверяем активные SOS сигналы
      try {
        const panicEvents = await panicNear({
          lat: userLocation.lat,
          lng: userLocation.lng,
          radius,
        });

        for (const event of panicEvents) {
          if (dismissed.has(event.id) || !event.active) continue;

          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            event.lat,
            event.lng
          );

          if (distance <= radius) {
            setAlert({
              type: "panic",
              data: event,
              distance: Math.round(distance),
            });
            lastAlertTime.current = now;
            return;
          }
        }
      } catch (error) {
        console.error("Error checking panic events:", error);
      }
    };

    // Проверяем каждые 5 секунд
    checkInterval.current = setInterval(checkProximity, 5000);
    checkProximity(); // Первая проверка сразу

    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
    };
  }, [userLocation, reports, radius, cooldown, dismissed]);

  const handleDismiss = () => {
    if (alert) {
      setDismissed(prev => new Set([...prev, alert.data.id]));
      setAlert(null);
    }
  };

  if (!alert) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        style={{
          position: "fixed",
          top: 80,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1400,
          width: "90%",
          maxWidth: 500,
        }}
      >
        <Alert
          severity={alert.type === "panic" ? "error" : "warning"}
          icon={<Warning />}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleDismiss}
            >
              <Close fontSize="inherit" />
            </IconButton>
          }
          sx={{
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          }}
        >
          <AlertTitle sx={{ fontWeight: 700 }}>
            {alert.type === "panic" ? "🚨 Активный SOS сигнал рядом!" : "⚠️ Опасность поблизости"}
          </AlertTitle>
          <Box sx={{ mt: 1 }}>
            {alert.type === "report" && (
              <>
                <Box>Тип: {(alert.data as Report).type}</Box>
                <Box>Уровень опасности: {(alert.data as Report).severity}/5</Box>
              </>
            )}
            <Box sx={{ mt: 0.5, fontWeight: 600 }}>
              Расстояние: ~{alert.distance} м
            </Box>
          </Box>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
}

