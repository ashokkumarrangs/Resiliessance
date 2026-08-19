import { supabase } from "@/lib/supabase";
import { VehicleConfig, VehicleFuelLog } from "@/lib/types";

export const vehicleService = {
  async getVehicles(): Promise<VehicleConfig[]> {
    const { data, error } = await supabase.from("vehicle_config").select("*");
    if (error || !data) return [];
    return data;
  },

  async getFuelLogs(vehicleId?: string): Promise<VehicleFuelLog[]> {
    let query = supabase.from("vehicle_fuel_logs").select("*").order("date", { ascending: false });
    if (vehicleId) {
      query = query.eq("vehicle_id", vehicleId);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data;
  },

  async addFuelLog(log: Omit<VehicleFuelLog, "id">): Promise<VehicleFuelLog | null> {
    const { data, error } = await supabase.from("vehicle_fuel_logs").insert([log]).select().single();
    if (error || !data) return null;
    return data;
  },

  async getServiceLogs(vehicleId?: string) {
    let query = supabase.from("vehicle_service_logs").select("*").order("date", { ascending: false });
    if (vehicleId) {
      query = query.eq("vehicle_id", vehicleId);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data;
  }
};
