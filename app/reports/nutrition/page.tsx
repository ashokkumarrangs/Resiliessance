"use client";

import React, { useEffect, useState, useMemo } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { Select } from "@/components/Select";
import { REPORT_TABS } from "@/lib/navigation";
import { LoadingScreen } from "@/components/LoadingScreen";
import { dietService, DietLogEntry, BiometricLog, BiometricDefinition, BiometricTarget, DietTarget } from "@/lib/services/diet";
import { format, subDays, parseISO } from "date-fns";
import { toast } from "sonner";
import { 
  TrendingUp, 
  Utensils, 
  Scale, 
  Apple, 
  RefreshCw, 
  Dumbbell, 
  Droplets,
  CalendarDays,
  Activity,
  History
} from "lucide-react";
import {
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function NutritionReportsPage() {
  const [reportDaysRange, setReportDaysRange] = useState<number>(15);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Core Data States
  const [logs, setLogs] = useState<DietLogEntry[]>([]);
  const [target, setTarget] = useState<DietTarget | null>(null);
  
  // Biometric States
  const [biometricDefs, setBiometricDefs] = useState<BiometricDefinition[]>([]);
  const [biometricLogs, setBiometricLogs] = useState<BiometricLog[]>([]);
  const [biometricTargets, setBiometricTargets] = useState<BiometricTarget[]>([]);
  const [activeMetricId, setActiveMetricId] = useState<string>("weight");

  const fetchReportsData = async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      // Fetch long range history (e.g. 60 days of data to cover any range selections)
      const startDate = format(subDays(today, 60), "yyyy-MM-dd");
      
      const [loadedTarget, loadedLogs, loadedDefs, loadedBiometricLogs, loadedBiometricTargets] = await Promise.all([
        dietService.getTarget(),
        dietService.getLogsForDateRange(startDate, format(today, "yyyy-MM-dd")),
        dietService.getBiometricDefinitions(),
        dietService.getBiometricsLogs(),
        dietService.getBiometricTargets()
      ]);

      setTarget(loadedTarget);
      setLogs(loadedLogs);
      setBiometricDefs(loadedDefs);
      setBiometricLogs(loadedBiometricLogs);
      setBiometricTargets(loadedBiometricTargets);

      if (loadedDefs.length > 0) {
        const hasWeight = loadedDefs.some(d => d.id === "weight");
        if (hasWeight) {
          setActiveMetricId("weight");
        } else {
          setActiveMetricId(loadedDefs[0].id);
        }
      } else {
        setActiveMetricId("");
      }
    } catch (e) {
      console.error("Failed to load reports data", e);
      toast.error("Failed to sync reports data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  // Find active metric metadata
  const activeMetric = useMemo(() => {
    return biometricDefs.find(d => d.id === activeMetricId) || { id: "", name: "", unit: "" };
  }, [biometricDefs, activeMetricId]);

  const activeTargetForMetric = useMemo(() => {
    return biometricTargets.find(t => t.metric_type === activeMetricId);
  }, [biometricTargets, activeMetricId]);

  const sortedLogsForMetric = useMemo(() => {
    return biometricLogs
      .filter(l => l.metric_type === activeMetricId)
      .sort((a, b) => b.date.localeCompare(a.date)); // descending for history list
  }, [biometricLogs, activeMetricId]);

  // Compute stats and coordinates for selected interval
  const reportsData = useMemo(() => {
    const days = [];
    for (let i = reportDaysRange - 1; i >= 0; i--) {
      days.push(format(subDays(new Date(), i), "yyyy-MM-dd"));
    }

    return days.map((dStr) => {
      const dayLogs = logs.filter((l) => l.date === dStr);
      // Find biometric log for this day
      const dayBio = biometricLogs.find((w) => w.metric_type === activeMetricId && w.date === dStr);

      const calories = dayLogs.reduce((sum, item) => sum + Math.round(item.calories * item.quantity), 0);
      const protein = dayLogs.reduce((sum, item) => sum + (item.protein * item.quantity), 0);

      return {
        date: dStr,
        calories,
        protein: Number(protein.toFixed(1)),
        biometricValue: dayBio ? Number(dayBio.value) : null,
        targetValue: activeTargetForMetric ? activeTargetForMetric.target_value : null
      };
    });
  }, [logs, biometricLogs, activeMetricId, reportDaysRange, activeTargetForMetric]);

  // KPI Calculations based on active metric
  const kpiStats = useMemo(() => {
    if (reportsData.length === 0) return { avgCalories: 0, avgProtein: 0, avgBiometric: 0, biometricChange: 0 };
    
    let calorieSum = 0;
    let proteinSum = 0;
    let bioSum = 0;
    let bioCount = 0;
    
    // Calculate difference between latest and oldest readings in selection interval
    const validBios = reportsData.filter(d => d.biometricValue !== null);
    const biometricChange = validBios.length >= 2 
      ? Number((validBios[validBios.length - 1].biometricValue! - validBios[0].biometricValue!).toFixed(1))
      : 0;

    reportsData.forEach(d => {
      calorieSum += d.calories;
      proteinSum += d.protein;
      if (d.biometricValue !== null) {
        bioSum += d.biometricValue;
        bioCount++;
      }
    });

    return {
      avgCalories: Math.round(calorieSum / reportsData.length),
      avgProtein: Math.round(proteinSum / reportsData.length),
      avgBiometric: bioCount > 0 ? Number((bioSum / bioCount).toFixed(1)) : 0,
      biometricChange
    };
  }, [reportsData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center">
        <LoadingScreen message="Assembling health analytics matrices..." />
      </div>
    );
  }

  return (
    <PageWrapper
      title="Intelligence"
      sectionTabs={REPORT_TABS}
      activePath="/reports/nutrition"
      headerActions={
        <button 
          onClick={fetchReportsData} 
          className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-muted-foreground/60 hover:text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
        >
          <RefreshCw className="w-4 h-4 md:w-[18px] md:h-[18px]" />
        </button>
      }
    >
      <div className="space-y-6 max-w-lg mx-auto">
        {biometricDefs.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <Activity size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase text-foreground leading-none">No Biometrics Configured</h3>
              <p className="text-[10px] font-bold text-muted-foreground/60 max-w-xs mx-auto mt-1.5">
                Nutrition correlation reports require at least one biometric metric (e.g. Body Weight, Blood Sugar) to plot trend lines.
              </p>
            </div>
            <a
              href="/nutrition/biometrics"
              className="py-2.5 px-5 rounded-xl text-xs font-black bg-primary text-white shadow-lg shadow-primary/10 hover:bg-primary/95 transition-all block text-center"
            >
              Set Up Biometrics
            </a>
          </div>
        ) : (
          <>
            {/* Metric Selector & Date Filter row */}
            <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <Activity size={18} />
            </span>
            <div className="flex-1">
              <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-wider">Active Metric</span>
              <Select
                value={activeMetricId}
                onChange={(e) => setActiveMetricId(e.target.value)}
                className="bg-transparent border-none p-0 text-sm font-black text-foreground focus:ring-0 cursor-pointer block mt-0.5"
              >
                {biometricDefs.map((def) => (
                  <option key={def.id} value={def.id}>
                    {def.name} ({def.unit})
                  </option>
                ))}
              </Select>
            </div>
          </div>
          
          <div className="flex bg-muted/60 p-1 rounded-lg gap-1 border border-border/10 w-full md:w-auto justify-between">
            {[7, 15, 30].map((days) => (
              <button
                key={days}
                onClick={() => setReportDaysRange(days)}
                className={`py-1 px-3 text-[9px] font-black rounded-md transition-all flex-1 md:flex-initial text-center ${
                  reportDaysRange === days
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>

        {/* KPI Panel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Average Calories */}
          <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-4 flex flex-col justify-center">
            <span className="text-[8px] font-black text-muted-foreground/45 uppercase tracking-wider">Avg Calories</span>
            <span className="text-lg font-black text-foreground mt-0.5">
              {kpiStats.avgCalories} <span className="text-[10px] font-bold text-muted-foreground/55">kcal</span>
            </span>
            <span className="text-[8px] font-bold text-muted-foreground/40 mt-1">
              Goal: {target?.calories || 2000} kcal
            </span>
          </div>

          {/* Average Protein */}
          <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-4 flex flex-col justify-center">
            <span className="text-[8px] font-black text-muted-foreground/45 uppercase tracking-wider">Avg Protein</span>
            <span className="text-lg font-black text-emerald-500 mt-0.5">
              {kpiStats.avgProtein} <span className="text-[10px] font-bold text-emerald-500/55">g</span>
            </span>
            <span className="text-[8px] font-bold text-muted-foreground/40 mt-1">
              Goal: {target?.protein || 130}g
            </span>
          </div>

          {/* Average Scale Value */}
          <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-4 flex flex-col justify-center">
            <span className="text-[8px] font-black text-muted-foreground/45 uppercase tracking-wider">Avg {activeMetric.name}</span>
            <span className="text-lg font-black text-foreground mt-0.5">
              {kpiStats.avgBiometric > 0 ? `${kpiStats.avgBiometric} ${activeMetric.unit}` : `--`}
            </span>
            <span className="text-[8px] font-bold text-muted-foreground/40 mt-1">
              Goal: {activeTargetForMetric ? `${activeTargetForMetric.target_value} ${activeMetric.unit}` : "--"}
            </span>
          </div>

          {/* Metric Change Delta */}
          <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-4 flex flex-col justify-center">
            <span className="text-[8px] font-black text-muted-foreground/45 uppercase tracking-wider">Net Shift</span>
            <span className={`text-lg font-black mt-0.5 ${
              kpiStats.biometricChange > 0 ? "text-rose-500" : kpiStats.biometricChange < 0 ? "text-emerald-500" : "text-foreground"
            }`}>
              {kpiStats.biometricChange > 0 ? `+${kpiStats.biometricChange}` : kpiStats.biometricChange} <span className="text-[10px] font-bold opacity-75">{activeMetric.unit}</span>
            </span>
            <span className="text-[8px] font-bold text-muted-foreground/40 mt-1">
              Selected {reportDaysRange} days
            </span>
          </div>
        </div>

        {/* Charts Panel */}
        <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-6 space-y-8">
          {/* Calorie vs Active Metric Correlation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="p-1 rounded bg-primary/10 text-primary">
                  <TrendingUp size={12} />
                </span>
                <h4 className="text-[10px] font-black uppercase text-foreground tracking-wider">
                  Calorie Intake vs. {activeMetric.name} Correlation
                </h4>
              </div>
              {activeTargetForMetric && (
                <span className="text-[9px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                  Target: {activeTargetForMetric.target_value} {activeMetric.unit}
                </span>
              )}
            </div>
            <p className="text-[9px] font-medium text-muted-foreground/45 -mt-1 pl-6">
              Bar shows calories logged (left axis), line plots daily {activeMetric.name} readings (right Y-axis, connected across days)
            </p>
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={reportsData} margin={{ top: 10, right: -10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val) => {
                      try {
                        return format(parseISO(val), "MMM d");
                      } catch {
                        return val;
                      }
                    }}
                    tick={{ fontSize: 9, fontWeight: "bold" }}
                    stroke="var(--color-muted-foreground)"
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 9, fontWeight: "bold" }}
                    stroke="var(--color-muted-foreground)"
                    label={{ value: "Calories (kcal)", angle: -90, position: "insideLeft", fontSize: 9, offset: 5, fill: "var(--color-muted-foreground)" }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={['dataMin - 5', 'dataMax + 5']}
                    tick={{ fontSize: 9, fontWeight: "bold" }}
                    stroke="#818cf8"
                    label={{ value: `${activeMetric.name} (${activeMetric.unit})`, angle: 90, position: "insideRight", fontSize: 9, offset: 0, fill: "#818cf8" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      borderColor: "var(--color-border)",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "bold"
                    }}
                  />
                  <Bar yAxisId="left" dataKey="calories" name="Calories (kcal)" fill="var(--color-primary)" opacity={0.65} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="biometricValue" name={activeMetric.name} stroke="#818cf8" strokeWidth={3.5} dot={{ r: 4, strokeWidth: 1 }} connectNulls={true} />
                  {activeTargetForMetric && (
                    <Line yAxisId="right" type="step" dataKey="targetValue" name="Target Goal" stroke="rgba(129, 140, 248, 0.4)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Protein Compliance */}
          <div className="space-y-2 pt-6 border-t border-border/10">
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded bg-emerald-500/10 text-emerald-500">
                <Dumbbell size={12} />
              </span>
              <h4 className="text-[10px] font-black uppercase text-foreground tracking-wider">
                Daily Protein Intake Trend (g)
              </h4>
            </div>
            <p className="text-[9px] font-medium text-muted-foreground/45 -mt-1 pl-6">
              Track daily protein grams consumed vs. targets
            </p>
            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val) => {
                      try {
                        return format(parseISO(val), "MMM d");
                      } catch {
                        return val;
                      }
                    }}
                    tick={{ fontSize: 9, fontWeight: "bold" }}
                    stroke="var(--color-muted-foreground)"
                  />
                  <YAxis tick={{ fontSize: 9, fontWeight: "bold" }} stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      borderColor: "var(--color-border)",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "bold"
                    }}
                  />
                  <Bar dataKey="protein" name="Protein (g)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* History Audit Logs Table */}
        <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-indigo-500/10 text-indigo-500">
              <History size={16} />
            </span>
            <div>
              <h3 className="text-sm font-black uppercase text-foreground leading-none">History & Audit Logs</h3>
              <p className="text-[10px] font-bold text-muted-foreground/60 mt-1">
                Full history of entries and notes for {activeMetric.name}
              </p>
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto no-scrollbar border border-border/10 rounded-xl">
            {sortedLogsForMetric.length === 0 ? (
              <p className="text-[10px] text-muted-foreground/50 italic text-center py-8 bg-muted/10">
                No logs recorded yet for {activeMetric.name}.
              </p>
            ) : (
              <table className="w-full text-left text-xs font-bold text-foreground">
                <thead className="bg-muted text-[10px] text-muted-foreground/75 uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4 text-right">Value</th>
                    <th className="py-2.5 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10 bg-card">
                  {sortedLogsForMetric.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground/80 font-medium">
                        {format(parseISO(log.date), "MMM d, yyyy")}
                      </td>
                      <td className="py-3 px-4 text-right text-foreground font-black">
                        {log.value} {activeMetric.unit}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground/50 font-medium italic">
                        {log.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
          </>
        )}
      </div>
    </PageWrapper>
  );
}
