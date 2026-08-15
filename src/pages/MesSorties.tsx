/**
 * Page « Mes sorties » : bento clair, actions sobres et persistance navigateur.
 */
import { CalendarHeart, Trash2, BookmarkPlus } from "lucide-react";
import ActivityCard from "@/components/ActivityCard";
import { useSavedActivities } from "@/contexts/SavedActivitiesContext";
import { Link } from "wouter";

export default function MesSorties() {
  const { savedActivities, clearActivities } = useSavedActivities();
  const sortedActivities = [...savedActivities].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="container py-6 sm:py-8 space-y-6">
      <section className="bento-card p-5 sm:p-7 bg-gradient-to-br from-rose-500/10 via-card to-amber-400/10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-sm">
              <CalendarHeart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-primary mb-1">Sélection personnelle</p>
              <h1 className="font-heading font-extrabold text-2xl tracking-tight">Mes sorties</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {sortedActivities.length === 0
                  ? "Ajoute les activités que tu souhaites garder sous la main."
                  : `${sortedActivities.length} activité${sortedActivities.length > 1 ? "s" : ""} enregistrée${sortedActivities.length > 1 ? "s" : ""} sur cet appareil.`}
              </p>
            </div>
          </div>
          {sortedActivities.length > 0 && (
            <button
              onClick={clearActivities}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold border border-border text-muted-foreground hover:text-rose-700 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Vider la liste
            </button>
          )}
        </div>
        <p className="mt-5 text-[12px] text-muted-foreground border-t border-border/60 pt-4">
          Cette liste est enregistrée localement dans ce navigateur ; elle ne sera pas partagée avec les autres appareils.
        </p>
      </section>

      {sortedActivities.length > 0 ? (
        <div className="bento-grid">
          {sortedActivities.map((activity) => (
            <div key={`${activity.date}-${activity.titre}`} className={activity.priorite === "incontournable" ? "bento-span-2" : ""}>
              <ActivityCard activity={activity} />
            </div>
          ))}
        </div>
      ) : (
        <section className="bento-card p-10 text-center max-w-2xl mx-auto">
          <BookmarkPlus className="w-8 h-8 text-primary mx-auto mb-3" />
          <h2 className="font-heading font-bold text-lg">Aucune sortie sélectionnée</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Depuis les pages Activités ou Liste, utilise le bouton « Ajouter à mes sorties » sur une carte pour constituer ta sélection.
          </p>
          <Link href="/liste" className="inline-flex mt-5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold no-underline hover:opacity-90 transition-opacity">
            Parcourir les activités
          </Link>
        </section>
      )}
    </div>
  );
}
