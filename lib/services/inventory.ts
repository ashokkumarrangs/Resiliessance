import { supabase } from "@/lib/supabase";
import { InventoryItem } from "@/lib/types";

export const inventoryService = {
  async getItems(): Promise<InventoryItem[]> {
    const { data, error } = await supabase.from("inventory_items").select("*");
    if (error || !data) return [];
    return data;
  },

  async saveItem(item: Partial<InventoryItem>): Promise<boolean> {
    if (item.id) {
      const { error } = await supabase.from("inventory_items").update(item).eq("id", item.id);
      return !error;
    } else {
      const { error } = await supabase.from("inventory_items").insert([item]);
      return !error;
    }
  },

  async deleteItem(id: string): Promise<boolean> {
    const { error } = await supabase.from("inventory_items").delete().eq("id", id);
    return !error;
  },

  async getLocations() {
    const { data, error } = await supabase.from("inventory_locations").select("*");
    if (error || !data) return [];
    return data;
  }
};
