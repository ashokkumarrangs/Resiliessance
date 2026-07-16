"use client";
import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeftCircle, RefreshCw, TrendingUp, Activity, CheckCircle2, 
  Wallet, Car, BarChart2, CalendarDays, ChevronDown, ChevronLeft, 
  ChevronRight, Flame, Scale, Zap, Gauge, Box, PackageCheck,
  Weight, Grid3X3, Map, LayoutPanelLeft, ListTodo
} from "lucide-react";
import { useRouter } from "next/navigation";
import { 
  format, subDays, startOfMonth, eachDayOfInterval, isSameDay, 
  startOfWeek, endOfWeek, endOfMonth, addMonths, subMonths,
  subMonths as subM, startOfYear, endOfYear, differenceInDays
} from "date-fns";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadialBarChart, RadialBar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const COLORS = ["var(--color-primary)", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#ec4899", "#84cc16"];

const STATUS_COLORS: Record<string, string> = {
  "Success": "bg-emerald-500",
  "Failure": "bg-rose-500",
  "Tolerance": "bg-amber-500",
  "Critical": "bg-orange-600",
  "Not Entered": "bg-muted/40"
};

function SectionCard({ title, icon, children, headerRight, className = "" }: { title: string; icon: React.ReactNode; children: React.ReactNode; headerRight?: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden flex flex-col ${className}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/20">
        <div className="flex items-center gap-3">
          <span className="text-primary/50">{icon}</span>
          <h2 className="text-sm font-black uppercase tracking-widest text-foreground/60">{title}</h2>
        </div>
        {headerRight}
      </div>
      <div className="p-5 flex-1">{children}</div>
    </div>
  );
}

function StatPill({ label, value, color = "text-foreground", subValue, className = "" }: { label: string; value: string; color?: string; subValue?: string; className?: string }) {
  return (
    <div className={`bg-muted/40 rounded-xl px-4 py-3 flex flex-col gap-0.5 ${className}`}>
      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">{label}</span>
      <span className={`text-lg font-black ${color}`}>{value}</span>
      {subValue && <span className="text-[8px] font-bold text-muted-foreground/40">{subValue}</span>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/40 rounded-xl shadow-lg px-3 py-2 text-xs font-black">
      <div className="text-muted-foreground/60 mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4" style={{ color: p.color }}>
          <span>{p.name}:</span>
          <span>{typeof p.value === "number" && (p.name.includes("₹") || p.unit === "₹" || p.name.includes("Spent") || p.name.includes("Income")) ? `₹${p.value.toLocaleString()}` : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [daysRange, setDaysRange] = useState(15);
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  
  const [savingsRange, setSavingsRange] = useState(180); 
  const [isCustomSavingsRange, setIsCustomSavingsRange] = useState(false);
  const [savingsCustomStart, setSavingsCustomStart] = useState("");
  const [savingsCustomEnd, setSavingsCustomEnd] = useState("");

  const [budgetMonth, setBudgetMonth] = useState(startOfMonth(new Date()));
  const [expenseMonth, setExpenseMonth] = useState(startOfMonth(new Date()));
  const [expenseSelectedCategory, setExpenseSelectedCategory] = useState("All");

  const [trendDaysRange, setTrendDaysRange] = useState(30);
  const [isCustomTrendRange, setIsCustomTrendRange] = useState(false);
  const [trendCustomStart, setTrendCustomStart] = useState("");
  const [trendCustomEnd, setTrendCustomEnd] = useState("");
  const [trendFilters, setTrendFilters] = useState({ category: "All", subcategory: "All", place: "All", vendor: "All", particular: "All" });
  const [trendData, setTrendData] = useState<any[]>([]);
  const [filterOptions, setFilterOptions] = useState({ categories: [], subcategories: [], places: [], vendors: [], particulars: [] });

  const [habitTrendDaysRange, setHabitTrendDaysRange] = useState(30);
  const [isCustomHabitTrendRange, setIsCustomHabitTrendRange] = useState(false);
  const [habitTrendCustomStart, setHabitTrendCustomStart] = useState("");
  const [habitTrendCustomEnd, setHabitTrendCustomEnd] = useState("");
  const [habitTrendGroup, setHabitTrendGroup] = useState("All Groups");
  const [habitGravityData, setHabitGravityData] = useState<any[]>([]);
  const [habitHeatmapData, setHabitHeatmapData] = useState<any[]>([]);

  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedCalendarHabit, setSelectedCalendarHabit] = useState<string>("All Habits");

  // Finance States
  const [savingsRateData, setSavingsRateData] = useState<any[]>([]);
  const [budgetVariance, setBudgetVariance] = useState<any[]>([]);
  const [netWorthTrend, setNetWorthTrend] = useState<any[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [liquidity, setLiquidity] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [liabilities, setLiabilities] = useState<any[]>([]);
  const [netWorthParts, setNetWorthParts] = useState({ liq: 0, ast: 0, lib: 0 });
  const [expenses30, setExpenses30] = useState<any[]>([]);
  const [detailedExpenses, setDetailedExpenses] = useState<any[]>([]);
  const [catSpendData, setCatSpendData] = useState<any[]>([]);
  const [subCatSpendData, setSubCatSpendData] = useState<any[]>([]);

  // Habit States
  const [habitScores, setHabitScores] = useState<any[]>([]);
  const [habitBreakdown, setHabitBreakdown] = useState<any[]>([]);
  const [allHabitData, setAllHabitData] = useState<any[]>([]);
  const [habitConfigs, setHabitConfigs] = useState<any[]>([]);
  const [habitRadarData, setHabitRadarData] = useState<any[]>([]);

  // Workout States
  const [workoutData, setWorkoutData] = useState<any[]>([]);
  const [workoutVolumeTrend, setWorkoutVolumeTrend] = useState<any[]>([]);
  const [workoutBodyDist, setWorkoutBodyDist] = useState<any[]>([]);
  const [workoutFreshness, setWorkoutFreshness] = useState<any[]>([]);
  const [workoutIntensityData, setWorkoutIntensityData] = useState<any[]>([]);
  const [workoutBiasData, setWorkoutBiasData] = useState<any[]>([]);
  const [workoutVelocityData, setWorkoutVelocityData] = useState<any[]>([]);
  const [workoutHeatmapData, setWorkoutHeatmapData] = useState<any[]>([]);
  const [workoutCalendarMonth, setWorkoutCalendarMonth] = useState(new Date());
  const [routineCalendarMonth, setRoutineCalendarMonth] = useState(new Date());
  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState("All");

  // Vehicle States
  const [fuelEfficiencyTrend, setFuelEfficiencyTrend] = useState<any[]>([]);
  const [vehicleTCO, setVehicleTCO] = useState<any[]>([]);
  const [vehicleSpend, setVehicleSpend] = useState<any[]>([]);
  const [vehicleKMsTrend, setVehicleKMsTrend] = useState<any[]>([]);
  const [vehicleCPK, setVehicleCPK] = useState<any[]>([]);
  const [vehicleUsageHeatmap, setVehicleUsageHeatmap] = useState<any[]>([]);
  const [vehicleKMsDays, setVehicleKMsDays] = useState(30);
  const [isVehicleKMsCustom, setIsVehicleKMsCustom] = useState(false);
  const [vkStart, setVkStart] = useState("");
  const [vkEnd, setVkEnd] = useState("");

  const [activeTab, setActiveTab] = useState("ALL");

  // Task States
  const [taskStats, setTaskStats] = useState({ done: 0, pending: 0, high: 0 });
  const [taskVelocity, setTaskVelocity] = useState<any[]>([]);
  const [taskAging, setTaskAging] = useState<any[]>([]);
  const [taskThroughput, setTaskThroughput] = useState<any[]>([]);
  const [taskHeatmap, setTaskHeatmap] = useState<any[]>([]);

  useEffect(() => { 
    fetchAll(); 
  }, [daysRange, isCustomRange, savingsRange, isCustomSavingsRange, budgetMonth, expenseMonth, expenseSelectedCategory, trendDaysRange, isCustomTrendRange, trendFilters, habitTrendDaysRange, isCustomHabitTrendRange, habitTrendGroup, vehicleKMsDays, isVehicleKMsCustom]);

  const fetchAll = async () => {
    setLoading(true);
    const today = new Date();
    const startDate = isCustomRange && customStart ? new Date(customStart) : subDays(today, daysRange - 1);
    const startDateStr = format(startDate, "yyyy-MM-dd");
    const d30 = format(subDays(today, 29), "yyyy-MM-dd");
    const d365 = format(subDays(today, 364), "yyyy-MM-dd");
    const monthStart = format(budgetMonth, "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(budgetMonth), "yyyy-MM-dd");

    const results = await Promise.all([
      supabase.from("history_expenses").select("*").gte("date", d30).order("date"), // 0
      supabase.from("liquidity").select("*"), // 1
      supabase.from("assets").select("*"), // 2
      supabase.from("liabilities").select("*"), // 3
      supabase.from("habit_data").select("*").gte("date", d365), // 4
      supabase.from("habit_config").select("*"), // 5
      supabase.from("workout_log").select("*").gte("date", d365).order("date"), // 6
      supabase.from("tasks").select("*"), // 7
      supabase.from("vehicle_config").select("*"), // 8
      supabase.from("vehicle_fuel_logs").select("*").order("date"), // 9
      supabase.from("vehicle_service_logs").select("*").order("date"), // 10
      supabase.from("budget_plans").select("*").eq("month", monthStart), // 11
      supabase.from("history_liabilities").select("*").gte("date", startDateStr).order("date", { ascending: false }), // 12
      supabase.from("history_expenses").select("*").gte("date", startDateStr).order("date", { ascending: false }), // 13
      supabase.from("history_expenses").select("*").gte("date", monthStart).lte("date", monthEnd), // 14
      supabase.from("detailed_monthly_expenses").select("*").gte("date", monthStart), // 15
      supabase.from("history_expenses").select("*").gte("date", isCustomTrendRange && trendCustomStart ? trendCustomStart : format(subDays(today, trendDaysRange - 1), "yyyy-MM-dd")).lte("date", isCustomTrendRange && trendCustomEnd ? trendCustomEnd : format(today, "yyyy-MM-dd")).order("date"), // 16
      supabase.from("habit_data").select("*").gte("date", isCustomHabitTrendRange && habitTrendCustomStart ? habitTrendCustomStart : format(subDays(today, habitTrendDaysRange - 1), "yyyy-MM-dd")).lte("date", isCustomHabitTrendRange && habitTrendCustomEnd ? habitTrendCustomEnd : format(today, "yyyy-MM-dd")), // 17
      supabase.from("vehicle_mileage_logs").select("*").gte("date", d365) // 18
    ]);

    const expData = results[0].data;
    const liqData = results[1].data;
    const astData = results[2].data;
    const libData = results[3].data;
    const habitData = results[4].data;
    const habitCfg = results[5].data;
    const workoutRaw = results[6].data || [];
    const taskData = results[7].data;
    const vehicleCfg = results[8].data;
    const fuelData = results[9].data;
    const svcData = results[10].data;
    const budgetPlans = results[11].data;
    const histLibData = results[12].data;
    const histExpRange = results[13].data;
    const histMonthRange = results[14].data;
    const detailedMonthExp = results[15].data;
    const trendMonthExp = results[16].data;
    const habitTrendRaw = results[17].data;
    const mLog = results[18].data;

    setDetailedExpenses(detailedMonthExp || []);

    // --- FINANCE CONSOLIDATION ---
    const dayMap: Record<string, number> = {};
    const catMap: Record<string, number> = {};
    (expData || []).forEach(r => {
      if (r.type === "Expense") {
        dayMap[r.date] = (dayMap[r.date] || 0) + (parseFloat(r.amount) || 0);
        catMap[r.category] = (catMap[r.category] || 0) + (parseFloat(r.amount) || 0);
      }
    });
    setExpenses30(Object.entries(dayMap).map(([date, amount]) => ({ date: format(new Date(date), "dd MMM"), amount: Math.round(amount) })));
    setCategoryBreakdown(Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name, value]) => ({ name, value: Math.round(value) })));

    const savToday = isCustomSavingsRange && savingsCustomEnd ? new Date(savingsCustomEnd) : new Date();
    const savStart = isCustomSavingsRange && savingsCustomStart ? new Date(savingsCustomStart) : subDays(savToday, savingsRange - 1);
    const { data: savHist } = await supabase.from("history_expenses").select("date,amount,type").gte("date", format(savStart, "yyyy-MM-dd")).lte("date", format(savToday, "yyyy-MM-dd"));
    const useDailyGrouping = savingsRange <= 45 || (isCustomSavingsRange && eachDayOfInterval({start: savStart, end: savToday}).length <= 45);
    const srMap: Record<string, { income: number, expense: number }> = {};
    if (useDailyGrouping) { eachDayOfInterval({ start: savStart, end: savToday }).forEach(d => { srMap[format(d, "dd MMM")] = { income: 0, expense: 0 }; }); } else { let curr = startOfMonth(savStart); while (curr <= savToday) { srMap[format(curr, "MMM yyyy")] = { income: 0, expense: 0 }; curr = addMonths(curr, 1); } }
    (savHist || []).forEach(r => { const key = useDailyGrouping ? format(new Date(r.date), "dd MMM") : format(new Date(r.date), "MMM yyyy"); if (srMap[key]) { if (r.type === 'Income') srMap[key].income += parseFloat(r.amount) || 0; if (r.type === 'Expense') srMap[key].expense += parseFloat(r.amount) || 0; } });
    setSavingsRateData(Object.entries(srMap).map(([name, v]) => ({ name, ...v, savings: v.income - v.expense })));

    const curLiq = (liqData || []).reduce((s, a) => s + (parseFloat(a.balance) || 0), 0);
    const curAst = (astData || []).reduce((s, a) => s + (parseFloat(a.current_value) || 0), 0);
    const curLib = (libData || []).reduce((s, l) => s + (parseFloat(l.remaining) || 0), 0);
    setNetWorthParts({ liq: Math.round(curLiq), ast: Math.round(curAst), lib: Math.round(curLib) });
    const nwTrend: any[] = [];
    let rLiq = curLiq, rLib = curLib, rAst = curAst;
    const nwInterval = eachDayOfInterval({ start: startDate, end: today }).reverse();
    nwInterval.forEach((day) => {
      const dStr = format(day, "yyyy-MM-dd");
      nwTrend.push({ date: format(day, "dd MMM"), liquidity: Math.round(rLiq), assets: Math.round(rAst), liabilities: Math.round(rLib), networth: Math.round(rLiq + rAst - rLib) });
      (histExpRange || []).filter(e => e.date === dStr).forEach(e => { const a = parseFloat(e.amount) || 0; if (e.type === 'Income') rLiq -= a; if (e.type === 'Expense') rLiq += a; });
      (histLibData || []).filter(l => l.date === dStr).forEach(l => { const a = parseFloat(l.amount) || 0; if (l.type === 'Borrowed') rLib -= a; if (l.type === 'Repay' || l.type === 'Principal') rLib += a; });
    });
    setNetWorthTrend(nwTrend.reverse());

    const bvMap: Record<string, { planned: number, actual: number }> = {};
    (budgetPlans || []).forEach(p => { if (!bvMap[p.category]) bvMap[p.category] = { planned: 0, actual: 0 }; bvMap[p.category].planned += parseFloat(p.planned_amount) || 0; });
    (histMonthRange || []).filter(e => e.type === 'Expense').forEach(e => { if (!bvMap[e.category]) bvMap[e.category] = { planned: 0, actual: 0 }; bvMap[e.category].actual += parseFloat(e.amount) || 0; });
    setBudgetVariance(Object.entries(bvMap).map(([name, v]) => ({ name, ...v, diff: v.planned - v.actual })));

    const eCatMap: Record<string, number> = {};
    const eSubMap: Record<string, number> = {};
    (histMonthRange || []).filter(e => e.type === 'Expense').forEach(e => {
      eCatMap[e.category] = (eCatMap[e.category] || 0) + (parseFloat(e.amount) || 0);
      if (expenseSelectedCategory === "All" || e.category === expenseSelectedCategory) {
        eSubMap[e.subcategory || "Uncategorized"] = (eSubMap[e.subcategory || "Uncategorized"] || 0) + (parseFloat(e.amount) || 0);
      }
    });
    setCatSpendData(Object.entries(eCatMap).sort((a,b)=>b[1]-a[1]).map(([name, value]) => ({ name, value: Math.round(value) })));
    setSubCatSpendData(Object.entries(eSubMap).sort((a,b)=>b[1]-a[1]).map(([name, value]) => ({ name, value: Math.round(value) })));

    const tToday = isCustomTrendRange && trendCustomEnd ? new Date(trendCustomEnd) : new Date();
    const tStart = isCustomTrendRange && trendCustomStart ? new Date(trendCustomStart) : subDays(tToday, trendDaysRange - 1);
    const tMap: Record<string, number> = {};
    eachDayOfInterval({ start: tStart, end: tToday }).forEach(d => tMap[format(d, "yyyy-MM-dd")] = 0);
    const opts: any = { categories: new Set(), subcategories: new Set(), places: new Set(), vendors: new Set(), particulars: new Set() };
    (trendMonthExp || []).forEach(e => {
      opts.categories.add(e.category); opts.subcategories.add(e.subcategory); opts.places.add(e.place); opts.vendors.add(e.vendor); opts.particulars.add(e.particular);
      const matches = (trendFilters.category === "All" || e.category === trendFilters.category) && (trendFilters.subcategory === "All" || e.subcategory === trendFilters.subcategory) && (trendFilters.place === "All" || e.place === trendFilters.place) && (trendFilters.vendor === "All" || e.vendor === trendFilters.vendor) && (trendFilters.particular === "All" || e.particular === trendFilters.particular);
      if (matches && e.type === 'Expense') tMap[e.date] = (tMap[e.date] || 0) + (parseFloat(e.amount) || 0);
    });
    setFilterOptions({ categories: Array.from(opts.categories).filter(Boolean) as any, subcategories: Array.from(opts.subcategories).filter(Boolean) as any, places: Array.from(opts.places).filter(Boolean) as any, vendors: Array.from(opts.vendors).filter(Boolean) as any, particulars: Array.from(opts.particulars).filter(Boolean) as any });
    setTrendData(Object.entries(tMap).map(([date, amount]) => ({ date: format(new Date(date), "dd"), amount: Math.round(amount) })));

    setLiquidity((liqData || []).map(a => ({ name: a.account_name, value: Math.round(parseFloat(a.balance) || 0) })));
    setAssets((astData || []).map(a => ({ name: a.asset_name, current: Math.round(parseFloat(a.current_value) || 0), bought: Math.round(parseFloat(a.purchase_price) || 0) })));
    setLiabilities((libData || []).map(l => ({ name: l.party, value: Math.round(parseFloat(l.remaining) || 0) })));

    // --- HABITS CONSOLIDATION ---
    setHabitConfigs(habitCfg || []);
    setAllHabitData(habitData || []);
    const hTrendToday = isCustomHabitTrendRange && habitTrendCustomEnd ? new Date(habitTrendCustomEnd) : new Date();
    const hTrendStart = isCustomHabitTrendRange && habitTrendCustomStart ? new Date(habitTrendCustomStart) : subDays(hTrendToday, habitTrendDaysRange - 1);
    const hDayMap: Record<string, any> = {};
    eachDayOfInterval({ start: hTrendStart, end: hTrendToday }).forEach(d => { hDayMap[format(d, "yyyy-MM-dd")] = { Success: 0, Failure: 0, Critical: 0, Tolerance: 0, "Not Entered": 0 }; });
    const dailyNames = new Set((habitCfg || []).filter(c => c.frequency === "daily").map(c => c.habit_name));
    const habitToGroup: Record<string, string> = {};
    (habitCfg || []).forEach(c => { habitToGroup[c.habit_name] = c.group_name || 'General'; });
    (habitTrendRaw || []).filter(r => dailyNames.has(r.habit)).forEach(r => { const grp = habitToGroup[r.habit]; if (hDayMap[r.date] && (habitTrendGroup === "All Groups" || grp === habitTrendGroup)) { hDayMap[r.date][r.status] = (hDayMap[r.date][r.status] || 0) + 1; } });
    setHabitScores(Object.entries(hDayMap).map(([date, v]) => ({ date: format(new Date(date), "dd MMM"), ...v })));

    const hNameMap: Record<string, { success: number; fail: number }> = {};
    (habitData || []).filter(r => dailyNames.has(r.habit) && r.date >= d30).forEach(r => { if (!hNameMap[r.habit]) hNameMap[r.habit] = { success: 0, fail: 0 }; r.status === "Success" ? hNameMap[r.habit].success++ : hNameMap[r.habit].fail++; });
    setHabitBreakdown(Object.entries(hNameMap).sort((a,b)=>(b[1].success+b[1].fail)-(a[1].success+a[1].fail)).slice(0,8).map(([name, v]) => ({ name, ...v })));
    const grpMap: Record<string, { name: string, total: number, success: number }> = {};
    (habitCfg || []).forEach(c => { if (!grpMap[c.group_name || 'General']) grpMap[c.group_name || 'General'] = { name: c.group_name || 'General', total: 0, success: 0 }; });
    (habitData || []).filter(h => h.date >= d30).forEach(h => { const grp = h.group_name || 'General'; if (grpMap[grp]) { grpMap[grp].total++; if (h.status === 'Success') grpMap[grp].success++; } });
    setHabitRadarData(Object.values(grpMap).map(v => ({ subject: v.name, A: v.total > 0 ? Math.round((v.success / v.total) * 100) : 0, fullMark: 100 })));

    const gMap: Record<string, { success: number, fail: number }> = {};
    (habitData || []).filter(h => h.date >= format(subDays(today, 60), "yyyy-MM-dd")).forEach(h => { if (!gMap[h.habit]) gMap[h.habit] = { success: 0, fail: 0 }; if (h.status === 'Success') gMap[h.habit].success++; else if (h.status === 'Failure' || h.status === 'Critical') gMap[h.habit].fail++; });
    setHabitGravityData(Object.entries(gMap).map(([name, v]) => { const total = v.success + v.fail; const rate = total > 0 ? Math.round((v.fail / total) * 100) : 0; return { name, rate }; }).filter(g => g.rate > 0).sort((a,b)=>b.rate - a.rate).slice(0, 5));
    const hmMap: Record<string, { total: number, success: number }> = {};
    eachDayOfInterval({ start: subDays(today, 364), end: today }).forEach(d => hmMap[format(d, "yyyy-MM-dd")] = { total: 0, success: 0 });
    (habitData || []).forEach(h => { if (hmMap[h.date]) { hmMap[h.date].total++; if (h.status === 'Success') hmMap[h.date].success++; } });
    setHabitHeatmapData(Object.entries(hmMap).map(([date, v]) => ({ date, score: v.total > 0 ? (v.success / v.total) : 0 })));

    // --- WORKOUT CONSOLIDATION ---
    setWorkoutData(workoutRaw);
    const wVolMap: Record<string, number> = {};
    const wBodyMap: Record<string, number> = {};
    const wIntMap: Record<string, { weight: number, reps: number }> = {};
    const wBiasMap: Record<string, number> = {};
    const wFreshMap: Record<string, string> = {}; 
    workoutRaw.forEach(r => {
      const vol = (parseFloat(r.weight) || 0) * (parseInt(r.reps) || 0);
      if (r.date >= d30) wVolMap[r.date] = (wVolMap[r.date] || 0) + vol;
      if (r.date >= d30) { if (!wIntMap[r.date]) wIntMap[r.date] = { weight: 0, reps: 0 }; wIntMap[r.date].weight += (parseFloat(r.weight) || 0) * (parseInt(r.reps) || 0); wIntMap[r.date].reps += parseInt(r.reps) || 0; }
      const bp = r.body_part || r.workout_day || "Unknown";
      if (r.date >= d30) wBodyMap[bp] = (wBodyMap[bp] || 0) + vol;
      if (!wFreshMap[bp] || r.date > wFreshMap[bp]) wFreshMap[bp] = r.date;
      if (r.date >= d30 && r.workout_name) wBiasMap[r.workout_name] = (wBiasMap[r.workout_name] || 0) + 1;
    });
    setWorkoutVolumeTrend(Object.entries(wVolMap).map(([date, volume]) => ({ date: format(new Date(date), "dd"), volume: Math.round(volume) })));
    setWorkoutBodyDist(Object.entries(wBodyMap).map(([name, value]) => ({ name, value: Math.round(value) })));
    setWorkoutIntensityData(Object.entries(wIntMap).map(([date, v]) => ({ date: format(new Date(date), "dd"), intensity: v.reps > 0 ? Math.round(v.weight / v.reps) : 0 })));
    setWorkoutBiasData(Object.entries(wBiasMap).sort((a,b)=>b[1]-a[1]).slice(0, 8).map(([name, value]) => ({ name, value })));
    setWorkoutFreshness(Object.entries(wFreshMap).map(([name, lastDate]) => { const days = differenceInDays(today, new Date(lastDate)); let status = "Restored"; if (days < 2) status = "Recovering"; else if (days < 4) status = "Optimal"; return { name, days, status }; }).sort((a,b)=>b.days - a.days).slice(0, 5));
    const tMV = workoutRaw.filter(r => r.date >= d30).reduce((sum, r) => sum + ((parseFloat(r.weight) || 0) * (parseInt(r.reps) || 0)), 0);
    const lMV = workoutRaw.filter(r => r.date >= format(subDays(today, 59), "yyyy-MM-dd") && r.date < d30).reduce((sum, r) => sum + ((parseFloat(r.weight) || 0) * (parseInt(r.reps) || 0)), 0);
    setWorkoutVelocityData([{ name: "Growth", value: lMV > 0 ? Math.round(((tMV - lMV) / lMV) * 100) : 0 }]);
    const whmMap: Record<string, boolean> = {}; workoutRaw.forEach(r => whmMap[r.date] = true);
    setWorkoutHeatmapData(eachDayOfInterval({ start: subDays(today, 364), end: today }).map(d => ({ date: format(d, "yyyy-MM-dd"), active: !!whmMap[format(d, "yyyy-MM-dd")] })));

    // --- VEHICLE CONSOLIDATION ---
    // 1. KMs Driven & Heatmap (ONLY Mileage Logs)
    const usageOdoLogs = [...(mLog || [])].map((m:any) => ({ vId: m.vehicle_id, date: m.date, odo: parseFloat(m.odometer) })).sort((a,b) => a.odo - b.odo);
    const usageHeatmap: Record<string, number> = {};
    const vUsageGrouped = usageOdoLogs.reduce((acc, l) => { if (!acc[l.vId]) acc[l.vId] = []; acc[l.vId].push(l); return acc; }, {} as Record<string, any[]>);
    Object.values(vUsageGrouped).forEach(logs => {
      for (let i = 1; i < logs.length; i++) {
        const d1 = new Date(logs[i-1].date); const d2 = new Date(logs[i].date); const diff = logs[i].odo - logs[i-1].odo; if (diff <= 0) continue; const days = Math.max(1, differenceInDays(d2, d1)); const dailyKms = diff / days;
        eachDayOfInterval({ start: d1, end: d2 }).forEach(d => { const ds = format(d, "yyyy-MM-dd"); usageHeatmap[ds] = (usageHeatmap[ds] || 0) + dailyKms; });
      }
    });
    setVehicleUsageHeatmap(eachDayOfInterval({ start: subDays(today, 364), end: today }).map(d => ({ date: format(d, "yyyy-MM-dd"), value: Math.round(usageHeatmap[format(d, "yyyy-MM-dd")] || 0) })));
    setVehicleKMsTrend(eachDayOfInterval({ start: isVehicleKMsCustom ? new Date(vkStart) : subDays(today, vehicleKMsDays), end: isVehicleKMsCustom ? new Date(vkEnd) : today }).map(d => ({ date: format(d, "dd MMM"), kms: Math.round(usageHeatmap[format(d, "yyyy-MM-dd")] || 0) })));

    // 2. CPK & Efficiency (ONLY Fuel Logs)
    const fuelOdoLogs = [...(fuelData || [])].map(f => ({ vId: f.vehicle_id, date: f.date, odo: parseFloat(f.odometer) })).sort((a,b) => a.odo - b.odo);
    const vFuelDistMap: Record<string, { min: number, max: number }> = {};
    const vFuelCostMap: Record<string, number> = {};
    fuelOdoLogs.forEach(l => { if (!vFuelDistMap[l.vId]) vFuelDistMap[l.vId] = { min: l.odo, max: l.odo }; vFuelDistMap[l.vId].min = Math.min(vFuelDistMap[l.vId].min, l.odo); vFuelDistMap[l.vId].max = Math.max(vFuelDistMap[l.vId].max, l.odo); });
    (fuelData || []).forEach(f => vFuelCostMap[f.vehicle_id] = (vFuelCostMap[f.vehicle_id] || 0) + (parseFloat(f.amount) || 0));
    setVehicleCPK(Object.entries(vFuelDistMap).map(([id, d]) => { const dist = d.max - d.min; const cost = vFuelCostMap[id] || 0; return { name: (vehicleCfg || []).find(v => v.id === id)?.vehicle_name || "Unknown", cpk: dist > 0 ? (cost / dist).toFixed(2) : 0, dist }; }));

    setVehicleSpend(Object.values((vehicleCfg || []).reduce((acc: any, v) => { acc[v.id] = { id: v.id, name: v.vehicle_name, fuel: 0, service: 0 }; return acc; }, {})).map((v:any) => {
      const fuel = (fuelData || []).filter(f => f.vehicle_id === v.id && f.date >= monthStart).reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);
      const svc = (svcData || []).filter(s => s.vehicle_id === v.id && s.date >= monthStart).reduce((s, s_l) => s + (parseFloat(s_l.amount) || 0), 0);
      return { ...v, fuel, service: svc };
    }));
    setVehicleTCO(Object.values((vehicleCfg || []).reduce((acc: any, v) => { acc[v.id] = { id: v.id, name: v.vehicle_name, fuel: 0, service: 0 }; return acc; }, {})).map((v:any) => {
      const fuel = (fuelData || []).filter(f => f.vehicle_id === v.id).reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);
      const svc = (svcData || []).filter(s => s.vehicle_id === v.id).reduce((s, s_l) => s + (parseFloat(s_l.amount) || 0), 0);
      return { ...v, fuel, service: svc, total: fuel + svc };
    }));
    setFuelEfficiencyTrend((fuelData || []).filter(f => f.mileage).map(f => ({ date: format(new Date(f.date), "dd MMM"), mileage: parseFloat(f.mileage), vehicle: (vehicleCfg || []).find(v => v.id === f.vehicle_id)?.vehicle_name })));

    // --- TASK CONSOLIDATION ---
    const tasks = taskData || [];
    const tVelocity: Record<string, number> = {};
    const tHeatmap: Record<string, number> = {};
    const tAgingBuckets = { "< 7d": 0, "7-30d": 0, "> 30d": 0 };
    const tThroughput = { created: 0, completed: 0 };
    const last7 = subDays(today, 7);

    eachDayOfInterval({ start: subDays(today, 14), end: today }).forEach(d => tVelocity[format(d, "yyyy-MM-dd")] = 0);

    tasks.forEach((t: any) => {
      const created = new Date(t.created_at || t.id.replace('ID_', '')); 
      const completed = t.completed_at ? new Date(t.completed_at) : null;

      if (completed) {
        const ds = format(completed, "yyyy-MM-dd");
        if (tVelocity[ds] !== undefined) tVelocity[ds]++;
        tHeatmap[ds] = (tHeatmap[ds] || 0) + 1;
        if (completed >= last7) tThroughput.completed++;
      } else {
        const age = differenceInDays(today, created);
        if (age < 7) tAgingBuckets["< 7d"]++;
        else if (age < 30) tAgingBuckets["7-30d"]++;
        else tAgingBuckets["> 30d"]++;
      }
      if (created >= last7) tThroughput.created++;
    });

    setTaskStats({ 
      done: tasks.filter((t:any) => t.status === "Completed" || t.status === "Done").length, 
      pending: tasks.filter((t:any) => t.status !== "Completed" && t.status !== "Done").length, 
      high: tasks.filter((t:any) => t.is_high_priority).length 
    });
    setTaskVelocity(Object.entries(tVelocity).map(([date, count]) => ({ date: format(new Date(date), "dd MMM"), count })));
    setTaskAging(Object.entries(tAgingBuckets).map(([name, value]) => ({ name, value })));
    setTaskThroughput([{ name: "Weekly Rate", ...tThroughput }]);
    setTaskHeatmap(eachDayOfInterval({ start: subDays(today, 364), end: today }).map(d => {
      const ds = format(d, "yyyy-MM-dd");
      return { date: ds, count: tHeatmap[ds] || 0 };
    }));
    setLoading(false);
  };

  const getDayStatus = (date: Date) => {
    const dStr = format(date, "yyyy-MM-dd");
    const logs = allHabitData.filter(h => h.date === dStr);
    if (selectedCalendarHabit !== "All Habits") return logs.find(h => h.habit === selectedCalendarHabit)?.status || "Not Entered";
    if (logs.length === 0) return "Not Entered";
    if (logs.some(l => l.status === "Critical")) return "Critical";
    if (logs.some(l => l.status === "Failure")) return "Failure";
    if (logs.some(l => l.status === "Tolerance")) return "Tolerance";
    if (logs.every(l => l.status === "Success")) return "Success";
    return "Tolerance";
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><RefreshCw className="w-8 h-8 animate-spin text-muted-foreground/20" /></div>;

  return (
    <div className="bg-background min-h-screen pb-20 p-4 md:p-6 font-dm-sans">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-3 bg-card rounded-xl shadow-sm text-primary border border-border/40 active:scale-95 transition-all"><ArrowLeftCircle size={24} /></button>
        <div className="flex-1"><h1 className="text-[28px] font-black text-foreground tracking-tight leading-none">Intelligence</h1><p className="text-[10px] font-black text-muted-foreground/40 tracking-[3px] mt-1 uppercase">Unified Command Dashboard</p></div>
        <button onClick={fetchAll} className="p-3 bg-card rounded-xl shadow-sm text-muted-foreground/40 hover:text-primary transition-all border border-border/40"><RefreshCw size={20} /></button>
      </div>

      <div className="sticky top-4 z-50 mb-8 px-1 py-1 bg-card/80 backdrop-blur-xl border border-border/40 rounded-2xl shadow-2xl flex items-center justify-between overflow-x-auto no-scrollbar gap-1">
        {[
          { id: "ALL", label: "ALL", icon: <LayoutPanelLeft size={14} /> },
          { id: "FINANCE", label: "FINANCE", icon: <Wallet size={14} /> },
          { id: "HABITS", label: "HABITS", icon: <Flame size={14} /> },
          { id: "WORKOUT", label: "WORKOUT", icon: <Zap size={14} /> },
          { id: "VEHICLES", label: "VEHICLES", icon: <Car size={14} /> },
          { id: "TASKS", label: "TASKS", icon: <ListTodo size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all gap-1.5 min-w-[70px] ${
              activeTab === tab.id 
                ? "bg-background shadow-lg text-primary scale-[1.02]" 
                : "text-muted-foreground/40 hover:text-muted-foreground/80"
            }`}
          >
            {tab.icon}
            <span className="text-[8px] font-black tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-12 max-w-lg mx-auto">
        {/* ===================== FINANCE ===================== */}
        {(activeTab === "ALL" || activeTab === "FINANCE") && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4"><div className="h-px flex-1 bg-indigo-600/20" /><h3 className="text-[10px] font-black text-indigo-600 tracking-[5px] uppercase">Finance</h3><div className="h-px flex-1 bg-indigo-600/20" /></div>
            
            <SectionCard title="Net Worth Trend" icon={<TrendingUp size={18} />} headerRight={
              <select value={isCustomRange ? "custom" : daysRange} onChange={(e) => { if (e.target.value === "custom") setIsCustomRange(true); else { setIsCustomRange(false); setDaysRange(parseInt(e.target.value)); } }} className="bg-muted/30 border-none text-[9px] font-black uppercase text-primary rounded px-2 py-1">
                {[7, 15, 30, 90].map(d => <option key={d} value={d}>{d} Days</option>)}
                <option value="custom">Custom</option>
              </select>
            }>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <StatPill label="Net Worth" value={`₹${(netWorthParts.liq+netWorthParts.ast-netWorthParts.lib).toLocaleString()}`} color="text-emerald-500" className="px-3 py-2.5" />
                <StatPill label="Liquidity" value={`₹${netWorthParts.liq.toLocaleString()}`} color="text-primary" className="px-3 py-2.5" />
                <StatPill label="Assets" value={`₹${netWorthParts.ast.toLocaleString()}`} color="text-amber-500" className="px-3 py-2.5" />
                <StatPill label="Liabilities" value={`₹${netWorthParts.lib.toLocaleString()}`} color="text-rose-500" className="px-3 py-2.5" />
              </div>
              <ResponsiveContainer width="100%" height={220}><LineChart data={netWorthTrend}><CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.4}/><XAxis dataKey="date" tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false} interval={Math.ceil(netWorthTrend.length/5)}/><YAxis tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v/1000}k`} width={40}/><Tooltip content={<CustomTooltip/>}/><Line type="monotone" dataKey="networth" name="Net Worth" stroke="#10b981" strokeWidth={3} dot={false}/><Line type="monotone" dataKey="liquidity" name="Liquidity" stroke="var(--color-primary)" strokeWidth={2} dot={false}/><Line type="monotone" dataKey="assets" name="Assets" stroke="#f59e0b" strokeWidth={2} dot={false}/><Line type="monotone" dataKey="liabilities" name="Liabilities" stroke="#ef4444" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer>
            </SectionCard>

            <SectionCard title="Savings Rate Pulse" icon={<Flame size={18} />} headerRight={
              <select value={isCustomSavingsRange ? "custom" : savingsRange} onChange={(e) => { if (e.target.value === "custom") setIsCustomSavingsRange(true); else { setIsCustomSavingsRange(false); setSavingsRange(parseInt(e.target.value)); } }} className="bg-muted/30 border-none text-[9px] font-black uppercase text-primary rounded px-2 py-1">
                {[30, 90, 180, 365].map(d => <option key={d} value={d}>{d === 30 ? "1 Month" : d === 90 ? "3 Months" : d === 180 ? "6 Months" : "1 Year"}</option>)}
                <option value="custom">Custom</option>
              </select>
            }>
              <ResponsiveContainer width="100%" height={180}><AreaChart data={savingsRateData}><defs><linearGradient id="incG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient><linearGradient id="expG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.4}/><XAxis dataKey="name" tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v/1000}k`}/><Tooltip content={<CustomTooltip/>}/><Area type="monotone" dataKey="income" name="Income" stroke="#10b981" fill="url(#incG)" strokeWidth={2}/><Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" fill="url(#expG)" strokeWidth={2}/></AreaChart></ResponsiveContainer>
            </SectionCard>

            <SectionCard title="Budget Variance" icon={<Scale size={18} />} headerRight={
              <select value={format(budgetMonth, "yyyy-MM-dd")} onChange={(e) => setBudgetMonth(new Date(e.target.value))} className="bg-muted/30 border-none text-[9px] font-black uppercase text-primary rounded px-2 py-1">
                {Array.from({ length: 12 }).map((_, i) => { const d = subMonths(startOfMonth(new Date()), i); return <option key={i} value={format(d, "yyyy-MM-dd")}>{format(d, "MMM yyyy")}</option> })}
              </select>
            }>
              <ResponsiveContainer width="100%" height={240}><BarChart data={budgetVariance}><CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.4}/><XAxis dataKey="name" tick={{fontSize:8, fontWeight:800}} axisLine={false} tickLine={false} /><YAxis tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v/1000}k`}/><Tooltip content={<CustomTooltip/>}/><Bar dataKey="planned" name="Planned" fill="var(--color-muted)" radius={[4,4,0,0]} barSize={15}/><Bar dataKey="actual" name="Actual" radius={[4,4,0,0]} barSize={15}>{budgetVariance.map((v, i) => <Cell key={i} fill={v.actual > v.planned ? "#ef4444" : "#10b981"}/>)}</Bar><Legend iconSize={8} wrapperStyle={{fontSize:9, fontWeight:900, paddingTop: 10}} /></BarChart></ResponsiveContainer>
            </SectionCard>

            <SectionCard title="Expense Categories" icon={<BarChart2 size={18} />} headerRight={
              <select value={format(expenseMonth, "yyyy-MM-dd")} onChange={(e) => setExpenseMonth(new Date(e.target.value))} className="bg-muted/30 border-none text-[9px] font-black uppercase text-primary rounded px-2 py-1">
                {Array.from({ length: 12 }).map((_, i) => { const d = subMonths(startOfMonth(new Date()), i); return <option key={i} value={format(d, "yyyy-MM-dd")}>{format(d, "MMM yyyy")}</option> })}
              </select>
            }>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={catSpendData} dataKey="value" innerRadius={60} outerRadius={80} paddingAngle={2} onClick={(data: any) => setExpenseSelectedCategory(String(data?.name || "All"))}>
                    {catSpendData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Legend iconSize={8} wrapperStyle={{fontSize:9, fontWeight:900, paddingTop: 10}} />
                </PieChart>
              </ResponsiveContainer>
            </SectionCard>

            <SectionCard 
              title={`Sub-Category Breakdown`} 
              icon={<Grid3X3 size={18} />}
              headerRight={
                <div className="flex items-center gap-2">
                  <select 
                    value={format(expenseMonth, "yyyy-MM-dd")} 
                    onChange={(e) => setExpenseMonth(new Date(e.target.value))} 
                    className="bg-muted/30 border-none text-[9px] font-black uppercase text-primary rounded px-2 py-1"
                  >
                    {Array.from({ length: 12 }).map((_, i) => { const d = subMonths(startOfMonth(new Date()), i); return <option key={i} value={format(d, "yyyy-MM-dd")}>{format(d, "MMM yyyy")}</option> })}
                  </select>
                  <select 
                    value={expenseSelectedCategory} 
                    onChange={(e) => setExpenseSelectedCategory(e.target.value)} 
                    className="bg-muted/30 border-none text-[9px] font-black uppercase text-primary rounded px-2 py-1"
                  >
                    <option value="All">All Categories</option>
                    {filterOptions.categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              }
            >
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie 
                    data={subCatSpendData} 
                    dataKey="value" 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={2}
                  >
                    {subCatSpendData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 9, fontWeight: 900, paddingTop: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </SectionCard>

            <SectionCard title="Expense Trend" icon={<Activity size={18} />} headerRight={
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-[280px]">
                <select value={trendFilters.category} onChange={(e)=>setTrendFilters(p=>({...p, category: e.target.value}))} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1 min-w-[70px]">
                  <option value="All">All Cats</option>
                  {filterOptions.categories.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <select value={trendFilters.subcategory} onChange={(e)=>setTrendFilters(p=>({...p, subcategory: e.target.value}))} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1 min-w-[70px]">
                  <option value="All">All Subs</option>
                  {filterOptions.subcategories.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <select value={trendFilters.place} onChange={(e)=>setTrendFilters(p=>({...p, place: e.target.value}))} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1 min-w-[70px]">
                  <option value="All">All Places</option>
                  {filterOptions.places.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <select value={trendFilters.vendor} onChange={(e)=>setTrendFilters(p=>({...p, vendor: e.target.value}))} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1 min-w-[70px]">
                  <option value="All">All Vendors</option>
                  {filterOptions.vendors.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <select value={trendFilters.particular} onChange={(e)=>setTrendFilters(p=>({...p, particular: e.target.value}))} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1 min-w-[70px]">
                  <option value="All">All Parts</option>
                  {filterOptions.particulars.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <select value={isCustomTrendRange ? "custom" : trendDaysRange} onChange={(e) => { if (e.target.value === "custom") setIsCustomTrendRange(true); else { setIsCustomTrendRange(false); setTrendDaysRange(parseInt(e.target.value)); } }} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1">
                  {[7, 14, 30, 60, 90].map(d => <option key={d} value={d}>{d} Days</option>)}
                  <option value="custom">Custom</option>
                </select>
              </div>
            }>
              <ResponsiveContainer width="100%" height={200}><AreaChart data={trendData}><defs><linearGradient id="trendG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.1}/><stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2}/><XAxis dataKey="date" tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v/1000}k`} width={35}/><Tooltip content={<CustomTooltip/>}/><Area type="monotone" dataKey="amount" name="Spent" stroke="var(--color-primary)" fill="url(#trendG)" strokeWidth={3}/><Legend verticalAlign="top" align="right" iconSize={8} wrapperStyle={{fontSize:9, fontWeight:900, top: -10}} /></AreaChart></ResponsiveContainer>
            </SectionCard>

            <SectionCard title="Assets Performance" icon={<PackageCheck size={18} />}><ResponsiveContainer width="100%" height={160}><BarChart data={assets}><XAxis dataKey="name" tick={{fontSize:7, fontWeight:800}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:8}} width={35} tickFormatter={v=>`₹${v/1000}k`}/><Tooltip content={<CustomTooltip/>}/><Bar dataKey="bought" name="Purchase" fill="var(--color-muted)" radius={[4,4,0,0]}/><Bar dataKey="current" name="Current" fill="#10b981" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></SectionCard>
            <SectionCard title="Liabilities" icon={<TrendingUp size={18} />}><ResponsiveContainer width="100%" height={Math.max(80, liabilities.length * 30)}><BarChart data={liabilities} layout="vertical"><XAxis type="number" hide/><YAxis dataKey="name" type="category" tick={{fontSize:8, fontWeight:700}} width={80} axisLine={false}/><Tooltip content={<CustomTooltip/>}/><Bar dataKey="value" name="Remaining" fill="#ef4444" radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></SectionCard>
          </section>
        )}

        {/* ===================== HABITS ===================== */}
        {(activeTab === "ALL" || activeTab === "HABITS") && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4"><div className="h-px flex-1 bg-emerald-600/20" /><h3 className="text-[10px] font-black text-emerald-600 tracking-[5px] uppercase">Habits</h3><div className="h-px flex-1 bg-emerald-600/20" /></div>
            <div className="grid grid-cols-2 gap-4">
               <SectionCard title="Radar" icon={<Zap size={16} />}><ResponsiveContainer width="100%" height={180}><RadarChart cx="50%" cy="50%" outerRadius="70%" data={habitRadarData}><PolarGrid/><PolarAngleAxis dataKey="subject" tick={{fontSize:7, fontWeight:800}}/><Radar dataKey="A" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.4}/></RadarChart></ResponsiveContainer></SectionCard>
               <SectionCard title="Breakdown" icon={<BarChart2 size={16} />}><ResponsiveContainer width="100%" height={180}><BarChart data={habitBreakdown} layout="vertical"><XAxis type="number" hide/><YAxis dataKey="name" type="category" tick={{fontSize:7, fontWeight:700}} width={60}/><Bar dataKey="success" stackId="a" fill="#10b981"/><Bar dataKey="fail" stackId="a" fill="#ef4444"/></BarChart></ResponsiveContainer></SectionCard>
            </div>
            <SectionCard title="Consistency Calendar" icon={<CalendarDays size={18} />} headerRight={
              <div className="flex items-center gap-2">
                <select value={format(calendarMonth, "yyyy-MM-dd")} onChange={(e) => setCalendarMonth(new Date(e.target.value))} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1">
                  {Array.from({ length: 12 }).map((_, i) => { const d = subMonths(startOfMonth(new Date()), i); return <option key={i} value={format(d, "yyyy-MM-dd")}>{format(d, "MMM yyyy")}</option> })}
                </select>
                <select value={selectedCalendarHabit} onChange={(e)=>setSelectedCalendarHabit(e.target.value)} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1 max-w-[80px]">
                  <option value="All Habits">All Habits</option>
                  {habitConfigs.map(c=><option key={c.habit_name} value={c.habit_name}>{c.habit_name}</option>)}
                </select>
              </div>
            }>
              <div className="grid grid-cols-7 gap-1.5 mb-2">{["S","M","T","W","T","F","S"].map((d,i)=><div key={i} className="text-[8px] font-black text-muted-foreground/30 text-center">{d}</div>)}</div>
              <div className="grid grid-cols-7 gap-1.5">{eachDayOfInterval({start: startOfWeek(startOfMonth(calendarMonth)), end: endOfWeek(endOfMonth(calendarMonth))}).map((day, i) => { const status = getDayStatus(day); const isCur = format(day, 'MM') === format(calendarMonth, 'MM'); return <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-[9px] font-black text-white ${isCur ? STATUS_COLORS[status] : 'opacity-5'}`}>{format(day, 'd')}</div> })}</div>
            </SectionCard>
            <SectionCard title="Success Trend" icon={<Activity size={18} />} headerRight={
              <select value={isCustomHabitTrendRange ? "custom" : habitTrendDaysRange} onChange={(e) => { if (e.target.value === "custom") setIsCustomHabitTrendRange(true); else { setIsCustomHabitTrendRange(false); setHabitTrendDaysRange(parseInt(e.target.value)); } }} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1">
                {[7, 14, 30, 60, 90].map(d => <option key={d} value={d}>{d} Days</option>)}
                <option value="custom">Custom</option>
              </select>
            }>
              <ResponsiveContainer width="100%" height={220}><LineChart data={habitScores}><CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2}/><XAxis dataKey="date" tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false} interval={Math.ceil(habitScores.length/7)}/><YAxis tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false} width={30}/><Tooltip content={<CustomTooltip/>}/><Legend iconSize={8} wrapperStyle={{fontSize:9, fontWeight:900, paddingTop: 10}} /><Line type="monotone" dataKey="Success" stroke="#10b981" strokeWidth={3} dot={false}/><Line type="monotone" dataKey="Failure" stroke="#f43f5e" strokeWidth={2} dot={false}/><Line type="monotone" dataKey="Critical" stroke="#ea580c" strokeWidth={2} dot={false}/><Line type="monotone" dataKey="Tolerance" stroke="#f59e0b" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer>
            </SectionCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionCard title="Habit Gravity" icon={<Weight size={18} />}>
                <div className="space-y-3">{habitGravityData.map((g, i) => ( <div key={i} className="flex items-center justify-between p-3 bg-rose-500/5 rounded-xl border border-rose-500/10"><div className="flex flex-col"><span className="text-[10px] font-black text-foreground">{g.name}</span><span className="text-[8px] font-bold text-rose-500 uppercase tracking-widest">{g.rate}% Failure</span></div><div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-rose-500" style={{ width: `${g.rate}%` }} /></div></div> ))}</div>
              </SectionCard>
              <SectionCard title="Yearly Heatmap" icon={<Grid3X3 size={18} />}>
                <div className="flex flex-wrap gap-[3px] overflow-hidden">{habitHeatmapData.map((d, i) => { let color = "bg-muted/10"; if (d.score > 0.1) color = "bg-emerald-500/20"; if (d.score > 0.4) color = "bg-emerald-500/40"; if (d.score > 0.7) color = "bg-emerald-500/70"; if (d.score > 0.9) color = "bg-emerald-500"; return <div key={i} className={`w-[7px] h-[7px] rounded-[1px] ${color} transition-colors hover:scale-125 cursor-help`} title={`${format(new Date(d.date), "dd MMM yyyy")}: ${Math.round(d.score * 100)}%`} />; })}</div>
              </SectionCard>
            </div>
          </section>
        )}

        {/* ===================== WORKOUT ===================== */}
        {(activeTab === "ALL" || activeTab === "WORKOUT") && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4"><div className="h-px flex-1 bg-orange-600/20" /><h3 className="text-[10px] font-black text-orange-600 tracking-[5px] uppercase">Workout</h3><div className="h-px flex-1 bg-orange-600/20" /></div>
            <SectionCard title="Volume Trend" icon={<Flame size={18} />}><ResponsiveContainer width="100%" height={160}><AreaChart data={workoutVolumeTrend}><defs><linearGradient id="vG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="date" tick={{fontSize:8}}/><YAxis hide/><Tooltip content={<CustomTooltip/>}/><Area type="monotone" dataKey="volume" name="Total kg" stroke="#f59e0b" fill="url(#vG)" strokeWidth={3}/></AreaChart></ResponsiveContainer></SectionCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionCard title="Body Distribution" icon={<Zap size={18} />}><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={workoutBodyDist} dataKey="value" innerRadius={60} outerRadius={80} paddingAngle={2}>{workoutBodyDist.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></SectionCard>
              <SectionCard title="Recovery Monitor" icon={<Flame size={18} />}><div className="space-y-3">{workoutFreshness.map((f, i) => ( <div key={i} className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border/30"><div className="flex flex-col"><span className="text-[10px] font-black text-foreground">{f.name}</span><span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Last: {f.days}d ago</span></div><span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${f.status === 'Recovering' ? 'bg-amber-500/20 text-amber-500' : f.status === 'Optimal' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-blue-500/20 text-blue-500'}`}>{f.status}</span></div> ))}</div></SectionCard>
            </div>
            <SectionCard title="Volume vs Intensity" icon={<Activity size={18} />}><ResponsiveContainer width="100%" height={220}><AreaChart data={workoutIntensityData}><CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1}/><XAxis dataKey="date" tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}kg`}/><Tooltip content={<CustomTooltip/>}/><Area type="monotone" dataKey="intensity" name="Avg Weight" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.1} strokeWidth={3}/></AreaChart></ResponsiveContainer></SectionCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionCard title="Exercise Bias" icon={<TrendingUp size={18} />}><ResponsiveContainer width="100%" height={200}><BarChart data={workoutBiasData} layout="vertical"><XAxis type="number" hide/><YAxis dataKey="name" type="category" tick={{fontSize:7, fontWeight:800}} width={80} axisLine={false}/><Tooltip content={<CustomTooltip/>}/><Bar dataKey="value" fill="var(--color-primary)" radius={[0,4,4,0]} barSize={12}/></BarChart></ResponsiveContainer></SectionCard>
              <SectionCard title="Workout Heatmap" icon={<Grid3X3 size={18} />}><div className="flex flex-wrap gap-[3px] overflow-hidden">{workoutHeatmapData.map((d, i) => ( <div key={i} className={`w-[7px] h-[7px] rounded-[1px] ${d.active ? "bg-primary" : "bg-muted/10"} transition-colors hover:scale-125 cursor-help`} title={`${d.date}: ${d.active ? "Trained" : "Rest"}`} /> ))}</div></SectionCard>
            </div>
            <SectionCard title="Monthly Consistency" icon={<CalendarDays size={18} />} headerRight={
              <div className="flex items-center gap-2">
                <select value={selectedWorkoutDay} onChange={(e) => setSelectedWorkoutDay(e.target.value)} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1 max-w-[80px]">
                  <option value="All">All Days</option>
                  {Array.from(new Set(workoutBodyDist.map(b => b.name).filter(Boolean) as string[])).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={format(workoutCalendarMonth, "yyyy-MM-dd")} onChange={(e) => setWorkoutCalendarMonth(new Date(e.target.value))} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1">
                  {Array.from({ length: 12 }).map((_, i) => { const d = subMonths(startOfMonth(new Date()), i); return <option key={i} value={format(d, "yyyy-MM-dd")}>{format(d, "MMM yyyy")}</option> })}
                </select>
              </div>
            }>
              <div className="grid grid-cols-7 gap-1.5 mb-2">{["S","M","T","W","T","F","S"].map((d,i)=><div key={i} className="text-[8px] font-black text-muted-foreground/30 text-center">{d}</div>)}</div>
              <div className="grid grid-cols-7 gap-1.5">{eachDayOfInterval({start: startOfWeek(startOfMonth(workoutCalendarMonth)), end: endOfWeek(endOfMonth(workoutCalendarMonth))}).map((day, i) => { const dStr = format(day, 'yyyy-MM-dd'); const dayLogs = (workoutData || []).filter(w => w.date === dStr); const isActive = dayLogs.length > 0 && (selectedWorkoutDay === "All" || dayLogs.some(w => (w.body_part || w.workout_day) === selectedWorkoutDay)); const isCur = format(day, 'MM') === format(workoutCalendarMonth, 'MM'); return <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-[9px] font-black ${isCur ? (isActive ? 'bg-primary text-white' : 'bg-muted/30 text-muted-foreground/40') : 'opacity-5'}`}>{format(day, 'd')}</div> })}</div>
            </SectionCard>
            <SectionCard title="Routine Calendar" icon={<CalendarDays size={18} />} headerRight={
              <select value={format(routineCalendarMonth, "yyyy-MM-dd")} onChange={(e) => setRoutineCalendarMonth(new Date(e.target.value))} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1">
                {Array.from({ length: 12 }).map((_, i) => { const d = subMonths(startOfMonth(new Date()), i); return <option key={i} value={format(d, "yyyy-MM-dd")}>{format(d, "MMM yyyy")}</option> })}
              </select>
            }>
              <div className="grid grid-cols-7 gap-1.5 mb-2">{["S","M","T","W","T","F","S"].map((d,i)=><div key={i} className="text-[8px] font-black text-muted-foreground/30 text-center">{d}</div>)}</div>
              <div className="grid grid-cols-7 gap-1.5">
                {eachDayOfInterval({start: startOfWeek(startOfMonth(routineCalendarMonth)), end: endOfWeek(endOfMonth(routineCalendarMonth))}).map((day, i) => { 
                  const dStr = format(day, 'yyyy-MM-dd'); const dayLog = workoutData.find(w => w.date === dStr); const routine = dayLog ? (dayLog.body_part || dayLog.workout_day || "Other") : null;
                  const routines = Array.from(new Set(workoutData.map(w => w.body_part || w.workout_day).filter(Boolean))); const rIndex = routine ? routines.indexOf(routine) : -1; const rColor = rIndex !== -1 ? COLORS[rIndex % COLORS.length] : 'bg-muted/30';
                  const isCur = format(day, 'MM') === format(routineCalendarMonth, 'MM'); 
                  return <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-[9px] font-black ${isCur ? 'opacity-100' : 'opacity-5'}`}><div className={`w-full h-full rounded-lg flex items-center justify-center ${routine ? 'text-white' : 'text-muted-foreground/40'} ${routine ? '' : 'bg-muted/30'}`} style={routine ? { backgroundColor: rColor } : {}}>{format(day, 'd')}</div></div>;
                })}
              </div>
            </SectionCard>
          </section>
        )}

        {/* ===================== VEHICLES ===================== */}
        {(activeTab === "ALL" || activeTab === "VEHICLES") && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4"><div className="h-px flex-1 bg-blue-600/20" /><h3 className="text-[10px] font-black text-blue-600 tracking-[5px] uppercase">Vehicles</h3><div className="h-px flex-1 bg-blue-600/20" /></div>
            
            <SectionCard title="Efficiency (KM/L)" icon={<Gauge size={18} />}><ResponsiveContainer width="100%" height={160}><LineChart data={fuelEfficiencyTrend}><CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2}/><XAxis dataKey="date" tick={{fontSize:8}}/><YAxis tick={{fontSize:8}}/><Tooltip content={<CustomTooltip/>}/><Legend iconSize={8} wrapperStyle={{fontSize:9, fontWeight:900}}/>{Array.from(new Set(fuelEfficiencyTrend.map(d=>d.vehicle))).map((v,i)=><Line key={i} type="monotone" dataKey="mileage" name={v||"Vehicle"} stroke={COLORS[i%COLORS.length]} strokeWidth={3} dot={{r:4}}/>)}</LineChart></ResponsiveContainer></SectionCard>
            <SectionCard title="TCO breakdown" icon={<Wallet size={18} />}><ResponsiveContainer width="100%" height={160}><BarChart data={vehicleTCO}><XAxis dataKey="name" tick={{fontSize:9, fontWeight:800}}/><YAxis hide/><Tooltip content={<CustomTooltip/>}/><Bar dataKey="fuel" name="Fuel ₹" stackId="v" fill="var(--color-primary)"/><Bar dataKey="service" name="Service ₹" stackId="v" fill="#f59e0b" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></SectionCard>
            <SectionCard title="Monthly Spend" icon={<Car size={18} />}><ResponsiveContainer width="100%" height={140}><BarChart data={vehicleSpend} layout="vertical"><XAxis type="number" hide/><YAxis dataKey="name" type="category" tick={{fontSize:8, fontWeight:800}} width={80}/><Tooltip content={<CustomTooltip/>}/><Bar dataKey="fuel" stackId="s" fill="var(--color-primary)"/><Bar dataKey="service" stackId="s" fill="#f59e0b" radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></SectionCard>
            <SectionCard title="KMs Driven Trend" icon={<Map size={18} />} headerRight={
                <select value={isVehicleKMsCustom ? "custom" : vehicleKMsDays} onChange={(e) => { if (e.target.value === "custom") setIsVehicleKMsCustom(true); else { setIsVehicleKMsCustom(false); setVehicleKMsDays(parseInt(e.target.value)); } }} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1">
                  {[7, 14, 30, 60, 90].map(d => <option key={d} value={d}>{d} Days</option>)}
                  <option value="custom">Custom</option>
                </select>
            }>
              <ResponsiveContainer width="100%" height={180}><AreaChart data={vehicleKMsTrend}><defs><linearGradient id="kmsG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.1}/><stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2}/><XAxis dataKey="date" tick={{fontSize:7, fontWeight:800}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:8}} axisLine={false} tickLine={false} width={30}/><Tooltip content={<CustomTooltip/>}/><Area type="monotone" dataKey="kms" name="Distance (KM)" stroke="var(--color-primary)" fill="url(#kmsG)" strokeWidth={3}/></AreaChart></ResponsiveContainer>
            </SectionCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionCard title="Cost Per KM (CPK)" icon={<TrendingUp size={18} />}><div className="space-y-3">{vehicleCPK.map((v, i) => ( <div key={i} className="flex items-center justify-between p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10"><div className="flex flex-col"><span className="text-[10px] font-black text-foreground">{v.name}</span><span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{v.dist.toLocaleString()} KM</span></div><div className="flex flex-col items-end"><span className="text-[12px] font-black text-indigo-500">₹{v.cpk}</span><span className="text-[7px] font-black text-muted-foreground/40 uppercase">Per KM</span></div></div> ))}</div></SectionCard>
              <SectionCard title="Usage Heatmap" icon={<Grid3X3 size={18} />}><div className="flex flex-wrap gap-[3px] overflow-hidden">{vehicleUsageHeatmap.map((d, i) => { let color = "bg-muted/10"; if (d.value > 10) color = "bg-blue-500/20"; if (d.value > 30) color = "bg-blue-500/40"; if (d.value > 60) color = "bg-blue-500/70"; if (d.value > 100) color = "bg-blue-500"; return <div key={i} className={`w-[7px] h-[7px] rounded-[1px] ${color} transition-colors hover:scale-125 cursor-help`} title={`${d.date}: ${d.value} KM`} />; })}</div></SectionCard>
            </div>
          </section>
        )}

        {/* ===================== TASKS ===================== */}
        {(activeTab === "ALL" || activeTab === "TASKS") && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4"><div className="h-px flex-1 bg-slate-600/20" /><h3 className="text-[10px] font-black text-slate-600 tracking-[5px] uppercase">Tasks</h3><div className="h-px flex-1 bg-slate-600/20" /></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SectionCard title="Momentum" icon={<ListTodo size={18} />} className="md:col-span-2">
                <ResponsiveContainer width="100%" height={220}><BarChart data={taskVelocity}><CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1}/><XAxis dataKey="date" tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false} width={20}/><Tooltip content={<CustomTooltip/>}/><Bar dataKey="count" fill="var(--color-primary)" radius={[4,4,0,0]} barSize={24}/></BarChart></ResponsiveContainer>
              </SectionCard>
              <SectionCard title="Task breakdown" icon={<CheckCircle2 size={18} />}>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-2"><StatPill label="Done" value={String(taskStats.done)} color="text-emerald-500"/><StatPill label="Pending" value={String(taskStats.pending)} color="text-amber-500"/></div>
                  <ResponsiveContainer width="100%" height={140}><PieChart><Pie data={[{name:"Done", value:taskStats.done},{name:"Pending", value:taskStats.pending}]} dataKey="value" innerRadius={40} outerRadius={60} paddingAngle={4}><Cell fill="#10b981"/><Cell fill="#f59e0b"/></Pie><Tooltip/><Legend iconSize={8} wrapperStyle={{fontSize:9, fontWeight:900}}/></PieChart></ResponsiveContainer>
                </div>
              </SectionCard>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SectionCard title="Backlog Aging" icon={<CalendarDays size={18} />}><ResponsiveContainer width="100%" height={220}><BarChart data={taskAging} layout="vertical"><XAxis type="number" hide/><YAxis dataKey="name" type="category" tick={{fontSize:8, fontWeight:800}} width={60} axisLine={false}/><Tooltip content={<CustomTooltip/>}/><Bar dataKey="value" fill="#f59e0b" radius={[0,4,4,0]} barSize={16}/></BarChart></ResponsiveContainer></SectionCard>
              <SectionCard title="Throughput" icon={<Activity size={18} />}><ResponsiveContainer width="100%" height={220}><BarChart data={taskThroughput}><CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1}/><XAxis dataKey="name" tick={{fontSize:8, fontWeight:800}}/><YAxis hide/><Tooltip content={<CustomTooltip/>}/><Legend iconSize={8} wrapperStyle={{fontSize:9, fontWeight:900}}/><Bar dataKey="created" name="Inflow" fill="var(--color-primary)" radius={[4,4,0,0]} barSize={30}/><Bar dataKey="completed" name="Outflow" fill="#10b981" radius={[4,4,0,0]} barSize={30}/></BarChart></ResponsiveContainer></SectionCard>
            </div>

            <SectionCard title="Execution Heatmap" icon={<Grid3X3 size={18} />}>
              <div className="flex flex-wrap gap-[3px] overflow-hidden">{taskHeatmap.map((d, i) => { let color = "bg-muted/10"; if (d.count > 0) color = "bg-primary/20"; if (d.count > 1) color = "bg-primary/40"; if (d.count > 3) color = "bg-primary/70"; if (d.count > 5) color = "bg-primary"; return <div key={i} className={`w-[8px] h-[8px] rounded-[1px] ${color} transition-colors hover:scale-125 cursor-help`} title={`${d.date}: ${d.count} tasks`} />; })}</div>
            </SectionCard>
          </section>
        )}
      </div>
    </div>
  );
}
