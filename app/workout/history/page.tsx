"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { 
  format, subDays, differenceInDays, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameDay, parseISO 
} from "date-fns";
import { Activity, ArrowLeftCircle, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Dumbbell, Flame, TrendingUp, Trophy , BarChart2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SectionNav } from "@/components/SectionNav";
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

export default function WorkoutHistoryPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  
  // Day View States
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dayLogs, setDayLogs] = useState<WorkoutLog[]>([]);
  
  // Week View States
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return format(start, "yyyy-MM-dd");
  });
  const [weekLogs, setWeekLogs] = useState<WorkoutLog[]>([]);

  // PRs Max Weights mapping
  const [personalRecords, setPersonalRecords] = useState<Record<string, number>>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Fetch all historical max weights to identify PRs
  useEffect(() => {
    fetchPersonalRecords();
  }, []);

  // Fetch data based on mode and selectors
  useEffect(() => {
    if (viewMode === "day") {
      fetchDayLogs(selectedDate);
    } else {
      fetchWeekLogs(selectedWeekStart);
    }
  }, [viewMode, selectedDate, selectedWeekStart]);

  const fetchPersonalRecords = async () => {
    try {
      const { data } = await supabase
        .from("workout_log")
        .select("workout_name, weight");
      
      if (data) {
        const prMap: Record<string, number> = {};
        data.forEach(row => {
          const w = parseFloat(String(row.weight).replace(',', '.')) || 0;
          if (w > (prMap[row.workout_name] || 0)) {
            prMap[row.workout_name] = w;
          }
        });
        setPersonalRecords(prMap);
      }
    } catch (error) {
      console.error("Error fetching PRs:", error);
    }
  };

  const fetchDayLogs = async (dateStr: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("workout_log")
        .select("*")
        .eq("date", dateStr)
        .order("workout_name")
        .order("set_no");

      if (error) throw error;
      setDayLogs(data || []);
    } catch (error) {
      console.error("Error fetching day logs:", error);
      toast.error("Failed to load workout logs");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeekLogs = async (weekStartStr: string) => {
    setIsLoading(true);
    try {
      const start = parseISO(weekStartStr);
      const end = endOfWeek(start, { weekStartsOn: 1 });
      const endStr = format(end, "yyyy-MM-dd");

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
  };

  // Group day logs by exercise name for rendering
  const dayExercises = useMemo(() => {
    const groups: Record<string, { name: string; notes: string; sets: WorkoutLog[] }> = {};
    dayLogs.forEach(log => {
      if (!groups[log.workout_name]) {
        groups[log.workout_name] = {
          name: log.workout_name,
          notes: log.notes || "",
          sets: []
        };
      }
      groups[log.workout_name].sets.push(log);
    });
    return Object.values(groups);
  }, [dayLogs]);

  // Aggregate daily stats for week view
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
      
      // Group exercises for day details inside week view
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

  // Chart data for weekly volume progression
  const weekChartData = useMemo(() => {
    return weekDaysData.map(d => ({
      name: d.displayDate.split(",")[0], // e.g. "Mon"
      volume: d.totalVolume
    }));
  }, [weekDaysData]);

  // Navigate date or week
  const adjustDay = (days: number) => {
    const cur = parseISO(selectedDate);
    const next = format(subDays(cur, -days), "yyyy-MM-dd");
    setSelectedDate(next);
  };

  const adjustWeek = (weeks: number) => {
    const cur = parseISO(selectedWeekStart);
    const next = format(subDays(cur, -(weeks * 7)), "yyyy-MM-dd");
    setSelectedWeekStart(next);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        <PageHeader title="Workout History" >
        <div className="flex items-center gap-2">

          <Link 
            href="/reports/workout" 
            className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-muted-foreground/60 hover:text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
            title="View Reports"
          >
            <BarChart2 className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Link>
        </div>
      </PageHeader>
        <div className="-mt-2 mb-6">
          <SectionNav tabs={WORKOUT_TABS} />
        </div>

        <div className="space-y-6 w-full">
        {/* Toggle between Day & Week Views */}
        <SubNav 
          items={["Day View", "Week View"]} 
          activeItem={viewMode === "day" ? "Day View" : "Week View"} 
          onChange={(item) => setViewMode(item === "Day View" ? "day" : "week")} 
        />

        {/* ======================= DAY VIEW ======================= */}
        {viewMode === "day" && (
          <div className="space-y-6">
            {/* Date Navigator */}
            <div className="bg-card rounded-xl p-4 shadow-sm border border-border/40 flex items-center justify-between gap-4">
              <button onClick={() => adjustDay(-1)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <ChevronLeft size={20} className="text-primary" />
              </button>
              
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="text-sm font-black text-foreground">
                  {format(parseISO(selectedDate), "EEEE, dd MMMM yyyy")}
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-muted text-[10px] font-black uppercase tracking-wider text-primary border-none rounded-md px-2.5 py-1 focus:ring-1 focus:ring-accent/20"
                />
              </div>

              <button onClick={() => adjustDay(1)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <ChevronRight size={20} className="text-primary" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-md animate-spin"></div>
              </div>
            ) : dayLogs.length === 0 ? (
              <div className="bg-card border border-border/35 rounded-2xl py-12 px-6 text-center text-xs text-muted-foreground/60 font-bold">
                Rest Day. No exercises logged on this date.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Routine indicator */}
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
                  <Flame size={20} className="text-primary animate-pulse" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-wider leading-none">Routine Performed</span>
                    <span className="text-sm font-black text-foreground mt-1">{dayLogs[0].workout_day}</span>
                  </div>
                </div>

                {/* Exercises lists */}
                {dayExercises.map((ex, i) => (
                  <div key={i} className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-border/20 bg-muted/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Dumbbell size={16} className="text-primary" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-foreground">{ex.name}</h3>
                      </div>
                      <span className="text-[9px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded-full uppercase">
                        {ex.sets.length} Sets
                      </span>
                    </div>

                    <div className="p-5 space-y-4">
                      {ex.notes && (
                        <div className="text-[10px] italic text-muted-foreground/70 bg-muted/40 p-2.5 rounded-lg border border-border/10">
                          {ex.notes}
                        </div>
                      )}

                      <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-[11px] font-bold text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border/10 text-muted-foreground/60 uppercase tracking-widest text-[9px] font-black">
                              <th className="py-2 pr-4">Set</th>
                              <th className="py-2 pr-4">Weight</th>
                              <th className="py-2 pr-4">Reps</th>
                              <th className="py-2">Est. 1RM</th>
                              <th className="py-2 text-right">PR</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ex.sets.map((set, sIdx) => {
                              const est1RM = Math.round(set.weight * (1 + set.reps / 30));
                              const prWeight = personalRecords[ex.name] || 0;
                              const isPR = prWeight > 0 && set.weight >= prWeight;
                              
                              return (
                                <tr key={set.id} className="border-b border-border/5 hover:bg-muted/10">
                                  <td className="py-3 pr-4 text-muted-foreground/40 font-black">{set.set_no}</td>
                                  <td className="py-3 pr-4 text-foreground">{set.weight} kg</td>
                                  <td className="py-3 pr-4 text-foreground">{set.reps} reps</td>
                                  <td className="py-3 text-muted-foreground">{est1RM} kg</td>
                                  <td className="py-3 text-right">
                                    {isPR ? (
                                      <span className="inline-flex items-center gap-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                                        <Trophy size={10} /> PR
                                      </span>
                                    ) : "-"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================      WEEK VIEW ======================= */}
        {viewMode === "week" && (
          <div className="space-y-6">
            {/* Week Navigator */}
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

            {/* Weekly chart */}
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

            {/* Daily Summary Grid */}
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
                      {/* Day Header Summary */}
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

                      {/* Day Exercises Expansion Details */}
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
          )}
        </div>
      </div>
    </div>
  );
}
