import React from 'react';
import Link from 'next/link';
import { Activity } from 'lucide-react';

interface WorkoutDayDetail {
  logged: boolean;
  dayName: string;
  sets: number;
  volume: number;
  label: string;
}

interface WorkoutVolumePanelProps {
  workoutHistoryDetail: WorkoutDayDetail[];
  workoutHistory7Days: boolean[];
  activeWorkoutIndex: number;
  setActiveWorkoutIndex: (idx: number) => void;
  workoutScrollRef: React.RefObject<HTMLDivElement | null>;
}

export function WorkoutVolumePanel({
  workoutHistoryDetail,
  workoutHistory7Days,
  activeWorkoutIndex,
  setActiveWorkoutIndex,
  workoutScrollRef,
}: WorkoutVolumePanelProps) {
  return (
    <div className="bg-card rounded-md border border-border shadow-sm p-7 flex flex-col justify-between group hover:scale-[1.01] transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-black text-muted-foreground tracking-wider flex items-center gap-2">
          <Activity size={16} className="text-accent" /> Workout
        </div>
        <span className="text-[10px] font-black text-primary">
          {workoutHistoryDetail[activeWorkoutIndex]?.label || "Today"}
        </span>
      </div>

      <div 
        ref={workoutScrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 py-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onScroll={(e) => {
          const el = e.currentTarget;
          const idx = Math.round(el.scrollLeft / el.clientWidth);
          if (idx !== activeWorkoutIndex && idx >= 0 && idx < 7) {
            setActiveWorkoutIndex(idx);
          }
        }}
      >
        {workoutHistoryDetail && workoutHistoryDetail.length > 0 ? (
          workoutHistoryDetail.map((dayData, index) => (
            <Link key={index} href="/workout" className="min-w-full snap-center block flex flex-col justify-between space-y-1.5">
              <div className={`text-[20px] font-black leading-tight tracking-tight ${dayData.logged ? 'text-emerald-500 truncate' : 'text-muted-foreground/30'}`}>
                {dayData.logged ? dayData.dayName || "Logged" : "Not Logged"}
              </div>
              <div className="text-[9px] font-bold text-muted-foreground/60 tracking-tight">
                {dayData.logged ? `${dayData.sets} Sets • ${dayData.volume.toLocaleString()} kg Volume` : (index === 6 ? "Swipe right to see yesterday's status" : "No workout logged on this day")}
              </div>
              <div className="h-2.5 flex items-end gap-1 mt-1.5">
                 {workoutHistory7Days.length > 0 ? workoutHistory7Days.map((isDone, i) => {
                    const isCurrentDay = i === index;
                    return (
                      <div 
                        key={i} 
                        className={`rounded-md transition-all duration-300 ${
                          isCurrentDay 
                            ? (isDone ? 'bg-emerald-500 h-2.5 shadow-sm shadow-emerald-500/30' : 'bg-primary h-2.5 shadow-sm shadow-primary/30') 
                            : (isDone ? 'bg-emerald-500/40 h-1.5' : 'bg-muted h-1.5')
                        }`} 
                        style={{ flex: 1 }}
                      />
                    );
                 }) : (
                    [1,2,3,4,5,6,7].map(i => <div key={i} className="flex-1 rounded-md bg-muted h-1.5" />)
                 )}
              </div>
            </Link>
          ))
        ) : (
          <Link href="/workout" className="min-w-full snap-center block flex flex-col justify-between space-y-1.5">
            <div className="text-[20px] font-black leading-tight tracking-tight text-muted-foreground/30">
              Not Logged
            </div>
            <div className="text-[9px] font-bold text-muted-foreground/60 tracking-tight">
              Loading history...
            </div>
            <div className="h-1.5 flex gap-1 mt-1">
              {[1,2,3,4,5,6,7].map(i => <div key={i} className="flex-1 rounded-md bg-muted" />)}
            </div>
          </Link>
        )}
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-1.5 mt-3">
        {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
          <div 
            key={idx} 
            className={`w-1 h-1 rounded-full transition-all duration-300 ${idx === activeWorkoutIndex ? 'bg-primary w-2.5' : 'bg-primary/20'}`} 
          />
        ))}
      </div>
    </div>
  );
}
