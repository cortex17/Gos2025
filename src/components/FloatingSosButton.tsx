import { useState, useRef, useEffect } from "react";
import { Box, Button, Typography, Backdrop, CircularProgress } from "@mui/material";
import { Warning } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { useAuthStore } from "../store/auth";
import { panic } from "../api/panic";
import SosGuestModal from "./SosGuestModal";
import SosAuthModal from "./SosAuthModal";

interface FloatingSosButtonProps {
  position?: { lat: number; lng: number } | null;
}

export default function FloatingSosButton({ position }: FloatingSosButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [cancelTimer, setCancelTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const { token } = useAuthStore();

  const HOLD_DURATION = 2000; // 2 секунды удержания
  const CANCEL_DURATION = 3000; // 3 секунды на отмену

  useEffect(() => {
    if (isHolding && progressRef.current) {
      gsap.fromTo(
        progressRef.current,
        { scaleX: 0 },
        { scaleX: 1, duration: HOLD_DURATION / 1000, ease: "none" }
      );
    }
  }, [isHolding]);

  const handleMouseDown = () => {
    if (!token) {
      // Если не авторизован, открываем модал выбора
      setShowAuthModal(true);
      return;
    }

    if (!position) {
      alert("Выберите местоположение на карте");
      return;
    }

    setIsHolding(true);
    holdTimerRef.current = setTimeout(() => {
      setIsHolding(false);
      setShowConfirm(true);
      // Автоматическая отмена через 3 секунды
      const timer = setTimeout(() => {
        setShowConfirm(false);
      }, CANCEL_DURATION);
      setCancelTimer(timer);
    }, HOLD_DURATION);
  };

  const handleMouseUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setIsHolding(false);
  };

  const handleCancel = () => {
    if (cancelTimer) {
      clearTimeout(cancelTimer);
      setCancelTimer(null);
    }
    setShowConfirm(false);
    setIsHolding(false);
  };

  const handleConfirm = async () => {
    if (!position) return;

    if (cancelTimer) {
      clearTimeout(cancelTimer);
      setCancelTimer(null);
    }

    setIsSending(true);
    try {
      await panic({ lat: position.lat, lng: position.lng });
      setShowConfirm(false);
      alert("SOS сигнал отправлен!");
    } catch (error: any) {
      console.error("SOS error:", error);
      if (error?.response?.status === 401) {
        setShowConfirm(false);
        setShowAuthModal(true);
      } else {
        alert("Ошибка отправки SOS. Попробуйте снова.");
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <motion.div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="contained"
          color="error"
          size="large"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          disabled={isSending}
          sx={{
            borderRadius: "50%",
            width: 64,
            height: 64,
            minWidth: 64,
            boxShadow: "0 4px 20px rgba(244, 67, 54, 0.4)",
            position: "relative",
            overflow: "visible",
            "&:hover": {
              boxShadow: "0 6px 24px rgba(244, 67, 54, 0.6)",
            },
          }}
        >
          <Warning sx={{ fontSize: 32 }} />
          {isHolding && (
            <Box
              ref={progressRef}
              sx={{
                position: "absolute",
                bottom: -4,
                left: 0,
                right: 0,
                height: 4,
                bgcolor: "white",
                transformOrigin: "left",
              }}
            />
          )}
        </Button>
      </motion.div>

      {/* Confirm Modal for authenticated users */}
      <AnimatePresence>
        {showConfirm && (
          <Backdrop
            open
            sx={{
              bgcolor: "rgba(0, 0, 0, 0.7)",
              zIndex: 1300,
            }}
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Box
                sx={{
                  bgcolor: "background.paper",
                  borderRadius: 3,
                  p: 4,
                  maxWidth: 400,
                  textAlign: "center",
                }}
              >
                <Warning sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  Отправить SOS?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Сигнал будет отправлен в службы экстренного реагирования
                </Typography>
                {position && (
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: "block" }}>
                    Координаты: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: "block" }}>
                  Автоматическая отмена через 3 секунды
                </Typography>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    fullWidth
                    disabled={isSending}
                  >
                    Отмена
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleConfirm}
                    fullWidth
                    disabled={isSending}
                    startIcon={isSending ? <CircularProgress size={20} /> : <Warning />}
                  >
                    {isSending ? "Отправка..." : "Отправить SOS"}
                  </Button>
                </Box>
              </Box>
            </motion.div>
          </Backdrop>
        )}
      </AnimatePresence>

      {/* Auth Modal for non-authenticated users */}
      <SosAuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onQuickSos={() => setShowGuestModal(true)}
      />

      {/* Guest SOS Modal */}
      <SosGuestModal
        open={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        position={position}
      />
    </>
  );
}
