export interface LiquidityAccount {
  id?: string;
  account_name: string;
  type: string;
  balance?: number | string;
  account_no?: string;
  card_no?: string;
  card_pin?: string;
  card_cvv?: string;
  nb_user?: string;
  nb_pass?: string;
  nb_txn?: string;
  mb_pass?: string;
  mb_mpin?: string;
  mb_txn?: string;
  notes?: string;
  tags?: string[];
  created_at?: string;
}

export interface ExpenseTransaction {
  id: string;
  date: string;
  category: string;
  subcategory?: string;
  amount: number;
  type?: 'expense' | 'income' | 'transfer';
  source_account?: string;
  destination_account?: string;
  notes?: string;
  created_at?: string;
}

export interface FinanceAsset {
  id: string;
  asset_name: string;
  category: string;
  current_value: number;
  purchase_date?: string;
  notes?: string;
  created_at?: string;
}

export interface FinanceLiability {
  id: string;
  name: string;
  type: string;
  amount: number;
  interest_rate?: number;
  monthly_payment?: number;
  due_date?: string;
  notes?: string;
  created_at?: string;
}

export interface BudgetPlan {
  id: string;
  category: string;
  subcategory?: string;
  planned_amount: number;
  month: string; // YYYY-MM
  created_at?: string;
}

export interface HabitConfig {
  id: string;
  habit_name: string;
  group_name?: string;
  input_type?: 'binary' | 'numeric' | 'timer' | 'text';
  unit?: string;
  target_value?: number;
  frequency_type?: 'fixed' | 'weekly' | 'flexible' | 'interval';
  days_of_week?: number[];
  interval_count?: number;
  interval_unit?: string;
  interval_anchor?: string;
  flexible_target_count?: number;
  joker_days_limit?: number;
  is_active?: boolean;
}

export interface HabitData {
  id: string;
  date: string;
  habit: string;
  value: string | number;
  notes?: string;
  created_at?: string;
}

export interface TaskItem {
  id: string;
  task: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  is_high_priority?: boolean;
  is_today?: boolean;
  due_date?: string;
  completed_at?: string;
  created_at?: string;
  recurrence_type?: string;
}

export interface ActionTaskItem {
  id: string;
  task_name: string;
  completed: boolean;
  is_today?: boolean;
  is_high_priority?: boolean;
  due_date?: string;
  created_at?: string;
}

export interface WorkoutLogEntry {
  id: string;
  date: string;
  workout_day?: string;
  workout_name: string;
  set_no?: number;
  reps?: number;
  weight?: number;
  duration_minutes?: number;
  notes?: string;
  created_at?: string;
}

export interface SkillItem {
  id: string;
  name: string;
  category?: string;
  target_hours?: number;
  status?: string;
}

export interface SkillLogEntry {
  id: string;
  skill_id: string;
  date: string;
  duration_minutes: number;
  notes?: string;
  created_at?: string;
}

export interface VehicleConfig {
  id: string;
  vehicle_name: string;
  model?: string;
  year?: number;
  license_plate?: string;
}

export interface VehicleFuelLog {
  id: string;
  vehicle_id?: string;
  date: string;
  odometer: number;
  liters: number;
  price_per_liter: number;
  total_cost: number;
  full_tank?: boolean;
}

export interface PetProfile {
  id: string;
  name: string;
  species: string;
  breed?: string;
  birth_date?: string;
}

export interface PetLog {
  id: string;
  pet_id: string;
  date: string;
  log_type: string;
  notes?: string;
  cost?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category_id?: string;
  location_id?: string;
  quantity?: number;
  purchase_date?: string;
  purchase_price?: number;
  serial_number?: string;
  model_number?: string;
  warranty_expiry_date?: string;
  notes?: string;
}

export interface ActivityLog {
  id: string;
  date: string;
  activity: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  notes?: string;
  created_at?: string;
}
