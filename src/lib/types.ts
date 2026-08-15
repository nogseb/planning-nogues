export interface HomeExchange {
  logement: string;
  debut: string;
  fin: string;
  voyageur: string;
  url: string;
}

export interface Activity {
  titre: string;
  description: string;
  type: string;
  lieu: string;
  latitude: number;
  longitude: number;
  date: string;
  horaire: string;
  duree: string;
  age_min: number;
  creneau: string;
  priorite: string;
  gratuit: boolean;
  tarif: string;
  url: string;
  distance_km: number;
  transport: string;
  distance_temps: string;
  compatible_rituel: string;
  note_papa: string;
}

export interface JeuMercredi {
  nom: string;
  editeur: string;
  age: string;
  duree: string;
  joueurs?: string;
  pourquoi: string;
}

export interface WeekData {
  semaine: string;
  date_debut: string;
  date_fin: string;
  semaine_garde: boolean;
  garde?: string;
  contexte_semaine?: string;
  genere_le: string;
  meteo_prevue: Record<string, string>;
  alertes?: string[];
  suggestion_jeu_mercredi: JeuMercredi;
  activites: Activity[];
}

/** Available weeks for the week selector */
export const AVAILABLE_WEEKS = [
  { id: "2026-W17", label: "S17 — 20-26 avril", short: "S17" },
  { id: "2026-W19", label: "S19 — 4-10 mai", short: "S19" },
  { id: "2026-W21", label: "S21 — 18-24 mai", short: "S21" },
  { id: "2026-W23", label: "S23 — 1-7 juin", short: "S23" },
  { id: "2026-W24", label: "S24 — 8-14 juin", short: "S24" },
  { id: "2026-W25", label: "S25 — 15-21 juin", short: "S25" },
  { id: "2026-W26", label: "S26 — 22-28 juin", short: "S26" },
  { id: "2026-W27", label: "S27 — 29 juin-5 juil.", short: "S27" },
  { id: "2026-W29", label: "S29 — 13-19 juil.", short: "S29" },
  { id: "2026-W32", label: "S32 — 3-9 août", short: "S32" },
  { id: "2026-W33", label: "S33 — 10-16 août", short: "S33" },
  { id: "2026-W36", label: "S36 — 31 août-6 sept.", short: "S36" },
  { id: "2026-W37", label: "S37 — 7-13 sept.", short: "S37" },
  { id: "2026-W38", label: "S38 — 14-20 sept.", short: "S38" },
  { id: "2026-W39", label: "S39 — 21-27 sept.", short: "S39" },
  { id: "2026-W40", label: "S40 — 28 sept.-4 oct.", short: "S40" },
  { id: "2026-W41", label: "S41 — 5-11 oct.", short: "S41" },
  { id: "2026-W42", label: "S42 — 12-18 oct.", short: "S42" },
  { id: "2026-W43", label: "S43 — 19-25 oct.", short: "S43" },
  { id: "2026-W44", label: "S44 — 26 oct.-1 nov.", short: "S44" },
  { id: "2026-W45", label: "S45 — 2-8 nov.", short: "S45" },
  { id: "2026-W46", label: "S46 — 9-15 nov.", short: "S46" },
  { id: "2026-W47", label: "S47 — 16-22 nov.", short: "S47" },
  { id: "2026-W48", label: "S48 — 23-29 nov.", short: "S48" },
  { id: "2026-W49", label: "S49 — 30 nov.-6 déc.", short: "S49" },
  { id: "2026-W50", label: "S50 — 7-13 déc.", short: "S50" },
  { id: "2026-W51", label: "S51 — 14-20 déc.", short: "S51" },
  { id: "2026-W52", label: "S52 — 21-27 déc.", short: "S52" },
];

export const TYPE_COLORS: Record<string, string> = {
  nature: "#2d9d5f",
  culture: "#7c3aed",
  spectacle: "#ea6c20",
  sport: "#0891b2",
  atelier: "#e11d48",
  evenement: "#db2777",
  gastronomie: "#ca8a04",
};

export const TYPE_BG_LIGHT: Record<string, string> = {
  nature: "rgba(45,157,95,0.08)",
  culture: "rgba(124,58,237,0.08)",
  spectacle: "rgba(234,108,32,0.08)",
  sport: "rgba(8,145,178,0.08)",
  atelier: "rgba(225,29,72,0.08)",
  evenement: "rgba(219,39,119,0.08)",
  gastronomie: "rgba(202,138,4,0.08)",
};

export const TYPE_LABELS: Record<string, string> = {
  nature: "Nature",
  culture: "Culture",
  spectacle: "Spectacle",
  sport: "Sport",
  atelier: "Atelier",
  evenement: "Événement",
  gastronomie: "Gastronomie",
};

export const PRIORITE_LABELS: Record<string, string> = {
  incontournable: "Incontournable",
  recommande: "Recommandé",
  optionnel: "Optionnel",
};

export const CRENEAU_LABELS: Record<string, string> = {
  "semaine-soir": "Semaine soir",
  "samedi-matin": "Samedi matin",
  "samedi-aprem": "Samedi aprem",
  dimanche: "Dimanche",
  mercredi: "Mercredi",
};

export const RITUEL_ICONS: Record<string, string> = {
  "rando-samedi": "mountain",
  "cuisine-dimanche": "chef-hat",
  "jeu-mercredi": "dice-5",
};

export const JOURS_SEMAINE = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
];

export const GUILHEMERY = { lat: 43.59833, lng: 1.47278 };
