"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { format, subDays, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Dumbbell, Flame, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PageWrapper } from "@/components/PageWrapper";
import { SubNav } from "@/components/SubNav";
import { WORKOUT_TABS } from "@/lib/navigation";

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

export default function WorkoutHistoryDayPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dayLogs, setDayLogs] = useState<WorkoutLog[]>([]);
  const [personalRecords, setPersonalRecords] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  async function fetchPersonalRecords() {
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
  }

  async function fetchDayLogs(dateStr: string) {
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
  }

  useEffect(() => {
    fetchPersonalRecords();
  }, []);

  useEffect(() => {
    fetchDayLogs(selectedDate);
  }, [selectedDate]);

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

  const adjustDay = (days: number) => {
    const cur = parseISO(selectedDate);
    const next = format(subDays(cur, -days), "yyyy-MM-dd");
    setSelectedDate(next);
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
          activeItem="Day View" 
          onChange={(item) => {
            if (item === "Week View") router.push("/workout/history/week");
          }} 
        />

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
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
              <Flame size={20} className="text-primary animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-wider leading-none">Routine Performed</span>
                <span className="text-sm font-black text-foreground mt-1">{dayLogs[0].workout_day}</span>
              </div>
            </div>

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
    </PageWrapper>
  );
}
