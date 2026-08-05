"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
    Folder, Notebook, Plus, Check, Edit3, Trash2, GripVertical, List, Eye, EyeOff
} from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SectionNav } from "@/components/SectionNav";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { TaskCompletionModal } from "@/components/TaskCompletionModal";

const NOTES_ID = "__notes__";

export default function SquareShiftProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
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

  useEffect(() => {
    Promise.all([fetchProjects(), fetchTasks()]).then(() => setIsLoading(false));
  }, [projectId]);

  const fetchProjects = async () => {
    const { data } = await supabase.from("action_projects").select("*").order("sort_order");
    if (data) setProjects(data);
  };

  const fetchTasks = async () => {
    const { data } = await supabase.from("action_tasks").select("*").order("sort_order");
    if (data) {
      setTasks(data.filter(t => t.project_id === projectId));
      
      // Calculate open task counts per project
      const counts: Record<string, number> = {};
      data.forEach(t => {
        if (!t.completed) {
          const pid = t.project_id || NOTES_ID;
          counts[pid] = (counts[pid] || 0) + 1;
        }
      });
      setOpenCounts(counts);
    }
  };

  const addTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskText.trim()) return;
    const { data, error } = await supabase.from('action_tasks').insert({
        id: crypto.randomUUID(),
        text: newTaskText.trim(),
        project_id: projectId,
        completed: false,
        sort_order: tasks.length
    }).select();
    if (!error && data) {
        setNewTaskText("");
        fetchTasks();
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
      toast.error("Failed to update task status");
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this task?")) return;
    const { error } = await supabase.from('action_tasks').delete().eq('id', id);
    if (!error) fetchTasks();
  };

  const handleRename = async (task: any) => {
    const newName = prompt("Rename task:", task.text);
    if (newName && newName.trim()) {
        await supabase.from('action_tasks').update({ text: newName }).eq('id', task.id);
        fetchTasks();
    }
  };

  const createProject = async () => {
      const name = prompt("New project name:");
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

  const currentProject = projects.find(p => p.id === projectId);

  const handleRenameProject = async () => {
    if (!currentProject) return;
    const newName = prompt("Rename project:", currentProject.name);
    if (newName && newName.trim() && newName.trim() !== currentProject.name) {
      const { error } = await supabase
        .from('action_projects')
        .update({ name: newName.trim() })
        .eq('id', projectId);
      if (!error) {
        toast.success(`Project renamed to "${newName.trim()}"`); 
        fetchProjects();
      } else {
        toast.error("Failed to rename project");
      }
    }
  };

  const handleDeleteProject = async () => {
    if (!currentProject) return;
    const confirmed = confirm(`Are you sure you want to delete the project "${currentProject.name}" and all its tasks? This action cannot be undone.`);
    if (!confirmed) return;
    const { error } = await supabase
      .from('action_projects')
      .delete()
      .eq('id', projectId);
    if (!error) {
      toast.success(`Project "${currentProject.name}" deleted`);
      router.push('/squareshift/notes');
    } else {
      toast.error("Failed to delete project");
    }
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
          <LoadingScreen message="Synthesizing project matrix..." />
        ) : (
          <>
            <div className="-mt-2 mb-6">
          <SectionNav tabs={[
            {
              title: `Notes${openCounts[NOTES_ID] ? ` (${openCounts[NOTES_ID]})` : ""}`,
              icon: <Notebook size={16} />,
              isActive: false,
              onClick: () => router.push("/squareshift/notes"),
            },
            ...projects.map(proj => ({
              title: `${proj.name}${openCounts[proj.id] ? ` (${openCounts[proj.id]})` : ""}`,
              icon: <Folder size={16} />,
              isActive: proj.id === projectId,
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

        {/* Project Header */}
        {currentProject && (
          <div className="flex items-center justify-between mb-5 group">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center shrink-0">
                <Folder size={15} className="text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-black text-foreground leading-none">{currentProject.name}</h2>
                <p className="text-[10px] text-muted-foreground/50 font-medium mt-0.5 uppercase tracking-wide">
                  {openCounts[projectId] ?? 0} open task{openCounts[projectId] !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleRenameProject}
                title="Rename project"
                className="p-1.5 text-muted-foreground/40 hover:text-primary hover:bg-primary/10 rounded-lg cursor-pointer transition-colors"
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={handleDeleteProject}
                title="Delete project"
                className="p-1.5 text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Input Area matches Task Manager */}
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border/40 flex flex-col gap-3">
            <div className="flex gap-2">
                <input 
                    type="text" 
                    placeholder="Capture something to do..."
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
              <div className="grid gap-2 px-3 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest grid-cols-[24px_22px_1fr_64px]">
                <span></span>
                <span></span>
                <span>Task</span>
                <span className="text-right">Actions</span>
              </div>
          )}
          
          <div className="space-y-3">
            {tasks.filter(t => !t.completed).map(task => (
                <div key={task.id} className="w-full">
                    <div className="flex items-center gap-2 bg-card border border-border/40 border-l-4 border-l-primary/60 rounded-xl px-3 h-14 shadow-sm transition-all group">
                        <div className="w-6 flex items-center justify-center text-muted-foreground/20 hover:text-primary cursor-grab active:cursor-grabbing shrink-0">
                            <GripVertical size={16} />
                        </div>
                        <div className="w-6 flex items-center justify-center shrink-0">
                            <button 
                                onClick={() => toggleStatus(task)}
                                className="w-5 h-5 rounded-md border border-border/40 text-muted-foreground/30 hover:border-primary hover:text-primary flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                            >
                                <Check size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                        <div className="flex-1 min-w-0 pr-2 flex items-center gap-1.5">
                            <span className="text-xs leading-tight block truncate cursor-pointer hover:text-primary transition-colors flex items-center gap-1.5 font-bold text-foreground/90">
                                {task.text}
                            </span>
                        </div>
                        
                        <div className="w-16 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-card shrink-0">
                            <button onClick={() => handleRename(task)} className="p-1 text-muted-foreground/40 hover:text-primary hover:bg-muted rounded-md cursor-pointer"><Edit3 size={13} /></button>
                            <button onClick={() => handleDelete(task.id)} className="p-1 text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-md cursor-pointer"><Trash2 size={13} /></button>
                        </div>
                    </div>
                </div>
            ))}
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
                      <div key={task.id} className="w-full">
                          <div className="flex items-center gap-2 bg-muted/10 border border-border/20 rounded-xl px-3 h-14 opacity-55 hover:opacity-90 transition-opacity group">
                              <div className="w-6 flex items-center justify-center text-muted-foreground/20 shrink-0">
                                  <GripVertical size={16} />
                              </div>
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
                              
                              <div className="w-16 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-transparent shrink-0">
                                  <button onClick={() => handleDelete(task.id)} className="p-1 text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-md cursor-pointer"><Trash2 size={13} /></button>
                              </div>
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
              <h3 className="text-foreground font-black">Project is empty</h3>
              <p className="text-muted-foreground/60 font-medium text-sm mt-2">Start adding tasks above!</p>
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
