"use client";
import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, CalendarDays, Flame, Dumbbell, CheckSquare, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { PageHeader } from "@/components/PageHeader";
import { ReportsNav } from "@/components/ReportsNav";
import { SectionNav } from "@/components/SectionNav";

const SUMMARY_TABS = [
  { title: "Weekly",  href: "/reports/summary/weekly",  icon: <CalendarDays size={14} /> },
  { title: "Monthly", href: "/reports/summary/monthly", icon: <Flame size={14} /> },
  { title: "Yearly",  href: "/reports/summary/yearly",  icon: <TrendingUp size={14} /> },
];

export default function WeeklySummaryPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const now = new Date();
      const thisStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const thisEnd   = format(endOfWeek(now,   { weekStartsOn: 1 }), "yyyy-MM-dd");
      const lastStart = format(startOfWeek(subDays(now, 7), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const lastEnd   = format(endOfWeek(subDays(now, 7),   { weekStartsOn: 1 }), "yyyy-MM-dd");

      const [
        { data: thisExp }, { data: lastExp },
        { data: thisHab }, { data: lastHab },
        { data: habCfg },
        { data: thisWkt }, { data: lastWkt },
        { data: thisTsk }, { data: lastTsk },
      ] = await Promise.all([
        supabase.from("history_expenses").select("amount").eq("type","Expense").gte("date",thisStart).lte("date",thisEnd),
        supabase.from("history_expenses").select("amount").eq("type","Expense").gte("date",lastStart).lte("date",lastEnd),
        supabase.from("habit_data").select("habit,value").gte("date",thisStart).lte("date",thisEnd),
        supabase.from("habit_data").select("habit,value").gte("date",lastStart).lte("date",lastEnd),
        supabase.from("habit_config").select("habit_name").eq("is_active",true),
        supabase.from("workout_log").select("date,weight,reps").gte("date",thisStart).lte("date",thisEnd),
        supabase.from("workout_log").select("date,weight,reps").gte("date",lastStart).lte("date",lastEnd),
        supabase.from("tasks").select("status").eq("status","Completed").gte("completed_at",thisStart+"T00:00:00"),
        supabase.from("tasks").select("status").eq("status","Completed").gte("completed_at",lastStart+"T00:00:00").lte("completed_at",lastEnd+"T23:59:59"),
      ]);

      const totalH = (habCfg||[]).length;
      const habitPct = (hd:any[]) => {
        if(!totalH) return 0;
        const done=(hd||[]).filter((h:any)=>h.value&&h.value!=="0"&&h.value!=="false").length;
        return Math.round((done/(totalH*7))*100);
      };
      const wktVol = (wd:any[]) => Math.round((wd||[]).reduce((s:number,w:any)=>s+((parseFloat(w.weight)||0)*(parseInt(w.reps)||0)),0));
      const wktDays= (wd:any[]) => new Set((wd||[]).map((w:any)=>w.date)).size;
      const spend  = (ed:any[]) => (ed||[]).reduce((s:number,e:any)=>s+(parseFloat(e.amount)||0),0);

      setData({
        this: { spend:spend(thisExp||[]), habitPct:habitPct(thisHab||[]), wktDays:wktDays(thisWkt||[]), wktVol:wktVol(thisWkt||[]), tasks:(thisTsk||[]).length },
        last: { spend:spend(lastExp||[]), habitPct:habitPct(lastHab||[]), wktDays:wktDays(lastWkt||[]), wktVol:wktVol(lastWkt||[]), tasks:(lastTsk||[]).length },
        thisLabel:`${thisStart} → ${thisEnd}`,
        lastLabel:`${lastStart} → ${lastEnd}`,
      });
      setLoading(false);
    }
    load();
  }, []);

  const pct=(curr:number,prev:number)=>{
    if(prev===0&&curr===0) return "–";
    if(prev===0) return "+100%";
    const d=Math.round(((curr-prev)/prev)*100);
    return d>0?`+${d}%`:`${d}%`;
  };

  const metrics=data?[
    {label:"Weekly Spend",    icon:<Wallet size={13}/>,   thisVal:`₹${Math.round(data.this.spend).toLocaleString("en-IN")}`,     lastVal:`₹${Math.round(data.last.spend).toLocaleString("en-IN")}`,  diff:pct(data.this.spend,data.last.spend),     curr:data.this.spend,    prev:data.last.spend,    lower:true,  barMax:Math.max(data.this.spend,data.last.spend,1)},
    {label:"Habit Consistency",icon:<Flame size={13}/>,   thisVal:`${data.this.habitPct}%`,                                       lastVal:`${data.last.habitPct}%`,                                    diff:pct(data.this.habitPct,data.last.habitPct),curr:data.this.habitPct, prev:data.last.habitPct, lower:false, barMax:100},
    {label:"Workout Days",    icon:<Dumbbell size={13}/>, thisVal:`${data.this.wktDays} days`,                                    lastVal:`${data.last.wktDays} days`,                                 diff:pct(data.this.wktDays,data.last.wktDays),  curr:data.this.wktDays,  prev:data.last.wktDays,  lower:false, barMax:7},
    {label:"Workout Volume",  icon:<Dumbbell size={13}/>, thisVal:`${data.this.wktVol.toLocaleString()} kg·reps`,                 lastVal:`${data.last.wktVol.toLocaleString()} kg·reps`,             diff:pct(data.this.wktVol,data.last.wktVol),    curr:data.this.wktVol,   prev:data.last.wktVol,   lower:false, barMax:Math.max(data.this.wktVol,data.last.wktVol,1)},
    {label:"Tasks Completed", icon:<CheckSquare size={13}/>,thisVal:`${data.this.tasks} tasks`,                                   lastVal:`${data.last.tasks} tasks`,                                  diff:pct(data.this.tasks,data.last.tasks),      curr:data.this.tasks,    prev:data.last.tasks,    lower:false, barMax:Math.max(data.this.tasks,data.last.tasks,1)},
  ]:[];

  return (
    <div className="bg-background min-h-screen pb-20 p-4 md:p-6 font-dm-sans">
      <PageHeader title="Intelligence" />

      {/* Full reports nav bar */}
      <ReportsNav />

      {/* Summary sub-nav */}
      <div className="max-w-lg mx-auto">
        <SectionNav tabs={SUMMARY_TABS} />

        {loading ? (
          <div className="text-sm text-muted-foreground text-center py-16">Loading weekly data…</div>
        ) : (
          <>
            <div className="space-y-3">
              {metrics.map((m,i)=>{
                const good=m.lower?m.curr<m.prev:m.curr>m.prev;
                const neutral=m.curr===m.prev||m.prev===0;
                const changeColor=neutral?"text-muted-foreground":good?"text-emerald-600":"text-destructive";
                const TrendIcon=neutral?Minus:good?TrendingUp:TrendingDown;
                const thisBarW=m.barMax>0?Math.min((m.curr/m.barMax)*100,100):0;
                const lastBarW=m.barMax>0?Math.min((m.prev/m.barMax)*100,100):0;
                return (
                  <div key={i} className="bg-card border border-border rounded-xl p-4 shadow-zenith">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{m.icon} {m.label}</div>
                      <div className={`flex items-center gap-1 text-[12px] font-black ${changeColor}`}><TrendIcon size={12}/> {m.diff}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black text-primary uppercase tracking-wider w-12 shrink-0">This</span>
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{width:`${thisBarW}%`}}/></div>
                        <span className="text-[12px] font-black text-foreground min-w-[80px] text-right">{m.thisVal}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider w-12 shrink-0">Last</span>
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden"><div className="h-full rounded-full bg-muted-foreground/30 transition-all" style={{width:`${lastBarW}%`}}/></div>
                        <span className="text-[12px] font-bold text-muted-foreground min-w-[80px] text-right">{m.lastVal}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-[10px] font-bold text-muted-foreground">
              <span><span className="text-primary">This week:</span> {data.thisLabel}</span>
              <span><span className="text-muted-foreground/50">Last week:</span> {data.lastLabel}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
