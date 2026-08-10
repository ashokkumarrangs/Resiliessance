import { supabase } from "@/lib/supabase";

export interface DietTarget {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  water_goal: number;
}

export interface FoodLibraryItem {
  id: string;
  name: string;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  is_preset: boolean;
}

export interface DietLogEntry {
  id: string;
  date: string; // yyyy-MM-dd
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'supplement';
  food_name: string;
  serving_size: number;
  serving_unit: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  is_supplement: boolean;
}

export interface WaterLog {
  date: string;
  amount_ml: number;
}

export interface DietWeightLog {
  id: string;
  date: string; // yyyy-MM-dd
  weight: number;
  notes: string;
}

export interface MealComboItem {
  food_id: string;
  quantity: number;
}

export interface MealCombo {
  id: string;
  name: string;
  items: MealComboItem[];
}

export interface BiometricDefinition {
  id: string;
  name: string;
  unit: string;
}

export interface BiometricLog {
  id: string;
  date: string;
  metric_type: string; // references BiometricDefinition.id
  value: number;
  notes: string;
}

export interface BiometricTarget {
  metric_type: string;
  target_value: number;
}

// Pre-populated default foods
const BUILT_IN_FOODS: FoodLibraryItem[] = [
  { id: "preset-egg", name: "Whole Egg (Large)", serving_size: 1, serving_unit: "egg", calories: 70, protein: 6, carbs: 0.6, fat: 5, fiber: 0, is_preset: true },
  { id: "preset-chicken", name: "Chicken Breast (Cooked)", serving_size: 100, serving_unit: "g", calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, is_preset: true },
  { id: "preset-rice", name: "White Rice (Cooked)", serving_size: 150, serving_unit: "g", calories: 200, protein: 4, carbs: 44, fat: 0.4, fiber: 1, is_preset: true },
  { id: "preset-oats", name: "Oatmeal (Dry)", serving_size: 50, serving_unit: "g", calories: 190, protein: 7, carbs: 32, fat: 3, fiber: 5, is_preset: true },
  { id: "preset-whey", name: "Whey Protein (Scoop)", serving_size: 1, serving_unit: "scoop", calories: 120, protein: 24, carbs: 3, fat: 1.5, fiber: 0, is_preset: true },
  { id: "preset-banana", name: "Banana (Medium)", serving_size: 1, serving_unit: "banana", calories: 105, protein: 1.3, carbs: 27, fat: 0.3, fiber: 3, is_preset: true },
  { id: "preset-peanut-butter", name: "Peanut Butter", serving_size: 32, serving_unit: "g", calories: 190, protein: 8, carbs: 6, fat: 16, fiber: 2, is_preset: true },
  { id: "preset-almonds", name: "Almonds", serving_size: 30, serving_unit: "g", calories: 170, protein: 6, carbs: 6, fat: 15, fiber: 3.5, is_preset: true },
  { id: "preset-milk", name: "Whole Milk", serving_size: 240, serving_unit: "ml", calories: 150, protein: 8, carbs: 12, fat: 8, fiber: 0, is_preset: true },
  { id: "preset-greek-yogurt", name: "Greek Yogurt (Non-fat)", serving_size: 150, serving_unit: "g", calories: 90, protein: 15, carbs: 5, fat: 0, fiber: 0, is_preset: true },
  { id: "preset-apple", name: "Apple (Medium)", serving_size: 1, serving_unit: "apple", calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4, is_preset: true },
  { id: "preset-salmon", name: "Salmon (Cooked)", serving_size: 100, serving_unit: "g", calories: 206, protein: 22, carbs: 0, fat: 12, fiber: 0, is_preset: true }
];

const DEFAULT_TARGET: DietTarget = {
  calories: 2000,
  protein: 130,
  carbs: 220,
  fat: 65,
  fiber: 25,
  water_goal: 3000
};

// Storage helper functions
const getLocal = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const val = localStorage.getItem(`resiliessance_diet_${key}`);
    if (!val) return fallback;
    const parsed = JSON.parse(val);
    if (Array.isArray(fallback)) {
      return (Array.isArray(parsed) ? parsed : fallback) as T;
    }
    return parsed;
  } catch {
    return fallback;
  }
};

const setLocal = <T>(key: string, value: T): void => {
  if (typeof window === "undefined") return;
  try {
    const fullKey = `resiliessance_diet_${key}`;
    const jsonVal = JSON.stringify(value);
    localStorage.setItem(fullKey, jsonVal);
    window.dispatchEvent(new StorageEvent("storage", { key: fullKey, newValue: jsonVal }));
  } catch (e) {
    console.error("Local storage error:", e);
  }
};

export const dietService = {
  // ─── Targets ───────────────────────────────────────────────────────────────
  async getTarget(): Promise<DietTarget> {
    try {
      const { data, error } = await supabase
        .from("diet_targets")
        .select("*")
        .eq("id", "default")
        .single();

      if (error || !data) throw error || new Error("No data");
      return {
        calories: Number(data.calories),
        protein: Number(data.protein),
        carbs: Number(data.carbs),
        fat: Number(data.fat),
        fiber: Number(data.fiber),
        water_goal: Number(data.water_goal)
      };
    } catch {
      // Fallback
      return getLocal<DietTarget>("target", DEFAULT_TARGET);
    }
  },

  async saveTarget(target: DietTarget): Promise<DietTarget> {
    setLocal("target", target);
    try {
      const payload = {
        id: "default",
        calories: target.calories,
        protein: target.protein,
        carbs: target.carbs,
        fat: target.fat,
        fiber: target.fiber,
        water_goal: target.water_goal,
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase
        .from("diet_targets")
        .upsert(payload, { onConflict: "id" });
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase save target failed, using local storage fallback", e);
    }
    return target;
  },

  async getWorkoutBurnForDate(dateStr: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from("workout_log")
        .select("weight, reps, duration_minutes")
        .eq("date", dateStr);
      if (error || !data) return 0;
      const totalVol = data.reduce((acc, curr) => acc + (Number(curr.weight) || 0) * (Number(curr.reps) || 0), 0);
      const totalMins = data.reduce((acc, curr) => acc + (Number(curr.duration_minutes) || 0), 0);
      return Math.round(totalMins * 5 + totalVol * 0.02);
    } catch {
      return 0;
    }
  },

  // ─── Food Preset Library ──────────────────────────────────────────────────
  async getFoodLibrary(): Promise<FoodLibraryItem[]> {
    try {
      const { data, error } = await supabase
        .from("diet_food_library")
        .select("*");
      
      if (error) throw error;
      const dbItems = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        serving_size: Number(item.serving_size),
        serving_unit: item.serving_unit,
        calories: Number(item.calories),
        protein: Number(item.protein),
        carbs: Number(item.carbs),
        fat: Number(item.fat),
        fiber: Number(item.fiber),
        is_preset: Boolean(item.is_preset)
      }));

      const presetsMap = new Map<string, FoodLibraryItem>();
      dbItems.forEach(f => presetsMap.set(f.id, f));
      return Array.from(presetsMap.values());
    } catch {
      // Fallback to local storage for custom items
      const customItems = getLocal<FoodLibraryItem[]>("food_library_custom", []);
      return customItems;
    }
  },

  async addCustomFood(food: Omit<FoodLibraryItem, "id" | "is_preset">): Promise<FoodLibraryItem> {
    const newItem: FoodLibraryItem = {
      ...food,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      is_preset: false
    };

    // Save to local storage custom items list first
    const customItems = getLocal<FoodLibraryItem[]>("food_library_custom", []);
    customItems.push(newItem);
    setLocal("food_library_custom", customItems);

    try {
      const { error } = await supabase
        .from("diet_food_library")
        .insert({
          id: newItem.id,
          name: newItem.name,
          serving_size: newItem.serving_size,
          serving_unit: newItem.serving_unit,
          calories: newItem.calories,
          protein: newItem.protein,
          carbs: newItem.carbs,
          fat: newItem.fat,
          fiber: newItem.fiber,
          is_preset: newItem.is_preset
        });
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase save custom food failed, using local storage fallback", e);
    }

    return newItem;
  },

  async deleteCustomFood(id: string): Promise<boolean> {
    // Delete from local storage first
    const customItems = getLocal<FoodLibraryItem[]>("food_library_custom", []);
    const filtered = customItems.filter(f => f.id !== id);
    setLocal("food_library_custom", filtered);

    try {
      const { error } = await supabase
        .from("diet_food_library")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return true;
    } catch {
      return true;
    }
  },

  // ─── Daily Logs (Food / Supplements) ──────────────────────────────────────
  async getLogsForDate(dateStr: string): Promise<DietLogEntry[]> {
    try {
      const { data, error } = await supabase
        .from("diet_logs")
        .select("*")
        .eq("date", dateStr);
      
      if (error) throw error;
      return (data || []).map((item: any) => ({
        id: item.id,
        date: item.date,
        meal_type: item.meal_type as any,
        food_name: item.food_name,
        serving_size: Number(item.serving_size),
        serving_unit: item.serving_unit,
        quantity: Number(item.quantity),
        calories: Number(item.calories),
        protein: Number(item.protein),
        carbs: Number(item.carbs),
        fat: Number(item.fat),
        fiber: Number(item.fiber),
        is_supplement: Boolean(item.is_supplement)
      }));
    } catch {
      // Fallback
      const allLogs = getLocal<DietLogEntry[]>("logs", []);
      return allLogs.filter(log => log.date === dateStr);
    }
  },

  async getLogsForDateRange(startDateStr: string, endDateStr: string): Promise<DietLogEntry[]> {
    try {
      const { data, error } = await supabase
        .from("diet_logs")
        .select("*")
        .gte("date", startDateStr)
        .lte("date", endDateStr);
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        id: item.id,
        date: item.date,
        meal_type: item.meal_type as any,
        food_name: item.food_name,
        serving_size: Number(item.serving_size),
        serving_unit: item.serving_unit,
        quantity: Number(item.quantity),
        calories: Number(item.calories),
        protein: Number(item.protein),
        carbs: Number(item.carbs),
        fat: Number(item.fat),
        fiber: Number(item.fiber),
        is_supplement: Boolean(item.is_supplement)
      }));
    } catch {
      const allLogs = getLocal<DietLogEntry[]>("logs", []);
      return allLogs.filter(l => l.date >= startDateStr && l.date <= endDateStr);
    }
  },

  async addLogEntry(entry: Omit<DietLogEntry, "id">): Promise<DietLogEntry> {
    const newEntry: DietLogEntry = {
      ...entry,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11)
    };

    // Save locally
    const allLogs = getLocal<DietLogEntry[]>("logs", []);
    allLogs.push(newEntry);
    setLocal("logs", allLogs);

    try {
      const { error } = await supabase
        .from("diet_logs")
        .insert({
          id: newEntry.id,
          date: newEntry.date,
          meal_type: newEntry.meal_type,
          food_name: newEntry.food_name,
          serving_size: newEntry.serving_size,
          serving_unit: newEntry.serving_unit,
          quantity: newEntry.quantity,
          calories: newEntry.calories,
          protein: newEntry.protein,
          carbs: newEntry.carbs,
          fat: newEntry.fat,
          fiber: newEntry.fiber,
          is_supplement: newEntry.is_supplement
        });
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase add log failed, using local storage fallback", e);
    }

    return newEntry;
  },

  async deleteLogEntry(id: string): Promise<boolean> {
    // Delete locally
    const allLogs = getLocal<DietLogEntry[]>("logs", []);
    const filtered = allLogs.filter(l => l.id !== id);
    setLocal("logs", filtered);

    try {
      const { error } = await supabase
        .from("diet_logs")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return true;
    } catch {
      return true;
    }
  },

  // ─── Water Logs ────────────────────────────────────────────────────────────
  async getWaterLogForDate(dateStr: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from("diet_water_logs")
        .select("amount_ml")
        .eq("date", dateStr)
        .single();
      
      if (error || !data) throw error || new Error("No data");
      return Number(data.amount_ml);
    } catch {
      const waterLogs = getLocal<Record<string, number>>("water_logs", {});
      return waterLogs[dateStr] || 0;
    }
  },

  async saveWaterLog(dateStr: string, amountMl: number): Promise<number> {
    // Save locally
    const waterLogs = getLocal<Record<string, number>>("water_logs", {});
    waterLogs[dateStr] = amountMl;
    setLocal("water_logs", waterLogs);

    try {
      const { error } = await supabase
        .from("diet_water_logs")
        .upsert({
          date: dateStr,
          amount_ml: amountMl,
          created_at: new Date().toISOString()
        }, { onConflict: "date" });
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase save water log failed, using local storage fallback", e);
    }

    return amountMl;
  },

  // ─── Historical Reports Data ───────────────────────────────────────────────
  async getReportsData(daysLimit: number = 30): Promise<{
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    water: number;
  }[]> {
    const dates: string[] = [];
    const today = new Date();
    for (let i = daysLimit - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      dates.push(`${yyyy}-${mm}-${dd}`);
    }

    try {
      // Try to load from Supabase for all dates
      const { data: logsData, error: logsErr } = await supabase
        .from("diet_logs")
        .select("*")
        .in("date", dates);
      
      const { data: waterData, error: waterErr } = await supabase
        .from("diet_water_logs")
        .select("*")
        .in("date", dates);

      if (logsErr || waterErr) throw new Error("Supabase error");

      const logsByDate = (logsData || []).reduce((acc: any, item: any) => {
        if (!acc[item.date]) acc[item.date] = [];
        acc[item.date].push(item);
        return acc;
      }, {});

      const waterByDate = (waterData || []).reduce((acc: any, item: any) => {
        acc[item.date] = Number(item.amount_ml);
        return acc;
      }, {});

      return dates.map(dateStr => {
        const dayLogs = logsByDate[dateStr] || [];
        const cal = dayLogs.reduce((sum: number, l: any) => sum + (Number(l.calories) * Number(l.quantity)), 0);
        const prot = dayLogs.reduce((sum: number, l: any) => sum + (Number(l.protein) * Number(l.quantity)), 0);
        const carb = dayLogs.reduce((sum: number, l: any) => sum + (Number(l.carbs) * Number(l.quantity)), 0);
        const fats = dayLogs.reduce((sum: number, l: any) => sum + (Number(l.fat) * Number(l.quantity)), 0);
        const fib = dayLogs.reduce((sum: number, l: any) => sum + (Number(l.fiber) * Number(l.quantity)), 0);
        const wat = waterByDate[dateStr] || 0;

        return {
          date: dateStr,
          calories: Math.round(cal),
          protein: Math.round(prot * 10) / 10,
          carbs: Math.round(carb * 10) / 10,
          fat: Math.round(fats * 10) / 10,
          fiber: Math.round(fib * 10) / 10,
          water: wat
        };
      });
    } catch {
      // Local storage fallback
      const allLogs = getLocal<DietLogEntry[]>("logs", []);
      const waterLogs = getLocal<Record<string, number>>("water_logs", {});

      return dates.map(dateStr => {
        const dayLogs = allLogs.filter(l => l.date === dateStr);
        const cal = dayLogs.reduce((sum, l) => sum + (l.calories * l.quantity), 0);
        const prot = dayLogs.reduce((sum, l) => sum + (l.protein * l.quantity), 0);
        const carb = dayLogs.reduce((sum, l) => sum + (l.carbs * l.quantity), 0);
        const fats = dayLogs.reduce((sum, l) => sum + (l.fat * l.quantity), 0);
        const fib = dayLogs.reduce((sum, l) => sum + (l.fiber * l.quantity), 0);
        const wat = waterLogs[dateStr] || 0;

        return {
          date: dateStr,
          calories: Math.round(cal),
          protein: Math.round(prot * 10) / 10,
          carbs: Math.round(carb * 10) / 10,
          fat: Math.round(fats * 10) / 10,
          fiber: Math.round(fib * 10) / 10,
          water: wat
        };
      });
    }
  },

  // ─── Weight Tracker (Compatibility Wrappers) ──────────────────────────────
  async getWeightLogs(): Promise<DietWeightLog[]> {
    try {
      const allLogs = await this.getBiometricsLogs();
      return allLogs
        .filter(l => l.metric_type === "weight")
        .map(l => ({ id: l.id, date: l.date, weight: l.value, notes: l.notes }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch {
      return [];
    }
  },

  async addWeightLog(dateStr: string, weightNum: number, notesStr: string): Promise<DietWeightLog> {
    const saved = await this.saveBiometricLog("weight", weightNum, dateStr, notesStr);
    return {
      id: saved.id,
      date: saved.date,
      weight: saved.value,
      notes: saved.notes
    };
  },

  async deleteWeightLog(id: string): Promise<boolean> {
    return this.deleteBiometricLog(id);
  },

  async getWeightGoal(): Promise<number> {
    try {
      const targets = await this.getBiometricTargets();
      const wt = targets.find(t => t.metric_type === "weight");
      return wt ? wt.target_value : 75;
    } catch {
      return 75;
    }
  },

  async saveWeightGoal(weightGoalVal: number): Promise<number> {
    await this.saveBiometricTarget("weight", weightGoalVal);
    return weightGoalVal;
  },

  // ─── Custom Meal Combos / Templates ────────────────────────────────────────
  async getCombos(): Promise<MealCombo[]> {
    try {
      const { data, error } = await supabase
        .from("diet_combos")
        .select("*");
      if (error) throw error;
      return (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        items: typeof item.items === 'string' ? JSON.parse(item.items) : item.items
      }));
    } catch {
      return getLocal<MealCombo[]>("combos", []);
    }
  },

  async addCombo(nameStr: string, itemsList: MealComboItem[]): Promise<MealCombo> {
    const newCombo: MealCombo = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      name: nameStr,
      items: itemsList
    };

    const combosList = getLocal<MealCombo[]>("combos", []);
    combosList.push(newCombo);
    setLocal("combos", combosList);

    try {
      const { error } = await supabase
        .from("diet_combos")
        .insert({
          id: newCombo.id,
          name: newCombo.name,
          items: JSON.stringify(newCombo.items)
        });
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase add combo failed, using local storage fallback", e);
    }
    return newCombo;
  },

  async deleteCombo(id: string): Promise<boolean> {
    const combosList = getLocal<MealCombo[]>("combos", []);
    const filtered = combosList.filter(c => c.id !== id);
    setLocal("combos", filtered);

    try {
      const { error } = await supabase
        .from("diet_combos")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return true;
    } catch {
      return true;
    }
  },

  // ─── Dynamic Biometrics & Body Tracking ────────────────────────────────────
  async getBiometricDefinitions(): Promise<BiometricDefinition[]> {
    try {
      const { data, error } = await supabase
        .from("biometrics_definitions")
        .select("*");
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        unit: item.unit
      }));
    } catch {
      return getLocal<BiometricDefinition[]>("biometrics_definitions_custom", []);
    }
  },

  async addBiometricDefinition(nameStr: string, unitStr: string): Promise<BiometricDefinition> {
    const slug = nameStr.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_+|_+$)/g, "");
    const id = (slug === "body_weight" || slug === "weight")
      ? "weight"
      : (slug || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11)));
    
    const newDef: BiometricDefinition = {
      id,
      name: nameStr,
      unit: unitStr
    };

    const customDefs = getLocal<BiometricDefinition[]>("biometrics_definitions_custom", []);
    customDefs.push(newDef);
    setLocal("biometrics_definitions_custom", customDefs);

    try {
      const { error } = await supabase
        .from("biometrics_definitions")
        .insert({
          id: newDef.id,
          name: newDef.name,
          unit: newDef.unit
        });
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase add biometric def failed, fallback used", e);
    }
    return newDef;
  },

  async deleteBiometricDefinition(id: string): Promise<boolean> {
    // 1. Local storage cascade deletes
    const customDefs = getLocal<BiometricDefinition[]>("biometrics_definitions_custom", []);
    setLocal("biometrics_definitions_custom", customDefs.filter(d => d.id !== id));

    const customLogs = getLocal<BiometricLog[]>("biometrics_logs", []);
    setLocal("biometrics_logs", customLogs.filter(l => l.metric_type !== id));

    const customTargets = getLocal<BiometricTarget[]>("biometrics_targets", []);
    setLocal("biometrics_targets", customTargets.filter(t => t.metric_type !== id));

    try {
      const { error } = await supabase
        .from("biometrics_definitions")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return true;
    } catch {
      return true;
    }
  },

  async getBiometricsLogs(): Promise<BiometricLog[]> {
    try {
      const { data, error } = await supabase
        .from("biometrics_logs")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        date: item.date,
        metric_type: item.metric_type,
        value: Number(item.value),
        notes: item.notes || ""
      }));
    } catch {
      return getLocal<BiometricLog[]>("biometrics_logs", []);
    }
  },

  async saveBiometricLog(metricType: string, valNum: number, dateStr: string, notesStr: string): Promise<BiometricLog> {
    const logsList = getLocal<BiometricLog[]>("biometrics_logs", []);
    const existingIdx = logsList.findIndex(l => l.metric_type === metricType && l.date === dateStr);
    
    const newLog: BiometricLog = {
      id: existingIdx >= 0 ? logsList[existingIdx].id : (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11)),
      date: dateStr,
      metric_type: metricType,
      value: valNum,
      notes: notesStr
    };

    if (existingIdx >= 0) {
      logsList[existingIdx] = newLog;
    } else {
      logsList.push(newLog);
    }
    setLocal("biometrics_logs", logsList);

    try {
      const { error } = await supabase
        .from("biometrics_logs")
        .upsert({
          id: newLog.id,
          date: newLog.date,
          metric_type: newLog.metric_type,
          value: newLog.value,
          notes: newLog.notes
        });
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase save biometric log failed, fallback used", e);
    }
    return newLog;
  },

  async deleteBiometricLog(id: string): Promise<boolean> {
    const logsList = getLocal<BiometricLog[]>("biometrics_logs", []);
    const filtered = logsList.filter(l => l.id !== id);
    setLocal("biometrics_logs", filtered);

    try {
      const { error } = await supabase
        .from("biometrics_logs")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return true;
    } catch {
      return true;
    }
  },

  async getBiometricTargets(): Promise<BiometricTarget[]> {
    try {
      const { data, error } = await supabase
        .from("biometrics_targets")
        .select("*");
      if (error) throw error;

      return (data || []).map((item: any) => ({
        metric_type: item.metric_type,
        target_value: Number(item.target_value)
      }));
    } catch {
      return getLocal<BiometricTarget[]>("biometrics_targets", []);
    }
  },

  async saveBiometricTarget(metricType: string, targetVal: number): Promise<BiometricTarget> {
    const targets = getLocal<BiometricTarget[]>("biometrics_targets", []);
    const existingIdx = targets.findIndex(t => t.metric_type === metricType);
    
    const newTarget: BiometricTarget = {
      metric_type: metricType,
      target_value: targetVal
    };

    if (existingIdx >= 0) {
      targets[existingIdx] = newTarget;
    } else {
      targets.push(newTarget);
    }
    setLocal("biometrics_targets", targets);

    try {
      const { error } = await supabase
        .from("biometrics_targets")
        .upsert({
          metric_type: metricType,
          target_value: targetVal
        });
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase save biometric target failed, fallback used", e);
    }
    return newTarget;
  }
};
