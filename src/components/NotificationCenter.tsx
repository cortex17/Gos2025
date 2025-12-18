import { useState, useEffect } from "react";
import { Box, IconButton, Badge, Drawer, Typography, List, ListItem, ListItemText, Divider, Chip } from "@mui/material";
import { Notifications, Close } from "@mui/icons-material";
import { motion } from "framer-motion";
import { wsService, WebSocketEvent } from "../api/websocket";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";

export default function NotificationCenter() {
  const { token } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<WebSocketEvent & { id: string; timestamp: Date }>>([]);
  const nav = useNavigate();

  useEffect(() => {
    if (!token) return; // Не подключаемся, если нет токена
    const unsubscribeSos = wsService.subscribe("sos_alert", (event) => {
      setNotifications(prev => [{
        ...event,
        id: `sos_${Date.now()}`,
        timestamp: new Date(),
      }, ...prev].slice(0, 50)); // Храним последние 50
    });

    const unsubscribeReport = wsService.subscribe("new_report", (event) => {
      setNotifications(prev => [{
        ...event,
        id: `report_${Date.now()}`,
        timestamp: new Date(),
      }, ...prev].slice(0, 50));
    });

    const unsubscribePanic = wsService.subscribe("panic_nearby", (event) => {
      setNotifications(prev => [{
        ...event,
        id: `panic_${Date.now()}`,
        timestamp: new Date(),
      }, ...prev].slice(0, 50));
    });

    return () => {
      unsubscribeSos();
      unsubscribeReport();
      unsubscribePanic();
    };
  }, [token]);

  const getNotificationText = (event: WebSocketEvent) => {
    switch (event.type) {
      case "sos_alert":
        return "🚨 Новый SOS сигнал";
      case "new_report":
        return `📋 Новый отчет: ${event.data.type}`;
      case "panic_nearby":
        return `⚠️ SOS сигнал поблизости (~${event.data.distance}m)`;
      default:
        return "Новое событие";
    }
  };

  const handleNotificationClick = (event: WebSocketEvent) => {
    if (event.type === "new_report" || event.type === "sos_alert") {
      nav(`/report/${event.data.id}`);
    }
    setOpen(false);
  };

  if (!token) return null; // Не показываем, если нет авторизации

  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        sx={{
          position: "fixed",
          top: 80,
          right: 24,
          zIndex: 1000,
          bgcolor: "background.paper",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <Badge badgeContent={notifications.length} color="error">
          <Notifications />
        </Badge>
      </IconButton>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: { width: { xs: "100%", sm: 400 } }
        }}
      >
        <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Уведомления
          </Typography>
          <IconButton onClick={() => setOpen(false)}>
            <Close />
          </IconButton>
        </Box>
        <Divider />
        <List sx={{ p: 0 }}>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="Нет уведомлений"
                secondary="Новые события будут отображаться здесь"
              />
            </ListItem>
          ) : (
            notifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <ListItem
                  button
                  onClick={() => handleNotificationClick(notif)}
                  sx={{
                    borderLeft: notif.type === "sos_alert" || notif.type === "panic_nearby" 
                      ? "4px solid" 
                      : "4px solid transparent",
                    borderColor: "error.main",
                  }}
                >
                  <ListItemText
                    primary={getNotificationText(notif)}
                    secondary={notif.timestamp.toLocaleString("ru-RU")}
                  />
                  <Chip
                    label={notif.type}
                    size="small"
                    color={notif.type.includes("sos") || notif.type.includes("panic") ? "error" : "default"}
                    sx={{ ml: 1 }}
                  />
                </ListItem>
                <Divider />
              </motion.div>
            ))
          )}
        </List>
      </Drawer>
    </>
  );
}

