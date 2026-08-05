import React from 'react';
import Link from 'next/link';
import { KanbanSquare, CheckCircle2 } from 'lucide-react';

interface SquareShiftTask {
  id: string;
  text: string;
}

interface SquareShiftProject {
  name: string;
  todoCount: number;
  tasks: SquareShiftTask[];
}

interface SquareShiftProjectsPanelProps {
  squareShiftProjects: SquareShiftProject[];
  activeProjectIndex: number;
  setActiveProjectIndex: (idx: number) => void;
  handleCompleteSquareShiftTask: (id: string, text: string) => void;
}

export function SquareShiftProjectsPanel({
  squareShiftProjects,
  activeProjectIndex,
  setActiveProjectIndex,
  handleCompleteSquareShiftTask,
}: SquareShiftProjectsPanelProps) {
  return (
    <div className="bg-card rounded-md border border-border shadow-sm p-7 flex flex-col justify-between group hover:scale-[1.01] transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-black text-muted-foreground tracking-wider flex items-center gap-2">
          <KanbanSquare size={16} className="text-accent" /> SquareShift
        </div>
        <span className="text-[10px] font-black text-primary">
          {squareShiftProjects.reduce((s, p) => s + p.todoCount, 0)} Tasks
        </span>
      </div>

      <div 
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 py-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onScroll={(e) => {
          const el = e.currentTarget;
          const idx = Math.round(el.scrollLeft / el.clientWidth);
          if (idx !== activeProjectIndex && idx >= 0 && idx < squareShiftProjects.length) {
            setActiveProjectIndex(idx);
          }
        }}
      >
        {squareShiftProjects.length > 0 ? (
          squareShiftProjects.map((p, i) => (
            <Link key={i} href="/squareshift" className="min-w-full snap-center block flex flex-col justify-start">
              <div className="flex items-center justify-between pb-1 border-b border-border/10">
                <span className="truncate text-xs font-black text-foreground max-w-[120px]">{p.name}</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${ p.todoCount > 0 ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground/40' }`}>
                  {p.todoCount} pending
                </span>
              </div>
              
              {/* Task list for this project */}
              <div className="space-y-1 my-2">
                {p.tasks.length > 0 ? (
                  p.tasks.slice(0, 3).map((task, taskIdx) => (
                    <div key={taskIdx} className="flex items-center gap-2.5 text-xs font-bold text-foreground group/item">
                      <div
                        role="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCompleteSquareShiftTask(task.id, task.text);
                        }}
                        className="w-4 h-4 rounded border border-border/80 hover:border-accent hover:bg-accent/10 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                      >
                        <div className="w-2 h-2 rounded bg-accent scale-0 group-hover/item:scale-100 transition-transform duration-200" />
                      </div>
                      <span className="truncate">{task.text}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={12} /> All tasks completed
                  </div>
                )}
              </div>
            </Link>
          ))
        ) : (
          <div className="min-w-full text-xs font-bold text-muted-foreground/30 py-2 text-center snap-center">No active projects</div>
        )}
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-1.5 mt-3">
        {squareShiftProjects.length > 1 && squareShiftProjects.map((_, idx) => (
          <div 
            key={idx} 
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === activeProjectIndex ? 'bg-primary w-3' : 'bg-primary/20'}`} 
          />
        ))}
      </div>
    </div>
  );
}
