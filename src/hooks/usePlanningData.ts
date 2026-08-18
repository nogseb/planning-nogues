import { useState, useEffect } from "react";

export interface PlanningData {
  annee: number;
  derniere_maj?: string;
  point_reference: { nom: string; latitude: number; longitude: number };
  enfants: { prenom: string; age: number; naissance: string }[];
  regle_garde: {
    type: string;
    pere: string;
    mere: string;
    semaines_pere: string;
    jour_echange: string;
    heure_coucher: string;
  };
  exceptions_garde: {
    debut: string;
    fin: string;
    garde: string;
    garde_matin?: string;
    garde_soir?: string;
    note: string;
  }[];
  vacances_scolaires: { nom: string; debut: string; fin: string }[];
  deplacements: { qui: string; debut: string; fin: string; destination: string }[];
  stages_enfants: {
    debut: string;
    fin: string;
    lieu: string;
    type: string;
    detail: { enfant: string; activite: string }[];
  }[];
  voyages_famille: {
    debut: string;
    fin: string;
    destination: string;
    participants: string[];
  }[];
  jours_feries: { date: string; nom: string }[];
  home_exchange?: {
    logement: string;
    debut: string;
    fin: string;
    voyageur: string;
    url: string;
  }[];
}

export type GardeType = "sebastien" | "nathalie" | "rosy_bernard" | "famille_elargie" | "a_determiner" | "partage";

export interface DayInfo {
  date: string;
  garde: GardeType;
  gardeMatin?: GardeType;
  gardeSoir?: GardeType;
  gardeNote?: string;
  isVacances: boolean;
  vacancesNom?: string;
  isFerie: boolean;
  ferieNom?: string;
  deplacements: { qui: string; destination: string }[];
  stages: { enfant: string; activite: string }[];
  voyages: { destination: string; participants: string[] }[];
  homeExchange: { logement: string; voyageur: string; url: string }[];
  isoWeek: number;
}

function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function inRange(ds: string, debut: string, fin: string): boolean {
  return ds >= debut && ds <= fin;
}

export function getDayInfo(date: Date, data: PlanningData): DayInfo {
  const ds = dateStr(date);
  const week = getISOWeek(date);

  // Sans accord de garde saisi, l'année est volontairement affichée « à déterminer ».
  // Cela évite de projeter une alternance non confirmée sur une année future.
  let garde: GardeType = data.regle_garde.type === "a_determiner"
    ? "a_determiner"
    : week % 2 === 1 ? "sebastien" : "nathalie";
  let gardeNote: string | undefined;
  let gardeMatin: GardeType | undefined;
  let gardeSoir: GardeType | undefined;

  // Check exceptions
  for (const ex of data.exceptions_garde) {
    if (inRange(ds, ex.debut, ex.fin)) {
      garde = ex.garde as GardeType;
      gardeNote = ex.note;
      if (ex.garde === "partage" && ex.garde_matin && ex.garde_soir) {
        gardeMatin = ex.garde_matin as GardeType;
        gardeSoir = ex.garde_soir as GardeType;
      }
      break;
    }
  }

  // Vacances
  let isVacances = false;
  let vacancesNom: string | undefined;
  for (const v of data.vacances_scolaires) {
    if (inRange(ds, v.debut, v.fin)) {
      isVacances = true;
      vacancesNom = v.nom;
      break;
    }
  }

  // Ferie
  let isFerie = false;
  let ferieNom: string | undefined;
  for (const f of data.jours_feries) {
    if (f.date === ds) {
      isFerie = true;
      ferieNom = f.nom;
      break;
    }
  }

  // Deplacements
  const deplacements: { qui: string; destination: string }[] = [];
  for (const dep of data.deplacements) {
    if (inRange(ds, dep.debut, dep.fin)) {
      deplacements.push({ qui: dep.qui, destination: dep.destination });
    }
  }

  // Stages
  const stages: { enfant: string; activite: string }[] = [];
  for (const st of data.stages_enfants) {
    if (inRange(ds, st.debut, st.fin)) {
      for (const d of st.detail) {
        stages.push({ enfant: d.enfant, activite: d.activite });
      }
    }
  }

  // Voyages
  const voyages: { destination: string; participants: string[] }[] = [];
  for (const v of data.voyages_famille) {
    if (inRange(ds, v.debut, v.fin)) {
      voyages.push({ destination: v.destination, participants: v.participants });
    }
  }

  // Home Exchange
  const homeExchange: { logement: string; voyageur: string; url: string }[] = [];
  if (data.home_exchange) {
    for (const he of data.home_exchange) {
      if (inRange(ds, he.debut, he.fin)) {
        homeExchange.push({ logement: he.logement, voyageur: he.voyageur, url: he.url });
      }
    }
  }

  return { date: ds, garde, gardeMatin, gardeSoir, gardeNote, isVacances, vacancesNom, isFerie, ferieNom, deplacements, stages, voyages, homeExchange, isoWeek: week };
}

export function usePlanningData(year = 2026) {
  const [data, setData] = useState<PlanningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/data/planning-${year}.json?v=${Date.now()}`)
      .then((r) => {
        if (!r.ok) throw new Error("Erreur chargement planning");
        return r.json();
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [year]);

  return { data, loading, error };
}

// Couleurs de garde : variables CSS pour conserver la palette claire et adapter la palette sombre.
export const GARDE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  sebastien: { bg: "var(--garde-sebastien-bg)", text: "var(--garde-sebastien-text)", label: "Sébastien" },
  nathalie: { bg: "var(--garde-nathalie-bg)", text: "var(--garde-nathalie-text)", label: "Nathalie" },
  rosy_bernard: { bg: "var(--garde-rosy-bernard-bg)", text: "var(--garde-rosy-bernard-text)", label: "Rosy & Bernard" },
  famille_elargie: { bg: "var(--garde-famille-elargie-bg)", text: "var(--garde-famille-elargie-text)", label: "Famille élargie" },
  a_determiner: { bg: "var(--garde-a-determiner-bg)", text: "var(--garde-a-determiner-text)", label: "À déterminer" },
  partage: { bg: "var(--garde-partage-bg)", text: "var(--garde-partage-text)", label: "Jour d'échange" },
};

export const EVENT_COLORS = {
  deplacement: { bg: "#e0cffc", text: "#3C3489" },
  voyage: { bg: "#b5d4f4", text: "#0C447C" },
  stage: { bg: "#c0dd97", text: "#27500A" },
  festival: { bg: "#f5c4b3", text: "#712B13" },
  note: { bg: "#d3d1c7", text: "#2C2C2A" },
  home_exchange: { bg: "#fde68a", text: "#92400e" },
};
