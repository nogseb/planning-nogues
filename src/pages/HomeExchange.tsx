/*
 * Page dédiée HomeExchange
 * Liste tous les échanges passés et à venir avec liens vers les conversations
 */
import { usePlanningData, EVENT_COLORS } from "@/hooks/usePlanningData";
import { Home, ExternalLink, Calendar, MapPin, User, Clock } from "lucide-react";
import { Loader2 } from "lucide-react";

function formatDateRange(debut: string, fin: string): string {
  const d1 = new Date(debut + "T12:00:00");
  const d2 = new Date(fin + "T12:00:00");
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
  if (debut === fin) {
    return d1.toLocaleDateString("fr-FR", { ...opts, weekday: "long" });
  }
  return `${d1.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} → ${d2.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" })}`;
}

function getDuration(debut: string, fin: string): number {
  const d1 = new Date(debut + "T12:00:00");
  const d2 = new Date(fin + "T12:00:00");
  return Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1;
}

function getStatus(debut: string, fin: string): { label: string; color: string; bg: string } {
  const today = new Date().toISOString().split("T")[0];
  if (fin < today) return { label: "Terminé", color: "#6b7280", bg: "#f3f4f6" };
  if (debut <= today && fin >= today) return { label: "En cours", color: "#059669", bg: "#d1fae5" };
  return { label: "À venir", color: "#d97706", bg: "#fef3c7" };
}

export default function HomeExchangePage() {
  const { data: planningData, loading } = usePlanningData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const exchanges = planningData?.home_exchange || [];
  const today = new Date().toISOString().split("T")[0];

  const upcoming = exchanges.filter(e => e.fin >= today).sort((a, b) => a.debut.localeCompare(b.debut));
  const past = exchanges.filter(e => e.fin < today).sort((a, b) => b.debut.localeCompare(a.debut));

  const totalNights = exchanges.reduce((sum, e) => sum + getDuration(e.debut, e.fin) - 1, 0);
  const bizet = exchanges.filter(e => e.logement.includes("Bizet"));
  const etoile = exchanges.filter(e => !e.logement.includes("Bizet"));

  return (
    <div className="container py-5 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: EVENT_COLORS.home_exchange.bg }}>
          <Home className="w-5 h-5" style={{ color: EVENT_COLORS.home_exchange.text }} />
        </div>
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight">
            HomeExchange
          </h1>
          <p className="text-sm text-muted-foreground">
            Échanges de logements — planning et suivi
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bento-card p-4 text-center">
          <p className="text-2xl font-heading font-extrabold text-foreground">{exchanges.length}</p>
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-1">Échanges</p>
        </div>
        <div className="bento-card p-4 text-center">
          <p className="text-2xl font-heading font-extrabold text-foreground">{totalNights}</p>
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-1">Nuitées</p>
        </div>
        <div className="bento-card p-4 text-center">
          <p className="text-2xl font-heading font-extrabold text-foreground">{bizet.length}</p>
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-1">Rue Bizet</p>
        </div>
        <div className="bento-card p-4 text-center">
          <p className="text-2xl font-heading font-extrabold text-foreground">{etoile.length}</p>
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-1">Rue de l'Étoile</p>
        </div>
      </div>

      {/* Logements */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bento-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h2 className="font-heading font-bold text-sm">Maison rue Bizet</h2>
          </div>
          <p className="text-xs text-muted-foreground">Maison avec jardin — idéale familles</p>
        </div>
        <div className="bento-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h2 className="font-heading font-bold text-sm">Appartement rue de l'Étoile</h2>
          </div>
          <p className="text-xs text-muted-foreground">Appartement centre-ville — couples et solo</p>
        </div>
      </div>

      {/* À venir */}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-heading font-bold text-lg flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            À venir
          </h2>
          <div className="space-y-3">
            {upcoming.map((ex, i) => {
              const status = getStatus(ex.debut, ex.fin);
              const duration = getDuration(ex.debut, ex.fin);
              return (
                <div key={`up-${i}`} className="bento-card p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-heading font-bold text-base">
                          {ex.logement}
                        </h3>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                          style={{ backgroundColor: status.bg, color: status.color }}
                        >
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDateRange(ex.debut, ex.fin)}
                        </span>
                        <span className="text-xs bg-muted/60 px-2 py-0.5 rounded-lg">
                          {duration - 1} nuit{duration - 1 > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 text-sm">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-medium">{ex.voyageur}</span>
                      </div>
                    </div>
                    <a
                      href={ex.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-2.5 rounded-xl hover:bg-muted transition-colors"
                      title="Ouvrir la conversation"
                    >
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Passés */}
      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-heading font-bold text-lg flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            Terminés
          </h2>
          <div className="space-y-2">
            {past.map((ex, i) => {
              const duration = getDuration(ex.debut, ex.fin);
              return (
                <div key={`past-${i}`} className="bento-card p-4 opacity-70 hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{ex.logement}</span>
                        <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-lg">
                          {duration - 1} nuit{duration - 1 > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{formatDateRange(ex.debut, ex.fin)}</span>
                        <span>— {ex.voyageur}</span>
                      </div>
                    </div>
                    <a
                      href={ex.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-2 rounded-xl hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {exchanges.length === 0 && (
        <div className="bento-card p-8 text-center">
          <Home className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucun échange HomeExchange enregistré.</p>
        </div>
      )}
    </div>
  );
}
