"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Activity, CheckCircle2, Circle, Clock, Dumbbell,
  CheckSquare, ChevronLeft, ChevronRight, Wallet, TrendingUp, TrendingDown,
  GraduationCap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { SectionNav } from "@/components/SectionNav";

// ── helpers ──────────────────────────────────────────────────────────────────
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function adjustDate(dateStr: string, delta: number): string {
  const [y,m,day] = dateStr.split("-").map(Number);
  const d = new Date(y, m-1, day);
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function formatDisplayDate(dateStr: string): string {
  const t = todayStr();
  if (dateStr === t) return "Today";
  if (dateStr === adjustDate(t, -1)) return "Yesterday";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
  } catch { return dateStr; }
}

// ── Sub-nav tabs ──────────────────────────────────────────────────────────────
const SUB_TABS = [
  { title:"Timeline",       href:"/activity-timeline",     icon:<Activity size={15}/> },
  { title:"Day at a Glance",href:"/activity-timeline/day", icon:<Clock size={15}/> },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function DayAtAGlancePage() {
  const [date, setDate]       = useState<string>(todayStr);
  const [loading, setLoading] = useState(true);
  const dateInputRef          = useRef<HTMLInputElement>(null);

  // data
  const [tasks,    setTasks]    = useState<any[]>([]);
  const [habits,   setHabits]   = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [skills,   setSkills]   = useState<any[]>([]);   // {name, duration_minutes}[]

  const handleDateClick = () => {
    try { dateInputRef.current?.showPicker(); }
    catch { dateInputRef.current?.click(); }
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [
        {data:habitConfigs},
        {data:habitData},
        {data:tasksData},
        {data:workoutData},
        {data:expenseData},
        {data:skillLogsData},
        {data:skillsConfig},
      ] = await Promise.all([
        supabase.from("habit_config").select("habit_name,group_name").eq("is_active", true),
        supabase.from("habit_data").select("habit_name,value").eq("date", date),
        supabase.from("tasks").select("id,task,status,is_high_priority").eq("is_today", true),
        supabase.from("workout_log").select("workout_day,exercise,sets,reps,weight").eq("date", date),
        supabase.from("history_expenses").select("category,amount,type,notes,created_at").eq("date", date).order("created_at"),
        supabase.from("skill_logs").select("skill_id,duration_minutes,created_at").eq("date", date),
        supabase.from("skills").select("id,name"),
      ]);

      const doneHabits = new Set(
        (habitData||[]).filter((h:any)=>h.value&&h.value!=="0"&&h.value!=="false").map((h:any)=>h.habit_name)
      );
      setHabits((habitConfigs||[]).map((h:any)=>({...h, done:doneHabits.has(h.habit_name)})));
      setTasks(tasksData||[]);
      setWorkouts(workoutData||[]);
      setExpenses(expenseData||[]);

      // join skill_logs with skills name
      const skillMap = new Map((skillsConfig||[]).map((s:any)=>[s.id, s.name]));
      setSkills((skillLogsData||[]).map((sl:any)=>({
        name: skillMap.get(sl.skill_id)||"Skill Focus",
        duration_minutes: sl.duration_minutes||0,
      })));

      setLoading(false);
    }
    load();
  }, [date]);

  // ── derived stats ──
  const tasksDone    = tasks.filter(t=>t.status==="Completed").length;
  const habitsDone   = habits.filter(h=>h.done).length;
  const workoutLogged= workouts.length > 0;
  const totalExpense = expenses.filter(e=>e.type==="Expense").reduce((s,e)=>s+(parseFloat(e.amount)||0),0);
  const totalIncome  = expenses.filter(e=>e.type==="Income").reduce((s,e)=>s+(parseFloat(e.amount)||0),0);
  const netSavings   = totalIncome - totalExpense;
  const totalSkillMin= skills.reduce((s,sk)=>s+sk.duration_minutes,0);
  const skillLogged  = skills.length > 0;

  // summary pill data — 5 items in 2 rows: [3] + [2]
  const pills = [
    { label:"Tasks",   value:`${tasksDone}/${tasks.length}`,                    done:tasksDone===tasks.length&&tasks.length>0,   icon:<CheckSquare size={12}/> },
    { label:"Habits",  value:`${habitsDone}/${habits.length}`,                  done:habitsDone===habits.length&&habits.length>0, icon:<CheckCircle2 size={12}/> },
    { label:"Workout", value:workoutLogged?`${workouts.length} sets`:"None",    done:workoutLogged,                               icon:<Dumbbell size={12}/> },
    { label:"Finance", value:totalExpense>0?`₹${Math.round(totalExpense).toLocaleString("en-IN")}`:"₹0",
                                                                                done:totalIncome>totalExpense,                   icon:<Wallet size={12}/> },
    { label:"Skills",  value:skillLogged?`${totalSkillMin} min`:"None",         done:skillLogged,                                 icon:<GraduationCap size={12}/> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        <PageHeader title="Activity Timeline" />

        {/* Sub-nav */}
        <SectionNav tabs={SUB_TABS} />

        {/* ── Date Switcher — identical to timeline page ── */}
        <div className="flex justify-between items-center px-1 mb-8">
          <div className="flex items-center gap-1.5 bg-card border border-border/30 rounded-xl p-1 shadow-sm">
            <button onClick={()=>setDate(d=>adjustDate(d,-1))} title="Previous Day"
              className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-foreground active:scale-95 transition-all cursor-pointer">
              <ChevronLeft size={14}/>
            </button>

            <div onClick={handleDateClick}
              className="relative flex items-center gap-1 text-[11px] font-black uppercase px-2 cursor-pointer text-foreground hover:text-primary select-none">
              <span>{formatDisplayDate(date)}</span>
              <input
                ref={dateInputRef}
                type="date"
                value={date}
                onChange={e=>setDate(e.target.value)}
                className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
              />
            </div>

            <button onClick={()=>setDate(d=>adjustDate(d,1))} title="Next Day"
              className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-foreground active:scale-95 transition-all cursor-pointer">
              <ChevronRight size={14}/>
            </button>
          </div>

          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
            Day at a Glance
          </div>
        </div>

        {loading ? (
          <div className="bg-card rounded-xl border border-border/30 p-8 text-center text-xs font-bold text-muted-foreground/40 animate-pulse">
            Synthesizing logs...
          </div>
        ) : (
          <>
            {/* ── Summary Pills — 3 top + 2 bottom ── */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              {pills.slice(0,3).map((s,i)=>(
                <SummaryPill key={i} {...s}/>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {pills.slice(3).map((s,i)=>(
                <SummaryPill key={i} {...s}/>
              ))}
            </div>

            {/* ── Vertical Timeline ── */}
            <div className="relative">
              <div className="absolute left-5 top-5 bottom-5 w-px bg-border/60"/>

              {/* 1 — Habits */}
              <TimelineSection color="amber" icon={<CheckCircle2 size={15} className="text-amber-500"/>} label="Habits"
                items={
                  habits.length>0
                    ?[{label:`${habitsDone} of ${habits.length} completed`, done:habitsDone===habits.length,
                        sub:habits.filter(h=>!h.done).map(h=>h.habit_name).join(", ")||"All complete ✓"}]
                    :[{label:"No habits configured", done:false, sub:""}]
                }
              />

              {/* 2 — Tasks */}
              <TimelineSection color="primary" icon={<CheckSquare size={15} className="text-primary"/>} label="Tasks"
                items={
                  tasks.length>0
                    ?tasks.map(t=>({label:t.task, done:t.status==="Completed", sub:t.is_high_priority?"⚡ High Priority":"Normal"}))
                    :[{label:"No tasks for today", done:false, sub:""}]
                }
              />

              {/* 3 — Workout */}
              <TimelineSection color="emerald" icon={<Dumbbell size={15} className="text-emerald-600"/>} label="Workout"
                items={
                  workoutLogged
                    ?[{label:`${workouts[0]?.workout_day} — ${workouts.length} exercises`, done:true,
                        sub:workouts.map(w=>w.exercise).join(", ")}]
                    :[{label:"No workout logged today", done:false, sub:""}]
                }
              />

              {/* 4 — Finance */}
              <TimelineSection color="indigo" icon={<Wallet size={15} className="text-indigo-500"/>} label="Finance" items={[]}
                custom={
                  <div className="space-y-2">
                    {/* Summary row */}
                    <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Expense</div>
                          <div className="text-base font-black text-destructive">₹{Math.round(totalExpense).toLocaleString("en-IN")}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Income</div>
                          <div className="text-base font-black text-emerald-600">₹{Math.round(totalIncome).toLocaleString("en-IN")}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Net</div>
                          <div className={`text-base font-black flex items-center gap-1 ${netSavings>=0?"text-emerald-600":"text-destructive"}`}>
                            {netSavings>=0?<TrendingUp size={12}/>:<TrendingDown size={12}/>}
                            ₹{Math.abs(Math.round(netSavings)).toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Individual entries */}
                    {expenses.length>0
                      ?expenses.map((e,i)=>(
                          <div key={i} className="bg-card border border-border/40 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${e.type==="Income"?"bg-emerald-500":"bg-destructive"}`}/>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-bold text-foreground truncate">{e.category||"—"}</div>
                              {e.notes&&<div className="text-[10px] text-muted-foreground mt-0.5">{e.notes}</div>}
                            </div>
                            <div className={`text-[13px] font-black flex-shrink-0 ${e.type==="Income"?"text-emerald-600":"text-destructive"}`}>
                              {e.type==="Income"?"+":"−"}₹{Math.round(parseFloat(e.amount)||0).toLocaleString("en-IN")}
                            </div>
                          </div>
                        ))
                      :<div className="bg-card border border-border/40 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
                          <Circle size={14} className="text-border flex-shrink-0"/>
                          <div className="text-[12px] font-bold text-muted-foreground">No transactions today</div>
                        </div>
                    }
                  </div>
                }
              />

              {/* 5 — Skills */}
              <TimelineSection color="violet" icon={<GraduationCap size={15} className="text-violet-500"/>} label="Skills"
                items={[]} custom={
                  <div className="space-y-2">
                    {skillLogged ? (
                      <>
                        {/* Skills summary */}
                        <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Sessions</div>
                              <div className="text-base font-black text-violet-600">{skills.length}</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Time</div>
                              <div className="text-base font-black text-violet-600">{totalSkillMin} min</div>
                            </div>
                          </div>
                        </div>
                        {/* Individual skill entries */}
                        {skills.map((sk,i)=>(
                          <div key={i} className="bg-card border border-border/40 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0"/>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-bold text-foreground truncate">{sk.name}</div>
                            </div>
                            <div className="text-[13px] font-black text-violet-600 flex-shrink-0">{sk.duration_minutes} min</div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="bg-card border border-border/40 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
                        <Circle size={14} className="text-border flex-shrink-0"/>
                        <div className="text-[12px] font-bold text-muted-foreground">No skill sessions logged today</div>
                      </div>
                    )}
                  </div>
                }
              />

            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Summary Pill ─────────────────────────────────────────────────────────────
function SummaryPill({ label, value, done, icon }: {
  label: string; value: string; done: boolean; icon: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
      <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest mb-2 ${done?"text-emerald-600":"text-muted-foreground"}`}>
        {icon} {label}
      </div>
      <div className={`text-xl font-black ${done?"text-emerald-600":"text-foreground"}`}>{value}</div>
    </div>
  );
}

// ── Timeline Section ─────────────────────────────────────────────────────────
function TimelineSection({ color, icon, label, items, custom }: {
  color: string; icon: React.ReactNode; label: string;
  items: { label:string; done:boolean; sub:string }[];
  custom?: React.ReactNode;
}) {
  const dotBg: Record<string,string> = {
    amber:   "border-amber-400   bg-amber-50",
    primary: "border-primary     bg-primary/5",
    emerald: "border-emerald-400 bg-emerald-50",
    indigo:  "border-indigo-400  bg-indigo-50",
    violet:  "border-violet-400  bg-violet-50",
  };
  const badgeBg: Record<string,string> = {
    amber:   "bg-amber-500/10  text-amber-700",
    primary: "bg-primary/10    text-primary",
    emerald: "bg-emerald-500/10 text-emerald-700",
    indigo:  "bg-indigo-500/10 text-indigo-700",
    violet:  "bg-violet-500/10 text-violet-700",
  };
  return (
    <div className="flex gap-5 mb-6">
      <div className={`w-10 h-10 rounded-full border-2 ${dotBg[color]} flex items-center justify-center flex-shrink-0 z-10 shadow-sm`}>
        {icon}
      </div>
      <div className="flex-1 pb-2">
        <div className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mb-3 ${badgeBg[color]}`}>
          {label}
        </div>
        {custom || (
          <div className="space-y-2">
            {items.map((item,i)=>(
              <div key={i} className="bg-card border border-border/40 rounded-xl p-3.5 flex items-start gap-3 shadow-sm">
                {item.done
                  ?<CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0"/>
                  :<Circle      size={14} className="text-border mt-0.5 flex-shrink-0"/>
                }
                <div>
                  <div className={`text-[12px] font-bold ${item.done?"text-muted-foreground line-through":"text-foreground"}`}>{item.label}</div>
                  {item.sub&&<div className="text-[10px] text-muted-foreground mt-0.5">{item.sub}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
