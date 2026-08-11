"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
    Folder, Notebook, Plus, Check, Edit3, Trash2, GripVertical, List, Eye, EyeOff, MoreVertical, Calendar, Flame, PlusSquare, Star, ChevronUp, ChevronDown
} from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SectionNav } from "@/components/SectionNav";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { TaskCompletionModal } from "@/components/TaskCompletionModal";
import { useDialog } from "@/components/dialog-provider";

const NOTES_ID = "__notes__";

export default function SquareShiftNotesPage() {
  const router = useRouter();
  const { confirm, prompt } = useDialog();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [projects, setProjects] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tasks, setTasks] = useState<any[]>([]);
  const [openCounts, setOpenCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showDone, setShowDone] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchProjects(), fetchTasks()]).then(() => setIsLoading(false));

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-trigger') && !target.closest('.dropdown-menu')) {
        setActiveMenuTaskId(null);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const fetchProjects = async () => {
    const { data } = await supabase.from("action_projects").select("*").order("sort_order");
    if (data) setProjects(data);
  };

  const fetchTasks = async () => {
    const { data } = await supabase.from("action_tasks").select("*").order("sort_order");
    if (data) {
      setTasks(data.filter(t => !t.project_id || t.project_id === NOTES_ID));
      
      // Calculate open task counts per project
      const counts: Record<string, number> = {};
      let todayCount = 0;
      data.forEach(t => {
        if (!t.completed) {
          if (t.is_today) todayCount++;
          const pid = t.project_id || NOTES_ID;
          counts[pid] = (counts[pid] || 0) + 1;
        }
      });
      counts["__today__"] = todayCount;
      setOpenCounts(counts);
    }
  };

  const addTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskText.trim()) return;
    const { data, error } = await supabase.from('action_tasks').insert({
        id: crypto.randomUUID(),
        text: newTaskText.trim(),
        project_id: null,
        completed: false,
        sort_order: tasks.length
    }).select();
    if (!error && data) {
        setNewTaskText("");
        toast.success("Note added");
        fetchTasks();
    } else if (error) {
        console.error("Error adding note:", error);
        toast.error(`Failed to add note: ${error.message}`);
    }
  };

  const toggleStatus = async (task: any) => {
    const nextStatus = !task.completed;
    if (nextStatus) {
      setActiveTask(task);
      setTaskModalOpen(true);
    } else {
      await executeStatusChange(task, false, null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const executeStatusChange = async (task: any, completed: boolean, completedAt: string | null) => {
    const { error } = await supabase
      .from('action_tasks')
      .update({ 
        completed,
        completed_at: completedAt
      })
      .eq('id', task.id);
    if (!error) {
      fetchTasks();
    } else {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const toggleFlag = async (task: any, field: 'is_today' | 'is_high_priority', val: boolean) => {
    const { error } = await supabase
      .from('action_tasks')
      .update({ [field]: val })
      .eq('id', task.id);
    if (!error) {
      toast.success(field === 'is_today' 
        ? (val ? "Moved to Today" : "Removed from Today") 
        : (val ? "Marked as High Priority" : "Priority set to Normal")
      );
      fetchTasks();
    } else {
      console.error(`Error toggling ${field}:`, error);
      toast.error(`Failed to update ${field === 'is_today' ? 'today status' : 'priority'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if(!(await confirm("Delete this note?"))) return;
    const { error } = await supabase.from('action_tasks').delete().eq('id', id);
    if (!error) fetchTasks();
  };

  const handleRename = async (task: any) => {
    const newName = await prompt("Rename note:", task.text);
    if (newName && newName.trim()) {
        await supabase.from('action_tasks').update({ text: newName.trim() }).eq('id', task.id);
        fetchTasks();
    }
  };

  const createProject = async () => {
      const name = await prompt("New project name:");
      if (name && name.trim()) {
          const newId = crypto.randomUUID();
          const { data, error } = await supabase.from('action_projects').insert({ id: newId, name: name.trim(), sort_order: projects.length }).select();
          if (data && !error) {
              setProjects([...projects, data[0]]);
              router.push(`/squareshift/${data[0].id}`);
          } else if (error) {
              console.error("Error creating project:", error);
          }
      }
  };

  const focusInput = () => {
    const inputEl = document.getElementById("squareshift-note-input");
    if (inputEl) inputEl.focus();
  };

  const moveTask = async (task: any, direction: 'up' | 'down') => {
    const list = tasks.filter(t => !t.completed);
    const index = list.findIndex(t => t.id === task.id);
    if (index === -1) return;
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    
    const sibling = list[targetIndex];
    const currentOrder = task.sort_order ?? index;
    const siblingOrder = sibling.sort_order ?? targetIndex;
    
    await supabase.from('action_tasks').update({ sort_order: siblingOrder }).eq('id', task.id);
    await supabase.from('action_tasks').update({ sort_order: currentOrder }).eq('id', sibling.id);
    fetchTasks();
  };

  const renderDropdown = (task: any) => {
    const isOpen = activeMenuTaskId === task.id;
    return (
      <div className="relative flex justify-end shrink-0">
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveMenuTaskId(isOpen ? null : task.id);
          }}
          className="p-1.5 text-muted-foreground/50 hover:text-primary hover:bg-muted rounded-md transition-colors cursor-pointer dropdown-trigger flex items-center justify-center"
          title="Note Options"
        >
          <MoreVertical size={16} />
        </button>
        
        {isOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-44 bg-card border border-border/40 rounded-xl shadow-xl z-50 py-1.5 dropdown-menu animate-in fade-in slide-in-from-top-1">
            <button
              type="button"
              onClick={() => { focusInput(); setActiveMenuTaskId(null); }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <PlusSquare size={13} className="text-muted-foreground/40" />
              Add
            </button>
            <button
              type="button"
              onClick={() => { moveTask(task, 'up'); setActiveMenuTaskId(null); }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <ChevronUp size={13} className="text-muted-foreground/40" />
              Move Up
            </button>
            <button
              type="button"
              onClick={() => { moveTask(task, 'down'); setActiveMenuTaskId(null); }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <ChevronDown size={13} className="text-muted-foreground/40" />
              Move Down
            </button>
            <button
              type="button"
              onClick={() => { toggleFlag(task, 'is_today', !task.is_today); setActiveMenuTaskId(null); }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <Star size={13} className={task.is_today ? "text-amber-500 fill-amber-500" : "text-muted-foreground/40"} />
              {task.is_today ? "Remove Today" : "Move to Today"}
            </button>
            <button
              type="button"
              onClick={() => { toggleFlag(task, 'is_high_priority', !task.is_high_priority); setActiveMenuTaskId(null); }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <Flame size={13} className={task.is_high_priority ? "text-rose-500 fill-rose-500" : "text-muted-foreground/40"} />
              {task.is_high_priority ? "Normal Priority" : "High Priority"}
            </button>
            <button
              type="button"
              onClick={() => { handleRename(task); setActiveMenuTaskId(null); }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <Edit3 size={13} className="text-muted-foreground/40" />
              Edit
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

  return (
    <PageWrapper
      title="SquareShift"
      reportHref="/reports"
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

        {isLoading ? (
          <LoadingScreen message="Synthesizing quick notes..." />
        ) : (
          <>
            <div className="-mt-2 mb-6">
          <SectionNav tabs={[
            {
              title: `Notes${openCounts[NOTES_ID] ? ` (${openCounts[NOTES_ID]})` : ""}`,
              icon: <Notebook size={16} />,
              isActive: true,
              onClick: () => router.push("/squareshift/notes"),
            },
            {
              title: `Today${openCounts["__today__"] ? ` (${openCounts["__today__"]})` : ""}`,
              icon: <Calendar size={16} />,
              isActive: false,
              onClick: () => router.push("/squareshift/today"),
            },
            ...projects.map(proj => ({
              title: `${proj.name}${openCounts[proj.id] ? ` (${openCounts[proj.id]})` : ""}`,
              icon: <Folder size={16} />,
              isActive: false,
              onClick: () => router.push(`/squareshift/${proj.id}`),
            })),
            {
              title: "New Project",
              icon: <Plus size={16} />,
              isActive: false,
              onClick: createProject,
            }
          ]} />
        </div>

        {/* Quick Notes Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center shrink-0">
            <Notebook size={15} className="text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-black text-foreground leading-none">Quick Notes</h2>
            <p className="text-[10px] text-muted-foreground/50 font-medium mt-0.5 uppercase tracking-wide">
              {openCounts[NOTES_ID] ?? 0} open note{openCounts[NOTES_ID] !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border/40 flex flex-col gap-3">
            <div className="flex gap-2">
                <input 
                    id="squareshift-note-input"
                    type="text" 
                    placeholder="Capture a quick note..."
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTask()}
                    className="flex-1 bg-muted/15 border border-border/40 rounded-lg px-3.5 py-2 text-sm text-foreground font-bold placeholder:text-muted-foreground/30 focus:bg-card focus:border-primary/45 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                />
                <button 
                    onClick={() => addTask()}
                    className="h-10 px-5 bg-primary text-primary-foreground rounded-lg font-black text-xs uppercase tracking-wider hover:bg-primary/95 transition-colors shadow-sm shadow-primary/20 shrink-0 cursor-pointer"
                >
                    Add
                </button>
            </div>
        </div>

        <div className="space-y-4 mt-6">
          {/* Headers */}
          {tasks.length > 0 && (
              <div className="grid gap-2 px-3 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest grid-cols-[24px_22px_1fr_32px]">
                <span></span>
                <span></span>
                <span>Task</span>
                <span className="text-right"></span>
              </div>
          )}
          
          <div className="space-y-3">
            {tasks.filter(t => !t.completed).map(task => {
                const accentClass = task.is_high_priority ? 'border-l-rose-500 bg-rose-500/5' : 'border-l-primary/60 bg-card';
                return (
                  <div key={task.id} className={`w-full relative ${activeMenuTaskId === task.id ? 'z-50' : 'z-10'}`}>
                      <div className={`flex items-center gap-2 border border-border/40 border-l-4 ${accentClass} rounded-xl px-3 h-14 shadow-sm transition-all group`}>
                          <div className="w-6 flex items-center justify-center shrink-0">
                              <button 
                                  onClick={() => toggleStatus(task)}
                                  className="w-5 h-5 rounded-md border border-border/40 text-muted-foreground/30 hover:border-primary hover:text-primary flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                              >
                                  <Check size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                          </div>
                          <div className="flex-1 min-w-0 pr-2 flex items-center gap-1.5">
                              <span className={`text-xs leading-tight block truncate cursor-pointer hover:text-primary transition-colors flex items-center gap-1.5 ${task.is_high_priority ? 'text-foreground font-black' : 'font-bold text-foreground/90'}`}>
                                  {task.is_high_priority && <Flame size={12} className="text-rose-500 fill-rose-500 shrink-0" />}
                                  {task.text}
                              </span>
                          </div>
                          
                          {renderDropdown(task)}
                      </div>
                  </div>
                );
            })}
          </div>

          {/* Completed Wrapper */}
          {showDone && tasks.filter(t => t.completed).length > 0 && (
              <div className="space-y-2 pt-4 border-t border-border/20">
                  <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                          Completed ({tasks.filter(t => t.completed).length})
                      </span>
                      <div className="h-px flex-1 bg-border/20"></div>
                  </div>
                  {tasks.filter(t => t.completed).map(task => (
                      <div key={task.id} className={`w-full relative ${activeMenuTaskId === task.id ? 'z-50' : 'z-10'}`}>
                          <div className="flex items-center gap-2 bg-muted/10 border border-border/20 rounded-xl px-3 h-14 opacity-55 hover:opacity-90 transition-opacity group">
                              <div className="w-6 flex items-center justify-center shrink-0">
                                  <button 
                                      onClick={() => toggleStatus(task)}
                                      className="w-5 h-5 rounded-md bg-emerald-500 border border-emerald-500 text-white flex items-center justify-center shrink-0 cursor-pointer"
                                  >
                                      <Check size={12} />
                                  </button>
                              </div>
                              <div className="flex-1 min-w-0 pr-2 flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-muted-foreground/45 line-through decoration-muted-foreground/30 leading-tight block truncate cursor-pointer hover:text-foreground transition-colors">
                                      {task.text}
                                  </span>
                              </div>
                              
                              {renderDropdown(task)}
                          </div>
                      </div>
                  ))}
              </div>
          )}

          {tasks.length === 0 && (
            <div className="text-center py-20 px-10 bg-muted/10 border-2 border-dashed border-border/40 rounded-2xl">
              <div className="w-16 h-16 bg-card border border-border/40 text-primary/70 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <List size={32} />
              </div>
              <h3 className="text-foreground font-black">Quick Notes is empty</h3>
              <p className="text-muted-foreground/60 font-medium text-sm mt-2">Start adding notes above!</p>
            </div>
          )}
        </div>

      </>
        )}

      <TaskCompletionModal 
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setActiveTask(null);
        }}
        onConfirm={(completedAt) => {
          if (activeTask) {
            executeStatusChange(activeTask, true, completedAt);
          }
          setTaskModalOpen(false);
          setActiveTask(null);
        }}
        taskTitle={activeTask?.text || ""}
      />
    </PageWrapper>
  );
}
