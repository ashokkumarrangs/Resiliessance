"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Activity, AlertTriangle, ArrowRight, BarChart3, Bell, CalendarDays, CheckCircle2, File, FileText, Grid, History, PlusCircle, Target, TrendingUp, Trophy, Wrench , BarChart2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format, subDays, startOfMonth, endOfMonth, differenceInDays } from "date-fns";

type Feature = 
  | "Category Breakdown"
  | "Historical Plans"
  | "Historical Trends"
  | "Habit Matrix"
  | "Add Vehicle"
  | "Log Service"
  | "Fuel & Service History"
  | "Vehicle Master Profile"
  | "Personal Records";

export default function NewFeaturesPreviewPage() {
  const [activeFeature, setActiveFeature] = useState<Feature>("Fuel & Service History");

  const features: { name: Feature; icon: React.ReactNode; category: string }[] = [
    { name: "Category Breakdown", icon: <BarChart3 size={16} />, category: "Expenses" },
    { name: "Historical Plans", icon: <CalendarDays size={16} />, category: "Expenses" },
    { name: "Historical Trends", icon: <TrendingUp size={16} />, category: "Expenses" },
    { name: "Habit Matrix", icon: <Grid size={16} />, category: "Habits" },
    { name: "Add Vehicle", icon: <PlusCircle size={16} />, category: "Vehicles" },
    { name: "Log Service", icon: <Wrench size={16} />, category: "Vehicles" },
    { name: "Fuel & Service History", icon: <History size={16} />, category: "Vehicles" },
    { name: "Vehicle Master Profile", icon: <FileText size={16} />, category: "Vehicles" },
    { name: "Personal Records", icon: <Trophy size={16} />, category: "Workout" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-32 font-dm-sans">
      <div className="max-w-4xl mx-auto w-full p-4 md:p-6">
        <PageHeader title="New Features Preview (Live Data)"  >
        <div className="flex items-center gap-2">

          <Link 
            href="/reports" 
            className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-muted-foreground/60 hover:text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
            title="View Reports"
          >
            <BarChart2 className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Link>
        </div>
      </PageHeader>
        <p className="text-sm text-muted-foreground mb-6">
          This preview actively fetches data from your database to populate the mockups, but strictly makes zero changes to your old code.
        </p>

        {/* Category Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar mb-8 pb-2">
          {features.map((f) => (
            <button
              key={f.name}
              onClick={() => setActiveFeature(f.name)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 border ${ activeFeature === f.name ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105" : "bg-card text-muted-foreground border-border/40 hover:bg-muted" }`}
            >
              {f.icon}
              {f.name}
            </button>
          ))}
        </div>

        {/* Preview Area */}
        <div className="bg-card border border-border/40 rounded-3xl p-6 md:p-8 shadow-sm min-h-[500px]">
          {activeFeature === "Category Breakdown" && <MockupCategoryBreakdown />}
          {activeFeature === "Historical Plans" && <MockupHistoricalPlans />}
          {activeFeature === "Historical Trends" && <MockupHistoricalTrends />}
          {activeFeature === "Habit Matrix" && <MockupHabitMatrix />}
          {activeFeature === "Add Vehicle" && <MockupAddVehicle />}
          {activeFeature === "Log Service" && <MockupLogService />}
          {activeFeature === "Fuel & Service History" && <MockupFuelServiceHistory />}
          {activeFeature === "Vehicle Master Profile" && <MockupVehicleMasterProfile />}
          {activeFeature === "Personal Records" && <MockupPersonalRecords />}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// LIVE DATA MOCKUPS
// ---------------------------------------------------------

function MockupCategoryBreakdown() {
  const [data, setData] = useState<{name: string, amount: number, pct: number, color: string}[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function load() {
      const start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const end = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      
      const { data: exps } = await supabase
        .from('history_expenses')
        .select('category, amount')
        .eq('type', 'Expense')
        .gte('date', start)
        .lte('date', end);

      if (!exps) return;
      
      const sums: Record<string, number> = {};
      let t = 0;
      exps.forEach(e => {
        const amt = parseFloat(e.amount) || 0;
        sums[e.category] = (sums[e.category] || 0) + amt;
        t += amt;
      });

      const colors = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-rose-500", "bg-slate-500"];
      const formatted = Object.keys(sums).map((cat, i) => ({
        name: cat,
        amount: sums[cat],
        pct: t > 0 ? (sums[cat] / t) * 100 : 0,
        color: colors[i % colors.length]
      })).sort((a,b) => b.amount - a.amount).slice(0, 8);

      setData(formatted);
      setTotal(t);
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-foreground">Category Breakdown</h2>
        <span className="text-sm font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full">{format(new Date(), 'MMMM yyyy')}</span>
      </div>
      
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12 font-bold">No expenses found for this month yet.</p>
      ) : (
        <div className="space-y-6">
          <div className="mb-8">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total Spent</p>
            <p className="text-4xl font-black text-foreground tracking-tighter">${total.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          </div>
          {data.map(item => (
            <div key={item.name} className="space-y-2 group">
              <div className="flex justify-between text-sm font-black">
                <span className="text-foreground/80 flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  {item.name}
                </span>
                <span className="text-primary">${item.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full ${item.color} rounded-full transition-all group-hover:opacity-80`} 
                  style={{ width: `${item.pct}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MockupHistoricalPlans() {
  const [plans, setPlans] = useState<{month: string, target: number}[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('budget_plans').select('month, planned_amount');
      if (!data) return;

      const sums: Record<string, number> = {};
      data.forEach(d => {
        sums[d.month] = (sums[d.month] || 0) + parseFloat(d.planned_amount || 0);
      });

      const formatted = Object.keys(sums).map(m => ({ month: m, target: sums[m] }))
        .sort((a,b) => b.month.localeCompare(a.month)); 
      setPlans(formatted);
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-black text-foreground">Historical Budget Plans</h2>
      
      {plans.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12 font-bold">No budget plans found in database.</p>
      ) : (
        <div className="grid gap-4">
          {plans.map(p => (
            <div key={p.month} className="flex items-center justify-between p-5 rounded-2xl bg-muted/50 hover:bg-muted border border-border/20 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm">
                  <CalendarDays size={18} className="text-accent" />
                </div>
                <div>
                  <p className="font-black text-foreground text-sm">{p.month}</p>
                  <p className="text-xs font-bold text-muted-foreground">Target: ${p.target.toLocaleString()}</p>
                </div>
              </div>
              <ArrowRight size={18} className="text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MockupHistoricalTrends() {
  const [netWorth, setNetWorth] = useState(0);

  useEffect(() => {
    async function load() {
      const [ {data: liq}, {data: ast}, {data: lia} ] = await Promise.all([
        supabase.from('liquidity').select('balance'),
        supabase.from('assets').select('current_value'),
        supabase.from('liabilities').select('remaining')
      ]);

      let total = 0;
      (liq || []).forEach(x => total += parseFloat(x.balance || 0));
      (ast || []).forEach(x => total += parseFloat(x.current_value || 0));
      (lia || []).forEach(x => total -= parseFloat(x.remaining || 0));
      setNetWorth(total);
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-foreground">Net Worth Trends</h2>
        <select className="bg-muted text-xs font-bold px-3 py-1.5 rounded-lg outline-none border-none">
          <option>Last 6 Months</option>
          <option>Last Year</option>
        </select>
      </div>
      
      <div className="mb-4">
        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Current Net Worth</p>
        <p className="text-4xl font-black text-foreground tracking-tighter">${netWorth.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
      </div>

      <div className="w-full h-48 bg-muted/30 rounded-2xl border border-border/40 relative flex items-end justify-between px-4 pb-4 pt-10">
        {[40, 45, 55, 50, 70, 85].map((h, i) => (
          <div key={i} className="w-[12%] bg-gradient-to-t from-emerald-500/20 to-emerald-500 rounded-t-lg relative group">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] font-black px-2 py-1 rounded">
              Trend
            </div>
            <div className="h-full w-full rounded-t-lg" style={{ height: `${h}%` }} />
          </div>
        ))}
      </div>
      <p className="text-xs text-center text-muted-foreground font-bold italic">Note: Trend bars are faked here because there is no 'net_worth_history' table yet.</p>
    </div>
  );
}

function MockupHabitMatrix() {
  const [habits, setHabits] = useState<{name: string, logs: Record<string, string>}[]>([]);
  
  useEffect(() => {
    async function load() {
      const end = new Date();
      const start = subDays(end, 27); 
      
      const [ {data: confs}, {data: logs} ] = await Promise.all([
        supabase.from('habit_config').select('habit_name'),
        supabase.from('habit_data').select('habit, date, status').gte('date', format(start, 'yyyy-MM-dd'))
      ]);

      if (!confs || !logs) return;

      const grouped: Record<string, Record<string, string>> = {};
      confs.forEach(c => grouped[c.habit_name] = {});
      
      logs.forEach(l => {
        if (grouped[l.habit]) {
          grouped[l.habit][l.date] = l.status;
        }
      });

      setHabits(confs.map(c => ({ name: c.habit_name, logs: grouped[c.habit_name] })));
    }
    load();
  }, []);

  const days = Array.from({ length: 28 }).map((_, i) => format(subDays(new Date(), 27 - i), 'yyyy-MM-dd'));

  return (
    <div className="space-y-8 overflow-x-auto">
      <div className="flex items-center justify-between min-w-max">
        <h2 className="text-xl font-black text-foreground">28-Day Matrix</h2>
        <div className="flex gap-2">
          <span className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-[8px] text-emerald-500 font-black">✓</span>
          <span className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500 flex items-center justify-center text-[8px] text-amber-500 font-black">~</span>
          <span className="w-4 h-4 rounded bg-rose-500/20 border border-rose-500 flex items-center justify-center text-[8px] text-rose-500 font-black">!</span>
        </div>
      </div>
      
      {habits.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12 font-bold">No habits found.</p>
      ) : (
        <div className="space-y-6 min-w-max pb-4">
          {habits.map(habit => (
            <div key={habit.name} className="flex flex-col gap-2">
              <p className="text-sm font-black text-foreground/80">{habit.name}</p>
              <div className="flex gap-1.5">
                {days.map((d) => {
                  const status = habit.logs[d];
                  let colorClass = "bg-muted border-border/40";
                  let char = "";
                  if (status === 'Success') { colorClass = "bg-emerald-500/20 border-emerald-500 text-emerald-500"; char = "✓"; }
                  else if (status === 'Tolerance') { colorClass = "bg-amber-500/20 border-amber-500 text-amber-500"; char = "~"; }
                  else if (status === 'Critical') { colorClass = "bg-rose-500/20 border-rose-500 text-rose-500"; char = "!"; }
                  else if (status === 'Failure') { colorClass = "bg-muted border-rose-500/30 text-rose-500/50"; char = "✕"; }
                  
                  return (
                    <div 
                      key={d} 
                      title={`${d}: ${status || 'Not Entered'}`}
                      className={`w-5 h-5 rounded-sm border ${colorClass} flex items-center justify-center text-[10px] font-black hover:scale-125 hover:z-10 transition-all cursor-pointer shadow-sm`}
                    >
                      {char}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MockupAddVehicle() {
  return (
    <div className="space-y-8 max-w-sm mx-auto">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-4">
          <PlusCircle size={32} />
        </div>
        <h2 className="text-xl font-black text-foreground">Add New Vehicle</h2>
        <p className="text-xs font-bold text-muted-foreground">Register a car or bike to track fuel and services.</p>
      </div>
      <div className="space-y-4 pt-4">
        <input className="w-full h-12 bg-muted rounded-xl px-4 text-sm font-bold border-none focus:ring-2 focus:ring-accent/20" placeholder="Vehicle Name (e.g. Honda Civic)" />
        <select className="w-full h-12 bg-muted rounded-xl px-4 text-sm font-bold border-none focus:ring-2 focus:ring-accent/20">
          <option>Type: Car</option>
          <option>Type: Bike</option>
        </select>
        <button className="w-full h-12 bg-emerald-600 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-900/20 mt-4 active:scale-95 transition-all">
          Save Vehicle (Mockup)
        </button>
      </div>
    </div>
  );
}

function MockupLogService() {
  const [vehicles, setVehicles] = useState<{id:string, name:string}[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('vehicle_config').select('id, vehicle_name');
      if (data) setVehicles(data.map(v => ({id: v.id, name: v.vehicle_name})));
    }
    load();
  }, []);

  return (
    <div className="space-y-8 max-w-sm mx-auto">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wrench size={32} />
        </div>
        <h2 className="text-xl font-black text-foreground">Log Maintenance</h2>
        <p className="text-xs font-bold text-muted-foreground">Keep your vehicle service history up to date.</p>
      </div>
      <div className="space-y-4 pt-4">
        <select className="w-full h-12 bg-muted rounded-xl px-4 text-sm font-bold border-none focus:ring-2 focus:ring-blue-500/20">
          {vehicles.length === 0 && <option>Loading live vehicles...</option>}
          {vehicles.map(v => <option key={v.id}>Vehicle: {v.name}</option>)}
        </select>
        <button className="w-full h-12 bg-blue-600 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-900/20 mt-4 active:scale-95 transition-all">
          Record Service (Mockup)
        </button>
      </div>
    </div>
  );
}

// ---- NEW MOCKUP: Fuel & Service History ----
function MockupFuelServiceHistory() {
  const [vehicles, setVehicles] = useState<{id:string, name:string}[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [logs, setLogs] = useState<{type: 'Fuel'|'Service', date: string, odo: number, amount: number, details: string}[]>([]);

  useEffect(() => {
    async function loadVehicles() {
      const { data } = await supabase.from('vehicle_config').select('id, vehicle_name').order('vehicle_name');
      if (data && data.length > 0) {
        setVehicles(data.map((v: any) => ({ id: v.id, name: v.vehicle_name })));
        setSelectedVehicle(data[0].id);
      }
    }
    loadVehicles();
  }, []);

  useEffect(() => {
    if (!selectedVehicle) return;
    async function loadLogs() {
      const [{ data: fuel }, { data: service }] = await Promise.all([
        supabase.from('vehicle_fuel_logs').select('date, odometer, amount, liters').eq('vehicle_id', selectedVehicle),
        supabase.from('vehicle_service_logs').select('date, odometer, amount, details').eq('vehicle_id', selectedVehicle)
      ]);

      const combined: typeof logs = [];
      (fuel || []).forEach(f => combined.push({ type: 'Fuel', date: f.date, odo: f.odometer, amount: f.amount, details: `${f.liters}L Refuel` }));
      (service || []).forEach(s => combined.push({ type: 'Service', date: s.date, odo: s.odometer, amount: s.amount, details: s.details || 'General Service' }));
      
      combined.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setLogs(combined);
    }
    loadLogs();
  }, [selectedVehicle]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-black text-foreground">Timeline History</h2>
        <select 
          className="bg-muted text-xs font-bold px-3 py-1.5 rounded-lg outline-none border-none max-w-[200px]"
          value={selectedVehicle}
          onChange={(e) => setSelectedVehicle(e.target.value)}
        >
          {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </div>

      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12 font-bold">No fuel or service history found for this vehicle.</p>
      ) : (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border/50 before:to-transparent">
          {logs.map((log, i) => (
            <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-card bg-muted shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                {log.type === 'Fuel' ? <Activity size={14} className="text-emerald-500" /> : <Wrench size={14} className="text-blue-500" />}
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border border-border/40 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-black ${log.type === 'Fuel' ? 'text-emerald-500' : 'text-blue-500'}`}>{log.type}</span>
                  <span className="text-xs font-bold text-muted-foreground">{format(new Date(log.date), 'MMM d, yyyy')}</span>
                </div>
                <p className="text-sm font-bold text-foreground mb-2">{log.details}</p>
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-muted-foreground">{log.odo.toLocaleString()} km</span>
                  <span className="text-foreground">${parseFloat(log.amount.toString()).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- NEW MOCKUP: Vehicle Master Profile ----
function MockupVehicleMasterProfile() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('vehicle_config').select('*').order('vehicle_name');
      if (data && data.length > 0) {
        setVehicles(data);
        setSelectedVehicle(data[0]);
      }
    }
    load();
  }, []);

  if (!selectedVehicle) return <p className="text-center py-10">Loading vehicles...</p>;

  const today = new Date();
  const insDate = selectedVehicle.insurance_expiry ? new Date(selectedVehicle.insurance_expiry) : null;
  const srvDate = selectedVehicle.next_service_date ? new Date(selectedVehicle.next_service_date) : null;
  
  const insDays = insDate ? differenceInDays(insDate, today) : null;
  const srvDays = srvDate ? differenceInDays(srvDate, today) : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-black text-foreground">Profile & Reminders</h2>
        <select 
          className="bg-muted text-xs font-bold px-3 py-1.5 rounded-lg outline-none border-none max-w-[200px]"
          value={selectedVehicle.id}
          onChange={(e) => setSelectedVehicle(vehicles.find(v => v.id === e.target.value))}
        >
          {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Reminders Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Bell size={14} /> Action Required
          </h3>
          
          <div className={`p-4 rounded-2xl border flex items-start gap-4 ${insDays && insDays < 30 ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' : 'bg-muted/50 border-border/40'}`}>
            <div className={`p-2 rounded-xl mt-1 ${insDays && insDays < 30 ? 'bg-rose-500 text-white' : 'bg-background shadow-sm'}`}>
              {insDays && insDays < 30 ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} className="text-emerald-500" />}
            </div>
            <div>
              <p className="font-black text-sm text-foreground">Insurance Renewal</p>
              <p className="text-xs font-bold opacity-80 mb-2">Expires: {insDate ? format(insDate, 'MMM d, yyyy') : 'Not Set'}</p>
              {insDays !== null && (
                <span className={`text-[10px] font-black px-2 py-1 rounded-md ${insDays < 30 ? 'bg-rose-500/20' : 'bg-emerald-500/20 text-emerald-600'}`}>
                  {insDays} days remaining
                </span>
              )}
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-start gap-4 ${srvDays && srvDays < 30 ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' : 'bg-muted/50 border-border/40'}`}>
            <div className={`p-2 rounded-xl mt-1 ${srvDays && srvDays < 30 ? 'bg-amber-500 text-white' : 'bg-background shadow-sm'}`}>
              {srvDays && srvDays < 30 ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} className="text-emerald-500" />}
            </div>
            <div>
              <p className="font-black text-sm text-foreground">Next Routine Service</p>
              <p className="text-xs font-bold opacity-80 mb-2">Due By: {srvDate ? format(srvDate, 'MMM d, yyyy') : 'Not Set'}</p>
              {srvDays !== null && (
                <span className={`text-[10px] font-black px-2 py-1 rounded-md ${srvDays < 30 ? 'bg-amber-500/20' : 'bg-emerald-500/20 text-emerald-600'}`}>
                  {srvDays} days remaining
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Documents Section (No DB backing yet, pure mockup) */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <FileText size={14} /> Documents Vault
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-border/40 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 bg-muted/20 hover:bg-muted/50 transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <File size={18} />
              </div>
              <div>
                <p className="font-black text-xs text-foreground">Registration (RC)</p>
                <p className="text-[10px] font-bold text-muted-foreground">Upload PDF/Img</p>
              </div>
            </div>

            <div className="border border-border/40 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 bg-muted/20 hover:bg-muted/50 transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <File size={18} />
              </div>
              <div>
                <p className="font-black text-xs text-foreground">Insurance Policy</p>
                <p className="text-[10px] font-bold text-muted-foreground">Upload PDF/Img</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground font-bold italic mt-4">
            Documents vault is a visual mockup (requires cloud storage config).
          </p>
        </div>
      </div>
    </div>
  );
}

function MockupPersonalRecords() {
  const [prs, setPrs] = useState<{exercise: string, weight: number, date: string}[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('workout_log').select('workout_name, weight, date').gt('weight', 0);
      if (!data) return;

      const bests: Record<string, {w: number, d: string}> = {};
      data.forEach(log => {
        const wt = parseFloat(log.weight);
        if (!isNaN(wt)) {
          if (!bests[log.workout_name] || wt > bests[log.workout_name].w) {
            bests[log.workout_name] = { w: wt, d: log.date };
          }
        }
      });

      setPrs(Object.keys(bests).map(k => ({ exercise: k, weight: bests[k].w, date: bests[k].d })).sort((a,b) => b.weight - a.weight));
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-foreground">Personal Records (PRs)</h2>
        <Trophy className="text-amber-500" size={24} />
      </div>
      
      {prs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12 font-bold">No weighted workout logs found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {prs.map(pr => (
            <div key={pr.exercise} className="bg-gradient-to-br from-muted/50 to-muted p-5 rounded-3xl border border-border/40 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all text-amber-500">
                <Trophy size={100} />
              </div>
              <div className="flex items-center gap-3 mb-4 text-amber-500">
                <Activity size={20} />
                <span className="font-black text-sm text-foreground/80 truncate">{pr.exercise}</span>
              </div>
              <div>
                <p className="text-3xl font-black text-foreground tracking-tighter">{pr.weight} kg/lbs</p>
                <p className="text-xs font-bold text-muted-foreground mt-1">Achieved: {pr.date}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
