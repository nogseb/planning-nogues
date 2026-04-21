/*
 * Bento Box design: Planning page — Annual custody calendar
 * 12-month grid with color-coded custody, vacation hatching, event badges
 * Interactive legend, day detail panel, and timeline
 * Features: click month → /calendrier, hide past months, PDF export
 */
import { useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import {
  usePlanningData,
  getDayInfo,
  GARDE_COLORS,
  EVENT_COLORS,
  type DayInfo,
  type PlanningData,
} from "@/hooks/usePlanningData";
import { Loader2, X, ChevronLeft, ChevronRight, Printer, Download, CalendarDays, Eye, SlidersHorizontal } from "lucide-react";

/* ── helpers ── */
function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const DAY_NAMES = ["L", "M", "M", "J", "V", "S", "D"];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number): number {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday = 0
}

/* ── Legend item ── */
function LegendItem({
  color,
  label,
  active,
  onClick,
  hatched,
  border,
}: {
  color: string;
  label: string;
  active: boolean;
  onClick: () => void;
  hatched?: boolean;
  border?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all duration-150 ${
        active ? "ring-2 ring-offset-1 ring-foreground/30" : "opacity-60 hover:opacity-100"
      }`}
      style={{ borderColor: border || "transparent" }}
    >
      <span
        className="w-4 h-3 rounded-sm flex-shrink-0"
        style={{
          backgroundColor: color,
          border: border ? `2px solid ${border}` : undefined,
          backgroundImage: hatched
            ? "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)"
            : undefined,
        }}
      />
      {label}
    </button>
  );
}

/* ── Event badge ── */
function EventBadge({ text, colors }: { text: string; colors: { bg: string; text: string } }) {
  return (
    <span
      className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold leading-tight truncate max-w-full"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {text}
    </span>
  );
}

/* ── Day cell ── */
function DayCell({
  day,
  info,
  isToday,
  onClick,
  isSelected,
  highlightFilter,
}: {
  day: number;
  info: DayInfo;
  isToday: boolean;
  onClick: () => void;
  isSelected: boolean;
  highlightFilter: string | null;
}) {
  const isPartage = info.garde === "partage" && info.gardeMatin && info.gardeSoir;
  const gardeColor = isPartage ? GARDE_COLORS.partage : (GARDE_COLORS[info.garde] || GARDE_COLORS.a_determiner);
  const matinColor = isPartage ? (GARDE_COLORS[info.gardeMatin!] || GARDE_COLORS.a_determiner) : null;
  const soirColor = isPartage ? (GARDE_COLORS[info.gardeSoir!] || GARDE_COLORS.a_determiner) : null;
  const dimmed = highlightFilter !== null && !(
    highlightFilter === info.garde ||
    (isPartage && (highlightFilter === info.gardeMatin || highlightFilter === info.gardeSoir))
  );

  const bgStyle: React.CSSProperties = isPartage && matinColor && soirColor
    ? {
        background: `linear-gradient(135deg, ${matinColor.bg} 50%, ${soirColor.bg} 50%)`,
        border: info.isFerie ? "2px solid #e24b4a" : "1px solid rgba(0,0,0,0.06)",
        borderRadius: "5px",
      }
    : {
        backgroundColor: gardeColor.bg,
        backgroundImage: info.isVacances
          ? "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 5px)"
          : undefined,
        border: info.isFerie ? "2px solid #e24b4a" : "1px solid rgba(0,0,0,0.06)",
        borderRadius: "5px",
      };

  return (
    <button
      onClick={onClick}
      className={`relative w-full aspect-square p-0.5 text-left transition-all duration-100 flex flex-col overflow-hidden ${
        isSelected ? "ring-2 ring-foreground/40 ring-offset-1" : ""
      } ${dimmed ? "opacity-25" : ""}`}
      style={bgStyle}
    >
      <span
        className={`text-[11px] font-bold leading-none px-0.5 ${
          isToday
            ? "bg-foreground text-background rounded-full w-5 h-5 flex items-center justify-center"
            : ""
        }`}
        style={{ color: isToday ? undefined : gardeColor.text }}
      >
        {day}
      </span>

      {/* Event badges — show max 2 */}
      <div className="flex flex-col gap-0.5 mt-auto overflow-hidden">
        {info.deplacements.slice(0, 1).map((d, i) => (
          <EventBadge
            key={`dep-${i}`}
            text={`${d.qui === "sebastien" ? "Seb" : "Nat"} > ${d.destination.split("(")[0].trim().split(",")[0]}`}
            colors={
              d.qui === "nathalie" && ["Giroussens", "ArtiCeram, Deux-Sèvres", "Festival des Tupiniers de Villedieu"].some(f => d.destination.includes(f.split(",")[0]))
                ? EVENT_COLORS.festival
                : EVENT_COLORS.deplacement
            }
          />
        ))}
        {info.voyages.slice(0, 1).map((v, i) => (
          <EventBadge key={`voy-${i}`} text={v.destination} colors={EVENT_COLORS.voyage} />
        ))}
        {info.stages.length > 0 && (
          <EventBadge
            text={info.stages.map(s => `${s.enfant}`).join(", ")}
            colors={EVENT_COLORS.stage}
          />
        )}
        {info.gardeNote && !info.deplacements.length && !info.voyages.length && !info.stages.length && (
          <EventBadge text={info.gardeNote.length > 20 ? info.gardeNote.slice(0, 18) + ".." : info.gardeNote} colors={EVENT_COLORS.note} />
        )}
      </div>
    </button>
  );
}

/* ── Month grid ── */
function MonthGrid({
  year,
  month,
  data,
  selectedDate,
  onSelectDate,
  highlightFilter,
  onMonthTitleClick,
}: {
  year: number;
  month: number;
  data: PlanningData;
  selectedDate: string | null;
  onSelectDate: (d: string, info: DayInfo) => void;
  highlightFilter: string | null;
  onMonthTitleClick?: (month: number) => void;
}) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const numDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  const cells: (null | { day: number; info: DayInfo })[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= numDays; d++) {
    const date = new Date(year, month, d);
    const info = getDayInfo(date, data);
    cells.push({ day: d, info });
  }

  // Build rows with week numbers
  const rows: { week: number; cells: (null | { day: number; info: DayInfo })[] }[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    const rowCells = cells.slice(i, i + 7);
    while (rowCells.length < 7) rowCells.push(null);
    const firstDay = rowCells.find((c) => c !== null);
    const week = firstDay ? firstDay.info.isoWeek : 0;
    rows.push({ week, cells: rowCells });
  }

  return (
    <div className="bento-card p-3 print:break-inside-avoid">
      <h3
        className={`font-heading font-bold text-sm mb-2 text-center ${onMonthTitleClick ? "cursor-pointer hover:text-primary hover:underline underline-offset-2 transition-colors" : ""}`}
        onClick={() => onMonthTitleClick?.(month)}
        title={onMonthTitleClick ? `Voir ${MONTH_NAMES[month]} dans le calendrier` : undefined}
      >
        {MONTH_NAMES[month]}
      </h3>
      <div className="grid grid-cols-[24px_repeat(7,1fr)] gap-0.5">
        {/* Header */}
        <div className="text-[9px] text-muted-foreground font-semibold text-center">S</div>
        {DAY_NAMES.map((d, i) => (
          <div key={i} className="text-[9px] text-muted-foreground font-semibold text-center">
            {d}
          </div>
        ))}

        {/* Rows */}
        {rows.map((row, ri) => (
          <div key={ri} className="contents">
            <div className="text-[9px] text-muted-foreground font-medium flex items-center justify-center">
              {row.week > 0 ? row.week : ""}
            </div>
            {row.cells.map((cell, ci) =>
              cell ? (
                <DayCell
                  key={ci}
                  day={cell.day}
                  info={cell.info}
                  isToday={cell.info.date === todayStr}
                  isSelected={cell.info.date === selectedDate}
                  onClick={() => onSelectDate(cell.info.date, cell.info)}
                  highlightFilter={highlightFilter}
                />
              ) : (
                <div key={ci} />
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Day detail panel ── */
function DayDetail({ info, onClose }: { info: DayInfo; onClose: () => void }) {
  const isPartage = info.garde === "partage" && info.gardeMatin && info.gardeSoir;
  const gardeColor = isPartage ? GARDE_COLORS.partage : (GARDE_COLORS[info.garde] || GARDE_COLORS.a_determiner);
  const matinColor = isPartage ? (GARDE_COLORS[info.gardeMatin!] || GARDE_COLORS.a_determiner) : null;
  const soirColor = isPartage ? (GARDE_COLORS[info.gardeSoir!] || GARDE_COLORS.a_determiner) : null;
  const d = new Date(info.date + "T12:00:00");
  const dayName = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"][d.getDay()];
  const monthName = MONTH_NAMES[d.getMonth()];

  return (
    <div className="bento-card p-5 space-y-4 animate-in slide-in-from-right-4 duration-200">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-heading font-bold text-lg">
            {dayName} {d.getDate()} {monthName}
          </h3>
          <p className="text-xs text-muted-foreground">Semaine {info.isoWeek}</p>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted/50 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Garde */}
      {isPartage && matinColor && soirColor ? (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Jour d'échange de garde</p>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: matinColor.bg, border: `2px solid ${matinColor.text}` }} />
            <span className="text-sm font-semibold" style={{ color: matinColor.text }}>
              Matin (dépôt école) : {matinColor.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: soirColor.bg, border: `2px solid ${soirColor.text}` }} />
            <span className="text-sm font-semibold" style={{ color: soirColor.text }}>
              Soir (récupération) : {soirColor.label}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: gardeColor.bg, border: `2px solid ${gardeColor.text}` }} />
          <span className="text-sm font-semibold" style={{ color: gardeColor.text }}>
            {`Garde : ${gardeColor.label}`}
          </span>
        </div>
      )}
      {info.gardeNote && info.garde !== "partage" && (
        <p className="text-xs text-muted-foreground italic pl-5">{info.gardeNote}</p>
      )}

      {/* Badges */}
      {info.isVacances && (
        <div className="flex items-center gap-2 text-xs">
          <span className="w-3 h-2 rounded-sm" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)", backgroundColor: "#f0f0f0" }} />
          Vacances scolaires — {info.vacancesNom}
        </div>
      )}
      {info.isFerie && (
        <div className="flex items-center gap-2 text-xs">
          <span className="w-3 h-3 rounded-sm border-2" style={{ borderColor: "#e24b4a" }} />
          Jour ferie — {info.ferieNom}
        </div>
      )}

      {/* Events */}
      {info.deplacements.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Déplacements</p>
          {info.deplacements.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: EVENT_COLORS.deplacement.text }} />
              {d.qui === "sebastien" ? "Sébastien" : "Nathalie"} &rarr; {d.destination}
            </div>
          ))}
        </div>
      )}

      {info.stages.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Stages enfants</p>
          {info.stages.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: EVENT_COLORS.stage.text }} />
              {s.enfant} : {s.activite}
            </div>
          ))}
        </div>
      )}

      {info.voyages.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Voyage famille</p>
          {info.voyages.map((v, i) => (
            <div key={i} className="text-sm">
              <span className="font-semibold" style={{ color: EVENT_COLORS.voyage.text }}>{v.destination}</span>
              <p className="text-xs text-muted-foreground">{v.participants.join(", ")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Timeline ── */
function Timeline({ data }: { data: PlanningData }) {
  const startDate = new Date(2026, 2, 1); // March 1
  const endDate = new Date(2026, 11, 31); // Dec 31
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1;

  const dayToPercent = (d: Date) => {
    const diff = Math.ceil((d.getTime() - startDate.getTime()) / 86400000);
    return (diff / totalDays) * 100;
  };

  const rangeStyle = (debut: string, fin: string) => {
    const s = dayToPercent(new Date(debut + "T12:00:00"));
    const e = dayToPercent(new Date(fin + "T12:00:00"));
    return { left: `${Math.max(0, s)}%`, width: `${Math.min(100, e) - Math.max(0, s)}%` };
  };

  // Month markers
  const months = [];
  for (let m = 2; m <= 11; m++) {
    const d = new Date(2026, m, 1);
    months.push({ label: MONTH_NAMES[m].slice(0, 3), pct: dayToPercent(d) });
  }

  return (
    <div className="bento-card p-4 mt-6 print:break-before-page">
      <h3 className="font-heading font-bold text-sm mb-4">Frise chronologique Mars — Décembre 2026</h3>

      <div className="relative" style={{ height: "180px" }}>
        {/* Month labels */}
        <div className="absolute top-0 left-0 right-0 h-5 flex">
          {months.map((m, i) => (
            <div key={i} className="absolute text-[9px] text-muted-foreground font-semibold" style={{ left: `${m.pct}%` }}>
              {m.label}
              <div className="absolute top-4 left-0 w-px h-[160px] bg-border/40" />
            </div>
          ))}
        </div>

        {/* Deplacements — above */}
        <div className="absolute top-6 left-0 right-0 h-10">
          {data.deplacements.map((d, i) => {
            const style = rangeStyle(d.debut, d.fin);
            const colors = d.qui === "nathalie" && ["Giroussens", "ArtiCeram", "Tupiniers"].some(f => d.destination.includes(f))
              ? EVENT_COLORS.festival : EVENT_COLORS.deplacement;
            return (
              <div key={i} className="absolute h-5 rounded-md flex items-center px-1 overflow-hidden" style={{ ...style, top: i % 2 === 0 ? "0px" : "22px", backgroundColor: colors.bg }}>
                <span className="text-[8px] font-bold truncate" style={{ color: colors.text }}>
                  {d.qui === "sebastien" ? "Seb" : "Nat"} &rarr; {d.destination.split("(")[0].trim().split(",")[0]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Garde band */}
        <div className="absolute top-[60px] left-0 right-0 h-8 rounded-lg overflow-hidden flex">
          {Array.from({ length: totalDays }, (_, i) => {
            const d = new Date(startDate.getTime() + i * 86400000);
            const info = getDayInfo(d, data);
            const color = GARDE_COLORS[info.garde]?.bg || "#e2e3e5";
            return (
              <div key={i} className="h-full" style={{ width: `${100 / totalDays}%`, backgroundColor: color }} />
            );
          })}
        </div>

        {/* Vacances overlay on garde band */}
        <div className="absolute top-[60px] left-0 right-0 h-8 pointer-events-none">
          {data.vacances_scolaires.map((v, i) => {
            const style = rangeStyle(v.debut, v.fin);
            return (
              <div key={i} className="absolute h-full" style={{
                ...style,
                backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 5px)",
              }} />
            );
          })}
        </div>

        {/* Labels on garde band */}
        <div className="absolute top-[60px] left-0 right-0 h-8 pointer-events-none flex items-center">
          <div className="absolute left-1 text-[8px] font-bold" style={{ color: GARDE_COLORS.sebastien.text }}>Garde alternee</div>
        </div>

        {/* Stages + voyages — below */}
        <div className="absolute top-[100px] left-0 right-0 h-10">
          {data.stages_enfants.map((s, i) => {
            const style = rangeStyle(s.debut, s.fin);
            return (
              <div key={`st-${i}`} className="absolute h-5 rounded-md flex items-center px-1 overflow-hidden" style={{ ...style, top: "0px", backgroundColor: EVENT_COLORS.stage.bg }}>
                <span className="text-[8px] font-bold truncate" style={{ color: EVENT_COLORS.stage.text }}>
                  Bloomday
                </span>
              </div>
            );
          })}
          {data.voyages_famille.map((v, i) => {
            const style = rangeStyle(v.debut, v.fin);
            return (
              <div key={`voy-${i}`} className="absolute h-5 rounded-md flex items-center px-1 overflow-hidden" style={{ ...style, top: "22px", backgroundColor: EVENT_COLORS.voyage.bg }}>
                <span className="text-[8px] font-bold truncate" style={{ color: EVENT_COLORS.voyage.text }}>
                  {v.destination}
                </span>
              </div>
            );
          })}
        </div>

        {/* Jours feries markers */}
        <div className="absolute top-[130px] left-0 right-0 h-6">
          {data.jours_feries.map((f, i) => {
            const pct = dayToPercent(new Date(f.date + "T12:00:00"));
            return (
              <div key={i} className="absolute" style={{ left: `${pct}%` }}>
                <div className="w-0.5 h-3 bg-red-400 mx-auto" />
                <span className="text-[7px] text-muted-foreground whitespace-nowrap -translate-x-1/2 block">
                  {f.nom.split(" ").slice(0, 2).join(" ")}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mini legend for timeline */}
      <div className="flex flex-wrap gap-3 mt-2 pt-2 border-t border-border/40">
        {Object.entries(GARDE_COLORS).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
            <span className="w-3 h-2 rounded-sm" style={{ backgroundColor: val.bg }} />
            {val.label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
          <span className="w-3 h-2 rounded-sm" style={{ backgroundColor: EVENT_COLORS.deplacement.bg }} />
          Déplacement
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
          <span className="w-3 h-2 rounded-sm" style={{ backgroundColor: EVENT_COLORS.voyage.bg }} />
          Voyage
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
          <span className="w-3 h-2 rounded-sm" style={{ backgroundColor: EVENT_COLORS.stage.bg }} />
          Stage
        </div>
      </div>
    </div>
  );
}

/* ── PDF Export ── */
async function generatePDF(data: PlanningData) {
  const { jsPDF } = await import("jspdf");
  const currentMonth = new Date().getMonth(); // 0-indexed

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 12;
  const contentW = pageW - margin * 2;

  const dayNames = ["L", "M", "M", "J", "V", "S", "D"];

  for (let m = currentMonth; m <= 11; m++) {
    if (m > currentMonth) doc.addPage();

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(`${MONTH_NAMES[m]} 2026`, pageW / 2, margin + 6, { align: "center" });

    // Legend bar
    const legendY = margin + 12;
    const legendItems = [
      { label: "Sébastien", color: GARDE_COLORS.sebastien },
      { label: "Nathalie", color: GARDE_COLORS.nathalie },
      { label: "Rosy & Bernard", color: GARDE_COLORS.rosy_bernard },
      { label: "Famille élargie", color: GARDE_COLORS.famille_elargie },
    ];
    let legendX = margin;
    doc.setFontSize(7);
    for (const item of legendItems) {
      doc.setFillColor(item.color.bg);
      doc.rect(legendX, legendY, 4, 3, "F");
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(item.label, legendX + 5.5, legendY + 2.5);
      legendX += doc.getTextWidth(item.label) + 10;
    }
    // Vacances
    doc.setFillColor(240, 240, 240);
    doc.rect(legendX, legendY, 4, 3, "F");
    doc.setDrawColor(180, 180, 180);
    // Hatching lines
    for (let hx = 0; hx < 4; hx += 1.5) {
      doc.line(legendX + hx, legendY + 3, legendX + hx + 1.5, legendY);
    }
    doc.text("Vacances", legendX + 5.5, legendY + 2.5);
    legendX += doc.getTextWidth("Vacances") + 10;
    // Ferie
    doc.setDrawColor(226, 75, 74);
    doc.setLineWidth(0.4);
    doc.rect(legendX, legendY, 4, 3);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.1);
    doc.text("Férié", legendX + 5.5, legendY + 2.5);

    // Calendar grid
    const gridTop = legendY + 8;
    const numDays = daysInMonth(2026, m);
    const startDayIdx = firstDayOfMonth(2026, m);
    const weekColW = 8;
    const colW = (contentW - weekColW) / 7;
    const rowH = 28;

    // Day name headers
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(120, 120, 120);
    doc.text("S", margin + weekColW / 2, gridTop + 3, { align: "center" });
    for (let i = 0; i < 7; i++) {
      doc.text(dayNames[i], margin + weekColW + colW * i + colW / 2, gridTop + 3, { align: "center" });
    }

    const cellsStart = gridTop + 6;
    let row = 0;
    let col = startDayIdx;

    for (let d = 1; d <= numDays; d++) {
      const date = new Date(2026, m, d);
      const info = getDayInfo(date, data);
      const gc = GARDE_COLORS[info.garde] || GARDE_COLORS.a_determiner;

      // Week number at start of row
      if (col === 0 || d === 1) {
        const week = getISOWeek(date);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(150, 150, 150);
        doc.text(String(week), margin + weekColW / 2, cellsStart + row * rowH + 5, { align: "center" });
      }

      const cellX = margin + weekColW + col * colW;
      const cellY = cellsStart + row * rowH;

      // Background color
      const bgHex = gc.bg;
      doc.setFillColor(bgHex);
      doc.roundedRect(cellX + 0.5, cellY + 0.5, colW - 1, rowH - 1, 1.5, 1.5, "F");

      // Vacation hatching
      if (info.isVacances) {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.15);
        const savedClip = { x: cellX + 0.5, y: cellY + 0.5, w: colW - 1, h: rowH - 1 };
        // Simple diagonal lines for hatching
        for (let hx = -rowH; hx < colW; hx += 3) {
          const x1 = Math.max(savedClip.x, cellX + 0.5 + hx);
          const y1 = Math.max(savedClip.y, cellY + 0.5);
          const x2 = Math.min(savedClip.x + savedClip.w, cellX + 0.5 + hx + rowH);
          const y2 = Math.min(savedClip.y + savedClip.h, cellY + 0.5 + (x2 - (cellX + 0.5 + hx)));
          if (x1 < savedClip.x + savedClip.w && y1 < savedClip.y + savedClip.h) {
            doc.setDrawColor(0, 0, 0, 0.08);
            doc.line(x1, y2, x2, y1);
          }
        }
      }

      // Ferie border
      if (info.isFerie) {
        doc.setDrawColor(226, 75, 74);
        doc.setLineWidth(0.5);
        doc.roundedRect(cellX + 0.5, cellY + 0.5, colW - 1, rowH - 1, 1.5, 1.5);
        doc.setLineWidth(0.1);
        doc.setDrawColor(0, 0, 0);
      }

      // Day number
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(gc.text);
      doc.text(String(d), cellX + 2, cellY + 5);

      // Events text (small)
      doc.setFontSize(5.5);
      doc.setFont("helvetica", "normal");
      let textY = cellY + 9;

      if (info.deplacements.length > 0) {
        const dep = info.deplacements[0];
        const label = `${dep.qui === "sebastien" ? "Seb" : "Nat"} > ${dep.destination.split("(")[0].trim().split(",")[0]}`;
        doc.setTextColor(EVENT_COLORS.deplacement.text);
        doc.text(label.substring(0, 16), cellX + 1.5, textY);
        textY += 3.5;
      }
      if (info.voyages.length > 0) {
        doc.setTextColor(EVENT_COLORS.voyage.text);
        doc.text(info.voyages[0].destination.substring(0, 16), cellX + 1.5, textY);
        textY += 3.5;
      }
      if (info.stages.length > 0) {
        doc.setTextColor(EVENT_COLORS.stage.text);
        doc.text(info.stages.map(s => s.enfant).join(", ").substring(0, 16), cellX + 1.5, textY);
        textY += 3.5;
      }
      if (info.gardeNote && !info.deplacements.length && !info.voyages.length && !info.stages.length) {
        doc.setTextColor(100, 100, 100);
        doc.text(info.gardeNote.substring(0, 18), cellX + 1.5, textY);
        textY += 3.5;
      }
      if (info.isFerie && info.ferieNom) {
        doc.setTextColor(226, 75, 74);
        doc.text(info.ferieNom.substring(0, 16), cellX + 1.5, textY);
      }

      col++;
      if (col >= 7) {
        col = 0;
        row++;
      }
    }

    // Footer
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(160, 160, 160);
    doc.text(`Planning Helia & Noe — ${MONTH_NAMES[m]} 2026`, pageW / 2, pageH - 8, { align: "center" });
  }

  doc.save("planning-2026.pdf");
}

/* ── Main page ── */
export default function Planning() {
  const { data, loading } = usePlanningData();
  const [, navigate] = useLocation();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<DayInfo | null>(null);
  const [highlightFilter, setHighlightFilter] = useState<string | null>(null);
  const [showAllMonths, setShowAllMonths] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [mobileMonth, setMobileMonth] = useState(new Date().getMonth());
  const [mobileLegendOpen, setMobileLegendOpen] = useState(false);

  const currentMonth = new Date().getMonth(); // 0-indexed, April = 3

  const handleSelectDate = useCallback((date: string, info: DayInfo) => {
    setSelectedDate(date);
    setSelectedInfo(info);
  }, []);

  const toggleFilter = useCallback((key: string) => {
    setHighlightFilter((prev) => (prev === key ? null : key));
  }, []);

  const handleMonthClick = useCallback((month: number) => {
    navigate(`/calendrier?month=${month}`);
  }, [navigate]);

  const handlePdfExport = useCallback(async () => {
    if (!data) return;
    setPdfLoading(true);
    try {
      await generatePDF(data);
    } catch (e) {
      console.error("PDF generation error:", e);
    } finally {
      setPdfLoading(false);
    }
  }, [data]);

  // Months to display: current month → December, or all if showAllMonths
  const monthsToShow = useMemo(() => {
    if (showAllMonths) return Array.from({ length: 12 }, (_, i) => i);
    return Array.from({ length: 12 - currentMonth }, (_, i) => currentMonth + i);
  }, [showAllMonths, currentMonth]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-heading font-bold text-2xl tracking-tight">
            Planning 2026
          </h1>
          <p className="text-sm text-muted-foreground">
            Calendrier de garde, vacances et événements {data?.derniere_maj && <span className="text-muted-foreground/60">&mdash; {(() => { const d = new Date(data.derniere_maj); const date = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }); const h = d.getHours(); const m = String(d.getMinutes()).padStart(2, "0"); return `${date}, ${h}h${m}`; })()}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle show all months */}
          <button
            onClick={() => setShowAllMonths(!showAllMonths)}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-border/60 hover:bg-muted/50 transition-colors"
            title={showAllMonths ? "Masquer les mois passés" : "Afficher l'année complète"}
          >
            {showAllMonths ? <CalendarDays className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showAllMonths ? "Mois à venir" : "Année complète"}
          </button>
          {/* PDF export */}
          <button
            onClick={handlePdfExport}
            disabled={pdfLoading}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-border/60 hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            {pdfLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Télécharger PDF
          </button>
        </div>
      </div>

      {/* Legend — sticky on mobile */}
      <div className="sticky top-[56px] z-30 bg-background/95 backdrop-blur-sm py-2 mb-4 border-b border-border/30">
        {/* Desktop: all filters visible */}
        <div className="hidden sm:flex flex-wrap gap-1.5">
          <LegendItem
            color={GARDE_COLORS.sebastien.bg}
            label="Sébastien"
            active={highlightFilter === "sebastien"}
            onClick={() => toggleFilter("sebastien")}
          />
          <LegendItem
            color={GARDE_COLORS.nathalie.bg}
            label="Nathalie"
            active={highlightFilter === "nathalie"}
            onClick={() => toggleFilter("nathalie")}
          />
          <LegendItem
            color={GARDE_COLORS.rosy_bernard.bg}
            label="Rosy & Bernard"
            active={highlightFilter === "rosy_bernard"}
            onClick={() => toggleFilter("rosy_bernard")}
          />
          <LegendItem
            color={GARDE_COLORS.famille_elargie.bg}
            label="Famille élargie"
            active={highlightFilter === "famille_elargie"}
            onClick={() => toggleFilter("famille_elargie")}
          />
          <LegendItem
            color={GARDE_COLORS.partage.bg}
            label="Jour d'échange"
            active={highlightFilter === "partage"}
            onClick={() => toggleFilter("partage")}
          />
          <LegendItem
            color="#f0f0f0"
            label="Vacances"
            active={false}
            onClick={() => {}}
            hatched
          />
          <LegendItem
            color="transparent"
            label="Férié"
            active={false}
            onClick={() => {}}
            border="#e24b4a"
          />
        </div>

        {/* Mobile: burger menu for filters + action buttons */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={() => setMobileLegendOpen(!mobileLegendOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-colors ${
              mobileLegendOpen || highlightFilter ? "bg-primary/10 border-primary/30 text-primary" : "border-border/60 hover:bg-muted/50"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filtres{highlightFilter ? ` (${GARDE_COLORS[highlightFilter]?.label || highlightFilter})` : ""}
          </button>
          <button
            onClick={() => setShowAllMonths(!showAllMonths)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border border-border/60 hover:bg-muted/50 transition-colors"
          >
            {showAllMonths ? <CalendarDays className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {showAllMonths ? "Mois à venir" : "Année complète"}
          </button>
          <button
            onClick={handlePdfExport}
            disabled={pdfLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border border-border/60 hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            {pdfLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            PDF
          </button>
        </div>
        {/* Mobile legend dropdown */}
        {mobileLegendOpen && (
          <div className="sm:hidden mt-2 p-2 rounded-xl bg-muted/30 border border-border/40 flex flex-wrap gap-1.5 animate-in slide-in-from-top-2 duration-150">
            <LegendItem
              color={GARDE_COLORS.sebastien.bg}
              label="Sébastien"
              active={highlightFilter === "sebastien"}
              onClick={() => toggleFilter("sebastien")}
            />
            <LegendItem
              color={GARDE_COLORS.nathalie.bg}
              label="Nathalie"
              active={highlightFilter === "nathalie"}
              onClick={() => toggleFilter("nathalie")}
            />
            <LegendItem
              color={GARDE_COLORS.rosy_bernard.bg}
              label="Rosy & Bernard"
              active={highlightFilter === "rosy_bernard"}
              onClick={() => toggleFilter("rosy_bernard")}
            />
            <LegendItem
              color={GARDE_COLORS.famille_elargie.bg}
              label="Famille élargie"
              active={highlightFilter === "famille_elargie"}
              onClick={() => toggleFilter("famille_elargie")}
            />
            <LegendItem
              color={GARDE_COLORS.partage.bg}
              label="Jour d'échange"
              active={highlightFilter === "partage"}
              onClick={() => toggleFilter("partage")}
            />
            <LegendItem
              color="#f0f0f0"
              label="Vacances"
              active={false}
              onClick={() => {}}
              hatched
            />
            <LegendItem
              color="transparent"
              label="Férié"
              active={false}
              onClick={() => {}}
              border="#e24b4a"
            />
          </div>
        )}
      </div>

      <div className="flex gap-4">
        {/* Calendar grid */}
        <div className="flex-1 min-w-0">
          {/* Desktop: 3-column grid */}
          <div className="hidden md:grid grid-cols-3 gap-3">
            {monthsToShow.map((i) => (
              <MonthGrid
                key={i}
                year={2026}
                month={i}
                data={data}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                highlightFilter={highlightFilter}
                onMonthTitleClick={handleMonthClick}
              />
            ))}
          </div>

          {/* Mobile: month-by-month with swipe */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setMobileMonth(Math.max(showAllMonths ? 0 : currentMonth, mobileMonth - 1))}
                disabled={mobileMonth === (showAllMonths ? 0 : currentMonth)}
                className="p-2 rounded-xl hover:bg-muted/50 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span
                className="font-heading font-bold text-base cursor-pointer hover:text-primary hover:underline underline-offset-2 transition-colors"
                onClick={() => handleMonthClick(mobileMonth)}
              >
                {MONTH_NAMES[mobileMonth]} 2026
              </span>
              <button
                onClick={() => setMobileMonth(Math.min(11, mobileMonth + 1))}
                disabled={mobileMonth === 11}
                className="p-2 rounded-xl hover:bg-muted/50 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <MonthGrid
              year={2026}
              month={mobileMonth}
              data={data}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              highlightFilter={highlightFilter}
              onMonthTitleClick={handleMonthClick}
            />
          </div>
        </div>

        {/* Day detail panel — desktop sidebar */}
        {selectedInfo && (
          <div className="hidden md:block w-[280px] flex-shrink-0 sticky top-[100px] self-start">
            <DayDetail info={selectedInfo} onClose={() => { setSelectedDate(null); setSelectedInfo(null); }} />
          </div>
        )}
      </div>

      {/* Day detail — mobile bottom sheet */}
      {selectedInfo && (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t border-border/40">
          <DayDetail info={selectedInfo} onClose={() => { setSelectedDate(null); setSelectedInfo(null); }} />
        </div>
      )}

      {/* Timeline */}
      <div className="hidden sm:block">
        <Timeline data={data} />
      </div>
    </div>
  );
}
