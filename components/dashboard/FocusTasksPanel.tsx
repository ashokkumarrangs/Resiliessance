import React from 'react';
import Link from 'next/link';
import { KanbanSquare, CheckCircle2 } from 'lucide-react';

interface TaskItemData {
  id: string;
  task: string;
}

interface PendingTasks {
  todayHigh: TaskItemData[];
  todayNormal: TaskItemData[];
  thisWeek: TaskItemData[];
}

interface FocusTasksPanelProps {
  pendingTasks: PendingTasks;
  activeTaskIndex: number;
  setActiveTaskIndex: (idx: number) => void;
  handleCompleteTask: (id: string, name: string) => void;
  tasksDone: number;
  tasksTotal: number;
}

export function FocusTasksPanel({
  pendingTasks,
  activeTaskIndex,
  setActiveTaskIndex,
  handleCompleteTask,
  tasksDone,
  tasksTotal,
}: FocusTasksPanelProps) {
  return (
    <div className="bg-card rounded-md border border-border shadow-sm p-7 flex flex-col justify-between group hover:scale-[1.01] transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-black text-muted-foreground tracking-wider flex items-center gap-2">
          <KanbanSquare size={16} className="text-accent" /> Focus Tasks
        </div>
        <span className="text-[10px] font-black text-primary">{tasksDone}/{tasksTotal} Done</span>
      </div>
      
      <div 
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 py-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onScroll={(e) => {
          const el = e.currentTarget;
          const idx = Math.round(el.scrollLeft / el.clientWidth);
          if (idx !== activeTaskIndex && idx >= 0 && idx < 3) {
            setActiveTaskIndex(idx);
          }
        }}
      >
        {/* Page 1: Today (High Priority) */}
        <Link href="/tasks" className="min-w-full snap-center block flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-black text-rose-500 uppercase tracking-wider block mb-1">Today (High Priority)</span>
            <div className="space-y-1 pr-1">
              {(pendingTasks?.todayHigh?.length || 0) > 0 ? (
                pendingTasks.todayHigh.map((task, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs font-bold text-foreground group/item">
                    <div
                      role="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCompleteTask(task.id, task.task);
                      }}
                      className="w-4 h-4 rounded border border-border/80 hover:border-rose-500 hover:bg-rose-500/10 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    >
                      <div className="w-2 h-2 rounded bg-rose-500 scale-0 group-hover/item:scale-100 transition-transform duration-200" />
                    </div>
                    <span className="truncate">{task.task}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={13} /> All high-priority done
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Page 2: Today (Others) */}
        <Link href="/tasks" className="min-w-full snap-center block flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-black text-accent uppercase tracking-wider block mb-1">Today (Normal)</span>
            <div className="space-y-1 pr-1">
              {(pendingTasks?.todayNormal?.length || 0) > 0 ? (
                pendingTasks.todayNormal.map((task, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs font-bold text-foreground group/item">
                    <div
                      role="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCompleteTask(task.id, task.task);
                      }}
                      className="w-4 h-4 rounded border border-border/80 hover:border-accent hover:bg-accent/10 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    >
                      <div className="w-2 h-2 rounded bg-accent scale-0 group-hover/item:scale-100 transition-transform duration-200" />
                    </div>
                    <span className="truncate">{task.task}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={13} /> All normal tasks done
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Page 3: This Week */}
        <Link href="/tasks" className="min-w-full snap-center block flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-black text-primary uppercase tracking-wider block mb-1">This Week</span>
            <div className="space-y-1 pr-1">
              {(pendingTasks?.thisWeek?.length || 0) > 0 ? (
                pendingTasks.thisWeek.map((task, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs font-bold text-foreground group/item">
                    <div
                      role="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCompleteTask(task.id, task.task);
                      }}
                      className="w-4 h-4 rounded border border-border/80 hover:border-primary hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    >
                      <div className="w-2 h-2 rounded bg-primary scale-0 group-hover/item:scale-100 transition-transform duration-200" />
                    </div>
                    <span className="truncate">{task.task}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs font-bold text-muted-foreground/30">No weekly tasks pending</div>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-1.5 mt-3">
        {[0, 1, 2].map((idx) => (
          <div 
            key={idx} 
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === activeTaskIndex ? 'bg-primary w-3' : 'bg-primary/20'}`} 
          />
        ))}
      </div>
    </div>
  );
}
