import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, Button, TextField, Checkbox, FormControlLabel, Box, Typography } from "@mui/material";
import { Warning, LocationOn } from "@mui/icons-material";
import { useToast } from "./Toast";

interface SosGuestModalProps {
  open: boolean;
  onClose: () => void;
  position?: { lat: number; lng: number } | null;
}

export default function SosGuestModal({ open, onClose, position }: SosGuestModalProps) {
  const { showToast } = useToast();
  const [shareLocation, setShareLocation] = useState(true);
  const [phone, setPhone] = useState("");

  const handleQuickSos = async () => {
    if (!position && shareLocation) {
      // Запрашиваем геолокацию
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            await sendGuestSos(loc);
          },
          () => {
            showToast("Геолокация не разрешена", "error");
          }
        );
      } else {
        showToast("Геолокация не поддерживается", "error");
      }
    } else if (position) {
      await sendGuestSos(position);
    } else {
      showToast("Необходимо разрешить геолокацию", "error");
    }
  };

  const sendGuestSos = async (loc: { lat: number; lng: number }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/panic/guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: loc.lat,
          lng: loc.lng,
          phone: phone || undefined,
          guest: true,
          unverified: true,
        }),
      });

      if (response.ok) {
        showToast("SOS отправлен как guest/unverified", "success");
        onClose();
      } else {
        throw new Error("Failed to send SOS");
      }
    } catch (error) {
      console.error("Guest SOS error:", error);
      showToast("Ошибка отправки SOS", "error");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Warning color="error" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Быстрый SOS
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={shareLocation}
                onChange={(e) => setShareLocation(e.target.checked)}
              />
            }
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LocationOn fontSize="small" />
                <Typography variant="body2">Поделиться геолокацией (обязательно)</Typography>
              </Box>
            }
          />
          <TextField
            label="Телефон (опционально)"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
            placeholder="+7 (___) ___-__-__"
          />
          <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
            <Button variant="outlined" onClick={onClose} fullWidth>
              Отмена
            </Button>
            <Button variant="contained" color="error" onClick={handleQuickSos} fullWidth>
              Отправить
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

