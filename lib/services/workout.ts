import { supabase } from "@/lib/supabase";
import { WorkoutLogEntry } from "@/lib/types";

export const workoutService = {
  async getLogsForDate(dateStr: string): Promise<WorkoutLogEntry[]> {
    const { data, error } = await supabase.from("workout_log").select("*").eq("date", dateStr);
    if (error || !data) return [];
    return data;
  },

  async addLogEntry(entry: Omit<WorkoutLogEntry, "id">): Promise<WorkoutLogEntry | null> {
    const { data, error } = await supabase.from("workout_log").insert([entry]).select().single();
    if (error || !data) return null;
    return data;
  },

  async deleteLogEntry(id: string): Promise<boolean> {
    const { error } = await supabase.from("workout_log").delete().eq("id", id);
    return !error;
  },

  async getScheduledWorkouts(dateStr: string) {
    const { data, error } = await supabase
      .from("scheduled_workout")
      .select("*, workout_template(name)")
      .eq("scheduled_date", dateStr);
    if (error || !data) return [];
    return data;
  }
};
