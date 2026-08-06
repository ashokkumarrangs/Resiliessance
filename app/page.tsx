"use client";

import { RefreshCw } from "lucide-react";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { format, differenceInDays, subDays, differenceInYears, differenceInMonths } from "date-fns";
import { toast } from "sonner";
import { TaskCompletionModal } from "@/components/TaskCompletionModal";
import { PageWrapper } from "@/components/PageWrapper";
import pkg from "../package.json";

import { useHabits } from "@/hooks/useHabits";
import { useVehicles } from "@/hooks/useVehicles";
import { usePets } from "@/hooks/usePets";

import { ActionCenterPanel } from "@/components/dashboard/ActionCenterPanel";
import { FinancialSummaryPanel } from "@/components/dashboard/FinancialSummaryPanel";
import { HabitTrackerPanel } from "@/components/dashboard/HabitTrackerPanel";
import { WorkoutVolumePanel } from "@/components/dashboard/WorkoutVolumePanel";
import { SkillsFocusPanel } from "@/components/dashboard/SkillsFocusPanel";
import { VehicleFleetPanel } from "@/components/dashboard/VehicleFleetPanel";
import { PetWellnessPanel, Pet } from "@/components/dashboard/PetWellnessPanel";
import { FocusTasksPanel } from "@/components/dashboard/FocusTasksPanel";
import { SquareShiftProjectsPanel } from "@/components/dashboard/SquareShiftProjectsPanel";


export default function DashboardPage() {
  const { getActiveConfigs, getLogsForDate } = useHabits();
  const { getVehicles, getFuelLogs, getServiceLogs } = useVehicles();
  const { getProfiles, getMedicalLogs, getActivityLogs } = usePets();
  const [greeting, setGreeting] = useState("Good Morning! 🌅");
  const [dateStr, setDateStr] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal state for Task completion
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<{ id: string; name: string; type: 'general' | 'squareshift' } | null>(null);

  const triggerTaskCompletion = (id: string, name: string, type: 'general' | 'squareshift') => {
    setActiveTask({ id, name, type });
    setTaskModalOpen(true);
  };

  const confirmTaskCompletion = async (completedAt: string) => {
    if (!activeTask) return;
    try {
      if (activeTask.type === 'general') {
        const { error } = await supabase.from('tasks').update({ status: 'Completed', completed_at: completedAt }).eq('id', activeTask.id);
        if (error) throw error;
        toast.success(`Task "${activeTask.name}" marked completed! ✅`);
      } else {
        const { error } = await supabase.from('action_tasks').update({ completed: true, completed_at: completedAt }).eq('id', activeTask.id);
        if (error) throw error;
        toast.success(`SquareShift task "${activeTask.name}" marked completed! ✅`);
      }
      fetchDashboardData();
    } catch (err: any) {
      toast.error(`Failed to update task: ${err.message}`);
    } finally {
      setActiveTask(null);
    }
  };


  
  // Stats State
  const [stats, setStats] = useState({
    liquidity: 0,
    assetsTotal: 0,
    receivablesTotal: 0,
    liabilitiesTotal: 0,
    netWorth: 0,
    tasksTotal: 0,
    tasksDone: 0,
    habitsTotal: 0,
    habitsDone: 0,
    workoutLogged: false,
    workoutDayName: "",
    workoutVolume: 0,
    workoutSets: 0,
    workoutLoggedYesterday: false,
    workoutDayNameYesterday: "",
    workoutVolumeYesterday: 0,
    workoutSetsYesterday: 0,
    workoutHistory7Days: [] as boolean[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    workoutHistoryDetail: [] as Record<string, any>[],
    budgetPlanned: 0,
    budgetActual: 0,
  });

  interface SystemAlert {
    id: string;
    type: string;
    section: string;
    text: string;
  }

  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  
  

  const [pendingTasks, setPendingTasks] = useState<{
    todayHigh: { id: string; task: string }[];
    todayNormal: { id: string; task: string }[];
    thisWeek: { id: string; task: string }[];
  }>({ todayHigh: [], todayNormal: [], thisWeek: [] });
  const [focusSkillDash, setFocusSkillDash] = useState<{id:string;name:string;icon:string;color:string;target:number;sessions:number;daysLeft:number|null;streak:number;practicedToday:boolean} | null>(null);
  const [vehicleReminders, setVehicleReminders] = useState<{
    name: string;
    type: 'ok' | 'warn' | 'error';
    lifetimeMileage: number | null;
    totalSpent: number;
    costPerKm: number | null;
    insuranceDays: number | null;
    insuranceExpiry: string | null;
    serviceDays: number | null;
    serviceDate: string | null;
    lastFuelDate: string | null;
    lastServiceDate: string | null;
  }[]>([]);
  const [fleetMonthlySpend, setFleetMonthlySpend] = useState(0);
  const [squareShiftProjects, setSquareShiftProjects] = useState<{ name: string; todoCount: number; tasks: { id: string; text: string }[] }[]>([]);
  const [fleetSummary, setFleetSummary] = useState<{ avgMileage: number | null; nextInsurance: { name: string; days: number; expiry: string } | null; nextService: { name: string; days: number; date: string } | null } | null>(null);
  const [habitsCategories, setHabitsCategories] = useState<{ name: string; done: number; total: number }[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [petsData, setPetsData] = useState<Record<string, any>[]>([]);
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);
  const [activeVehicleIndex, setActiveVehicleIndex] = useState(0);
  const [activePetIndex, setActivePetIndex] = useState(0);
  const [activeWorkoutIndex, setActiveWorkoutIndex] = useState(6);
  const workoutScrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hr = new Date().getHours();
    setGreeting(hr < 12 ? "Good Morning! 🌅" : hr < 17 ? "Good Afternoon! ☀️" : "Good Evening! 🌙");

    const d = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    setDateStr(`${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`);

    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (workoutScrollRef.current && stats.workoutHistoryDetail.length > 0) {
      workoutScrollRef.current.scrollLeft = workoutScrollRef.current.scrollWidth;
      setActiveWorkoutIndex(6);
    }
  }, [stats.workoutHistoryDetail]);

  const handleQuickLog = async (e: React.MouseEvent, skillId: string, skillName: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const { error } = await supabase.from("skill_logs").insert({
        skill_id: skillId,
        date: format(new Date(), "yyyy-MM-dd"),
        duration_minutes: 45,
        mood: "good",
        notes: "Quick log from dashboard"
      });
      if (error) throw error;
      toast.success(`Logged 45m practice for ${skillName}! 🔥`);
      fetchDashboardData();
    } catch (err: any) {
      toast.error(`Failed to log: ${err.message}`);
    }
  };

  const handleCompleteTask = async (taskId: string, taskName: string) => {
    triggerTaskCompletion(taskId, taskName, 'general');
  };

  const handleCompleteSquareShiftTask = async (taskId: string, taskText: string) => {
    triggerTaskCompletion(taskId, taskText, 'squareshift');
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    const today = format(new Date(), "yyyy-MM-dd");
    const sevenDaysAgo = format(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
    const startOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");
    const currentMonthLabel = format(new Date(), "yyyy-MM") + "-01";

    try {
      const [
        { data: liquidityData },
        { data: assetsData },
        { data: receivablesData },
        { data: liabilitiesData },
        habitsData,
        habitConfigs,
        { data: workoutData },
        { data: tasksData },
        vehiclesData,
        { data: budgetPlansData },
        { data: historyExpensesData },
        { data: actionTasksData },
        { data: inventoryItemsData },
        { data: actionProjectsData },
        petMedicalData,
        petProfilesData,
        petLogsData
      ] = await Promise.all([
        supabase.from('liquidity').select('balance'),
        supabase.from('assets').select('current_value'),
        supabase.from('receivables').select('remaining'),
        supabase.from('liabilities').select('remaining'),
        getLogsForDate(today),
        getActiveConfigs(),
        supabase.from('workout_log').select('date, workout_day, weight, reps').gte('date', sevenDaysAgo),
        supabase.from('tasks').select('*'),
        getVehicles(),
        supabase.from('budget_plans').select('category, subcategory, planned_amount').eq('month', currentMonthLabel),
        supabase.from('history_expenses').select('amount, type, category, subcategory, date').gte('date', startOfMonth),
        supabase.from('action_tasks').select('*'),
        supabase.from('inventory_items').select('*'),
        supabase.from('action_projects').select('id, name, sort_order'),
        getMedicalLogs(),
        getProfiles(),
        getActivityLogs()
      ]);

      // 1. Financials
      const liq = (liquidityData || []).reduce((s, a) => s + (parseFloat(a.balance) || 0), 0);
      const ast = (assetsData || []).reduce((s, a) => s + (parseFloat(a.current_value) || 0), 0);
      const rec = (receivablesData || []).reduce((s, l) => s + (parseFloat(l.remaining) || 0), 0);
      const lib = (liabilitiesData || []).reduce((s, l) => s + (parseFloat(l.remaining) || 0), 0);
      const nw = liq + ast + rec - lib;

      // 2. Habits
      const dailyCfg = (habitConfigs || []).filter(h => h.frequency === 'daily' || !h.frequency);
      const eventCfg = (habitConfigs || []).filter(h => h.frequency === 'event');
      const hTotal = dailyCfg.length + eventCfg.length;
      
      const loggedNames = new Set((habitsData || []).map(h => h.habit));
      const avoidUnloggedCount = dailyCfg.filter(c => c.unlogged_is_success && !loggedNames.has(c.habit_name)).length;
      
      // 'done' means it was logged/added today, not necessarily 'Success'
      const hSuccess = (habitsData || []).length + avoidUnloggedCount;

      const habitsByGroup: { [key: string]: { done: number; total: number; order: number } } = {};
      (habitConfigs || []).forEach(config => {
        const group = config.group_name || 'Core';
        if (!habitsByGroup[group]) {
          habitsByGroup[group] = { done: 0, total: 0, order: config.group_display_order ?? 999 };
        }
        habitsByGroup[group].total += 1;

        const isLogged = loggedNames.has(config.habit_name);
        const isCompleted = isLogged || config.unlogged_is_success;
        
        if (isCompleted) {
          habitsByGroup[group].done += 1;
        }
      });

      const categoriesArray = Object.entries(habitsByGroup).map(([name, s]) => ({
        name,
        done: s.done,
        total: s.total,
        order: s.order
      })).sort((a, b) => a.order - b.order || b.total - a.total);
      setHabitsCategories(categoriesArray);

      // 3. Tasks
      const todayTasks = (tasksData || []).filter(t => t.is_today);
      const pendingHigh = (tasksData || []).filter(t => t.status === 'Pending' && t.is_today && t.is_high_priority).map(t => ({ id: t.id, task: t.task }));
      const pendingNormal = (tasksData || []).filter(t => t.status === 'Pending' && t.is_today && !t.is_high_priority).map(t => ({ id: t.id, task: t.task }));
      const pendingWeek = (tasksData || []).filter(t => t.status === 'Pending' && !t.is_today && t.is_week).map(t => ({ id: t.id, task: t.task }));
      const doneCount = todayTasks.filter(t => t.status === 'Completed').length;

      // 4. Vehicles
      const now = new Date();
      const reminders: typeof vehicleReminders = [];
      let monthlySpend = 0;

      if (vehiclesData && vehiclesData.length > 0) {
        const vehicleIds = vehiclesData.map(v => v.id);
        const [
          allFuelLogs,
          allServiceLogs
        ] = await Promise.all([
          getFuelLogs(vehicleIds),
          getServiceLogs(vehicleIds)
        ]);

        for (const v of vehiclesData) {
          const fuelLogs = (allFuelLogs || []).filter(log => log.vehicle_id === v.id);
          const serviceLogs = (allServiceLogs || []).filter(log => log.vehicle_id === v.id);

          // Lifetime mileage
          const totalLiters = fuelLogs.reduce((s, r) => s + (r.liters || 0), 0);
          const maxOdo = Math.max(...fuelLogs.map(l => l.odometer || 0), v.initial_odometer || 0);
          const dist = maxOdo - (v.initial_odometer || 0);
          const lifetimeMileage = dist > 0 && totalLiters > 0 ? parseFloat((dist / totalLiters).toFixed(1)) : null;

          // Spend
          const totalFuel = fuelLogs.reduce((s, r) => s + (r.amount || 0), 0);
          const totalService = serviceLogs.reduce((s, r) => s + (r.amount || 0), 0);
          const costPerKm = dist > 0 ? parseFloat(((totalFuel + totalService) / dist).toFixed(2)) : null;
          monthlySpend += fuelLogs.filter(r => r.date >= startOfMonth).reduce((s, r) => s + (r.amount || 0), 0);
          monthlySpend += serviceLogs.filter(r => r.date >= startOfMonth).reduce((s, r) => s + (r.amount || 0), 0);

          // Compliance
          const insuranceDays = v.insurance_expiry ? differenceInDays(new Date(v.insurance_expiry), now) : null;
          const serviceDays = v.next_service_date ? differenceInDays(new Date(v.next_service_date), now) : null;
          let status: 'ok' | 'warn' | 'error' = 'ok';
          if (insuranceDays === null || insuranceDays < 0) status = 'error';
          else if (insuranceDays < 30) status = 'warn';
          if (serviceDays !== null && serviceDays < 0) status = 'error';
          else if (serviceDays !== null && serviceDays < 14 && status === 'ok') status = 'warn';

          reminders.push({
            name: v.vehicle_name,
            type: status,
            lifetimeMileage,
            totalSpent: totalFuel + totalService,
            costPerKm,
            insuranceDays,
            insuranceExpiry: v.insurance_expiry,
            serviceDays,
            serviceDate: v.next_service_date,
            lastFuelDate: fuelLogs[0]?.date || null,
            lastServiceDate: serviceLogs[0]?.date || null,
          });
        }
      }
      setVehicleReminders(reminders);
      setFleetMonthlySpend(monthlySpend);

      // Workout processing
      const wData = workoutData || [];
      const todayWorkout = wData.filter(w => w.date === today);
      const workoutLogged = todayWorkout.length > 0;
      const workoutDayName = workoutLogged ? todayWorkout[0].workout_day : "";
      const workoutSets = todayWorkout.length;
      const workoutVolume = todayWorkout.reduce((sum, w) => sum + ((parseFloat(w.weight) || 0) * (parseInt(w.reps) || 0)), 0);

      const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
      const yesterdayWorkout = wData.filter(w => w.date === yesterday);
      const workoutLoggedYesterday = yesterdayWorkout.length > 0;
      const workoutDayNameYesterday = workoutLoggedYesterday ? yesterdayWorkout[0].workout_day : "";
      const workoutSetsYesterday = yesterdayWorkout.length;
      const workoutVolumeYesterday = yesterdayWorkout.reduce((sum, w) => sum + ((parseFloat(w.weight) || 0) * (parseInt(w.reps) || 0)), 0);

      const historyDetail = [];
      for (let i = 6; i >= 0; i--) {
        const dObj = subDays(new Date(), i);
        const dStr = format(dObj, "yyyy-MM-dd");
        let label = "";
        if (i === 0) label = "Today";
        else if (i === 1) label = "Yesterday";
        else label = format(dObj, "EEEE, MMM d");

        const dayWorkouts = wData.filter(w => w.date === dStr);
        const logged = dayWorkouts.length > 0;
        const dayName = logged ? dayWorkouts[0].workout_day : "";
        const sets = dayWorkouts.length;
        const volume = dayWorkouts.reduce((sum, w) => sum + ((parseFloat(w.weight) || 0) * (parseInt(w.reps) || 0)), 0);

        historyDetail.push({
          dateStr: dStr,
          label,
          logged,
          dayName,
          sets,
          volume
        });
      }

      const hist = [];
      for (let i = 6; i >= 0; i--) {
        const d = format(new Date(Date.now() - i * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
        hist.push(wData.some(w => w.date === d));
      }

      // Budget processing
      const planned = (budgetPlansData || []).reduce((sum, b) => sum + (parseFloat(b.planned_amount) || 0), 0);
      const actual = (historyExpensesData || [])
        .filter(e => e.type === 'Expense')
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

      setStats({
        liquidity: liq,
        assetsTotal: ast,
        receivablesTotal: rec,
        liabilitiesTotal: lib,
        netWorth: nw,
        tasksTotal: todayTasks.length,
        tasksDone: doneCount,
        habitsTotal: hTotal,
        habitsDone: hSuccess,
        workoutLogged,
        workoutDayName,
        workoutVolume,
        workoutSets,
        workoutLoggedYesterday,
        workoutDayNameYesterday,
        workoutVolumeYesterday,
        workoutSetsYesterday,
        workoutHistory7Days: hist,
        workoutHistoryDetail: historyDetail,
        budgetPlanned: planned,
        budgetActual: actual,
      });

      setPendingTasks({
        todayHigh: pendingHigh,
        todayNormal: pendingNormal,
        thisWeek: pendingWeek
      });
      setVehicleReminders(reminders);
      setFleetMonthlySpend(monthlySpend);

      // 6. Skills Focus Card
      try {
        const { data: sfData } = await supabase.from("skill_items").select("*").eq("status", "focus").maybeSingle();
        if (sfData) {
          const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");
          const monthEnd   = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "yyyy-MM-dd");
          
          const { data: sfLogs } = await supabase.from("skill_logs").select("id").eq("skill_id", sfData.id).gte("date", monthStart).lte("date", monthEnd);
          const { data: allLogs } = await supabase.from("skill_logs").select("date").eq("skill_id", sfData.id).order("date", { ascending: false });
          
          const logDates = [...new Set((allLogs || []).map(l => l.date))];
          const todayStr = format(new Date(), "yyyy-MM-dd");
          
          let streak = 0;
          const practicedToday = logDates.includes(todayStr);
          let checkDate = practicedToday ? new Date() : subDays(new Date(), 1);
          
          while (true) {
            const checkStr = format(checkDate, "yyyy-MM-dd");
            if (logDates.includes(checkStr)) {
              streak++;
              checkDate = subDays(checkDate, 1);
            } else {
              break;
            }
          }

          const daysLeft = differenceInDays(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), new Date());
          setFocusSkillDash({
            id: sfData.id,
            name: sfData.name,
            icon: sfData.icon,
            color: sfData.color,
            target: sfData.target_sessions_per_month,
            sessions: (sfLogs || []).length,
            daysLeft,
            streak,
            practicedToday
          });
        } else { setFocusSkillDash(null); }
      } catch(_e) { setFocusSkillDash(null); }

      // 5. Calculate Warnings for Action Center
      const systemAlerts: SystemAlert[] = [];
      
      // Vehicles Compliance Warnings
      (vehiclesData || []).forEach(v => {
        if (v.insurance_expiry) {
          const exp = new Date(v.insurance_expiry);
          const days = differenceInDays(exp, now);
          if (days < 0) {
            systemAlerts.push({ id: `ins-exp-${v.id}`, type: 'error', section: 'VEHICLES', text: `${v.vehicle_name} insurance EXPIRED by ${Math.abs(days)} days!` });
          } else if (days < 30) {
            systemAlerts.push({ id: `ins-warn-${v.id}`, type: 'warning', section: 'VEHICLES', text: `${v.vehicle_name} insurance expires in ${days} days.` });
          }
        }
        if (v.next_service_date) {
          const svc = new Date(v.next_service_date);
          const days = differenceInDays(svc, now);
          if (days < 0) {
            systemAlerts.push({ id: `svc-exp-${v.id}`, type: 'error', section: 'VEHICLES', text: `${v.vehicle_name} service is OVERDUE by ${Math.abs(days)} days!` });
          } else if (days < 14) {
            systemAlerts.push({ id: `svc-warn-${v.id}`, type: 'warning', section: 'VEHICLES', text: `${v.vehicle_name} service is due in ${days} days.` });
          }
        }
      });

      // SquareShift Task Overdue Warnings
      (actionTasksData || []).forEach((t) => {
        if (!t.completed && t.due) {
          const due = new Date(t.due);
          const days = differenceInDays(due, now);
          if (days < 0) {
            systemAlerts.push({ id: `task-overdue-${t.id}`, type: 'error', section: 'TASKS', text: `SquareShift: Overdue task "${t.text}" (${Math.abs(days)}d overdue)` });
          }
        }
      });

      // General Tasks High Priority Pending Warnings
      (tasksData || []).forEach((t) => {
        if (t.is_high_priority && t.status === 'Pending') {
          systemAlerts.push({ id: `task-high-${t.id}`, type: 'warning', section: 'TASKS', text: `High priority task pending: "${t.task}"` });
        }
      });

      // Budget Warnings
      (budgetPlansData || []).forEach(p => {
        const catActual = (historyExpensesData || []).filter(e => e.type === 'Expense' && e.category === p.category && e.subcategory === p.subcategory).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
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

      // Inventory Overdue Warnings
      (inventoryItemsData || []).forEach((item) => {
        if (item.status === 'lent_out' && item.return_due_date) {
          const due = new Date(item.return_due_date);
          const days = differenceInDays(due, now);
          if (days < 0) {
            systemAlerts.push({ id: `inv-overdue-${item.id}`, type: 'error', section: 'FINANCE', text: `Lent out item overdue: "${item.name}" with ${item.lent_to_person} (${Math.abs(days)}d overdue)` });
          }
        }
      });

      // Pet Medical Warnings
      (petMedicalData || []).forEach((med) => {
        if (med.next_due_date) {
          const due = new Date(med.next_due_date);
          const days = differenceInDays(due, now);
          const petName = med.pet_profile?.name || "Pet";
          if (days < 0) {
            systemAlerts.push({ id: `pet-med-overdue-${med.id}`, type: 'error', section: 'PETS', text: `${petName}: Overdue "${med.title}" (${Math.abs(days)}d overdue)` });
          } else if (days <= 30) {
            systemAlerts.push({ id: `pet-med-warn-${med.id}`, type: 'warning', section: 'PETS', text: `${petName}: "${med.title}" is due in ${days} days.` });
          }
        }
      });

      // 7. SquareShift Projects
      const projects = (actionProjectsData || []).map(p => {
        const projectTasks = (actionTasksData || []).filter(t => t.project_id === p.id && !t.completed);
        return { 
          name: p.name, 
          todoCount: projectTasks.length,
          tasks: projectTasks.map(t => ({ id: t.id, text: t.text }))
        };
      }).sort((a, b) => b.todoCount - a.todoCount);
      setSquareShiftProjects(projects);

      // 8. Fleet Summary
      if (reminders.length > 0) {
        const mileages = reminders.map(r => r.lifetimeMileage).filter((m): m is number => m !== null);
        const avgMileage = mileages.length > 0 ? parseFloat((mileages.reduce((a, b) => a + b, 0) / mileages.length).toFixed(1)) : null;

        const insurances = reminders.map(r => ({ name: r.name, days: r.insuranceDays, expiry: r.insuranceExpiry })).filter(i => i.days !== null);
        insurances.sort((a, b) => (a.days ?? 0) - (b.days ?? 0));
        const nextInsurance = insurances[0] ? { name: insurances[0].name, days: insurances[0].days as number, expiry: insurances[0].expiry as string } : null;

        const services = reminders.map(r => ({ name: r.name, days: r.serviceDays, date: r.serviceDate })).filter(s => s.days !== null);
        services.sort((a, b) => (a.days ?? 0) - (b.days ?? 0));
        const nextService = services[0] ? { name: services[0].name, days: services[0].days as number, date: services[0].date as string } : null;

        setFleetSummary({ avgMileage, nextInsurance, nextService });
      } else {
        setFleetSummary(null);
      }

      // 9. Process Pets Data
      const processedPets = (petProfilesData || []).map((pet) => {
        const petLogs = (petLogsData || []).filter((log) => log.pet_id === pet.id);
        
        // Find last active exercise
        const actLogs = petLogs.filter((log) => log.category === 'Activities');
        let activityStatus = { title: "No Exercise logged", detail: "N/A", days: null as number | null };
        if (actLogs.length > 0) {
          const lastAct = actLogs[0];
          const days = differenceInDays(now, new Date(lastAct.date));
          activityStatus = {
            title: lastAct.log_type || "Exercise",
            detail: `Last session: ${lastAct.notes || lastAct.log_type || ""}`,
            days: days
          };
        }

        // Find last grooming
        const groomLogs = petLogs.filter((log) => log.category === 'Grooming');
        let groomingStatus = { title: "No Grooming logged", detail: "N/A", days: null as number | null };
        if (groomLogs.length > 0) {
          const lastGroom = groomLogs[0];
          const days = differenceInDays(now, new Date(lastGroom.date));
          groomingStatus = {
            title: lastGroom.log_type || "Grooming",
            detail: `Groomed with: ${lastGroom.notes || lastGroom.log_type || ""}`,
            days: days
          };
        }

        // Find next 3 medical appointments (where next_due_date exists and category is Wellness)
        const medLogs = petLogs
          .filter((log) => log.category === 'Wellness' && log.next_due_date)
          .sort((a, b) => new Date(a.next_due_date!).getTime() - new Date(b.next_due_date!).getTime())
          .slice(0, 3)
          .map((log) => {
            const nextDate = new Date(log.next_due_date!);
            return {
              title: log.log_type || "Wellness",
              formattedDate: format(nextDate, "d MMM")
            };
          });

        // Calculate pet age
        let ageStr = "";
        if (pet.dob) {
          const dobDate = new Date(pet.dob);
          const years = differenceInYears(now, dobDate);
          const months = differenceInMonths(now, dobDate) % 12;
          if (years === 0) {
            ageStr = `${months} Month${months !== 1 ? 's' : ''}`;
          } else {
            ageStr = `${years} Year${years !== 1 ? 's' : ''}, ${months} Month${months !== 1 ? 's' : ''}`;
          }
        }

        return {
          id: pet.id,
          name: pet.name,
          breed: pet.breed || pet.species || "",
          weight: pet.weight,
          age: ageStr,
          activity: activityStatus,
          grooming: groomingStatus,
          medical: medLogs
        };
      });
      setPetsData(processedPets);

      setAlerts(systemAlerts);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <PageWrapper
      customHeader={
        <div className="flex justify-between items-end mb-4 px-2">
          <div>
            <h1 className="text-[32px] font-black text-foreground tracking-tight leading-none mb-2">
              {greeting}
            </h1>
            <div className="text-[12px] text-accent font-bold">
              {dateStr}
            </div>
            <div className="text-[10px] text-muted-foreground/50 font-black tracking-widest mt-1">
              VERSION {pkg.version}
            </div>
          </div>
          <button 
            onClick={fetchDashboardData}
            className="p-3.5 bg-card rounded-md shadow-sm text-foreground hover:bg-muted transition-all active:scale-95 border border-border/40"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <FinancialSummaryPanel 
          isLoading={isLoading}
          netWorth={stats.netWorth}
          liquidity={stats.liquidity}
          assetsTotal={stats.assetsTotal}
          receivablesTotal={stats.receivablesTotal}
          liabilitiesTotal={stats.liabilitiesTotal}
          budgetActual={stats.budgetActual}
          budgetPlanned={stats.budgetPlanned}
        />

        <HabitTrackerPanel 
          habitsCategories={habitsCategories}
          habitsDone={stats.habitsDone}
          habitsTotal={stats.habitsTotal}
        />

        <VehicleFleetPanel 
          vehicleReminders={vehicleReminders}
          activeVehicleIndex={activeVehicleIndex}
          setActiveVehicleIndex={setActiveVehicleIndex}
        />

        <WorkoutVolumePanel 
          workoutHistoryDetail={stats.workoutHistoryDetail as any}
          workoutHistory7Days={stats.workoutHistory7Days}
          activeWorkoutIndex={activeWorkoutIndex}
          setActiveWorkoutIndex={setActiveWorkoutIndex}
          workoutScrollRef={workoutScrollRef}
        />

        <SkillsFocusPanel 
          focusSkillDash={focusSkillDash}
        />

        <PetWellnessPanel 
          petsData={petsData as unknown as Pet[]}
          activePetIndex={activePetIndex}
          setActivePetIndex={setActivePetIndex}
        />

        <FocusTasksPanel 
          pendingTasks={pendingTasks}
          activeTaskIndex={activeTaskIndex}
          setActiveTaskIndex={setActiveTaskIndex}
          handleCompleteTask={handleCompleteTask}
          tasksDone={stats.tasksDone}
          tasksTotal={stats.tasksTotal}
        />

        <SquareShiftProjectsPanel 
          squareShiftProjects={squareShiftProjects}
          activeProjectIndex={activeProjectIndex}
          setActiveProjectIndex={setActiveProjectIndex}
          handleCompleteSquareShiftTask={handleCompleteSquareShiftTask}
        />

        <ActionCenterPanel alerts={alerts} />
      </div>

      <TaskCompletionModal 
        isOpen={taskModalOpen} 
        onClose={() => setTaskModalOpen(false)} 
        onConfirm={confirmTaskCompletion} 
        taskTitle={activeTask?.name || ""} 
      />
    </PageWrapper>
  );
}
