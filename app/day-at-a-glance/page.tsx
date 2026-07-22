"use client";
import React, { useState, useEffect } from "react";
import { CheckCircle2, Circle, Dumbbell, Flame, CheckSquare, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { PageHeader } from "@/components/PageHeader";

type TaskItem = { id: string; task: string; status: string; is_high_priority: boolean };
type HabitItem = { habit_name: string; done: boolean; group_name: string };
type WorkoutItem = { workout_day: string; exercise: string; sets: string; reps: string; weight: string };
type EventItem = { event_type: string; value: string | number; notes: string; created_at: string };

export default function DayAtAGlancePage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [
        { data: tasksData },
        { data: habitConfigs },
        { data: habitData },
        { data: workoutData },
        { data: eventData },
      ] = await Promise.all([
        supabase.from("tasks").select("id, task, status, is_high_priority").eq("is_today", true),
        supabase.from("habit_config").select("habit_name, group_name").eq("is_active", true),
        supabase.from("habit_data").select("habit, value").eq("date", today),
        supabase.from("workout_log").select("workout_day, exercise, sets, reps, weight").eq("date", today),
        supabase.from("event_log").select("event_type, value, notes, created_at").eq("date", today).order("created_at"),
      ]);

      const doneHabits = new Set(
        (habitData || [])
          .filter((h: any) => h.value && h.value !== "0" && h.value !== "false")
          .map((h: any) => h.habit)
      );
      setTasks(tasksData || []);
      setHabits((habitConfigs || []).map((h: any) => ({ habit_name: h.habit_name, group_name: h.group_name, done: doneHabits.has(h.habit_name) })));
      setWorkouts(workoutData || []);
      setEvents(eventData || []);
      setLoading(false);
    }
    load();
  }, []);

  const tasksDone = tasks.filter(t => t.status === "Completed").length;
  const habitsDone = habits.filter(h => h.done).length;
  const workoutLogged = workouts.length > 0;

  const sections = [
    {
      time: "Habits",
      icon: <CheckCircle2 size={15} className="text-amber-500" />,
      accent: "bg-amber-500/10 text-amber-600",
      dot: "border-amber-400 bg-amber-50",
      items: habits.length > 0
        ? [{ label: `${habitsDone} of ${habits.length} habits completed`, done: habitsDone === habits.length, sub: habits.filter(h => !h.done).map(h => h.habit_name).join(", ") || "All complete!" }]
        : [{ label: "No habits configured", done: false, sub: "" }],
    },
    {
      time: "Tasks",
      icon: <CheckSquare size={15} className="text-primary" />,
      accent: "bg-primary/10 text-primary",
      dot: "border-primary bg-primary/5",
      items: tasks.length > 0
        ? tasks.map(t => ({ label: t.task, done: t.status === "Completed", sub: t.is_high_priority ? "High Priority" : "Normal" }))
        : [{ label: "No tasks for today", done: false, sub: "" }],
    },
    {
      time: "Workout",
      icon: <Dumbbell size={15} className="text-emerald-600" />,
      accent: "bg-emerald-500/10 text-emerald-600",
      dot: "border-emerald-400 bg-emerald-50",
      items: workoutLogged
        ? [{ label: `${workouts[0]?.workout_day} — ${workouts.length} exercises logged`, done: true, sub: workouts.map(w => w.exercise).join(", ") }]
        : [{ label: "No workout logged today", done: false, sub: "" }],
    },
    {
      time: "Events",
      icon: <Flame size={15} className="text-rose-500" />,
      accent: "bg-rose-500/10 text-rose-600",
      dot: "border-rose-400 bg-rose-50",
      items: events.length > 0
        ? events.map(e => ({ label: `${e.event_type}: ${e.value}`, done: true, sub: e.notes || "" }))
        : [{ label: "No events logged today", done: false, sub: "" }],
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 page-stagger-container">
      <PageHeader title="Day at a Glance">
        <span className="text-[11px] font-black text-muted-foreground">{format(new Date(), "EEEE, MMM d")}</span>
      </PageHeader>

      {loading ? (
        <div className="text-sm text-muted-foreground text-center py-16">Loading your day...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: "Tasks", value: `${tasksDone}/${tasks.length}`, done: tasksDone === tasks.length && tasks.length > 0, icon: <CheckSquare size={13} /> },
              { label: "Habits", value: `${habitsDone}/${habits.length}`, done: habitsDone === habits.length && habits.length > 0, icon: <CheckCircle2 size={13} /> },
              { label: "Workout", value: workoutLogged ? `${workouts.length} sets` : "None", done: workoutLogged, icon: <Dumbbell size={13} /> },
            ].map((s, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 shadow-zenith">
                <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest mb-2 ${s.done ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {s.icon} {s.label}
                </div>
                <div className={`text-xl font-black ${s.done ? "text-emerald-600" : "text-foreground"}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical connector */}
            <div className="absolute left-5 top-5 bottom-5 w-px bg-border" />

            {sections.map((sec, si) => (
              <div key={si} className="flex gap-5 mb-6">
                {/* Icon dot */}
                <div className={`w-10 h-10 rounded-full border-2 ${sec.dot} flex items-center justify-center flex-shrink-0 z-10 shadow-sm`}>
                  {sec.icon}
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <div className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mb-3 ${sec.accent}`}>
                    {sec.time}
                  </div>
                  <div className="space-y-2">
                    {sec.items.map((item, ii) => (
                      <div key={ii} className="bg-card border border-border rounded-xl p-3.5 flex items-start gap-3 shadow-zenith">
                        {item.done
                          ? <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                          : <Circle size={14} className="text-border mt-0.5 flex-shrink-0" />
                        }
                        <div>
                          <div className={`text-[13px] font-bold ${item.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{item.label}</div>
                          {item.sub && <div className="text-[10px] text-muted-foreground mt-0.5">{item.sub}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
