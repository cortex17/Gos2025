import L from "leaflet";
import "leaflet/dist/leaflet.css";
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";

export function leafletFix() {
  // Fix Leaflet marker icons in Vite
  // @ts-expect-error - private prop
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: marker2x,
    iconUrl: marker,
    shadowUrl: shadow,
  });
}
