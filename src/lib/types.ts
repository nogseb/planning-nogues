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
  { id: "2026-W22", label: "S22 — 25-31 mai", short: "S22" },
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
