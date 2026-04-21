/*
 * Page statistiques cachée — accessible uniquement via /stats
 * Indicateurs calculés dynamiquement depuis planning-2026.json
 */
import { useMemo } from "react";
import { usePlanningData, getDayInfo, GARDE_COLORS } from "@/hooks/usePlanningData";
import type { PlanningData, GardeType } from "@/hooks/usePlanningData";
import { Loader2, BarChart3, Calendar, Users, Plane, Sun, ArrowLeft } from "lucide-react";
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
