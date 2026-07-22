"use client";
import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, CalendarDays, Flame, Dumbbell, CheckSquare, Wallet, PiggyBank } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { PageHeader } from "@/components/PageHeader";
import { ReportsNav } from "@/components/ReportsNav";
import { SectionNav } from "@/components/SectionNav";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const SUMMARY_TABS = [
  { title: "Weekly",  href: "/reports/summary/weekly",  icon: <CalendarDays size={14} /> },
  { title: "Monthly", href: "/reports/summary/monthly", icon: <Flame size={14} /> },
  { title: "Yearly",  href: "/reports/summary/yearly",  icon: <TrendingUp size={14} /> },
];

export default function MonthlySummaryPage() {
  const [data, setData] = useState<any>(null);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const now       = new Date();
      const thisStart = format(startOfMonth(now), "yyyy-MM-dd");
      const thisEnd   = format(endOfMonth(now), "yyyy-MM-dd");
      const lastStart = format(startOfMonth(subMonths(now,1)), "yyyy-MM-dd");
      const lastEnd   = format(endOfMonth(subMonths(now,1)), "yyyy-MM-dd");

      const [
        {data:thisExp},{data:lastExp},
        {data:thisInc},{data:lastInc},
        {data:thisHab},{data:lastHab},
        {data:habCfg},
        {data:thisWkt},{data:lastWkt},
        {data:thisTsk},{data:lastTsk},
        {data:thisCats},
      ] = await Promise.all([
        supabase.from("history_expenses").select("amount").eq("type","Expense").gte("date",thisStart).lte("date",thisEnd),
        supabase.from("history_expenses").select("amount").eq("type","Expense").gte("date",lastStart).lte("date",lastEnd),
        supabase.from("history_expenses").select("amount").eq("type","Income").gte("date",thisStart).lte("date",thisEnd),
        supabase.from("history_expenses").select("amount").eq("type","Income").gte("date",lastStart).lte("date",lastEnd),
        supabase.from("habit_data").select("habit,value").gte("date",thisStart).lte("date",thisEnd),
        supabase.from("habit_data").select("habit,value").gte("date",lastStart).lte("date",lastEnd),
        supabase.from("habit_config").select("habit_name").eq("is_active",true),
        supabase.from("workout_log").select("date,weight,reps").gte("date",thisStart).lte("date",thisEnd),
        supabase.from("workout_log").select("date,weight,reps").gte("date",lastStart).lte("date",lastEnd),
        supabase.from("tasks").select("status").eq("status","Completed").gte("completed_at",thisStart+"T00:00:00"),
        supabase.from("tasks").select("status").eq("status","Completed").gte("completed_at",lastStart+"T00:00:00").lte("completed_at",lastEnd+"T23:59:59"),
        supabase.from("history_expenses").select("category,amount").eq("type","Expense").gte("date",thisStart).lte("date",thisEnd),
      ]);

      const daysInMonth=(start:string,end:string)=>Math.round((new Date(end).getTime()-new Date(start).getTime())/86400000)+1;
      const totalH=(habCfg||[]).length;
      const habitPct=(hd:any[],days:number)=>{if(!totalH||!days)return 0;const done=(hd||[]).filter((h:any)=>h.value&&h.value!=="0"&&h.value!=="false").length;return Math.round((done/(totalH*days))*100);};
      const wktDays=(wd:any[])=>new Set((wd||[]).map((w:any)=>w.date)).size;
      const wktVol=(wd:any[])=>Math.round((wd||[]).reduce((s:number,w:any)=>s+((parseFloat(w.weight)||0)*(parseInt(w.reps)||0)),0));
      const sum=(ed:any[])=>(ed||[]).reduce((s:number,e:any)=>s+(parseFloat(e.amount)||0),0);

      const thisDays=daysInMonth(thisStart,format(now,"yyyy-MM-dd"));
      const lastDays=daysInMonth(lastStart,lastEnd);

      const catMap:Record<string,number>={};
      (thisCats||[]).forEach((e:any)=>{const c=e.category||"Other";catMap[c]=(catMap[c]||0)+(parseFloat(e.amount)||0);});
      setCategoryData(Object.entries(catMap).map(([name,value])=>({name,value:Math.round(value as number)})).sort((a,b)=>b.value-a.value).slice(0,8));

      const thisSpend=sum(thisExp||[]),lastSpend=sum(lastExp||[]),thisIncome=sum(thisInc||[]),lastIncome=sum(lastInc||[]);
      setData({
        this:{spend:thisSpend,income:thisIncome,savings:thisIncome-thisSpend,habitPct:habitPct(thisHab||[],thisDays),wktDays:wktDays(thisWkt||[]),wktVol:wktVol(thisWkt||[]),tasks:(thisTsk||[]).length},
        last:{spend:lastSpend,income:lastIncome,savings:lastIncome-lastSpend,habitPct:habitPct(lastHab||[],lastDays),wktDays:wktDays(lastWkt||[]),wktVol:wktVol(lastWkt||[]),tasks:(lastTsk||[]).length},
        thisLabel:format(now,"MMMM yyyy"),lastLabel:format(subMonths(now,1),"MMMM yyyy"),
      });
      setLoading(false);
    }
    load();
  },[]);

  const pct=(curr:number,prev:number)=>{
    if(prev===0&&curr===0) return "–";
    if(prev===0) return curr>0?"+100%":"–";
    const d=Math.round(((curr-prev)/prev)*100);
    return d>0?`+${d}%`:`${d}%`;
  };

  const CustomTooltip=({active,payload}:any)=>{
    if(active&&payload?.length)return(
      <div className="bg-card border border-border rounded-xl p-3 shadow-md text-xs font-black">
        <div className="text-muted-foreground mb-1">{payload[0]?.payload?.name}</div>
        <div className="text-foreground">₹{payload[0]?.value?.toLocaleString("en-IN")}</div>
      </div>
    );
    return null;
  };

  const metrics=data?[
    {label:"Total Spend",    icon:<Wallet size={13}/>,     thisVal:`₹${Math.round(data.this.spend).toLocaleString("en-IN")}`,   lastVal:`₹${Math.round(data.last.spend).toLocaleString("en-IN")}`,   diff:pct(data.this.spend,data.last.spend),     curr:data.this.spend,   prev:data.last.spend,   lower:true},
    {label:"Total Income",   icon:<PiggyBank size={13}/>,  thisVal:`₹${Math.round(data.this.income).toLocaleString("en-IN")}`,  lastVal:`₹${Math.round(data.last.income).toLocaleString("en-IN")}`,  diff:pct(data.this.income,data.last.income),   curr:data.this.income,  prev:data.last.income,  lower:false},
    {label:"Net Savings",    icon:<TrendingUp size={13}/>, thisVal:`₹${Math.round(data.this.savings).toLocaleString("en-IN")}`, lastVal:`₹${Math.round(data.last.savings).toLocaleString("en-IN")}`, diff:pct(data.this.savings,data.last.savings), curr:data.this.savings, prev:data.last.savings, lower:false},
    {label:"Habit Consistency",icon:<Flame size={13}/>,   thisVal:`${data.this.habitPct}%`,                                    lastVal:`${data.last.habitPct}%`,                                    diff:pct(data.this.habitPct,data.last.habitPct),curr:data.this.habitPct,prev:data.last.habitPct,lower:false},
    {label:"Workout Days",   icon:<Dumbbell size={13}/>,  thisVal:`${data.this.wktDays} days`,                                 lastVal:`${data.last.wktDays} days`,                                 diff:pct(data.this.wktDays,data.last.wktDays),  curr:data.this.wktDays, prev:data.last.wktDays, lower:false},
    {label:"Tasks Completed",icon:<CheckSquare size={13}/>,thisVal:`${data.this.tasks} tasks`,                                 lastVal:`${data.last.tasks} tasks`,                                  diff:pct(data.this.tasks,data.last.tasks),      curr:data.this.tasks,   prev:data.last.tasks,   lower:false},
  ]:[];

  return (
    <div className="bg-background min-h-screen pb-20 p-4 md:p-6 font-dm-sans">
      <PageHeader title="Intelligence" />
      <ReportsNav />

      <div className="max-w-lg mx-auto">
        <SectionNav tabs={SUMMARY_TABS} />

        {loading ? (
          <div className="text-sm text-muted-foreground text-center py-16">Loading monthly data…</div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5 text-[11px] font-black">
              <span className="text-primary uppercase tracking-widest">{data.thisLabel}</span>
              <span className="text-muted-foreground">vs</span>
              <span className="text-muted-foreground uppercase tracking-widest">{data.lastLabel}</span>
            </div>
            <div className="space-y-2 mb-8">
              {metrics.map((m,i)=>{
                const good=m.lower?m.curr<m.prev:m.curr>m.prev;
                const neutral=m.curr===m.prev||m.prev===0;
                const changeColor=neutral?"text-muted-foreground":good?"text-emerald-600":"text-destructive";
                const TrendIcon=neutral?Minus:good?TrendingUp:TrendingDown;
                return(
                  <div key={i} className="bg-card border border-border rounded-xl p-4 shadow-zenith grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center">
                    <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{m.icon} {m.label}</div>
                    <div className="text-[14px] font-black text-foreground">{m.thisVal}</div>
                    <div className="text-[12px] font-bold text-muted-foreground">{m.lastVal}</div>
                    <div className={`flex items-center gap-1 text-[11px] font-black ${changeColor}`}><TrendIcon size={11}/> {m.diff}</div>
                  </div>
                );
              })}
            </div>
            {categoryData.length>0&&(
              <div className="bg-card border border-border rounded-xl p-5 shadow-zenith">
                <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1">Spend by Category</h3>
                <p className="text-[10px] text-muted-foreground mb-4">{data.thisLabel}</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={categoryData} layout="vertical" margin={{left:4,right:16,top:0,bottom:0}}>
                    <CartesianGrid horizontal={false} stroke="var(--border)" strokeOpacity={0.5}/>
                    <XAxis type="number" tick={{fill:"var(--muted-foreground)",fontSize:10}} tickFormatter={(v)=>`₹${(v/1000).toFixed(0)}k`}/>
                    <YAxis type="category" dataKey="name" tick={{fill:"var(--muted-foreground)",fontSize:10}} width={80}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Bar dataKey="value" fill="var(--primary)" radius={[0,4,4,0]} opacity={0.85}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
