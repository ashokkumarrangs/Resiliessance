import { useState, useEffect, useCallback } from "react";
import { taskService } from "@/lib/services/tasks";
import { TaskItem, ActionTaskItem } from "@/lib/types";

export function useTasks() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [actionTasks, setActionTasks] = useState<ActionTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tData, atData] = await Promise.all([
        taskService.getTasks(),
        taskService.getActionTasks()
      ]);
      setTasks(tData);
      setActionTasks(atData);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch task data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllTasks();
  }, [fetchAllTasks]);

  const toggleTask = async (id: string, currentStatus: string) => {
    const success = await taskService.toggleTaskStatus(id, currentStatus);
    if (success) await fetchAllTasks();
    return success;
  };

  const toggleActionTask = async (id: string, currentCompleted: boolean) => {
    const success = await taskService.toggleActionTaskCompleted(id, currentCompleted);
    if (success) await fetchAllTasks();
    return success;
  };

  return {
    tasks,
    actionTasks,
    isLoading,
    error,
    toggleTask,
    toggleActionTask,
    refetch: fetchAllTasks
  };
}
