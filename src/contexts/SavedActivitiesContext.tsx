/**
 * Liste personnelle « Mes sorties » : stockage local, sans backend.
 * Les choix restent disponibles uniquement dans le navigateur de l’utilisateur.
 */
import { createContext, useCallback, useContext, useState } from "react";
import type { Activity } from "@/lib/types";

const STORAGE_KEY = "helia-noe-mes-sorties-v1";

interface SavedActivitiesContextValue {
  savedActivities: Activity[];
  isSaved: (activity: Activity) => boolean;
  toggleActivity: (activity: Activity) => void;
  removeActivity: (activity: Activity) => void;
  clearActivities: () => void;
}

const SavedActivitiesContext = createContext<SavedActivitiesContextValue | null>(null);

function getActivityKey(activity: Activity) {
  return `${activity.date}::${activity.titre}`;
}

function getStoredActivities(): Activity[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function SavedActivitiesProvider({ children }: { children: React.ReactNode }) {
  const [savedActivities, setSavedActivities] = useState<Activity[]>(getStoredActivities);

  const persist = useCallback((next: Activity[]) => {
    setSavedActivities(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const isSaved = useCallback(
    (activity: Activity) => savedActivities.some((item) => getActivityKey(item) === getActivityKey(activity)),
    [savedActivities],
  );

  const toggleActivity = useCallback((activity: Activity) => {
    setSavedActivities((previous) => {
      const exists = previous.some((item) => getActivityKey(item) === getActivityKey(activity));
      const next = exists
        ? previous.filter((item) => getActivityKey(item) !== getActivityKey(activity))
        : [...previous, activity];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeActivity = useCallback((activity: Activity) => {
    persist(savedActivities.filter((item) => getActivityKey(item) !== getActivityKey(activity)));
  }, [persist, savedActivities]);

  const clearActivities = useCallback(() => persist([]), [persist]);

  return (
    <SavedActivitiesContext.Provider value={{ savedActivities, isSaved, toggleActivity, removeActivity, clearActivities }}>
      {children}
    </SavedActivitiesContext.Provider>
  );
}

export function useSavedActivities() {
  const context = useContext(SavedActivitiesContext);
  if (!context) throw new Error("useSavedActivities doit être utilisé dans SavedActivitiesProvider");
  return context;
}
