import { supabase } from "@/lib/supabase";
import { TaskItem, ActionTaskItem } from "@/lib/types";

export const taskService = {
  // General Tasks
  async getTasks(): Promise<any[]> {
    const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    if (error || !data) return [];
    return data;
  },

  async saveTask(task: Partial<any>): Promise<boolean> {
    if (task.id) {
      const { error } = await supabase.from("tasks").update(task).eq("id", task.id);
      return !error;
    } else {
      const { error } = await supabase.from("tasks").insert([task]);
      return !error;
    }
  },

  async updateTaskFields(id: string, updates: Record<string, any>): Promise<boolean> {
    const { error } = await supabase.from("tasks").update(updates).eq("id", id);
    return !error;
  },

  async deleteTask(id: string): Promise<boolean> {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    return !error;
  },

  async toggleTaskStatus(id: string, currentStatus: string): Promise<boolean> {
    const nextStatus = currentStatus === "Completed" ? "Pending" : "Completed";
    const completedAt = nextStatus === "Completed" ? new Date().toISOString() : null;
    const { error } = await supabase.from("tasks").update({ status: nextStatus, completed_at: completedAt }).eq("id", id);
    return !error;
  },

  // Action Tasks / SquareShift
  async getActionTasks(): Promise<ActionTaskItem[]> {
    const { data, error } = await supabase.from("action_tasks").select("*").order("created_at", { ascending: false });
    if (error || !data) return [];
    return data;
  },

  async saveActionTask(task: Partial<ActionTaskItem>): Promise<boolean> {
    if (task.id) {
      const { error } = await supabase.from("action_tasks").update(task).eq("id", task.id);
      return !error;
    } else {
      const { error } = await supabase.from("action_tasks").insert([task]);
      return !error;
    }
  },

  async deleteActionTask(id: string): Promise<boolean> {
    const { error } = await supabase.from("action_tasks").delete().eq("id", id);
    return !error;
  },

  async toggleActionTaskCompleted(id: string, currentCompleted: boolean): Promise<boolean> {
    const { error } = await supabase.from("action_tasks").update({ completed: !currentCompleted }).eq("id", id);
    return !error;
  }
};
