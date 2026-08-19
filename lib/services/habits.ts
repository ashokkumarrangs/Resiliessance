import { supabase } from "@/lib/supabase";
import { HabitConfig, HabitData } from "@/lib/types";

export const habitService = {
  async getConfigs(): Promise<HabitConfig[]> {
    const { data, error } = await supabase.from("habit_config").select("*");
    if (error || !data) return [];
    return data;
  },

  async saveConfig(config: Partial<HabitConfig>): Promise<boolean> {
    if (config.id) {
      const { error } = await supabase.from("habit_config").update(config).eq("id", config.id);
      return !error;
    } else {
      const { error } = await supabase.from("habit_config").insert([config]);
      return !error;
    }
  },

  async deleteConfig(id: string): Promise<boolean> {
    const { error } = await supabase.from("habit_config").delete().eq("id", id);
    return !error;
  },

  async getLogsForDate(dateStr: string): Promise<HabitData[]> {
    const { data, error } = await supabase.from("habit_data").select("*").eq("date", dateStr);
    if (error || !data) return [];
    return data;
  },

  async getLogsForRange(startDateStr: string, endDateStr: string): Promise<HabitData[]> {
    const { data, error } = await supabase
      .from("habit_data")
      .select("*")
      .gte("date", startDateStr)
      .lte("date", endDateStr);
    if (error || !data) return [];
    return data;
  },

  async logHabit(dateStr: string, habitName: string, value: string | number, notes?: string): Promise<boolean> {
    const { error } = await supabase.from("habit_data").upsert(
      { date: dateStr, habit: habitName, value: value.toString(), notes },
      { onConflict: "date, habit" }
    );
    return !error;
  },

  async deleteHabitLog(dateStr: string, habitName: string): Promise<boolean> {
    const { error } = await supabase.from("habit_data").delete().eq("date", dateStr).eq("habit", habitName);
    return !error;
  }
};
