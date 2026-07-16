"use client";
import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, CalendarDays, Flame, Dumbbell, CheckSquare, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format, startOfYear, endOfYear, subYears, eachMonthOfInterval, endOfMonth, startOfMonth } from "date-fns";
import { PageHeader } from "@/components/PageHeader";
import { ReportsNav } from "@/components/ReportsNav";
import { SectionNav } from "@/components/SectionNav";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from "recharts";

const SUMMARY_TABS = [
  { title: "Weekly",  href: "/reports/summary/weekly",  icon: <CalendarDays size={14} /> },
  { title: "Monthly", href: "/reports/summary/monthly", icon: <Flame size={14} /> },
  { title: "Yearly",  href: "/reports/summary/yearly",  icon: <TrendingUp size={14} /> },
];

const MONTHS_SHORT=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function YearlySummaryPage() {
  const [monthlyChartData,setMonthlyChartData]=useState<any[]>([]);
  const [annualStats,setAnnualStats]=useState<any>(null);
  const [prevAnnualStats,setPrevAnnualStats]=useState<any>(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    async function load(){
      setLoading(true);
      const now=new Date();
      const thisYearStart=format(startOfYear(now),"yyyy-MM-dd");
      const thisYearEnd=format(endOfYear(now),"yyyy-MM-dd");
      const lastYearStart=format(startOfYear(subYears(now,1)),"yyyy-MM-dd");
      const lastYearEnd=format(endOfYear(subYears(now,1)),"yyyy-MM-dd");

      const [{data:thisExpAll},{data:lastExpAll},{data:thisIncAll},{data:thisWktAll},{data:lastWktAll},{data:thisHabAll},{data:habCfg},{data:thisTskAll},{data:lastTskAll}]=
        await Promise.all([
          supabase.from("history_expenses").select("date,amount,category").eq("type","Expense").gte("date",thisYearStart).lte("date",thisYearEnd),
          supabase.from("history_expenses").select("amount").eq("type","Expense").gte("date",lastYearStart).lte("date",lastYearEnd),
          supabase.from("history_expenses").select("date,amount").eq("type","Income").gte("date",thisYearStart).lte("date",thisYearEnd),
          supabase.from("workout_log").select("date,weight,reps").gte("date",thisYearStart).lte("date",thisYearEnd),
          supabase.from("workout_log").select("weight,reps").gte("date",lastYearStart).lte("date",lastYearEnd),
          supabase.from("habit_data").select("date,value").gte("date",thisYearStart).lte("date",thisYearEnd),
          supabase.from("habit_config").select("habit_name").eq("is_active",true),
          supabase.from("tasks").select("completed_at").eq("status","Completed").gte("completed_at",thisYearStart+"T00:00:00"),
          supabase.from("tasks").select("completed_at").eq("status","Completed").gte("completed_at",lastYearStart+"T00:00:00").lte("completed_at",lastYearEnd+"T23:59:59"),
        ]);

      const sum=(arr:any[])=>(arr||[]).reduce((s:number,e:any)=>s+(parseFloat(e.amount)||0),0);
      const wktVol=(arr:any[])=>Math.round((arr||[]).reduce((s:number,w:any)=>s+((parseFloat(w.weight)||0)*(parseInt(w.reps)||0)),0));
      const totalH=(habCfg||[]).length;

      const months=eachMonthOfInterval({start:startOfYear(now),end:now});
      const chartRows=months.map(m=>{
        const mStart=format(startOfMonth(m),"yyyy-MM-dd"),mEnd=format(endOfMonth(m),"yyyy-MM-dd");
        const mExp=(thisExpAll||[]).filter((e:any)=>e.date>=mStart&&e.date<=mEnd);
        const mInc=(thisIncAll||[]).filter((e:any)=>e.date>=mStart&&e.date<=mEnd);
        const mWkt=(thisWktAll||[]).filter((w:any)=>w.date>=mStart&&w.date<=mEnd);
        const mHab=(thisHabAll||[]).filter((h:any)=>h.date>=mStart&&h.date<=mEnd);
        const daysInM=endOfMonth(m).getDate();
        const habPct=totalH>0?Math.round(((mHab||[]).filter((h:any)=>h.value&&h.value!=="0").length/(totalH*daysInM))*100):0;
        return{month:MONTHS_SHORT[m.getMonth()],spend:Math.round(sum(mExp)),income:Math.round(sum(mInc)),workoutVol:wktVol(mWkt),habitPct:habPct};
      });
      setMonthlyChartData(chartRows);

      const habConsistency=totalH>0?Math.round(((thisHabAll||[]).filter((h:any)=>h.value&&h.value!=="0").length/(totalH*365))*100):0;
      setAnnualStats({spend:sum(thisExpAll||[]),income:sum(thisIncAll||[]),wktVol:wktVol(thisWktAll||[]),wktDays:new Set((thisWktAll||[]).map((w:any)=>w.date)).size,tasks:(thisTskAll||[]).length,habitPct:habConsistency,label:now.getFullYear().toString()});
      setPrevAnnualStats({spend:sum(lastExpAll||[]),wktVol:wktVol(lastWktAll||[]),tasks:(lastTskAll||[]).length,label:(now.getFullYear()-1).toString()});
      setLoading(false);
    }
    load();
  },[]);

  const pct=(curr:number,prev:number)=>{
    if(prev===0&&curr===0)return "–";
    if(prev===0)return curr>0?"+100%":"–";
    const d=Math.round(((curr-prev)/prev)*100);
    return d>0?`+${d}%`:`${d}%`;
  };

  const CustomTooltip=({active,payload,label}:any)=>{
    if(active&&payload?.length)return(
      <div className="bg-card border border-border rounded-xl p-3 shadow-md text-xs font-black">
        <div className="text-muted-foreground mb-2">{label}</div>
        {payload.map((p:any,i:number)=>(
          <div key={i} className="flex gap-3 justify-between" style={{color:p.color}}>
            <span>{p.name}:</span>
            <span>{p.name==="Spend"||p.name==="Income"?`₹${p.value?.toLocaleString("en-IN")}`:p.value}</span>
          </div>
        ))}
      </div>
    );
    return null;
  };

  return (
    <div className="bg-background min-h-screen pb-20 p-4 md:p-6 font-dm-sans">
      <PageHeader title="Intelligence" />
      <ReportsNav />

      <div className="max-w-lg mx-auto">
        <SectionNav tabs={SUMMARY_TABS} />

        {loading ? (
          <div className="text-sm text-muted-foreground text-center py-16">Loading yearly data…</div>
        ) : (
          <>
            {annualStats&&prevAnnualStats&&(
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  {label:"Total Spend",  icon:<Wallet size={12}/>,    val:`₹${Math.round(annualStats.spend).toLocaleString("en-IN")}`,         diff:pct(annualStats.spend,prevAnnualStats.spend),    curr:annualStats.spend,    prev:prevAnnualStats.spend,    lower:true},
                  {label:"Workout Vol",  icon:<Dumbbell size={12}/>,  val:`${annualStats.wktVol.toLocaleString()} kg·reps`,                    diff:pct(annualStats.wktVol,prevAnnualStats.wktVol),  curr:annualStats.wktVol,   prev:prevAnnualStats.wktVol,  lower:false},
                  {label:"Workout Days", icon:<Dumbbell size={12}/>,  val:`${annualStats.wktDays} days`,                                       diff:"–",curr:0,prev:0,lower:false},
                  {label:"Habit %",      icon:<Flame size={12}/>,     val:`${annualStats.habitPct}%`,                                          diff:"–",curr:0,prev:0,lower:false},
                  {label:"Tasks Done",   icon:<CheckSquare size={12}/>,val:`${annualStats.tasks}`,                                             diff:pct(annualStats.tasks,prevAnnualStats.tasks),    curr:annualStats.tasks,    prev:prevAnnualStats.tasks,   lower:false},
                  {label:"Net Savings",  icon:<TrendingUp size={12}/>, val:`₹${Math.round(annualStats.income-annualStats.spend).toLocaleString("en-IN")}`,diff:"–",curr:0,prev:0,lower:false},
                ].map((s,i)=>{
                  const good=s.lower?s.curr<s.prev:s.curr>s.prev;
                  const neutral=s.curr===s.prev||s.prev===0||s.diff==="–";
                  const TI=neutral?Minus:good?TrendingUp:TrendingDown;
                  const cc=neutral?"text-muted-foreground":good?"text-emerald-600":"text-destructive";
                  return(
                    <div key={i} className="bg-card border border-border rounded-xl p-4 shadow-zenith">
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">{s.icon} {s.label}</div>
                      <div className="text-xl font-black text-foreground mb-1">{s.val}</div>
                      <div className={`flex items-center gap-1 text-[10px] font-black ${cc}`}><TI size={11}/> {s.diff} vs {prevAnnualStats.label}</div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="bg-card border border-border rounded-xl p-5 shadow-zenith mb-4">
              <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1">Monthly Spend vs Income</h3>
              <p className="text-[10px] text-muted-foreground mb-4">{annualStats?.label}</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyChartData}>
                  <CartesianGrid stroke="var(--border)" strokeOpacity={0.5} vertical={false}/>
                  <XAxis dataKey="month" tick={{fill:"var(--muted-foreground)",fontSize:10}}/>
                  <YAxis tick={{fill:"var(--muted-foreground)",fontSize:10}} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Legend wrapperStyle={{fontSize:10}}/>
                  <Bar dataKey="spend"  name="Spend"  fill="var(--color-danger)"   radius={[4,4,0,0]} opacity={0.8}/>
                  <Bar dataKey="income" name="Income" fill="var(--color-success)"  radius={[4,4,0,0]} opacity={0.8}/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-zenith mb-4">
              <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1">Workout Volume Trend</h3>
              <p className="text-[10px] text-muted-foreground mb-4">Monthly kg·reps total</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={monthlyChartData}>
                  <CartesianGrid stroke="var(--border)" strokeOpacity={0.5}/>
                  <XAxis dataKey="month" tick={{fill:"var(--muted-foreground)",fontSize:10}}/>
                  <YAxis tick={{fill:"var(--muted-foreground)",fontSize:10}}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Line type="monotone" dataKey="workoutVol" name="Volume" stroke="var(--primary)" dot={{r:3,fill:"var(--primary)"}} strokeWidth={2}/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-zenith">
              <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1">Habit Consistency by Month</h3>
              <p className="text-[10px] text-muted-foreground mb-4">% of active habits completed per month</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={monthlyChartData}>
                  <CartesianGrid stroke="var(--border)" strokeOpacity={0.5} vertical={false}/>
                  <XAxis dataKey="month" tick={{fill:"var(--muted-foreground)",fontSize:10}}/>
                  <YAxis domain={[0,100]} tick={{fill:"var(--muted-foreground)",fontSize:10}} tickFormatter={v=>`${v}%`}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Bar dataKey="habitPct" name="Habit %" fill="var(--color-warning)" radius={[4,4,0,0]} opacity={0.85}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
