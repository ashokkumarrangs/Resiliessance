"use client";
import { VehicleDashboard } from "@/components/VehicleDashboard";
import { Select } from "@/components/Select";
import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Activity, AlertTriangle, ArrowLeftCircle, BarChart2, Box, CalendarDays, Car, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock, Dumbbell, Flame, Gauge, GraduationCap, Grid3X3, LayoutPanelLeft, ListTodo, Map, PackageCheck, RefreshCw, Scale, ShieldAlert, TrendingUp, Trophy, Wallet, Weight, Zap , Dog, Scissors, Shield, Trees, Coins, LineChart as LineChartIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { 
  format, subDays, startOfMonth, eachDayOfInterval, isSameDay, 
  startOfWeek, endOfWeek, endOfMonth, addMonths, subMonths,
  subMonths as subM, startOfYear, endOfYear, differenceInDays
} from "date-fns";
import { SectionNav } from "@/components/SectionNav";
import { LoadingScreen } from "@/components/LoadingScreen";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadialBarChart, RadialBar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const COLORS = ["var(--color-primary)", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#ec4899", "#84cc16"];

const parseYearMonthDay = (dateStr: string) => {
  if (!dateStr) return new Date();
  const parts = dateStr.split("-");
  const yr = parseInt(parts[0], 10);
  const mo = parseInt(parts[1], 10);
  const dy = parseInt(parts[2] || "1", 10);
  if (isNaN(yr) || isNaN(mo) || isNaN(dy)) {
    return new Date();
  }
  const d = new Date(yr, mo - 1, dy);
  return isNaN(d.getTime()) ? new Date() : d;
};


const STATUS_COLORS: Record<string, string> = {
  "Success": "bg-emerald-500",
  "Failure": "bg-rose-500",
  "Tolerance": "bg-amber-500",
  "Critical": "bg-orange-600",
  "Not Entered": "bg-muted/40"
};

function SectionCard({ title, icon, children, headerRight, className = "" }: { title: string; icon: React.ReactNode; children: React.ReactNode; headerRight?: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-2xl border border-border/40 shadow-sm flex flex-col relative focus-within:z-50 ${className}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/20">
        <div className="flex items-center gap-3">
          <span className="text-primary/50">{icon}</span>
          <h2 className="text-sm font-black uppercase tracking-widest text-foreground/60">{title}</h2>
        </div>
        {headerRight}
      </div>
      <div className="p-5 flex-1 min-h-[180px]">{children}</div>
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
  const [matrixCalendarMonth, setMatrixCalendarMonth] = useState(new Date());
  const [individualCalendarMonth, setIndividualCalendarMonth] = useState(new Date());
  const [radarMonth, setRadarMonth] = useState(new Date());
  const [breakdownMonth, setBreakdownMonth] = useState(new Date());
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

  const activeTab: any = "PETS";

  // Task States
  const [taskStats, setTaskStats] = useState({ done: 0, pending: 0, high: 0 });
  const [taskVelocity, setTaskVelocity] = useState<any[]>([]);
  const [taskAging, setTaskAging] = useState<any[]>([]);
  const [taskThroughput, setTaskThroughput] = useState<any[]>([]);
  const [taskHeatmap, setTaskHeatmap] = useState<any[]>([]);

  // --- NEW STATES FOR ADVANCED REPORTS ---
  const [alerts, setAlerts] = useState<any[]>([]);
  const [committedVsDiscretionary, setCommittedVsDiscretionary] = useState<any[]>([]);
  const [emergencyFundRunway, setEmergencyFundRunway] = useState<number>(0);
  const [debtTimelineInputs, setDebtTimelineInputs] = useState<Record<string, { amount: number; frequency: number }>>({});
  const [habitStreaks, setHabitStreaks] = useState<Record<string, { current: number; max: number; success: number; failure: number; tolerance: number; critical: number; consistency: number; recoveries: number }>>({});
  const [neverMissTwice, setNeverMissTwice] = useState<{ totalMisses: number; successfulRecoveries: number; rate: number } | null>(null);
  const [habitCorrelations, setHabitCorrelations] = useState<any[]>([]);
  const [selectedExercise1RM, setSelectedExercise1RM] = useState<string>("Bench Press");
  const [exerciseList, setExerciseList] = useState<string[]>([]);
  const [workoutVolumeTrendRange, setWorkoutVolumeTrendRange] = useState<number>(30);
  const [workoutBodyDistRange, setWorkoutBodyDistRange] = useState<number>(30);
  const [workoutIntensityRange, setWorkoutIntensityRange] = useState<number>(30);
  const [workoutBiasRange, setWorkoutBiasRange] = useState<number>(30);
  const [workout1RMRange, setWorkout1RMRange] = useState<number>(30);
  const [muscleBalanceRange, setMuscleBalanceRange] = useState<number>(30);
  const [muscleBalanceData, setMuscleBalanceData] = useState<any[]>([]);
  const [workoutPlateaus, setWorkoutPlateaus] = useState<any[]>([]);
  const [maintenanceForecasts, setMaintenanceForecasts] = useState<any[]>([]);
  const [serviceExpendituresRange, setServiceExpendituresRange] = useState<number>(30);
  const [serviceLogs, setServiceLogs] = useState<any[]>([]);
  const [serviceCategoryCosts, setServiceCategoryCosts] = useState<any[]>([]);
  const [realTCOPerKM, setRealTCOPerKM] = useState<any[]>([]);
  const [rawTasksData, setRawTasksData] = useState<any[]>([]);
  const [taskMomentumRange, setTaskMomentumRange] = useState<number>(30);
  const [taskThroughputRange, setTaskThroughputRange] = useState<number>(30);
  
  // Skills States
  const [skillItems, setSkillItems] = useState<any[]>([]);
  const [petProfiles, setPetProfiles] = useState<any[]>([]);
  const [petExpenses, setPetExpenses] = useState<any[]>([]);
  const [petLogs, setPetLogs] = useState<any[]>([]);
  const [skillLogs, setSkillLogs] = useState<any[]>([]);
  const [skillsTimeframe, setSkillsTimeframe] = useState<number>(180);
  const [selectedProgressSkill, setSelectedProgressSkill] = useState<string>("All");

  // Strength & Volume Matrix state
  const [selectedStrengthTimeframe, setSelectedStrengthTimeframe] = useState<string>("30");
  const [strengthSearchQuery, setStrengthSearchQuery] = useState<string>("");
  const [selectedMatrixExercises, setSelectedMatrixExercises] = useState<string[]>([]);
  const [isExerciseDropdownOpen, setIsExerciseDropdownOpen] = useState<boolean>(false);

  // Raw configs for client-side recalculations
  const [vehicleConfigs, setVehicleConfigs] = useState<any[]>([]);
  const [mLogData, setMLogData] = useState<any[]>([]);

  // 1. Initial mount only
  useEffect(() => { 
    fetchAll(); 
  }, []);

  // 2. Net Worth Trend selector changed
  useEffect(() => {
    if (loading) return;
    fetchNetWorthData();
  }, [daysRange, isCustomRange, customStart, customEnd]);

  // 3. Savings Rate selector changed
  useEffect(() => {
    if (loading) return;
    fetchSavingsData();
  }, [savingsRange, isCustomSavingsRange, savingsCustomStart, savingsCustomEnd]);

  // 4. Budget & Expenses month changed
  useEffect(() => {
    if (loading) return;
    fetchMonthlyFinanceData();
  }, [budgetMonth, expenseMonth, expenseSelectedCategory]);

  // 5. Expense Trend selector or filters changed
  useEffect(() => {
    if (loading) return;
    fetchExpenseTrendData();
  }, [trendDaysRange, isCustomTrendRange, trendCustomStart, trendCustomEnd, trendFilters]);

  // 6. Habit Trend selector changed
  useEffect(() => {
    if (loading) return;
    fetchHabitTrendData();
  }, [habitTrendDaysRange, isCustomHabitTrendRange, habitTrendCustomStart, habitTrendCustomEnd, habitTrendGroup]);

  // 7. Vehicle KMs selector changed
  useEffect(() => {
    if (loading) return;
    recalculateVehicleKMs();
  }, [vehicleKMsDays, isVehicleKMsCustom, vkStart, vkEnd, mLogData, vehicleConfigs]);

  // 8. Radar Month changed: Recalculate Radar chart client-side
  useEffect(() => {
    if (allHabitData.length === 0) return;
    const start = format(startOfMonth(radarMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(radarMonth), "yyyy-MM-dd");
    const habitToGroup: Record<string, string> = {};
    habitConfigs.forEach(c => { habitToGroup[c.habit_name] = c.group_name || 'General'; });

    const grpMap: Record<string, { name: string, total: number, success: number }> = {};
    habitConfigs.forEach(c => {
      if (!grpMap[c.group_name || 'General']) {
        grpMap[c.group_name || 'General'] = { name: c.group_name || 'General', total: 0, success: 0 };
      }
    });
    allHabitData
      .filter(h => h.date >= start && h.date <= end)
      .forEach(h => {
        const grp = habitToGroup[h.habit] || 'General';
        if (grpMap[grp]) {
          grpMap[grp].total++;
          if (h.status === 'Success') grpMap[grp].success++;
        }
      });
    setHabitRadarData(
      Object.values(grpMap).map(v => ({
        subject: v.name,
        A: v.total > 0 ? Math.round((v.success / v.total) * 100) : 0,
        fullMark: 100
      }))
    );
  }, [radarMonth, allHabitData, habitConfigs]);

  // 9. Breakdown Month changed: Recalculate Breakdown chart client-side
  useEffect(() => {
    if (allHabitData.length === 0) return;
    const start = format(startOfMonth(breakdownMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(breakdownMonth), "yyyy-MM-dd");
    const dailyNames = new Set(habitConfigs.map(c => c.habit_name));

    const hNameMap: Record<string, { success: number; fail: number }> = {};
    allHabitData
      .filter(r => dailyNames.has(r.habit) && r.date >= start && r.date <= end)
      .forEach(r => {
        if (!hNameMap[r.habit]) hNameMap[r.habit] = { success: 0, fail: 0 };
        r.status === "Success" ? hNameMap[r.habit].success++ : hNameMap[r.habit].fail++;
      });
    setHabitBreakdown(
      Object.entries(hNameMap)
        .sort((a, b) => (b[1].success + b[1].fail) - (a[1].success + a[1].fail))
        .slice(0, 8)
        .map(([name, v]) => ({ name, ...v }))
    );
  }, [breakdownMonth, allHabitData, habitConfigs]);

  // 10. Workout Volume Trend Range changed
  useEffect(() => {
    if (workoutData.length === 0) return;
    const today = new Date();
    const start = format(subDays(today, workoutVolumeTrendRange - 1), "yyyy-MM-dd");
    const wVolMap: Record<string, number> = {};
    workoutData.filter(r => r.date >= start).forEach(r => {
      const vol = (parseFloat(r.weight) || 0) * (parseInt(r.reps) || 0);
      wVolMap[r.date] = (wVolMap[r.date] || 0) + vol;
    });
    setWorkoutVolumeTrend(Object.entries(wVolMap).map(([date, volume]) => ({ date: format(new Date(date), "dd MMM"), volume: Math.round(volume) })));
  }, [workoutVolumeTrendRange, workoutData]);

  // 11. Workout Body Distribution Range changed
  useEffect(() => {
    if (workoutData.length === 0) return;
    const today = new Date();
    const start = format(subDays(today, workoutBodyDistRange - 1), "yyyy-MM-dd");
    const wBodyMap: Record<string, number> = {};
    workoutData.filter(r => r.date >= start).forEach(r => {
      const vol = (parseFloat(r.weight) || 0) * (parseInt(r.reps) || 0);
      const bp = r.body_part || r.workout_day || "Unknown";
      wBodyMap[bp] = (wBodyMap[bp] || 0) + vol;
    });
    setWorkoutBodyDist(Object.entries(wBodyMap).map(([name, value]) => ({ name, value: Math.round(value) })));
  }, [workoutBodyDistRange, workoutData]);

  // 12. Workout Volume vs Intensity Range changed
  useEffect(() => {
    if (workoutData.length === 0) return;
    const today = new Date();
    const start = format(subDays(today, workoutIntensityRange - 1), "yyyy-MM-dd");
    const wIntMap: Record<string, { weight: number, reps: number }> = {};
    workoutData.filter(r => r.date >= start).forEach(r => {
      if (!wIntMap[r.date]) wIntMap[r.date] = { weight: 0, reps: 0 };
      wIntMap[r.date].weight += (parseFloat(r.weight) || 0) * (parseInt(r.reps) || 0);
      wIntMap[r.date].reps += parseInt(r.reps) || 0;
    });
    setWorkoutIntensityData(Object.entries(wIntMap).map(([date, v]) => ({ date: format(new Date(date), "dd MMM"), intensity: v.reps > 0 ? Math.round(v.weight / v.reps) : 0 })));
  }, [workoutIntensityRange, workoutData]);

  // 13. Workout Exercise Bias Range changed
  useEffect(() => {
    if (workoutData.length === 0) return;
    const today = new Date();
    const start = format(subDays(today, workoutBiasRange - 1), "yyyy-MM-dd");
    const wBiasMap: Record<string, number> = {};
    workoutData.filter(r => r.date >= start && r.workout_name).forEach(r => {
      wBiasMap[r.workout_name] = (wBiasMap[r.workout_name] || 0) + 1;
    });
    setWorkoutBiasData(Object.entries(wBiasMap).sort((a,b)=>b[1]-a[1]).slice(0, 8).map(([name, value]) => ({ name, value })));
  }, [workoutBiasRange, workoutData]);

  // 14. Workout Muscle Balance Range changed
  useEffect(() => {
    if (workoutData.length === 0) return;
    const today = new Date();
    const start = format(subDays(today, muscleBalanceRange - 1), "yyyy-MM-dd");
    let pushSets = 0, pullSets = 0, legsSets = 0, otherSets = 0;
    workoutData.filter(r => r.date >= start).forEach((w: any) => {
      const name = (w.workout_name || '').toLowerCase();
      const day = (w.workout_day || '').toLowerCase();
      const isPush = name.includes('press') || name.includes('push') || name.includes('chest') || name.includes('shoulder') || name.includes('tricep') || name.includes('bench') || name.includes('dip') || day.includes('push') || day.includes('chest') || day.includes('shoulder');
      const isPull = name.includes('pull') || name.includes('row') || name.includes('curl') || name.includes('back') || name.includes('bicep') || name.includes('deadlift') || day.includes('pull') || day.includes('back') || day.includes('bicep');
      const isLegs = name.includes('squat') || name.includes('leg') || name.includes('calf') || name.includes('quad') || name.includes('hamstring') || name.includes('lunge') || day.includes('leg') || day.includes('squat');
      if (isPush) pushSets++;
      else if (isPull) pullSets++;
      else if (isLegs) legsSets++;
      else otherSets++;
    });
    setMuscleBalanceData([
      { name: 'Push', value: pushSets },
      { name: 'Pull', value: pullSets },
      { name: 'Legs', value: legsSets },
      { name: 'Core/Other', value: otherSets }
    ].filter(m => m.value > 0));
  }, [muscleBalanceRange, workoutData]);

  // 15. Service Expenditures Recalculator
  useEffect(() => {
    if (serviceLogs.length === 0) return;
    const today = new Date();
    const start = format(subDays(today, serviceExpendituresRange - 1), "yyyy-MM-dd");

    const vNameMap: Record<string, string> = {};
    vehicleConfigs.forEach(vc => {
      vNameMap[vc.id] = vc.vehicle_name;
    });

    const categoriesList = [
      { name: 'Engine & Oil' },
      { name: 'Tyres & Alignment' },
      { name: 'AC & Climate' },
      { name: 'Brakes' },
      { name: 'General Maintenance' }
    ];

    const catCostMap: Record<string, Record<string, number>> = {};
    categoriesList.forEach(c => {
      catCostMap[c.name] = {};
    });

    serviceLogs.filter(s => s.date >= start).forEach((s: any) => {
      const amount = parseFloat(s.amount) || 0;
      const desc = (s.details || '').toLowerCase();
      const vName = vNameMap[s.vehicle_id] || `Vehicle ${s.vehicle_id?.slice(0, 4)}`;

      let matchedCat = 'General Maintenance';
      if (desc.includes('oil') || desc.includes('coolant') || desc.includes('lubricant')) {
        matchedCat = 'Engine & Oil';
      } else if (desc.includes('tyre') || desc.includes('wheel') || desc.includes('alignment') || desc.includes('rotation')) {
        matchedCat = 'Tyres & Alignment';
      } else if (desc.includes('ac') || desc.includes('climate') || desc.includes('gas') || desc.includes('filter')) {
        matchedCat = 'AC & Climate';
      } else if (desc.includes('brake') || desc.includes('pad') || desc.includes('disc')) {
        matchedCat = 'Brakes';
      }

      catCostMap[matchedCat][vName] = (catCostMap[matchedCat][vName] || 0) + amount;
    });

    const formattedData = categoriesList.map(c => {
      const row: Record<string, any> = { name: c.name };
      let categoryTotal = 0;
      vehicleConfigs.forEach(vc => {
        const vCost = Math.round(catCostMap[c.name][vc.vehicle_name] || 0);
        row[vc.vehicle_name] = vCost;
        categoryTotal += vCost;
      });
      row["Total"] = categoryTotal;
      return row;
    });

    setServiceCategoryCosts(formattedData);
  }, [serviceExpendituresRange, serviceLogs, vehicleConfigs]);

  // 16. Recalculate Task Momentum (Velocity) client-side
  useEffect(() => {
    if (rawTasksData.length === 0) return;
    const today = new Date();
    const start = subDays(today, taskMomentumRange - 1);
    
    const tVelocity: Record<string, number> = {};
    eachDayOfInterval({ start, end: today }).forEach(d => tVelocity[format(d, "yyyy-MM-dd")] = 0);
    
    rawTasksData.forEach((t: any) => {
      if (t.completed_at) {
        const completedDate = new Date(t.completed_at);
        const ds = format(completedDate, "yyyy-MM-dd");
        if (tVelocity[ds] !== undefined) {
          tVelocity[ds]++;
        }
      }
    });

    setTaskVelocity(Object.entries(tVelocity).map(([date, count]) => ({ date: format(new Date(date), "dd MMM"), count })));
  }, [taskMomentumRange, rawTasksData]);

  // 17. Recalculate Task Throughput client-side
  useEffect(() => {
    if (rawTasksData.length === 0) return;
    const today = new Date();
    const cutoff = subDays(today, taskThroughputRange - 1);
    
    let createdCount = 0;
    let completedCount = 0;

    rawTasksData.forEach((t: any) => {
      const created = new Date(t.created_at || t.id.replace('ID_', ''));
      const completed = t.completed_at ? new Date(t.completed_at) : null;
      
      if (created >= cutoff) {
        createdCount++;
      }
      if (completed && completed >= cutoff) {
        completedCount++;
      }
    });

    setTaskThroughput([{ 
      name: `${taskThroughputRange}d Rate`, 
      created: createdCount, 
      completed: completedCount 
    }]);
  }, [taskThroughputRange, rawTasksData]);

  const fetchAll = async () => {
    setLoading(true);
    const today = new Date();
    const startDate = isCustomRange && customStart ? new Date(customStart) : subDays(today, daysRange - 1);
    const startDateStr = format(startDate, "yyyy-MM-dd");
    const d30 = format(subDays(today, 29), "yyyy-MM-dd");
    const d90 = format(subDays(today, 89), "yyyy-MM-dd");
    const d365 = format(subDays(today, 364), "yyyy-MM-dd");
    const monthStart = format(budgetMonth, "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(budgetMonth), "yyyy-MM-dd");

    const run = (allowedSections: string[]) => allowedSections.includes('ALL') || allowedSections.includes(activeTab);
    const mock = Promise.resolve({ data: [] });
    
    const results = await Promise.all([
      run(['ALL', 'FINANCE']) ? supabase.from("history_expenses").select("*").gte("date", d30).order("date") : mock, // 0
      run(['ALL', 'FINANCE']) ? supabase.from("liquidity").select("*") : mock, // 1
      run(['ALL', 'FINANCE']) ? supabase.from("assets").select("*") : mock, // 2
      run(['ALL', 'FINANCE']) ? supabase.from("liabilities").select("*") : mock, // 3
      run(['ALL', 'HABITS']) ? supabase.from("habit_data").select("*").gte("date", d365) : mock, // 4
      run(['ALL', 'HABITS']) ? supabase.from("habit_config").select("*").eq("is_deleted", false) : mock, // 5
      run(['ALL', 'WORKOUT']) ? supabase.from("workout_log").select("*").gte("date", d365).order("date") : mock, // 6
      run(['ALL', 'FINANCE', 'HABITS', 'WORKOUT', 'VEHICLES', 'SKILLS']) ? supabase.from("tasks").select("*") : mock, // 7
      run(['ALL', 'VEHICLES']) ? supabase.from("vehicle_config").select("*") : mock, // 8
      run(['ALL', 'VEHICLES']) ? supabase.from("vehicle_fuel_logs").select("*").order("date") : mock, // 9
      run(['ALL', 'VEHICLES']) ? supabase.from("vehicle_service_logs").select("*").order("date") : mock, // 10
      run(['ALL', 'FINANCE']) ? supabase.from("budget_plans").select("*").eq("month", monthStart) : mock, // 11
      run(['ALL', 'FINANCE']) ? supabase.from("history_liabilities").select("*").gte("date", startDateStr).order("date", { ascending: false }) : mock, // 12
      run(['ALL', 'FINANCE']) ? supabase.from("history_expenses").select("*").gte("date", startDateStr).order("date", { ascending: false }) : mock, // 13
      run(['ALL', 'FINANCE']) ? supabase.from("history_expenses").select("*").gte("date", monthStart).lte("date", monthEnd) : mock, // 14
      run(['ALL', 'FINANCE']) ? supabase.from("detailed_monthly_expenses").select("*").gte("date", monthStart) : mock, // 15
      run(['ALL', 'FINANCE']) ? supabase.from("history_expenses").select("*").gte("date", isCustomTrendRange && trendCustomStart ? trendCustomStart : format(subDays(today, trendDaysRange - 1), "yyyy-MM-dd")).lte("date", isCustomTrendRange && trendCustomEnd ? trendCustomEnd : format(today, "yyyy-MM-dd")).order("date") : mock, // 16
      run(['ALL', 'HABITS']) ? supabase.from("habit_data").select("*").gte("date", isCustomHabitTrendRange && habitTrendCustomStart ? habitTrendCustomStart : format(subDays(today, habitTrendDaysRange - 1), "yyyy-MM-dd")).lte("date", isCustomHabitTrendRange && habitTrendCustomEnd ? habitTrendCustomEnd : format(today, "yyyy-MM-dd")) : mock, // 17
      run(['ALL', 'VEHICLES']) ? supabase.from("vehicle_mileage_logs").select("*").gte("date", d365) : mock, // 18
      run(['ALL']) ? supabase.from("inventory_items").select("*") : mock, // 19
      run(['ALL', 'FINANCE', 'HABITS', 'WORKOUT', 'VEHICLES', 'SKILLS']) ? supabase.from("action_tasks").select("*") : mock, // 20
      run(['ALL', 'SKILLS']) ? supabase.from("skill_items").select("*") : mock, // 21
      run(['ALL', 'SKILLS']) ? supabase.from("skill_logs").select("*").order("date") : mock, // 22
      run(['ALL', 'PETS']) ? supabase.from("pet_profile").select("*") : mock, // 23
      run(['ALL', 'PETS']) ? supabase.from("pet_logs").select("*") : mock // 24
    ]);

    const expData = results[0].data;
    const liqData = results[1].data;
    const astData = results[2].data;
    const libData = results[3].data;
    const habitDataRaw = results[4].data || [];
    const habitCfgRaw = results[5].data || [];
    
    const badgedNames: Record<string, string> = {};
    const habitCfg = habitCfgRaw.map((c: any) => {
       let newName = c.habit_name;
       if (c.is_archived) newName = `${c.habit_name} (Archived)`;
       else if (c.is_paused) newName = `${c.habit_name} (Paused)`;
       
       badgedNames[c.habit_name] = newName;
       return { ...c, habit_name: newName };
    });

    const habitData = habitDataRaw.map((d: any) => ({ ...d, habit: badgedNames[d.habit] || d.habit }));
    const workoutRaw = results[6].data || [];
    const taskData = results[7].data;
    const vehicleCfg = results[8].data;
    const fuelData = results[9].data;
    const svcData = results[10].data;
    const budgetPlans = results[11].data;
    const histLibData = results[12].data;
    const histExpRange = results[13].data;
    const safeHistMonthRange = results[14].data || [];
    const detailedMonthExp = results[15].data;
    const trendMonthExp = results[16].data;
    const habitTrendRaw = (results[17].data || []).map((d: any) => ({ ...d, habit: badgedNames[d.habit] || d.habit }));
    const mLog = results[18].data;
    const inventoryItems = results[19].data;
    const actionTasks = results[20].data;

    setDetailedExpenses(detailedMonthExp || []);
    setVehicleConfigs(vehicleCfg || []);
    setMLogData(mLog || []);
    setServiceLogs(svcData || []);
    setSkillItems(results[21]?.data || []);
    setSkillLogs(results[22]?.data || []);
    setPetProfiles(results[23]?.data || []);
    // pets use a dynamic query based on pet names so we fetch separately
    const _petProfiles = results[23]?.data || [];
    if (_petProfiles.length > 0) {
      const petNames = _petProfiles.map((p: any) => p.name);
      const namesList = petNames.map((n: string) => `"${n}"`).join(',');
      const { data: _petExp } = await supabase.from('history_expenses').select('*').or(`category.eq.Pets,subcategory.in.(${namesList})`);
      setPetExpenses(_petExp || []);
    } else {
      const { data: _petExp } = await supabase.from('history_expenses').select('*').eq('category', 'Pets');
      setPetExpenses(_petExp || []);
    }
    setPetLogs(results[24]?.data || []);

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
    (safeHistMonthRange).filter(e => e.type === 'Expense').forEach(e => { if (!bvMap[e.category]) bvMap[e.category] = { planned: 0, actual: 0 }; bvMap[e.category].actual += parseFloat(e.amount) || 0; });
    setBudgetVariance(Object.entries(bvMap).map(([name, v]) => ({ name, ...v, diff: v.planned - v.actual })));

    const eCatMap: Record<string, number> = {};
    const eSubMap: Record<string, number> = {};
    (safeHistMonthRange).filter(e => e.type === 'Expense').forEach(e => {
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

    let committedTotal = 0;
    let discretionaryTotal = 0;
    (safeHistMonthRange).forEach(e => {
      if (e.type === 'Expense') {
        const amount = parseFloat(e.amount) || 0;
        const lowerCat = (e.category || '').toLowerCase();
        const lowerSub = (e.subcategory || '').toLowerCase();
        const isCommitted = lowerCat.includes('loan') || lowerCat.includes('utility') || lowerCat.includes('rent') || lowerCat.includes('sip') || lowerCat.includes('insurance') || lowerCat.includes('bill') || lowerSub.includes('emi') || lowerSub.includes('postpaid') || lowerSub.includes('broadband') || lowerSub.includes('electricity') || lowerSub.includes('insurance');
        if (isCommitted) committedTotal += amount;
        else discretionaryTotal += amount;
      }
    });
    setCommittedVsDiscretionary([
      { name: 'Committed', value: Math.round(committedTotal) },
      { name: 'Discretionary', value: Math.round(discretionaryTotal) }
    ]);

    const last90DaysExpensesVal = (savHist || []).filter(e => e.type === 'Expense' && e.date >= d90).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const avgMonthlyExpenseVal = Math.max(10000, last90DaysExpensesVal / 3);
    const runwayMonths = curLiq / avgMonthlyExpenseVal;
    setEmergencyFundRunway(runwayMonths);

    const initialDebtInputs: Record<string, { amount: number; frequency: number }> = {};
    (libData || []).forEach(l => {
      initialDebtInputs[l.party] = { amount: Math.round(parseFloat(l.remaining) / 12) || 1000, frequency: 1 };
    });
    setDebtTimelineInputs(prev => {
      const merged = { ...initialDebtInputs };
      Object.keys(prev).forEach(k => { if (merged[k]) merged[k] = prev[k]; });
      return merged;
    });

    // --- HABITS CONSOLIDATION ---
    setHabitConfigs(habitCfg || []);
    setAllHabitData(habitData || []);
    const hTrendToday = isCustomHabitTrendRange && habitTrendCustomEnd ? new Date(habitTrendCustomEnd) : new Date();
    const hTrendStart = isCustomHabitTrendRange && habitTrendCustomStart ? new Date(habitTrendCustomStart) : subDays(hTrendToday, habitTrendDaysRange - 1);
    const hDayMap: Record<string, any> = {};
    eachDayOfInterval({ start: hTrendStart, end: hTrendToday }).forEach(d => { hDayMap[format(d, "yyyy-MM-dd")] = { Success: 0, Failure: 0, Critical: 0, Tolerance: 0, "Not Entered": 0 }; });
    const dailyNames = new Set((habitCfg || []).map(c => c.habit_name));
    const habitToGroup: Record<string, string> = {};
    (habitCfg || []).forEach(c => { habitToGroup[c.habit_name] = c.group_name || 'General'; });
    (habitTrendRaw || []).filter(r => dailyNames.has(r.habit)).forEach(r => { const grp = habitToGroup[r.habit]; if (hDayMap[r.date] && (habitTrendGroup === "All Groups" || grp === habitTrendGroup)) { hDayMap[r.date][r.status] = (hDayMap[r.date][r.status] || 0) + 1; } });
    
    const habitsInGroup1 = Array.from(dailyNames).filter(name => habitTrendGroup === "All Groups" || habitToGroup[name] === habitTrendGroup).length;
    Object.keys(hDayMap).forEach(date => {
       const v = hDayMap[date];
       const totalLogged = (v.Success||0) + (v.Failure||0) + (v.Critical||0) + (v.Tolerance||0);
       v["Not Entered"] = Math.max(0, habitsInGroup1 - totalLogged);
    });

    setHabitScores(Object.entries(hDayMap).map(([date, v]) => ({ date: format(new Date(date), "dd MMM"), ...v })));



    const gMap: Record<string, { success: number, fail: number }> = {};
    (habitData || []).filter(h => h.date >= format(subDays(today, 60), "yyyy-MM-dd")).forEach(h => { if (!gMap[h.habit]) gMap[h.habit] = { success: 0, fail: 0 }; if (h.status === 'Success') gMap[h.habit].success++; else if (h.status === 'Failure' || h.status === 'Critical') gMap[h.habit].fail++; });
    setHabitGravityData(Object.entries(gMap).map(([name, v]) => { const total = v.success + v.fail; const rate = total > 0 ? Math.round((v.fail / total) * 100) : 0; return { name, rate }; }).filter(g => g.rate > 0).sort((a,b)=>b.rate - a.rate).slice(0, 5));
    const hmMap: Record<string, { total: number, success: number }> = {};
    eachDayOfInterval({ start: subDays(today, 364), end: today }).forEach(d => hmMap[format(d, "yyyy-MM-dd")] = { total: 0, success: 0 });
    (habitData || []).forEach(h => { if (hmMap[h.date]) { hmMap[h.date].total++; if (h.status === 'Success') hmMap[h.date].success++; } });
    setHabitHeatmapData(Object.entries(hmMap).map(([date, v]) => ({ date, score: v.total > 0 ? (v.success / v.total) : 0 })));

    const streaks: Record<string, { current: number; max: number; success: number; failure: number; tolerance: number; critical: number; consistency: number; recoveries: number }> = {};
    (habitCfg || []).forEach(cfg => {
      const name = cfg.habit_name;
      const hLogs = (habitData || []).filter(h => h.habit === name).sort((a,b) => b.date.localeCompare(a.date));
      let currentStreak = 0;
      let maxStreak = 0;
      let runningStreak = 0;
      [...hLogs].reverse().forEach(log => {
        if (log.status === 'Success') {
          runningStreak++;
          if (runningStreak > maxStreak) maxStreak = runningStreak;
        } else runningStreak = 0;
      });
      let checkDate = new Date();
      for (let i = 0; i < 15; i++) {
        const dStr = format(checkDate, "yyyy-MM-dd");
        const log = hLogs.find(l => l.date === dStr);
        if (log) {
          if (log.status === 'Success') currentStreak++;
          else break;
        } else if (i > 0) break;
        checkDate = subDays(checkDate, 1);
      }

      let success = 0;
      let failure = 0;
      let tolerance = 0;
      let critical = 0;
      let recoveries = 0;
      hLogs.forEach(h => {
        if (h.status === 'Success') success++;
        else if (h.status === 'Failure') failure++;
        else if (h.status === 'Tolerance') tolerance++;
        else if (h.status === 'Critical') critical++;
      });

      const sortedLogs = [...hLogs].sort((a, b) => a.date.localeCompare(b.date));
      for (let i = 0; i < sortedLogs.length - 1; i++) {
        if ((sortedLogs[i].status === 'Failure' || sortedLogs[i].status === 'Critical') && sortedLogs[i+1].status === 'Success') {
          recoveries++;
        }
      }
      const totalLogged = success + failure + tolerance + critical;
      const consistency = totalLogged > 0 ? Math.round((success / totalLogged) * 100) : 0;

      streaks[name] = { 
        current: currentStreak, 
        max: maxStreak,
        success,
        failure,
        tolerance,
        critical,
        consistency,
        recoveries
      };
    });
    setHabitStreaks(streaks);

    let totalMisses = 0;
    let successfulRecoveries = 0;
    (habitCfg || []).forEach(cfg => {
      const name = cfg.habit_name;
      const hLogs = (habitData || []).filter(h => h.habit === name).sort((a,b) => a.date.localeCompare(b.date));
      for (let i = 0; i < hLogs.length - 1; i++) {
        if (hLogs[i].status === 'Failure' || hLogs[i].status === 'Critical') {
          totalMisses++;
          if (hLogs[i+1].status === 'Success') successfulRecoveries++;
        }
      }
    });
    setNeverMissTwice({ totalMisses, successfulRecoveries, rate: totalMisses > 0 ? Math.round((successfulRecoveries / totalMisses) * 100) : 100 });

    const correlations: any[] = [];
    const dailyHabitNames = (habitCfg || []).map(c => c.habit_name);
    for (let i = 0; i < dailyHabitNames.length; i++) {
      for (let j = 0; j < dailyHabitNames.length; j++) {
        if (i === j) continue;
        const habitA = dailyHabitNames[i];
        const habitB = dailyHabitNames[j];
        const datesA: Record<string, string> = {};
        (habitData || []).filter(h => h.habit === habitA).forEach(h => {
          datesA[h.date] = h.status;
        });
        const logsB = (habitData || []).filter(h => h.habit === habitB);
        let bothLogged = 0, aSuccess = 0, bothSuccess = 0, bSuccess = 0;
        logsB.forEach(logB => {
          const statusA = datesA[logB.date];
          if (statusA) {
            bothLogged++;
            if (statusA === 'Success') aSuccess++;
            if (logB.status === 'Success') bSuccess++;
            if (statusA === 'Success' && logB.status === 'Success') bothSuccess++;
          }
        });
        if (bothLogged > 15 && aSuccess > 5) {
          const pB = bSuccess / bothLogged;
          const pBGivenA = bothSuccess / aSuccess;
          const lift = pBGivenA - pB;
          if (lift > 0.05) {
            correlations.push({ habitA, habitB, lift: Math.round(lift * 100), prob: Math.round(pBGivenA * 100), baseProb: Math.round(pB * 100) });
          }
        }
      }
    }
    setHabitCorrelations(correlations.sort((a,b) => b.lift - a.lift).slice(0, 5));

    // --- WORKOUT CONSOLIDATION ---
    setWorkoutData(workoutRaw);

    const wFreshMap: Record<string, string> = {};
    workoutRaw.forEach(r => {
      const bp = r.body_part || r.workout_day || "Unknown";
      if (!wFreshMap[bp] || r.date > wFreshMap[bp]) wFreshMap[bp] = r.date;
    });

    setWorkoutFreshness(Object.entries(wFreshMap).map(([name, lastDate]) => { const days = differenceInDays(today, new Date(lastDate)); let status = "Restored"; if (days < 2) status = "Recovering"; else if (days < 4) status = "Optimal"; return { name, days, status }; }).sort((a,b)=>b.days - a.days).slice(0, 5));
    const tMV = workoutRaw.filter(r => r.date >= d30).reduce((sum, r) => sum + ((parseFloat(r.weight) || 0) * (parseInt(r.reps) || 0)), 0);
    const lMV = workoutRaw.filter(r => r.date >= format(subDays(today, 59), "yyyy-MM-dd") && r.date < d30).reduce((sum, r) => sum + ((parseFloat(r.weight) || 0) * (parseInt(r.reps) || 0)), 0);
    setWorkoutVelocityData([{ name: "Growth", value: lMV > 0 ? Math.round(((tMV - lMV) / lMV) * 100) : 0 }]);
    const whmMap: Record<string, boolean> = {}; workoutRaw.forEach(r => whmMap[r.date] = true);
    setWorkoutHeatmapData(eachDayOfInterval({ start: subDays(today, 364), end: today }).map(d => ({ date: format(d, "yyyy-MM-dd"), active: !!whmMap[format(d, "yyyy-MM-dd")] })));

    const allExercises = Array.from(new Set(workoutRaw.map((w: any) => w.workout_name).filter(Boolean))) as string[];
    setExerciseList(allExercises);
    if (selectedMatrixExercises.length === 0 && allExercises.length > 0) {
      setSelectedMatrixExercises([allExercises[0]]);
    }



    const plateauList: any[] = [];
    allExercises.forEach(exercise => {
      const exerciseLogs = workoutRaw.filter((w: any) => w.workout_name === exercise).sort((a,b) => a.date.localeCompare(b.date));
      const sessions: { date: string; maxWeight: number; maxVol: number }[] = [];
      const groupedByDate: Record<string, any[]> = {};
      exerciseLogs.forEach(l => {
        if (!groupedByDate[l.date]) groupedByDate[l.date] = [];
        groupedByDate[l.date].push(l);
      });
      Object.entries(groupedByDate).forEach(([date, logs]) => {
        let maxW = 0, maxV = 0;
        logs.forEach(l => {
          const w = parseFloat(l.weight) || 0;
          const r = parseInt(l.reps) || 0;
          maxW = Math.max(maxW, w);
          maxV = Math.max(maxV, w * r);
        });
        sessions.push({ date, maxWeight: maxW, maxVol: maxV });
      });
      if (sessions.length >= 4) {
        const last4 = sessions.slice(-4);
        let weightPlateau = true;
        for (let idx = 1; idx < last4.length; idx++) {
          if (last4[idx].maxWeight > last4[idx-1].maxWeight) {
            weightPlateau = false;
            break;
          }
        }
        if (weightPlateau) {
          plateauList.push({ exercise, currentMax: last4[3].maxWeight, lastTrained: format(new Date(last4[3].date), "dd MMM") });
        }
      }
    });
    setWorkoutPlateaus(plateauList.slice(0, 5));

    // --- VEHICLE CONSOLIDATION ---
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

    const fuelOdoLogs = [...(fuelData || [])].map(f => ({ vId: f.vehicle_id, date: f.date, odo: parseFloat(f.odometer) })).sort((a,b) => a.odo - b.odo);
    const vFuelDistMap: Record<string, { min: number, max: number }> = {};
    const vFuelCostMap: Record<string, number> = {};
    
    fuelOdoLogs.forEach(l => { 
      const initialOdo = (vehicleCfg || []).find(v => v.id === l.vId)?.initial_odometer || l.odo;
      if (!vFuelDistMap[l.vId]) vFuelDistMap[l.vId] = { min: initialOdo, max: l.odo }; 
      vFuelDistMap[l.vId].max = Math.max(vFuelDistMap[l.vId].max, l.odo); 
    });

    
    (fuelData || []).forEach(f => {
      const initialOdo = (vehicleCfg || []).find(v => v.id === f.vehicle_id)?.initial_odometer || 0;
      if (parseFloat(f.odometer) > initialOdo) {
        vFuelCostMap[f.vehicle_id] = (vFuelCostMap[f.vehicle_id] || 0) + (parseFloat(f.amount) || 0);
      }
    });

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

    const forecasts: any[] = [];
    (vehicleCfg || []).forEach(v => {
      const vLogs = (mLog || []).filter((m: any) => m.vehicle_id === v.id).sort((a,b) => a.date.localeCompare(b.date));
      const vFuelLogs = (fuelData || []).filter((f: any) => f.vehicle_id === v.id).sort((a,b) => a.date.localeCompare(b.date));
      const odoReadings = [
        ...vLogs.map((l: any) => ({ date: new Date(l.date), odo: parseFloat(l.odometer) })),
        ...vFuelLogs.map((l: any) => ({ date: new Date(l.date), odo: parseFloat(l.odometer) }))
      ].sort((a,b) => a.date.getTime() - b.date.getTime());
      let dailyRate = 10;
      if (odoReadings.length >= 2) {
        const first = odoReadings[0];
        const last = odoReadings[odoReadings.length - 1];
        const days = Math.max(1, differenceInDays(last.date, first.date));
        const dist = last.odo - first.odo;
        if (dist > 0) dailyRate = dist / days;
      }
      const currentOdo = odoReadings.length > 0 ? odoReadings[odoReadings.length - 1].odo : (parseFloat(v.initial_odometer) || 0);
      let targetOdo = Math.ceil((currentOdo + 100) / 5000) * 5000;
      if (targetOdo - currentOdo < 500) targetOdo += 5000;
      const kmsToService = Math.max(0, targetOdo - currentOdo);
      const daysToService = dailyRate > 0 ? (kmsToService / dailyRate) : 365;
      const predictedDate = addMonths(new Date(), Math.round((daysToService / 30) * 10) / 10);
      forecasts.push({
        name: v.vehicle_name,
        currentOdo: Math.round(currentOdo),
        targetOdo,
        kmsRemaining: Math.round(kmsToService),
        predictedDate: v.next_service_date ? format(new Date(v.next_service_date), "dd MMM yyyy") : format(predictedDate, "dd MMM yyyy")
      });
    });
    setMaintenanceForecasts(forecasts);



    const realTCOList: any[] = [];
    (vehicleCfg || []).forEach(v => {
      const fuelCost = (fuelData || []).filter(f => f.vehicle_id === v.id).reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);
      const svcCost = (svcData || []).filter(s => s.vehicle_id === v.id).reduce((s, s_l) => s + (parseFloat(s_l.amount) || 0), 0);
      const createdDate = v.purchase_date ? new Date(v.purchase_date) : (v.created_at ? new Date(v.created_at) : new Date());
      const ageYears = Math.max(0.5, differenceInDays(new Date(), createdDate) / 365.25);
      const estimatedOriginalPrice = parseFloat(v.purchase_price) || (v.vehicle_type === 'Car' ? 700000 : 150000);
      const annualDepreciation = estimatedOriginalPrice * 0.10;
      const totalDepreciation = annualDepreciation * ageYears;
      const totalCost = fuelCost + svcCost + totalDepreciation;
      const vLogs = (mLog || []).filter((m: any) => m.vehicle_id === v.id);
      const vFuelLogs = (fuelData || []).filter((f: any) => f.vehicle_id === v.id);
      const odoValues = [...vLogs, ...vFuelLogs].map((l: any) => parseFloat(l.odometer)).filter(Boolean);
      const maxOdo = odoValues.length > 0 ? Math.max(...odoValues) : (parseFloat(v.initial_odometer) || 0);
      const distance = Math.max(100, maxOdo - (parseFloat(v.initial_odometer) || 0));
      realTCOList.push({
        name: v.vehicle_name,
        fuelCost: Math.round(fuelCost),
        svcCost: Math.round(svcCost),
        depreciation: Math.round(totalDepreciation),
        tcoPerKm: (totalCost / distance).toFixed(2),
        distance
      });
    });
    setRealTCOPerKM(realTCOList);

    // --- TASK CONSOLIDATION ---
    const tasks = taskData || [];
    setRawTasksData(tasks);
    const tHeatmap: Record<string, number> = {};
    const tAgingBuckets = { "< 7d": 0, "7-30d": 0, "> 30d": 0 };

    tasks.forEach((t: any) => {
      const created = new Date(t.created_at || t.id.replace('ID_', '')); 
      const completed = t.completed_at ? new Date(t.completed_at) : null;

      if (completed) {
        const ds = format(completed, "yyyy-MM-dd");
        tHeatmap[ds] = (tHeatmap[ds] || 0) + 1;
      } else {
        const age = differenceInDays(today, created);
        if (age < 7) tAgingBuckets["< 7d"]++;
        else if (age < 30) tAgingBuckets["7-30d"]++;
        else tAgingBuckets["> 30d"]++;
      }
    });

    setTaskStats({ 
      done: tasks.filter((t:any) => t.status === "Completed" || t.status === "Done").length, 
      pending: tasks.filter((t:any) => t.status !== "Completed" && t.status !== "Done").length, 
      high: tasks.filter((t:any) => t.is_high_priority).length 
    });
    setTaskAging(Object.entries(tAgingBuckets).map(([name, value]) => ({ name, value })));
    setTaskHeatmap(eachDayOfInterval({ start: subDays(today, 364), end: today }).map(d => {
      const ds = format(d, "yyyy-MM-dd");
      return { date: ds, count: tHeatmap[ds] || 0 };
    }));

    const systemAlerts: any[] = [];
    (vehicleCfg || []).forEach(v => {
      if (v.insurance_expiry) {
        const exp = new Date(v.insurance_expiry);
        const days = differenceInDays(exp, today);
        if (days < 0) {
          systemAlerts.push({ id: `ins-exp-${v.id}`, type: 'error', section: 'VEHICLES', text: `${v.vehicle_name} insurance EXPIRED by ${Math.abs(days)} days!` });
        } else if (days < 30) {
          systemAlerts.push({ id: `ins-warn-${v.id}`, type: 'warning', section: 'VEHICLES', text: `${v.vehicle_name} insurance expires in ${days} days.` });
        }
      }
      if (v.next_service_date) {
        const svc = new Date(v.next_service_date);
        const days = differenceInDays(svc, today);
        if (days < 0) {
          systemAlerts.push({ id: `svc-exp-${v.id}`, type: 'error', section: 'VEHICLES', text: `${v.vehicle_name} service is OVERDUE by ${Math.abs(days)} days!` });
        } else if (days < 14) {
          systemAlerts.push({ id: `svc-warn-${v.id}`, type: 'warning', section: 'VEHICLES', text: `${v.vehicle_name} service is due in ${days} days.` });
        }
      }
    });
    (actionTasks || []).forEach((t: any) => {
      if (!t.completed && t.due) {
        const due = new Date(t.due);
        const days = differenceInDays(due, today);
        if (days < 0) {
          systemAlerts.push({ id: `task-overdue-${t.id}`, type: 'error', section: 'TASKS', text: `SquareShift: Overdue task "${t.text}" (${Math.abs(days)}d overdue)` });
        }
      }
    });
    (taskData || []).forEach((t: any) => {
      if (t.is_high_priority && t.status === 'Pending') {
        systemAlerts.push({ id: `task-high-${t.id}`, type: 'warning', section: 'TASKS', text: `High priority task pending: "${t.task}"` });
      }
    });
    (budgetPlans || []).forEach(p => {
      const catActual = (safeHistMonthRange).filter(e => e.type === 'Expense' && e.category === p.category && e.subcategory === p.subcategory).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
      const planned = parseFloat(p.planned_amount) || 0;
      if (planned > 0 && catActual > planned) {
        systemAlerts.push({
          id: `budget-over-${p.category}-${p.subcategory}`,
          type: 'error',
          section: 'FINANCE',
          text: `Budget exceeded: ${p.category} -> ${p.subcategory} by ₹${Math.round(catActual - planned).toLocaleString()}!`
        });
      }
    });
    (inventoryItems || []).forEach((item: any) => {
      if (item.status === 'lent_out' && item.return_due_date) {
        const due = new Date(item.return_due_date);
        const days = differenceInDays(due, today);
        if (days < 0) {
          systemAlerts.push({ id: `inv-overdue-${item.id}`, type: 'error', section: 'FINANCE', text: `Lent out item overdue: "${item.name}" with ${item.lent_to_person} (${Math.abs(days)}d overdue)` });
        }
      }
    });
    setAlerts(systemAlerts);

    setLoading(false);
  };

  const debtPayoffCalculations = useMemo(() => {
    const calcs: Record<string, { monthsToPay: number; monthlyPaymentEquivalent: number; timelinePoints: any[] }> = {};
    liabilities.forEach(l => {
      const input = debtTimelineInputs[l.name] || { amount: Math.round(l.value / 12) || 1000, frequency: 1 };
      const payAmount = input.amount || 1;
      const freq = input.frequency || 1;
      const monthlyPaymentEquivalent = payAmount / freq;
      const monthsToPay = monthlyPaymentEquivalent > 0 ? (l.value / monthlyPaymentEquivalent) : 999;
      const points: any[] = [];
      let currentRemaining = l.value;
      for (let m = 0; m <= Math.min(60, Math.ceil(monthsToPay)); m++) {
        points.push({ month: `M+${m}`, remaining: Math.round(currentRemaining) });
        currentRemaining = Math.max(0, currentRemaining - monthlyPaymentEquivalent);
      }
      calcs[l.name] = {
        monthsToPay: Math.round(monthsToPay * 10) / 10,
        monthlyPaymentEquivalent,
        timelinePoints: points
      };
    });
    return calcs;
  }, [liabilities, debtTimelineInputs]);

  const fetchNetWorthData = async () => {
    try {
      const today = new Date();
      const startDate = isCustomRange && customStart ? new Date(customStart) : subDays(today, daysRange - 1);
      const startDateStr = format(startDate, "yyyy-MM-dd");
      const results = await Promise.all([
        supabase.from("liquidity").select("*"),
        supabase.from("assets").select("*"),
        supabase.from("liabilities").select("*"),
        supabase.from("history_liabilities").select("*").gte("date", startDateStr).order("date", { ascending: false }),
        supabase.from("history_expenses").select("*").gte("date", startDateStr).order("date", { ascending: false })
      ]);
      
      const liqData = results[0].data;
      const astData = results[1].data;
      const libData = results[2].data;
      const histLibData = results[3].data;
      const histExpRange = results[4].data;

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

    setLiquidity((liqData || []).map(a => ({ name: a.account_name, value: Math.round(parseFloat(a.balance) || 0) })));
    setAssets((astData || []).map(a => ({ name: a.asset_name, current: Math.round(parseFloat(a.current_value) || 0), bought: Math.round(parseFloat(a.purchase_price) || 0) })));
    setLiabilities((libData || []).map(l => ({ name: l.party, value: Math.round(parseFloat(l.remaining) || 0) })));
    } catch (error) {
      console.error("Error fetching net worth data:", error);
    }
  };

  const fetchSavingsData = async () => {
    const today = new Date();
    const savToday = isCustomSavingsRange && savingsCustomEnd ? new Date(savingsCustomEnd) : new Date();
    const savStart = isCustomSavingsRange && savingsCustomStart ? new Date(savingsCustomStart) : subDays(savToday, savingsRange - 1);
    const { data: savHist } = await supabase.from("history_expenses").select("date,amount,type").gte("date", format(savStart, "yyyy-MM-dd")).lte("date", format(savToday, "yyyy-MM-dd"));
    const useDailyGrouping = savingsRange <= 45 || (isCustomSavingsRange && eachDayOfInterval({start: savStart, end: savToday}).length <= 45);
    const srMap: Record<string, { income: number, expense: number }> = {};
    if (useDailyGrouping) { eachDayOfInterval({ start: savStart, end: savToday }).forEach(d => { srMap[format(d, "dd MMM")] = { income: 0, expense: 0 }; }); } else { let curr = startOfMonth(savStart); while (curr <= savToday) { srMap[format(curr, "MMM yyyy")] = { income: 0, expense: 0 }; curr = addMonths(curr, 1); } }
    (savHist || []).forEach(r => { const key = useDailyGrouping ? format(new Date(r.date), "dd MMM") : format(new Date(r.date), "MMM yyyy"); if (srMap[key]) { if (r.type === 'Income') srMap[key].income += parseFloat(r.amount) || 0; if (r.type === 'Expense') srMap[key].expense += parseFloat(r.amount) || 0; } });
    setSavingsRateData(Object.entries(srMap).map(([name, v]) => ({ name, ...v, savings: v.income - v.expense })));
  };

  const fetchMonthlyFinanceData = async () => {
    // 1. Budget Month Bounds
    const bMonthStart = format(budgetMonth, "yyyy-MM-dd");
    const bMonthEnd = format(endOfMonth(budgetMonth), "yyyy-MM-dd");

    // 2. Expense Month Bounds
    const eMonthStart = format(expenseMonth, "yyyy-MM-dd");
    const eMonthEnd = format(endOfMonth(expenseMonth), "yyyy-MM-dd");

    const results = await Promise.all([
      supabase.from("budget_plans").select("*").eq("month", bMonthStart),
      supabase.from("history_expenses").select("*").gte("date", bMonthStart).lte("date", bMonthEnd),
      supabase.from("history_expenses").select("*").gte("date", eMonthStart).lte("date", eMonthEnd)
    ]);
    const budgetPlans = results[0].data;
    const safeBMonthActuals = results[1].data || [];
    const safeEMonthActuals = results[2].data || [];

    const bvMap: Record<string, { planned: number, actual: number }> = {};
    (budgetPlans || []).forEach(p => { if (!bvMap[p.category]) bvMap[p.category] = { planned: 0, actual: 0 }; bvMap[p.category].planned += parseFloat(p.planned_amount) || 0; });
    safeBMonthActuals.filter(e => e.type === 'Expense').forEach(e => { if (!bvMap[e.category]) bvMap[e.category] = { planned: 0, actual: 0 }; bvMap[e.category].actual += parseFloat(e.amount) || 0; });
    setBudgetVariance(Object.entries(bvMap).map(([name, v]) => ({ name, ...v, diff: v.planned - v.actual })));

    const eCatMap: Record<string, number> = {};
    const eSubMap: Record<string, number> = {};
    safeEMonthActuals.filter(e => e.type === 'Expense').forEach(e => {
      eCatMap[e.category] = (eCatMap[e.category] || 0) + (parseFloat(e.amount) || 0);
      if (expenseSelectedCategory === "All" || e.category === expenseSelectedCategory) {
        eSubMap[e.subcategory || "Uncategorized"] = (eSubMap[e.subcategory || "Uncategorized"] || 0) + (parseFloat(e.amount) || 0);
      }
    });
    setCatSpendData(Object.entries(eCatMap).sort((a,b)=>b[1]-a[1]).map(([name, value]) => ({ name, value: Math.round(value) })));
    setSubCatSpendData(Object.entries(eSubMap).sort((a,b)=>b[1]-a[1]).map(([name, value]) => ({ name, value: Math.round(value) })));

    let committedTotal = 0;
    let discretionaryTotal = 0;
    safeEMonthActuals.forEach(e => {
      if (e.type === 'Expense') {
        const amount = parseFloat(e.amount) || 0;
        const lowerCat = (e.category || '').toLowerCase();
        const lowerSub = (e.subcategory || '').toLowerCase();
        const isCommitted = lowerCat.includes('loan') || lowerCat.includes('utility') || lowerCat.includes('rent') || lowerCat.includes('sip') || lowerCat.includes('insurance') || lowerCat.includes('bill') || lowerSub.includes('emi') || lowerSub.includes('postpaid') || lowerSub.includes('broadband') || lowerSub.includes('electricity') || lowerSub.includes('insurance');
        if (isCommitted) committedTotal += amount;
        else discretionaryTotal += amount;
      }
    });
    setCommittedVsDiscretionary([
      { name: 'Committed', value: Math.round(committedTotal) },
      { name: 'Discretionary', value: Math.round(discretionaryTotal) }
    ]);
  };

  const fetchExpenseTrendData = async () => {
    const today = new Date();
    const tToday = isCustomTrendRange && trendCustomEnd ? new Date(trendCustomEnd) : new Date();
    const tStart = isCustomTrendRange && trendCustomStart ? new Date(trendCustomStart) : subDays(tToday, trendDaysRange - 1);
    const { data: trendMonthExp } = await supabase.from("history_expenses").select("*").gte("date", format(tStart, "yyyy-MM-dd")).lte("date", format(tToday, "yyyy-MM-dd")).order("date");

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
  };

  const fetchHabitTrendData = async () => {
    const today = new Date();
    const hTrendToday = isCustomHabitTrendRange && habitTrendCustomEnd ? new Date(habitTrendCustomEnd) : new Date();
    const hTrendStart = isCustomHabitTrendRange && habitTrendCustomStart ? new Date(habitTrendCustomStart) : subDays(hTrendToday, habitTrendDaysRange - 1);
    const { data: habitTrendRaw } = await supabase.from("habit_data").select("*").gte("date", format(hTrendStart, "yyyy-MM-dd")).lte("date", format(hTrendToday, "yyyy-MM-dd"));

    const hDayMap: Record<string, any> = {};
    eachDayOfInterval({ start: hTrendStart, end: hTrendToday }).forEach(d => { hDayMap[format(d, "yyyy-MM-dd")] = { Success: 0, Failure: 0, Critical: 0, Tolerance: 0, "Not Entered": 0 }; });
    const dailyNames = new Set(habitConfigs.map(c => c.habit_name));
    const habitToGroup: Record<string, string> = {};
    habitConfigs.forEach(c => { habitToGroup[c.habit_name] = c.group_name || 'General'; });
    (habitTrendRaw || []).filter(r => dailyNames.has(r.habit)).forEach(r => { const grp = habitToGroup[r.habit]; if (hDayMap[r.date] && (habitTrendGroup === "All Groups" || grp === habitTrendGroup)) { hDayMap[r.date][r.status] = (hDayMap[r.date][r.status] || 0) + 1; } });
    
    const habitsInGroup1 = Array.from(dailyNames).filter(name => habitTrendGroup === "All Groups" || habitToGroup[name] === habitTrendGroup).length;
    Object.keys(hDayMap).forEach(date => {
       const v = hDayMap[date];
       const totalLogged = (v.Success||0) + (v.Failure||0) + (v.Critical||0) + (v.Tolerance||0);
       v["Not Entered"] = Math.max(0, habitsInGroup1 - totalLogged);
    });

    setHabitScores(Object.entries(hDayMap).map(([date, v]) => ({ date: format(new Date(date), "dd MMM"), ...v })));
  };

  const recalculateVehicleKMs = () => {
    const today = new Date();
    const usageOdoLogs = [...(mLogData || [])].map((m:any) => ({ vId: m.vehicle_id, date: m.date, odo: parseFloat(m.odometer) })).sort((a,b) => a.odo - b.odo);
    
    const vNameMap: Record<string, string> = {};
    vehicleConfigs.forEach(vc => {
      vNameMap[vc.id] = vc.vehicle_name;
    });

    const vUsageHeatmap: Record<string, Record<string, number>> = {};
    const vUsageGrouped = usageOdoLogs.reduce((acc, l) => { if (!acc[l.vId]) acc[l.vId] = []; acc[l.vId].push(l); return acc; }, {} as Record<string, any[]>);
    
    Object.entries(vUsageGrouped).forEach(([vId, logs]) => {
      vUsageHeatmap[vId] = {};
      for (let i = 1; i < logs.length; i++) {
        const d1 = new Date(logs[i-1].date); 
        const d2 = new Date(logs[i].date); 
        const diff = logs[i].odo - logs[i-1].odo; 
        if (diff <= 0) continue; 
        const days = Math.max(1, differenceInDays(d2, d1)); 
        const dailyKms = diff / days;
        eachDayOfInterval({ start: d1, end: d2 }).forEach(d => { 
          const ds = format(d, "yyyy-MM-dd"); 
          vUsageHeatmap[vId][ds] = (vUsageHeatmap[vId][ds] || 0) + dailyKms; 
        });
      }
    });

    const start = isVehicleKMsCustom ? new Date(vkStart) : subDays(today, vehicleKMsDays);
    const end = isVehicleKMsCustom ? new Date(vkEnd) : today;

    const trendData = eachDayOfInterval({ start, end }).map(d => {
      const ds = format(d, "yyyy-MM-dd");
      const row: Record<string, any> = { date: format(d, "dd MMM") };
      let totalKms = 0;
      Object.keys(vUsageHeatmap).forEach(vId => {
        const vKms = Math.round(vUsageHeatmap[vId][ds] || 0);
        const name = vNameMap[vId] || `Vehicle ${vId.slice(0, 4)}`;
        row[name] = vKms;
        totalKms += vKms;
      });
      row["Total"] = totalKms;
      return row;
    });

    setVehicleKMsTrend(trendData);
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

  const get1RMTrendData = (exerciseName: string) => {
    const today = new Date();
    const cutoffDate = subDays(today, workout1RMRange - 1);
    const cutoffStr = format(cutoffDate, "yyyy-MM-dd");
    const sessions: Record<string, number> = {};
    workoutData
      .filter((w: any) => w.workout_name === exerciseName && w.date >= cutoffStr)
      .forEach((w: any) => {
        const weight = parseFloat(w.weight) || 0;
        const reps = parseInt(w.reps) || 0;
        if (reps > 0 && weight > 0) {
          const est1RM = weight * (1 + reps / 30);
          sessions[w.date] = Math.max(sessions[w.date] || 0, est1RM);
        }
      });
    return Object.entries(sessions).map(([date, val]) => ({
      date: format(new Date(date), "dd MMM"),
      oneRepMax: Math.round(val)
    })).sort((a,b) => a.date.localeCompare(b.date));
  };

  const strengthMatrixData = useMemo(() => {
    const today = new Date();
    let cutoffDate: Date | null = null;
    if (selectedStrengthTimeframe !== "all") {
      cutoffDate = subDays(today, parseInt(selectedStrengthTimeframe));
    }

    const dateFilteredLogs = workoutData.filter((w: any) => {
      if (!cutoffDate) return true;
      const logDate = new Date(w.date);
      return logDate >= cutoffDate;
    });

    const allTimePRs: Record<string, number> = {};
    workoutData.forEach((w: any) => {
      const name = w.workout_name;
      const weight = parseFloat(w.weight) || 0;
      if (name && weight > 0) {
        allTimePRs[name] = Math.max(allTimePRs[name] || 0, weight);
      }
    });

    const activeExercises = selectedMatrixExercises.filter(ex =>
      ex.toLowerCase().includes(strengthSearchQuery.toLowerCase())
    );

    return activeExercises.map((exName) => {
      const logs = dateFilteredLogs.filter((w: any) => w.workout_name === exName);

      if (logs.length === 0) {
        return {
          exercise: exName,
          pr: 0,
          prDate: "-",
          avg: 0,
          mostUsed: 0,
          est1RM: 0,
          volume: 0,
          prDelta: 0,
          hasLogs: false
        };
      }

      let pr = 0;
      let prDate = "";
      let totalWeight = 0;
      let totalCount = 0;
      let max1RM = 0;
      let volume = 0;
      const weightCounts: Record<number, number> = {};
      const repCounts: Record<number, number> = {};

      logs.forEach((w: any) => {
        const weight = parseFloat(w.weight) || 0;
        const reps = parseInt(w.reps) || 0;
        if (weight <= 0) return;

        totalWeight += weight;
        totalCount += 1;
        volume += weight * reps;

        weightCounts[weight] = (weightCounts[weight] || 0) + 1;
        if (reps > 0) {
          repCounts[reps] = (repCounts[reps] || 0) + 1;
        }

        if (reps > 0) {
          const oneRM = weight * (1 + reps / 30);
          if (oneRM > max1RM) max1RM = oneRM;
        }

        if (weight >= pr) {
          pr = weight;
          if (!prDate || w.date >= prDate) {
            prDate = w.date;
          }
        }
      });

      let mostUsed = 0;
      let maxCount = 0;
      Object.entries(weightCounts).forEach(([wStr, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostUsed = parseFloat(wStr);
        }
      });

      let mostUsedReps = 0;
      let maxRepCount = 0;
      Object.entries(repCounts).forEach(([rStr, count]) => {
        if (count > maxRepCount) {
          maxRepCount = count;
          mostUsedReps = parseInt(rStr);
        }
      });

      const allTimeBest = allTimePRs[exName] || 0;
      const prDelta = allTimeBest > 0 ? pr - allTimeBest : 0;

      return {
        exercise: exName,
        pr,
        prDate: prDate ? format(new Date(prDate), "dd MMM yyyy") : "-",
        avg: Math.round((totalWeight / totalCount) * 10) / 10,
        mostUsed,
        est1RM: Math.round(max1RM),
        volume: Math.round(volume),
        prDelta,
        mostUsedReps,
        totalSets: totalCount,
        hasLogs: true
      };
    });
  }, [workoutData, selectedStrengthTimeframe, strengthSearchQuery, selectedMatrixExercises]);

  const skillsReports = useMemo(() => {
    const today = new Date();
    const cutoffDate = subDays(today, skillsTimeframe);
    const cutoffStr = format(cutoffDate, "yyyy-MM-dd");

    // 1. Focus vs. Legacy Time Allocation (Balance Chart)
    const logsInTimeframe = skillLogs.filter(l => l.date >= cutoffStr);
    const timeBySkill: Record<string, number> = {};
    logsInTimeframe.forEach(l => {
      timeBySkill[l.skill_id] = (timeBySkill[l.skill_id] || 0) + (l.duration_minutes || 0);
    });

    const focusVsLegacyData = Object.entries(timeBySkill).map(([skillId, mins]) => {
      const skill = skillItems.find(s => s.id === skillId);
      return {
        id: skillId,
        name: skill ? skill.name : "Unknown",
        value: Math.round((mins / 60) * 10) / 10, // Hours
        color: skill ? skill.color : "#94a3b8",
        isFocus: skill ? skill.status === "focus" : false
      };
    }).sort((a, b) => b.value - a.value);

    // 2. Practice Consistency Heatmap
    const daysInPeriod = eachDayOfInterval({ start: cutoffDate, end: today });
    const logCountsByDate: Record<string, number> = {};
    logsInTimeframe.forEach(l => {
      logCountsByDate[l.date] = (logCountsByDate[l.date] || 0) + 1;
    });
    const consistencyHeatmap = daysInPeriod.map(d => {
      const dStr = format(d, "yyyy-MM-dd");
      return {
        date: dStr,
        count: logCountsByDate[dStr] || 0
      };
    });

    // 3. Mastery Progression & Hour Milestones
    const sortedLogs = [...skillLogs].sort((a, b) => a.date.localeCompare(b.date));
    const progressionData: any[] = [];
    
    const filteredProgressionLogs = sortedLogs.filter(l => {
      if (selectedProgressSkill === "All") return true;
      return l.skill_id === selectedProgressSkill;
    });

    const progByDate: Record<string, number> = {};
    filteredProgressionLogs.forEach(l => {
      progByDate[l.date] = (progByDate[l.date] || 0) + l.duration_minutes;
    });

    let cumMins = 0;
    Object.entries(progByDate).sort((a,b) => a[0].localeCompare(b[0])).forEach(([date, mins]) => {
      cumMins += mins;
      progressionData.push({
        date: format(new Date(date), "dd MMM"),
        hours: Math.round((cumMins / 60) * 10) / 10
      });
    });

    // 4. Monthly Target Achievement Rate
    const monthlyTargetData: any[] = [];
    const focusSkills = skillItems.filter(s => s.status === 'focus' || s.focus_month);
    const uniqueMonths = [...new Set(focusSkills.map(s => s.focus_month).filter(Boolean))] as string[];
    
    uniqueMonths.sort().forEach(mStr => {
      const mDate = new Date(mStr);
      const mStart = format(startOfMonth(mDate), "yyyy-MM-dd");
      const mEnd = format(endOfMonth(mDate), "yyyy-MM-dd");
      
      const skillForMonth = focusSkills.find(s => s.focus_month === mStr);
      if (skillForMonth) {
        const monthLogs = skillLogs.filter(l => l.skill_id === skillForMonth.id && l.date >= mStart && l.date <= mEnd);
        monthlyTargetData.push({
          month: format(mDate, "MMM yyyy"),
          actual: monthLogs.length,
          target: skillForMonth.target_sessions_per_month || 20,
          skillName: skillForMonth.name
        });
      }
    });

    // 5. Duration & Frequency Trend
    const trendMap: Record<string, { count: number, totalMins: number }> = {};
    logsInTimeframe.forEach(l => {
      const mKey = format(new Date(l.date), "MMM yyyy");
      if (!trendMap[mKey]) trendMap[mKey] = { count: 0, totalMins: 0 };
      trendMap[mKey].count++;
      trendMap[mKey].totalMins += l.duration_minutes;
    });

    const frequencyTrend = Object.entries(trendMap).map(([month, v]) => ({
      month,
      sessions: v.count,
      avgDuration: Math.round(v.totalMins / v.count)
    })).sort((a,b) => {
      const parseDate = (mStr: string) => {
        const [m, y] = mStr.split(' ');
        return new Date(`${m} 1, ${y}`).getTime();
      };
      return parseDate(a.month) - parseDate(b.month);
    });

    // 6. Detailed Skills Table
    const skillsListTable = skillItems.map(skill => {
      const allLogs = skillLogs.filter(l => l.skill_id === skill.id);
      const totalSessions = allLogs.length;
      const totalHours = Math.round((allLogs.reduce((acc, l) => acc + l.duration_minutes, 0) / 60) * 10) / 10;
      const avgDuration = totalSessions > 0 ? Math.round(allLogs.reduce((acc, l) => acc + l.duration_minutes, 0) / totalSessions) : 0;
      
      const sortedAll = [...allLogs].sort((a, b) => b.date.localeCompare(a.date));
      const lastPracticed = sortedAll[0] ? format(new Date(sortedAll[0].date), "dd MMM yyyy") : "Never";

      let bestStreak = 0, cur = 0;
      const dates = [...new Set(allLogs.map(l => l.date))].sort();
      for (let i = 0; i < dates.length; i++) {
        if (i === 0 || differenceInDays(new Date(dates[i]), new Date(dates[i-1])) === 1) {
          cur++; bestStreak = Math.max(bestStreak, cur);
        } else { cur = 1; }
      }

      return {
        ...skill,
        totalSessions,
        totalHours,
        avgDuration,
        lastPracticed,
        bestStreak
      };
    }).sort((a, b) => b.totalHours - a.totalHours);

    return {
      focusVsLegacyData,
      consistencyHeatmap,
      progressionData,
      monthlyTargetData,
      frequencyTrend,
      skillsListTable
    };
  }, [skillItems, skillLogs, skillsTimeframe, selectedProgressSkill]);

  // ─── PETS COMPUTED DATA ──────────────────────────────────────
  const petTCO = petExpenses.filter((e: any) => e.type !== 'Income').reduce((sum: number, exp: any) => sum + (parseFloat(exp.amount) || 0), 0);

  const petUpcomingReminders = petLogs
    .filter((l: any) => l.next_due_date)
    .sort((a: any, b: any) => new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime());

  const petMonthlyExpenseData = useMemo(() => {
    const monthsMap: Record<string, any> = {};
    petExpenses.forEach((exp: any) => {
      const monthStr = format(new Date(exp.date), 'MMM yyyy');
      if (!monthsMap[monthStr]) monthsMap[monthStr] = { month: monthStr };
      const amount = parseFloat(exp.amount) || 0;
      const petName = petProfiles.find((p: any) => p.name === exp.subcategory)?.name || 'General';
      monthsMap[monthStr][petName] = (monthsMap[monthStr][petName] || 0) + amount;
    });
    return Object.values(monthsMap).sort((a: any, b: any) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [petExpenses, petProfiles]);

  const petGetDaysSince = (type: string) => {
    const typeLogs = petLogs.filter((l: any) => l.log_type === type);
    if (typeLogs.length === 0) return -1;
    typeLogs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return Math.floor((new Date().getTime() - new Date(typeLogs[0].date).getTime()) / (1000 * 60 * 60 * 24));
  };

  const petGroomingCadenceData = [
    { name: 'Bath', days: petGetDaysSince('Bath') },
    { name: 'Nails', days: petGetDaysSince('Nail Trim') },
    { name: 'Teeth', days: petGetDaysSince('Teeth Brushing') },
    { name: 'Haircut', days: petGetDaysSince('Haircut') },
  ].filter(d => d.days >= 0);

  const petMedicalCadenceData = [
    { name: 'Flea/Tick', days: petGetDaysSince('Flea/Tick Meds') },
    { name: 'Heartworm', days: petGetDaysSince('Heartworm Meds') },
    { name: 'Checkup', days: petGetDaysSince('Checkup') },
    { name: 'Deworming', days: petGetDaysSince('Deworming') },
  ].filter(d => d.days >= 0);

  const petActivityData = useMemo(() => {
    const acts = petLogs.filter((l: any) => l.category === 'Activities');
    const counts: Record<string, number> = {};
    acts.forEach((a: any) => { counts[a.log_type] = (counts[a.log_type] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [petLogs]);

  const petTrainingData = useMemo(() => {
    const trn = petLogs.filter((l: any) => l.category === 'Training');
    let sessions = 0; let incidents = 0;
    trn.forEach((t: any) => { if (t.log_type.includes('Incident')) incidents++; else sessions++; });
    return [{ name: 'Sessions', value: sessions }, { name: 'Incidents', value: incidents }].filter(d => d.value > 0);
  }, [petLogs]);

  const petExpenseBreakdown = useMemo(() => {
    const data: Record<string, Record<string, number>> = { 'General': {} };
    petProfiles.forEach((p: any) => { data[p.name] = {}; });
    petExpenses.forEach((exp: any) => {
      const amount = parseFloat(exp.amount) || 0;
      const petName = petProfiles.find((p: any) => p.name === exp.subcategory)?.name || 'General';
      if (data[petName]) {
        const particular = exp.particular || 'Other';
        data[petName][particular] = (data[petName][particular] || 0) + amount;
      }
    });
    const result: Record<string, any[]> = {};
    Object.keys(data).forEach(petName => {
      result[petName] = Object.entries(data[petName]).map(([name, value]) => ({ name, value })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
    });
    return result;
  }, [petExpenses, petProfiles]);

  if (loading) return <div className="min-h-screen bg-background flex flex-col justify-center"><LoadingScreen message="Assembling intelligence matrices..." /></div>;

  return (
    <div className="bg-background min-h-screen pb-20 p-4 md:p-6 font-dm-sans">
      <PageHeader title="Intelligence">
        <button onClick={fetchAll} className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-muted-foreground/60 hover:text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0">
          <RefreshCw className="w-4 h-4 md:w-[18px] md:h-[18px]" />
        </button>
      </PageHeader>

            <div className="-mt-2 mb-6">
        <SectionNav tabs={[
          { title: "ALL", icon: <LayoutPanelLeft size={16} />, isActive: activeTab === "ALL", onClick: () => router.push("/reports") },
          { title: "FINANCE", icon: <Wallet size={16} />, isActive: activeTab === "FINANCE", onClick: () => router.push("/reports/finance") },
          { title: "HABITS", icon: <Flame size={16} />, isActive: activeTab === "HABITS", onClick: () => router.push("/reports/habits") },
          { title: "WORKOUT", icon: <Zap size={16} />, isActive: activeTab === "WORKOUT", onClick: () => router.push("/reports/workout") },
          { title: "VEHICLES", icon: <Car size={16} />, isActive: activeTab === "VEHICLES", onClick: () => router.push("/reports/vehicles") },
          { title: "TASKS", icon: <ListTodo size={16} />, isActive: activeTab === "TASKS", onClick: () => router.push("/reports/tasks") },
          { title: "SKILLS", icon: <GraduationCap size={16} />, isActive: activeTab === "SKILLS", onClick: () => router.push("/reports/skills") },
          { title: "PETS", icon: <Dog size={16} />, isActive: activeTab === "PETS", onClick: () => router.push("/reports/pets") },
        ]} />
      </div>

      <div className="space-y-12 max-w-lg mx-auto">
        {/* ===================== SYSTEM ACTION CENTER ===================== */}
        {(() => {
          const filtered = alerts.filter(a => activeTab === "ALL" || a.section === activeTab);
          if (filtered.length === 0) return null;
          return (
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-widest">
                <AlertTriangle size={14} />
                <span>Action Center ({filtered.length} Warning{filtered.length > 1 ? 's' : ''})</span>
              </div>
              <div className="space-y-1.5 mt-2">
                {filtered.map((a, i) => (
                  <div key={a.id || i} className="flex items-start gap-2 text-xs font-bold text-foreground/80">
                    <span className="text-rose-500 mt-0.5">•</span>
                    <span className="flex-1 text-[11px] leading-tight">{a.text}</span>
                    <span className="text-[7px] font-black uppercase text-muted-foreground/50 bg-muted/40 px-1.5 py-0.5 rounded leading-none">{a.section}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ===================== FINANCE ===================== */}
        {(activeTab === "ALL" || activeTab === "FINANCE") && (
          <section className="space-y-6">
            <div className="flex items-center gap-4"><div className="h-px flex-1 bg-indigo-600/20" /><h3 className="text-[10px] font-black text-indigo-600 tracking-[5px] uppercase">Finance</h3><div className="h-px flex-1 bg-indigo-600/20" /></div>
            
            <SectionCard title="Net Worth Trend" icon={<TrendingUp size={18} />} headerRight={
              <Select value={isCustomRange ? "custom" : daysRange} onChange={(e) => { if (e.target.value === "custom") setIsCustomRange(true); else { setIsCustomRange(false); setDaysRange(parseInt(e.target.value)); } }} className="bg-muted/30 border-none text-[9px] font-black uppercase text-primary rounded px-2 py-1">
                {[7, 15, 30, 90, 180, 365].map(d => <option key={d} value={d}>{d === 180 ? "6 Months" : d === 365 ? "1 Year" : `${d} Days`}</option>)}
                <option value="custom">Custom</option>
              </Select>
            }>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <StatPill label="Net Worth" value={`₹${(netWorthParts.liq+netWorthParts.ast-netWorthParts.lib).toLocaleString()}`} color="text-emerald-500" className="px-3 py-2.5" />
                <StatPill label="Liquidity" value={`₹${netWorthParts.liq.toLocaleString()}`} color="text-primary" className="px-3 py-2.5" />
                <StatPill label="Assets" value={`₹${netWorthParts.ast.toLocaleString()}`} color="text-amber-500" className="px-3 py-2.5" />
                <StatPill label="Liabilities" value={`₹${netWorthParts.lib.toLocaleString()}`} color="text-rose-500" className="px-3 py-2.5" />
              </div>
              <ResponsiveContainer width="100%" height={220}><LineChart key={netWorthTrend.length} data={netWorthTrend}><CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.4}/><XAxis dataKey="date" tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false} interval={Math.ceil(netWorthTrend.length/5)}/><YAxis tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v/1000}k`} width={40}/><Tooltip content={<CustomTooltip/>}/><Line type="monotone" dataKey="networth" name="Net Worth" stroke="#10b981" strokeWidth={3} dot={false}/><Line type="monotone" dataKey="liquidity" name="Liquidity" stroke="var(--color-primary)" strokeWidth={2} dot={false}/><Line type="monotone" dataKey="assets" name="Assets" stroke="#f59e0b" strokeWidth={2} dot={false}/><Line type="monotone" dataKey="liabilities" name="Liabilities" stroke="#ef4444" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer>
            </SectionCard>

            <SectionCard title="Savings Rate Pulse" icon={<Flame size={18} />} headerRight={
              <Select value={isCustomSavingsRange ? "custom" : savingsRange} onChange={(e) => { if (e.target.value === "custom") setIsCustomSavingsRange(true); else { setIsCustomSavingsRange(false); setSavingsRange(parseInt(e.target.value)); } }} className="bg-muted/30 border-none text-[9px] font-black uppercase text-primary rounded px-2 py-1">
                {[30, 90, 180, 365].map(d => <option key={d} value={d}>{d === 30 ? "1 Month" : d === 90 ? "3 Months" : d === 180 ? "6 Months" : "1 Year"}</option>)}
                <option value="custom">Custom</option>
              </Select>
            }>
              <ResponsiveContainer width="100%" height={180}><AreaChart data={savingsRateData}><defs><linearGradient id="incG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient><linearGradient id="expG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.4}/><XAxis dataKey="name" tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v/1000}k`}/><Tooltip content={<CustomTooltip/>}/><Area type="monotone" dataKey="income" name="Income" stroke="#10b981" fill="url(#incG)" strokeWidth={2}/><Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" fill="url(#expG)" strokeWidth={2}/></AreaChart></ResponsiveContainer>
            </SectionCard>

            <SectionCard title="Budget Variance" icon={<Scale size={18} />} headerRight={
              <Select value={format(startOfMonth(budgetMonth), "yyyy-MM-dd")} onChange={(e) => setBudgetMonth(parseYearMonthDay(e.target.value))} className="bg-muted/30 border-none text-[9px] font-black uppercase text-primary rounded px-2 py-1">
                {Array.from({ length: 12 }).map((_, i) => { const d = subMonths(startOfMonth(new Date()), i); return <option key={i} value={format(d, "yyyy-MM-dd")}>{format(d, "MMM yyyy")}</option> })}
              </Select>
            }>
              <ResponsiveContainer width="100%" height={240}><BarChart data={budgetVariance}><CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.4}/><XAxis dataKey="name" tick={{fontSize:8, fontWeight:800}} axisLine={false} tickLine={false} /><YAxis tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v/1000}k`}/><Tooltip content={<CustomTooltip/>}/><Bar dataKey="planned" name="Planned" fill="var(--color-muted)" radius={[4,4,0,0]} barSize={15}/><Bar dataKey="actual" name="Actual" radius={[4,4,0,0]} barSize={15}>{budgetVariance.map((v, i) => <Cell key={i} fill={v.actual > v.planned ? "#ef4444" : "#10b981"}/>)}</Bar><Legend iconSize={8} wrapperStyle={{fontSize:9, fontWeight:900, paddingTop: 10}} /></BarChart></ResponsiveContainer>
            </SectionCard>

            <SectionCard title="Expense Categories" icon={<BarChart2 size={18} />} headerRight={
              <Select value={format(startOfMonth(expenseMonth), "yyyy-MM-dd")} onChange={(e) => setExpenseMonth(parseYearMonthDay(e.target.value))} className="bg-muted/30 border-none text-[9px] font-black uppercase text-primary rounded px-2 py-1">
                {Array.from({ length: 12 }).map((_, i) => { const d = subMonths(startOfMonth(new Date()), i); return <option key={i} value={format(d, "yyyy-MM-dd")}>{format(d, "MMM yyyy")}</option> })}
              </Select>
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
                  <Select 
                    value={format(startOfMonth(expenseMonth), "yyyy-MM-dd")} 
                    onChange={(e) => setExpenseMonth(parseYearMonthDay(e.target.value))} 
                    className="bg-muted/30 border-none text-[9px] font-black uppercase text-primary rounded px-2 py-1"
                  >
                    {Array.from({ length: 12 }).map((_, i) => { const d = subMonths(startOfMonth(new Date()), i); return <option key={i} value={format(d, "yyyy-MM-dd")}>{format(d, "MMM yyyy")}</option> })}
                  </Select>
                  <Select 
                    value={expenseSelectedCategory} 
                    onChange={(e) => setExpenseSelectedCategory(e.target.value)} 
                    className="bg-muted/30 border-none text-[9px] font-black uppercase text-primary rounded px-2 py-1"
                  >
                    <option value="All">All Categories</option>
                    {filterOptions.categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
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
                <Select value={trendFilters.category} onChange={(e)=>setTrendFilters(p=>({...p, category: e.target.value}))} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1 min-w-[70px]">
                  <option value="All">All Cats</option>
                  {filterOptions.categories.map(c=><option key={c} value={c}>{c}</option>)}
                </Select>
                <Select value={trendFilters.subcategory} onChange={(e)=>setTrendFilters(p=>({...p, subcategory: e.target.value}))} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1 min-w-[70px]">
                  <option value="All">All Subs</option>
                  {filterOptions.subcategories.map(c=><option key={c} value={c}>{c}</option>)}
                </Select>
                <Select value={trendFilters.place} onChange={(e)=>setTrendFilters(p=>({...p, place: e.target.value}))} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1 min-w-[70px]">
                  <option value="All">All Places</option>
                  {filterOptions.places.map(c=><option key={c} value={c}>{c}</option>)}
                </Select>
                <Select value={trendFilters.vendor} onChange={(e)=>setTrendFilters(p=>({...p, vendor: e.target.value}))} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1 min-w-[70px]">
                  <option value="All">All Vendors</option>
                  {filterOptions.vendors.map(c=><option key={c} value={c}>{c}</option>)}
                </Select>
                <Select value={trendFilters.particular} onChange={(e)=>setTrendFilters(p=>({...p, particular: e.target.value}))} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1 min-w-[70px]">
                  <option value="All">All Parts</option>
                  {filterOptions.particulars.map(c=><option key={c} value={c}>{c}</option>)}
                </Select>
                <Select value={isCustomTrendRange ? "custom" : trendDaysRange} onChange={(e) => { if (e.target.value === "custom") setIsCustomTrendRange(true); else { setIsCustomTrendRange(false); setTrendDaysRange(parseInt(e.target.value)); } }} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1">
                  {[7, 14, 30, 60, 90].map(d => <option key={d} value={d}>{d} Days</option>)}
                  <option value="custom">Custom</option>
                </Select>
              </div>
            }>
              <ResponsiveContainer width="100%" height={200}><AreaChart data={trendData}><defs><linearGradient id="trendG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.1}/><stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2}/><XAxis dataKey="date" tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v/1000}k`} width={35}/><Tooltip content={<CustomTooltip/>}/><Area type="monotone" dataKey="amount" name="Spent" stroke="var(--color-primary)" fill="url(#trendG)" strokeWidth={3}/><Legend verticalAlign="top" align="right" iconSize={8} wrapperStyle={{fontSize:9, fontWeight:900, top: -10}} /></AreaChart></ResponsiveContainer>
            </SectionCard>

            <SectionCard title="Assets Performance" icon={<PackageCheck size={18} />}><ResponsiveContainer width="100%" height={160}><BarChart data={assets}><XAxis dataKey="name" tick={{fontSize:7, fontWeight:800}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:8}} width={35} tickFormatter={v=>`₹${v/1000}k`}/><Tooltip content={<CustomTooltip/>}/><Bar dataKey="bought" name="Purchase" fill="var(--color-muted)" radius={[4,4,0,0]}/><Bar dataKey="current" name="Current" fill="#10b981" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></SectionCard>
            <SectionCard title="Liabilities" icon={<TrendingUp size={18} />}><ResponsiveContainer width="100%" height={Math.max(80, liabilities.length * 30)}><BarChart data={liabilities} layout="vertical"><XAxis type="number" hide/><YAxis dataKey="name" type="category" tick={{fontSize:8, fontWeight:700}} width={80} axisLine={false}/><Tooltip content={<CustomTooltip/>}/><Bar dataKey="value" name="Remaining" fill="#ef4444" radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></SectionCard>

            {/* Committed vs Discretionary (f1) */}
            <SectionCard title="Committed vs. Discretionary Spend" icon={<Scale size={18} />}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <StatPill label="Committed (Fixed)" value={`₹${(committedVsDiscretionary[0]?.value || 0).toLocaleString()}`} color="text-primary" />
                <StatPill label="Discretionary" value={`₹${(committedVsDiscretionary[1]?.value || 0).toLocaleString()}`} color="text-amber-500" />
              </div>
              <div className="h-6 w-full bg-muted rounded-full overflow-hidden flex font-black text-[9px] text-white">
                {committedVsDiscretionary.map((c, i) => {
                  const total = committedVsDiscretionary.reduce((s, x) => s + x.value, 0) || 1;
                  const pct = (c.value / total) * 100;
                  if (pct === 0) return null;
                  return (
                    <div 
                      key={i} 
                      className={`h-full flex items-center justify-center transition-all ${i === 0 ? 'bg-primary' : 'bg-amber-500'}`}
                      style={{ width: `${pct}%` }}
                    >
                      {Math.round(pct)}%
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            {/* Emergency Fund Runway (f2) */}
            <SectionCard title="Emergency Fund Runway" icon={<ShieldAlert size={18} />}>
              <div className="flex flex-col items-center justify-center p-6 bg-muted/20 border border-border/30 rounded-2xl gap-3">
                <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Calculated Survival Time</span>
                <span className={`text-4xl font-black ${emergencyFundRunway >= 6 ? 'text-emerald-500' : emergencyFundRunway >= 3 ? 'text-amber-500' : 'text-rose-500'}`}>
                  {emergencyFundRunway.toFixed(1)} Months
                </span>
                <span className="text-[10px] text-center text-muted-foreground/50 font-bold max-w-[280px]">
                  Based on current liquid cash reserves (₹{netWorthParts.liq.toLocaleString()}) vs. average monthly spending over the last 90 days.
                </span>
              </div>
            </SectionCard>

            {/* Interactive Debt Payoff Timeline Simulator (f3) */}
            <SectionCard title="Debt Payoff Timeline Simulator" icon={<TrendingUp size={18} />}>
              <div className="space-y-4">
                {liabilities.map((l) => {
                  const input = debtTimelineInputs[l.name] || { amount: Math.round(l.value / 12) || 1000, frequency: 1 };
                  const payoffCalc = debtPayoffCalculations[l.name] || { monthsToPay: 12, timelinePoints: [] };
                  
                  return (
                    <div key={l.name} className="p-4 bg-muted/20 border border-border/30 rounded-2xl flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-foreground">{l.name}</span>
                        <span className="text-xs font-black text-rose-500">₹{l.value.toLocaleString()} remaining</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">Payment (₹)</label>
                          <input 
                            type="number"
                            value={input.amount}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 0);
                              setDebtTimelineInputs(prev => ({ ...prev, [l.name]: { ...prev[l.name], amount: val } }));
                            }}
                            className="bg-background border border-border/40 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary w-full"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">Frequency</label>
                          <Select
                            value={input.frequency}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              setDebtTimelineInputs(prev => ({ ...prev, [l.name]: { ...prev[l.name], frequency: val } }));
                            }}
                            className="bg-background border border-border/40 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary w-full"
                          >
                            <option value={1}>Every Month</option>
                            <option value={2}>Every 2 Months</option>
                            <option value={3}>Every 3 Months</option>
                            <option value={4}>Every 4 Months</option>
                            <option value={5}>Every 5 Months</option>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-border/20 pt-2 mt-1">
                        <span className="text-[9px] font-bold text-muted-foreground/60">Payoff Duration</span>
                        <span className="text-xs font-black text-emerald-500">
                          {payoffCalc.monthsToPay} Months ({Math.round(payoffCalc.monthsToPay / 12 * 10) / 10} Years)
                        </span>
                      </div>
                      
                      {payoffCalc.timelinePoints && payoffCalc.timelinePoints.length > 0 && (
                        <div className="h-16 w-full mt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={payoffCalc.timelinePoints}>
                              <Area type="monotone" dataKey="remaining" stroke="#ef4444" fill="#ef4444" fillOpacity={0.05} strokeWidth={2} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </section>
        )}

        {/* ===================== HABITS ===================== */}
        {(activeTab === "ALL" || activeTab === "HABITS") && (
          <section className="space-y-6">
            <div className="flex items-center gap-4"><div className="h-px flex-1 bg-emerald-600/20" /><h3 className="text-[10px] font-black text-emerald-600 tracking-[5px] uppercase">Habits</h3><div className="h-px flex-1 bg-emerald-600/20" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionCard title="Radar" icon={<Zap size={16} />} headerRight={
                <Select value={format(startOfMonth(radarMonth), "yyyy-MM-dd")} onChange={(e) => setRadarMonth(parseYearMonthDay(e.target.value))} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1">
                  {Array.from({ length: 12 }).map((_, i) => { const d = subMonths(startOfMonth(new Date()), i); return <option key={i} value={format(d, "yyyy-MM-dd")}>{format(d, "MMM yyyy")}</option> })}
                </Select>
              }>
                <ResponsiveContainer width="100%" height={180}>
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={habitRadarData}>
                    <PolarGrid/>
                    <PolarAngleAxis dataKey="subject" tick={{fontSize:7, fontWeight:800}}/>
                    <Radar dataKey="A" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.4}/>
                  </RadarChart>
                </ResponsiveContainer>
              </SectionCard>
              
              <SectionCard title="Breakdown" icon={<BarChart2 size={16} />} headerRight={
                <Select value={format(startOfMonth(breakdownMonth), "yyyy-MM-dd")} onChange={(e) => setBreakdownMonth(parseYearMonthDay(e.target.value))} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1">
                  {Array.from({ length: 12 }).map((_, i) => { const d = subMonths(startOfMonth(new Date()), i); return <option key={i} value={format(d, "yyyy-MM-dd")}>{format(d, "MMM yyyy")}</option> })}
                </Select>
              }>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={habitBreakdown} layout="vertical">
                    <XAxis type="number" hide/>
                    <YAxis dataKey="name" type="category" tick={{fontSize:7, fontWeight:700}} width={60}/>
                    <Bar dataKey="success" stackId="a" fill="#10b981"/>
                    <Bar dataKey="fail" stackId="a" fill="#ef4444"/>
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>
            </div>
            <SectionCard title="Consistency Calendar" icon={<CalendarDays size={18} />} headerRight={
              <div className="flex items-center gap-2">
                <Select value={format(startOfMonth(calendarMonth), "yyyy-MM-dd")} onChange={(e) => setCalendarMonth(parseYearMonthDay(e.target.value))} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1">
                  {Array.from({ length: 12 }).map((_, i) => { const d = subMonths(startOfMonth(new Date()), i); return <option key={i} value={format(d, "yyyy-MM-dd")}>{format(d, "MMM yyyy")}</option> })}
                </Select>
                <Select value={selectedCalendarHabit} onChange={(e)=>setSelectedCalendarHabit(e.target.value)} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1 max-w-[80px]">
                  <option value="All Habits">All Habits</option>
                  {habitConfigs.map(c=><option key={c.habit_name} value={c.habit_name}>{c.habit_name}</option>)}
                </Select>
              </div>
            }>
              <div className="grid grid-cols-7 gap-1.5 mb-2">{["S","M","T","W","T","F","S"].map((d,i)=><div key={i} className="text-[8px] font-black text-muted-foreground/30 text-center">{d}</div>)}</div>
              <div className="grid grid-cols-7 gap-1.5">{eachDayOfInterval({start: startOfWeek(startOfMonth(calendarMonth)), end: endOfWeek(endOfMonth(calendarMonth))}).map((day, i) => { const status = getDayStatus(day); const isCur = format(day, 'MM') === format(calendarMonth, 'MM'); return <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-[9px] font-black text-white ${isCur ? STATUS_COLORS[status] : 'opacity-5'} ${isCur && status === 'Critical' ? 'animate-pulse bg-red-600' : ''}`}>{format(day, 'd')}</div> })}</div>
              
              {/* Calendar Legend */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[8px] font-black uppercase tracking-wider text-muted-foreground border-t border-border/20 pt-3">
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500"/> Success</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500"/> Tolerance</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500"/> Failure</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-orange-600 animate-pulse"/> Critical</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-muted/40"/> Not Entered</div>
              </div>
            </SectionCard>

            <SectionCard title="Multi-Habit Matrix Calendar" icon={<Grid3X3 size={18} />} headerRight={
              <Select value={format(startOfMonth(matrixCalendarMonth), "yyyy-MM-dd")} onChange={(e) => setMatrixCalendarMonth(parseYearMonthDay(e.target.value))} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1">
                {Array.from({ length: 12 }).map((_, i) => { const d = subMonths(startOfMonth(new Date()), i); return <option key={i} value={format(d, "yyyy-MM-dd")}>{format(d, "MMM yyyy")}</option> })}
              </Select>
            }>
              <div className="grid grid-cols-7 gap-1.5 mb-2">
                {["S","M","T","W","T","F","S"].map((d,i)=>(
                  <div key={i} className="text-[8px] font-black text-muted-foreground/30 text-center">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {eachDayOfInterval({
                  start: startOfWeek(startOfMonth(matrixCalendarMonth)), 
                  end: endOfWeek(endOfMonth(matrixCalendarMonth))
                }).map((day, i) => {
                  const isCur = format(day, 'MM') === format(matrixCalendarMonth, 'MM');
                  const dailyConfigs = habitConfigs;
                  const cols = dailyConfigs.length <= 4 ? 2 : dailyConfigs.length <= 9 ? 3 : 4;
                  
                  return (
                    <div 
                      key={i} 
                      className={`relative aspect-square rounded-lg overflow-hidden border border-border/10 bg-muted/5 flex items-center justify-center ${!isCur ? 'opacity-10 pointer-events-none' : ''}`}
                    >
                      {isCur && (
                        <div 
                          className="absolute inset-0 grid gap-[1px] p-[1.5px]"
                          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                        >
                          {dailyConfigs.map((cfg) => {
                            const dStr = format(day, "yyyy-MM-dd");
                            const log = allHabitData.find(h => h.date === dStr && h.habit === cfg.habit_name);
                            const hStatus = log?.status || "Not Entered";
                            const colorClass = STATUS_COLORS[hStatus];
                            const flashClass = hStatus === 'Critical' ? 'animate-pulse bg-red-600' : colorClass;
                            
                            return (
                              <div 
                                key={cfg.habit_name} 
                                className={`w-full h-full rounded-[1px] transition-all ${flashClass} border border-border/40`}
                                title={`${cfg.habit_name}: ${hStatus}`}
                              />
                            );
                          })}
                        </div>
                      )}
                      <span className="absolute text-[8px] font-black text-foreground pointer-events-none drop-shadow-md">
                        {format(day, 'd')}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              {/* Habits Guide List for Matrix Grid */}
              <div className="mt-4 border-t border-border/20 pt-3">
                <span className="text-[7px] font-black uppercase tracking-wider text-muted-foreground/60 block mb-2 text-center">
                  Habits Order in Day Grid (Left-to-Right, Top-to-Bottom)
                </span>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {habitConfigs.map((cfg, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-muted/20 border border-border/40 px-2 py-0.5 rounded-full text-[8px] font-black text-foreground">
                      <span>{cfg.emoji || '🔥'}</span>
                      <span className="max-w-[80px] truncate">{cfg.habit_name}</span>
                    </div>
                  ))}
                </div>
                <div className="hidden grid-cols-2 grid-cols-3 grid-cols-4" />
              </div>
            </SectionCard>

            <SectionCard title="Individual Habits Calendars" icon={<CalendarDays size={18} />} headerRight={
              <Select value={format(startOfMonth(individualCalendarMonth), "yyyy-MM-dd")} onChange={(e) => setIndividualCalendarMonth(parseYearMonthDay(e.target.value))} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1">
                {Array.from({ length: 12 }).map((_, i) => { const d = subMonths(startOfMonth(new Date()), i); return <option key={i} value={format(d, "yyyy-MM-dd")}>{format(d, "MMM yyyy")}</option> })}
              </Select>
            }>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {habitConfigs.map((cfg) => {
                  const days = eachDayOfInterval({
                    start: startOfWeek(startOfMonth(individualCalendarMonth)),
                    end: endOfWeek(endOfMonth(individualCalendarMonth))
                  });

                  return (
                    <div key={cfg.habit_name} className="border border-border/10 rounded-xl p-4 bg-muted/5 flex flex-col justify-between">
                      <div className="flex items-center gap-1.5 mb-3 border-b border-border/15 pb-2">
                        <span className="text-sm">{cfg.emoji || '🔥'}</span>
                        <span className="text-[11px] font-black text-foreground truncate">{cfg.habit_name}</span>
                      </div>

                      <div className="grid grid-cols-7 gap-1 mb-1.5">
                        {["S","M","T","W","T","F","S"].map((d,i)=>(
                          <div key={i} className="text-[7px] font-black text-muted-foreground/35 text-center">{d}</div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {days.map((day, idx) => {
                          const isCur = format(day, 'MM') === format(individualCalendarMonth, 'MM');
                          const dStr = format(day, "yyyy-MM-dd");
                          const log = allHabitData.find(h => h.date === dStr && h.habit === cfg.habit_name);
                          
                          let hStatus = log?.status || "Not Entered";
                          if (hStatus === "Not Entered" && cfg.unlogged_is_success && isCur) {
                            hStatus = "Success";
                          }

                          const colorClass = STATUS_COLORS[hStatus] || "bg-muted/40";
                          const cellClass = isCur 
                            ? (hStatus === 'Critical' ? 'bg-red-600 animate-pulse' : colorClass)
                            : 'opacity-5 bg-muted/40';

                          return (
                            <div 
                              key={idx} 
                              className={`aspect-square rounded-[3px] flex items-center justify-center text-[7px] font-black text-primary-foreground/80 ${cellClass}`}
                              title={`${cfg.habit_name} (${dStr}): ${hStatus}`}
                            >
                              {isCur && format(day, 'd')}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard title="Success Trend" icon={<Activity size={18} />} headerRight={
              <Select value={isCustomHabitTrendRange ? "custom" : habitTrendDaysRange} onChange={(e) => { if (e.target.value === "custom") setIsCustomHabitTrendRange(true); else { setIsCustomHabitTrendRange(false); setHabitTrendDaysRange(parseInt(e.target.value)); } }} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1">
                {[7, 14, 30, 60, 90].map(d => <option key={d} value={d}>{d} Days</option>)}
                <option value="custom">Custom</option>
              </Select>
            }>
              <ResponsiveContainer width="100%" height={220}><LineChart data={habitScores}><CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2}/><XAxis dataKey="date" tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false} interval={Math.ceil(habitScores.length/7)}/><YAxis tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false} width={30}/><Tooltip content={<CustomTooltip/>}/><Legend iconSize={8} wrapperStyle={{fontSize:9, fontWeight:900, paddingTop: 10}} /><Line type="monotone" dataKey="Success" stroke="#10b981" strokeWidth={3} dot={false}/><Line type="monotone" dataKey="Failure" stroke="#f43f5e" strokeWidth={2} dot={false}/><Line type="monotone" dataKey="Critical" stroke="#ea580c" strokeWidth={2} dot={false}/><Line type="monotone" dataKey="Tolerance" stroke="#f59e0b" strokeWidth={2} dot={false}/><Line type="monotone" dataKey="Not Entered" stroke="#64748b" strokeWidth={2} strokeDasharray="4 4" dot={false}/></LineChart></ResponsiveContainer>
            </SectionCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionCard title="Habit Gravity" icon={<Weight size={18} />}>
                <div className="space-y-3">
                  {habitGravityData.length === 0 ? (
                    <div className="text-center py-6 px-3 text-[10px] text-muted-foreground/60 font-black uppercase tracking-wider bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                      ✨ Escape Velocity: 0% failure rate detected across all habits in the last 60 days. You have overcome habit gravity!
                    </div>
                  ) : (
                    habitGravityData.map((g, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-rose-500/5 rounded-xl border border-rose-500/10">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-foreground">{g.name}</span>
                          <span className="text-[8px] font-bold text-rose-500 uppercase tracking-widest">{g.rate}% Failure</span>
                        </div>
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500" style={{ width: `${g.rate}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>
              <SectionCard title="Yearly Heatmap" icon={<Grid3X3 size={18} />}>
                <div className="flex flex-wrap gap-[3px] overflow-hidden">{habitHeatmapData.map((d, i) => { let color = "bg-muted/10"; if (d.score > 0.1) color = "bg-emerald-500/20"; if (d.score > 0.4) color = "bg-emerald-500/40"; if (d.score > 0.7) color = "bg-emerald-500/70"; if (d.score > 0.9) color = "bg-emerald-500"; return <div key={i} className={`w-[7px] h-[7px] rounded-[1px] ${color} transition-colors hover:scale-125 cursor-help`} title={`${format(new Date(d.date), "dd MMM yyyy")}: ${Math.round(d.score * 100)}%`} />; })}</div>
              </SectionCard>
            </div>

            {/* Streak & Consistency Records (h1) */}
            <SectionCard title="Streaks & Consistency Records" icon={<Zap size={18} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {habitConfigs.map(c => {
                  const str = habitStreaks[c.habit_name] || { current: 0, max: 0, success: 0, failure: 0, tolerance: 0, critical: 0, consistency: 0, recoveries: 0 };
                  return (
                    <div key={c.habit_name} className="bg-muted/20 border border-border/30 rounded-xl p-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-sm">{c.emoji || '🔥'}</span>
                          <span className="text-xs font-black text-foreground truncate">{c.habit_name}</span>
                        </div>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase ${ str.consistency >= 80 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : str.consistency >= 50 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20' }`}>
                          {str.consistency}% Consist.
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[9px] font-bold text-muted-foreground border-y border-border/15 py-2">
                        <div className="flex items-center justify-between">
                          <span>Current Streak:</span>
                          <strong className="text-primary font-black">{str.current}d</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Max Streak:</span>
                          <strong className="text-amber-500 font-black">{str.max}d</strong>
                        </div>
                        <div className="flex items-center justify-between col-span-2">
                          <span>Recoveries Bounce-back:</span>
                          <strong className="text-emerald-500 font-black">{str.recoveries} times</strong>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1 text-[8px] font-black tracking-wider uppercase text-muted-foreground/80 pt-0.5">
                        <div className="flex items-center gap-1" title="Success">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>
                          <span>S: {str.success}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Tolerance">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"/>
                          <span>T: {str.tolerance}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Failure">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"/>
                          <span>F: {str.failure}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Critical">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"/>
                          <span>C: {str.critical}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            {/* "Never Miss Twice" Audit (h2) */}
            {neverMissTwice && (
              <SectionCard title="Never Miss Twice Audit" icon={<Scale size={18} />}>
                <div className="flex flex-col items-center justify-center p-6 bg-muted/20 border border-border/30 rounded-2xl gap-3">
                  <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Recovery Success Rate</span>
                  <span className={`text-4xl font-black ${neverMissTwice.rate >= 80 ? 'text-emerald-500' : neverMissTwice.rate >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {neverMissTwice.rate}%
                  </span>
                  <span className="text-[10px] text-center text-muted-foreground/50 font-bold max-w-[280px]">
                    Recovered {neverMissTwice.successfulRecoveries} out of {neverMissTwice.totalMisses} times you missed a habit configuration.
                  </span>
                </div>
              </SectionCard>
            )}

            {/* Habit Correlation Matrix (h3) */}
            {habitCorrelations.length > 0 && (
              <SectionCard title="Habit Correlations Matrix" icon={<Activity size={18} />}>
                <div className="space-y-3">
                  {habitCorrelations.map((c, i) => (
                    <div key={i} className="p-3 bg-muted/20 border border-border/30 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="text-xs font-black text-foreground">
                          {c.habitA} ➔ {c.habitB}
                        </div>
                        <div className="text-[9px] font-bold text-muted-foreground/60 leading-none">
                          If {c.habitA} succeeds, {c.habitB} succeeds {c.prob}% of the time. (Base: {c.baseProb}%)
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                        +{c.lift}% Lift
                      </span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </section>
        )}

        {/* ===================== WORKOUT ===================== */}
        {(activeTab === "ALL" || activeTab === "WORKOUT") && (
          <section className="space-y-6">
            <div className="flex items-center gap-4"><div className="h-px flex-1 bg-orange-600/20" /><h3 className="text-[10px] font-black text-orange-600 tracking-[5px] uppercase">Workout</h3><div className="h-px flex-1 bg-orange-600/20" /></div>
            <SectionCard 
              title="Volume Trend" 
              icon={<Flame size={18} />}
              headerRight={
                <Select 
                  value={workoutVolumeTrendRange} 
                  onChange={(e) => setWorkoutVolumeTrendRange(parseInt(e.target.value))} 
                  className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1"
                >
                  <option value={7}>7 Days</option>
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days</option>
                  <option value={45}>45 Days</option>
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days</option>
                  <option value={180}>6 Months</option>
                  <option value={365}>1 Year</option>
                </Select>
              }
            >
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={workoutVolumeTrend}>
                  <defs>
                    <linearGradient id="vG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{fontSize:8}}/>
                  <YAxis hide/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Area type="monotone" dataKey="volume" name="Total kg" stroke="#f59e0b" fill="url(#vG)" strokeWidth={3}/>
                </AreaChart>
              </ResponsiveContainer>
            </SectionCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionCard 
                title="Body Distribution" 
                icon={<Zap size={18} />}
                headerRight={
                  <Select 
                    value={workoutBodyDistRange} 
                    onChange={(e) => setWorkoutBodyDistRange(parseInt(e.target.value))} 
                    className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1"
                  >
                    <option value={7}>7 Days</option>
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                    <option value={45}>45 Days</option>
                    <option value={60}>60 Days</option>
                    <option value={90}>90 Days</option>
                    <option value={180}>6 Months</option>
                    <option value={365}>1 Year</option>
                  </Select>
                }
              >
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={workoutBodyDist} dataKey="value" innerRadius={60} outerRadius={80} paddingAngle={2}>
                      {workoutBodyDist.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    </Pie>
                    <Tooltip/>
                  </PieChart>
                </ResponsiveContainer>
              </SectionCard>
              <SectionCard title="Recovery Monitor" icon={<Flame size={18} />}><div className="space-y-3">{workoutFreshness.map((f, i) => ( <div key={i} className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border/30"><div className="flex flex-col"><span className="text-[10px] font-black text-foreground">{f.name}</span><span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Last: {f.days}d ago</span></div><span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${f.status === 'Recovering' ? 'bg-amber-500/20 text-amber-500' : f.status === 'Optimal' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-blue-500/20 text-blue-500'}`}>{f.status}</span></div> ))}</div></SectionCard>
            </div>
            <SectionCard 
              title="Volume vs Intensity" 
              icon={<Activity size={18} />}
              headerRight={
                <Select 
                  value={workoutIntensityRange} 
                  onChange={(e) => setWorkoutIntensityRange(parseInt(e.target.value))} 
                  className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1"
                >
                  <option value={7}>7 Days</option>
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days</option>
                  <option value={45}>45 Days</option>
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days</option>
                  <option value={180}>6 Months</option>
                  <option value={365}>1 Year</option>
                </Select>
              }
            >
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={workoutIntensityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1}/>
                  <XAxis dataKey="date" tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}kg`}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Area type="monotone" dataKey="intensity" name="Avg Weight" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.1} strokeWidth={3}/>
                </AreaChart>
              </ResponsiveContainer>
            </SectionCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionCard 
                title="Exercise Bias" 
                icon={<TrendingUp size={18} />}
                headerRight={
                  <Select 
                    value={workoutBiasRange} 
                    onChange={(e) => setWorkoutBiasRange(parseInt(e.target.value))} 
                    className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1"
                  >
                    <option value={7}>7 Days</option>
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                    <option value={45}>45 Days</option>
                    <option value={60}>60 Days</option>
                    <option value={90}>90 Days</option>
                    <option value={180}>6 Months</option>
                    <option value={365}>1 Year</option>
                  </Select>
                }
              >
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={workoutBiasData} layout="vertical">
                    <XAxis type="number" hide/>
                    <YAxis dataKey="name" type="category" tick={{fontSize:7, fontWeight:800}} width={80} axisLine={false}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Bar dataKey="value" fill="var(--color-primary)" radius={[0,4,4,0]} barSize={12}/>
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>
              <SectionCard title="Workout Heatmap" icon={<Grid3X3 size={18} />}><div className="flex flex-wrap gap-[3px] overflow-hidden">{workoutHeatmapData.map((d, i) => ( <div key={i} className={`w-[7px] h-[7px] rounded-[1px] ${d.active ? "bg-primary" : "bg-muted/10"} transition-colors hover:scale-125 cursor-help`} title={`${d.date}: ${d.active ? "Trained" : "Rest"}`} /> ))}</div></SectionCard>
            </div>
            <SectionCard title="Monthly Consistency" icon={<CalendarDays size={18} />} headerRight={
              <div className="flex items-center gap-2">
                <Select value={selectedWorkoutDay} onChange={(e) => setSelectedWorkoutDay(e.target.value)} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1 max-w-[80px]">
                  <option value="All">All Days</option>
                  {Array.from(new Set(workoutBodyDist.map(b => b.name).filter(Boolean) as string[])).map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
                <Select value={format(startOfMonth(workoutCalendarMonth), "yyyy-MM-dd")} onChange={(e) => setWorkoutCalendarMonth(parseYearMonthDay(e.target.value))} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1">
                  {Array.from({ length: 12 }).map((_, i) => { const d = subMonths(startOfMonth(new Date()), i); return <option key={i} value={format(d, "yyyy-MM-dd")}>{format(d, "MMM yyyy")}</option> })}
                </Select>
              </div>
            }>
              <div className="grid grid-cols-7 gap-1.5 mb-2">{["S","M","T","W","T","F","S"].map((d,i)=><div key={i} className="text-[8px] font-black text-muted-foreground/30 text-center">{d}</div>)}</div>
              <div className="grid grid-cols-7 gap-1.5">{eachDayOfInterval({start: startOfWeek(startOfMonth(workoutCalendarMonth)), end: endOfWeek(endOfMonth(workoutCalendarMonth))}).map((day, i) => { const dStr = format(day, 'yyyy-MM-dd'); const dayLogs = (workoutData || []).filter(w => w.date === dStr); const isActive = dayLogs.length > 0 && (selectedWorkoutDay === "All" || dayLogs.some(w => (w.body_part || w.workout_day) === selectedWorkoutDay)); const isCur = format(day, 'MM') === format(workoutCalendarMonth, 'MM'); return <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-[9px] font-black ${isCur ? (isActive ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground/40') : 'opacity-5'}`}>{format(day, 'd')}</div> })}</div>
            </SectionCard>
            <SectionCard title="Routine Calendar" icon={<CalendarDays size={18} />} headerRight={
              <Select value={format(startOfMonth(routineCalendarMonth), "yyyy-MM-dd")} onChange={(e) => setRoutineCalendarMonth(parseYearMonthDay(e.target.value))} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1">
                {Array.from({ length: 12 }).map((_, i) => { const d = subMonths(startOfMonth(new Date()), i); return <option key={i} value={format(d, "yyyy-MM-dd")}>{format(d, "MMM yyyy")}</option> })}
              </Select>
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

              {/* Routine Calendar Legend */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[8px] font-black uppercase tracking-wider text-muted-foreground border-t border-border/20 pt-3">
                {Array.from(new Set(workoutData.map(w => w.body_part || w.workout_day).filter(Boolean) as string[])).map((routine, idx) => {
                  const rColor = COLORS[idx % COLORS.length];
                  return (
                    <div key={routine} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded" style={{ backgroundColor: rColor }} />
                      <span>{routine}</span>
                    </div>
                  );
                })}
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-muted/40" />
                  <span>Rest Day</span>
                </div>
              </div>
            </SectionCard>

            {/* 1RM progression curve (w1) */}
            {exerciseList.length > 0 && (
              <SectionCard 
                title="Estimated 1-Rep Max Progression" 
                icon={<TrendingUp size={18} />}
                headerRight={
                  <div className="flex items-center gap-2">
                    <Select 
                      value={selectedExercise1RM} 
                      onChange={(e) => setSelectedExercise1RM(e.target.value)} 
                      className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1 max-w-[100px]"
                    >
                      {exerciseList.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                    </Select>
                    <Select 
                      value={workout1RMRange} 
                      onChange={(e) => setWorkout1RMRange(parseInt(e.target.value))} 
                      className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1"
                    >
                      <option value={7}>7 Days</option>
                      <option value={14}>14 Days</option>
                      <option value={30}>30 Days</option>
                      <option value={45}>45 Days</option>
                      <option value={60}>60 Days</option>
                      <option value={90}>90 Days</option>
                      <option value={180}>6 Months</option>
                      <option value={365}>1 Year</option>
                    </Select>
                  </div>
                }
              >
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={get1RMTrendData(selectedExercise1RM)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                      <XAxis dataKey="date" tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize:8, fontWeight:700}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}kg`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="oneRepMax" name="1RM (kg)" stroke="var(--color-primary)" strokeWidth={3} dot={{r:3}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            )}

            {/* Muscle Balance Ratio (w2) */}
            {muscleBalanceData.length > 0 && (
              <SectionCard 
                title="Muscle Balance (Push vs. Pull Sets)" 
                icon={<Scale size={18} />}
                headerRight={
                  <Select 
                    value={muscleBalanceRange} 
                    onChange={(e) => setMuscleBalanceRange(parseInt(e.target.value))} 
                    className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1"
                  >
                    <option value={7}>7 Days</option>
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                    <option value={45}>45 Days</option>
                    <option value={60}>60 Days</option>
                    <option value={90}>90 Days</option>
                    <option value={180}>6 Months</option>
                    <option value={365}>1 Year</option>
                  </Select>
                }
              >
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <StatPill label="Push" value={String(muscleBalanceData.find(m => m.name === 'Push')?.value || 0)} color="text-primary" />
                  <StatPill label="Pull" value={String(muscleBalanceData.find(m => m.name === 'Pull')?.value || 0)} color="text-amber-500" />
                  <StatPill label="Legs" value={String(muscleBalanceData.find(m => m.name === 'Legs')?.value || 0)} color="text-emerald-500" />
                  <StatPill label="Other" value={String(muscleBalanceData.find(m => m.name === 'Core/Other')?.value || 0)} color="text-muted-foreground" />
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={muscleBalanceData} dataKey="value" innerRadius={50} outerRadius={70} paddingAngle={2}>
                      {muscleBalanceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend iconSize={8} wrapperStyle={{fontSize:9, fontWeight:900, paddingTop: 10}} />
                  </PieChart>
                </ResponsiveContainer>
              </SectionCard>
            )}

            {/* Lift Plateau Indicator (w3) */}
            <SectionCard title="Lift Plateau Indicator" icon={<ShieldAlert size={18} />}>
              {workoutPlateaus.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground font-bold">
                  All lifts are progressing optimally! No plateaus detected.
                </div>
              ) : (
                <div className="space-y-3">
                  {workoutPlateaus.map((p, i) => (
                    <div key={i} className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-foreground">{p.exercise}</span>
                        <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">Plateau Warning</span>
                      </div>
                      <span className="text-[9px] font-bold text-muted-foreground/60 leading-tight">
                        Current Max: {p.currentMax}kg. Maximum weight has not increased in the last 4 consecutive sessions.
                      </span>
                      <span className="text-[9px] font-black text-primary mt-1">
                        💡 Suggestion: Try reducing the weight by 10% and doing more reps, or swapping for a variation (e.g. Incline Bench instead of Flat Bench).
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Strength & Volume Matrix" icon={<Dumbbell size={18} />} headerRight={
              <Select
                value={selectedStrengthTimeframe}
                onChange={(e) => setSelectedStrengthTimeframe(e.target.value)}
                className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1"
              >
                <option value="7">7 Days</option>
                <option value="15">15 Days</option>
                <option value="30">30 Days</option>
                <option value="45">45 Days</option>
                <option value="60">60 Days</option>
                <option value="90">90 Days</option>
                <option value="180">6 Months</option>
                <option value="365">1 Year</option>
                <option value="all">Overall</option>
              </Select>
            }>
              <div className="space-y-4">
                {/* Custom Multi-select Dropdown & Search Filter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Multi-Select Exercises Dropdown */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsExerciseDropdownOpen(!isExerciseDropdownOpen)}
                      className="w-full h-9 bg-muted border-none rounded-lg px-3 text-[10px] font-black uppercase tracking-wider text-primary flex items-center justify-between shadow-inner"
                    >
                      <span>
                        {selectedMatrixExercises.length === 0 
                          ? "Select Workouts" 
                          : `${selectedMatrixExercises.length} Workouts Selected`}
                      </span>
                      <ChevronDown size={14} className={`transition-transform ${isExerciseDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    
                    {isExerciseDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-20" 
                          onClick={() => setIsExerciseDropdownOpen(false)}
                        />
                        <div className="absolute top-10 left-0 right-0 max-h-48 overflow-y-auto bg-card border border-border/40 rounded-xl shadow-lg z-30 p-2 space-y-1">
                          {exerciseList.map((ex) => {
                            const isSelected = selectedMatrixExercises.includes(ex);
                            return (
                              <label key={ex} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted cursor-pointer text-xs font-bold transition-colors">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    if (isSelected) {
                                      if (selectedMatrixExercises.length > 1) {
                                        setSelectedMatrixExercises(selectedMatrixExercises.filter(item => item !== ex));
                                      }
                                    } else {
                                      setSelectedMatrixExercises([...selectedMatrixExercises, ex]);
                                    }
                                  }}
                                  className="rounded border-border/60 text-primary focus:ring-primary/20 w-4 h-4"
                                />
                                <span className="text-foreground">{ex}</span>
                              </label>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Filter workouts..."
                    value={strengthSearchQuery}
                    onChange={(e) => setStrengthSearchQuery(e.target.value)}
                    className="w-full h-9 bg-muted border-none rounded-lg px-3 text-xs font-bold text-foreground placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-accent/20"
                  />
                </div>

                {/* Cards rendering */}
                {strengthMatrixData.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground font-bold bg-muted/10 rounded-2xl border border-dashed border-border/30">
                    No matching workouts selected or logged.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {strengthMatrixData.map((card, idx) => (
                      <div key={idx} className="bg-muted/10 border border-border/40 rounded-2xl p-4 flex flex-col gap-3.5 shadow-sm relative overflow-hidden">
                        {/* Header details */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🏋️</span>
                            <span className="text-xs font-black uppercase text-foreground leading-tight tracking-wider">{card.exercise}</span>
                          </div>
                          
                          {/* PR Delta / Progress Badge */}
                          {card.hasLogs && (
                            card.prDelta === 0 ? (
                              <span className="inline-flex items-center gap-0.5 bg-amber-500/15 text-amber-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-500/30">
                                🎉 All-Time Best
                              </span>
                            ) : (
                              <span className="text-[8px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {card.prDelta} kg from best
                              </span>
                            )
                          )}
                        </div>

                        {card.hasLogs ? (
                          <>
                            {/* PR Info */}
                            <div className="bg-card rounded-xl p-3 border border-border/30 flex items-center justify-between">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest leading-none">Personal Record</span>
                                <span className="text-sm font-black text-primary leading-none mt-1">{card.pr} kg</span>
                              </div>
                              <div className="flex flex-col items-end gap-0.5">
                                <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest leading-none">PR Date</span>
                                <span className="text-[9px] font-bold text-muted-foreground/80 leading-none mt-1">{card.prDate}</span>
                              </div>
                            </div>

                            {/* Core stats grid */}
                            <div className="grid grid-cols-2 gap-3">
                              {/* Avg Weight */}
                              <div className="bg-card rounded-xl p-3 border border-border/30 flex flex-col gap-0.5">
                                <span className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest leading-none">Avg Weight</span>
                                <span className="text-xs font-black text-foreground mt-1">{card.avg} kg</span>
                              </div>

                              {/* Most Used Weight */}
                              <div className="bg-card rounded-xl p-3 border border-border/30 flex flex-col gap-0.5">
                                <span className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest leading-none">Most Used Weight</span>
                                <span className="text-xs font-black text-foreground mt-1">{card.mostUsed} kg</span>
                              </div>

                              {/* Est. 1-Rep Max */}
                              <div className="bg-card rounded-xl p-3 border border-border/30 flex flex-col gap-0.5">
                                <span className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest leading-none">Est. 1-RM</span>
                                <span className="text-xs font-black text-foreground mt-1">{card.est1RM} kg</span>
                              </div>

                              {/* Total Volume */}
                              <div className="bg-card rounded-xl p-3 border border-border/30 flex flex-col gap-0.5">
                                <span className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest leading-none">Total Volume</span>
                                <span className="text-xs font-black text-emerald-600 mt-1">{card.volume.toLocaleString()} kg</span>
                              </div>

                              {/* Most Used Reps */}
                              <div className="bg-card rounded-xl p-3 border border-border/30 flex flex-col gap-0.5">
                                <span className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest leading-none">Most Used Reps</span>
                                <span className="text-xs font-black text-foreground mt-1">{card.mostUsedReps} reps</span>
                              </div>

                              {/* Total Sets */}
                              <div className="bg-card rounded-xl p-3 border border-border/30 flex flex-col gap-0.5">
                                <span className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest leading-none">Total Sets</span>
                                <span className="text-xs font-black text-primary mt-1">{card.totalSets} sets</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-4 text-[10px] text-muted-foreground font-bold bg-card rounded-xl border border-border/25">
                            No logs performed during the selected timeframe.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>
          </section>
        )}

        {/* ===================== VEHICLES ===================== */}
        {(activeTab === "ALL" || activeTab === "VEHICLES") && (
          <section className="space-y-6">
            <div className="flex items-center gap-4"><div className="h-px flex-1 bg-blue-600/20" /><h3 className="text-[10px] font-black text-blue-600 tracking-[5px] uppercase">Vehicles</h3><div className="h-px flex-1 bg-blue-600/20" /></div>
            <VehicleDashboard />
            
            <SectionCard title="Efficiency (KM/L)" icon={<Gauge size={18} />}><ResponsiveContainer width="100%" height={160}><LineChart data={fuelEfficiencyTrend}><CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2}/><XAxis dataKey="date" tick={{fontSize:8}}/><YAxis tick={{fontSize:8}}/><Tooltip content={<CustomTooltip/>}/><Legend iconSize={8} wrapperStyle={{fontSize:9, fontWeight:900}}/>{Array.from(new Set(fuelEfficiencyTrend.map(d=>d.vehicle))).map((v,i)=><Line key={i} type="monotone" dataKey="mileage" name={v||"Vehicle"} stroke={COLORS[i%COLORS.length]} strokeWidth={3} dot={{r:4}}/>)}</LineChart></ResponsiveContainer></SectionCard>
            <SectionCard title="TCO breakdown" icon={<Wallet size={18} />}><ResponsiveContainer width="100%" height={160}><BarChart data={vehicleTCO}><XAxis dataKey="name" tick={{fontSize:9, fontWeight:800}}/><YAxis hide/><Tooltip content={<CustomTooltip/>}/><Bar dataKey="fuel" name="Fuel ₹" stackId="v" fill="var(--color-primary)"/><Bar dataKey="service" name="Service ₹" stackId="v" fill="#f59e0b" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></SectionCard>
            <SectionCard title="Monthly Spend" icon={<Car size={18} />}><ResponsiveContainer width="100%" height={140}><BarChart data={vehicleSpend} layout="vertical"><XAxis type="number" hide/><YAxis dataKey="name" type="category" tick={{fontSize:8, fontWeight:800}} width={80}/><Tooltip content={<CustomTooltip/>}/><Bar dataKey="fuel" stackId="s" fill="var(--color-primary)"/><Bar dataKey="service" stackId="s" fill="#f59e0b" radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></SectionCard>
            <SectionCard title="KMs Driven Trend" icon={<Map size={18} />} headerRight={
                <Select value={isVehicleKMsCustom ? "custom" : vehicleKMsDays} onChange={(e) => { if (e.target.value === "custom") setIsVehicleKMsCustom(true); else { setIsVehicleKMsCustom(false); setVehicleKMsDays(parseInt(e.target.value)); } }} className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1">
                  {[7, 14, 30, 60, 90].map(d => <option key={d} value={d}>{d} Days</option>)}
                  <option value="custom">Custom</option>
                </Select>
            }>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={vehicleKMsTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2}/>
                  <XAxis dataKey="date" tick={{fontSize:7, fontWeight:800}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:8}} axisLine={false} tickLine={false} width={30}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Legend iconSize={8} wrapperStyle={{fontSize:9, fontWeight:900, paddingTop: 10}}/>
                  
                  {/* Total Line (Thick Primary) */}
                  <Line type="monotone" dataKey="Total" name="Total KMs" stroke="var(--color-primary)" strokeWidth={3} dot={{r:3}}/>
                  
                  {/* Individual Vehicle Lines */}
                  {Array.from(new Set(vehicleConfigs.map(vc => vc.vehicle_name))).map((vName, i) => (
                    <Line 
                      key={vName} 
                      type="monotone" 
                      dataKey={vName} 
                      name={vName} 
                      stroke={COLORS[(i + 1) % COLORS.length]} 
                      strokeWidth={1.5} 
                      dot={{r:2}}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </SectionCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionCard title="Cost Per KM (CPK)" icon={<TrendingUp size={18} />}><div className="space-y-3">{vehicleCPK.map((v, i) => ( <div key={i} className="flex items-center justify-between p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10"><div className="flex flex-col"><span className="text-[10px] font-black text-foreground">{v.name}</span><span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{v.dist.toLocaleString()} KM</span></div><div className="flex flex-col items-end"><span className="text-[12px] font-black text-indigo-500">₹{v.cpk}</span><span className="text-[7px] font-black text-muted-foreground/40 uppercase">Per KM</span></div></div> ))}</div></SectionCard>
              <SectionCard title="Usage Heatmap" icon={<Grid3X3 size={18} />}><div className="flex flex-wrap gap-[3px] overflow-hidden">{vehicleUsageHeatmap.map((d, i) => { let color = "bg-muted/10"; if (d.value > 10) color = "bg-blue-500/20"; if (d.value > 30) color = "bg-blue-500/40"; if (d.value > 60) color = "bg-blue-500/70"; if (d.value > 100) color = "bg-blue-500"; return <div key={i} className={`w-[7px] h-[7px] rounded-[1px] ${color} transition-colors hover:scale-125 cursor-help`} title={`${d.date}: ${d.value} KM`} />; })}</div></SectionCard>
            </div>

            {/* Odometer & Maintenance Forecaster (v1) */}
            <SectionCard title="Odometer & Maintenance Forecaster" icon={<Gauge size={18} />}>
              <div className="space-y-3">
                {maintenanceForecasts.map((f, i) => (
                  <div key={i} className="p-3 bg-muted/20 border border-border/30 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-black text-foreground">{f.name}</span>
                      <span className="text-[9px] font-bold text-muted-foreground/60 leading-none">
                        Odo: {f.currentOdo.toLocaleString()} km ➔ Target: {f.targetOdo.toLocaleString()} km
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded">
                        Next: {f.predictedDate}
                      </span>
                      <span className="text-[7px] font-black text-muted-foreground/40 uppercase">
                        ({f.kmsRemaining.toLocaleString()} km remaining)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Service Category Cost Breakdown (v2) */}
            {serviceCategoryCosts.length > 0 && (
              <SectionCard 
                title="Service Expenditures by Category" 
                icon={<Wallet size={18} />}
                headerRight={
                  <Select 
                    value={serviceExpendituresRange} 
                    onChange={(e) => setServiceExpendituresRange(parseInt(e.target.value))} 
                    className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1"
                  >
                    <option value={30}>30 Days</option>
                    <option value={60}>60 Days</option>
                    <option value={90}>90 Days</option>
                    <option value={180}>6 Months</option>
                    <option value={365}>1 Year</option>
                  </Select>
                }
              >
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {serviceCategoryCosts.map((c, i) => (
                    <StatPill 
                      key={i} 
                      label={c.name} 
                      value={`₹${(c.Total || 0).toLocaleString()}`} 
                      color={i === 0 ? 'text-primary' : i === 1 ? 'text-amber-500' : 'text-emerald-500'} 
                    />
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={serviceCategoryCosts}>
                    <XAxis dataKey="name" tick={{fontSize:7, fontWeight:800}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize:8}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconSize={8} wrapperStyle={{fontSize:9, fontWeight:900, paddingTop: 10}} />
                    {Array.from(new Set(vehicleConfigs.map(vc => vc.vehicle_name))).map((vName, i) => (
                      <Bar 
                        key={vName} 
                        dataKey={vName} 
                        name={vName} 
                        stackId="a" 
                        fill={COLORS[i % COLORS.length]} 
                        radius={i === vehicleConfigs.length - 1 ? [4,4,0,0] : [0,0,0,0]} 
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>
            )}

            {/* Real TCO per Kilometer (v3) */}
            <SectionCard title="Real Cost of Ownership per KM" icon={<Car size={18} />}>
              <div className="space-y-4">
                {realTCOPerKM.map((t, i) => (
                  <div key={i} className="p-4 bg-muted/20 border border-border/30 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-foreground">{t.name}</span>
                      <span className="text-xs font-black text-primary">₹{t.tcoPerKm}/KM</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-muted/40 rounded-xl p-2 flex flex-col">
                        <span className="text-[7px] font-black uppercase text-muted-foreground/60 leading-none">Fuel</span>
                        <span className="text-[10px] font-black text-foreground mt-1">₹{t.fuelCost.toLocaleString()}</span>
                      </div>
                      <div className="bg-muted/40 rounded-xl p-2 flex flex-col">
                        <span className="text-[7px] font-black uppercase text-muted-foreground/60 leading-none">Service</span>
                        <span className="text-[10px] font-black text-foreground mt-1">₹{t.svcCost.toLocaleString()}</span>
                      </div>
                      <div className="bg-muted/40 rounded-xl p-2 flex flex-col">
                        <span className="text-[7px] font-black uppercase text-muted-foreground/60 leading-none">Deprec (Est)</span>
                        <span className="text-[10px] font-black text-rose-500 mt-1">₹{t.depreciation.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="text-[8px] font-bold text-muted-foreground/40 text-center uppercase tracking-wider">
                      Based on {t.distance.toLocaleString()} km recorded driving distance
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </section>
        )}

        {/* ===================== SKILLS ===================== */}
        {(activeTab === "ALL" || activeTab === "PETS") && (
          <section className="space-y-6">
            <div className="flex items-center gap-4"><div className="h-px flex-1 bg-rose-600/20" /><h3 className="text-[10px] font-black text-rose-600 tracking-[5px] uppercase">Pets</h3><div className="h-px flex-1 bg-rose-600/20" /></div>

            {/* UPCOMING REMINDERS */}
            {petUpcomingReminders.length > 0 && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-rose-500">
                  <AlertTriangle size={18} />
                  <h3 className="font-black text-sm uppercase tracking-widest">Upcoming Reminders</h3>
                </div>
                <div className="space-y-2">
                  {petUpcomingReminders.slice(0,3).map((r: any) => {
                    const daysLeft = Math.ceil((new Date(r.next_due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    const petName = petProfiles.find((p: any) => p.id === r.pet_id)?.name || 'Pet';
                    return (
                      <div key={r.id} className="bg-background rounded-xl p-3 flex justify-between items-center border border-border/40">
                        <div>
                          <div className="font-bold text-sm">{r.log_type} <span className="text-muted-foreground font-medium text-xs">({petName})</span></div>
                          <div className="text-[10px] uppercase font-black text-rose-500 tracking-widest">Due {format(new Date(r.next_due_date), 'MMM dd')}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-foreground">{daysLeft}</div>
                          <div className="text-[9px] uppercase tracking-widest text-muted-foreground/60">Days</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FINANCIAL SUMMARY */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                <div className="relative z-10">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1 flex items-center gap-1.5"><Coins size={12}/> Total Cost of Ownership</div>
                  <div className="text-4xl font-black mb-1">₹{petTCO.toLocaleString()}</div>
                  <div className="text-xs font-medium text-white/80">Total spent across all pets lifetime</div>
                </div>
              </div>
            </div>

            {/* EXPENSE TREND */}
            <SectionCard title="Monthly Spend Trend" icon={<Activity size={18} />}>
              {petMonthlyExpenseData.length > 0 ? (
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={petMonthlyExpenseData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        {[...petProfiles.map((p: any) => p.name), 'General'].map((name: string, idx: number) => (
                          <linearGradient key={name} id={`petColor${name}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(v: number) => `₹${v}`} />
                      <Tooltip content={<CustomTooltip/>} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                      {[...petProfiles.map((p: any) => p.name), 'General'].map((name: string, idx: number) => (
                        <Area key={name} type="monotone" dataKey={name} stroke={COLORS[idx % COLORS.length]} strokeWidth={3} fillOpacity={1} fill={`url(#petColor${name})`} />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-10 font-bold">No expense data found.</div>
              )}
            </SectionCard>

            {/* EXPENSE BREAKDOWN PER PET */}
            {petProfiles.length > 0 && Object.keys(petExpenseBreakdown).some((pet: string) => petExpenseBreakdown[pet].length > 0) && (
              <SectionCard title="Expense Breakdown" icon={<Wallet size={18} />}>
                <div className="grid grid-cols-2 gap-4 p-4">
                  {[...petProfiles.map((p: any) => p.name), 'General'].map((name: string, idx: number) => {
                    const data = petExpenseBreakdown[name];
                    if (!data || data.length === 0) return null;
                    return (
                      <div key={name} className="bg-background rounded-xl p-4 border border-border/40 flex flex-col items-center shadow-sm">
                        <h4 className="text-xs font-black mb-2 text-foreground/80">{name}</h4>
                        <div className="h-32 w-full relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={data} innerRadius={25} outerRadius={45} paddingAngle={2} dataKey="value">
                                {data.map((_: any, index: number) => (<Cell key={`cell-${index}`} fill={COLORS[(idx + index) % COLORS.length]} />))}
                              </Pie>
                              <Tooltip content={<CustomTooltip/>} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="w-full mt-2 flex flex-col gap-1 px-2">
                          {data.slice(0,4).map((item: any, i: number) => (
                            <div key={item.name} className="flex items-center justify-between text-[9px] font-bold">
                              <div className="flex items-center gap-1.5 truncate">
                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[(idx + i) % COLORS.length] }}></div>
                                <span className="truncate text-muted-foreground">{item.name}</span>
                              </div>
                              <span className="text-foreground shrink-0 pl-2">₹{item.value.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            )}

            {/* CADENCE TRACKERS */}
            <div className="grid grid-cols-2 gap-4">
              <SectionCard title="Days Since (Groom)" icon={<Scissors size={16} />}>
                {petGroomingCadenceData.length > 0 ? (
                  <div className="h-32 w-full px-2 pb-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={petGroomingCadenceData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold' }} />
                        <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip/>} />
                        <Bar dataKey="days" radius={[0, 4, 4, 0]}>
                          {petGroomingCadenceData.map((entry: any, index: number) => (<Cell key={`cell-${index}`} fill={entry.days > 30 ? '#ef4444' : '#f59e0b'} />))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (<div className="text-center text-xs text-muted-foreground py-6 font-bold">No grooming logged.</div>)}
              </SectionCard>

              <SectionCard title="Days Since (Med)" icon={<Shield size={16} />}>
                {petMedicalCadenceData.length > 0 ? (
                  <div className="h-32 w-full px-2 pb-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={petMedicalCadenceData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold' }} />
                        <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip/>} />
                        <Bar dataKey="days" radius={[0, 4, 4, 0]}>
                          {petMedicalCadenceData.map((entry: any, index: number) => (<Cell key={`cell-${index}`} fill={entry.days > 90 ? '#ef4444' : '#10b981'} />))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (<div className="text-center text-xs text-muted-foreground py-6 font-bold">No medical logged.</div>)}
              </SectionCard>
            </div>

            {/* ACTIVITY & TRAINING */}
            <div className="grid grid-cols-2 gap-4">
              <SectionCard title="Top Activities" icon={<Trees size={16} />}>
                {petActivityData.length > 0 ? (
                  <div className="h-32 w-full px-2 pb-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={petActivityData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 'bold' }} interval={0} />
                        <YAxis hide />
                        <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip/>} />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (<div className="text-center text-xs text-muted-foreground py-6 font-bold">No activities logged.</div>)}
              </SectionCard>

              <SectionCard title="Training Profile" icon={<GraduationCap size={16} />}>
                {petTrainingData.length > 0 ? (
                  <div className="h-32 w-full relative px-2 pb-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={petTrainingData} innerRadius={30} outerRadius={50} paddingAngle={5} dataKey="value">
                          {petTrainingData.map((entry: any, index: number) => (<Cell key={`cell-${index}`} fill={entry.name === 'Incidents' ? '#ef4444' : '#8b5cf6'} />))}
                        </Pie>
                        <Tooltip content={<CustomTooltip/>} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-[10px] font-black text-muted-foreground">Total: {petTrainingData.reduce((a: number, b: any) => a + b.value, 0)}</div>
                    </div>
                  </div>
                ) : (<div className="text-center text-xs text-muted-foreground py-6 font-bold mt-4">No training logged.</div>)}
              </SectionCard>
            </div>
          </section>
        )}

        {(activeTab === "ALL" || activeTab === "SKILLS") && (
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-border/40" />
              <h3 className="text-[10px] font-black text-muted-foreground tracking-[5px] uppercase">Skills Intelligence</h3>
              <div className="h-px flex-1 bg-border/40" />
            </div>

            <div className="flex items-center justify-end gap-2">
              <span className="text-[9px] font-black uppercase text-muted-foreground/60">Timeframe:</span>
              <Select 
                value={skillsTimeframe} 
                onChange={(e) => setSkillsTimeframe(parseInt(e.target.value))} 
                className="bg-card border border-border/40 text-[9px] font-black uppercase text-primary rounded-xl px-3 py-1.5 shadow-sm"
              >
                <option value={30}>30 Days</option>
                <option value={90}>90 Days</option>
                <option value={180}>6 Months</option>
                <option value={365}>1 Year</option>
              </Select>
            </div>

            {/* Time Split Donut + Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SectionCard title="Practice Distribution" icon={<BarChart2 size={18} />} className="md:col-span-2">
                {skillsReports.focusVsLegacyData.length === 0 ? (
                  <div className="text-center py-10 text-xs font-bold text-muted-foreground/40">No practice sessions logged in this timeframe.</div>
                ) : (
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <ResponsiveContainer width="100%" height={160} className="max-w-[160px]">
                      <PieChart>
                        <Pie
                          data={skillsReports.focusVsLegacyData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                        >
                          {skillsReports.focusVsLegacyData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {skillsReports.focusVsLegacyData.map((s, idx) => (
                        <div key={s.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                            <span className="font-bold text-foreground">{s.name}</span>
                            {s.isFocus && <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black uppercase">Focus</span>}
                          </div>
                          <span className="font-black text-muted-foreground">{s.value} hrs</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </SectionCard>
              
              <SectionCard title="Skill Summary Stats" icon={<Trophy size={18} />}>
                <div className="flex flex-col gap-3">
                  <StatPill 
                    label="Current Focus Skill" 
                    value={skillItems.find(s => s.status === 'focus')?.name || 'None'} 
                    color="text-primary"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <StatPill 
                      label="Total Sessions" 
                      value={String(skillsReports.skillsListTable.reduce((s, item) => s + item.totalSessions, 0))}
                    />
                    <StatPill 
                      label="Total Practice" 
                      value={`${skillsReports.skillsListTable.reduce((s, item) => s + item.totalHours, 0)}h`}
                    />
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Progression & Hour Milestones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SectionCard 
                title="Mastery Progression" 
                icon={<TrendingUp size={18} />}
                headerRight={
                  <Select 
                    value={selectedProgressSkill} 
                    onChange={(e) => setSelectedProgressSkill(e.target.value)} 
                    className="bg-muted/30 border-none text-[8px] font-black uppercase text-primary rounded px-2 py-1"
                  >
                    <option value="All">All Skills</option>
                    {skillItems.map(s => (
                      <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                    ))}
                  </Select>
                }
              >
                <div className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-wider mb-2">
                  Cumulative Practice Hours (Novice: 20h · Competent: 100h)
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={skillsReports.progressionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1}/>
                    <XAxis dataKey="date" tick={{fontSize:8, fontWeight:800}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:8, fontWeight:800}} axisLine={false} tickLine={false} width={20}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Line type="monotone" dataKey="hours" name="Practice Hours" stroke="var(--color-primary)" strokeWidth={3} dot={false}/>
                  </LineChart>
                </ResponsiveContainer>
              </SectionCard>

              {/* Monthly Focus Target Achievement */}
              <SectionCard title="Target Achievement Rate" icon={<CheckCircle2 size={18} />}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={skillsReports.monthlyTargetData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1}/>
                    <XAxis dataKey="month" tick={{fontSize:8, fontWeight:800}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:8, fontWeight:800}} axisLine={false} tickLine={false} width={20}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Legend iconSize={8} wrapperStyle={{fontSize:9, fontWeight:900}}/>
                    <Bar dataKey="actual" name="Completed Sessions" fill="var(--color-primary)" radius={[4,4,0,0]} barSize={24}/>
                    <Bar dataKey="target" name="Monthly Target" fill="var(--color-muted)" radius={[4,4,0,0]} barSize={24}/>
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>
            </div>

            {/* Practice Consistency Heat Grid */}
            <SectionCard title="Consistency Heat Grid" icon={<Grid3X3 size={18} />}>
              <div className="flex flex-wrap gap-[3px] overflow-hidden">
                {skillsReports.consistencyHeatmap.map((d, i) => {
                  let color = "bg-muted/10";
                  if (d.count > 0) color = "bg-primary/25";
                  if (d.count > 1) color = "bg-primary/50";
                  if (d.count > 2) color = "bg-primary/80";
                  if (d.count > 3) color = "bg-primary";
                  return (
                    <div 
                      key={i} 
                      className={`w-[8px] h-[8px] rounded-[1px] ${color} transition-colors hover:scale-125 cursor-help`} 
                      title={`${format(new Date(d.date), "dd MMM yyyy")}: ${d.count} session${d.count !== 1 ? 's' : ''}`} 
                    />
                  );
                })}
              </div>
            </SectionCard>

            {/* Duration and Frequency Trends */}
            <SectionCard title="Practice Frequency & Average Duration" icon={<Clock size={18} />}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={skillsReports.frequencyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1}/>
                  <XAxis dataKey="month" tick={{fontSize:8, fontWeight:800}} axisLine={false} tickLine={false}/>
                  <YAxis yAxisId="left" tick={{fontSize:8, fontWeight:800}} axisLine={false} tickLine={false} width={20}/>
                  <YAxis yAxisId="right" orientation="right" tick={{fontSize:8, fontWeight:800}} axisLine={false} tickLine={false} width={25} tickFormatter={v=>`${v}m`}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Legend iconSize={8} wrapperStyle={{fontSize:9, fontWeight:900}}/>
                  <Bar yAxisId="left" dataKey="sessions" name="Sessions Count" fill="var(--color-primary)" radius={[4,4,0,0]} barSize={30}/>
                  <Line yAxisId="right" type="monotone" dataKey="avgDuration" name="Avg Duration (min)" stroke="#f59e0b" strokeWidth={2.5}/>
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>

            {/* Lists All Skills (Custom request) */}
            <SectionCard title="All Skills & Performance Metrics" icon={<GraduationCap size={18} />}>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 text-muted-foreground font-black uppercase tracking-wider">
                      <th className="py-2.5 px-2">Skill</th>
                      <th className="py-2.5 px-2 text-center">Status</th>
                      <th className="py-2.5 px-2 text-center">Sessions</th>
                      <th className="py-2.5 px-2 text-center">Time Spent</th>
                      <th className="py-2.5 px-2 text-center">Avg Duration</th>
                      <th className="py-2.5 px-2 text-center">Streak</th>
                      <th className="py-2.5 px-2 text-right">Last Session</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skillsReports.skillsListTable.map(s => (
                      <tr key={s.id} className="border-b border-border/20 last:border-0 hover:bg-muted/10 font-bold text-foreground">
                        <td className="py-2.5 px-2 flex items-center gap-2">
                          <span className="text-lg leading-none">{s.icon}</span>
                          <span>{s.name}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${ s.status === 'focus' ? 'bg-primary/10 text-primary border border-primary/20' : s.status === 'archived' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-muted/50 text-muted-foreground' }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-black">{s.totalSessions}</td>
                        <td className="py-2.5 px-2 text-center font-black">{s.totalHours} hrs</td>
                        <td className="py-2.5 px-2 text-center text-muted-foreground">{s.avgDuration} min</td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-500 font-black">
                            <Flame size={10} /> {s.bestStreak}d
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right text-muted-foreground">{s.lastPracticed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
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
