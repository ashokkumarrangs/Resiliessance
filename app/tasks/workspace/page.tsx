"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Bookmark, Check, ChevronDown, ChevronRight, Edit3, Eye, EyeOff, FileText, Flame, GripVertical, Inbox, LayoutGrid, List, Plus, PlusSquare, Search, Star, Trash2, X, BarChart2, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SectionNav } from "@/components/SectionNav";
import { TaskCompletionModal } from "@/components/TaskCompletionModal";

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
}

export default function TaskManagerPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const router = useRouter();
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
              onClick={() => { handleRename(task); setActiveMenuTaskId(null); }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <Edit3 size={13} className="text-muted-foreground/40" />
              Rename
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
      setTasks(data || []);
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
      
      const payload: any = {
        id: crypto.randomUUID(),
        parent_id: parentId,
        task: name,
        status: 'Pending',
        is_today: false,
        is_week: false,
        is_high_priority: false,
        is_inbox: false,
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
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: nextStatus, completed_at: completedAt } : t));
    try {
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
    if (!confirm("Delete this task and all sub-tasks?")) return;

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
      console.error("Error deleting tasks:", error);
      toast.error("Delete failed");
    }
  };

  const handleRename = async (task: Task) => {
    const n = prompt("Rename task:", task.task);
    if (n && n !== task.task) {
      try {
        const { error } = await supabase.from('tasks').update({ task: n }).eq('id', task.id);
        if (error) throw error;
        setTasks(tasks.map(t => t.id === task.id ? { ...t, task: n } : t));
      } catch (error) {
        console.error("Error renaming:", error);
      }
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
        sort_order: t.sort_order
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
        <div className="space-y-3">
            <div className="space-y-2">
                {pending.map((task, idx) => {
                    const hasChildren = tasks.some(t => t.parent_id === task.id);
                    const isCollapsed = collapsed.has(task.id);
                    const isDone = false;
                    const isRoot = depth === 0;

                    const accentClass = task.is_high_priority ? 'border-l-rose-500 bg-rose-500/5' : 'border-l-primary/60';

                    return (
                        <div key={task.id} className={`w-full relative ${isRelatedToActiveMenu(task.id) ? 'z-[60]' : 'z-10'}`}>
                            <div 
                              draggable
                              onDragStart={() => isRoot && setDraggedTaskIndex(idx)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => isRoot && handleTaskDrop(idx, parentId, depth)}
                              className={`flex items-center gap-2 bg-card border border-border/40 border-l-4 rounded-xl px-3 h-14 shadow-sm transition-all group ${accentClass}`}
                            >
                                {/* Drag Handle */}
                                <div className="w-6 flex items-center justify-center text-muted-foreground/20 hover:text-primary cursor-grab active:cursor-grabbing shrink-0">
                                    <GripVertical size={16} />
                                </div>

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
                                <div className="flex-1 min-w-0 pr-2 flex items-center gap-1.5">
                                    <span className={`text-xs leading-tight block truncate cursor-pointer hover:text-primary transition-colors flex items-center gap-1.5 ${task.is_high_priority ? 'text-foreground font-black' : 'font-bold text-foreground/90'}`}>
                                        {task.task}
                                        {task.is_high_priority && <Flame size={12} className="text-rose-500 shrink-0" />}
                                    </span>
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
                                <div className="w-full pl-8 pr-3 pb-3 pt-2">
                                    <textarea
                                        defaultValue={task.notes || ''}
                                        onBlur={(e) => saveNotes(task.id, e.target.value)}
                                        className="w-full min-h-[60px] text-xs text-foreground font-bold bg-muted/20 border border-border/40 rounded-xl p-3 focus:ring-2 focus:ring-primary/10 outline-none resize-y"
                                        placeholder="Add notes..."
                                    />
                                </div>
                            )}

                            {/* INLINE SUBTASKS */}
                            {view === 'all' && !isCollapsed && hasChildren && (
                                <div className="pb-2 border-t border-border/60 bg-muted/30">
                                    <div className="ml-[22px] pl-[12px] border-l-2 border-border/50 mt-2 pr-2">
                                        {renderTaskTree(task.id, depth + 1)}
                                    </div>
                                </div>
                            )}

                            {/* Inline Subtask Input */}
                            {addingSubtaskToId === task.id && (
                                <div className="w-full pl-8 pr-3 pb-3 mt-2">
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
                    );
                })}
            </div>

            {/* Completed Wrapper */}
            {showDone && completed.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-border/20">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                            Completed ({completed.length})
                        </span>
                        <div className="h-px flex-1 bg-border/20"></div>
                    </div>
                    {completed.map(task => {
                        const hasChildren = tasks.some(t => t.parent_id === task.id);
                        const isCollapsed = collapsed.has(task.id);
                        const isRoot = depth === 0;
                        const gridClass = 'grid-cols-[24px_22px_1fr_24px_40px]';

                        return (
                            <div key={task.id} className={`w-full relative ${isRelatedToActiveMenu(task.id) ? 'z-[60]' : 'z-10'}`}>
                                <div className={`grid gap-2 items-center bg-muted/10 border border-border/20 rounded-xl px-2 h-14 opacity-55 hover:opacity-90 transition-opacity group ${gridClass}`}>
                                    <div className="p-1 text-muted-foreground/20">
                                        <GripVertical size={16} />
                                    </div>
                                    
                                    {/* Checked Checkbox */}
                                    <button 
                                        onClick={() => toggleStatus(task)}
                                        className="w-5 h-5 rounded-md bg-emerald-500 border border-emerald-500 text-white flex items-center justify-center shrink-0 cursor-pointer"
                                    >
                                        <Check size={12} />
                                    </button>
                                    
                                    {/* Strikethrough Task Text */}
                                    <div className="min-w-0 pr-2 flex items-center gap-1.5">
                                        <span className="text-xs font-semibold text-muted-foreground/45 line-through decoration-muted-foreground/30 leading-tight block truncate cursor-pointer hover:text-foreground transition-colors">
                                            {task.task}
                                        </span>
                                    </div>
                                    
                                    {/* Subtask Expand Toggle */}
                                    <div className="flex items-center justify-center">
                                        {view === 'all' && hasChildren && (
                                        <button 
                                            onClick={() => toggleCollapse(task.id)}
                                            className={`text-muted-foreground/60 hover:text-primary transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-1 justify-end">
                                    </div>
                                    
                                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity bg-transparent relative z-30">
                                        {renderDropdown(task)}
                                    </div>
                                </div>
                                
                                {/* INLINE SUBTASKS */}
                                {view === 'all' && !isCollapsed && hasChildren && (
                                    <div className="pb-2 border-t border-border/60 bg-muted/30">
                                        <div className="ml-[22px] pl-[12px] border-l-2 border-border/50 mt-2 pr-2">
                                            {renderTaskTree(task.id, depth + 1)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
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
            <div className="space-y-2">
                {pending.map((task, idx) => {
                    const isRoot = true;
                    const accentClass = task.is_high_priority ? 'border-l-rose-500 bg-rose-500/5' : 'border-l-primary/60';

                    return (
                        <div key={task.id} className={`w-full relative ${isRelatedToActiveMenu(task.id) ? 'z-[60]' : 'z-10'}`}>
                            <div 
                              draggable
                              onDragStart={() => isRoot && setDraggedTaskIndex(idx)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => isRoot && handleTaskDrop(idx, null, 0)}
                              className={`flex items-center gap-2 bg-card border border-border/40 border-l-4 rounded-xl px-3 h-14 shadow-sm transition-all group ${accentClass}`}
                            >
                                {/* Drag Handle */}
                                <div className="w-6 flex items-center justify-center text-muted-foreground/20 hover:text-primary cursor-grab active:cursor-grabbing shrink-0">
                                    <GripVertical size={16} />
                                </div>

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
                                <div className="flex-1 min-w-0 pr-2 flex items-center gap-1.5">
                                    <span className={`text-xs leading-tight block truncate cursor-pointer hover:text-primary transition-colors flex items-center gap-1.5 ${task.is_high_priority ? 'text-foreground font-black' : 'font-bold text-foreground/90'}`}>
                                        {task.task}
                                        {task.is_high_priority && <Flame size={12} className="text-rose-500 shrink-0" />}
                                    </span>
                                </div>

                                {/* Dropdown Actions */}
                                <div className="w-10 flex items-center justify-end shrink-0 relative z-30">
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

            {/* Completed Wrapper */}
            {showDone && completed.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-border/20">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                            Completed ({completed.length})
                        </span>
                        <div className="h-px flex-1 bg-border/20"></div>
                    </div>
                    {completed.map(task => {
                        const gridClass = 'grid-cols-[24px_22px_1fr_40px]';

                        return (
                            <div key={task.id} className={`w-full relative ${isRelatedToActiveMenu(task.id) ? 'z-[60]' : 'z-10'}`}>
                                <div className={`grid gap-2 items-center bg-muted/10 border border-border/20 rounded-xl px-2 h-14 opacity-55 hover:opacity-90 transition-opacity group ${gridClass}`}>
                                    <div className="p-1 text-muted-foreground/20">
                                        <GripVertical size={16} />
                                    </div>
                                    
                                    {/* Checked Checkbox */}
                                    <button 
                                        onClick={() => toggleStatus(task)}
                                        className="w-5 h-5 rounded-md bg-emerald-500 border border-emerald-500 text-white flex items-center justify-center shrink-0 cursor-pointer"
                                    >
                                        <Check size={12} />
                                    </button>
                                    
                                    {/* Strikethrough Task Text */}
                                    <div className="min-w-0 pr-2 flex items-center gap-1.5">
                                        <span className="text-xs font-semibold text-muted-foreground/45 line-through decoration-muted-foreground/30 leading-tight block truncate cursor-pointer hover:text-foreground transition-colors">
                                            {task.task}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 justify-end">
                                    </div>
                                    
                                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity bg-transparent relative z-30">
                                        {renderDropdown(task)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        <PageHeader title="Task Manager">
        <div className="flex items-center gap-2">

            <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowDone(!showDone)}
                  className={`p-2 md:p-2.5 rounded-xl border flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer shrink-0 ${ showDone ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500 hover:text-indigo-600' : 'bg-card border-border/40 text-muted-foreground/60 hover:text-foreground' }`}
                  title={showDone ? "Hide Done" : "Show Done"}
                >
                  {showDone ? <EyeOff className="w-4 h-4 md:w-[18px] md:h-[18px]" /> : <Eye className="w-4 h-4 md:w-[18px] md:h-[18px]" />}
                </button>
            </div>
        
          <Link 
            href="/reports/tasks" 
            className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-muted-foreground/60 hover:text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
            title="View Reports"
          >
            <BarChart2 className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Link>
        </div>
      </PageHeader>

        {/* Tab System */}
        <div className="-mt-2 mb-6">
          <SectionNav tabs={[
            { title: "Quick Notes", icon: <Inbox size={16} />, isActive: view === "inbox", onClick: () => router.push("/tasks/inbox") },
            { title: "Today", icon: <Star size={16} fill={view === "today" ? "currentColor" : "none"} />, isActive: view === "today", onClick: () => router.push("/tasks/today") },
            { title: "Week", icon: <Bookmark size={16} fill={view === "week" ? "currentColor" : "none"} />, isActive: view === "week", onClick: () => router.push("/tasks/week") },
            { title: "Workspace", icon: <LayoutGrid size={16} />, isActive: view === "all", onClick: () => router.push("/tasks/workspace") }
          ]} />
        </div>



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
            <div className="text-center py-20 px-10 bg-muted/10 border-2 border-dashed border-border/40 rounded-2xl">
              <div className="w-16 h-16 bg-card border border-border/40 text-primary/70 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <List size={32} />
              </div>
              <h3 className="text-foreground font-black">Workspace is empty</h3>
              <p className="text-muted-foreground/60 font-medium text-sm mt-2">Start adding tasks to organize your Resiliessance</p>
            </div>
          )}
        </div>
      )}
      
      <TaskCompletionModal 
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setActiveTask(null);
        }}
        onConfirm={(completedAt) => {
          if (activeTask) {
            executeStatusChange(activeTask, 'Completed', completedAt);
          }
          setTaskModalOpen(false);
          setActiveTask(null);
        }}
        taskTitle={activeTask?.task || ""}
      />
    </div>
    </div>
  );
}
