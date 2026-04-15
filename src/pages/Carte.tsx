import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import L from "leaflet";
import { useWeekData } from "@/hooks/useWeekData";
import { TYPE_COLORS, TYPE_LABELS, GUILHEMERY, AVAILABLE_WEEKS } from "@/lib/types";
import type { Activity } from "@/lib/types";
import { MapView } from "@/components/Map";
import {
  Crosshair,
  Star,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Loader as Loader2 } from "lucide-react";

function ToggleChip({
  label, active, color, onClick,
}: { label: string; active: boolean; color?: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all duration-150 ${
        active ? "text-white border-transparent" : "text-muted-foreground border-border/60 bg-card hover:bg-muted/50"
      }`}
      style={active && color ? { backgroundColor: color } : undefined}
    >
      {label}
    </button>
  );
}

export default function Carte() {
  const [weekIdx, setWeekIdx] = useState(0);
  const currentWeek = AVAILABLE_WEEKS[weekIdx];
  const { data, loading } = useWeekData(currentWeek.id);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const circlesRef = useRef<L.Circle[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set());
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const toggleSet = (set: Set<string>, value: string): Set<string> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = data.activites;
    if (typeFilters.size > 0) list = list.filter(a => typeFilters.has(a.type));
    return list;
  }, [data, typeFilters]);

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;

    const homeIcon = L.divIcon({
      html: `<div style="width:28px;height:28px;border-radius:14px;background:#1C1C1E;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
      </div>`,
      className: "",
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    L.marker([GUILHEMERY.lat, GUILHEMERY.lng], { icon: homeIcon })
      .addTo(map)
      .bindPopup("<strong style='font-family:Inter,sans-serif'>Maison \u2014 Guilh\u00e9m\u00e9ry</strong>");

    const circleStyle = { fillOpacity: 0.03, weight: 1, opacity: 0.5 };
    circlesRef.current = [
      L.circle([GUILHEMERY.lat, GUILHEMERY.lng], { radius: 5000, color: "#2d9d5f", fillColor: "#2d9d5f", ...circleStyle }).addTo(map),
      L.circle([GUILHEMERY.lat, GUILHEMERY.lng], { radius: 10000, color: "#0891b2", fillColor: "#0891b2", ...circleStyle }).addTo(map),
      L.circle([GUILHEMERY.lat, GUILHEMERY.lng], { radius: 30000, color: "#ca8a04", fillColor: "#ca8a04", ...circleStyle }).addTo(map),
    ];

    setMapReady(true);
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    for (const m of markersRef.current) {
      m.remove();
    }
    markersRef.current = [];

    for (const a of filtered) {
      if (!a.latitude || !a.longitude) continue;
      const color = TYPE_COLORS[a.type] || "#666";
      const radius = a.priorite === "incontournable" ? 9 : a.priorite === "recommande" ? 7 : 5;

      const marker = L.circleMarker([a.latitude, a.longitude], {
        radius,
        fillColor: color,
        color: "white",
        weight: 2,
        fillOpacity: 1,
      }).addTo(mapRef.current!);

      const popupContent = `
        <div style="font-family:'DM Sans',sans-serif;max-width:270px;">
          <div style="display:inline-block;padding:3px 10px;border-radius:8px;font-size:11px;font-weight:600;color:white;background:${color};margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">
            ${TYPE_LABELS[a.type] || a.type}
          </div>
          ${a.priorite === "incontournable" ? '<span style="margin-left:4px;padding:3px 8px;border-radius:8px;font-size:10px;font-weight:700;background:#fef3c7;color:#92400e;">Incontournable</span>' : ""}
          <h3 style="font-family:'Inter',sans-serif;font-size:14px;font-weight:700;margin:6px 0 4px;letter-spacing:-0.01em;">${a.titre}</h3>
          <p style="font-size:12px;color:#888;margin:0 0 8px;line-height:1.5;">${a.description.slice(0, 120)}${a.description.length > 120 ? "..." : ""}</p>
          <div style="font-size:11px;color:#999;line-height:1.7;">
            <div>${a.lieu.split(",")[0]}</div>
            <div>${a.horaire} (${a.duree})</div>
            <div>${a.distance_km} km — ${a.distance_temps}</div>
            <div>${a.tarif}</div>
          </div>
          ${a.url && a.url !== "https://metropole.toulouse.fr/agenda" ? `<a href="${a.url}" target="_blank" style="display:inline-block;margin-top:8px;font-size:11px;color:#7c3aed;font-weight:600;text-decoration:none;">Plus d'infos &rarr;</a>` : ""}
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on("click", () => {
        setSelectedActivity(a);
      });

      markersRef.current.push(marker);
    }
  }, [filtered, mapReady]);

  const centerOnHome = useCallback(() => {
    mapRef.current?.setView([GUILHEMERY.lat, GUILHEMERY.lng], 12);
  }, []);

  const flyToActivity = useCallback((a: Activity) => {
    if (!mapRef.current) return;
    mapRef.current.setView([a.latitude, a.longitude], 14);
    setSelectedActivity(a);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative" style={{ height: "calc(100vh - 64px)" }}>
      <MapView
        className="absolute inset-0 w-full h-full !rounded-none"
        initialCenter={{ lat: GUILHEMERY.lat, lng: GUILHEMERY.lng }}
        initialZoom={12}
        onMapReady={handleMapReady}
      />

      <div className="absolute top-4 left-4 z-[1000] flex gap-2">
        <button onClick={centerOnHome}
          className="bento-card px-4 py-2.5 flex items-center gap-2 text-[13px] font-semibold hover:bg-muted/50 transition-colors"
        >
          <Crosshair className="w-4 h-4" />
          <span className="hidden sm:inline">Guilh&eacute;m&eacute;ry</span>
        </button>
        {AVAILABLE_WEEKS.length > 1 && (
          <div className="bento-card px-2 py-1.5 flex items-center gap-1">
            <button onClick={() => setWeekIdx(Math.max(0, weekIdx - 1))} disabled={weekIdx === 0}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-all disabled:opacity-30">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {AVAILABLE_WEEKS.map((w, i) => (
              <button key={w.id} onClick={() => setWeekIdx(i)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  i === weekIdx ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}>{w.short}</button>
            ))}
            <button onClick={() => setWeekIdx(Math.min(AVAILABLE_WEEKS.length - 1, weekIdx + 1))} disabled={weekIdx === AVAILABLE_WEEKS.length - 1}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-all disabled:opacity-30">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <button onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-4 right-16 z-[1000] sm:hidden bento-card p-2.5"
      >
        {sidebarOpen ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
      </button>

      <div className={`absolute top-3 right-3 bottom-3 z-[999] w-[280px] bento-card overflow-hidden transition-transform duration-200 ${
        sidebarOpen ? "translate-x-0" : "translate-x-[calc(100%+12px)] sm:translate-x-0"
      }`}>
        <div className="h-full overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-[13px]">Activit&eacute;s</h2>
            <span className="text-[11px] text-muted-foreground font-medium bg-muted/60 px-2 py-0.5 rounded-lg">
              {filtered.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <ToggleChip key={key} label={label} active={typeFilters.has(key)} color={TYPE_COLORS[key]}
                onClick={() => setTypeFilters(toggleSet(typeFilters, key))} />
            ))}
          </div>

          <div className="space-y-2 pt-2 border-t border-border/50">
            {filtered.map((a, i) => (
              <button key={i} onClick={() => flyToActivity(a)}
                className={`w-full text-left p-3 rounded-xl border transition-all duration-150 ${
                  selectedActivity === a
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/40 hover:bg-muted/40 hover:border-border"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: TYPE_COLORS[a.type] || "#666" }} />
                  <span className="text-[12px] font-semibold truncate text-card-foreground">
                    {a.titre}
                  </span>
                  {a.priorite === "incontournable" && (
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-2 pl-[18px]">
                  <span>{a.lieu.split(",")[0]}</span>
                  <span className="text-border">|</span>
                  <span>{a.distance_km} km</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
