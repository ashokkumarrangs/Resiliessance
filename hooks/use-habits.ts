import { useState, useEffect, useCallback } from "react";
import { habitService } from "@/lib/services/habits";
import { HabitConfig, HabitData } from "@/lib/types";

export function useHabits(targetDate?: string) {
  const [configs, setConfigs] = useState<HabitConfig[]>([]);
  const [logs, setLogs] = useState<HabitData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const cfgData = await habitService.getConfigs();
      setConfigs(cfgData);

      if (targetDate) {
        const logData = await habitService.getLogsForDate(targetDate);
        setLogs(logData);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch habit data");
    } finally {
      setIsLoading(false);
    }
  }, [targetDate]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const logHabit = async (habitName: string, value: string | number, notes?: string) => {
    const date = targetDate || new Date().toISOString().split("T")[0];
    const success = await habitService.logHabit(date, habitName, value, notes);
    if (success) {
      await fetchHabits();
    }
    return success;
  };

  return {
    configs,
    logs,
    isLoading,
    error,
    logHabit,
    refetch: fetchHabits
  };
}
