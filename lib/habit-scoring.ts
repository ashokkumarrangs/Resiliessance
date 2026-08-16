/**
 * Habits Scoring Engine
 * Evaluates the status of a habit based on its configuration and the logged value.
 */

import { parseISO, getDay, differenceInDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';

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

export type HabitStatus = 'Success' | 'Tolerance' | 'Critical' | 'Failure' | 'Joker' | 'Not Entered';

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
  frequency?: string;
  frequency_type?: string;
  days_of_week?: number[] | null;
  interval_count?: number | null;
  interval_unit?: string | null;
  interval_anchor?: string | null;
  flexible_target_count?: number | null;
  joker_days_limit?: number;
}

export function isHabitActiveOnDate(config: HabitConfig, dateStr: string): boolean {
  if (config.frequency === 'daily' || !config.frequency) {
    return true;
  }
  if (config.frequency === 'event') {
    return true;
  }
  if (config.frequency === 'weekly') {
    if (config.frequency_type === 'specific_days') {
      const date = parseISO(dateStr);
      const jsDay = date.getDay();
      return config.days_of_week?.includes(jsDay) ?? false;
    }
    if (config.frequency_type === 'flexible_weekly') {
      return true;
    }
  }
  if (config.frequency === 'custom') {
    if (config.frequency_type === 'interval') {
      if (!config.interval_anchor || !config.interval_count) return true;
      const date = parseISO(dateStr);
      const anchor = parseISO(config.interval_anchor);
      const diff = differenceInDays(date, anchor);
      if (diff < 0) return false;
      
      const count = config.interval_count;
      const unit = config.interval_unit || 'days';
      
      if (unit === 'days') {
        return diff % count === 0;
      } else if (unit === 'weeks') {
        return diff % (count * 7) === 0;
      } else if (unit === 'months') {
        const monthsDiff = (date.getFullYear() - anchor.getFullYear()) * 12 + (date.getMonth() - anchor.getMonth());
        if (monthsDiff >= 0 && monthsDiff % count === 0) {
          const anchorDay = anchor.getDate();
          const lastDayOfDateMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
          if (anchorDay > lastDayOfDateMonth) {
            return date.getDate() === lastDayOfDateMonth;
          }
          return date.getDate() === anchorDay;
        }
        return false;
      }
    }
    if (config.frequency_type === 'flexible_monthly') {
      return true;
    }
  }
  return true;
}

export function getFlexiblePeriodBounds(config: HabitConfig, dateStr: string): { start: string; end: string } {
  const date = parseISO(dateStr);
  if (config.frequency_type === 'flexible_weekly' || config.frequency === 'weekly') {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
    };
  }
  if (config.frequency_type === 'flexible_monthly' || config.frequency === 'custom') {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
    };
  }
  return { start: dateStr, end: dateStr };
}

export function calculateHabitStatus(config: HabitConfig, rawValue: string): HabitStatus {
  const trimmed = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
  if (!trimmed && trimmed !== '0') {
    return config.unlogged_is_success ? 'Success' : 'Not Entered';
  }

  // 1. Boolean Type
  if (config.input_type === 'boolean') {
    const targetIsYes = config.target_value === 0 ? false : true;
    const answeredYes = rawValue === 'Yes' || rawValue === 'true' || rawValue === 'Success';
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

  const { condition_type, target_value = 0, suc_min, suc_max, tol_min, tol_max, crit_min, crit_max, direction } = config || {};
  const condType = condition_type || '';
  const baseCondition = condType.endsWith('_count') ? condType.replace('_count', '') : condType;
  switch (baseCondition) {
    case 'between': {
      if (suc_min == null && suc_max == null && tol_min == null && tol_max == null) return 'Success';
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
