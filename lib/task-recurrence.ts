import { addDays, addWeeks, addMonths, getDay, startOfDay, parseISO, isValid, isToday, isThisWeek } from "date-fns";

export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "custom";

export interface RecurrenceConfig {
  recurrenceType: RecurrenceType;
  recurrenceInterval?: number;
  recurrenceDays?: number[] | null;
  recurrenceAnchor?: string | null;
}

/**
 * Calculates the next occurrence date for a recurring task.
 * 
 * @param currentDueDate The due date of the completed task (as Date or ISO string).
 * @param config The recurrence configuration.
 * @returns The next due date as a Date object, or null if not recurring.
 */
export function calculateNextOccurrence(
  currentDueDate: Date | string | null | undefined,
  config: RecurrenceConfig
): Date | null {
  const { recurrenceType, recurrenceInterval = 1, recurrenceDays, recurrenceAnchor } = config;

  if (!recurrenceType || recurrenceType === "none") {
    return null;
  }

  // Determine starting date for calculation
  let baseDate: Date;
  if (currentDueDate) {
    baseDate = typeof currentDueDate === "string" ? parseISO(currentDueDate) : currentDueDate;
    if (!isValid(baseDate)) {
      baseDate = new Date();
    }
  } else if (recurrenceAnchor) {
    baseDate = parseISO(recurrenceAnchor);
    if (!isValid(baseDate)) {
      baseDate = new Date();
    }
  } else {
    baseDate = new Date();
  }

  baseDate = startOfDay(baseDate);
  const interval = Math.max(1, recurrenceInterval);

  switch (recurrenceType) {
    case "daily":
      return addDays(baseDate, interval);

    case "weekly": {
      // If no specific days are selected, repeat on the same day of the week every N weeks
      if (!recurrenceDays || recurrenceDays.length === 0) {
        return addWeeks(baseDate, interval);
      }

      // Sort selected days to ensure chronological ordering (0 = Sunday, 6 = Saturday)
      const sortedDays = [...recurrenceDays].sort((a, b) => a - b);
      const currentDayOfWeek = getDay(baseDate);

      // Find the next day in the list that is strictly after today's day of the week
      const nextDayOfWeek = sortedDays.find(d => d > currentDayOfWeek);

      if (nextDayOfWeek !== undefined) {
        // Next occurrence is in the same week, diff days later
        const diff = nextDayOfWeek - currentDayOfWeek;
        return addDays(baseDate, diff);
      } else {
        // Next occurrence is in a future week.
        // First, move to the beginning of the next cycle week (based on interval)
        // Sunday of current week is (baseDate - currentDayOfWeek).
        // The start of the target week is Sunday + (interval * 7) days.
        const startOfNextWeekCycle = addDays(baseDate, 7 - currentDayOfWeek + (interval - 1) * 7);
        // Add the offset to the first day of the sorted days (e.g. if Mon is 1, add 1 day to Sunday)
        const firstDayOfRecurrence = sortedDays[0];
        return addDays(startOfNextWeekCycle, firstDayOfRecurrence);
      }
    }

    case "monthly":
      return addMonths(baseDate, interval);

    case "custom":
      // Treat custom as daily with interval for simplicity if unit is unspecified, or default to daily
      return addDays(baseDate, interval);

    default:
      return null;
  }
}

/**
 * Checks active tasks and automatically updates their is_today and is_week flags in local state and database
 * if their deadlines match the current day or week.
 * 
 * @param tasks List of active tasks.
 * @param isSquareShift True if checking SquareShift tasks, false for Task Manager.
 * @param updateTaskInDb Async function to persist the status update in Supabase.
 * @returns The updated tasks array.
 */
export async function processTaskDeadlines(
  tasks: any[],
  isSquareShift: boolean,
  updateTaskInDb: (id: string, updates: any) => Promise<void>
): Promise<any[]> {
  const updatedTasks = tasks.map(t => ({ ...t }));
  const now = startOfDay(new Date());

  for (let i = 0; i < updatedTasks.length; i++) {
    const t = updatedTasks[i];
    
    // Ignore completed tasks
    const isCompleted = isSquareShift ? t.completed : (t.status === 'Completed');
    if (isCompleted) continue;

    const rawDue = t.due_date || t.due;
    if (!rawDue) continue;

    try {
      const dueDate = startOfDay(parseISO(rawDue));
      if (!isValid(dueDate)) continue;

      if (isSquareShift) {
        // Rule: if due_date is today (or past due), set is_today = true
        const shouldBeToday = isToday(dueDate) || dueDate < now;
        if (shouldBeToday && !t.is_today) {
          t.is_today = true;
          await updateTaskInDb(t.id, { is_today: true });
        }
      } else {
        // Task Manager Rule:
        // If due_date is today (or past due), set is_today = true and is_week = true
        // If due_date is this week, set is_week = true
        const shouldBeToday = isToday(dueDate) || dueDate < now;
        const shouldBeWeek = isThisWeek(dueDate, { weekStartsOn: 1 }) || dueDate < now;

        let changed = false;
        const updates: any = {};

        if (shouldBeToday && !t.is_today) {
          t.is_today = true;
          updates.is_today = true;
          changed = true;
        }

        const targetIsWeek = shouldBeToday || shouldBeWeek;
        if (targetIsWeek && !t.is_week) {
          t.is_week = true;
          updates.is_week = true;
          changed = true;
        }

        if (changed) {
          await updateTaskInDb(t.id, updates);
        }
      }
    } catch (e) {
      console.error("Error processing task deadline for task ID:", t.id, e);
    }
  }

  return updatedTasks;
}
