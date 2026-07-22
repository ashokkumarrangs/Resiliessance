"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format, subDays } from "date-fns";
import { PageHeader } from "@/components/PageHeader";

type Entry = {
  id: string;
  date: string;
  time: string;
  category: string;
  label: string;
  sub: string;
};

const CATEGORIES = ["All", "Finance", "Habits", "Workout", "Pets", "Vehicles", "Tasks", "Events"];

const CAT_STYLE: Record<string, string> = {
  Finance: "bg-emerald-500/10 text-emerald-700 border-l-emerald-400",
  Habits:  "bg-amber-500/10 text-amber-700 border-l-amber-400",
  Workout: "bg-primary/10 text-primary border-l-primary",
  Pets:    "bg-rose-500/10 text-rose-700 border-l-rose-400",
  Vehicles:"bg-sky-500/10 text-sky-700 border-l-sky-400",
  Tasks:   "bg-violet-500/10 text-violet-700 border-l-violet-400",
  Events:  "bg-muted text-muted-foreground border-l-border",
};

const BADGE_STYLE: Record<string, string> = {
  Finance: "bg-emerald-500/10 text-emerald-700",
  Habits:  "bg-amber-500/10 text-amber-700",
  Workout: "bg-primary/10 text-primary",
  Pets:    "bg-rose-500/10 text-rose-700",
  Vehicles:"bg-sky-500/10 text-sky-700",
  Tasks:   "bg-violet-500/10 text-violet-700",
  Events:  "bg-muted text-muted-foreground",
};

export default function FilteredTimelinePage() {
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const days = 90;
      const minDate = format(subDays(new Date(), days), "yyyy-MM-dd");

      const [
        { data: expenses },
        { data: habitData },
        { data: workoutData },
        { data: petLogs },
        { data: fuelLogs },
        { data: taskData },
        { data: eventLogs },
      ] = await Promise.all([
        supabase.from("history_expenses").select("date, type, category, amount, notes, created_at").gte("date", minDate).order("date", { ascending: false }).limit(300),
        supabase.from("habit_data").select("date, habit, value").gte("date", minDate).order("date", { ascending: false }).limit(300),
        supabase.from("workout_log").select("date, workout_day, exercise, weight, reps, created_at").gte("date", minDate).order("date", { ascending: false }).limit(300),
        supabase.from("pet_logs").select("date, log_type, notes").gte("date", minDate).order("date", { ascending: false }).limit(200),
        supabase.from("vehicle_fuel_logs").select("date, liters, amount, notes").gte("date", minDate).order("date", { ascending: false }).limit(200),
        supabase.from("tasks").select("task, completed_at").eq("status", "Completed").gte("completed_at", minDate + "T00:00:00").order("completed_at", { ascending: false }).limit(200),
        supabase.from("event_log").select("date, event_type, value, notes, created_at").gte("date", minDate).order("date", { ascending: false }).limit(200),
      ]);

      const entries: Entry[] = [];
      let idx = 0;

      (expenses || []).forEach((e: any) => {
        entries.push({ id: `fin-${idx++}`, date: e.date, time: e.created_at ? format(new Date(e.created_at), "h:mm a") : "", category: "Finance", label: `${e.type}: ₹${parseFloat(e.amount || 0).toLocaleString("en-IN")} — ${e.category}`, sub: e.notes || "" });
      });
      (habitData || []).filter((h: any) => h.value && h.value !== "0" && h.value !== "false").forEach((h: any) => {
        entries.push({ id: `hab-${idx++}`, date: h.date, time: "", category: "Habits", label: `✓ ${h.habit}`, sub: `Value: ${h.value}` });
      });
      const wdMap: Record<string, any[]> = {};
      (workoutData || []).forEach((w: any) => { if (!wdMap[w.date]) wdMap[w.date] = []; wdMap[w.date].push(w); });
      Object.entries(wdMap).forEach(([date, ws]) => {
        entries.push({ id: `wkt-${idx++}`, date, time: "", category: "Workout", label: `${ws[0]?.workout_day} — ${ws.length} exercises`, sub: ws.map((w: any) => w.exercise).join(", ") });
      });
      (petLogs || []).forEach((p: any) => {
        entries.push({ id: `pet-${idx++}`, date: p.date, time: "", category: "Pets", label: `Pet: ${p.log_type}`, sub: p.notes || "" });
      });
      (fuelLogs || []).forEach((f: any) => {
        entries.push({ id: `veh-${idx++}`, date: f.date, time: "", category: "Vehicles", label: `Fuel: ${f.liters}L — ₹${parseFloat(f.amount || 0).toLocaleString("en-IN")}`, sub: f.notes || "" });
      });
      (taskData || []).forEach((t: any) => {
        const d = t.completed_at ? format(new Date(t.completed_at), "yyyy-MM-dd") : "";
        const time = t.completed_at ? format(new Date(t.completed_at), "h:mm a") : "";
        entries.push({ id: `tsk-${idx++}`, date: d, time, category: "Tasks", label: `✓ ${t.task}`, sub: "Completed" });
      });
      (eventLogs || []).forEach((e: any) => {
        entries.push({ id: `evt-${idx++}`, date: e.date, time: e.created_at ? format(new Date(e.created_at), "h:mm a") : "", category: "Events", label: `${e.event_type}: ${e.value}`, sub: e.notes || "" });
      });

      entries.sort((a, b) => b.date.localeCompare(a.date));
      setAllEntries(entries);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = allEntries;
    if (category !== "All") list = list.filter(e => e.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => e.label.toLowerCase().includes(q) || e.sub.toLowerCase().includes(q) || e.date.includes(q));
    }
    return list;
  }, [allEntries, category, search]);

  const grouped = useMemo(() => {
    const map: Record<string, Entry[]> = {};
    filtered.forEach(e => { if (!map[e.date]) map[e.date] = []; map[e.date].push(e); });
    return map;
  }, [filtered]);
  const groupedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 page-stagger-container">
      <PageHeader title="Activity Timeline">
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          {loading ? "Loading..." : `${filtered.length} entries`}
        </span>
      </PageHeader>

      {/* Search + Category Filters */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-zenith mb-6 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search entries..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-muted border border-border rounded-lg pl-8 pr-8 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring font-medium"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${
                category === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="text-sm text-muted-foreground text-center py-16">Loading 90 days of history...</div>
      ) : groupedDates.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-16">No entries match your search.</div>
      ) : (
        <div className="space-y-6">
          {groupedDates.map(date => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 mb-3">
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                  {format(new Date(date + "T00:00:00"), "EEEE, MMM d yyyy")}
                </div>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="space-y-2">
                {grouped[date].map(entry => (
                  <div key={entry.id} className={`bg-card border border-border rounded-xl p-3.5 flex items-start gap-3 shadow-zenith border-l-4 ${CAT_STYLE[entry.category] || ""}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${BADGE_STYLE[entry.category] || ""}`}>
                          {entry.category}
                        </span>
                        {entry.time && <span className="text-[10px] text-muted-foreground font-bold">{entry.time}</span>}
                      </div>
                      <div className="text-[13px] font-bold text-foreground truncate">{entry.label}</div>
                      {entry.sub && <div className="text-[10px] text-muted-foreground mt-0.5">{entry.sub}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
