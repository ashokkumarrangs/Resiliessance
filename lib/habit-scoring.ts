/**
 * Habits Scoring Engine
 * Evaluates the status of a habit based on its configuration and the logged value.
 */

export const sumDurations = (d1: string, d2: string) => {
  const toMin = (s: string) => {
    if (!s || !s.includes(':')) return 0;
    const [h, m] = s.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const total = toMin(d1) + toMin(d2);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export type HabitStatus = 'Success' | 'Tolerance' | 'Critical' | 'Failure' | 'Not Entered';

export interface HabitConfig {
  habit_name: string;
  input_type: string; // 'number', 'boolean', 'time', 'duration', 'text'
  condition_type: string; // 'at_least_n', 'at_most_n', 'exactly_n', 'between', 'above_below', 'boolean'
  target_value?: number;
  suc_min?: number;
  suc_max?: number;
  tol_min?: number;
  tol_max?: number;
  crit_min?: number;
  crit_max?: number;
  direction?: 'more' | 'less'; // for above_below
  unlogged_is_success?: boolean;
}

export function calculateHabitStatus(config: HabitConfig, rawValue: string): HabitStatus {
  if (!rawValue && rawValue !== '0') {
    return config.unlogged_is_success ? 'Success' : 'Not Entered';
  }

  // 1. Boolean Type
  if (config.input_type === 'boolean') {
    const targetIsYes = config.target_value === 0 ? false : true;
    const answeredYes = rawValue === 'Yes';
    return targetIsYes === answeredYes ? 'Success' : 'Failure';
  }

  // 2. Text Type (Just requires any non-empty value)
  if (config.input_type === 'text') {
    return rawValue.trim() !== '' ? 'Success' : 'Failure';
  }

  // 3. Numeric Types (Number, Time, Duration)
  // Robust HH:MM to decimal parser
  const parseNumeric = (v: string): number => {
    if (typeof v === 'string' && v.includes(':')) {
      const [h, m] = v.split(':').map(Number);
      return (h || 0) + (m || 0) / 60;
    }
    return parseFloat(v);
  };

  const value = parseNumeric(rawValue);
  if (isNaN(value)) return 'Failure';

  const { condition_type, target_value = 0, suc_min, suc_max, tol_min, tol_max, crit_min, crit_max, direction } = config;

  const baseCondition = condition_type.endsWith('_count') ? condition_type.replace('_count', '') : condition_type;
  switch (baseCondition) {
    case 'between': {
      const isSuc = (suc_min == null || value >= suc_min) && (suc_max == null || value <= suc_max);
      if (isSuc && (suc_min != null || suc_max != null)) return 'Success';

      if (crit_min != null && value <= crit_min) return 'Critical';
      if (crit_max != null && value >= crit_max) return 'Critical';

      const isTol = (tol_min == null || value >= tol_min) && (tol_max == null || value <= tol_max);
      if (isTol && (tol_min != null || tol_max != null)) return 'Tolerance';

      return 'Failure';
    }

    case 'above_below': {
      if (direction === 'more') {
        if (value >= target_value) return 'Success';
        if (crit_min != null && value <= crit_min) return 'Critical';
        if (tol_min != null && value >= tol_min) return 'Tolerance';
        return 'Failure';
      } else {
        if (value <= target_value) return 'Success';
        if (crit_max != null && value >= crit_max) return 'Critical';
        if (tol_max != null && value <= tol_max) return 'Tolerance';
        return 'Failure';
      }
    }

    case 'at_least_n': {
      if (value >= target_value) return 'Success';
      if (crit_min != null && value <= crit_min) return 'Critical';
      if (tol_min != null && value >= tol_min) return 'Tolerance';
      return 'Failure';
    }
    case 'at_most_n': {
      if (value <= target_value) return 'Success';
      if (crit_max != null && value >= crit_max) return 'Critical';
      if (tol_max != null && value <= tol_max) return 'Tolerance';
      return 'Failure';
    }
    case 'exactly_n': {
      if (value === target_value) return 'Success';
      
      if (crit_min != null && value <= crit_min) return 'Critical';
      if (crit_max != null && value >= crit_max) return 'Critical';
      
      const isTol = (tol_min == null || value >= tol_min) && (tol_max == null || value <= tol_max);
      if (isTol && (tol_min != null || tol_max != null)) return 'Tolerance';

      return 'Failure';
    }
    default: return 'Success';
  }
}
