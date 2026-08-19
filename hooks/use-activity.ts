import { useState, useEffect, useCallback } from "react";
import { activityService } from "@/lib/services/activity";

export function useActivity(dateStr: string) {
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!dateStr) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await activityService.getFullDaySummary(dateStr);
      setSummary(data);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch timeline summary");
    } finally {
      setIsLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    isLoading,
    error,
    refetch: fetchSummary
  };
}
