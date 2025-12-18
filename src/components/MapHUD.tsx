import { useState } from "react";
import { Box, Chip, IconButton, Switch, Typography, FormControlLabel } from "@mui/material";
import { DarkMode, LightMode } from "@mui/icons-material";
import { AnimatePresence, motion } from "framer-motion";
import { ReportType } from "../api/reports";

interface MapHUDProps {
  incidentCount: number;
  filters: ReportType[];
  onFilterToggle: (type: ReportType) => void;
  nightMode: boolean;
  onNightModeToggle: () => void;
}

const typeLabels: Record<ReportType, string> = {
  no_light: "Нет света",
  dogs: "Собаки",
  ice: "Гололёд",
  other: "Другое",
};

export default function MapHUD({
  incidentCount,
  filters,
  onFilterToggle,
  nightMode,
  onNightModeToggle,
}: MapHUDProps) {
  const [visible, setVisible] = useState(true);

  return (
    <motion.div
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: visible ? 0 : -400, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.4, ease: "power2.out" as any }}
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        zIndex: 1000,
      }}
    >
      <Box
        sx={{
          bgcolor: "background.paper",
          borderRadius: 2,
          p: 2,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          minWidth: 280,
          maxWidth: 320,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Инциденты
          </Typography>
          <IconButton size="small" onClick={() => setVisible(!visible)}>
            {visible ? "−" : "+"}
          </IconButton>
        </Box>

        <AnimatePresence>
          {visible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                В области видимости: <strong>{incidentCount}</strong>
              </Typography>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                {(Object.keys(typeLabels) as ReportType[]).map((type) => (
                  <Chip
                    key={type}
                    label={typeLabels[type]}
                    size="small"
                    color={filters.includes(type) ? "primary" : "default"}
                    onClick={() => onFilterToggle(type)}
                    sx={{ cursor: "pointer" }}
                  />
                ))}
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={nightMode}
                    onChange={onNightModeToggle}
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {nightMode ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
                    <Typography variant="body2">Night mode</Typography>
                  </Box>
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </motion.div>
  );
}

