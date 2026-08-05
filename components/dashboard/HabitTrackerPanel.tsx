import React from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

interface HabitCategory {
  name: string;
  done: number;
  total: number;
}

interface HabitTrackerPanelProps {
  habitsCategories: HabitCategory[];
  habitsDone: number;
  habitsTotal: number;
}

export function HabitTrackerPanel({
  habitsCategories,
  habitsDone,
  habitsTotal,
}: HabitTrackerPanelProps) {
  return (
    <Link href="/habits/daily-log" className="bg-card rounded-md border border-border shadow-sm p-7 group hover:scale-[1.01] transition-all grid grid-rows-[auto_1fr_auto] gap-4 min-h-[220px]">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-black text-muted-foreground tracking-wider flex items-center gap-2">
          <CheckCircle2 size={16} className="text-accent" /> Habits
        </div>
      </div>
      
      <div className="flex flex-col space-y-5 py-1">
        {habitsCategories.length > 0 ? (
          habitsCategories.map((cat, i) => {
            const pct = cat.total > 0 ? Math.round((cat.done / cat.total) * 100) : 0;
            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="truncate text-foreground capitalize max-w-[100px]">{cat.name}</span>
                  <span className="text-[9px] text-muted-foreground font-black">{pct}% ({cat.done}/{cat.total})</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-xs font-bold text-muted-foreground/30 py-2">No habits configured</div>
        )}
      </div>
      
      <div className="pt-4 border-t border-border/10 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-black">
          <span className="text-muted-foreground">Overall</span>
          <span className="text-primary font-black">
            {habitsTotal > 0 ? Math.round((habitsDone / habitsTotal) * 100) : 0}% ({habitsDone}/{habitsTotal})
          </span>
        </div>
        <div className="bg-muted rounded-md h-1.5 w-full overflow-hidden">
          <div 
            className="bg-primary h-full transition-all" 
            style={{ width: habitsTotal > 0 ? `${(habitsDone / habitsTotal) * 100}%` : '0%' }}
          />
        </div>
      </div>
    </Link>
  );
}
