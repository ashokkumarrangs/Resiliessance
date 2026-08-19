import { supabase } from "@/lib/supabase";

export async function fetchQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  fallbackLocalKey?: string,
  fallbackValue: T = [] as any
): Promise<T> {
  try {
    const { data, error } = await queryFn();
    if (error) {
      console.warn("Supabase query error:", error);
      throw error;
    }
    if (data !== null) return data;
    return fallbackValue;
  } catch (err) {
    if (fallbackLocalKey && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`resiliessance_${fallbackLocalKey}`);
        if (stored) return JSON.parse(stored);
      } catch (localErr) {
        console.error("Local storage error:", localErr);
      }
    }
    return fallbackValue;
  }
}

export async function mutateQuery<T>(
  mutateFn: () => Promise<{ data: T | null; error: any }>,
  localSyncKey?: string,
  localData?: any
): Promise<boolean> {
  if (localSyncKey && localData !== undefined && typeof window !== "undefined") {
    try {
      localStorage.setItem(`resiliessance_${localSyncKey}`, JSON.stringify(localData));
    } catch (e) {
      console.error("Local storage sync error:", e);
    }
  }

  try {
    const { error } = await mutateFn();
    if (error) {
      console.warn("Supabase mutation warning:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Supabase mutation exception:", err);
    return false;
  }
}
