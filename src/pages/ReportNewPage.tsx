import { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Slider,
  Chip,
  IconButton,
  FormControlLabel,
  Switch,
  Grid,
  Alert,
  CircularProgress,
  Container,
  Tooltip,
  Fade,
} from "@mui/material";
import {
  Lightbulb,
  Pets,
  Warning,
  Report,
  LocationOn,
  Delete,
  CheckCircle,
  Add,
  HelpOutline,
  CloudUpload,
  CheckCircleOutline,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import L from "leaflet";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { createReport, ReportType } from "../api/reports";
import { getReputation } from "../api/reputation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth";
import { useToast } from "../components/Toast";
import { leafletFix } from "../components/LeafletFix";
import DangerPulse from "../components/DangerPulse";
import styles from "./ReportNewPage.module.css";

type IncidentType = "lighting" | "dog" | "ice" | "crime";
type TTLPreset = "2h" | "12h" | "1d" | "7d";

interface FilePreview {
  file: File;
  preview: string;
  id: string;
}

const DRAFT_KEY = "sosmap_report_draft";

const typeConfig: Record<IncidentType, { label: string; icon: React.ReactNode; color: string; autoTTL: TTLPreset; backendType: ReportType }> = {
  lighting: { label: "Нет света", icon: <Lightbulb />, color: "#ff9800", autoTTL: "7d", backendType: "no_light" },
  dog: { label: "Собаки", icon: <Pets />, color: "#f44336", autoTTL: "2h", backendType: "dogs" },
  ice: { label: "Гололёд", icon: <Warning />, color: "#2196f3", autoTTL: "12h", backendType: "ice" },
  crime: { label: "Другое", icon: <Report />, color: "#9e9e9e", autoTTL: "1d", backendType: "other" },
};

const quickTags = ["темно", "переулок", "стая", "скользко", "преследуют"];

const ttlPresets: { value: TTLPreset; label: string; hours: number }[] = [
  { value: "2h", label: "2 часа", hours: 2 },
  { value: "12h", label: "12 часов", hours: 12 },
  { value: "1d", label: "1 день", hours: 24 },
  { value: "7d", label: "1 неделя", hours: 168 },
];

function DraggableMarker({
  position,
  onDragEnd,
}: {
  position: [number, number];
  onDragEnd: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<any>(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const latlng = marker.getLatLng();
        onDragEnd(latlng.lat, latlng.lng);
      }
    },
  };

  return (
    <Marker
      draggable
      position={position}
      ref={markerRef}
      eventHandlers={eventHandlers}
    />
  );
}

function MapClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapController({ onMapReady }: { onMapReady: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onMapReady(map);
  }, [map]);
  return null;
}

export default function ReportNewPage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const { token } = useAuthStore();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialLat = Number(sp.get("lat"));
  const initialLng = Number(sp.get("lng"));

  const [type, setType] = useState<IncidentType | null>(null);
  const [severity, setSeverity] = useState(3);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    Number.isFinite(initialLat) && Number.isFinite(initialLng)
      ? { lat: initialLat, lng: initialLng }
      : null
  );
  const [ttlPreset, setTtlPreset] = useState<TTLPreset>("1d");
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [mapRef, setMapRef] = useState<L.Map | null>(null);
  const [selectedTypeAnimation, setSelectedTypeAnimation] = useState<IncidentType | null>(null);

  const { data: reputation } = useQuery({
    queryKey: ["reputation"],
    queryFn: () => getReputation(),
    enabled: !!token,
  });

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.type) setType(parsed.type);
        if (parsed.severity) setSeverity(parsed.severity);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.location) setLocation(parsed.location);
        if (parsed.ttlPreset) setTtlPreset(parsed.ttlPreset);
        if (parsed.isAnonymous !== undefined) setIsAnonymous(parsed.isAnonymous);
      } catch (e) {
        console.error("Failed to load draft:", e);
      }
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    const draft = {
      type,
      severity,
      description,
      location,
      ttlPreset,
      isAnonymous,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [type, severity, description, location, ttlPreset, isAnonymous]);

  // Auto-select TTL based on type
  useEffect(() => {
    if (type) {
      setTtlPreset(typeConfig[type].autoTTL);
    }
  }, [type]);

  useEffect(() => leafletFix(), []);

  const handleTypeSelect = (selectedType: IncidentType) => {
    setSelectedTypeAnimation(selectedType);
    setTimeout(() => setSelectedTypeAnimation(null), 600);
    setType(selectedType);
  };

  const handleTagClick = (tag: string) => {
    if (!description.includes(tag)) {
      setDescription((prev) => (prev ? `${prev}, ${tag}` : tag));
    }
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(newLocation);
          
          // Плавное перемещение карты
          if (mapRef) {
            mapRef.flyTo([newLocation.lat, newLocation.lng], 15, {
              duration: 1.5,
            });
          }
          
          showToast("Геолокация получена", "success");
        },
        () => {
          showToast("Не удалось получить геолокацию", "error");
        }
      );
    } else {
      showToast("Геолокация не поддерживается", "error");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 5) {
      showToast("Максимум 5 файлов", "error");
      return;
    }

    selectedFiles.forEach((file) => {
      if (file.size > 20 * 1024 * 1024) {
        showToast(`Файл ${file.name} слишком большой (макс. 20MB)`, "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        setFiles((prev) => [
          ...prev,
          { file, preview, id: `${Date.now()}-${Math.random()}` },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (files.length + droppedFiles.length > 5) {
      showToast("Максимум 5 файлов", "error");
      return;
    }

    droppedFiles.forEach((file) => {
      if (file.size > 20 * 1024 * 1024) {
        showToast(`Файл ${file.name} слишком большой (макс. 20MB)`, "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        setFiles((prev) => [
          ...prev,
          { file, preview, id: `${Date.now()}-${Math.random()}` },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const isValid = type !== null && location !== null;

  const handleSubmit = async () => {
    if (!isValid || !location) return;

    if (reputation && !reputation.canCreateReports) {
      showToast(`Создание отчетов заблокировано. Репутация: ${reputation.score}/100`, "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await createReport({
        type: typeConfig[type].backendType,
        severity,
        description,
        lat: location.lat,
        lng: location.lng,
      });

      // Clear draft
      localStorage.removeItem(DRAFT_KEY);

      setShowSuccess(true);
      showToast("Отчет успешно создан!", "success");
    } catch (error: any) {
      console.error("Create report error:", error);
      if (error?.response?.status === 403) {
        showToast("Создание отчетов заблокировано", "error");
      } else {
        showToast("Ошибка при создании отчета", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTTL = (hours: number) => {
    if (hours < 24) return `${hours}ч`;
    if (hours < 168) return `${hours / 24}д`;
    return `${hours / 168}н`;
  };

  if (showSuccess) {
    return (
      <Box className={styles.successScreen}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        >
        <Card className={styles.successCard}>
          <CardContent sx={{ textAlign: "center", p: 4 }}>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
              >
            <CheckCircle sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
              Отчёт создан
            </Typography>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Ваш отчёт отправлен на модерацию
            </Typography>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="contained"
                onClick={() => nav("/map")}
                      sx={{ textTransform: "none", px: 3 }}
              >
                Открыть на карте
              </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setShowSuccess(false);
                  setType(null);
                  setSeverity(3);
                  setDescription("");
                  setLocation(null);
                  setFiles([]);
                  setTtlPreset("1d");
                  setIsAnonymous(false);
                }}
                      sx={{ textTransform: "none", px: 3 }}
              >
                Создать ещё
              </Button>
                  </motion.div>
            </Box>
              </motion.div>
          </CardContent>
        </Card>
        </motion.div>
      </Box>
    );
  }

  return (
    <Box className={styles.pageContainer}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
          Создать отчёт
        </Typography>

        {reputation && !reputation.canCreateReports && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Создание отчетов заблокировано. Ваша репутация: {reputation.score}/100
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Left Column: Form */}
          <Grid item xs={12} md={7}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {/* Type Selection */}
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Тип инцидента *
                    </Typography>
                      <Tooltip title="Выберите тип инцидента, который вы хотите сообщить. Это поможет другим пользователям быстро понять ситуацию." arrow>
                        <HelpOutline sx={{ fontSize: 18, color: "text.secondary" }} />
                      </Tooltip>
                    </Box>
                    <Grid container spacing={2}>
                      {(Object.keys(typeConfig) as IncidentType[]).map((t) => (
                        <Grid item xs={6} sm={3} key={t}>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            animate={
                              selectedTypeAnimation === t
                                ? {
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 10, -10, 0],
                                  }
                                : {}
                            }
                            transition={{ duration: 0.6 }}
                          >
                          <Card
                            className={styles.typeCard}
                            sx={{
                              cursor: "pointer",
                              border: type === t ? 2 : 1,
                              borderColor: type === t ? typeConfig[t].color : "divider",
                              bgcolor: type === t ? `${typeConfig[t].color}15` : "background.paper",
                                position: "relative",
                                overflow: "hidden",
                                "&::before": type === t
                                  ? {
                                      content: '""',
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      background: `linear-gradient(135deg, ${typeConfig[t].color}20 0%, transparent 100%)`,
                                      zIndex: 0,
                                    }
                                  : {},
                            }}
                            onClick={() => handleTypeSelect(t)}
                          >
                              <CardContent sx={{ textAlign: "center", p: 2, position: "relative", zIndex: 1 }}>
                                <motion.div
                                  animate={
                                    type === t
                                      ? {
                                          scale: [1, 1.3, 1],
                                          rotate: [0, 360],
                                        }
                                      : {}
                                  }
                                  transition={{ duration: 0.8, ease: "easeInOut" }}
                                >
                                  <Box
                                    sx={{
                                      color: typeConfig[t].color,
                                      mb: 1,
                                      filter: type === t ? "drop-shadow(0 0 8px currentColor)" : "none",
                                      transition: "filter 0.3s ease",
                                    }}
                                  >
                                {typeConfig[t].icon}
                              </Box>
                                </motion.div>
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                {typeConfig[t].label}
                              </Typography>
                            </CardContent>
                          </Card>
                          </motion.div>
                        </Grid>
                      ))}
                    </Grid>
                    {!type && (
                      <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                        Выберите тип инцидента
                      </Typography>
                    )}
                  </Box>

                  {/* Severity */}
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Уровень опасности: {severity}/5
                    </Typography>
                      <Tooltip title="Уровень опасности определяет приоритет отчета. Чем выше уровень, тем быстрее другие пользователи увидят ваш отчет." arrow>
                        <HelpOutline sx={{ fontSize: 18, color: "text.secondary" }} />
                      </Tooltip>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: "block" }}>
                      Влияет на приоритет
                    </Typography>
                    <Slider
                      value={severity}
                      onChange={(_, v) => setSeverity(v as number)}
                      min={1}
                      max={5}
                      marks
                      step={1}
                      sx={{
                        mt: 2,
                        "& .MuiSlider-thumb": {
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "scale(1.2)",
                            boxShadow: `0 0 0 8px ${
                              severity >= 4
                                ? "rgba(244, 67, 54, 0.16)"
                                : severity >= 3
                                ? "rgba(255, 152, 0, 0.16)"
                                : "rgba(76, 175, 80, 0.16)"
                            }`,
                          },
                        },
                        "& .MuiSlider-track": {
                          background: severity >= 4
                            ? "linear-gradient(90deg, #4caf50 0%, #ff9800 50%, #f44336 100%)"
                            : severity >= 3
                            ? "linear-gradient(90deg, #4caf50 0%, #ff9800 100%)"
                            : "linear-gradient(90deg, #4caf50 0%, #4caf50 100%)",
                          transition: "background 0.3s ease",
                        },
                        "& .MuiSlider-rail": {
                          opacity: 0.3,
                        },
                      }}
                    />
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                      <Typography variant="caption" sx={{ color: severity >= 4 ? "#f44336" : severity >= 3 ? "#ff9800" : "#4caf50", fontWeight: 600 }}>
                        {severity === 1 && "Низкая"}
                        {severity === 2 && "Слабая"}
                        {severity === 3 && "Средняя"}
                        {severity === 4 && "Высокая"}
                        {severity === 5 && "Критическая"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Description */}
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Описание
                    </Typography>
                      <Tooltip title="Подробное описание поможет другим пользователям лучше понять ситуацию. Вы можете использовать быстрые теги ниже." arrow>
                        <HelpOutline sx={{ fontSize: 18, color: "text.secondary" }} />
                      </Tooltip>
                    </Box>
                    <TextField
                      multiline
                      minRows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Опишите ситуацию..."
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          transition: "all 0.3s ease",
                          "&:hover": {
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          },
                          "&.Mui-focused": {
                            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.2)",
                          },
                        },
                      }}
                    />
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                      {quickTags.map((tag) => (
                        <motion.div
                          key={tag}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Chip
                          label={tag}
                          size="small"
                          onClick={() => handleTagClick(tag)}
                            sx={{
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              "&:hover": {
                                bgcolor: "primary.light",
                                color: "white",
                              },
                            }}
                        />
                        </motion.div>
                      ))}
                    </Box>
                  </Box>

                  {/* Location */}
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Где это? *
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<LocationOn />}
                      onClick={handleUseMyLocation}
                      sx={{ mb: 2, textTransform: "none" }}
                    >
                      Использовать мою геолокацию
                    </Button>
                    <Box
                      sx={{
                        height: 300,
                        borderRadius: 2,
                        overflow: "hidden",
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <MapContainer
                        center={location || [42.9, 71.36]}
                        zoom={13}
                        style={{ height: "100%", width: "100%" }}
                      >
                        <MapController onMapReady={setMapRef} />
                        <TileLayer
                          attribution='&copy; OpenStreetMap contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          errorTileUrl="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Crect width='256' height='256' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-family='Arial' font-size='14'%3EНет интернета%3C/text%3E%3C/svg%3E"
                          maxNativeZoom={19}
                          maxZoom={19}
                        />
                        <MapClickHandler
                          onPick={(lat, lng) => setLocation({ lat, lng })}
                        />
                        {location && (
                          <DraggableMarker
                            position={[location.lat, location.lng]}
                            onDragEnd={(lat, lng) => setLocation({ lat, lng })}
                          />
                        )}
                      </MapContainer>
                    </Box>
                    {location && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                        {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                      </Typography>
                    )}
                    {!location && (
                      <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                        Выберите местоположение на карте
                      </Typography>
                    )}
                  </Box>

                  {/* TTL */}
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Актуальность (TTL)
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {ttlPresets.map((preset) => (
                        <Chip
                          key={preset.value}
                          label={preset.label}
                          onClick={() => setTtlPreset(preset.value)}
                          color={ttlPreset === preset.value ? "primary" : "default"}
                          sx={{ cursor: "pointer" }}
                        />
                      ))}
                    </Box>
                    {type && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                        Автоподбор: {ttlPresets.find((p) => p.value === typeConfig[type].autoTTL)?.label}
                      </Typography>
                    )}
                  </Box>

                  {/* Attachments */}
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Вложения ({files.length}/5)
                    </Typography>
                    <motion.div
                      animate={isDragging ? { scale: 1.02, y: -4 } : { scale: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                    <Box
                      className={styles.dropZone}
                      onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        border: "2px dashed",
                          borderColor: isDragging ? "primary.main" : "divider",
                        borderRadius: 2,
                        p: 3,
                        textAlign: "center",
                        cursor: "pointer",
                          bgcolor: isDragging ? "primary.light" : "transparent",
                          transition: "all 0.3s ease",
                          position: "relative",
                          overflow: "hidden",
                        "&:hover": {
                          borderColor: "primary.main",
                          bgcolor: "action.hover",
                        },
                          "&::before": isDragging
                            ? {
                                content: '""',
                                position: "absolute",
                                top: 0,
                                left: "-100%",
                                width: "100%",
                                height: "100%",
                                background: "linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent)",
                                animation: "shimmer 1.5s infinite",
                              }
                            : {},
                      }}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*,.pdf"
                        onChange={handleFileSelect}
                        style={{ display: "none" }}
                      />
                        <motion.div
                          animate={isDragging ? { scale: 1.2, rotate: 180 } : { scale: 1, rotate: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {isDragging ? (
                            <CloudUpload sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
                          ) : (
                      <Add sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
                          )}
                        </motion.div>
                        <Typography variant="body2" color={isDragging ? "primary.main" : "text.secondary"} sx={{ fontWeight: isDragging ? 600 : 400 }}>
                          {isDragging ? "Отпустите для загрузки" : "Перетащите файлы сюда или нажмите для выбора"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        До 5 файлов, макс. 20MB каждый
                      </Typography>
                    </Box>
                    </motion.div>
                    <AnimatePresence>
                    {files.length > 0 && (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
                          {files.map((filePreview, index) => (
                            <motion.div
                              key={filePreview.id}
                              initial={{ opacity: 0, scale: 0.8, y: 20 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8, x: -20 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              whileHover={{ scale: 1.05 }}
                            >
                              <Box sx={{ position: "relative" }}>
                            <Box
                              sx={{
                                width: 100,
                                height: 100,
                                borderRadius: 1,
                                overflow: "hidden",
                                border: "1px solid",
                                borderColor: "divider",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                              }}
                            >
                              {filePreview.file.type.startsWith("image/") ? (
                                <img
                                  src={filePreview.preview}
                                  alt={filePreview.file.name}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              ) : (
                                <Box
                                  sx={{
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    bgcolor: "action.hover",
                                  }}
                                >
                                  <Typography variant="caption">{filePreview.file.name}</Typography>
                                </Box>
                              )}
                            </Box>
                                <motion.div
                                  whileHover={{ scale: 1.2 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFileRemove(filePreview.id);
                              }}
                              sx={{
                                position: "absolute",
                                top: -8,
                                right: -8,
                                bgcolor: "error.main",
                                color: "white",
                                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                                "&:hover": { bgcolor: "error.dark" },
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                                </motion.div>
                          </Box>
                            </motion.div>
                        ))}
                      </Box>
                    )}
                    </AnimatePresence>
                  </Box>

                  {/* Anonymous Toggle */}
                  <FormControlLabel
                    control={
                      <Switch checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
                    }
                    label="Анонимно (скрывает имя, но репутация учитывается)"
                  />

                  {/* Submit Button */}
                  <motion.div
                    whileHover={{ scale: isValid ? 1.02 : 1 }}
                    whileTap={{ scale: isValid ? 0.98 : 1 }}
                  >
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSubmit}
                    disabled={!isValid || isSubmitting || (reputation && !reputation.canCreateReports)}
                    fullWidth
                      sx={{
                        mt: 2,
                        py: 1.5,
                        textTransform: "none",
                        position: "relative",
                        overflow: "hidden",
                        transition: "all 0.3s ease",
                        "&:disabled": {
                          opacity: 0.6,
                        },
                        "&::before": isSubmitting
                          ? {
                              content: '""',
                              position: "absolute",
                              top: 0,
                              left: "-100%",
                              width: "100%",
                              height: "100%",
                              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                              animation: "shimmer 1.5s infinite",
                            }
                          : {},
                      }}
                  >
                    {isSubmitting ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Создание...
                      </>
                    ) : (
                        <>
                          <CheckCircleOutline sx={{ mr: 1 }} />
                          Создать отчёт
                        </>
                    )}
                  </Button>
                  </motion.div>

                  {!isValid && (
                    <Typography variant="caption" color="error" sx={{ textAlign: "center" }}>
                      Заполните обязательные поля: тип инцидента и местоположение
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Preview */}
          <Grid item xs={12} md={5}>
            <Fade in={true} timeout={500}>
            <Card className={styles.previewCard}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Превью отчета
                </Typography>
                  <AnimatePresence mode="wait">
                {type && location ? (
                      <motion.div
                        key="preview-content"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                  <Box>
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                          >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                              <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                              >
                                <Box sx={{ color: typeConfig[type].color, fontSize: 32 }}>
                        {typeConfig[type].icon}
                      </Box>
                              </motion.div>
                      <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                        {typeConfig[type].label}
                      </Typography>
                      <DangerPulse severity={severity} size={32} />
                    </Box>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 60 }}>
                              {description || (
                                <Box component="span" sx={{ fontStyle: "italic", opacity: 0.5 }}>
                                  Описание отсутствует
                                </Box>
                              )}
                    </Typography>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                      </Typography>
                    </Box>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                          >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        TTL: {formatTTL(ttlPresets.find((p) => p.value === ttlPreset)?.hours || 24)}
                      </Typography>
                      <Chip
                        label={isAnonymous ? "Анонимно" : "verified"}
                        size="small"
                        color={isAnonymous ? "default" : "success"}
                        sx={{ ml: "auto" }}
                      />
                    </Box>
                          </motion.div>
                    {files.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 }}
                            >
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
                                {files.map((f, index) => (
                                  <motion.div
                            key={f.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 + index * 0.1 }}
                                    whileHover={{ scale: 1.1 }}
                                  >
                                    <Box
                            sx={{
                              width: 60,
                              height: 60,
                              borderRadius: 1,
                              overflow: "hidden",
                              border: "1px solid",
                              borderColor: "divider",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            }}
                          >
                            {f.file.type.startsWith("image/") ? (
                              <img
                                src={f.preview}
                                alt={f.file.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  bgcolor: "action.hover",
                                }}
                              >
                                <Typography variant="caption" sx={{ fontSize: "0.6rem" }}>
                                  {f.file.name.substring(0, 10)}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                                  </motion.div>
                        ))}
                      </Box>
                            </motion.div>
                    )}
                  </Box>
                      </motion.div>
                ) : (
                      <motion.div
                        key="preview-empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                    Заполните форму для предпросмотра
                  </Typography>
                      </motion.div>
                )}
                  </AnimatePresence>
              </CardContent>
            </Card>
            </Fade>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
