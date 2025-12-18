import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import gsap from "gsap";

interface DangerPulseProps {
  severity: number; // 1-5
  size?: number;
}

export default function DangerPulse({ severity, size = 40 }: DangerPulseProps) {
  const pulseRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pulse = pulseRef.current;
    const ring = ringRef.current;
    if (!pulse || !ring) return;

    // Размер зависит от severity (1-5)
    // const baseSize = size;
    // const scale = 0.5 + (severity / 5) * 0.5; // 0.5 - 1.0
    const frequency = 1.5 - (severity / 5) * 0.5; // 1.5s - 1.0s (чем выше severity, тем чаще)

    // Пульсация основного круга
    gsap.to(pulse, {
      scale: 1 + (severity / 5) * 0.3,
      opacity: 0.7,
      duration: frequency,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    // Кольцо пульса
    gsap.to(ring, {
      scale: 1 + (severity / 5) * 0.8,
      opacity: 0,
      duration: frequency,
      repeat: -1,
      ease: "power2.out",
    });

    return () => {
      gsap.killTweensOf([pulse, ring]);
    };
  }, [severity, size]);

  // Цвет зависит от severity
  const getColor = () => {
    if (severity >= 4) return "#f44336"; // Красный
    if (severity >= 3) return "#ff9800"; // Оранжевый
    return "#ffc107"; // Желтый
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Кольцо пульса */}
      <Box
        ref={ringRef}
        sx={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: "50%",
          border: `2px solid ${getColor()}`,
          opacity: 0,
        }}
      />
      
      {/* Основной круг */}
      <Box
        ref={pulseRef}
        sx={{
          width: size * 0.7,
          height: size * 0.7,
          borderRadius: "50%",
          bgcolor: getColor(),
          boxShadow: `0 0 ${size * 0.5}px ${getColor()}`,
        }}
      />
    </Box>
  );
}

