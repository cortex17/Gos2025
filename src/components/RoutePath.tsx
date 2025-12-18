import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import gsap from "gsap";

interface RoutePathProps {
  points: Array<{ lat: number; lng: number }>;
  color?: string;
  width?: number;
}

export default function RoutePath({ points, color = "#2196f3", width = 4 }: RoutePathProps) {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path || points.length < 2) return;

    // Создаем SVG path из точек
    const pathData = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.lng} ${-p.lat}`)
      .join(" ");

    path.setAttribute("d", pathData);

    // Получаем длину пути
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length} ${length}`;
    path.style.strokeDashoffset = `${length}`;

    // Анимация stroke-dashoffset
    gsap.to(path, {
      strokeDashoffset: 0,
      duration: 2,
      ease: "power2.inOut",
    });

    return () => {
      gsap.killTweensOf(path);
    };
  }, [points]);

  if (points.length < 2) return null;

  // Простая проекция для отображения (в реальном приложении нужна правильная проекция карты)
  const minLng = Math.min(...points.map(p => p.lng));
  const maxLng = Math.max(...points.map(p => p.lng));
  const minLat = Math.min(...points.map(p => p.lat));
  const maxLat = Math.max(...points.map(p => p.lat));

  const viewBox = `${minLng - 0.01} ${-maxLat - 0.01} ${maxLng - minLng + 0.02} ${maxLat - minLat + 0.02}`;

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        zIndex: 500,
      }}
    >
      <svg
        viewBox={viewBox}
        preserveAspectRatio="none"
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <path
          ref={pathRef}
          fill="none"
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.8}
        />
      </svg>
    </Box>
  );
}

