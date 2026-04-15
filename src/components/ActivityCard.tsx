/*
 * Bento Box design: rounded card with colored accent top strip
 * Hover lifts card with shadow. Incontournable cards get span-2 class.
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
} from "lucide-react";

interface Props {
  activity: Activity;
  compact?: boolean;
  onClick?: () => void;
}

export default function ActivityCard({ activity, compact, onClick }: Props) {
  const color = TYPE_COLORS[activity.type] || "#666";
  const label = TYPE_LABELS[activity.type] || activity.type;
  const rituelIcon = RITUEL_ICONS[activity.compatible_rituel];

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
          </div>
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
