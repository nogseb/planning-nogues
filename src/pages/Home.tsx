/*
 * Bento Box design: Home / Activités page
 * Modular grid with weather widgets, game card, and activity cards
 * Week selector to switch between available weeks
 */
import { useState, useMemo } from "react";
import { useWeekData } from "@/hooks/useWeekData";
import { usePlanningData, getDayInfo, GARDE_COLORS } from "@/hooks/usePlanningData";
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
