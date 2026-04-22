/*
 * Page statistiques cachée — accessible uniquement via /stats
 * Indicateurs calculés dynamiquement depuis planning-2026.json
 */
import { useMemo, useState, useEffect } from "react";
import { usePlanningData, getDayInfo, GARDE_COLORS } from "@/hooks/usePlanningData";
import type { PlanningData, GardeType } from "@/hooks/usePlanningData";
import { Loader2, BarChart3, Calendar, Users, Plane, Sun, ArrowLeft, TrendingUp } from "lucide-react";
import { AVAILABLE_WEEKS } from "@/lib/types";
import type { WeekData } from "@/lib/types";
import { Link } from "wouter";

/* ── Helpers ── */
function countDaysBetween(start: string, end: string): number {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
}

function computeStats(data: PlanningData) {
  // Iterate every day from March 1 to Dec 31
  const startDate = new Date(2026, 2, 1); // March 1
  const endDate = new Date(2026, 11, 31); // Dec 31
  const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1;

  const gardeCounts: Record<string, number> = {};
  const gardeByMonth: Record<number, Record<string, number>> = {};
  const weekendGarde: Record<string, number> = {};
  let vacancesDays = 0;
  let ferieDays = 0;
  let weekendDays = 0;

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate.getTime() + i * 86400000);
    const info = getDayInfo(d, data);
    const month = d.getMonth();
    const dayOfWeek = d.getDay();

    // Garde counts
    gardeCounts[info.garde] = (gardeCounts[info.garde] || 0) + 1;

    // Garde by month
    if (!gardeByMonth[month]) gardeByMonth[month] = {};
    gardeByMonth[month][info.garde] = (gardeByMonth[month][info.garde] || 0) + 1;

    // Weekend garde
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendGarde[info.garde] = (weekendGarde[info.garde] || 0) + 1;
      weekendDays++;
    }

    if (info.isVacances) vacancesDays++;
    if (info.isFerie) ferieDays++;
  }

  // Déplacements stats
  const deplacementsByPerson: Record<string, { count: number; totalDays: number; destinations: Set<string> }> = {};
  for (const dep of data.deplacements) {
    if (!deplacementsByPerson[dep.qui]) {
      deplacementsByPerson[dep.qui] = { count: 0, totalDays: 0, destinations: new Set() };
    }
    deplacementsByPerson[dep.qui].count++;
    deplacementsByPerson[dep.qui].totalDays += countDaysBetween(dep.debut, dep.fin);
    deplacementsByPerson[dep.qui].destinations.add(dep.destination);
  }

  // Voyages stats
  const totalVoyages = data.voyages_famille.length;
  let totalVoyageDays = 0;
  const voyageDestinations: string[] = [];
  for (const v of data.voyages_famille) {
    totalVoyageDays += countDaysBetween(v.debut, v.fin);
    voyageDestinations.push(v.destination);
  }

  // Stages stats
  const totalStages = data.stages_enfants.length;
  let totalStageDays = 0;
  const stagesByEnfant: Record<string, number> = {};
  for (const st of data.stages_enfants) {
    totalStageDays += countDaysBetween(st.debut, st.fin);
    for (const d of st.detail) {
      stagesByEnfant[d.enfant] = (stagesByEnfant[d.enfant] || 0) + 1;
    }
  }

  // Vacances scolaires
  const vacancesDetails = data.vacances_scolaires.map(v => ({
    nom: v.nom,
    days: countDaysBetween(v.debut, v.fin),
  }));

  // Exceptions count
  const totalExceptions = data.exceptions_garde.length;
  const partageCount = data.exceptions_garde.filter(e => e.garde === "partage").length;

  return {
    totalDays,
    gardeCounts,
    gardeByMonth,
    weekendGarde,
    weekendDays,
    vacancesDays,
    ferieDays,
    deplacementsByPerson,
    totalVoyages,
    totalVoyageDays,
    voyageDestinations,
    totalStages,
    totalStageDays,
    stagesByEnfant,
    vacancesDetails,
    totalExceptions,
    partageCount,
  };
}

/* ── Components ── */
function StatCard({ label, value, sublabel, icon: Icon, color }: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <div className="bento-card p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-4 h-4" style={color ? { color } : undefined} />
        <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-3xl font-heading font-extrabold tracking-tight" style={color ? { color } : undefined}>
        {value}
      </p>
      {sublabel && <p className="text-[12px] text-muted-foreground">{sublabel}</p>}
    </div>
  );
}

function GardeBar({ garde, count, total }: { garde: string; count: number; total: number }) {
  const colors = GARDE_COLORS[garde] || GARDE_COLORS.a_determiner;
  const pct = ((count / total) * 100).toFixed(1);
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] font-semibold w-28 text-right truncate">{colors.label}</span>
      <div className="flex-1 h-7 bg-muted/40 rounded-lg overflow-hidden relative">
        <div
          className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
          style={{ width: `${pct}%`, backgroundColor: colors.bg }}
        >
          {parseFloat(pct) > 8 && (
            <span className="text-[11px] font-bold" style={{ color: colors.text }}>{count}j</span>
          )}
        </div>
      </div>
      <span className="text-[12px] font-mono text-muted-foreground w-12 text-right">{pct}%</span>
    </div>
  );
}

function MonthGardeRow({ month, gardeData, monthNames }: {
  month: number;
  gardeData: Record<string, number>;
  monthNames: string[];
}) {
  const total = Object.values(gardeData).reduce((a, b) => a + b, 0);
  const gardeOrder: GardeType[] = ["sebastien", "nathalie", "rosy_bernard", "famille_elargie", "partage", "a_determiner"];
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold w-12 text-right text-muted-foreground">{monthNames[month].slice(0, 3)}</span>
      <div className="flex-1 h-5 rounded-md overflow-hidden flex">
        {gardeOrder.map(g => {
          const count = gardeData[g] || 0;
          if (count === 0) return null;
          const pct = (count / total) * 100;
          const colors = GARDE_COLORS[g] || GARDE_COLORS.a_determiner;
          return (
            <div
              key={g}
              className="h-full transition-all duration-300"
              style={{ width: `${pct}%`, backgroundColor: colors.bg }}
              title={`${colors.label}: ${count}j (${pct.toFixed(0)}%)`}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ── Activities Line Chart ── */
function ActivitiesChart() {
  const [allWeeks, setAllWeeks] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const results: WeekData[] = [];
      for (const week of AVAILABLE_WEEKS) {
        try {
          const res = await fetch(`/data/${week.id}.json?v=${Date.now()}`);
          if (res.ok) {
            const json: WeekData = await res.json();
            results.push(json);
          }
        } catch { /* skip */ }
      }
      setAllWeeks(results);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const chartData = useMemo(() => {
    if (allWeeks.length === 0) return { days: [], max: 0, total: 0 };

    // Aggregate activities by date across all weeks
    const byDate: Record<string, number> = {};
    let total = 0;
    for (const week of allWeeks) {
      for (const act of week.activites) {
        byDate[act.date] = (byDate[act.date] || 0) + 1;
        total++;
      }
    }

    // Sort dates and build chart points
    const sortedDates = Object.keys(byDate).sort();
    const days = sortedDates.map(d => ({
      date: d,
      count: byDate[d],
      label: new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      weekday: new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short" }),
    }));
    const max = Math.max(...days.map(d => d.count), 1);

    return { days, max, total };
  }, [allWeeks]);

  if (loading) {
    return (
      <div className="bento-card p-5 flex items-center justify-center h-40">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (chartData.days.length === 0) {
    return (
      <div className="bento-card p-5">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Activités par jour
        </h2>
        <p className="text-sm text-muted-foreground mt-2">Aucune donnée d'activités disponible.</p>
      </div>
    );
  }

  const CHART_H = 180;
  const CHART_PAD_TOP = 10;
  const CHART_PAD_BOTTOM = 40;
  const CHART_PAD_LEFT = 32;
  const CHART_PAD_RIGHT = 12;
  const usableH = CHART_H - CHART_PAD_TOP - CHART_PAD_BOTTOM;
  const usableW_pct = 100; // we'll use SVG viewBox

  // Build SVG path
  const svgW = Math.max(chartData.days.length * 48, 600);
  const pointSpacing = (svgW - CHART_PAD_LEFT - CHART_PAD_RIGHT) / Math.max(chartData.days.length - 1, 1);

  const points = chartData.days.map((d, i) => ({
    x: CHART_PAD_LEFT + i * pointSpacing,
    y: CHART_PAD_TOP + usableH - (d.count / chartData.max) * usableH,
    ...d,
  }));

  // Line path
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // Area path (fill under curve)
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${CHART_PAD_TOP + usableH} L ${points[0].x} ${CHART_PAD_TOP + usableH} Z`;

  // Y-axis ticks
  const yTicks = [];
  const step = chartData.max <= 5 ? 1 : chartData.max <= 12 ? 2 : Math.ceil(chartData.max / 5);
  for (let v = 0; v <= chartData.max; v += step) {
    yTicks.push(v);
  }
  if (yTicks[yTicks.length - 1] !== chartData.max) yTicks.push(chartData.max);

  return (
    <div className="bento-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Activités par jour
        </h2>
        <span className="text-[12px] text-muted-foreground font-mono">
          {chartData.total} activités sur {chartData.days.length} jours ({AVAILABLE_WEEKS.length} semaines)
        </span>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <svg
          viewBox={`0 0 ${svgW} ${CHART_H}`}
          className="w-full"
          style={{ minWidth: `${Math.max(chartData.days.length * 36, 400)}px`, height: `${CHART_H}px` }}
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {yTicks.map(v => {
            const y = CHART_PAD_TOP + usableH - (v / chartData.max) * usableH;
            return (
              <g key={v}>
                <line
                  x1={CHART_PAD_LEFT}
                  y1={y}
                  x2={svgW - CHART_PAD_RIGHT}
                  y2={y}
                  className="stroke-border/40"
                  strokeWidth={0.5}
                  strokeDasharray="4 3"
                />
                <text
                  x={CHART_PAD_LEFT - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-muted-foreground"
                  fontSize={9}
                  fontFamily="monospace"
                >
                  {v}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path
            d={areaPath}
            fill="url(#areaGradient)"
            opacity={0.3}
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#f43f5e"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points and labels */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={3.5}
                fill="#fff"
                stroke="#f43f5e"
                strokeWidth={2}
              />
              {/* Count label above point */}
              <text
                x={p.x}
                y={p.y - 10}
                textAnchor="middle"
                className="fill-foreground"
                fontSize={10}
                fontWeight={600}
              >
                {p.count}
              </text>
              {/* Date label below */}
              <text
                x={p.x}
                y={CHART_PAD_TOP + usableH + 14}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={8}
                fontFamily="monospace"
              >
                {p.weekday}
              </text>
              <text
                x={p.x}
                y={CHART_PAD_TOP + usableH + 26}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={8}
                fontFamily="monospace"
              >
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function Stats() {
  const { data, loading } = usePlanningData();

  const MONTH_NAMES = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];

  const stats = useMemo(() => {
    if (!data) return null;
    return computeStats(data);
  }, [data]);

  if (loading || !stats || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const gardeOrder: GardeType[] = ["sebastien", "nathalie", "rosy_bernard", "famille_elargie", "partage", "a_determiner"];

  return (
    <div className="container py-5 sm:py-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all no-underline">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-heading font-extrabold text-2xl tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Statistiques 2026
          </h1>
          <p className="text-sm text-muted-foreground">
            Indicateurs calculés sur la période mars – décembre ({stats.totalDays} jours)
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Jours Sébastien"
          value={stats.gardeCounts["sebastien"] || 0}
          sublabel={`${((stats.gardeCounts["sebastien"] || 0) / stats.totalDays * 100).toFixed(1)}% du total`}
          icon={Users}
          color={GARDE_COLORS.sebastien.text}
        />
        <StatCard
          label="Jours Nathalie"
          value={stats.gardeCounts["nathalie"] || 0}
          sublabel={`${((stats.gardeCounts["nathalie"] || 0) / stats.totalDays * 100).toFixed(1)}% du total`}
          icon={Users}
          color={GARDE_COLORS.nathalie.text}
        />
        <StatCard
          label="Jours R&B"
          value={stats.gardeCounts["rosy_bernard"] || 0}
          sublabel={`${((stats.gardeCounts["rosy_bernard"] || 0) / stats.totalDays * 100).toFixed(1)}% du total`}
          icon={Users}
          color={GARDE_COLORS.rosy_bernard.text}
        />
        <StatCard
          label="Jours d'échange"
          value={stats.partageCount}
          sublabel={`${stats.totalExceptions} exceptions au total`}
          icon={Calendar}
        />
      </div>

      {/* Garde distribution bar chart */}
      <div className="bento-card p-5 space-y-3">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Répartition des jours de garde
        </h2>
        <div className="space-y-2">
          {gardeOrder.map(g => {
            const count = stats.gardeCounts[g] || 0;
            if (count === 0) return null;
            return <GardeBar key={g} garde={g} count={count} total={stats.totalDays} />;
          })}
        </div>
      </div>

      {/* Weekend garde */}
      <div className="bento-card p-5 space-y-3">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Sun className="w-4 h-4" />
          Répartition des week-ends ({stats.weekendDays} jours sam-dim)
        </h2>
        <div className="space-y-2">
          {gardeOrder.map(g => {
            const count = stats.weekendGarde[g] || 0;
            if (count === 0) return null;
            return <GardeBar key={g} garde={g} count={count} total={stats.weekendDays} />;
          })}
        </div>
      </div>

      {/* Monthly breakdown */}
      <div className="bento-card p-5 space-y-3">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Répartition mensuelle
        </h2>
        <div className="space-y-1.5">
          {Object.keys(stats.gardeByMonth)
            .map(Number)
            .sort((a, b) => a - b)
            .map(month => (
              <MonthGardeRow
                key={month}
                month={month}
                gardeData={stats.gardeByMonth[month]}
                monthNames={MONTH_NAMES}
              />
            ))}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-border/40">
          {gardeOrder.map(g => {
            const colors = GARDE_COLORS[g];
            if (!colors) return null;
            return (
              <div key={g} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors.bg }} />
                <span className="text-[11px] text-muted-foreground">{colors.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Graphique activités par jour */}
      <ActivitiesChart />

      {/* Two columns: Vacances + Jours fériés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatCard
          label="Jours de vacances scolaires"
          value={stats.vacancesDays}
          sublabel={data.vacances_scolaires.map(v => v.nom).join(", ")}
          icon={Sun}
          color="#0369a1"
        />
        <StatCard
          label="Jours fériés"
          value={stats.ferieDays}
          sublabel={data.jours_feries.map(f => f.nom).join(", ")}
          icon={Calendar}
          color="#7c3aed"
        />
      </div>

      {/* Vacances detail */}
      <div className="bento-card p-5 space-y-3">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Détail des vacances scolaires
        </h2>
        <div className="space-y-2">
          {stats.vacancesDetails.map((v, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm">{v.nom}</span>
              <span className="text-sm font-mono text-muted-foreground">{v.days} jours</span>
            </div>
          ))}
        </div>
      </div>

      {/* Déplacements */}
      <div className="bento-card p-5 space-y-3">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Plane className="w-4 h-4" />
          Déplacements
        </h2>
        <div className="space-y-4">
          {Object.entries(stats.deplacementsByPerson).map(([person, info]) => (
            <div key={person} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{person}</span>
                <span className="text-[12px] text-muted-foreground font-mono">
                  {info.count} déplacement{info.count > 1 ? "s" : ""} · {info.totalDays} jours
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(info.destinations).map((dest, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-lg bg-muted/60 text-[11px] text-muted-foreground">
                    {dest}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voyages famille */}
      {stats.totalVoyages > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StatCard
            label="Voyages famille"
            value={stats.totalVoyages}
            sublabel={`${stats.totalVoyageDays} jours au total`}
            icon={Plane}
            color="#059669"
          />
          <div className="bento-card p-5 space-y-2">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Destinations</p>
            <div className="flex flex-wrap gap-1.5">
              {stats.voyageDestinations.map((dest, i) => (
                <span key={i} className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-[12px] font-medium dark:bg-emerald-900/30 dark:text-emerald-300">
                  {dest}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stages enfants */}
      {stats.totalStages > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            label="Stages / activités"
            value={stats.totalStages}
            sublabel={`${stats.totalStageDays} jours au total`}
            icon={Calendar}
            color="#b45309"
          />
          {Object.entries(stats.stagesByEnfant).map(([enfant, count]) => (
            <StatCard
              key={enfant}
              label={`Stages ${enfant}`}
              value={count}
              sublabel="activités programmées"
              icon={Users}
              color="#b45309"
            />
          ))}
        </div>
      )}

      {/* Équilibre Sébastien / Nathalie */}
      <div className="bento-card p-5 space-y-3">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Équilibre Sébastien / Nathalie
        </h2>
        {(() => {
          const seb = stats.gardeCounts["sebastien"] || 0;
          const nat = stats.gardeCounts["nathalie"] || 0;
          const total = seb + nat;
          const sebPct = total > 0 ? (seb / total * 100) : 50;
          const natPct = total > 0 ? (nat / total * 100) : 50;
          const diff = Math.abs(seb - nat);
          return (
            <div className="space-y-3">
              <div className="h-10 rounded-xl overflow-hidden flex">
                <div
                  className="h-full flex items-center justify-center transition-all duration-500"
                  style={{ width: `${sebPct}%`, backgroundColor: GARDE_COLORS.sebastien.bg }}
                >
                  <span className="text-[12px] font-bold" style={{ color: GARDE_COLORS.sebastien.text }}>
                    {seb}j ({sebPct.toFixed(1)}%)
                  </span>
                </div>
                <div
                  className="h-full flex items-center justify-center transition-all duration-500"
                  style={{ width: `${natPct}%`, backgroundColor: GARDE_COLORS.nathalie.bg }}
                >
                  <span className="text-[12px] font-bold" style={{ color: GARDE_COLORS.nathalie.text }}>
                    {nat}j ({natPct.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <p className="text-[12px] text-muted-foreground text-center">
                Écart : <span className="font-semibold">{diff} jour{diff !== 1 ? "s" : ""}</span>
                {diff <= 5 && " — équilibre satisfaisant"}
                {diff > 5 && diff <= 15 && " — léger déséquilibre"}
                {diff > 15 && " — déséquilibre notable"}
              </p>

              {/* Weekend balance */}
              {(() => {
                const sebWE = stats.weekendGarde["sebastien"] || 0;
                const natWE = stats.weekendGarde["nathalie"] || 0;
                const totalWE = sebWE + natWE;
                const sebWEPct = totalWE > 0 ? (sebWE / totalWE * 100) : 50;
                const natWEPct = totalWE > 0 ? (natWE / totalWE * 100) : 50;
                const diffWE = Math.abs(sebWE - natWE);
                return (
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Week-ends uniquement</p>
                    <div className="h-8 rounded-lg overflow-hidden flex">
                      <div
                        className="h-full flex items-center justify-center transition-all duration-500"
                        style={{ width: `${sebWEPct}%`, backgroundColor: GARDE_COLORS.sebastien.bg }}
                      >
                        <span className="text-[11px] font-bold" style={{ color: GARDE_COLORS.sebastien.text }}>
                          {sebWE}j
                        </span>
                      </div>
                      <div
                        className="h-full flex items-center justify-center transition-all duration-500"
                        style={{ width: `${natWEPct}%`, backgroundColor: GARDE_COLORS.nathalie.bg }}
                      >
                        <span className="text-[11px] font-bold" style={{ color: GARDE_COLORS.nathalie.text }}>
                          {natWE}j
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground text-center">
                      Écart week-ends : {diffWE} jour{diffWE !== 1 ? "s" : ""}
                    </p>
                  </div>
                );
              })()}
            </div>
          );
        })()}
      </div>

      {/* Footer */}
      <p className="text-[11px] text-muted-foreground text-center pb-4">
        Données calculées à partir de planning-2026.json
        {data.derniere_maj && (
          <> — dernière mise à jour : {new Date(data.derniere_maj).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</>
        )}
      </p>
    </div>
  );
}
