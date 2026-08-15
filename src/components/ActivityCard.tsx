/*
 * Bento Box design: cartes d’activité, sélection personnelle et alertes de réservation.
 */
import type { Activity } from "@/lib/types";
import { TYPE_COLORS, TYPE_LABELS, RITUEL_ICONS } from "@/lib/types";
import {
  MapPin,
  Clock,
  Euro,
  Bike,
  Car,
  ExternalLink,
  Mountain,
  ChefHat,
  Dice5,
  Star,
  Baby,
  BellRing,
  CalendarClock,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { useSavedActivities } from "@/contexts/SavedActivitiesContext";

interface Props {
  activity: Activity;
  compact?: boolean;
  onClick?: () => void;
}

export default function ActivityCard({ activity, compact, onClick }: Props) {
  const { isSaved, toggleActivity } = useSavedActivities();
  const color = TYPE_COLORS[activity.type] || "#666";
  const label = TYPE_LABELS[activity.type] || activity.type;
  const rituelIcon = RITUEL_ICONS[activity.compatible_rituel];
  const reservationLabels = {
    obligatoire: "Réservation obligatoire",
    recommandee: "Réservation conseillée",
    a_surveille: "Ouverture à surveiller",
  } as const;
  const reservationStyle = activity.reservation === "obligatoire"
    ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200"
    : activity.reservation === "recommandee"
      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
      : "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200";
  const isSelected = isSaved(activity);
  const targetDate = new Date(`${activity.date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntil = Math.round((targetDate.getTime() - today.getTime()) / 86400000);
  const isReservationReminder = Boolean(activity.reservation && daysUntil >= 0 && daysUntil <= 7);

  return (
    <div
      onClick={onClick}
      className={`bento-card overflow-hidden ${onClick ? "cursor-pointer" : ""}`}
      style={{ borderTop: `3px solid ${color}` }}
    >
      <div className="p-4 sm:p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-semibold text-white tracking-wide uppercase"
              style={{ backgroundColor: color }}
            >
              {label}
            </span>
            {activity.priorite === "incontournable" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <Star className="w-3 h-3 fill-current" />
                Incontournable
              </span>
            )}
            {rituelIcon && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-primary/10 text-primary">
                {rituelIcon === "mountain" && <Mountain className="w-3 h-3" />}
                {rituelIcon === "chef-hat" && <ChefHat className="w-3 h-3" />}
                {rituelIcon === "dice-5" && <Dice5 className="w-3 h-3" />}
                Rituel
              </span>
            )}
            {activity.reservation && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold ${reservationStyle}`}>
                <BellRing className="w-3 h-3" />
                {reservationLabels[activity.reservation]}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              toggleActivity(activity);
            }}
            aria-label={isSelected ? "Retirer de mes sorties" : "Ajouter à mes sorties"}
            title={isSelected ? "Retirer de mes sorties" : "Ajouter à mes sorties"}
            className={`shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-xl border transition-colors ${
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary hover:text-primary"
            }`}
          >
            {isSelected ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>

        {/* Title */}
        <h3 className="font-heading font-bold text-[15px] leading-snug mb-1.5 text-card-foreground">
          {activity.titre}
        </h3>

        {/* Description */}
        {!compact && (
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed line-clamp-2">
            {activity.description}
          </p>
        )}

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2 text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-lg">
            <MapPin className="w-3 h-3" />
            {activity.lieu.split(",")[0]}
          </span>
          <span className="inline-flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-lg">
            <Clock className="w-3 h-3" />
            {activity.horaire} ({activity.duree})
          </span>
          <span className="inline-flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-lg">
            {activity.transport === "velo" ? (
              <Bike className="w-3 h-3" />
            ) : (
              <Car className="w-3 h-3" />
            )}
            {activity.distance_km} km
          </span>
          <span className="inline-flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-lg">
            <Euro className="w-3 h-3" />
            {activity.tarif}
          </span>
          <span className="inline-flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-lg">
            <Baby className="w-3 h-3" />
            Des {activity.age_min} ans
          </span>
        </div>

        {/* Note papa */}
        {!compact && activity.note_papa && (
          <div className="mt-3 p-3 rounded-xl bg-muted/40 text-[12px] text-muted-foreground italic border border-border/50">
            <span className="font-semibold not-italic text-foreground/70">Note :</span>{" "}
            {activity.note_papa}
          </div>
        )}

        {!compact && activity.reservation && (
          <div className={`mt-3 flex items-start gap-2 p-3 rounded-xl text-[12px] font-medium ${reservationStyle}`}>
            <CalendarClock className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              <strong>{reservationLabels[activity.reservation]}.</strong>{" "}
              {activity.reservation_avant || "Consulter la billetterie avant de programmer la sortie."}
            </span>
          </div>
        )}

        {!compact && isReservationReminder && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-100 text-[12px] font-medium">
            <BellRing className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              <strong>{daysUntil === 0 ? "C’est aujourd’hui." : daysUntil === 1 ? "Demain." : `J-${daysUntil}.`}</strong>{" "}
              Vérifier ou finaliser la réservation avant la sortie.
            </span>
          </div>
        )}

        {/* Link */}
        {!compact && activity.url && activity.url !== "https://metropole.toulouse.fr/agenda" && (
          <a
            href={activity.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-[12px] font-semibold text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3 h-3" />
            Plus d'infos
          </a>
        )}
      </div>
    </div>
  );
}
