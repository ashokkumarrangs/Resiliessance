import { supabase } from "@/lib/supabase";

export interface HabitConfig {
  id?: string;
  habit_name: string;
  frequency: string;
  unlogged_is_success: boolean;
  group_name: string | null;
  group_display_order: number | null;
  is_paused?: boolean;
  is_archived?: boolean;
  is_deleted?: boolean;
}

export interface HabitLog {
  id?: string;
  habit: string;
  status: string;
  date: string;
  value?: number;
  notes?: string;
}

export function useHabits() {
  const getActiveConfigs = async () => {
    const { data, error } = await supabase
      .from('habit_config')
      .select('habit_name, frequency, unlogged_is_success, group_name, group_display_order')
      .eq('is_paused', false)
      .eq('is_archived', false)
      .eq('is_deleted', false);
    
    if (error) throw error;
    return data as HabitConfig[];
  };

  const getLogsForDate = async (dateStr: string) => {
    const { data, error } = await supabase
      .from('habit_data')
      .select('habit, status')
      .eq('date', dateStr);
    
    if (error) throw error;
    return data as HabitLog[];
  };

  return {
    getActiveConfigs,
    getLogsForDate,
  };
}
