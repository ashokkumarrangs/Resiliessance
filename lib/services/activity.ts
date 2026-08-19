import { supabase } from "@/lib/supabase";
import { ActivityLog } from "@/lib/types";

export const activityService = {
  async getActivityLogs(dateStr?: string): Promise<ActivityLog[]> {
    let query = supabase.from("activity_logs").select("*").order("date", { ascending: false });
    if (dateStr) {
      query = query.eq("date", dateStr);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data;
  },

  async addActivityLog(activity: Omit<ActivityLog, "id">): Promise<ActivityLog | null> {
    const { data, error } = await supabase.from("activity_logs").insert([activity]).select().single();
    if (error || !data) return null;
    return data;
  },

  async deleteActivityLog(id: string): Promise<boolean> {
    const { error } = await supabase.from("activity_logs").delete().eq("id", id);
    return !error;
  },

  // Aggregated Day Summary Query (for activity-timeline/timeline and activity-timeline/day)
  async getFullDaySummary(dateStr: string) {
    const [
      expensesRes,
      habitsRes,
      eventLogRes,
      skillsRes,
      skillItemsRes,
      workoutRes,
      fuelRes,
      serviceRes,
      tasksRes,
      actionTasksRes,
      activityLogsRes
    ] = await Promise.all([
      supabase.from("history_expenses").select("*").eq("date", dateStr),
      supabase.from("habit_data").select("*").eq("date", dateStr),
      supabase.from("event_log").select("*").eq("date", dateStr),
      supabase.from("skill_logs").select("*").eq("date", dateStr),
      supabase.from("skill_items").select("id, name"),
      supabase.from("workout_log").select("*").eq("date", dateStr),
      supabase.from("vehicle_fuel_logs").select("*").eq("date", dateStr),
      supabase.from("vehicle_service_logs").select("*").eq("date", dateStr),
      supabase.from("tasks").select("*").eq("status", "Completed"),
      supabase.from("action_tasks").select("*").eq("completed", true),
      supabase.from("activity_logs").select("*").eq("date", dateStr)
    ]);

    return {
      expenses: expensesRes.data || [],
      habits: habitsRes.data || [],
      events: eventLogRes.data || [],
      skillLogs: skillsRes.data || [],
      skillItems: skillItemsRes.data || [],
      workouts: workoutRes.data || [],
      fuelLogs: fuelRes.data || [],
      serviceLogs: serviceRes.data || [],
      tasks: tasksRes.data || [],
      actionTasks: actionTasksRes.data || [],
      activityLogs: activityLogsRes.data || []
    };
  }
};
