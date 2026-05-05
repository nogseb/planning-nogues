/*
 * Bento Box design: Home / Activités page
 * Modular grid with weather widgets, game card, and activity cards
 * Week selector to switch between available weeks
 */
import { useState, useMemo } from "react";
import { useWeekData } from "@/hooks/useWeekData";
import { usePlanningData, getDayInfo, GARDE_COLORS, EVENT_COLORS } from "@/hooks/usePlanningData";
import type { PlanningData } from "@/hooks/usePlanningData";
import ActivityCard from "@/components/ActivityCard";
import { formatDateFr, getDatesForWeek, isWeekend } from "@/lib/utils";
import type { Activity } from "@/lib/types";
import { AVAILABLE_WEEKS } from "@/lib/types";
import {
  CloudRain,
  Sun,
  Cloud,
  CloudDrizzle,
  Dice5,
  Users,
  Clock,
  ShieldCheck,
  CalendarDays,
  Thermometer,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Plane,
  MapPin,
  Backpack,
  Star,
  PartyPopper,
} from "lucide-react";
import { Loader2 } from "lucide-react";

function MeteoIcon({ text, size = 16 }: { text: string; size?: number }) {
  const t = text.toLowerCase();
  if (t.includes("pluie") || t.includes("rain"))
    return <CloudRain style={{ width: size, height: size }} className="text-blue-500" />;
  if (t.includes("nuageux") || t.includes("cloud") || t.includes("averse"))
    return <CloudDrizzle style={{ width: size, height: size }} className="text-slate-400" />;
  if (t.includes("ensoleill") || t.includes("sun"))
    return <Sun style={{ width: size, height: size }} className="text-amber-500" />;
  return <Cloud style={{ width: size, height: size }} className="text-slate-400" />;
}

function extractTemp(text: string): { high: string; low: string } | null {
  const match = text.match(/(\d+)\/(\d+)/);
  if (match) return { high: match[1], low: match[2] };
  return null;
}

/* ── Upcoming Events Component ── */
function UpcomingEvents({ planning }: { planning: PlanningData }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  const horizonDate = new Date(today);
  horizonDate.setDate(today.getDate() + 60); // 60 jours d'horizon
  const horizonStr = horizonDate.toISOString().split("T")[0];

  type UpcomingEvent = {
    date: string;
    endDate?: string;
    label: string;
    sublabel?: string;
    type: "deplacement" | "voyage" | "stage" | "ferie" | "vacances";
    icon: React.ReactNode;
    color: { bg: string; text: string };
  };

  const events: UpcomingEvent[] = [];

  // Déplacements
  for (const dep of planning.deplacements) {
    if (dep.fin >= todayStr && dep.debut <= horizonStr) {
      const qui = dep.qui === "sebastien" ? "Sébastien" : dep.qui === "nathalie" ? "Nathalie" : dep.qui;
      events.push({
        date: dep.debut,
        endDate: dep.fin,
        label: `${qui} → ${dep.destination}`,
        sublabel: dep.debut === dep.fin ? undefined : `jusqu'au ${new Date(dep.fin + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`,
        type: "deplacement",
        icon: <Plane className="w-3.5 h-3.5" />,
        color: EVENT_COLORS.deplacement,
      });
    }
  }

  // Voyages famille
  for (const v of planning.voyages_famille) {
    if (v.fin >= todayStr && v.debut <= horizonStr) {
      const participants = v.participants.map(p =>
        p === "sebastien" ? "Sébastien" : p === "nathalie" ? "Nathalie" : p === "helia" ? "Hélia" : p === "noe" ? "Noé" : p
      ).join(", ");
      events.push({
        date: v.debut,
        endDate: v.fin,
        label: `Voyage — ${v.destination}`,
        sublabel: participants,
        type: "voyage",
        icon: <MapPin className="w-3.5 h-3.5" />,
        color: EVENT_COLORS.voyage,
      });
    }
  }

  // Stages enfants
  for (const st of planning.stages_enfants) {
    if (st.fin >= todayStr && st.debut <= horizonStr) {
      const enfants = st.detail.map(d => d.enfant === "helia" ? "Hélia" : d.enfant === "noe" ? "Noé" : d.enfant).join(" & ");
      events.push({
        date: st.debut,
        endDate: st.fin,
        label: `Stage ${st.type} — ${st.lieu}`,
        sublabel: enfants,
        type: "stage",
        icon: <Backpack className="w-3.5 h-3.5" />,
        color: EVENT_COLORS.stage,
      });
    }
  }

  // Jours fériés
  for (const f of planning.jours_feries) {
    if (f.date >= todayStr && f.date <= horizonStr) {
      events.push({
        date: f.date,
        label: f.nom,
        type: "ferie",
        icon: <Star className="w-3.5 h-3.5" />,
        color: { bg: "#fde8e8", text: "#9b1c1c" },
      });
    }
  }

  // Vacances scolaires (début uniquement si dans l'horizon)
  for (const v of planning.vacances_scolaires) {
    if (v.fin >= todayStr && v.debut <= horizonStr) {
      events.push({
        date: v.debut,
        endDate: v.fin,
        label: `Vacances ${v.nom}`,
        sublabel: `jusqu'au ${new Date(v.fin + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`,
        type: "vacances",
        icon: <PartyPopper className="w-3.5 h-3.5" />,
        color: { bg: "#fef3c7", text: "#92400e" },
      });
    }
  }

  // Sort by date
  events.sort((a, b) => a.date.localeCompare(b.date));

  if (events.length === 0) return null;

  return (
    <div className="bento-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-primary" />
        <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-muted-foreground">
          Événements à venir
        </h2>
        <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-lg">
          60 prochains jours
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {events.map((ev, i) => {
          const dateObj = new Date(ev.date + "T12:00:00");
          const dateLabel = dateObj.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Paris" });
          const isToday = ev.date === todayStr;
          const isPast = ev.endDate ? ev.endDate < todayStr : ev.date < todayStr;
          const isOngoing = ev.endDate && ev.date <= todayStr && ev.endDate >= todayStr;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isPast ? "opacity-40" : ""
              }`}
              style={{ backgroundColor: ev.color.bg }}
            >
              <div className="flex-shrink-0" style={{ color: ev.color.text }}>
                {ev.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold leading-tight truncate" style={{ color: ev.color.text }}>
                  {ev.label}
                </p>
                {ev.sublabel && (
                  <p className="text-[11px] opacity-75 mt-0.5" style={{ color: ev.color.text }}>
                    {ev.sublabel}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 text-right">
                {isOngoing ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/50" style={{ color: ev.color.text }}>
                    En cours
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold" style={{ color: ev.color.text }}>
                    {isToday ? "Aujourd'hui" : dateLabel}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const JOUR_KEYS: Record<string, string> = {
  "1": "lundi", "2": "mardi", "3": "mercredi",
  "4": "jeudi", "5": "vendredi", "6": "samedi", "0": "dimanche",
};

export default function Home() {
  const [weekIdx, setWeekIdx] = useState(0);
  const currentWeek = AVAILABLE_WEEKS[weekIdx];
  const { data, loading, error } = useWeekData(currentWeek.id);
  const { data: planningData } = usePlanningData();

  const { dates, activitiesByDate } = useMemo(() => {
    if (!data) return { dates: [], activitiesByDate: {} as Record<string, Activity[]> };
    const d = getDatesForWeek(data.date_debut);
    const byDate: Record<string, Activity[]> = {};
    for (const dt of d) byDate[dt] = [];
    for (const a of data.activites) {
      if (byDate[a.date]) byDate[a.date].push(a);
    }
    const prioOrder: Record<string, number> = { incontournable: 0, recommande: 1, optionnel: 2 };
    for (const dt of d) {
      byDate[dt].sort((a, b) => (prioOrder[a.priorite] ?? 3) - (prioOrder[b.priorite] ?? 3));
    }
    return { dates: d, activitiesByDate: byDate };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container py-8 text-center text-muted-foreground">
        Erreur de chargement des données.
      </div>
    );
  }

  return (
    <div className="container py-5 sm:py-8 space-y-6">
      {/* ── Week selector ── */}
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

      {/* ── Top Bento row: Week info + Meteo + Jeu mercredi ── */}
      <div className="bento-grid">
        {/* Week info card (span 2) */}
        <div className="bento-card bento-span-2 p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight">
              Semaine {data.semaine.split("W")[1]}
            </h1>
            {data.semaine_garde && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold bg-primary/10 text-primary border border-primary/15">
                <ShieldCheck className="w-3.5 h-3.5" />
                Garde
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Du {formatDateFr(data.date_debut)} au {formatDateFr(data.date_fin)}
          </p>
          {data.contexte_semaine && (
            <p className="text-[12px] text-muted-foreground mt-2 italic leading-relaxed">
              {data.contexte_semaine}
            </p>
          )}

          {/* Inline meteo strip */}
          <div className="flex flex-wrap gap-3 mt-4">
            {dates.map((date) => {
              const d = new Date(date + "T00:00:00");
              const jourKey = JOUR_KEYS[d.getDay().toString()];
              const meteo = data.meteo_prevue[jourKey];
              if (!meteo) return null;
              const temp = extractTemp(meteo);
              const weekend = isWeekend(date);
              return (
                <div
                  key={date}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-center min-w-[56px] ${
                    weekend ? "bg-primary/8 border border-primary/15" : "bg-muted/50"
                  }`}
                >
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    {jourKey.slice(0, 3)}
                  </span>
                  <MeteoIcon text={meteo} size={20} />
                  {temp && (
                    <div className="flex items-center gap-0.5 text-[11px]">
                      <span className="font-semibold text-foreground">{temp.high}°</span>
                      <span className="text-muted-foreground">{temp.low}°</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Alertes card */}
        {data.alertes && data.alertes.length > 0 && (
          <div className="bento-card bento-span-2 p-5 sm:p-6 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200/50 dark:border-amber-800/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="font-heading font-bold text-sm text-amber-800 dark:text-amber-300">
                Alertes de la semaine
              </h2>
            </div>
            <ul className="space-y-1.5">
              {data.alertes.map((alerte, i) => (
                <li key={i} className="text-[12px] text-amber-700 dark:text-amber-300 leading-relaxed flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  {alerte}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Jeu du mercredi card (span 2) */}
        {data.suggestion_jeu_mercredi && (
          <div className="bento-card bento-span-2 p-5 sm:p-6 bg-gradient-to-br from-card to-primary/5 dark:to-primary/10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Dice5 className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-heading font-bold text-sm">
                Jeu du mercredi soir
              </h2>
            </div>
            <p className="font-heading font-bold text-base mb-1">
              {data.suggestion_jeu_mercredi.nom}
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground mb-2">
              <span className="bg-muted/60 px-2 py-0.5 rounded-lg">{data.suggestion_jeu_mercredi.editeur}</span>
              <span className="bg-muted/60 px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                <Users className="w-3 h-3" />
                {data.suggestion_jeu_mercredi.joueurs || "2-4"}
              </span>
              <span className="bg-muted/60 px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {data.suggestion_jeu_mercredi.duree}
              </span>
              <span className="bg-muted/60 px-2 py-0.5 rounded-lg">{data.suggestion_jeu_mercredi.age}</span>
            </div>
            <p className="text-[13px] text-muted-foreground italic leading-relaxed">
              {data.suggestion_jeu_mercredi.pourquoi}
            </p>
          </div>
        )}
      </div>

      {/* ── Événements à venir ── */}
      {planningData && <UpcomingEvents planning={planningData} />}

      {/* ── Day sections ── */}
      {dates.map((date) => {
        const d = new Date(date + "T00:00:00");
        const jourKey = JOUR_KEYS[d.getDay().toString()];
        const meteo = data.meteo_prevue[jourKey];
        const activities = activitiesByDate[date];
        const weekend = isWeekend(date);
        const isFriday = d.getDay() === 5;

        return (
          <section key={date} className="space-y-3">
            {/* Day header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="font-heading font-bold text-lg">
                  {formatDateFr(date)}
                </h2>
                {/* Garde indicator */}
                {planningData && (() => {
                  const info = getDayInfo(d, planningData);
                  if (info.garde === "partage" && info.gardeMatin && info.gardeSoir) {
                    const mc = GARDE_COLORS[info.gardeMatin];
                    const sc = GARDE_COLORS[info.gardeSoir];
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold" style={{ background: `linear-gradient(135deg, ${mc.bg} 50%, ${sc.bg} 50%)`, color: mc.text }}>
                        {mc.label} → {sc.label}
                      </span>
                    );
                  }
                  const gc = GARDE_COLORS[info.garde];
                  return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold" style={{ backgroundColor: gc.bg, color: gc.text }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: gc.text, opacity: 0.5 }} />
                      {gc.label}
                    </span>
                  );
                })()}
                {planningData && (() => {
                  const info = getDayInfo(d, planningData);
                  return (
                    <>
                      {info.isVacances && (
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 font-semibold">
                          Vacances
                        </span>
                      )}
                      {info.isFerie && (
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-semibold">
                          {info.ferieNom}
                        </span>
                      )}
                    </>
                  );
                })()}
                {weekend && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
                {isFriday && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 font-semibold">
                    Récupération école
                  </span>
                )}
              </div>
              {meteo && (
                <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-xl">
                  <MeteoIcon text={meteo} size={14} />
                  <span>{meteo}</span>
                </div>
              )}
            </div>

            {/* Activity bento grid */}
            {activities.length > 0 ? (
              <div className="bento-grid">
                {activities.map((a, i) => (
                  <div
                    key={`${date}-${i}`}
                    className={a.priorite === "incontournable" ? "bento-span-2" : ""}
                  >
                    <ActivityCard activity={a} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bento-card p-4">
                <p className="text-sm text-muted-foreground italic">
                  {weekend
                    ? "Pas d'activité programmée"
                    : "Soirée libre \u2014 repos ou jeux à la maison"}
                </p>
              </div>
            )}
          </section>
        );
      })}

      {/* Footer */}
      <footer className="bento-card p-4 text-[11px] text-muted-foreground space-y-1">
        <p>
          Généré le{" "}
          {new Date(data.genere_le).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          . Sources : Kidiklik, Citizenkid, JDS, Toulouse Tourisme, Cité de
          l'Espace, Halle de la Machine, théâtres, musées, AllTrails.
        </p>
        <p>
          Distances calculées depuis Guilheméry (43.598, 1.473). Météo :
          MeteoArt.com (prévisions indicatives).
        </p>
      </footer>
    </div>
  );
}
