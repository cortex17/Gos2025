import { useEffect, useMemo, useState } from "react";
import { Box, Button, Typography, Container } from "@mui/material";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import { useQuery } from "@tanstack/react-query";
import { leafletFix } from "../components/LeafletFix";
import { listApprovedReports, Report, ReportType } from "../api/reports";
import { useNavigate } from "react-router-dom";
import { panic } from "../api/panic";
import SosButton from "../components/SosButton";
import FlashCard from "../components/FlashCard";
import MapHUD from "../components/MapHUD";
import DangerPulse from "../components/DangerPulse";
import FloatingSosButton from "../components/FloatingSosButton";
import ProximityAlert from "../components/ProximityAlert";
import LocationButton from "../components/LocationButton";
import RadiusFilter from "../components/RadiusFilter";

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function DashboardMapPage() {
  const nav = useNavigate();
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [filters, setFilters] = useState<ReportType[]>([]);
  const [nightMode, setNightMode] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(1000); // 1km по умолчанию

  useEffect(() => leafletFix(), []);

  const { data: reports = [], isLoading, isError } = useQuery({
    queryKey: ["reports", "approved"],
    queryFn: listApprovedReports,
  });

  const center = useMemo(() => [42.9, 71.36] as [number, number], []); // change to your city

  const filteredReports = useMemo(() => {
    let filtered = reports;
    
    // Фильтр по типу
    if (filters.length > 0) {
      filtered = filtered.filter(r => filters.includes(r.type));
    }
    
    // Фильтр по радиусу от пользователя
    if (userLocation) {
      filtered = filtered.filter(r => {
        const distance = calculateDistance(userLocation.lat, userLocation.lng, r.lat, r.lng);
        return distance <= radius;
      });
    }
    
    return filtered;
  }, [reports, filters, userLocation, radius]);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // Радиус Земли в метрах
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

  const tileUrl = nightMode 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  async function onPanic() {
    if (!picked) return;
    await panic({ lat: picked.lat, lng: picked.lng });
    alert("SOS sent (MVP)");
  }


  return (
    <Box sx={{ width: "100%" }}>
      {/* Hero Section */}
      <Box
        sx={{
          width: "100%",
          py: { xs: 6, md: 10 },
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 800,
                mb: 2,
                fontSize: { xs: "2rem", md: "3rem" },
              }}
            >
              Интерактивная карта безопасности
            </Typography>
            <Typography
              variant="h6"
              sx={{
                opacity: 0.9,
                mb: 4,
                maxWidth: 600,
                fontWeight: 400,
              }}
            >
              Отслеживайте инциденты в реальном времени, создавайте отчеты и получайте помощь в критических ситуациях
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <SosButton disabled={!picked} onClick={onPanic} />
              <Button
                variant="contained"
                disabled={!picked}
                onClick={() => nav(`/report/new?lat=${picked!.lat}&lng=${picked!.lng}`)}
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.3)" },
                  textTransform: "none",
                  px: 3,
                }}
              >
                Создать отчет
              </Button>
            </Box>
            {picked && (
              <Typography variant="body2" sx={{ mt: 2, opacity: 0.8 }}>
                Выбрано: {picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}
              </Typography>
            )}
          </Box>
        </Container>
      </Box>

      {/* Map Section */}
      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
        <Box sx={{ height: { xs: 400, md: 600 }, borderRadius: 3, overflow: "hidden", position: "relative", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution={nightMode ? '&copy; CARTO' : '&copy; OpenStreetMap contributors'}
            url={tileUrl}
            errorTileUrl="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Crect width='256' height='256' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-family='Arial' font-size='14'%3EНет интернета%3C/text%3E%3C/svg%3E"
            maxNativeZoom={19}
            maxZoom={19}
          />
          <LocationButton onLocationFound={(lat: number, lng: number) => setUserLocation({ lat, lng })} />
          <ClickHandler onPick={(lat, lng) => setPicked({ lat, lng })} />

          {!isLoading && !isError && filteredReports.map((r: Report) => (
            <Marker key={r.id} position={[r.lat, r.lng]}>
              <Popup>
                <FlashCard triggerKey={r.id}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 200 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <DangerPulse severity={r.severity} size={32} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {r.type}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Уровень опасности: {r.severity}/5
                    </Typography>
                    {r.description && (
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {r.description}
                      </Typography>
                    )}
                    <Button 
                      size="small" 
                      variant="contained" 
                      onClick={() => nav(`/report/${r.id}`)}
                      sx={{ mt: 1 }}
                    >
                      Подробнее
                    </Button>
                  </Box>
                </FlashCard>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        <MapHUD
          incidentCount={filteredReports.length}
          filters={filters}
          onFilterToggle={handleFilterToggle}
          nightMode={nightMode}
          onNightModeToggle={() => setNightMode(!nightMode)}
        />
        </Box>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            Кликните на карту, чтобы выбрать местоположение и создать отчет
          </Typography>
        </Box>
      </Container>

      <FloatingSosButton position={picked} />
      <ProximityAlert userLocation={picked || userLocation} reports={filteredReports} />
      {userLocation && (
        <RadiusFilter
          userLocation={userLocation}
          radius={radius}
          onRadiusChange={setRadius}
        />
      )}
    </Box>
  );
}
