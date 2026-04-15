/*
 * Bento Box design: Calendar page
 * Clean rounded calendar grid with garde colors from planning data
 */
import { useState, useMemo, useEffect } from "react";
import { useSearch } from "wouter";
import { useWeekData } from "@/hooks/useWeekData";
import { usePlanningData, getDayInfo, GARDE_COLORS, type PlanningData } from "@/hooks/usePlanningData";
import ActivityCard from "@/components/ActivityCard";
import { TYPE_COLORS, AVAILABLE_WEEKS } from "@/lib/types";
import type { Activity } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Loader2 } from "lucide-react";

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const JOURS_COURTS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

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

export default function Calendrier() {
  // Load each available week explicitly (hooks must be called unconditionally)
  const w17 = useWeekData("2026-W17");
  const w19 = useWeekData("2026-W19");
  const allActivities = useMemo(() => {
    const acts: Activity[] = [];
    if (w17.data) acts.push(...w17.data.activites);
    if (w19.data) acts.push(...w19.data.activites);
    return acts;
  }, [w17.data, w19.data]);
  const loading = w17.loading || w19.loading;
  const { data: planningData } = usePlanningData();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const initialMonth = params.get("month") !== null ? parseInt(params.get("month")!, 10) : 3;
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(initialMonth);

  // Sync month from URL when navigating from Planning
  useEffect(() => {
    const p = new URLSearchParams(searchString);
    if (p.get("month") !== null) {
      setMonth(parseInt(p.get("month")!, 10));
    }
  }, [searchString]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const days = useMemo(() => getCalendarDays(year, month), [year, month]);

  const activitiesByDate = useMemo(() => {
    const map: Record<string, Activity[]> = {};
    for (const a of allActivities) {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    }
    return map;
  }, [allActivities]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const selectedActivities = selectedDate ? (activitiesByDate[selectedDate] || []) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-5 sm:py-8 space-y-5">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2.5 rounded-xl hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-heading font-extrabold text-xl tracking-tight">
          {MOIS[month]} {year}
        </h1>
        <button onClick={nextMonth} className="p-2.5 rounded-xl hover:bg-muted transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar bento card */}
      <div className="bento-card overflow-hidden">
        {/* Week number + header row */}
        <div className="grid grid-cols-[32px_repeat(7,1fr)] text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50">
          <div className="py-3 text-[9px]">S</div>
          {JOURS_COURTS.map((j) => (
            <div key={j} className="py-3">{j}</div>
          ))}
        </div>

        {/* Day cells in rows with week numbers */}
        {(() => {
          const rows: (Date | null)[][] = [];
          for (let i = 0; i < days.length; i += 7) {
            rows.push(days.slice(i, i + 7));
          }
          return rows.map((row, ri) => {
            const firstDay = row.find(d => d !== null);
            const weekNum = firstDay ? getISOWeek(firstDay) : 0;
            return (
              <div key={ri} className="grid grid-cols-[32px_repeat(7,1fr)]">
                <div className="flex items-center justify-center text-[9px] font-medium text-muted-foreground border-b border-r border-border/30 bg-muted/20">
                  {weekNum > 0 ? weekNum : ""}
                </div>
                {row.map((day, ci) => {
                  if (!day) {
                    return <div key={`empty-${ri}-${ci}`} className="min-h-[64px] sm:min-h-[84px] border-b border-r border-border/30 bg-muted/20" />;
                  }

                  const dateStr = day.toISOString().split("T")[0];
                  const isToday = dateStr === new Date().toISOString().split("T")[0];
                  const isSelected = dateStr === selectedDate;
                  const dayActivities = activitiesByDate[dateStr] || [];

                  // Get garde info from planning data
                  const dayInfo = planningData ? getDayInfo(day, planningData) : null;
                  const isPartageDay = dayInfo?.garde === "partage" && dayInfo?.gardeMatin && dayInfo?.gardeSoir;
                  const gardeColor = dayInfo ? (isPartageDay ? GARDE_COLORS.partage : GARDE_COLORS[dayInfo.garde]) : null;
                  const matinC = isPartageDay ? GARDE_COLORS[dayInfo!.gardeMatin!] : null;
                  const soirC = isPartageDay ? GARDE_COLORS[dayInfo!.gardeSoir!] : null;

                  const cellStyle: React.CSSProperties = isPartageDay && matinC && soirC
                    ? {
                        background: `linear-gradient(135deg, ${matinC.bg} 50%, ${soirC.bg} 50%)`,
                        borderColor: dayInfo?.isFerie ? "#e24b4a" : "rgba(0,0,0,0.06)",
                        borderWidth: dayInfo?.isFerie ? "2px" : undefined,
                      }
                    : {
                        backgroundColor: gardeColor?.bg || undefined,
                        borderColor: dayInfo?.isFerie ? "#e24b4a" : "rgba(0,0,0,0.06)",
                        borderWidth: dayInfo?.isFerie ? "2px" : undefined,
                        backgroundImage: dayInfo?.isVacances
                          ? "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 5px)"
                          : undefined,
                      };

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                      className={`min-h-[64px] sm:min-h-[84px] p-1.5 sm:p-2 border-b border-r text-left transition-all duration-150 relative ${
                        isSelected ? "ring-2 ring-primary ring-inset" : ""
                      } hover:brightness-95`}
                      style={cellStyle}
                    >
                      <div className="flex items-center gap-1">
                        <span
                          className={`text-[12px] font-semibold ${
                            isToday
                              ? "bg-primary text-primary-foreground w-6 h-6 rounded-lg flex items-center justify-center"
                              : ""
                          }`}
                          style={{ color: isToday ? undefined : gardeColor?.text }}
                        >
                          {day.getDate()}
                        </span>
                      </div>
                      {/* Activity dots */}
                      <div className="flex flex-wrap gap-[3px] mt-1.5">
                        {dayActivities.slice(0, 4).map((a, j) => (
                          <span
                            key={j}
                            className="w-[7px] h-[7px] rounded-full"
                            style={{ backgroundColor: TYPE_COLORS[a.type] || "#999" }}
                            title={a.titre}
                          />
                        ))}
                        {dayActivities.length > 4 && (
                          <span className="text-[9px] text-muted-foreground ml-0.5">
                            +{dayActivities.length - 4}
                          </span>
                        )}
                      </div>
                      {/* Ferie label */}
                      {dayInfo?.isFerie && (
                        <span className="absolute bottom-0.5 right-0.5 text-[7px] text-red-500 font-bold">
                          F
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          });
        })()}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        {Object.entries(GARDE_COLORS).map(([key, val]) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md" style={{ backgroundColor: val.bg, border: `1px solid ${val.text}30` }} />
            {val.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)", backgroundColor: "#f0f0f0" }} />
          Vacances
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md border-2" style={{ borderColor: "#e24b4a" }} />
          Ferie
        </span>
      </div>

      {/* Selected day activities */}
      {selectedDate && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="font-heading font-bold text-lg">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h2>
            {planningData && (() => {
              const info = getDayInfo(new Date(selectedDate + "T12:00:00"), planningData);
              if (info.garde === "partage" && info.gardeMatin && info.gardeSoir) {
                const mc = GARDE_COLORS[info.gardeMatin];
                const sc = GARDE_COLORS[info.gardeSoir];
                return (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold" style={{ background: `linear-gradient(135deg, ${mc.bg} 50%, ${sc.bg} 50%)`, color: mc.text }}>
                    {mc.label} \u2192 {sc.label}
                  </span>
                );
              }
              const gc = GARDE_COLORS[info.garde];
              return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold" style={{ backgroundColor: gc.bg, color: gc.text }}>
                  {gc.label}
                </span>
              );
            })()}
          </div>
          {selectedActivities.length > 0 ? (
            <div className="bento-grid">
              {selectedActivities.map((a, i) => (
                <div key={i} className={a.priorite === "incontournable" ? "bento-span-2" : ""}>
                  <ActivityCard activity={a} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bento-card p-4">
              <p className="text-sm text-muted-foreground italic">
                Aucune activite ce jour.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
