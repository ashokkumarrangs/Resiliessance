"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle2,
  FileCheck,
  GraduationCap,
  KanbanSquare,
  PlusCircle,
  Wallet,
  Car,
  Flame,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dog,
  Package,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SectionNav } from "@/components/SectionNav";
import { supabase } from "@/lib/supabase";

const NOTES_ID = "__notes__";

export default function ActivityTimelinePage() {
  const [timelineDate, setTimelineDate] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState<boolean>(true);
  const dateInputRef = React.useRef<HTMLInputElement>(null);

  const adjustDate = (days: number) => {
    const parts = timelineDate.split("-");
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const d = new Date(year, month, day);
    d.setDate(d.getDate() + days);
    
    const nextYear = d.getFullYear();
    const nextMonth = String(d.getMonth() + 1).padStart(2, '0');
    const nextDay = String(d.getDate()).padStart(2, '0');
    setTimelineDate(`${nextYear}-${nextMonth}-${nextDay}`);
  };

  const handleDateClick = () => {
    if (dateInputRef.current) {
      try {
        dateInputRef.current.showPicker();
      } catch (e) {
        dateInputRef.current.click();
      }
    }
  };

  const parseTimeString = (timeStr: string | null) => {
    if (!timeStr) return null;
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minutesStr = minutes < 10 ? '0' + minutes : minutes;
      return `${hours}:${minutesStr} ${ampm}`;
    }
    return null;
  };

  const getSortMs = (dateStr: string, timeStr?: string | null, fallbackTimestamp?: string | null) => {
    if (timeStr) {
      const d = new Date(`${dateStr}T${timeStr}:00`);
      if (!isNaN(d.getTime())) return d.getTime();
    }
    if (fallbackTimestamp) {
      const d = new Date(fallbackTimestamp);
      if (!isNaN(d.getTime())) return d.getTime();
    }
    const d = new Date(`${dateStr}T00:00:00`);
    return d.getTime();
  };


  const formatTime = (timestampStr: string | null, customTimeStr?: string | null) => {
    if (customTimeStr) {
      const parsed = parseTimeString(customTimeStr);
      if (parsed) return parsed;
    }
    if (!timestampStr) return null;
    try {
      if (timestampStr.length <= 10) return null;
      const date = new Date(timestampStr);
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minutesStr = minutes < 10 ? '0' + minutes : minutes;
      return `${hours}:${minutesStr} ${ampm}`;
    } catch (e) {
      return null;
    }
  };


  const fetchTimelineData = async (dateStr: string) => {
    setIsTimelineLoading(true);
    try {
      const [
        { data: expenses },
        { data: habits },
        { data: events },
        { data: skillLogs },
        { data: skillsConfig },
        { data: workouts },
        { data: fuel },
        { data: service },
        { data: mileage },
        { data: vehicles },
        { data: tasks },
        { data: actionTasks },
        { data: petLogs },
        { data: petProfiles },
        { data: inventoryItems },
        { data: inventoryLocations },
        { data: habitsConfig }
      ] = await Promise.all([
        supabase.from('history_expenses').select('*').eq('date', dateStr),
        supabase.from('habit_data').select('*').eq('date', dateStr),
        supabase.from('event_log').select('*').eq('date', dateStr),
        supabase.from('skill_logs').select('*').eq('date', dateStr),
        supabase.from('skills').select('id, name'),
        supabase.from('workout_log').select('*').eq('date', dateStr),
        supabase.from('vehicle_fuel_logs').select('*').eq('date', dateStr),
        supabase.from('vehicle_service_logs').select('*').eq('date', dateStr),
        supabase.from('vehicle_mileage_logs').select('*').eq('date', dateStr),
        supabase.from('vehicle_config').select('id, vehicle_name'),
        supabase.from('tasks').select('*').eq('status', 'Completed'),
        supabase.from('action_tasks').select('*').eq('completed', true),
        supabase.from('pet_logs').select('*').eq('date', dateStr),
        supabase.from('pet_profile').select('id, name'),
        supabase.from('inventory_items').select('*'),
        supabase.from('inventory_locations').select('id, name'),
        supabase.from('habit_config').select('habit_name, input_type')
      ]);


      const formattedEvents: any[] = [];
      const habitConfigMap = new Map(habitsConfig?.map((hc: any) => [hc.habit_name, hc.input_type]) || []);


      // 1. Finance
      if (expenses) {
        expenses.forEach(e => {
          formattedEvents.push({
            id: e.id,
            timestamp: e.created_at || e.date,
            sortMs: getSortMs(dateStr, e.time, e.created_at),
            time: formatTime(e.created_at, e.time),
            type: "Expenses",
            title: e.particular || e.category || 'Spent on something',
            value: `Rs ${parseFloat(e.amount).toLocaleString()}`,
            icon: <Wallet size={14} />,
            colorClass: "bg-rose-500 text-white"
          });
        });
      }

      // 2. Habits
      if (habits) {
        habits.forEach(h => {
          const inputType = habitConfigMap.get(h.habit);
          if (inputType === 'time' && h.value) {
            formattedEvents.push({
              id: h.id,
              timestamp: h.created_at || h.date,
              sortMs: getSortMs(dateStr, h.value, h.created_at),
              time: formatTime(null, h.value),
              type: "Habits",
              title: h.habit,
              value: "Completed",
              icon: <CheckCircle2 size={14} />,
              colorClass: "bg-emerald-500 text-white"
            });
          }
        });
      }

      // 3. Event Log
      if (events) {
        events.forEach(ev => {
          const cleanTime = ev.time ? ev.time.substring(0, 5) : null;
          formattedEvents.push({
            id: ev.id,
            timestamp: ev.created_at || ev.date,
            sortMs: getSortMs(dateStr, cleanTime, ev.created_at),
            time: formatTime(null, cleanTime),
            type: "Habits",
            title: ev.event,
            value: `${ev.value || '1'} count(s)`,
            icon: <PlusCircle size={14} />,
            colorClass: "bg-amber-500 text-white"
          });
        });
      }




      // 4. Skills Focus
      if (skillLogs && skillsConfig) {
        const skillMap = new Map(skillsConfig.map((s: any) => [s.id, s.name]));
        skillLogs.forEach(s => {
          const name = skillMap.get(s.skill_id) || "Skill Focus";
          formattedEvents.push({
            id: s.id,
            timestamp: s.created_at || s.date,
            sortMs: getSortMs(dateStr, s.time, s.created_at),
            time: formatTime(s.created_at, s.time),
            type: "Skills",
            title: `Practiced: ${name}`,
            value: `${s.duration_minutes} mins`,
            icon: <GraduationCap size={14} />,
            colorClass: "bg-violet-400 text-white"
          });
        });
      }

      // 5. Workouts
      if (workouts) {
        const workoutMap: Record<string, { day: string; weight: number; reps: number; sets: number; time: string | null; duration: number | null }> = {};
        workouts.forEach(w => {
          const key = w.workout_day;
          if (!workoutMap[key]) {
            workoutMap[key] = { day: w.workout_day, weight: 0, reps: 0, sets: 0, time: w.time, duration: w.duration_minutes };
          }
          workoutMap[key].sets += 1;
          workoutMap[key].weight += (parseFloat(w.weight) || 0) * (parseInt(w.reps) || 0);
        });

        Object.values(workoutMap).forEach((w: any, index) => {
          formattedEvents.push({
            id: `workout-${index}`,
            timestamp: dateStr,
            sortMs: getSortMs(dateStr, w.time),
            time: formatTime(null, w.time),
            type: "Workout",
            title: w.day,
            value: `${w.sets} Sets (${w.duration || 30} mins)`,
            icon: <Activity size={14} />,
            colorClass: "bg-violet-500 text-white"
          });
        });
      }



      // 6. Vehicles
      const vehicleMap = new Map(vehicles?.map(v => [v.id, v.vehicle_name]) || []);
      if (fuel) {
        fuel.forEach(f => {
          const name = vehicleMap.get(f.vehicle_id) || "Vehicle";
          formattedEvents.push({
            id: f.id,
            timestamp: f.created_at || f.date,
            sortMs: getSortMs(dateStr, f.time, f.created_at),
            time: formatTime(f.created_at, f.time),
            type: "Vehicles",
            title: `${name}: Refueled`,
            value: `₹${f.total_cost || f.amount || 0} (${f.quantity_litres || f.liters || 0}L)`,
            icon: <Flame size={14} />,
            colorClass: "bg-amber-500 text-white"
          });
        });
      }
      if (service) {
        service.forEach(s => {
          const name = vehicleMap.get(s.vehicle_id) || "Vehicle";
          formattedEvents.push({
            id: s.id,
            timestamp: s.created_at || s.date,
            sortMs: getSortMs(dateStr, s.time, s.created_at),
            time: formatTime(s.created_at, s.time),
            type: "Vehicles",
            title: `${name}: Serviced`,
            value: `${s.service_type || 'Service'} (₹${s.cost || s.amount})`,
            icon: <Car size={14} />,
            colorClass: "bg-sky-500 text-white"
          });
        });
      }
      if (mileage) {
        mileage.forEach(m => {
          const name = vehicleMap.get(m.vehicle_id) || "Vehicle";
          formattedEvents.push({
            id: m.id,
            timestamp: m.created_at || m.date,
            sortMs: getSortMs(dateStr, m.time, m.created_at),
            time: formatTime(m.created_at, m.time),
            type: "Vehicles",
            title: `${name}: Odometer Recorded`,
            value: `${m.odometer} km`,
            icon: <Car size={14} />,
            colorClass: "bg-blue-400 text-white"
          });
        });
      }



      // 7. General Tasks completed today
      if (tasks) {
        const todayCompleted = tasks.filter(t => {
          if (!t.completed_at) return false;
          return t.completed_at.split("T")[0] === dateStr;
        });
        todayCompleted.forEach(t => {
          formattedEvents.push({
            id: t.id,
            timestamp: t.completed_at,
            sortMs: getSortMs(dateStr, null, t.completed_at),
            time: formatTime(t.completed_at),
            type: "Tasks",
            title: t.task,
            value: `Completed`,
            icon: <KanbanSquare size={14} />,
            colorClass: "bg-rose-400 text-white"
          });
        });
      }

      // 8. SquareShift completed today
      if (actionTasks) {
        const todaySquareShiftCompleted = actionTasks.filter(t => {
          if (!t.completed_at) return false;
          return t.completed_at.split("T")[0] === dateStr;
        });
        todaySquareShiftCompleted.forEach(t => {
          formattedEvents.push({
            id: t.id,
            timestamp: t.completed_at,
            sortMs: getSortMs(dateStr, null, t.completed_at),
            time: formatTime(t.completed_at),
            type: "Tasks",
            title: t.text,
            value: `Completed`,
            icon: <FileCheck size={14} />,
            colorClass: "bg-indigo-500 text-white"
          });
        });
      }



      // 9. Pets
      const petMap = new Map(petProfiles?.map(p => [p.id, p.name]) || []);
      if (petLogs) {
        petLogs.forEach(pl => {
          const name = petMap.get(pl.pet_id) || "Pet";
          formattedEvents.push({
            id: pl.id,
            timestamp: pl.created_at || pl.date,
            sortMs: getSortMs(dateStr, pl.time, pl.created_at),
            time: formatTime(pl.created_at, pl.time),
            type: "Pets",
            title: `${name} - ${pl.type || 'Log'}`,
            value: pl.notes || pl.detail || "Logged activity details",
            icon: <Dog size={14} />,
            colorClass: "bg-amber-400 text-white"
          });
        });
      }

      // 10. Inventory Items
      if (inventoryItems && inventoryLocations) {
        const locationMap = new Map(inventoryLocations.map((l: any) => [l.id, l.name]));
        inventoryItems.forEach(item => {
          // A. Acquired
          if (item.acquired_date === dateStr) {
            const locName = locationMap.get(item.location_id) || "Unknown Location";
            formattedEvents.push({
              id: `inv-acq-${item.id}`,
              timestamp: item.created_at || dateStr,
              sortMs: getSortMs(dateStr, item.acquired_time, item.created_at),
              time: formatTime(item.created_at, item.acquired_time),
              type: "Inventory",
              title: item.name,
              value: `Acquired at ${locName}`,
              icon: <Package size={14} />,
              colorClass: "bg-emerald-500 text-white"
            });
          }
          // B. Lent out
          if (item.lent_date === dateStr) {
            formattedEvents.push({
              id: `inv-lent-${item.id}`,
              timestamp: item.lent_date,
              sortMs: getSortMs(dateStr, item.lent_time),
              time: formatTime(null, item.lent_time),
              type: "Inventory",
              title: item.name,
              value: `Lent to ${item.origin_person || 'Someone'}`,
              icon: <Package size={14} />,
              colorClass: "bg-amber-400 text-white"
            });
          }
          // C. Retired
          if (item.retired_at && item.retired_at.startsWith(dateStr)) {
            formattedEvents.push({
              id: `inv-ret-${item.id}`,
              timestamp: item.retired_at,
              sortMs: getSortMs(dateStr, null, item.retired_at),
              time: formatTime(item.retired_at),
              type: "Inventory",
              title: item.name,
              value: `Retired/Archived`,
              icon: <Package size={14} />,
              colorClass: "bg-slate-400 text-white"
            });
          }
        });
      }

      // Sort events chronologically
      formattedEvents.sort((a, b) => (a.sortMs || 0) - (b.sortMs || 0));



      setTimelineEvents(formattedEvents);
    } catch (err) {
      console.error("Failed to fetch timeline logs:", err);
    } finally {
      setIsTimelineLoading(false);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    if (dateStr === todayStr) return "Today";
    if (dateStr === yesterdayStr) return "Yesterday";

    try {
      const d = new Date(dateStr);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  };

  useEffect(() => {
    fetchTimelineData(timelineDate);
  }, [timelineDate]);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        {/* Standard Page Header */}
        <PageHeader title="Activity Timeline" />

        {/* Sub-nav: Timeline | Day at a Glance */}
        <SectionNav tabs={[
          { title: "Timeline", href: "/activity-timeline", icon: <Activity size={15} /> },
          { title: "Day at a Glance", href: "/activity-timeline/day", icon: <Clock size={15} /> },
        ]} />

        {/* Date Switcher Bar */}
        <div className="flex justify-between items-center px-1 mb-8">
          <div className="flex items-center gap-1.5 bg-card border border-border/30 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => adjustDate(-1)}
              title="Previous Day"
              className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-foreground active:scale-95 transition-all cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            
            <div 
              onClick={handleDateClick}
              className="relative flex items-center gap-1 text-[11px] font-black uppercase px-2 cursor-pointer text-foreground hover:text-primary select-none"
            >
              <span>{formatDisplayDate(timelineDate)}</span>
              <input
                ref={dateInputRef}
                type="date"
                value={timelineDate}
                onChange={(e) => setTimelineDate(e.target.value)}
                className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
              />
            </div>

            <button
              onClick={() => adjustDate(1)}
              title="Next Day"
              className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-foreground active:scale-95 transition-all cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
            Selected Day Log
          </div>
        </div>

        {/* Timeline Feed Container */}
        {isTimelineLoading ? (
          <div className="bg-card rounded-xl border border-border/30 p-8 text-center text-xs font-bold text-muted-foreground/40 animate-pulse">
            Synthesizing logs...
          </div>
        ) : timelineEvents.length > 0 ? (
          <div className="relative border-l border-border/60 ml-3.5 pl-6 space-y-6 py-2">
            {timelineEvents.map((event, index) => (
              <div key={event.id || index} className="relative group animate-fadeIn">
                {/* Timeline Dot Accent */}
                <span className={`absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-background ring-4 ring-muted/10 ${event.colorClass}`} />
                
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    {event.time ? `${event.time} – ` : ""}{event.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground/80 font-medium mt-0.5">
                    {event.type} &middot; <span className="font-semibold text-primary/80">{event.value ? String(event.value).replace(/^[Vv]alue:\s*/, "") : ""}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card/40 rounded-xl border border-border/20 p-8 text-center text-xs font-semibold text-muted-foreground/40">
            No activities recorded for this day.
          </div>
        )}
      </div>
    </div>
  );
}
