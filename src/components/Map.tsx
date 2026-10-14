import { useEffect, useRef } from "react";
import L, { type Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapViewProps {
  className?: string;
  initialCenter?: L.LatLngExpression;
  initialZoom?: number;
  onMapReady?: (map: LeafletMap) => void;
}

/**
 * Carte entièrement côté client : fonds OpenStreetMap et Leaflet, sans proxy ni
 * clé de plateforme. Les tuiles sont chargées en HTTPS depuis OpenStreetMap.
 */
export function MapView({
  className,
  initialCenter = [43.6045, 1.444],
  initialZoom = 12,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const onMapReadyRef = useRef(onMapReady);

  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = L.map(mapContainer.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(initialCenter, initialZoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; contributeurs OpenStreetMap",
    }).addTo(map);

    mapRef.current = map;
    onMapReadyRef.current?.(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // La position de départ est volontairement lue une seule fois à l'initialisation.
    // Les déplacements ultérieurs sont pilotés par les contrôles de la page Carte.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mapContainer} className={className ?? "w-full h-[500px]"} />;
}
