"use client";

import { Car, CheckCircle2, KanbanSquare, RefreshCw, TrendingUp, AlertCircle, Activity, GraduationCap, ChevronRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { format, differenceInDays, subDays, differenceInYears, differenceInMonths } from "date-fns";
import Link from "next/link";
import { Currency } from "@/components/currency";
import { toast } from "sonner";
import { TaskCompletionModal } from "@/components/TaskCompletionModal";


export default function DashboardPage() {
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
    workoutHistoryDetail: [] as any[],
    budgetPlanned: 0,
    budgetActual: 0,
  });

  const [alerts, setAlerts] = useState<any[]>([]);

  
  

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
  const [petsData, setPetsData] = useState<any[]>([]);
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
        { data: liabilitiesData },
        { data: habitsData },
        { data: habitConfigs },
        { data: workoutData },
        { data: tasksData },
        { data: vehiclesData },
        { data: budgetPlansData },
        { data: historyExpensesData },
        { data: actionTasksData },
        { data: inventoryItemsData },
        { data: actionProjectsData },
        { data: petMedicalData },
        { data: petProfilesData },
        { data: petLogsData }
      ] = await Promise.all([
        supabase.from('liquidity').select('balance'),
        supabase.from('assets').select('current_value'),
        supabase.from('liabilities').select('remaining'),
        supabase.from('habit_data').select('habit, status').eq('date', today),
        supabase.from('habit_config').select('habit_name, frequency, unlogged_is_success, group_name, group_display_order').eq('is_paused', false).eq('is_archived', false).eq('is_deleted', false),
        supabase.from('workout_log').select('date, workout_day, weight, reps').gte('date', sevenDaysAgo),
        supabase.from('tasks').select('*'),
        supabase.from('vehicle_config').select('id, vehicle_name, vehicle_type, insurance_expiry, next_service_date, initial_odometer'),
        supabase.from('budget_plans').select('category, subcategory, planned_amount').eq('month', currentMonthLabel),
        supabase.from('history_expenses').select('amount, type, category, subcategory, date').gte('date', startOfMonth),
        supabase.from('action_tasks').select('*'),
        supabase.from('inventory_items').select('*'),
        supabase.from('action_projects').select('id, name, sort_order'),
        supabase.from('pet_medical_logs').select('id, title, next_due_date, pet_profile(name)').not('next_due_date', 'is', null),
        supabase.from('pet_profile').select('*'),
        supabase.from('pet_logs').select('*').order('date', { ascending: false })
      ]);

      // 1. Financials
      const liq = (liquidityData || []).reduce((s, a) => s + (parseFloat(a.balance) || 0), 0);
      const ast = (assetsData || []).reduce((s, a) => s + (parseFloat(a.current_value) || 0), 0);
      const lib = (liabilitiesData || []).reduce((s, l) => s + (parseFloat(l.remaining) || 0), 0);
      const nw = liq + ast - lib;

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
          { data: allFuelLogs },
          { data: allServiceLogs }
        ] = await Promise.all([
          supabase.from('vehicle_fuel_logs').select('vehicle_id, odometer, liters, amount, date').in('vehicle_id', vehicleIds).order('date', { ascending: false }),
          supabase.from('vehicle_service_logs').select('vehicle_id, amount, date').in('vehicle_id', vehicleIds).order('date', { ascending: false })
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
      const systemAlerts: any[] = [];
      
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
      (actionTasksData || []).forEach((t: any) => {
        if (!t.completed && t.due) {
          const due = new Date(t.due);
          const days = differenceInDays(due, now);
          if (days < 0) {
            systemAlerts.push({ id: `task-overdue-${t.id}`, type: 'error', section: 'TASKS', text: `SquareShift: Overdue task "${t.text}" (${Math.abs(days)}d overdue)` });
          }
        }
      });

      // General Tasks High Priority Pending Warnings
      (tasksData || []).forEach((t: any) => {
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
      (inventoryItemsData || []).forEach((item: any) => {
        if (item.status === 'lent_out' && item.return_due_date) {
          const due = new Date(item.return_due_date);
          const days = differenceInDays(due, now);
          if (days < 0) {
            systemAlerts.push({ id: `inv-overdue-${item.id}`, type: 'error', section: 'FINANCE', text: `Lent out item overdue: "${item.name}" with ${item.lent_to_person} (${Math.abs(days)}d overdue)` });
          }
        }
      });

      // Pet Medical Warnings
      (petMedicalData || []).forEach((med: any) => {
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
      const processedPets = (petProfilesData || []).map((pet: any) => {
        const petLogs = (petLogsData || []).filter((log: any) => log.pet_id === pet.id);
        
        // Find last active exercise
        const actLogs = petLogs.filter((log: any) => log.category === 'Activities');
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
        const groomLogs = petLogs.filter((log: any) => log.category === 'Grooming');
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
          .filter((log: any) => log.category === 'Wellness' && log.next_due_date)
          .sort((a: any, b: any) => new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime())
          .slice(0, 3)
          .map((log: any) => {
            const nextDate = new Date(log.next_due_date);
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
    <div className="p-6 max-w-lg mx-auto bg-transparent min-h-screen pb-24 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end mb-4 px-2">
        <div>
          <h1 className="text-[32px] font-black text-foreground tracking-tight leading-none mb-2">
            {greeting}
          </h1>
          <div className="text-[12px] text-accent font-bold">
            {dateStr}
          </div>
          <div className="text-[10px] text-muted-foreground/50 font-black tracking-widest mt-1">
            VERSION 1.2
          </div>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="p-3.5 bg-card rounded-md shadow-sm text-foreground hover:bg-muted transition-all active:scale-95 border border-border/40"
        >
          <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>


      {/* Finance Intelligence - Consolidate Card */}
      <Link href="/expenses/net-worth" className="block group">
        <div className="bg-card rounded-md border border-border/40 shadow-zenith p-6 transition-all group-hover:scale-[1.01]">
          {/* Top Section: Net Worth Hero */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest mb-1">Net Worth</div>
              <div className={`text-[36px] font-black leading-none tracking-tighter ${stats.netWorth < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {isLoading ? "..." : <Currency value={stats.netWorth} />}
              </div>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-md">
              <TrendingUp size={20} className="text-emerald-500" />
            </div>
          </div>

          {/* Grid Section: Core Metrics */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div>
              <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-wider mb-1">Liquidity</div>
              <div className="text-[14px] font-black text-foreground">
                {isLoading ? "..." : <Currency value={stats.liquidity} />}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-wider mb-1">Assets</div>
              <div className="text-[14px] font-black text-foreground">
                {isLoading ? "..." : <Currency value={stats.assetsTotal} />}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-wider mb-1">Liabilities</div>
              <div className="text-[14px] font-black text-foreground">
                {isLoading ? "..." : <Currency value={stats.liabilitiesTotal} />}
              </div>
            </div>
          </div>

          {/* Bottom Section: Budget Pulse */}
          <div className="pt-5 border-t border-border/40">
            <div className="flex justify-between items-center mb-2">
              <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-wider">Budget Pulse</div>
              <div className="text-[10px] font-black text-foreground flex items-center gap-1">
                {isLoading ? "..." : <Currency value={stats.budgetActual} />} 
                <span className="text-muted-foreground/30">/</span> 
                {isLoading ? "..." : <Currency value={stats.budgetPlanned} />}
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden relative">
              <div 
                className={`absolute top-0 left-0 h-full transition-all ${ stats.budgetActual > stats.budgetPlanned ? 'bg-rose-500' : (stats.budgetActual / stats.budgetPlanned) > 0.8 ? 'bg-amber-500' : 'bg-emerald-500' }`}
                style={{ width: stats.budgetActual > 0 && stats.budgetPlanned === 0 ? '100%' : stats.budgetPlanned > 0 ? `${Math.min((stats.budgetActual / stats.budgetPlanned) * 100, 100)}%` : '0%' }}
              />
            </div>
          </div>
        </div>
      </Link>
      {/* Habits & Vehicles Row */}
      <div className="flex flex-col gap-4">
        <Link href="/habits/daily-log" className="bg-card rounded-md border border-border shadow-sm p-7 group hover:scale-[1.01] transition-all grid grid-rows-[auto_1fr_auto] gap-4 min-h-[220px]">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-black text-muted-foreground tracking-wider flex items-center gap-2">
              <CheckCircle2 size={16} className="text-accent" /> Habits
            </div>
          </div>
          
          <div className="flex flex-col space-y-5 py-1">
            {habitsCategories.length > 0 ? (
              habitsCategories.map((cat, i) => {
                const pct = cat.total > 0 ? Math.round((cat.done / cat.total) * 100) : 0;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="truncate text-foreground capitalize max-w-[100px]">{cat.name}</span>
                      <span className="text-[9px] text-muted-foreground font-black">{pct}% ({cat.done}/{cat.total})</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs font-bold text-muted-foreground/30 py-2">No habits configured</div>
            )}
          </div>
          
          <div className="pt-4 border-t border-border/10 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-black">
              <span className="text-muted-foreground">Overall</span>
              <span className="text-primary font-black">
                {stats.habitsTotal > 0 ? Math.round((stats.habitsDone / stats.habitsTotal) * 100) : 0}% ({stats.habitsDone}/{stats.habitsTotal})
              </span>
            </div>
            <div className="bg-muted rounded-md h-1.5 w-full overflow-hidden">
              <div 
                className="bg-primary h-full transition-all" 
                style={{ width: stats.habitsTotal > 0 ? `${(stats.habitsDone / stats.habitsTotal) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </Link>

        {/* Vehicles Card (Swipeable horizontal slider) */}
        <div className="bg-card rounded-md border border-border shadow-sm p-7 flex flex-col justify-between group hover:scale-[1.01] transition-all min-h-[220px]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-black text-muted-foreground tracking-wider flex items-center gap-2">
              <Car size={16} className="text-accent" /> Vehicles
            </div>
            <span className="text-[10px] font-black text-primary">{vehicleReminders.length} Active</span>
          </div>
          
          <div 
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 py-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onScroll={(e) => {
              const el = e.currentTarget;
              const idx = Math.round(el.scrollLeft / el.clientWidth);
              if (idx !== activeVehicleIndex && idx >= 0 && idx < vehicleReminders.length) {
                setActiveVehicleIndex(idx);
              }
            }}
          >
            {vehicleReminders.length > 0 ? (
              vehicleReminders.map((v, i) => (
                <Link key={i} href="/vehicles/fuel" className="min-w-full snap-center block flex flex-col justify-center space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-foreground capitalize truncate max-w-[120px]">{v.name}</span>
                    {v.lifetimeMileage !== null && (
                      <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {v.lifetimeMileage} km/L
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-muted/10 border border-border/10 rounded-lg p-2.5 flex flex-col">
                      <span className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">Insurance</span>
                      <span className={`text-xs font-black ${v.insuranceDays === null ? 'text-muted-foreground' : v.insuranceDays < 0 ? 'text-rose-500' : v.insuranceDays < 30 ? 'text-amber-500' : 'text-foreground'}`}>
                        {v.insuranceDays === null ? 'N/A' : `${v.insuranceDays}d`}
                      </span>
                    </div>
                    <div className="bg-muted/10 border border-border/10 rounded-lg p-2.5 flex flex-col">
                      <span className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">Service</span>
                      <span className={`text-xs font-black ${v.serviceDays === null ? 'text-muted-foreground' : v.serviceDays < 0 ? 'text-rose-500' : v.serviceDays < 14 ? 'text-amber-500' : 'text-foreground'}`}>
                        {v.serviceDays === null ? 'N/A' : `${v.serviceDays}d`}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-muted-foreground border-t border-border/10 pt-2">
                    <div>
                      <span className="block text-[8px] font-black uppercase text-muted-foreground/50">Last Service</span>
                      <span className="font-bold text-foreground">{v.lastServiceDate ? format(new Date(v.lastServiceDate), "d MMM yyyy") : "Never"}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[8px] font-black uppercase text-muted-foreground/50">Cost / km</span>
                      <span className="font-bold text-foreground">{v.costPerKm !== null ? `₹${v.costPerKm}` : "N/A"}</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="min-w-full text-xs font-bold text-muted-foreground/30 py-2 text-center snap-center">No vehicles registered</div>
            )}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 mt-2">
            {vehicleReminders.length > 1 && vehicleReminders.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === activeVehicleIndex ? 'bg-primary w-3' : 'bg-primary/20'}`} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Workout & Skills Row */}
      <div className="flex flex-col gap-4">
        {/* Workout Card (Swipeable horizontal slider) */}
        <div className="bg-card rounded-md border border-border shadow-sm p-7 flex flex-col justify-between group hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-black text-muted-foreground tracking-wider flex items-center gap-2">
              <Activity size={16} className="text-accent" /> Workout
            </div>
            <span className="text-[10px] font-black text-primary">
              {stats.workoutHistoryDetail[activeWorkoutIndex]?.label || "Today"}
            </span>
          </div>

          <div 
            ref={workoutScrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 py-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onScroll={(e) => {
              const el = e.currentTarget;
              const idx = Math.round(el.scrollLeft / el.clientWidth);
              if (idx !== activeWorkoutIndex && idx >= 0 && idx < 7) {
                setActiveWorkoutIndex(idx);
              }
            }}
          >
            {stats.workoutHistoryDetail && stats.workoutHistoryDetail.length > 0 ? (
              stats.workoutHistoryDetail.map((dayData, index) => (
                <Link key={index} href="/workout" className="min-w-full snap-center block flex flex-col justify-between space-y-1.5">
                  <div className={`text-[20px] font-black leading-tight tracking-tight ${dayData.logged ? 'text-emerald-500 truncate' : 'text-muted-foreground/30'}`}>
                    {dayData.logged ? dayData.dayName || "Logged" : "Not Logged"}
                  </div>
                  <div className="text-[9px] font-bold text-muted-foreground/60 tracking-tight">
                    {dayData.logged ? `${dayData.sets} Sets • ${dayData.volume.toLocaleString()} kg Volume` : (index === 6 ? "Swipe right to see yesterday's status" : "No workout logged on this day")}
                  </div>
                  <div className="h-2.5 flex items-end gap-1 mt-1.5">
                     {stats.workoutHistory7Days.length > 0 ? stats.workoutHistory7Days.map((isDone, i) => {
                        const isCurrentDay = i === index;
                        return (
                          <div 
                            key={i} 
                            className={`rounded-md transition-all duration-300 ${
                              isCurrentDay 
                                ? (isDone ? 'bg-emerald-500 h-2.5 shadow-sm shadow-emerald-500/30' : 'bg-primary h-2.5 shadow-sm shadow-primary/30') 
                                : (isDone ? 'bg-emerald-500/40 h-1.5' : 'bg-muted h-1.5')
                            }`} 
                            style={{ flex: 1 }}
                          />
                        );
                     }) : (
                        [1,2,3,4,5,6,7].map(i => <div key={i} className="flex-1 rounded-md bg-muted h-1.5" />)
                     )}
                  </div>
                </Link>
              ))
            ) : (
              <Link href="/workout" className="min-w-full snap-center block flex flex-col justify-between space-y-1.5">
                <div className="text-[20px] font-black leading-tight tracking-tight text-muted-foreground/30">
                  Not Logged
                </div>
                <div className="text-[9px] font-bold text-muted-foreground/60 tracking-tight">
                  Loading history...
                </div>
                <div className="h-1.5 flex gap-1 mt-1">
                  {[1,2,3,4,5,6,7].map(i => <div key={i} className="flex-1 rounded-md bg-muted" />)}
                </div>
              </Link>
            )}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 mt-3">
            {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
              <div 
                key={idx} 
                className={`w-1 h-1 rounded-full transition-all duration-300 ${idx === activeWorkoutIndex ? 'bg-primary w-2.5' : 'bg-primary/20'}`} 
              />
            ))}
          </div>
        </div>

        {/* Skills Focus Card */}
        {focusSkillDash ? (
          <Link href="/skills" className="bg-card rounded-md border border-border shadow-sm p-7 flex flex-col justify-between group hover:scale-[1.01] transition-all"
            style={{ borderLeft: `4px solid ${focusSkillDash.sessions >= focusSkillDash.target ? "#10b981" : focusSkillDash.color}` }}>
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-black text-muted-foreground tracking-wider flex items-center gap-2">
                <GraduationCap size={16} className="text-primary" /> Focus Skill
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {focusSkillDash.streak > 0 && (
                  <span className="text-[8px] font-black text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-full">
                    🔥 {focusSkillDash.streak}d
                  </span>
                )}
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl leading-none">{focusSkillDash.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-black text-foreground truncate leading-tight">{focusSkillDash.name}</div>
                  <div className="text-[9px] text-muted-foreground font-bold mt-0.5">
                    {focusSkillDash.sessions}/{focusSkillDash.target} sessions
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-muted rounded-md h-1.5 w-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${Math.min((focusSkillDash.sessions / focusSkillDash.target) * 100, 100)}%`, backgroundColor: focusSkillDash.sessions >= focusSkillDash.target ? "#10b981" : focusSkillDash.color }} />
            </div>
          </Link>
        ) : (
          <Link href="/skills" className="bg-card rounded-md border border-border shadow-sm p-7 flex flex-col justify-between group hover:scale-[1.01] transition-all min-h-[180px]">
            <div className="text-[10px] font-black text-muted-foreground tracking-wider flex items-center gap-2">
              <GraduationCap size={16} className="text-primary" /> Focus Skill
            </div>
            <div className="text-xs font-bold text-muted-foreground/30 py-4 text-center">No active focus skill</div>
            <div className="bg-muted rounded-md h-1.5 w-full overflow-hidden" />
          </Link>
        )}
      </div>

      {/* Dynamic Pets Cards (Swipeable horizontal slider full-width) */}
      {petsData.length > 0 && (
        <div className="bg-card rounded-md border border-border/40 shadow-zenith p-6 transition-all space-y-4">
          <div 
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 py-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onScroll={(e) => {
              const el = e.currentTarget;
              const idx = Math.round(el.scrollLeft / el.clientWidth);
              if (idx !== activePetIndex && idx >= 0 && idx < petsData.length) {
                setActivePetIndex(idx);
              }
            }}
          >
            {petsData.map((pet) => (
              <Link key={pet.id} href={`/pets/${pet.id}`} className="min-w-full snap-center block space-y-4">
                {/* Pet Header Profile */}
                <div className="flex items-center justify-between pb-3 border-b border-border/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black">
                      {pet.name[0]}
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-foreground">{pet.name} {pet.breed ? `(${pet.breed})` : ""}</h4>
                      <p className="text-[10px] text-muted-foreground font-bold">
                        {pet.weight ? `${pet.weight} kg` : ""} {pet.age ? `• ${pet.age}` : ""}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </div>

                {/* Activity Metric */}
                <div className="bg-muted/10 p-3.5 rounded-xl border border-border/20 flex justify-between items-center shadow-inner">
                  <div>
                    <span className="text-xs font-black block text-foreground">{pet.activity.title}</span>
                    <span className="text-[10px] text-muted-foreground font-normal leading-normal">{pet.activity.detail}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${pet.activity.days === null ? 'bg-muted text-muted-foreground/50' : pet.activity.days <= 1 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {pet.activity.days === null ? 'Never' : pet.activity.days === 0 ? 'Today' : pet.activity.days === 1 ? '1 Day Ago' : `${pet.activity.days} Days Ago`}
                    </span>
                  </div>
                </div>

                {/* Grooming Metric */}
                <div className="bg-muted/10 p-3.5 rounded-xl border border-border/20 flex justify-between items-center shadow-inner">
                  <div>
                    <span className="text-xs font-black block text-foreground">{pet.grooming.title}</span>
                    <span className="text-[10px] text-muted-foreground font-normal leading-normal">{pet.grooming.detail}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${pet.grooming.days === null ? 'bg-muted text-muted-foreground/50' : pet.grooming.days <= 7 ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-500'}`}>
                      {pet.grooming.days === null ? 'Never' : pet.grooming.days === 0 ? 'Today' : pet.grooming.days === 1 ? '1 Day Ago' : `${pet.grooming.days} Days Ago`}
                    </span>
                  </div>
                </div>

                {/* Next 3 Medical Dates */}
                {pet.medical.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {pet.medical.map((med: any, i: number) => (
                      <div key={i} className="bg-muted/15 border border-border/20 p-2.5 rounded-lg text-center shadow-sm">
                        <span className="text-[8px] font-black text-muted-foreground/60 block truncate uppercase tracking-wider mb-0.5">{med.title}</span>
                        <span className="text-[10px] font-black text-rose-500">{med.formattedDate}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 mt-2">
            {petsData.length > 1 && petsData.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === activePetIndex ? 'bg-primary w-3' : 'bg-primary/20'}`} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Focus Tasks & SquareShift Row */}
      <div className="flex flex-col gap-4">
        {/* Focus Tasks Card (Swipeable horizontal slider) */}
        <div className="bg-card rounded-md border border-border shadow-sm p-7 flex flex-col justify-between group hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-black text-muted-foreground tracking-wider flex items-center gap-2">
              <KanbanSquare size={16} className="text-accent" /> Focus Tasks
            </div>
            <span className="text-[10px] font-black text-primary">{stats.tasksDone}/{stats.tasksTotal} Done</span>
          </div>
          
          <div 
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 py-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onScroll={(e) => {
              const el = e.currentTarget;
              const idx = Math.round(el.scrollLeft / el.clientWidth);
              if (idx !== activeTaskIndex && idx >= 0 && idx < 3) {
                setActiveTaskIndex(idx);
              }
            }}
          >
            {/* Page 1: Today (High Priority) */}
            <Link href="/tasks" className="min-w-full snap-center block flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black text-rose-500 uppercase tracking-wider block mb-1">Today (High Priority)</span>
                <div className="space-y-1 pr-1">
                  {pendingTasks.todayHigh.length > 0 ? (
                    pendingTasks.todayHigh.map((task, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs font-bold text-foreground group/item">
                        <div
                          role="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCompleteTask(task.id, task.task);
                          }}
                          className="w-4 h-4 rounded border border-border/80 hover:border-rose-500 hover:bg-rose-500/10 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                        >
                          <div className="w-2 h-2 rounded bg-rose-500 scale-0 group-hover/item:scale-100 transition-transform duration-200" />
                        </div>
                        <span className="truncate">{task.task}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={13} /> All high-priority done
                    </div>
                  )}
                </div>
              </div>
            </Link>

            {/* Page 2: Today (Others) */}
            <Link href="/tasks" className="min-w-full snap-center block flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black text-accent uppercase tracking-wider block mb-1">Today (Normal)</span>
                <div className="space-y-1 pr-1">
                  {pendingTasks.todayNormal.length > 0 ? (
                    pendingTasks.todayNormal.map((task, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs font-bold text-foreground group/item">
                        <div
                          role="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCompleteTask(task.id, task.task);
                          }}
                          className="w-4 h-4 rounded border border-border/80 hover:border-accent hover:bg-accent/10 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                        >
                          <div className="w-2 h-2 rounded bg-accent scale-0 group-hover/item:scale-100 transition-transform duration-200" />
                        </div>
                        <span className="truncate">{task.task}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={13} /> All normal tasks done
                    </div>
                  )}
                </div>
              </div>
            </Link>

            {/* Page 3: This Week */}
            <Link href="/tasks" className="min-w-full snap-center block flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black text-primary uppercase tracking-wider block mb-1">This Week</span>
                <div className="space-y-1 pr-1">
                  {pendingTasks.thisWeek.length > 0 ? (
                    pendingTasks.thisWeek.map((task, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs font-bold text-foreground group/item">
                        <div
                          role="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCompleteTask(task.id, task.task);
                          }}
                          className="w-4 h-4 rounded border border-border/80 hover:border-primary hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                        >
                          <div className="w-2 h-2 rounded bg-primary scale-0 group-hover/item:scale-100 transition-transform duration-200" />
                        </div>
                        <span className="truncate">{task.task}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs font-bold text-muted-foreground/30">No weekly tasks pending</div>
                  )}
                </div>
              </div>
            </Link>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 mt-3">
            {[0, 1, 2].map((idx) => (
              <div 
                key={idx} 
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === activeTaskIndex ? 'bg-primary w-3' : 'bg-primary/20'}`} 
              />
            ))}
          </div>
        </div>

        {/* SquareShift Card (Swipeable horizontal slider) */}
        <div className="bg-card rounded-md border border-border shadow-sm p-7 flex flex-col justify-between group hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-black text-muted-foreground tracking-wider flex items-center gap-2">
              <KanbanSquare size={16} className="text-accent" /> SquareShift
            </div>
            <span className="text-[10px] font-black text-primary">
              {squareShiftProjects.reduce((s, p) => s + p.todoCount, 0)} Tasks
            </span>
          </div>

          <div 
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 py-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onScroll={(e) => {
              const el = e.currentTarget;
              const idx = Math.round(el.scrollLeft / el.clientWidth);
              if (idx !== activeProjectIndex && idx >= 0 && idx < squareShiftProjects.length) {
                setActiveProjectIndex(idx);
              }
            }}
          >
            {squareShiftProjects.length > 0 ? (
              squareShiftProjects.map((p, i) => (
                <Link key={i} href="/squareshift" className="min-w-full snap-center block flex flex-col justify-start">
                  <div className="flex items-center justify-between pb-1 border-b border-border/10">
                    <span className="truncate text-xs font-black text-foreground max-w-[120px]">{p.name}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${ p.todoCount > 0 ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground/40' }`}>
                      {p.todoCount} pending
                    </span>
                  </div>
                  
                  {/* Task list for this project */}
                  <div className="space-y-1 my-2">
                    {p.tasks.length > 0 ? (
                      p.tasks.slice(0, 3).map((task, taskIdx) => (
                        <div key={taskIdx} className="flex items-center gap-2.5 text-xs font-bold text-foreground group/item">
                          <div
                            role="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleCompleteSquareShiftTask(task.id, task.text);
                            }}
                            className="w-4 h-4 rounded border border-border/80 hover:border-accent hover:bg-accent/10 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                          >
                            <div className="w-2 h-2 rounded bg-accent scale-0 group-hover/item:scale-100 transition-transform duration-200" />
                          </div>
                          <span className="truncate">{task.text}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={12} /> All tasks completed
                      </div>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="min-w-full text-xs font-bold text-muted-foreground/30 py-2 text-center snap-center">No active projects</div>
            )}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 mt-3">
            {squareShiftProjects.length > 1 && squareShiftProjects.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === activeProjectIndex ? 'bg-primary w-3' : 'bg-primary/20'}`} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* ===================== SYSTEM ACTION CENTER ===================== */}
      {alerts.length > 0 && (
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-widest">
            <AlertCircle size={14} />
            <span>Action Center ({alerts.length} Warning{alerts.length > 1 ? 's' : ''})</span>
          </div>
          <div className="space-y-1.5 mt-2">
            {alerts.map((a, i) => (
              <div key={a.id || i} className="flex items-start gap-2 text-xs font-bold text-foreground/80">
                <span className="text-rose-500 mt-0.5">•</span>
                <span className="flex-1 text-[11px] leading-tight">{a.text}</span>
                <span className="text-[7px] font-black uppercase text-muted-foreground/50 bg-muted/40 px-1.5 py-0.5 rounded leading-none">{a.section}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <TaskCompletionModal 
        isOpen={taskModalOpen} 
        onClose={() => setTaskModalOpen(false)} 
        onConfirm={confirmTaskCompletion} 
        taskTitle={activeTask?.name || ""} 
      />
    </div>
  );
}


function MetricCard({ href, label, value, icon, color }: { href: string; label: string; value: React.ReactNode; icon: React.ReactNode; color: string }) {
  return (
    <Link href={href} className="bg-card rounded-md border border-border shadow-sm p-4 px-5 flex flex-col justify-between group hover:scale-[1.02] transition-all min-h-[100px]">
      <div className="text-[13px] font-black text-muted-foreground/80 flex items-center gap-2 whitespace-nowrap overflow-hidden">
        <div className="shrink-0">{icon}</div>
        <span className="truncate">{label}</span>
      </div>
      <div className={`text-[20px] font-black ${color} tracking-tight leading-none mb-1`}>
        {value}
      </div>
    </Link>
  );
}


function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="text-[10px] text-muted-foreground mb-1.5 font-black uppercase tracking-widest">{label}</div>
      <div className="bg-card rounded-xl p-3 border border-border shadow-sm">
      <div className="text-4xl mb-3 leading-none transition-transform group-hover:scale-110">{icon}</div>
      <div className={`text-[15px] font-black truncate ${color}`}>{value}</div>
    </div>
    </div>
  );
}

function TaskItem({ text, isLast }: { text: string; isLast?: boolean }) {
  return (
    <div className={`text-sm text-foreground py-3.5 flex items-center gap-4 ${!isLast ? 'border-b border-border/40' : ''}`}>
      <div className="w-5 h-5 rounded-md border-2 border-amber-200 shrink-0 flex items-center justify-center">
        <div className="w-2 h-2 rounded-md bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <span className="font-bold truncate">{text}</span>
    </div>
  );
}


