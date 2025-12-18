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
} from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
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
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
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
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
        <Card className={styles.successCard}>
          <CardContent sx={{ textAlign: "center", p: 4 }}>
            <CheckCircle sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
              Отчёт создан
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Ваш отчёт отправлен на модерацию
            </Typography>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
              <Button
                variant="contained"
                onClick={() => nav("/map")}
                sx={{ textTransform: "none" }}
              >
                Открыть на карте
              </Button>
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
                sx={{ textTransform: "none" }}
              >
                Создать ещё
              </Button>
            </Box>
          </CardContent>
        </Card>
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
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Тип инцидента *
                    </Typography>
                    <Grid container spacing={2}>
                      {(Object.keys(typeConfig) as IncidentType[]).map((t) => (
                        <Grid item xs={6} sm={3} key={t}>
                          <Card
                            className={styles.typeCard}
                            sx={{
                              cursor: "pointer",
                              border: type === t ? 2 : 1,
                              borderColor: type === t ? typeConfig[t].color : "divider",
                              bgcolor: type === t ? `${typeConfig[t].color}15` : "background.paper",
                            }}
                            onClick={() => handleTypeSelect(t)}
                          >
                            <CardContent sx={{ textAlign: "center", p: 2 }}>
                              <Box sx={{ color: typeConfig[t].color, mb: 1 }}>
                                {typeConfig[t].icon}
                              </Box>
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                {typeConfig[t].label}
                              </Typography>
                            </CardContent>
                          </Card>
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
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      Уровень опасности: {severity}/5
                    </Typography>
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
                      sx={{ mt: 2 }}
                    />
                  </Box>

                  {/* Description */}
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      Описание
                    </Typography>
                    <TextField
                      multiline
                      minRows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Опишите ситуацию..."
                      fullWidth
                    />
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                      {quickTags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          onClick={() => handleTagClick(tag)}
                          sx={{ cursor: "pointer" }}
                        />
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
                        <TileLayer
                          attribution='&copy; OpenStreetMap contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
                    <Box
                      className={styles.dropZone}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        border: "2px dashed",
                        borderColor: "divider",
                        borderRadius: 2,
                        p: 3,
                        textAlign: "center",
                        cursor: "pointer",
                        "&:hover": {
                          borderColor: "primary.main",
                          bgcolor: "action.hover",
                        },
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
                      <Add sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Перетащите файлы сюда или нажмите для выбора
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        До 5 файлов, макс. 20MB каждый
                      </Typography>
                    </Box>
                    {files.length > 0 && (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
                        {files.map((filePreview) => (
                          <Box key={filePreview.id} sx={{ position: "relative" }}>
                            <Box
                              sx={{
                                width: 100,
                                height: 100,
                                borderRadius: 1,
                                overflow: "hidden",
                                border: "1px solid",
                                borderColor: "divider",
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
                                "&:hover": { bgcolor: "error.dark" },
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>

                  {/* Anonymous Toggle */}
                  <FormControlLabel
                    control={
                      <Switch checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
                    }
                    label="Анонимно (скрывает имя, но репутация учитывается)"
                  />

                  {/* Submit Button */}
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSubmit}
                    disabled={!isValid || isSubmitting || (reputation && !reputation.canCreateReports)}
                    fullWidth
                    sx={{ mt: 2, py: 1.5, textTransform: "none" }}
                  >
                    {isSubmitting ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Создание...
                      </>
                    ) : (
                      "Создать отчёт"
                    )}
                  </Button>

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
            <Card className={styles.previewCard}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Preview
                </Typography>
                {type && location ? (
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                      <Box sx={{ color: typeConfig[type].color }}>
                        {typeConfig[type].icon}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                        {typeConfig[type].label}
                      </Typography>
                      <DangerPulse severity={severity} size={32} />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {description || "Описание отсутствует"}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                      </Typography>
                    </Box>
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
                    {files.length > 0 && (
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
                        {files.map((f) => (
                          <Box
                            key={f.id}
                            sx={{
                              width: 60,
                              height: 60,
                              borderRadius: 1,
                              overflow: "hidden",
                              border: "1px solid",
                              borderColor: "divider",
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
                        ))}
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                    Заполните форму для предпросмотра
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
