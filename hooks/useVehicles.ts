import { supabase } from "@/lib/supabase";

export interface VehicleConfig {
  id: string;
  vehicle_name: string;
  vehicle_type: string;
  insurance_expiry: string | null;
  next_service_date: string | null;
  initial_odometer: number | null;
}

export interface VehicleFuelLog {
  vehicle_id: string;
  odometer: number;
  liters: number;
  amount: number;
  date: string;
}

export interface VehicleServiceLog {
  vehicle_id: string;
  amount: number;
  date: string;
}

export function useVehicles() {
  const getVehicles = async () => {
    const { data, error } = await supabase
      .from('vehicle_config')
      .select('id, vehicle_name, vehicle_type, insurance_expiry, next_service_date, initial_odometer');
    
    if (error) throw error;
    return data as VehicleConfig[];
  };

  const getFuelLogs = async (vehicleIds: string[]) => {
    const { data, error } = await supabase
      .from('vehicle_fuel_logs')
      .select('vehicle_id, odometer, liters, amount, date')
      .in('vehicle_id', vehicleIds)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data as VehicleFuelLog[];
  };

  const getServiceLogs = async (vehicleIds: string[]) => {
    const { data, error } = await supabase
      .from('vehicle_service_logs')
      .select('vehicle_id, amount, date')
      .in('vehicle_id', vehicleIds)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data as VehicleServiceLog[];
  };

  return {
    getVehicles,
    getFuelLogs,
    getServiceLogs,
  };
}
