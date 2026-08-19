import { supabase } from "@/lib/supabase";
import { PetProfile, PetLog } from "@/lib/types";

export const petService = {
  async getPets(): Promise<PetProfile[]> {
    const { data, error } = await supabase.from("pet_profile").select("*");
    if (error || !data) return [];
    return data;
  },

  async savePet(pet: Partial<PetProfile>): Promise<boolean> {
    if (pet.id) {
      const { error } = await supabase.from("pet_profile").update(pet).eq("id", pet.id);
      return !error;
    } else {
      const { error } = await supabase.from("pet_profile").insert([pet]);
      return !error;
    }
  },

  async deletePet(id: string): Promise<boolean> {
    const { error } = await supabase.from("pet_profile").delete().eq("id", id);
    return !error;
  },

  async getLogs(petId?: string): Promise<PetLog[]> {
    let query = supabase.from("pet_logs").select("*").order("date", { ascending: false });
    if (petId) {
      query = query.eq("pet_id", petId);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data;
  },

  async addLog(log: Omit<PetLog, "id">): Promise<PetLog | null> {
    const { data, error } = await supabase.from("pet_logs").insert([log]).select().single();
    if (error || !data) return null;
    return data;
  }
};
