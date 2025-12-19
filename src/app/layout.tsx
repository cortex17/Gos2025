import { useEffect } from "react";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import PageTransition from "../components/PageTransition";
import NotificationCenter from "../components/NotificationCenter";
import Header from "../components/Header";
import { wsService } from "../api/websocket";

export function AppLayout() {
  const { token } = useAuthStore();

  useEffect(() => {
    if (token) {
      wsService.connect();
    }
    return () => {
      wsService.disconnect();
    };
  }, [token]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header showAuthButtons={true} />
      <Box 
        sx={{ 
          flex: 1,
          pt: { xs: "70px", sm: "80px" }, // Отступ сверху, чтобы контент не перекрывался хедером
        }}
      >
        <PageTransition>
          <Outlet />
        </PageTransition>
      </Box>

      <NotificationCenter />
    </Box>
  );
}
