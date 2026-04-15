import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const JOUR_NAMES = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

const JOUR_NAMES_CAP = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

const MOIS_NAMES = [
  "janvier",
  "fevrier",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "aout",
  "septembre",
  "octobre",
  "novembre",
  "decembre",
];

export function formatDateFr(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${JOUR_NAMES_CAP[d.getDay()]} ${d.getDate()} ${MOIS_NAMES[d.getMonth()]}`;
}

export function getJourName(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return JOUR_NAMES[d.getDay()];
}

export function getJourNameCap(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return JOUR_NAMES_CAP[d.getDay()];
}

export function getDatesForWeek(dateDebut: string): string[] {
  const start = new Date(dateDebut + "T00:00:00");
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

export function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00");
  return d.getDay() === 0 || d.getDay() === 6;
}

export function isOddWeek(weekStr: string): boolean {
  const num = parseInt(weekStr.split("W")[1]);
  return num % 2 === 1;
}
