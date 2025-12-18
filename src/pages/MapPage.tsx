import { useEffect, useMemo, useState } from "react";
import { Box, Button, Typography, Paper, Chip, List, ListItemButton, Divider } from "@mui/material";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import { useQuery } from "@tanstack/react-query";
import { leafletFix } from "../components/LeafletFix";
import { listApprovedReports, Report, ReportType } from "../api/reports";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { useNotificationsStore } from "../store/notifications";
import { wsService } from "../api/websocket";
import FlashCard from "../components/FlashCard";
import DangerPulse from "../components/DangerPulse";
import FloatingSosButton from "../components/FloatingSosButton";
import LocationButton from "../components/LocationButton";
import { LocationOn, CheckCircle, Cancel } from "@mui/icons-material";
import { voteReport } from "../api/reports";

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Mock nearby incidents data
const mockIncidents = [
  { id: "1", type: "no_light" as ReportType, distance: 120, ttl: "истечёт через 18ч 30м", verified: true },
  { id: "2", type: "dogs" as ReportType, distance: 250, ttl: "истечёт через 12ч 15м", verified: true },
  { id: "3", type: "ice" as ReportType, distance: 380, ttl: "истечёт через 6ч 45м", verified: false },
  { id: "4", type: "other" as ReportType, distance: 450, ttl: "истечёт через 3ч 20м", verified: true },
  { id: "5", type: "no_light" as ReportType, distance: 520, ttl: "истечёт через 1ч 10м", verified: false },
  { id: "6", type: "dogs" as ReportType, distance: 680, ttl: "истечёт через 45м", verified: true },
];

export default function MapPage() {
  const nav = useNavigate();
  const { token } = useAuthStore();
  const { setWsConnected } = useNotificationsStore();
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [filters, setFilters] = useState<ReportType[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => leafletFix(), []);

  // Connect WebSocket
  useEffect(() => {
    if (token) {
      wsService.connect();
      wsService.subscribe("sos_alert", () => {});
      setWsConnected(true);
    }
    return () => {
      wsService.disconnect();
      setWsConnected(false);
    };
  }, [token, setWsConnected]);

  const { data: reports = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["reports", "approved"],
    queryFn: listApprovedReports,
  });

  const center = useMemo(() => userLocation || [42.9, 71.36] as [number, number], [userLocation]);

  const filteredReports = useMemo(() => {
    let filtered = reports;
    if (filters.length > 0) {
      filtered = filtered.filter(r => filters.includes(r.type));
    }
    if (userLocation) {
      filtered = filtered.map(r => ({
        ...r,
        distance: calculateDistance(userLocation.lat, userLocation.lng, r.lat, r.lng),
      })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    return filtered;
  }, [reports, filters, userLocation]);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleFilterToggle = (type: ReportType) => {
    setFilters(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      no_light: "Нет света",
      dogs: "Собаки",
      ice: "Гололёд",
      other: "Другое",
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: ReportType) => {
    const colors: Record<ReportType, string> = {
      no_light: "#ff9800",
      dogs: "#f44336",
      ice: "#2196f3",
      other: "#9e9e9e",
    };
    return colors[type] || "#9e9e9e";
  };

  const handleVote = async (incidentId: string, vote: "confirm" | "fake") => {
    if (!token) {
      nav("/login");
      return;
    }
    try {
      await voteReport(incidentId, vote);
      refetch();
    } catch (error) {
      console.error("Vote error:", error);
    }
  };

  return (
    <Box sx={{ display: "flex", height: "calc(100vh - 64px)", width: "100%" }}>
      {/* Map - 72% */}
      <Box sx={{ width: "72%", position: "relative" }}>
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationButton onLocationFound={(lat: number, lng: number) => setUserLocation({ lat, lng })} />
          <ClickHandler onPick={(lat, lng) => setPicked({ lat, lng })} />

          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>Ваше местоположение</Popup>
            </Marker>
          )}

          {!isLoading && !isError && filteredReports.map((r: Report & { distance?: number }) => (
            <Marker key={r.id} position={[r.lat, r.lng]}>
              <Popup>
                <FlashCard triggerKey={r.id}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 200 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <DangerPulse severity={r.severity} size={32} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {getTypeLabel(r.type)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Уровень: {r.severity}/5
                    </Typography>
                    {r.distance && (
                      <Typography variant="caption" color="text.secondary">
                        Расстояние: {Math.round(r.distance)} м
                      </Typography>
                    )}
                    <Button 
                      size="small" 
                      variant="contained" 
                      onClick={() => nav(`/incidents/${r.id}`)}
                      sx={{ mt: 1 }}
                      fullWidth
                    >
                      Подробнее
                    </Button>
                  </Box>
                </FlashCard>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <FloatingSosButton position={picked || userLocation} />
      </Box>

      {/* Sidebar - 28% */}
      <Paper 
        sx={{ 
          width: "28%", 
          display: "flex", 
          flexDirection: "column",
          borderLeft: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        {/* Filters */}
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Фильтры
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {(["no_light", "dogs", "ice", "other"] as ReportType[]).map((type) => (
              <Chip
                key={type}
                label={getTypeLabel(type)}
                onClick={() => handleFilterToggle(type)}
                color={filters.includes(type) ? "primary" : "default"}
                sx={{
                  bgcolor: filters.includes(type) ? getTypeColor(type) : undefined,
                  color: filters.includes(type) ? "white" : undefined,
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Legend */}
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Легенда
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {(["no_light", "dogs", "ice", "other"] as ReportType[]).map((type) => (
              <Box key={type} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: getTypeColor(type) }} />
                <Typography variant="caption">{getTypeLabel(type)}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Nearby Incidents List */}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Nearby incidents
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {mockIncidents.length} найдено
            </Typography>
          </Box>
          
          <List sx={{ p: 0 }}>
            {mockIncidents.map((incident, index) => (
              <Box key={incident.id}>
                <ListItemButton
                  sx={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    py: 1.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%", mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                      {getTypeLabel(incident.type)}
                    </Typography>
                    <Chip 
                      label={incident.verified ? "verified" : "guest"} 
                      size="small" 
                      color={incident.verified ? "success" : "warning"}
                      sx={{ height: 20, fontSize: "0.65rem" }}
                    />
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%", mb: 0.5 }}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      {incident.distance} м
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                    {incident.ttl}
                  </Typography>
                  {token && (
                    <Box sx={{ display: "flex", gap: 1, mt: 1, width: "100%" }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVote(incident.id, "confirm");
                        }}
                        sx={{ flex: 1, textTransform: "none" }}
                      >
                        Подтвердить
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVote(incident.id, "fake");
                        }}
                        sx={{ flex: 1, textTransform: "none" }}
                      >
                        Фейк
                      </Button>
                    </Box>
                  )}
                </ListItemButton>
                {index < mockIncidents.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </Box>
      </Paper>
    </Box>
  );
}
