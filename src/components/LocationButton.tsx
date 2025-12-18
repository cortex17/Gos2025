import { IconButton, Tooltip, CircularProgress } from "@mui/material";
import { MyLocation } from "@mui/icons-material";
import { useState } from "react";
import { useMap } from "react-leaflet";

interface LocationButtonProps {
  onLocationFound?: (lat: number, lng: number) => void;
}

export default function LocationButton({ onLocationFound }: LocationButtonProps) {
  const map = useMap();
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (!navigator.geolocation) {
      alert("Геолокация не поддерживается вашим браузером");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 15);
        onLocationFound?.(latitude, longitude);
        setLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Не удалось определить местоположение. Проверьте настройки браузера.");
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <Tooltip title="Определить мое местоположение">
      <IconButton
        onClick={handleClick}
        disabled={loading}
        sx={{
          position: "absolute",
          bottom: 80,
          right: 16,
          zIndex: 1000,
          bgcolor: "background.paper",
          boxShadow: 3,
          "&:hover": {
            bgcolor: "primary.main",
            color: "white",
          },
        }}
      >
        {loading ? <CircularProgress size={24} /> : <MyLocation />}
      </IconButton>
    </Tooltip>
  );
}
