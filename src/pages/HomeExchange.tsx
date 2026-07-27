/*
 * Page dédiée HomeExchange
 * Deux colonnes : Bizet et Étoile, avec échanges passés et à venir
 */
import { usePlanningData, EVENT_COLORS } from "@/hooks/usePlanningData";
import { Home, ExternalLink, Calendar, MapPin, User } from "lucide-react";
import { Loader2 } from "lucide-react";

function formatDateRange(debut: string, fin: string): string {
  const d1 = new Date(debut + "T12:00:00");
  const d2 = new Date(fin + "T12:00:00");
  if (debut === fin) {
    return d1.toLocaleDateString("fr-FR", { day: "numeric", month: "long", weekday: "long" });
  }
  return `${d1.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} → ${d2.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
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

interface Exchange {
  logement: string;
  debut: string;
  fin: string;
  voyageur: string;
  url: string;
}

function ExchangeCard({ ex }: { ex: Exchange }) {
  const status = getStatus(ex.debut, ex.fin);
  const duration = getDuration(ex.debut, ex.fin);
  const isPast = ex.fin < new Date().toISOString().split("T")[0];

  return (
    <div className={`bento-card p-4 hover:shadow-md transition-all ${isPast ? "opacity-60 hover:opacity-100" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
              style={{ backgroundColor: status.bg, color: status.color }}
            >
              {status.label}
            </span>
            <span className="text-xs bg-muted/60 px-2 py-0.5 rounded-lg text-muted-foreground">
              {duration - 1} nuit{duration - 1 > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{formatDateRange(ex.debut, ex.fin)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-sm">
            <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="font-medium">{ex.voyageur}</span>
          </div>
        </div>
        <a
          href={ex.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 p-2 rounded-xl hover:bg-muted transition-colors"
          title="Ouvrir la conversation"
        >
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
        </a>
      </div>
    </div>
  );
}

function LogementColumn({ title, subtitle, exchanges }: { title: string; subtitle: string; exchanges: Exchange[] }) {
  const today = new Date().toISOString().split("T")[0];
  const upcoming = exchanges.filter(e => e.fin >= today).sort((a, b) => a.debut.localeCompare(b.debut));
  const past = exchanges.filter(e => e.fin < today).sort((a, b) => b.debut.localeCompare(a.debut));
  const totalNights = exchanges.reduce((sum, e) => sum + getDuration(e.debut, e.fin) - 1, 0);

  return (
    <div className="space-y-4">
      {/* Column header */}
      <div className="bento-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-primary" />
          <h2 className="font-heading font-bold text-base">{title}</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>
        <div className="flex items-center gap-4 text-sm">
          <span className="font-semibold">{exchanges.length} échange{exchanges.length > 1 ? "s" : ""}</span>
          <span className="text-muted-foreground">{totalNights} nuitée{totalNights > 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">À venir</p>
          {upcoming.map((ex, i) => (
            <ExchangeCard key={`up-${i}`} ex={ex} />
          ))}
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Terminés</p>
          {past.map((ex, i) => (
            <ExchangeCard key={`past-${i}`} ex={ex} />
          ))}
        </div>
      )}

      {exchanges.length === 0 && (
        <div className="bento-card p-6 text-center">
          <p className="text-sm text-muted-foreground italic">Aucun échange enregistré.</p>
        </div>
      )}
    </div>
  );
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
  const bizet = exchanges.filter(e => e.logement.includes("Bizet"));
  const etoile = exchanges.filter(e => !e.logement.includes("Bizet"));
  const totalNights = exchanges.reduce((sum, e) => sum + getDuration(e.debut, e.fin) - 1, 0);

  return (
    <div className="container py-5 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
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
        {/* Global stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <p className="text-xl font-heading font-extrabold">{exchanges.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Échanges</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-xl font-heading font-extrabold">{totalNights}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Nuitées</p>
          </div>
        </div>
      </div>

      {/* Two columns: Bizet / Étoile */}
      <div className="grid md:grid-cols-2 gap-6">
        <LogementColumn
          title="Maison rue Bizet"
          subtitle="Maison avec jardin — idéale familles"
          exchanges={bizet}
        />
        <LogementColumn
          title="Appartement rue de l'Étoile"
          subtitle="Appartement centre-ville — couples et solo"
          exchanges={etoile}
        />
      </div>

      {exchanges.length === 0 && (
        <div className="bento-card p-8 text-center">
          <Home className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucun échange HomeExchange enregistré.</p>
        </div>
      )}
    </div>
  );
}
