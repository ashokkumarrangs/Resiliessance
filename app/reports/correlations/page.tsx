"use client";
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { format, subDays } from "date-fns";
import { PageHeader } from "@/components/PageHeader";
import { ReportsNav } from "@/components/ReportsNav";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────
type DataPoint = { x: number; y: number; date: string; dow: number };

// ─── Pair Definitions ────────────────────────────────────────────────────────
const PAIRS = [
  // Lifestyle → Physical Output
  { id:"sleep_wktVol",  group:"Lifestyle → Performance",  xKey:"sleep_hours",        yKey:"workout_volume", xLabel:"Sleep (hrs)",        yLabel:"Workout Volume (kg·reps)" },
  { id:"sleep_tasks",   group:"Lifestyle → Performance",  xKey:"sleep_hours",        yKey:"tasks_done",     xLabel:"Sleep (hrs)",        yLabel:"Tasks Completed" },
  { id:"water_wktVol",  group:"Lifestyle → Performance",  xKey:"water_liters",       yKey:"workout_volume", xLabel:"Water Intake (L)",   yLabel:"Workout Volume (kg·reps)" },
  { id:"med_tasks",     group:"Lifestyle → Performance",  xKey:"meditation_minutes", yKey:"tasks_done",     xLabel:"Meditation (min)",   yLabel:"Tasks Completed" },
  { id:"steps_wktVol",  group:"Lifestyle → Performance",  xKey:"steps",              yKey:"workout_volume", xLabel:"Steps",              yLabel:"Workout Volume (kg·reps)" },
  // Finance ↔ Lifestyle
  { id:"spend_wktVol",  group:"Finance ↔ Lifestyle",      xKey:"daily_expense",      yKey:"workout_volume", xLabel:"Daily Spend (₹)",    yLabel:"Workout Volume (kg·reps)" },
  { id:"spend_tasks",   group:"Finance ↔ Lifestyle",      xKey:"daily_expense",      yKey:"tasks_done",     xLabel:"Daily Spend (₹)",    yLabel:"Tasks Completed" },
  { id:"sleep_spend",   group:"Finance ↔ Lifestyle",      xKey:"sleep_hours",        yKey:"daily_expense",  xLabel:"Sleep (hrs)",        yLabel:"Daily Spend (₹)" },
  { id:"steps_spend",   group:"Finance ↔ Lifestyle",      xKey:"steps",              yKey:"daily_expense",  xLabel:"Steps",              yLabel:"Daily Spend (₹)" },
  // Habit Streaks → Outcomes
  { id:"water_tasks",   group:"Habit Streaks → Outcomes", xKey:"water_liters",       yKey:"tasks_done",     xLabel:"Water Intake (L)",   yLabel:"Tasks Completed" },
  { id:"steps_tasks",   group:"Habit Streaks → Outcomes", xKey:"steps",              yKey:"tasks_done",     xLabel:"Steps",              yLabel:"Tasks Completed" },
  { id:"med_wktVol",    group:"Habit Streaks → Outcomes", xKey:"meditation_minutes", yKey:"workout_volume", xLabel:"Meditation (min)",   yLabel:"Workout Volume (kg·reps)" },
];
const GROUPS = Array.from(new Set(PAIRS.map(p => p.group)));

const DOW_COLORS: Record<number,string> = {
  0:"#ef4444",1:"#6366f1",2:"#8b5cf6",3:"#10b981",4:"#f59e0b",5:"#0ea5e9",6:"#f43f5e",
};
const DOW_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ─── Pearson r ────────────────────────────────────────────────────────────────
function pearson(pts: DataPoint[]): number | null {
  if(pts.length < 4) return null;
  const n=pts.length;
  const mx=pts.reduce((s,p)=>s+p.x,0)/n,my=pts.reduce((s,p)=>s+p.y,0)/n;
  const num=pts.reduce((s,p)=>s+(p.x-mx)*(p.y-my),0);
  const dx=Math.sqrt(pts.reduce((s,p)=>s+(p.x-mx)**2,0));
  const dy=Math.sqrt(pts.reduce((s,p)=>s+(p.y-my)**2,0));
  if(dx===0||dy===0) return null;
  return num/(dx*dy);
}

function rBadge(r: number | null) {
  if(r===null) return {label:"Insufficient data",cls:"bg-muted text-muted-foreground border-border"};
  const abs=Math.abs(r),dir=r>0?"positive":"negative";
  if(abs>=0.6) return {label:`Strong ${dir} (r = ${r.toFixed(2)})`,cls:"bg-emerald-500/10 text-emerald-700 border-emerald-200"};
  if(abs>=0.3) return {label:`Moderate ${dir} (r = ${r.toFixed(2)})`,cls:"bg-amber-500/10 text-amber-700 border-amber-200"};
  return {label:`Weak correlation (r = ${r.toFixed(2)})`,cls:"bg-muted text-muted-foreground border-border"};
}

function insightText(r: number | null, xLabel: string, yLabel: string): string {
  if(r===null) return "Not enough data to draw a conclusion.";
  const abs=Math.abs(r),dir=r>0?"tend to have higher":"tend to have lower";
  if(abs>=0.6) return `Strong pattern: days with more ${xLabel.toLowerCase()} ${dir} ${yLabel.toLowerCase()}.`;
  if(abs>=0.3) return `Moderate trend: ${xLabel} shows some relationship with ${yLabel.toLowerCase()}.`;
  return `Weak or no meaningful link between ${xLabel.toLowerCase()} and ${yLabel.toLowerCase()} in this period.`;
}

function rollingAvg(pts: DataPoint[], key:"x"|"y", window=7): {date:string;avg:number}[] {
  const sorted=[...pts].sort((a,b)=>a.date.localeCompare(b.date));
  return sorted.map((p,i)=>{
    const slice=sorted.slice(Math.max(0,i-window+1),i+1);
    const avg=slice.reduce((s,pt)=>s+pt[key],0)/slice.length;
    return {date:p.date,avg:Math.round(avg*100)/100};
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CorrelationsPage() {
  const [days,setDays]=useState<30|60|90>(60);
  const [activePairId,setActivePairId]=useState(PAIRS[0].id);
  const [activeGroup,setActiveGroup]=useState("All");
  const [showDow,setShowDow]=useState(false);
  const [rawData,setRawData]=useState<{habits:any[];workouts:any[];expenses:any[];tasks:any[]}>({habits:[],workouts:[],expenses:[],tasks:[]});
  const [loading,setLoading]=useState(false);

  useEffect(()=>{
    async function load(){
      setLoading(true);
      const minDate=format(subDays(new Date(),days),"yyyy-MM-dd");
      const [{data:habits},{data:workouts},{data:expenses},{data:tasks}]=await Promise.all([
        supabase.from("habit_data").select("date,habit_name,value").gte("date",minDate),
        supabase.from("workout_log").select("date,weight,reps").gte("date",minDate),
        supabase.from("history_expenses").select("date,amount").eq("type","Expense").gte("date",minDate),
        supabase.from("tasks").select("completed_at").eq("status","Completed").gte("completed_at",minDate+"T00:00:00"),
      ]);
      setRawData({habits:habits||[],workouts:workouts||[],expenses:expenses||[],tasks:tasks||[]});
      setLoading(false);
    }
    load();
  },[days]);

  const activePair=PAIRS.find(p=>p.id===activePairId)||PAIRS[0];

  const dataPoints=useMemo<DataPoint[]>(()=>{
    const dateList=Array.from({length:days},(_,i)=>format(subDays(new Date(),i),"yyyy-MM-dd"));
    const getHabit=(date:string,name:string):number|null=>{
      const row=rawData.habits.find((h:any)=>h.date===date&&h.habit_name===name);
      if(!row||!row.value) return null;
      return parseFloat(row.value)||null;
    };
    const getWorkoutVol=(date:string):number=>rawData.workouts.filter((w:any)=>w.date===date).reduce((s:number,w:any)=>s+((parseFloat(w.weight)||0)*(parseInt(w.reps)||0)),0);
    const getDailyExpense=(date:string):number=>rawData.expenses.filter((e:any)=>e.date===date).reduce((s:number,e:any)=>s+(parseFloat(e.amount)||0),0);
    const getTasksDone=(date:string):number=>rawData.tasks.filter((t:any)=>t.completed_at?.startsWith(date)).length;
    const getValue=(key:string,date:string):number|null=>{
      if(["sleep_hours","water_liters","meditation_minutes","steps"].includes(key)) return getHabit(date,key);
      if(key==="workout_volume") return getWorkoutVol(date);
      if(key==="daily_expense") return getDailyExpense(date);
      if(key==="tasks_done") return getTasksDone(date);
      return null;
    };
    const points:DataPoint[]=[];
    for(const date of dateList){
      const xVal=getValue(activePair.xKey,date);
      const yVal=getValue(activePair.yKey,date);
      if(xVal!==null&&xVal>0&&yVal!==null){
        const d=new Date(date+"T00:00:00");
        points.push({x:xVal,y:yVal,date,dow:d.getDay()});
      }
    }
    return points;
  },[activePair,rawData,days]);

  const r=pearson(dataPoints);
  const badge=rBadge(r);
  const insight=insightText(r,activePair.xLabel,activePair.yLabel);
  const rollingY=rollingAvg(dataPoints,"y");
  const filteredPairs=activeGroup==="All"?PAIRS:PAIRS.filter(p=>p.group===activeGroup);

  const ScatterTooltip=({active,payload}:any)=>{
    if(active&&payload?.length){
      const d=payload[0]?.payload as DataPoint;
      return(
        <div className="bg-card border border-border rounded-xl p-3 shadow-md text-xs font-black">
          <div className="text-muted-foreground mb-1">{d.date} ({DOW_LABELS[d.dow]})</div>
          <div className="text-foreground">{activePair.xLabel}: <b>{d.x}</b></div>
          <div className="text-foreground">{activePair.yLabel}: <b>{Math.round(d.y)}</b></div>
        </div>
      );
    }
    return null;
  };

  const TrendTooltip=({active,payload,label}:any)=>{
    if(active&&payload?.length)return(
      <div className="bg-card border border-border rounded-xl p-3 shadow-md text-xs font-black">
        <div className="text-muted-foreground mb-1">{label}</div>
        <div className="text-foreground">7-day avg: <b>{payload[0]?.value}</b></div>
      </div>
    );
    return null;
  };

  return (
    <div className="bg-background min-h-screen pb-20 p-4 md:p-6 font-dm-sans">
      <PageHeader title="Intelligence">
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          {loading?"Loading…":`${dataPoints.length} pts`}
        </span>
      </PageHeader>

      {/* Full reports nav bar */}
      <ReportsNav />

      <div className="max-w-lg mx-auto space-y-4">
        {/* ── Controls ── */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-zenith space-y-4">
          {/* Day range */}
          <div>
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Data Range</div>
            <div className="flex gap-2">
              {([30,60,90] as const).map(d=>(
                <button key={d} onClick={()=>setDays(d)}
                  className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border transition-all ${days===d?"bg-primary text-primary-foreground border-primary":"bg-muted text-muted-foreground border-border hover:border-primary/40"}`}>
                  {d} days
                </button>
              ))}
              <button onClick={()=>setShowDow(v=>!v)}
                className={`ml-auto text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border transition-all ${showDow?"bg-primary/10 text-primary border-primary":"bg-muted text-muted-foreground border-border hover:border-primary/40"}`}>
                Day of Week
              </button>
            </div>
          </div>

          {/* Group filter */}
          <div>
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Category</div>
            <div className="flex flex-wrap gap-2">
              {["All",...GROUPS].map(g=>(
                <button key={g} onClick={()=>setActiveGroup(g)}
                  className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${activeGroup===g?"bg-primary text-primary-foreground border-primary":"bg-muted text-muted-foreground border-border hover:border-primary/40"}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Pair picker */}
          <div>
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Comparison</div>
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto no-scrollbar">
              {filteredPairs.map(p=>(
                <button key={p.id} onClick={()=>setActivePairId(p.id)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-[11px] font-bold transition-all ${activePairId===p.id?"bg-primary/10 text-primary border-primary":"bg-muted/40 text-muted-foreground border-border hover:border-primary/40"}`}>
                  <span className="font-black">{p.xLabel}</span>
                  <span className="text-muted-foreground"> → </span>
                  <span>{p.yLabel}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Insight Banner ── */}
        <div className={`rounded-xl px-4 py-3 border text-[11px] font-bold ${badge.cls}`}>
          <span className="font-black">{badge.label}</span>{" · "}{insight}
        </div>

        {/* ── Scatter Chart ── */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-zenith">
          <h3 className="text-[12px] font-black text-foreground mb-0.5">{activePair.xLabel} vs {activePair.yLabel}</h3>
          <p className="text-[10px] text-muted-foreground mb-4">Each dot = one day · Last {days} days</p>

          {showDow&&(
            <div className="flex flex-wrap gap-2 mb-3">
              {DOW_LABELS.map((l,i)=>(
                <div key={i} className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full" style={{background:DOW_COLORS[i]}}/> {l}
                </div>
              ))}
            </div>
          )}

          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{top:8,right:8,bottom:16,left:0}}>
              <CartesianGrid stroke="var(--border)" strokeOpacity={0.5}/>
              <XAxis dataKey="x" name={activePair.xLabel} tick={{fill:"var(--muted-foreground)",fontSize:10}}
                label={{value:activePair.xLabel,position:"insideBottom",offset:-10,fill:"var(--muted-foreground)",fontSize:10}}/>
              <YAxis dataKey="y" name={activePair.yLabel} tick={{fill:"var(--muted-foreground)",fontSize:10}}/>
              <Tooltip content={<ScatterTooltip/>}/>
              {showDow
                ?[0,1,2,3,4,5,6].map(dow=>(
                    <Scatter key={dow} data={dataPoints.filter(p=>p.dow===dow)} fill={DOW_COLORS[dow]} fillOpacity={0.75} r={5}/>
                  ))
                :<Scatter data={dataPoints} fill="var(--primary)" fillOpacity={0.65} r={5}/>
              }
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* ── 7-day Rolling Average ── */}
        {rollingY.length>0&&(
          <div className="bg-card border border-border rounded-xl p-5 shadow-zenith">
            <h3 className="text-[12px] font-black text-foreground mb-0.5">7-Day Rolling Average</h3>
            <p className="text-[10px] text-muted-foreground mb-4">{activePair.yLabel} smoothed over time</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={rollingY}>
                <CartesianGrid stroke="var(--border)" strokeOpacity={0.5}/>
                <XAxis dataKey="date" tick={false}/>
                <YAxis tick={{fill:"var(--muted-foreground)",fontSize:10}}/>
                <Tooltip content={<TrendTooltip/>}/>
                <Line type="monotone" dataKey="avg" name="7-day avg" stroke="var(--primary)" dot={false} strokeWidth={2.5}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
