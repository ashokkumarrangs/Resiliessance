"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Bookmark, Check, ChevronRight, ChevronUp, ChevronDown, Edit3, Eye, EyeOff, FileText, Flame, GripVertical, Inbox, List, PlusSquare, Star, Trash2, MoreVertical, Calendar, Repeat } from "lucide-react";
import { toast } from "sonner";
import { PageWrapper } from "@/components/PageWrapper";
import { TASK_TABS } from "@/lib/navigation";
import { LoadingScreen } from "@/components/LoadingScreen";
import { TaskCompletionModal } from "@/components/TaskCompletionModal";
import { useDialog } from "@/components/dialog-provider";
import { TaskEditModal } from "@/components/TaskEditModal";
import { calculateNextOccurrence, processTaskDeadlines } from "@/lib/task-recurrence";
import { format, parseISO, isValid, isToday, isThisWeek, startOfDay } from "date-fns";

interface Task {
  id: string;
  parent_id: string | null;
  task: string;
  status: string;
  is_today: boolean;
  is_week: boolean;
  is_high_priority?: boolean;
  is_inbox?: boolean;
  notes?: string | null;
  sort_order?: number;
  due_date?: string | null;
  recurrence_type?: string | null;
  recurrence_interval?: number | null;
  recurrence_days?: number[] | null;
  recurrence_anchor?: string | null;
}

export default function TaskManagerPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { confirm, prompt } = useDialog();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const view: any = "all";
  const [isLoading, setIsLoading] = useState(true);
  const [showDone, setShowDone] = useState(false);
  const [addingSubtaskToId, setAddingSubtaskToId] = useState<string | null>(null);
  const [newSubtaskName, setNewSubtaskName] = useState("");
  const [newTaskName, setNewTaskName] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  
  // Drag and drop state
  const [draggedTaskIndex, setDraggedTaskIndex] = useState<number | null>(null);

  useEffect(() => {
    loadTasks();
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-trigger') && !target.closest('.dropdown-menu')) {
        setActiveMenuTaskId(null);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const moveTaskInList = async (task: Task, direction: 'up' | 'down') => {
    const siblings = tasks.filter(t => t.parent_id === task.parent_id);
    const index = siblings.findIndex(t => t.id === task.id);
    if (index === -1) return;
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;
    
    const sibling = siblings[targetIndex];
    const currentOrder = task.sort_order ?? index;
    const siblingOrder = sibling.sort_order ?? targetIndex;
    
    await supabase.from('tasks').update({ sort_order: siblingOrder }).eq('id', task.id);
    await supabase.from('tasks').update({ sort_order: currentOrder }).eq('id', sibling.id);
    loadTasks();
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask({
      ...task,
      id: task.id,
      title: task.task || "",
      due_date: task.due_date,
      recurrence_type: task.recurrence_type,
      recurrence_interval: task.recurrence_interval,
      recurrence_days: task.recurrence_days,
      recurrence_anchor: task.recurrence_anchor,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveTaskDetails = async (updates: any) => {
    if (!editingTask) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          task: updates.title,
          due_date: updates.due_date,
          recurrence_type: updates.recurrence_type,
          recurrence_interval: updates.recurrence_interval,
          recurrence_days: updates.recurrence_days,
          recurrence_anchor: updates.recurrence_anchor,
        })
        .eq('id', editingTask.id);

      if (error) throw error;
      toast.success("Task updated successfully");
      loadTasks();
    } catch (err) {
      console.error("Error updating task details:", err);
      toast.error("Failed to update task details");
    }
  };

  const renderDropdown = (task: Task) => {
    const isOpen = activeMenuTaskId === task.id;
    return (
      <div className="relative flex justify-end">
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveMenuTaskId(isOpen ? null : task.id);
          }}
          className="p-1.5 text-muted-foreground/50 hover:text-primary hover:bg-muted rounded-md transition-colors cursor-pointer dropdown-trigger flex items-center justify-center"
        >
          <MoreVertical size={16} />
        </button>
        
        {isOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-44 bg-card border border-border/40 rounded-xl shadow-xl z-50 py-1.5 dropdown-menu animate-in fade-in slide-in-from-top-1">
            <button
              type="button"
              onClick={() => { moveTaskInList(task, 'up'); setActiveMenuTaskId(null); }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <ChevronUp size={13} className="text-muted-foreground/40" />
              Move Up
            </button>
            <button
              type="button"
              onClick={() => { moveTaskInList(task, 'down'); setActiveMenuTaskId(null); }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <ChevronDown size={13} className="text-muted-foreground/40" />
              Move Down
            </button>
            <button
              type="button"
              onClick={() => { toggleFlag(task.id, 'is_today', !task.is_today); setActiveMenuTaskId(null); }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <Star size={13} className={task.is_today ? "text-amber-500 fill-amber-500" : "text-muted-foreground/40"} />
              {task.is_today ? "Remove Today" : "Move to Today"}
            </button>
            <button
              type="button"
              onClick={() => { toggleFlag(task.id, 'is_week', !task.is_week); setActiveMenuTaskId(null); }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <Bookmark size={13} className={task.is_week ? "text-emerald-500 fill-emerald-500" : "text-muted-foreground/40"} />
              {task.is_week ? "Remove Week" : "Move to Week"}
            </button>
            <button
              type="button"
              onClick={() => { toggleFlag(task.id, 'is_high_priority', !task.is_high_priority); setActiveMenuTaskId(null); }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <Flame size={13} className={task.is_high_priority ? "text-rose-500 fill-rose-500" : "text-muted-foreground/40"} />
              {task.is_high_priority ? "Normal Priority" : "High Priority"}
            </button>
            <div className="h-px bg-border/40 my-1"></div>
            <button
              type="button"
              onClick={() => { toggleNotes(task.id); setActiveMenuTaskId(null); }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <FileText size={13} className="text-muted-foreground/40" />
              Notes
            </button>
            {view === 'all' && (
              <button
                type="button"
                onClick={() => { setAddingSubtaskToId(task.id); setNewSubtaskName(""); setActiveMenuTaskId(null); }}
                className="w-full text-left px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
              >
                <PlusSquare size={13} className="text-muted-foreground/40" />
                Add Sub-task
              </button>
            )}
            <button
              type="button"
              onClick={() => { handleOpenEditModal(task); setActiveMenuTaskId(null); }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <Edit3 size={13} className="text-muted-foreground/40" />
              Edit details
            </button>
            <div className="h-px bg-border/40 my-1"></div>
            <button
              type="button"
              onClick={() => { handleDelete(task.id); setActiveMenuTaskId(null); }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center gap-2"
            >
              <Trash2 size={13} className="text-rose-500" />
              Delete
            </button>
          </div>
        )}
      </div>
    );
  };

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('tasks').select('*');
      if (error) throw error;
      
      const processed = await processTaskDeadlines(data || [], false, async (id, updates) => {
        await supabase.from('tasks').update(updates).eq('id', id);
      });
      
      setTasks(processed);
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (parentId: string | null = null) => {
    const name = parentId ? newSubtaskName.trim() : newTaskName.trim();
    if (!name) {
      if (parentId) setAddingSubtaskToId(null);
      return;
    }

    try {
      const filtered = tasks.filter(t => t.parent_id === parentId && (parentId ? true : (view === 'inbox' ? t.is_inbox : !t.is_inbox)));
      const nextSortOrder = filtered.length > 0 ? Math.max(...filtered.map(t => t.sort_order || 0)) + 1 : 0;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        id: crypto.randomUUID(),
        parent_id: parentId,
        task: name,
        status: 'Pending',
        is_today: false,
        is_week: false,
        is_high_priority: false,
        is_inbox: !parentId,
        sort_order: nextSortOrder
      };

      let { data, error } = await supabase.from('tasks').insert(payload).select().single();
      if (error && error.message?.includes('sort_order')) {
        delete payload.sort_order;
        const res = await supabase.from('tasks').insert(payload).select().single();
        data = res.data;
        error = res.error;
      }

      if (error) throw error;

      setTasks([...tasks, data]);
      if (parentId) {
        setNewSubtaskName("");
        setAddingSubtaskToId(null);
        // auto-expand parent if collapsed
        if (collapsed.has(parentId)) {
          const next = new Set(collapsed);
          next.delete(parentId);
          setCollapsed(next);
        }
      } else {
        setNewTaskName("");
      }
      toast.success("Task added");
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Failed to add task");
    }
  };

  const toggleStatus = async (task: Task) => {
    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    if (nextStatus === 'Completed') {
      setActiveTask(task);
      setTaskModalOpen(true);
    } else {
      await executeStatusChange(task, 'Pending', null);
    }
  };

  const executeStatusChange = async (task: Task, nextStatus: string, completedAt: string | null) => {
    const oldTasks = [...tasks];
    try {
      if (nextStatus === 'Completed' && task.recurrence_type && task.recurrence_type !== 'none') {
        const nextDate = calculateNextOccurrence(task.due_date, {
          recurrenceType: task.recurrence_type as any,
          recurrenceInterval: task.recurrence_interval || 1,
          recurrenceDays: task.recurrence_days,
          recurrenceAnchor: task.recurrence_anchor,
        });

        if (nextDate) {
          const nextDueDateStr = format(nextDate, 'yyyy-MM-dd');
          const nextTask = {
            id: crypto.randomUUID(),
            parent_id: task.parent_id,
            task: task.task,
            status: 'Pending',
            is_today: nextDueDateStr === format(new Date(), 'yyyy-MM-dd'),
            is_week: isThisWeek(nextDate, { weekStartsOn: 1 }) || nextDueDateStr === format(new Date(), 'yyyy-MM-dd'),
            is_high_priority: task.is_high_priority || false,
            is_inbox: task.is_inbox || false,
            notes: task.notes || null,
            sort_order: (task.sort_order || 0) + 1,
            due_date: nextDueDateStr,
            recurrence_type: task.recurrence_type,
            recurrence_interval: task.recurrence_interval,
            recurrence_days: task.recurrence_days,
            recurrence_anchor: task.recurrence_anchor
          };

          // Mark current task completed and clear recurrence
          const { error: updateError } = await supabase
            .from('tasks')
            .update({ 
              status: 'Completed',
              completed_at: completedAt,
              recurrence_type: 'none',
              recurrence_interval: null,
              recurrence_days: null,
              recurrence_anchor: null
            })
            .eq('id', task.id);

          if (updateError) throw updateError;

          // Insert new recurring task instance
          const { error: insertError } = await supabase
            .from('tasks')
            .insert(nextTask);

          if (insertError) throw insertError;

          toast.success(`Task completed! Next occurrence scheduled for ${nextDueDateStr}`);
          loadTasks();
          return;
        }
      }

      // Standard non-recurring or marking pending
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: nextStatus, completed_at: completedAt } : t));
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: nextStatus,
          completed_at: completedAt
        })
        .eq('id', task.id);
      
      if (error) throw error;
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
      setTasks(oldTasks);
    }
  };

  const toggleFlag = async (id: string, field: 'is_today' | 'is_week' | 'is_high_priority' | 'is_inbox', val: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ [field]: val })
        .eq('id', id);
      
      if (error) throw error;
      setTasks(tasks.map(t => t.id === id ? { ...t, [field]: val } : t));
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm("Delete this task and all sub-tasks?"))) return;

    try {
      const idsToDelete: string[] = [id];
      const getSubs = (pid: string) => {
        tasks.filter(t => t.parent_id === pid).forEach(t => {
          idsToDelete.push(t.id);
          getSubs(t.id);
        });
      };
      getSubs(id);

      const { error } = await supabase.from('tasks').delete().in('id', idsToDelete);
      if (error) throw error;
      setTasks(tasks.filter(t => !idsToDelete.includes(t.id)));
      toast.success("Tasks deleted");
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete tasks");
    }
  };

  const toggleCollapse = (id: string) => {
    const next = new Set(collapsed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCollapsed(next);
  };

  const toggleNotes = (id: string) => {
    const next = new Set(expandedNotes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedNotes(next);
  };

  const saveNotes = async (id: string, notes: string) => {
    try {
      const { error } = await supabase.from('tasks').update({ notes }).eq('id', id);
      if (error) throw error;
      setTasks(tasks.map(t => t.id === id ? { ...t, notes } : t));
    } catch (error) {
      console.error("Error saving notes:", error);
    }
  };

  const handleTaskDragStart = (index: number) => {
    setDraggedTaskIndex(index);
  };

  const handleTaskDrop = async (dropIndex: number, parentId: string | null = null, depth = 0) => {
    if (draggedTaskIndex === null || draggedTaskIndex === dropIndex) return;

    let filtered = tasks.filter(t => t.parent_id === parentId);
    if (depth === 0) {
      filtered = filtered.filter(t => view === 'inbox' ? t.is_inbox : !t.is_inbox);
    }
    
    // Sort logic identical to render
    filtered.sort((a,b) => {
      const aDone = a.status === 'Completed';
      const bDone = b.status === 'Completed';
      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;
      return (a.sort_order || 0) - (b.sort_order || 0);
    });
    
    const pending = filtered.filter(t => t.status !== 'Completed');
    const completed = filtered.filter(t => t.status === 'Completed');
    
    // If dropping outside of pending, ignore for now (SquareShift logic)
    if (dropIndex >= pending.length) {
        dropIndex = pending.length - 1;
    }
    
    const newPending = [...pending];
    const [draggedItem] = newPending.splice(draggedTaskIndex, 1);
    newPending.splice(dropIndex, 0, draggedItem);
    
    const reorderedTasks = [...newPending, ...completed].map((t, idx) => ({
      ...t,
      sort_order: idx
    }));
    
    setTasks(tasks.map(t => {
      const found = reorderedTasks.find(r => r.id === t.id);
      return found ? found : t;
    }));
    
    try {
      const upsertRows = reorderedTasks.map(t => ({
        id: t.id,
        parent_id: t.parent_id,
        task: t.task,
        status: t.status,
        is_today: t.is_today,
        is_week: t.is_week,
        is_high_priority: t.is_high_priority,
        is_inbox: t.is_inbox,
        notes: t.notes,
        sort_order: t.sort_order,
        due_date: t.due_date,
        recurrence_type: t.recurrence_type,
        recurrence_interval: t.recurrence_interval,
        recurrence_days: t.recurrence_days,
        recurrence_anchor: t.recurrence_anchor
      }));
      
      const { error } = await supabase.from("tasks").upsert(upsertRows);
      if (error) throw error;
    } catch (error) {
      console.error("Error reordering tasks:", error);
      toast.error("Failed to reorder tasks");
      loadTasks(); // rollback on error
    }
    
    setDraggedTaskIndex(null);
  };

  const isRelatedToActiveMenu = (taskId: string): boolean => {
    if (!activeMenuTaskId) return false;
    if (activeMenuTaskId === taskId) return true;
    let curr = tasks.find(t => t.id === activeMenuTaskId);
    while (curr && curr.parent_id) {
      if (curr.parent_id === taskId) return true;
      const pid: string = curr.parent_id;
      curr = tasks.find(t => t.id === pid);
    }
    return false;
  };

  const renderTaskTree = (parentId: string | null = null, depth = 0) => {
    const getDepthStyles = (d: number) => {
      const baseText = "text-xs font-bold text-foreground/90";
      switch (d) {
        case 1:
          return {
            card: "bg-card border-t border-r border-b border-border/40 shadow-sm",
            text: baseText,
            accent: "bg-primary",
            borderAccent: "border-l-primary"
          };
        case 2:
          return {
            card: "bg-muted/35 border-t border-r border-b border-border/40 shadow-sm",
            text: baseText,
            accent: "bg-primary/75",
            borderAccent: "border-l-primary/75"
          };
        case 3:
          return {
            card: "bg-muted/65 border-t border-r border-b border-border/40 shadow-sm",
            text: baseText,
            accent: "bg-primary/50",
            borderAccent: "border-l-primary/50"
          };
        case 4:
          return {
            card: "bg-muted border-t border-r border-b border-border/40 shadow-sm",
            text: baseText,
            accent: "bg-primary/30",
            borderAccent: "border-l-primary/30"
          };
        default:
          return {
            card: "bg-muted-foreground/10 border-t border-r border-b border-border/40 shadow-sm",
            text: "text-xs font-semibold text-muted-foreground",
            accent: "bg-primary/20",
            borderAccent: "border-l-primary/20"
          };
      }
    };

    const renderAncestorLines = (currentDepth: number, listDepth: number) => {
      return null;
    };

    let filtered = tasks.filter(t => t.parent_id === parentId);
    if (depth === 0) {
      filtered = filtered.filter(t => view === 'inbox' ? t.is_inbox : !t.is_inbox);
    }
    
    // Sort: Pending first, then by sort_order
    filtered.sort((a,b) => {
      if (a.status === 'Completed' && b.status !== 'Completed') return 1;
      if (a.status !== 'Completed' && b.status === 'Completed') return -1;
      return (a.sort_order || 0) - (b.sort_order || 0);
    });

    const pending = filtered.filter(t => t.status !== 'Completed');
    const completed = filtered.filter(t => t.status === 'Completed');

    return (
        <div className="relative">
            {depth >= 2 && renderAncestorLines(depth - 1, depth)}
            <div className="space-y-1.5 text-left">
                {pending.map((task, idx) => {
                    const hasChildren = tasks.some(t => t.parent_id === task.id);
                    const isCollapsed = collapsed.has(task.id);
                    const accentClass = task.is_high_priority ? 'border-l-rose-500 bg-rose-500/5' : 'border-l-[#5499c7]';
                    const isMenuOpen = activeMenuTaskId === task.id;
                    const hasDue = task.due_date;
                    const hasRecur = task.recurrence_type && task.recurrence_type !== 'none';

                    return (
                        <div key={task.id} className={`w-full relative ${isRelatedToActiveMenu(task.id) ? 'z-[60]' : 'z-10'}`}>
                            {depth === 0 ? (() => {
                                    const hasSubtasksVisible = (!isCollapsed && hasChildren) || addingSubtaskToId === task.id;
                                    const isExpanded = expandedNotes.has(task.id) || hasSubtasksVisible;
                                    const headerRoundness = isExpanded ? 'rounded-t-2xl' : 'rounded-2xl';
                                    const borderBottomClass = isExpanded ? 'border-b border-border/30' : '';

                                    return (
                                        <div className={`bg-card border-t border-r border-b border-border/40 border-l-2 ${task.is_high_priority ? 'border-l-rose-500' : 'border-l-primary'} rounded-2xl shadow-sm mb-3`}>
                                            {/* Main Task Header Box */}
                                            <div 
                                              className={`flex items-center gap-2 bg-muted/15 px-4 h-14 transition-all group relative ${isMenuOpen ? 'z-50' : 'z-10'} ${headerRoundness} ${borderBottomClass}`}
                                            >
                                                {/* Checkbox */}
                                                <div className="w-6 flex items-center justify-center shrink-0">
                                                    <button 
                                                      onClick={() => toggleStatus(task)}
                                                      className="w-5 h-5 rounded-md border border-border/40 text-muted-foreground/30 hover:border-primary hover:text-primary flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                                                    >
                                                      <Check size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </button>
                                                </div>

                                                {/* Task Text */}
                                                <div className="flex-1 min-w-0 pr-2 flex flex-col justify-center text-left">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-xs leading-tight block truncate cursor-pointer hover:text-primary transition-colors flex items-center gap-1.5 ${task.is_high_priority ? 'text-foreground font-black' : 'font-bold text-foreground/90'}`}>
                                                            {task.task}
                                                            {task.is_high_priority && <Flame size={12} className="text-rose-500 shrink-0" />}
                                                        </span>
                                                    </div>
                                                    {(hasDue || hasRecur) && (
                                                        <div className="flex items-center gap-2 mt-0.5 text-[9px] font-bold text-muted-foreground/60">
                                                            {hasRecur && (
                                                                <span className="flex items-center gap-0.5 text-primary">
                                                                    <Repeat size={10} />
                                                                    {task.recurrence_type === 'weekly' && task.recurrence_days 
                                                                      ? `Weekly (${task.recurrence_days.map((d: number) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')})`
                                                                      : task.recurrence_type}
                                                                </span>
                                                            )}
                                                            {hasDue && (
                                                                <span className={`flex items-center gap-0.5 ${
                                                                    new Date(task.due_date!) < startOfDay(new Date()) 
                                                                      ? 'text-rose-500 bg-rose-500/10 px-1 rounded' 
                                                                      : isToday(parseISO(task.due_date!))
                                                                      ? 'text-amber-500 bg-amber-500/10 px-1 rounded'
                                                                      : ''
                                                                }`}>
                                                                    <Calendar size={10} />
                                                                    {format(parseISO(task.due_date!), 'MMM d, yyyy')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Subtask Expand Toggle */}
                                                <div className="w-6 flex items-center justify-center shrink-0">
                                                    {view === 'all' && hasChildren && (
                                                      <button 
                                                        onClick={() => toggleCollapse(task.id)}
                                                        className={`text-muted-foreground/60 hover:text-primary transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                                                      >
                                                        <ChevronRight size={16} />
                                                      </button>
                                                    )}
                                                </div>

                                                {/* Dropdown Actions */}
                                                <div className="w-10 flex items-center justify-end shrink-0 relative z-30">
                                                    {renderDropdown(task)}
                                                </div>
                                            </div>

                                            {/* Notes Area */}
                                            {expandedNotes.has(task.id) && (
                                                <div className={`w-full px-4 pb-3 pt-2 bg-card/5 ${hasSubtasksVisible ? 'border-b border-border/30' : 'rounded-b-2xl'}`}>
                                                    <textarea
                                                        defaultValue={task.notes || ''}
                                                        onBlur={(e) => saveNotes(task.id, e.target.value)}
                                                        className="w-full min-h-[60px] text-xs text-foreground font-bold bg-muted/20 border border-border/40 rounded-xl p-3 focus:ring-2 focus:ring-primary/10 outline-none resize-y"
                                                        placeholder="Add notes..."
                                                    />
                                                </div>
                                            )}

                                            {/* Subtasks area inside the container */}
                                            {hasSubtasksVisible && (
                                                <div className="bg-muted/5 rounded-b-2xl divide-y divide-border/20 p-0.5">
                                                    {/* INLINE SUBTASKS */}
                                                    {!isCollapsed && hasChildren && renderTaskTree(task.id, depth + 1)}

                                                    {/* Inline Subtask Input */}
                                                    {addingSubtaskToId === task.id && (
                                                        <div className="px-4 py-2.5">
                                                            <input
                                                                type="text"
                                                                autoFocus
                                                                placeholder="Sub-task name..."
                                                                value={newSubtaskName}
                                                                onChange={(e) => setNewSubtaskName(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleAddTask(task.id);
                                                                    if (e.key === 'Escape') setAddingSubtaskToId(null);
                                                                }}
                                                                onBlur={() => setAddingSubtaskToId(null)}
                                                                className="w-full bg-muted/15 border border-border/40 rounded-lg px-3 py-1.5 text-xs text-foreground font-bold focus:outline-none focus:bg-card focus:border-primary/45 shadow-sm transition-all"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })() : (() => {
                                    const styles = getDepthStyles(depth);
                                    const hasSubtasksVisible = ((!isCollapsed && hasChildren) || addingSubtaskToId === task.id);
                                    return (
                                        // For nested subtasks (depth >= 1) - boxed inside a single card
                                        <div 
                                          className={`transition-all relative ${isMenuOpen ? 'z-50' : 'z-10'} ${styles.card} border-l-2 ${styles.borderAccent} divide-y divide-border/20 rounded-2xl`}
                                          style={{ marginLeft: '1px' }}
                                        >
                                            {/* Subtask Row Header */}
                                            <div className="flex items-center h-12 group relative">
                                                {/* Checkbox, Text, Toggle, Actions wrapper */}
                                                <div className="flex-1 flex items-center gap-2 px-4">
                                                    {/* Checkbox */}
                                                    <div className="w-6 flex items-center justify-center shrink-0">
                                                        <button 
                                                          onClick={() => toggleStatus(task)}
                                                          className="w-5 h-5 rounded-md border border-border/40 text-muted-foreground/30 hover:border-primary hover:text-primary flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                                                        >
                                                          <Check size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </button>
                                                    </div>

                                                    {/* Task Text */}
                                                    <div className="flex-1 min-w-0 pr-2 flex flex-col justify-center text-left">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={`text-xs leading-tight block truncate cursor-pointer hover:text-primary transition-colors flex items-center gap-1.5 ${styles.text}`}>
                                                                {task.task}
                                                                {task.is_high_priority && <Flame size={12} className="text-rose-500 shrink-0" />}
                                                            </span>
                                                        </div>
                                                        {(hasDue || hasRecur) && (
                                                            <div className="flex items-center gap-2 mt-0.5 text-[9px] font-bold text-muted-foreground/60">
                                                                {hasRecur && (
                                                                    <span className="flex items-center gap-0.5 text-primary">
                                                                        <Repeat size={10} />
                                                                        {task.recurrence_type === 'weekly' && task.recurrence_days 
                                                                          ? `Weekly (${task.recurrence_days.map((d: number) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')})`
                                                                          : task.recurrence_type}
                                                                    </span>
                                                                )}
                                                                {hasDue && (
                                                                    <span className={`flex items-center gap-0.5 ${
                                                                        new Date(task.due_date!) < startOfDay(new Date()) 
                                                                          ? 'text-rose-500 bg-rose-500/10 px-1 rounded' 
                                                                          : isToday(parseISO(task.due_date!))
                                                                          ? 'text-amber-500 bg-amber-500/10 px-1 rounded'
                                                                          : ''
                                                                    }`}>
                                                                        <Calendar size={10} />
                                                                        {format(parseISO(task.due_date!), 'MMM d, yyyy')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Subtask Expand Toggle */}
                                                    <div className="w-6 flex items-center justify-center shrink-0">
                                                        {view === 'all' && hasChildren && (
                                                          <button 
                                                            onClick={() => toggleCollapse(task.id)}
                                                            className={`text-muted-foreground/60 hover:text-primary transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                                                          >
                                                            <ChevronRight size={16} />
                                                          </button>
                                                        )}
                                                    </div>

                                                    {/* Dropdown Actions */}
                                                    <div className="w-10 flex items-center justify-end shrink-0 relative z-30">
                                                        {renderDropdown(task)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Notes Area */}
                                            {expandedNotes.has(task.id) && (
                                                <div className={`w-full px-4 pb-3 pt-2 bg-black/[0.02] relative ${!hasSubtasksVisible ? 'rounded-b-2xl' : ''}`}>
                                                    <textarea
                                                        defaultValue={task.notes || ''}
                                                        onBlur={(e) => saveNotes(task.id, e.target.value)}
                                                        className="w-full min-h-[60px] text-xs text-foreground font-bold bg-muted/20 border border-border/40 rounded-xl p-3 focus:ring-2 focus:ring-primary/10 outline-none resize-y"
                                                        placeholder="Add notes..."
                                                    />
                                                </div>
                                            )}

                                            {/* Subtasks area (depth >= 1) - nested inside the card */}
                                            {hasSubtasksVisible && (
                                                <div className="bg-black/[0.03] divide-y divide-border/20 rounded-b-2xl relative p-0.5">
                                                    {/* INLINE SUBTASKS */}
                                                    {!isCollapsed && hasChildren && renderTaskTree(task.id, depth + 1)}

                                                    {/* Inline Subtask Input */}
                                                    {addingSubtaskToId === task.id && (
                                                        <div className="py-2.5 px-4" style={{ marginLeft: '1px' }}>
                                                            <input
                                                                type="text"
                                                                autoFocus
                                                                placeholder="Sub-task name..."
                                                                value={newSubtaskName}
                                                                onChange={(e) => setNewSubtaskName(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleAddTask(task.id);
                                                                    if (e.key === 'Escape') setAddingSubtaskToId(null);
                                                                }}
                                                                onBlur={() => setAddingSubtaskToId(null)}
                                                                className="w-full bg-muted/15 border border-border/40 rounded-lg px-3 py-1.5 text-xs text-foreground font-bold focus:outline-none focus:bg-card focus:border-primary/45 shadow-sm transition-all"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  const renderFilteredList = (type: 'today' | 'week' | 'inbox') => {
    let list = tasks.filter(t => (type === 'today' ? t.is_today : type === 'week' ? t.is_week : t.is_inbox));
    
    // Sort logic
    list.sort((a,b) => {
      if (a.status === 'Completed' && b.status !== 'Completed') return 1;
      if (a.status !== 'Completed' && b.status === 'Completed') return -1;
      return (a.sort_order || 0) - (b.sort_order || 0);
    });

    const pending = list.filter(t => t.status !== 'Completed');
    const completed = list.filter(t => t.status === 'Completed');

    if (list.length === 0) return (
      <div className="text-center py-20 px-10">
        <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6 border border-border/40 shadow-sm ${type === 'today' ? 'bg-amber-500/10 text-amber-500' : type === 'week' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-card text-muted-foreground/60'}`}>
          {type === 'today' ? <Star size={32} /> : type === 'week' ? <Bookmark size={32} /> : <Inbox size={32} />}
        </div>
        <h3 className="text-xl font-bold text-foreground tracking-tight">{type === 'inbox' ? 'Quick Notes is empty' : 'Focus list is empty'}</h3>
        <p className="text-muted-foreground/60 text-sm mt-2 font-medium">{type === 'inbox' ? 'Capture quick thoughts here' : 'Tag tasks from Workspace to focus your day'}</p>
      </div>
    );

    return (
        <div className="space-y-3">
            <div className="space-y-2 text-left">
                {pending.map((task, idx) => {
                    const isRoot = true;
                    const accentClass = task.is_high_priority ? 'border-l-rose-500 bg-rose-500/5' : 'border-l-primary/60';
                    const gridClass = 'grid-cols-[22px_1fr_40px]';

                    return (
                        <div key={task.id} className={`w-full relative ${isRelatedToActiveMenu(task.id) ? 'z-[60]' : 'z-10'}`}>
                            <div 
                              className={`grid gap-2 items-center bg-card border border-border/40 border-l-4 rounded-xl px-2 h-14 shadow-sm transition-all group ${accentClass}`}
                              style={{ gridTemplateColumns: '22px 1fr 40px' }}
                            >

                                {/* Checkbox */}
                                <button 
                                  onClick={() => toggleStatus(task)}
                                  className="w-5 h-5 rounded-md border border-border/40 text-muted-foreground/30 hover:border-primary hover:text-primary flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                                >
                                  <Check size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>

                                {/* Task Text */}
                                <div className="min-w-0 pr-2 flex flex-col justify-center text-left">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-xs leading-tight block truncate cursor-pointer hover:text-primary transition-colors flex items-center gap-1.5 ${task.is_high_priority ? 'text-foreground font-black' : 'font-bold text-foreground/90'}`}>
                                            {task.task}
                                            {task.is_high_priority && <Flame size={12} className="text-rose-500 shrink-0" />}
                                        </span>
                                    </div>
                                    {(task.due_date || (task.recurrence_type && task.recurrence_type !== 'none')) && (
                                        <div className="flex items-center gap-2 mt-0.5 text-[9px] font-bold text-muted-foreground/60">
                                            {task.recurrence_type && task.recurrence_type !== 'none' && (
                                                <span className="flex items-center gap-0.5 text-primary">
                                                    <Repeat size={10} />
                                                    {task.recurrence_type === 'weekly' && task.recurrence_days 
                                                      ? `Weekly (${task.recurrence_days.map((d: number) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')})`
                                                      : task.recurrence_type}
                                                </span>
                                            )}
                                            {task.due_date && (
                                                <span className={`flex items-center gap-0.5 ${
                                                    new Date(task.due_date) < startOfDay(new Date()) 
                                                      ? 'text-rose-500 bg-rose-500/10 px-1 rounded' 
                                                      : isToday(parseISO(task.due_date))
                                                      ? 'text-amber-500 bg-amber-500/10 px-1 rounded'
                                                      : ''
                                                }`}>
                                                    <Calendar size={10} />
                                                    {format(parseISO(task.due_date), 'MMM d, yyyy')}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Dropdown Actions */}
                                <div className="flex items-center justify-end relative z-30">
                                    {renderDropdown(task)}
                                </div>
                            </div>
                            
                            {/* Notes Area */}
                            {expandedNotes.has(task.id) && (
                                <div className="w-full pl-8 pr-3 pb-3 pt-2">
                                    <textarea
                                        defaultValue={task.notes || ''}
                                        onBlur={(e) => saveNotes(task.id, e.target.value)}
                                        className="w-full min-h-[60px] text-xs text-foreground font-bold bg-muted/20 border border-border/40 rounded-xl p-3 focus:ring-2 focus:ring-primary/10 outline-none resize-y"
                                        placeholder="Add notes..."
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  return (
    <PageWrapper
      title="Task Manager"
      reportHref="/reports/tasks"
      sectionTabs={TASK_TABS}
      headerActions={
        <button 
          onClick={() => setShowDone(!showDone)}
          className={`p-2 md:p-2.5 rounded-xl border flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer shrink-0 ${ showDone ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500 hover:text-indigo-600' : 'bg-card border-border/40 text-muted-foreground/60 hover:text-foreground' }`}
          title={showDone ? "Hide Done" : "Show Done"}
        >
          {showDone ? <EyeOff className="w-4 h-4 md:w-[18px] md:h-[18px]" /> : <Eye className="w-4 h-4 md:w-[18px] md:h-[18px]" />}
        </button>
      }
    >

      {/* Input Area */}
      {(view === 'all' || view === 'inbox') && (
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border/40 flex flex-col gap-3">
            <div className="flex gap-2">
                <input 
                    type="text" 
                    placeholder="Capture something to do..."
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                    className="flex-1 bg-muted/15 border border-border/40 rounded-lg px-3.5 py-2 text-sm text-foreground font-bold placeholder:text-muted-foreground/30 focus:bg-card focus:border-primary/45 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                />
                <button 
                    onClick={() => handleAddTask()}
                    className="h-10 px-5 bg-primary text-primary-foreground rounded-lg font-black text-xs uppercase tracking-wider hover:bg-primary/95 transition-colors shadow-sm shadow-primary/20 shrink-0 cursor-pointer"
                >
                    Add
                </button>
            </div>
        </div>
      )}

      {isLoading ? (
        <LoadingScreen message="Initializing workspace canvas..." />
      ) : (
        <div className="space-y-4 mt-6">
          {/* Headers */}
          {tasks.length > 0 && (
              <div className={`grid gap-2 px-3 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ${ view === 'all' ? "grid-cols-[24px_22px_1fr_24px_40px]" : "grid-cols-[24px_22px_1fr_40px]" }`}>
                <span></span>
                <span></span>
                <span>Task</span>
                {view === 'all' && <span></span>}
                <span className="text-right">Actions</span>
              </div>
          )}

          {view === 'all' ? renderTaskTree() : renderFilteredList(view)}
          
          {view === 'all' && tasks.length === 0 && (
            <div className="text-center py-20 px-10 bg-muted/10 border-2 border-dashed border-border/40 rounded-2xl text-left">
              <div className="w-16 h-16 bg-card border border-border/40 text-primary/70 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <List size={32} />
              </div>
              <h3 className="text-foreground font-black text-center">Workspace is empty</h3>
              <p className="text-muted-foreground/60 font-medium text-sm mt-2 text-center">Start adding tasks to organize your Resiliessance</p>
            </div>
          )}
        </div>
      )}
      
      <TaskCompletionModal 
        isOpen={taskModalOpen} 
        onClose={() => setTaskModalOpen(false)} 
        onConfirm={async (completedAt) => {
          if (activeTask) {
            await executeStatusChange(activeTask, 'Completed', completedAt);
          }
          setTaskModalOpen(false);
          setActiveTask(null);
        }} 
        taskTitle={activeTask?.task || ""}
      />

      <TaskEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTaskDetails}
        task={editingTask || { title: "" }}
      />
    </PageWrapper>
  );
}
