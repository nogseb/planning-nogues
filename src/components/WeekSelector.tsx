/**
 * WeekSelector — Sélecteur de semaines avec regroupement des semaines passées
 * Les semaines dont le dimanche est passé sont regroupées sous un bouton dropdown (icône History).
 * Les semaines actuelles/futures restent affichées comme boutons individuels.
 */
import { useMemo } from "react";
import { AVAILABLE_WEEKS } from "@/lib/types";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

/** Calcule la date du dimanche (fin) d'une semaine ISO à partir de l'id "2026-WXX" */
function getSundayOfWeek(weekId: string): Date {
  const [yearStr, weekStr] = weekId.split("-W");
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);
  // Le 4 janvier est toujours dans la semaine 1 ISO
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // 1=lundi ... 7=dimanche
  // Lundi de la semaine 1
  const monday1 = new Date(jan4);
  monday1.setDate(jan4.getDate() - dayOfWeek + 1);
  // Lundi de la semaine demandée
  const mondayTarget = new Date(monday1);
  mondayTarget.setDate(monday1.getDate() + (week - 1) * 7);
  // Dimanche = lundi + 6
  const sunday = new Date(mondayTarget);
  sunday.setDate(mondayTarget.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

interface WeekSelectorProps {
  weekIdx: number;
  setWeekIdx: (idx: number) => void;
  /** Variante compacte pour la page Carte */
  compact?: boolean;
}

export default function WeekSelector({ weekIdx, setWeekIdx, compact = false }: WeekSelectorProps) {
  const { pastWeeks, currentFutureWeeks, firstCurrentIdx } = useMemo(() => {
    const now = new Date();
    const past: { week: typeof AVAILABLE_WEEKS[number]; originalIdx: number }[] = [];
    const currentFuture: { week: typeof AVAILABLE_WEEKS[number]; originalIdx: number }[] = [];

    for (let i = 0; i < AVAILABLE_WEEKS.length; i++) {
      const sunday = getSundayOfWeek(AVAILABLE_WEEKS[i].id);
      if (sunday < now) {
        past.push({ week: AVAILABLE_WEEKS[i], originalIdx: i });
      } else {
        currentFuture.push({ week: AVAILABLE_WEEKS[i], originalIdx: i });
      }
    }

    return {
      pastWeeks: past,
      currentFutureWeeks: currentFuture,
      firstCurrentIdx: currentFuture.length > 0 ? currentFuture[0].originalIdx : 0,
    };
  }, []);

  if (AVAILABLE_WEEKS.length <= 1) return null;

  // Déterminer si la semaine sélectionnée est dans les "passées"
  const isSelectedPast = pastWeeks.some((p) => p.originalIdx === weekIdx);

  if (compact) {
    return (
      <div className="bento-card px-2 py-1.5 flex items-center gap-1">
        {/* Bouton semaines passées */}
        {pastWeeks.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`p-1 rounded-lg transition-all ${
                  isSelectedPast
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                title="Semaines passées"
              >
                <History className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[140px]">
              <DropdownMenuLabel className="text-[11px] text-muted-foreground">
                Semaines passées
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {pastWeeks.map((p) => (
                <DropdownMenuItem
                  key={p.week.id}
                  onClick={() => setWeekIdx(p.originalIdx)}
                  className={`text-[12px] cursor-pointer ${
                    p.originalIdx === weekIdx ? "bg-primary/10 text-primary font-semibold" : ""
                  }`}
                >
                  {p.week.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Flèche gauche */}
        <button
          onClick={() => {
            // Naviguer vers la semaine précédente parmi les currentFuture
            const currentFutureIdx = currentFutureWeeks.findIndex((cf) => cf.originalIdx === weekIdx);
            if (currentFutureIdx > 0) {
              setWeekIdx(currentFutureWeeks[currentFutureIdx - 1].originalIdx);
            }
          }}
          disabled={currentFutureWeeks.length === 0 || currentFutureWeeks[0].originalIdx === weekIdx}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-all disabled:opacity-30"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Boutons semaines actuelles/futures */}
        {currentFutureWeeks.map((cf) => (
          <button
            key={cf.week.id}
            onClick={() => setWeekIdx(cf.originalIdx)}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              cf.originalIdx === weekIdx
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {cf.week.short}
          </button>
        ))}

        {/* Flèche droite */}
        <button
          onClick={() => {
            const currentFutureIdx = currentFutureWeeks.findIndex((cf) => cf.originalIdx === weekIdx);
            if (currentFutureIdx < currentFutureWeeks.length - 1) {
              setWeekIdx(currentFutureWeeks[currentFutureIdx + 1].originalIdx);
            }
          }}
          disabled={
            currentFutureWeeks.length === 0 ||
            currentFutureWeeks[currentFutureWeeks.length - 1].originalIdx === weekIdx
          }
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-all disabled:opacity-30"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Version standard (Home, Liste)
  return (
    <div className="flex items-center justify-center gap-3">
      {/* Bouton semaines passées */}
      {pastWeeks.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`p-2 rounded-xl border border-border/60 transition-all ${
                isSelectedPast
                  ? "text-primary border-primary/40 bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              title="Semaines passées"
            >
              <History className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[160px]">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
              Semaines passées
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {pastWeeks.map((p) => (
              <DropdownMenuItem
                key={p.week.id}
                onClick={() => setWeekIdx(p.originalIdx)}
                className={`text-[13px] cursor-pointer ${
                  p.originalIdx === weekIdx ? "bg-primary/10 text-primary font-semibold" : ""
                }`}
              >
                {p.week.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Flèche gauche (navigue dans les semaines actuelles/futures) */}
      <button
        onClick={() => {
          const currentFutureIdx = currentFutureWeeks.findIndex((cf) => cf.originalIdx === weekIdx);
          if (currentFutureIdx > 0) {
            setWeekIdx(currentFutureWeeks[currentFutureIdx - 1].originalIdx);
          }
        }}
        disabled={currentFutureWeeks.length === 0 || currentFutureWeeks[0].originalIdx === weekIdx || isSelectedPast}
        className="p-2 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Boutons semaines actuelles/futures */}
      <div className="flex gap-1.5">
        {currentFutureWeeks.map((cf) => (
          <button
            key={cf.week.id}
            onClick={() => setWeekIdx(cf.originalIdx)}
            className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all duration-200 ${
              cf.originalIdx === weekIdx
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40"
            }`}
          >
            {cf.week.short}
          </button>
        ))}
      </div>

      {/* Flèche droite */}
      <button
        onClick={() => {
          const currentFutureIdx = currentFutureWeeks.findIndex((cf) => cf.originalIdx === weekIdx);
          if (currentFutureIdx < currentFutureWeeks.length - 1) {
            setWeekIdx(currentFutureWeeks[currentFutureIdx + 1].originalIdx);
          }
        }}
        disabled={
          currentFutureWeeks.length === 0 ||
          currentFutureWeeks[currentFutureWeeks.length - 1].originalIdx === weekIdx ||
          isSelectedPast
        }
        className="p-2 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/** Retourne l'index de la première semaine non-passée (dimanche >= aujourd'hui) dans AVAILABLE_WEEKS.
 *  Utile pour initialiser le useState(weekIdx) sur la semaine courante/future. */
export function getDefaultWeekIdx(): number {
  const now = new Date();
  for (let i = 0; i < AVAILABLE_WEEKS.length; i++) {
    const sunday = getSundayOfWeek(AVAILABLE_WEEKS[i].id);
    if (sunday >= now) return i;
  }
  // Si toutes les semaines sont passées, retourner la dernière
  return AVAILABLE_WEEKS.length - 1;
}
