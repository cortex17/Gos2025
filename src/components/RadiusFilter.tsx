import { Box, Slider, Typography, Card, CardContent } from "@mui/material";
import { LocationOn } from "@mui/icons-material";
import { useState, useEffect } from "react";

interface RadiusFilterProps {
  userLocation: { lat: number; lng: number } | null;
  radius: number;
  onRadiusChange: (radius: number) => void;
}

export default function RadiusFilter({ userLocation, radius, onRadiusChange }: RadiusFilterProps) {
  const [localRadius, setLocalRadius] = useState(radius);

  useEffect(() => {
    setLocalRadius(radius);
  }, [radius]);

  if (!userLocation) {
    return null;
  }

  return (
    <Card
      sx={{
        position: "absolute",
        bottom: 16,
        left: 16,
        zIndex: 1000,
        minWidth: 280,
        bgcolor: "background.paper",
        boxShadow: 3,
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <LocationOn color="primary" />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Фильтр по радиусу
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Радиус: {localRadius} м
        </Typography>
        <Slider
          value={localRadius}
          onChange={(_, value) => setLocalRadius(value as number)}
          onChangeCommitted={(_, value) => onRadiusChange(value as number)}
          min={100}
          max={5000}
          step={100}
          marks={[
            { value: 100, label: "100м" },
            { value: 1000, label: "1км" },
            { value: 5000, label: "5км" },
          ]}
          sx={{ mt: 2 }}
        />
      </CardContent>
    </Card>
  );
}

