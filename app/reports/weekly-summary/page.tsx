"use client";
import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { PageHeader } from "@/components/PageHeader";

export default function WeeklySummaryPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const now = new Date();
      const thisWeekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const thisWeekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const lastWeekStart = format(startOfWeek(subDays(now, 7), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const lastWeekEnd = format(endOfWeek(subDays(now, 7), { weekStartsOn: 1 }), "yyyy-MM-dd");

      const [
        { data: thisExpenses }, { data: lastExpenses },
        { data: thisHabits }, { data: lastHabits },
        { data: habitConfigs },
        { data: thisWorkouts }, { data: lastWorkouts },
        { data: thisTasks }, { data: lastTasks },
      ] = await Promise.all([
        supabase.from("history_expenses").select("amount").eq("type", "Expense").gte("date", thisWeekStart).lte("date", thisWeekEnd),
        supabase.from("history_expenses").select("amount").eq("type", "Expense").gte("date", lastWeekStart).lte("date", lastWeekEnd),
        supabase.from("habit_data").select("habit_name, value").gte("date", thisWeekStart).lte("date", thisWeekEnd),
        supabase.from("habit_data").select("habit_name, value").gte("date", lastWeekStart).lte("date", lastWeekEnd),
        supabase.from("habit_config").select("habit_name").eq("is_active", true),
        supabase.from("workout_log").select("date, weight, reps").gte("date", thisWeekStart).lte("date", thisWeekEnd),
        supabase.from("workout_log").select("date, weight, reps").gte("date", lastWeekStart).lte("date", lastWeekEnd),
        supabase.from("tasks").select("status").eq("status", "Completed").gte("completed_at", thisWeekStart + "T00:00:00"),
        supabase.from("tasks").select("status").eq("status", "Completed").gte("completed_at", lastWeekStart + "T00:00:00").lte("completed_at", lastWeekEnd + "T23:59:59"),
      ]);

      const totalHabits = (habitConfigs || []).length;
      const habitPct = (habitData: any[]) => {
        if (totalHabits === 0) return 0;
        const done = (habitData || []).filter((h: any) => h.value && h.value !== "0" && h.value !== "false").length;
        return Math.round((done / (totalHabits * 7)) * 100);
      };
      const workoutVol = (wd: any[]) => (wd || []).reduce((s: number, w: any) => s + ((parseFloat(w.weight) || 0) * (parseInt(w.reps) || 0)), 0);
      const workoutDays = (wd: any[]) => new Set((wd || []).map((w: any) => w.date)).size;
      const totalSpend = (ed: any[]) => (ed || []).reduce((s: number, e: any) => s + (parseFloat(e.amount) || 0), 0);

      setData({
        this: {
          spend: totalSpend(thisExpenses || []),
          habitPct: habitPct(thisHabits || []),
          workoutDays: workoutDays(thisWorkouts || []),
          workoutVol: Math.round(workoutVol(thisWorkouts || [])),
          tasks: (thisTasks || []).length,
        },
        last: {
          spend: totalSpend(lastExpenses || []),
          habitPct: habitPct(lastHabits || []),
          workoutDays: workoutDays(lastWorkouts || []),
          workoutVol: Math.round(workoutVol(lastWorkouts || [])),
          tasks: (lastTasks || []).length,
        },
        thisLabel: `${thisWeekStart} → ${thisWeekEnd}`,
        lastLabel: `${lastWeekStart} → ${lastWeekEnd}`,
      });
      setLoading(false);
    }
    load();
  }, []);

  const diffPct = (curr: number, prev: number) => {
    if (prev === 0 && curr === 0) return "–";
    if (prev === 0) return "+100%";
    const d = Math.round(((curr - prev) / prev) * 100);
    return d > 0 ? `+${d}%` : `${d}%`;
  };

  const TrendIcon = ({ curr, prev, lowerIsBetter }: { curr: number; prev: number; lowerIsBetter?: boolean }) => {
    if (curr === prev) return <Minus size={13} className="text-muted-foreground" />;
    const good = lowerIsBetter ? curr < prev : curr > prev;
    return good ? <TrendingUp size={13} className="text-emerald-500" /> : <TrendingDown size={13} className="text-destructive" />;
  };

  const metrics = data ? [
    { label: "Weekly Spend", thisVal: `₹${Math.round(data.this.spend).toLocaleString("en-IN")}`, lastVal: `₹${Math.round(data.last.spend).toLocaleString("en-IN")}`, diff: diffPct(data.this.spend, data.last.spend), curr: data.this.spend, prev: data.last.spend, lowerIsBetter: true },
    { label: "Habit Consistency", thisVal: `${data.this.habitPct}%`, lastVal: `${data.last.habitPct}%`, diff: diffPct(data.this.habitPct, data.last.habitPct), curr: data.this.habitPct, prev: data.last.habitPct, lowerIsBetter: false },
    { label: "Workout Days", thisVal: `${data.this.workoutDays} days`, lastVal: `${data.last.workoutDays} days`, diff: diffPct(data.this.workoutDays, data.last.workoutDays), curr: data.this.workoutDays, prev: data.last.workoutDays, lowerIsBetter: false },
    { label: "Workout Volume", thisVal: `${data.this.workoutVol.toLocaleString()} kg·reps`, lastVal: `${data.last.workoutVol.toLocaleString()} kg·reps`, diff: diffPct(data.this.workoutVol, data.last.workoutVol), curr: data.this.workoutVol, prev: data.last.workoutVol, lowerIsBetter: false },
    { label: "Tasks Completed", thisVal: `${data.this.tasks} tasks`, lastVal: `${data.last.tasks} tasks`, diff: diffPct(data.this.tasks, data.last.tasks), curr: data.this.tasks, prev: data.last.tasks, lowerIsBetter: false },
  ] : [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 page-stagger-container">
      <PageHeader title="Weekly Progress Summary" />

      {loading ? (
        <div className="text-sm text-muted-foreground text-center py-16">Loading weekly data...</div>
      ) : (
        <>
          {/* Column Headers */}
          <div className="grid grid-cols-[1fr_120px_120px_80px] gap-3 items-center mb-3 px-4">
            <div />
            <div className="text-[9px] font-black text-primary uppercase tracking-widest">This Week</div>
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Last Week</div>
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Change</div>
          </div>

          {/* Metric Rows */}
          <div className="space-y-2">
            {metrics.map((m, i) => {
              const good = m.lowerIsBetter ? m.curr < m.prev : m.curr > m.prev;
              const neutral = m.curr === m.prev;
              const changeColor = neutral ? "text-muted-foreground" : good ? "text-emerald-600" : "text-destructive";
              return (
                <div key={i} className="bg-card border border-border rounded-xl p-4 shadow-zenith grid grid-cols-[1fr_120px_120px_80px] gap-3 items-center">
                  <div className="text-[12px] font-black text-foreground">{m.label}</div>
                  <div className="text-[15px] font-black text-foreground">{m.thisVal}</div>
                  <div className="text-[13px] font-bold text-muted-foreground">{m.lastVal}</div>
                  <div className={`flex items-center gap-1.5 text-[12px] font-black ${changeColor}`}>
                    <TrendIcon curr={m.curr} prev={m.prev} lowerIsBetter={m.lowerIsBetter} />
                    {m.diff}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Date Range Labels */}
          <div className="mt-6 flex flex-wrap gap-6 text-[10px] font-bold text-muted-foreground">
            <span><span className="text-primary">This week:</span> {data.thisLabel}</span>
            <span><span className="text-muted-foreground/50">Last week:</span> {data.lastLabel}</span>
          </div>
        </>
      )}
    </div>
  );
}
