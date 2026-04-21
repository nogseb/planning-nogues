/*
 * Bento Box design: Filterable list page
 * Pill-shaped toggle filters, bento grid results
 */
import { useState, useMemo } from "react";
import { useWeekData } from "@/hooks/useWeekData";
import { usePlanningData, getDayInfo, GARDE_COLORS } from "@/hooks/usePlanningData";
import ActivityCard from "@/components/ActivityCard";
import { TYPE_COLORS, TYPE_LABELS, PRIORITE_LABELS, CRENEAU_LABELS, AVAILABLE_WEEKS } from "@/lib/types";
import { Search, X, SlidersHorizontal, Bike, Car, RotateCcw, ChevronLeft, ChevronRight, ChevronDown, Check } from "lucide-react";
import { Loader2 } from "lucide-react";

function ToggleChip({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-all duration-150 ${
        active
          ? "text-white border-transparent shadow-sm"
          : "text-muted-foreground border-border/60 hover:border-foreground/20 bg-card hover:bg-muted/50"
      }`}
      style={active && color ? { backgroundColor: color } : undefined}
    >
      {label}
    </button>
  );
}

export default function Liste() {
  const [weekIdx, setWeekIdx] = useState(0);
  const currentWeek = AVAILABLE_WEEKS[weekIdx];
  const { data, loading } = useWeekData(currentWeek.id);
  const { data: planningData } = usePlanningData();
  const [search, setSearch] = useState("");
  const [gardeFilter, setGardeFilter] = useState<string | null>(null);
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set());
  const [jourFilters, setJourFilters] = useState<Set<string>>(new Set());
  const [prioFilters, setPrioFilters] = useState<Set<string>>(new Set());
  const [creneauFilters, setCreneauFilters] = useState<Set<string>>(new Set());
  const [gratuitFilter, setGratuitFilter] = useState<boolean | null>(null);
  const [transportFilter, setTransportFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "priorite">("date");
  const [showFilters, setShowFilters] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const toggleSet = (set: Set<string>, value: string): Set<string> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  const JOURS = [
    { key: "1", label: "Lun" }, { key: "2", label: "Mar" },
    { key: "3", label: "Mer" }, { key: "4", label: "Jeu" },
    { key: "5", label: "Ven" }, { key: "6", label: "Sam" },
    { key: "0", label: "Dim" },
  ];

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = [...data.activites];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.titre.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.lieu.toLowerCase().includes(q)
      );
    }
    if (typeFilters.size > 0) list = list.filter(a => typeFilters.has(a.type));
    if (jourFilters.size > 0) list = list.filter(a => {
      const d = new Date(a.date + "T00:00:00");
      return jourFilters.has(d.getDay().toString());
    });
    if (prioFilters.size > 0) list = list.filter(a => prioFilters.has(a.priorite));
    if (creneauFilters.size > 0) list = list.filter(a => creneauFilters.has(a.creneau));
    if (gratuitFilter !== null) list = list.filter(a => a.gratuit === gratuitFilter);
    if (transportFilter) list = list.filter(a => a.transport === transportFilter);
    if (gardeFilter && planningData) {
      list = list.filter(a => {
        const info = getDayInfo(new Date(a.date + "T12:00:00"), planningData);
        return info.garde === gardeFilter;
      });
    }

    const prioOrder: Record<string, number> = { incontournable: 0, recommande: 1, optionnel: 2 };
    if (sortBy === "date") {
      list.sort((a, b) => a.date.localeCompare(b.date) || (prioOrder[a.priorite] ?? 3) - (prioOrder[b.priorite] ?? 3));
    } else {
      list.sort((a, b) => (prioOrder[a.priorite] ?? 3) - (prioOrder[b.priorite] ?? 3));
    }
    return list;
  }, [data, search, typeFilters, jourFilters, prioFilters, creneauFilters, gratuitFilter, transportFilter, gardeFilter, planningData, sortBy]);

  const hasActiveFilters =
    search.trim() !== "" || typeFilters.size > 0 || jourFilters.size > 0 ||
    prioFilters.size > 0 || creneauFilters.size > 0 ||
    gratuitFilter !== null || transportFilter !== null || gardeFilter !== null;

  const resetFilters = () => {
    setSearch(""); setTypeFilters(new Set()); setJourFilters(new Set());
    setPrioFilters(new Set()); setCreneauFilters(new Set());
    setGratuitFilter(null); setTransportFilter(null); setGardeFilter(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-5 sm:py-8 space-y-5">
      {/* Week selector */}
      {AVAILABLE_WEEKS.length > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setWeekIdx(Math.max(0, weekIdx - 1))}
            disabled={weekIdx === 0}
            className="p-2 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-1.5">
            {AVAILABLE_WEEKS.map((w, i) => (
              <button
                key={w.id}
                onClick={() => setWeekIdx(i)}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all duration-200 ${
                  i === weekIdx
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40"
                }`}
              >
                {w.short}
              </button>
            ))}
          </div>
          <button
            onClick={() => setWeekIdx(Math.min(AVAILABLE_WEEKS.length - 1, weekIdx + 1))}
            disabled={weekIdx === AVAILABLE_WEEKS.length - 1}
            className="p-2 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-extrabold text-xl sm:text-2xl tracking-tight">
          Activités — {currentWeek.short}
        </h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`sm:hidden flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all duration-150 ${
            showFilters ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtres
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une activité..."
          className="w-full pl-11 pr-10 py-3 rounded-2xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {/* Filters panel — accordion */}
      <div className={`bento-card overflow-hidden transition-all duration-300 ${showFilters ? "block" : "hidden sm:block"}`}>
        {/* Accordion header */}
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="w-full flex items-center justify-between px-4 sm:px-5 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            Filtres
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-primary/10 text-primary">
                actifs
              </span>
            )}
          </span>
          <span className="flex items-center gap-1.5">
            {filtersOpen ? (
              <Check className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </span>
        </button>

        {/* Accordion content */}
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            filtersOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
        <div className="overflow-hidden">
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4">
        {/* Garde */}
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Garde</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(GARDE_COLORS).map(([key, val]) => (
              <ToggleChip key={key} label={val.label} active={gardeFilter === key} color={val.text}
                onClick={() => setGardeFilter(gardeFilter === key ? null : key)} />
            ))}
          </div>
        </div>

        {/* Type */}
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Type</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <ToggleChip key={key} label={label} active={typeFilters.has(key)} color={TYPE_COLORS[key]}
                onClick={() => setTypeFilters(toggleSet(typeFilters, key))} />
            ))}
          </div>
        </div>

        {/* Jour */}
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Jour</p>
          <div className="flex flex-wrap gap-2">
            {JOURS.map(({ key, label }) => (
              <ToggleChip key={key} label={label} active={jourFilters.has(key)} color="#374151"
                onClick={() => setJourFilters(toggleSet(jourFilters, key))} />
            ))}
          </div>
        </div>

        {/* Priorite + Creneau row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Priorité</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PRIORITE_LABELS).map(([key, label]) => (
                <ToggleChip key={key} label={label} active={prioFilters.has(key)}
                  color={key === "incontournable" ? "#b45309" : key === "recommande" ? "#0369a1" : "#6b7280"}
                  onClick={() => setPrioFilters(toggleSet(prioFilters, key))} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Créneau</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CRENEAU_LABELS).map(([key, label]) => (
                <ToggleChip key={key} label={label} active={creneauFilters.has(key)} color="#475569"
                  onClick={() => setCreneauFilters(toggleSet(creneauFilters, key))} />
              ))}
            </div>
          </div>
        </div>

        {/* Tarif + Transport + Sort */}
        <div className="flex flex-wrap items-end gap-5">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Tarif</p>
            <div className="flex gap-2">
              <ToggleChip label="Gratuit" active={gratuitFilter === true} color="#059669"
                onClick={() => setGratuitFilter(gratuitFilter === true ? null : true)} />
              <ToggleChip label="Payant" active={gratuitFilter === false} color="#b45309"
                onClick={() => setGratuitFilter(gratuitFilter === false ? null : false)} />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Transport</p>
            <div className="flex gap-2">
              <button
                onClick={() => setTransportFilter(transportFilter === "velo" ? null : "velo")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-all duration-150 ${
                  transportFilter === "velo"
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "text-muted-foreground border-border/60 bg-card hover:bg-muted/50"
                }`}
              >
                <Bike className="w-3.5 h-3.5" /> Vélo
              </button>
              <button
                onClick={() => setTransportFilter(transportFilter === "voiture" ? null : "voiture")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-all duration-150 ${
                  transportFilter === "voiture"
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "text-muted-foreground border-border/60 bg-card hover:bg-muted/50"
                }`}
              >
                <Car className="w-3.5 h-3.5" /> Voiture
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "priorite")}
              className="text-[12px] px-3 py-1.5 rounded-xl border border-border bg-card font-medium"
            >
              <option value="date">Tri par date</option>
              <option value="priorite">Tri par priorité</option>
            </select>
            {hasActiveFilters && (
              <button onClick={resetFilters}
                className="flex items-center gap-1.5 text-[12px] text-primary hover:underline font-semibold">
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
        </div>
        </div>
        </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-[13px] text-muted-foreground font-medium">
        {filtered.length} activité{filtered.length !== 1 ? "s" : ""} trouvée{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Activity bento grid */}
      <div className="bento-grid">
        {filtered.map((a, i) => (
          <div key={i} className={a.priorite === "incontournable" ? "bento-span-2" : ""}>
            <ActivityCard activity={a} />
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bento-card bento-span-2 p-8 text-center col-span-full">
            <p className="text-sm text-muted-foreground italic">
              Aucune activité ne correspond aux filtres sélectionnés.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
