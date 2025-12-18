import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { Report } from "../api/reports";

interface MarkerClusterProps {
  reports: Report[];
  onMarkerClick?: (report: Report) => void;
}

export default function MarkerCluster({ reports, onMarkerClick }: MarkerClusterProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Создаем группу кластеров
    const markers = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });

    // Добавляем маркеры
    reports.forEach((report) => {
      const marker = L.marker([report.lat, report.lng], {
        icon: L.divIcon({
          className: "custom-marker",
          html: `<div style="
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: ${report.severity >= 4 ? "#f44336" : report.severity >= 3 ? "#ff9800" : "#4caf50"};
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          "></div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
      });

      marker.bindPopup(`
        <div style="min-width: 200px;">
          <strong>${report.type}</strong><br/>
          Уровень: ${report.severity}/5<br/>
          ${report.description ? `<p>${report.description}</p>` : ""}
        </div>
      `);

      if (onMarkerClick) {
        marker.on("click", () => onMarkerClick(report));
      }

      markers.addLayer(marker);
    });

    map.addLayer(markers);

    return () => {
      map.removeLayer(markers);
    };
  }, [map, reports, onMarkerClick]);

  return null;
}

