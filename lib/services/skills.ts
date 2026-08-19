import { supabase } from "@/lib/supabase";
import { SkillItem, SkillLogEntry } from "@/lib/types";

export const skillService = {
  async getSkills(): Promise<SkillItem[]> {
    const { data, error } = await supabase.from("skill_items").select("*");
    if (error || !data) return [];
    return data;
  },

  async saveSkill(skill: Partial<SkillItem>): Promise<boolean> {
    if (skill.id) {
      const { error } = await supabase.from("skill_items").update(skill).eq("id", skill.id);
      return !error;
    } else {
      const { error } = await supabase.from("skill_items").insert([skill]);
      return !error;
    }
  },

  async deleteSkill(id: string): Promise<boolean> {
    const { error } = await supabase.from("skill_items").delete().eq("id", id);
    return !error;
  },

  async getSkillLogs(dateStr?: string): Promise<SkillLogEntry[]> {
    let query = supabase.from("skill_logs").select("*").order("date", { ascending: false });
    if (dateStr) {
      query = query.eq("date", dateStr);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data;
  },

  async addSkillLog(log: Omit<SkillLogEntry, "id">): Promise<SkillLogEntry | null> {
    const { data, error } = await supabase.from("skill_logs").insert([log]).select().single();
    if (error || !data) return null;
    return data;
  },

  async deleteSkillLog(id: string): Promise<boolean> {
    const { error } = await supabase.from("skill_logs").delete().eq("id", id);
    return !error;
  }
};
