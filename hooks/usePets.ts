import { supabase } from "@/lib/supabase";

export interface PetProfile {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  dob: string | null;
  weight: number | null;
  created_at?: string;
}

export interface PetMedicalLog {
  id: string;
  title: string;
  next_due_date: string;
  pet_profile: {
    name: string;
  } | null;
}

export interface PetActivityLog {
  id: string;
  pet_id: string;
  date: string;
  log_type: string;
  category: string;
  next_due_date: string | null;
  notes: string | null;
}

export function usePets() {
  const getProfiles = async () => {
    const { data, error } = await supabase
      .from('pet_profile')
      .select('*');
    
    if (error) throw error;
    return data as PetProfile[];
  };

  const getMedicalLogs = async () => {
    const { data, error } = await supabase
      .from('pet_medical_logs')
      .select('id, title, next_due_date, pet_profile(name)')
      .not('next_due_date', 'is', null);
    
    if (error) throw error;
    return data as unknown as PetMedicalLog[];
  };

  const getActivityLogs = async () => {
    const { data, error } = await supabase
      .from('pet_logs')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data as PetActivityLog[];
  };

  return {
    getProfiles,
    getMedicalLogs,
    getActivityLogs,
  };
}
