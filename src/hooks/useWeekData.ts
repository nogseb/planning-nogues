import { useState, useEffect } from "react";
import type { WeekData } from "@/lib/types";

export function useWeekData(weekId: string = "2026-W17") {
  const [data, setData] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/data/${weekId}.json`)
      .then((res) => {
        if (!res.ok) throw new Error("Fichier non trouvé");
        return res.json();
      })
      .then((json: WeekData) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [weekId]);

  return { data, loading, error };
}
