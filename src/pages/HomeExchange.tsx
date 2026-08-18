/*
 * Page dédiée HomeExchange multi-années : Bizet et Étoile par année sélectionnée.
 * Alertes de conflit quand un échange Bizet chevauche une garde Sébastien
 * Calendrier avec tooltips au survol
 */
import { useMemo, useState } from "react";
import { usePlanningData, getDayInfo, EVENT_COLORS } from "@/hooks/usePlanningData";
import { Home, ExternalLink, Calendar, MapPin, User, AlertTriangle } from "lucide-react";
import { Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

// Couleurs logements
const BIZET_COLOR = { bg: "#1a4d2e", light: "#d4edda", text: "#ffffff" }; // vert bouteille
const ETOILE_COLOR = { bg: "#e67e22", light: "#fdebd0", text: "#ffffff" }; // orange

function formatDateRange(debut: string, fin: string): string {
  const d1 = new Date(debut + "T12:00:00");
  const d2 = new Date(fin + "T12:00:00");
  if (debut === fin) {
    return d1.toLocaleDateString("fr-FR", { day: "numeric", month: "long", weekday: "long" });
  }
  return `${d1.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} → ${d2.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
}

function getDuration(debut: string, fin: string): number {
  const d1 = new Date(debut + "T12:00:00");
  const d2 = new Date(fin + "T12:00:00");
  return Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1;
}

function getStatus(debut: string, fin: string): { label: string; color: string; bg: string } {
  const today = new Date().toISOString().split("T")[0];
  if (fin < today) return { label: "Terminé", color: "#6b7280", bg: "#f3f4f6" };
  if (debut <= today && fin >= today) return { label: "En cours", color: "#059669", bg: "#d1fae5" };
  return { label: "À venir", color: "#d97706", bg: "#fef3c7" };
}

interface Exchange {
  logement: string;
  debut: string;
  fin: string;
  voyageur: string;
  url: string;
}

interface ConflictDay {
  date: string;
  garde: string;
}

function ExchangeCard({ ex, conflicts }: { ex: Exchange; conflicts?: ConflictDay[] }) {
  const status = getStatus(ex.debut, ex.fin);
  const duration = getDuration(ex.debut, ex.fin);
  const isPast = ex.fin < new Date().toISOString().split("T")[0];
  const hasConflict = conflicts && conflicts.length > 0;

  return (
    <div className={`bento-card p-4 hover:shadow-md transition-all ${isPast ? "opacity-60 hover:opacity-100" : ""} ${hasConflict ? "ring-2 ring-amber-500/50" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
              style={{ backgroundColor: status.bg, color: status.color }}
            >
              {status.label}
            </span>
            <span className="text-xs bg-muted/60 px-2 py-0.5 rounded-lg text-muted-foreground">
              {duration - 1} nuit{duration - 1 > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{formatDateRange(ex.debut, ex.fin)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-sm">
            <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="font-medium">{ex.voyageur}</span>
          </div>
          {/* Alerte conflit */}
          {hasConflict && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-1.5 text-amber-700 text-xs font-semibold mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Conflit garde
              </div>
              <p className="text-[11px] text-amber-600 leading-relaxed">
                {conflicts!.length} jour{conflicts!.length > 1 ? "s" : ""} de chevauchement avec la garde Sébastien :{" "}
                {conflicts!.slice(0, 4).map(c => {
                  const d = new Date(c.date + "T12:00:00");
                  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
                }).join(", ")}
                {conflicts!.length > 4 ? ` (+${conflicts!.length - 4})` : ""}
              </p>
            </div>
          )}
        </div>
        <a
          href={ex.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 p-2 rounded-xl hover:bg-muted transition-colors"
          title="Ouvrir la conversation"
        >
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
        </a>
      </div>
    </div>
  );
}

function LogementColumn({ title, subtitle, exchanges, conflictsMap }: { title: string; subtitle: string; exchanges: Exchange[]; conflictsMap: Map<string, ConflictDay[]> }) {
  const today = new Date().toISOString().split("T")[0];
  const upcoming = exchanges.filter(e => e.fin >= today).sort((a, b) => a.debut.localeCompare(b.debut));
  const past = exchanges.filter(e => e.fin < today).sort((a, b) => b.debut.localeCompare(a.debut));
  const totalNights = exchanges.reduce((sum, e) => sum + getDuration(e.debut, e.fin) - 1, 0);

  return (
    <div className="space-y-4">
      {/* Column header */}
      <div className="bento-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-primary" />
          <h2 className="font-heading font-bold text-base">{title}</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>
        <div className="flex items-center gap-4 text-sm">
          <span className="font-semibold">{exchanges.length} échange{exchanges.length > 1 ? "s" : ""}</span>
          <span className="text-muted-foreground">{totalNights} nuitée{totalNights > 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">À venir</p>
          {upcoming.map((ex, i) => (
            <ExchangeCard key={`up-${i}`} ex={ex} conflicts={conflictsMap.get(`${ex.debut}-${ex.voyageur}`)} />
          ))}
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Terminés</p>
          {past.map((ex, i) => (
            <ExchangeCard key={`past-${i}`} ex={ex} conflicts={conflictsMap.get(`${ex.debut}-${ex.voyageur}`)} />
          ))}
        </div>
      )}

      {exchanges.length === 0 && (
        <div className="bento-card p-6 text-center">
          <p className="text-sm text-muted-foreground italic">Aucun échange enregistré.</p>
        </div>
      )}
    </div>
  );
}

export default function HomeExchangePage() {
  const [year, setYear] = useState(2026);
  const { data: planningData, loading } = usePlanningData(year);

  const exchanges = planningData?.home_exchange || [];
  const bizet = exchanges.filter(e => e.logement.includes("Bizet"));
  const etoile = exchanges.filter(e => !e.logement.includes("Bizet"));
  const totalNights = exchanges.reduce((sum, e) => sum + getDuration(e.debut, e.fin) - 1, 0);

  // Calculer les conflits pour Bizet (chevauchement avec garde Sébastien)
  const conflictsMap = useMemo(() => {
    const map = new Map<string, ConflictDay[]>();
    if (!planningData) return map;

    const bizetExchanges = (planningData.home_exchange || []).filter(e => e.logement.includes("Bizet"));
    for (const ex of bizetExchanges) {
      const conflicts: ConflictDay[] = [];
      const start = new Date(ex.debut + "T12:00:00");
      const end = new Date(ex.fin + "T12:00:00");
      const current = new Date(start);

      while (current <= end) {
        const dayInfo = getDayInfo(current, planningData);
        const garde = dayInfo.gardeMatin || dayInfo.garde;
        if (garde === "sebastien" || dayInfo.gardeSoir === "sebastien") {
          conflicts.push({ date: dayInfo.date, garde: "sebastien" });
        }
        current.setDate(current.getDate() + 1);
      }

      if (conflicts.length > 0) {
        map.set(`${ex.debut}-${ex.voyageur}`, conflicts);
      }
    }
    return map;
  }, [planningData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-5 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: EVENT_COLORS.home_exchange.bg }}>
            <Home className="w-5 h-5" style={{ color: EVENT_COLORS.home_exchange.text }} />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight">
              HomeExchange
            </h1>
            <p className="text-sm text-muted-foreground">
              Échanges de logements — planning et suivi {year}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm flex-wrap justify-end">
          <div className="flex items-center rounded-xl border border-border/60 p-0.5 bg-card">
            {[2026, 2027].map((option) => (
              <button
                key={option}
                onClick={() => setYear(option)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${year === option ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="text-center">
            <p className="text-xl font-heading font-extrabold">{exchanges.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Échanges</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-xl font-heading font-extrabold">{totalNights}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Nuitées</p>
          </div>
        </div>
      </div>

      {/* Two columns: Bizet / Étoile */}
      <div className="grid md:grid-cols-2 gap-6">
        <LogementColumn
          title="Maison rue Bizet"
          subtitle="Maison avec jardin — idéale familles"
          exchanges={bizet}
          conflictsMap={conflictsMap}
        />
        <LogementColumn
          title="Appartement rue de l'Étoile"
          subtitle="Appartement centre-ville — couples et solo"
          exchanges={etoile}
          conflictsMap={new Map()}
        />
      </div>

      {/* Calendrier des partages */}
      <ExchangeCalendar exchanges={exchanges} year={year} />
    </div>
  );
}

/* ── Calendrier des partages ── */
const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const JOURS_COURTS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function inRange(ds: string, debut: string, fin: string): boolean {
  return ds >= debut && ds <= fin;
}

function ExchangeCalendar({ exchanges, year }: { exchanges: Exchange[]; year: number }) {
  const startMonth = year === new Date().getFullYear() ? new Date().getMonth() : 0;

  // 3 mois : mois courant + 2 suivants
  const months = useMemo(() => {
    const result: { year: number; month: number }[] = [];
    for (let i = 0; i < 3; i++) {
      let m = startMonth + i;
      let y = year;
      if (m > 11) { m -= 12; y += 1; }
      result.push({ year: y, month: m });
    }
    return result;
  }, [startMonth, year]);

  return (
    <div className="space-y-4">
      <h2 className="font-heading font-bold text-lg flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        Calendrier des partages
      </h2>
      <div className="grid sm:grid-cols-3 gap-4">
        {months.map(({ year, month }) => (
          <MonthCalendar key={`${year}-${month}`} year={year} month={month} exchanges={exchanges} />
        ))}
      </div>
      {exchanges.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">Aucun échange HomeExchange enregistré en {year}.</p>
      )}
      {/* Légende */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md" style={{ backgroundColor: BIZET_COLOR.bg }} />
          Bizet
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md" style={{ backgroundColor: ETOILE_COLOR.bg }} />
          Étoile
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md" style={{ background: `linear-gradient(135deg, ${BIZET_COLOR.bg} 50%, ${ETOILE_COLOR.bg} 50%)` }} />
          Les deux
        </span>
      </div>
    </div>
  );
}

function MonthCalendar({ year, month, exchanges }: { year: number; month: number; exchanges: Exchange[] }) {
  const days = useMemo(() => getCalendarDays(year, month), [year, month]);
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <div className="bento-card p-4">
      <h3 className="font-heading font-bold text-sm text-center mb-3">
        {MOIS[month]} {year}
      </h3>
      {/* Header jours */}
      <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        {JOURS_COURTS.map((j) => (
          <div key={j} className="py-1">{j}</div>
        ))}
      </div>
      {/* Grille jours */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, i) => {
          if (!day) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }

          const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
          const isToday = dateStr === todayStr;

          // Check which logements are booked
          const bizetExchange = exchanges.find(e => e.logement.includes("Bizet") && inRange(dateStr, e.debut, e.fin));
          const etoileExchange = exchanges.find(e => !e.logement.includes("Bizet") && inRange(dateStr, e.debut, e.fin));
          const hasBizet = !!bizetExchange;
          const hasEtoile = !!etoileExchange;

          let cellStyle: React.CSSProperties = {};
          let textColor = "inherit";

          if (hasBizet && hasEtoile) {
            cellStyle = { background: `linear-gradient(135deg, ${BIZET_COLOR.bg} 50%, ${ETOILE_COLOR.bg} 50%)` };
            textColor = "#ffffff";
          } else if (hasBizet) {
            cellStyle = { backgroundColor: BIZET_COLOR.bg };
            textColor = "#ffffff";
          } else if (hasEtoile) {
            cellStyle = { backgroundColor: ETOILE_COLOR.bg };
            textColor = "#ffffff";
          }

          // Build tooltip text
          let tooltipText = "";
          if (hasBizet && hasEtoile) {
            tooltipText = `Bizet : ${bizetExchange.voyageur}\nÉtoile : ${etoileExchange.voyageur}`;
          } else if (hasBizet) {
            tooltipText = `Bizet : ${bizetExchange.voyageur}`;
          } else if (hasEtoile) {
            tooltipText = `Étoile : ${etoileExchange.voyageur}`;
          }

          const hasBooking = hasBizet || hasEtoile;

          const dayCell = (
            <div
              className={`aspect-square flex items-center justify-center rounded-md text-[11px] font-medium relative ${
                isToday ? "ring-2 ring-foreground/40 ring-offset-1" : ""
              } ${hasBooking ? "cursor-pointer" : ""}`}
              style={{ ...cellStyle, color: textColor }}
            >
              {day.getDate()}
            </div>
          );

          if (hasBooking) {
            return (
              <Tooltip key={dateStr}>
                <TooltipTrigger asChild>
                  {dayCell}
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs whitespace-pre-line">
                  {tooltipText}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <div key={dateStr}>{dayCell}</div>;
        })}
      </div>
    </div>
  );
}
