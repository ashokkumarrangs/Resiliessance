"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  format, subDays, startOfWeek, endOfWeek, 
  eachDayOfInterval, parseISO 
} from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Dumbbell, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PageWrapper } from "@/components/PageWrapper";
import { SubNav } from "@/components/SubNav";
import { WORKOUT_TABS } from "@/lib/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface WorkoutLog {
  id: string;
  date: string;
  workout_day: string;
  workout_name: string;
  set_no: number;
  weight: number;
  reps: number;
  notes?: string;
}

export default function WorkoutHistoryWeekPage() {
  const router = useRouter();
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return format(start, "yyyy-MM-dd");
  });
  const [weekLogs, setWeekLogs] = useState<WorkoutLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  async function fetchWeekLogs(weekStartStr: string) {
    setIsLoading(true);
    try {
      const start = parseISO(weekStartStr);
      const end = endOfWeek(start, { weekStartsOn: 1 });

      const { data, error } = await supabase
        .from("workout_log")
        .select("*")
        .gte("date", start.toISOString())
        .lte("date", new Date(end.setHours(23, 59, 59, 999)).toISOString())
        .order("date")
        .order("workout_name")
        .order("set_no");

      if (error) throw error;
      setWeekLogs(data || []);
    } catch (error) {
      console.error("Error fetching week logs:", error);
      toast.error("Failed to load weekly logs");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchWeekLogs(selectedWeekStart);
  }, [selectedWeekStart]);

  const weekDaysData = useMemo(() => {
    const start = parseISO(selectedWeekStart);
    const interval = eachDayOfInterval({ start, end: endOfWeek(start, { weekStartsOn: 1 }) });
    
    return interval.map(day => {
      const dStr = format(day, "yyyy-MM-dd");
      const logs = weekLogs.filter(log => log.date === dStr);
      const routine = logs.length > 0 ? logs[0].workout_day : "Rest Day";
      
      const exerciseNames = new Set(logs.map(l => l.workout_name));
      const totalSets = logs.length;
      const totalVolume = logs.reduce((sum, l) => sum + (l.weight * l.reps), 0);
      
      const groups: Record<string, { name: string; sets: WorkoutLog[] }> = {};
      logs.forEach(log => {
        if (!groups[log.workout_name]) {
          groups[log.workout_name] = { name: log.workout_name, sets: [] };
        }
        groups[log.workout_name].sets.push(log);
      });

      return {
        dateStr: dStr,
        displayDate: format(day, "eee, dd MMM"),
        routine,
        exercisesCount: exerciseNames.size,
        totalSets,
        totalVolume,
        exercises: Object.values(groups)
      };
    });
  }, [selectedWeekStart, weekLogs]);

  const weekChartData = useMemo(() => {
    return weekDaysData.map(d => ({
      name: d.displayDate.split(",")[0],
      volume: d.totalVolume
    }));
  }, [weekDaysData]);

  const adjustWeek = (weeks: number) => {
    const cur = parseISO(selectedWeekStart);
    const next = format(subDays(cur, -(weeks * 7)), "yyyy-MM-dd");
    setSelectedWeekStart(next);
  };

  return (
    <PageWrapper
      title="Workout History"
      reportHref="/reports/workout"
      sectionTabs={WORKOUT_TABS}
    >
      <div className="space-y-6 w-full animate-fadeIn">
        <SubNav 
          items={["Day View", "Week View"]} 
          activeItem="Week View" 
          onChange={(item) => {
            if (item === "Day View") router.push("/workout/history/day");
          }} 
        />

        <div className="bg-card rounded-xl p-4 shadow-sm border border-border/40 flex items-center justify-between gap-4">
          <button onClick={() => adjustWeek(-1)} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-primary" />
          </button>
          
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <div className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest leading-none">
              Select Week
            </div>
            <div className="text-sm font-black text-foreground text-center">
              {format(parseISO(selectedWeekStart), "dd MMM")} – {format(endOfWeek(parseISO(selectedWeekStart), { weekStartsOn: 1 }), "dd MMM yyyy")}
            </div>
            <input
              type="date"
              value={selectedWeekStart}
              onChange={(e) => {
                const start = startOfWeek(new Date(e.target.value), { weekStartsOn: 1 });
                setSelectedWeekStart(format(start, "yyyy-MM-dd"));
              }}
              className="bg-muted text-[10px] font-black uppercase tracking-wider text-primary border-none rounded-md px-2.5 py-1 focus:ring-1 focus:ring-accent/20"
            />
          </div>

          <button onClick={() => adjustWeek(1)} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ChevronRight size={20} className="text-primary" />
          </button>
        </div>

        {weekLogs.length > 0 && (
          <div className="bg-card rounded-2xl border border-border/40 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-primary" />
              <h3 className="text-xs font-black uppercase tracking-widest text-foreground/60">Weekly Volume (kg)</h3>
            </div>
            <div className="h-[150px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 8, fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={v => v > 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                  <Tooltip contentStyle={{ fontSize: 10, fontWeight: 700, borderRadius: 8 }} />
                  <Bar dataKey="volume" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-md animate-spin"></div>
            </div>
          ) : (
            weekDaysData.map((dayData, idx) => {
              const isExpanded = expandedDay === dayData.dateStr;
              const isRestDay = dayData.exercisesCount === 0;

              return (
                <div 
                  key={idx} 
                  className={`bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden transition-all ${ isRestDay ? "opacity-60" : "" }`}
                >
                  <div 
                    onClick={() => !isRestDay && setExpandedDay(isExpanded ? null : dayData.dateStr)}
                    className={`px-5 py-4 flex items-center justify-between select-none ${ isRestDay ? "cursor-default" : "cursor-pointer hover:bg-muted/10" }`}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                        {dayData.displayDate}
                      </span>
                      <span className="text-xs font-black text-foreground">
                        {dayData.routine}
                      </span>
                    </div>

                    {!isRestDay ? (
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end gap-0.5 text-right">
                          <span className="text-[10px] font-black text-primary uppercase">
                            {dayData.exercisesCount} Ex / {dayData.totalSets} Sets
                          </span>
                          <span className="text-[9px] font-bold text-muted-foreground/50 leading-none">
                            Vol: {dayData.totalVolume.toLocaleString()} kg
                          </span>
                        </div>
                        <div className="text-muted-foreground/60">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">
                        Rest
                      </span>
                    )}
                  </div>

                  {isExpanded && !isRestDay && (
                    <div className="px-5 pb-5 border-t border-border/10 bg-muted/5 space-y-4 pt-4">
                      {dayData.exercises.map((ex, exIdx) => (
                        <div key={exIdx} className="bg-card p-4 rounded-xl border border-border/30 space-y-2">
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                            <Dumbbell size={12} className="text-primary" /> {ex.name}
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {ex.sets.map((set, setIdx) => (
                              <span 
                                key={setIdx} 
                                className="bg-muted px-2.5 py-1 rounded text-[9px] font-bold text-muted-foreground flex items-center gap-0.5"
                              >
                                {set.weight}kg x {set.reps}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
