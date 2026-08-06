"use client";

import React, { useState, useEffect, useMemo } from "react";
import { format, subDays, addDays, parseISO, startOfWeek, endOfWeek, differenceInDays } from "date-fns";
import { toast } from "sonner";
import {
  Apple,
  Plus,
  Trash2,
  Search,
  Settings,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Calendar,
  Check,
  Save,
  BarChart3,
  BookOpen,
  LayoutDashboard,
  Utensils,
  PlusCircle,
  HelpCircle,
  TrendingUp,
  AlertCircle,
  Scale,
  Sparkles,
  Info,
  CalendarDays,
  Activity
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  ComposedChart,
  Area
} from "recharts";
import { PageWrapper } from "@/components/PageWrapper";
import { LoadingScreen } from "@/components/LoadingScreen";
import {
  dietService,
  DietTarget,
  FoodLibraryItem,
  DietLogEntry,
  DietWeightLog,
  MealCombo,
  MealComboItem,
  BiometricDefinition,
  BiometricLog,
  BiometricTarget
} from "@/lib/services/diet";

export default function DietPage() {
  const [activeTab, setActiveTab] = useState<"logs" | "weight" | "library">("logs");
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Core Data State
  const [target, setTarget] = useState<DietTarget>({
    calories: 2000,
    protein: 130,
    carbs: 220,
    fat: 65,
    fiber: 25,
    water_goal: 3000
  });
  const [foodLibrary, setFoodLibrary] = useState<FoodLibraryItem[]>([]);
  const [logs, setLogs] = useState<DietLogEntry[]>([]);
  const [waterMl, setWaterMl] = useState<number>(0);
  const [weightLogs, setWeightLogs] = useState<DietWeightLog[]>([]);
  const [weightGoal, setWeightGoal] = useState<number>(75);
  const [combos, setCombos] = useState<MealCombo[]>([]);

  // Modals & Forms State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isCustomFoodModalOpen, setIsCustomFoodModalOpen] = useState(false);
  const [isWeightGoalModalOpen, setIsWeightGoalModalOpen] = useState(false);
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);

  // Goal Form State
  const [goalForm, setGoalForm] = useState<DietTarget>({ ...target });
  const [weightGoalInput, setWeightGoalInput] = useState<string>("75");

  // Log Form State
  const [logFormTab, setLogFormTab] = useState<"library" | "manual" | "combo" | "supplement">("library");
  const [logMealType, setLogMealType] = useState<DietLogEntry["meal_type"]>("breakfast");
  
  // Log Form - Library Option
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFoodId, setSelectedFoodId] = useState<string>("");
  const [logQuantity, setLogQuantity] = useState<number>(1);

  // Log Form - Manual Option
  const [manualForm, setManualForm] = useState({
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0
  });

  // Log Form - Combo Option
  const [selectedComboId, setSelectedComboId] = useState<string>("");

  // Log Form - Supplement Option
  const [supplementName, setSupplementName] = useState("");

  // Custom Food Form State
  const [customFoodForm, setCustomFoodForm] = useState({
    name: "",
    serving_size: 100,
    serving_unit: "g",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0
  });

  // Combo Creator Form State
  const [comboFormName, setComboFormName] = useState("");
  const [comboFormItems, setComboFormItems] = useState<{ food_id: string; quantity: number }[]>([
    { food_id: "", quantity: 1 }
  ]);

  // Weight Log Form State
  const [weightInput, setWeightInput] = useState<string>("");
  const [weightNotes, setWeightNotes] = useState<string>("");
  const [weightLogDate, setWeightLogDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  // Biometrics & Body Tracking States
  const [biometricDefs, setBiometricDefs] = useState<BiometricDefinition[]>([]);
  const [biometricLogs, setBiometricLogs] = useState<BiometricLog[]>([]);
  const [biometricTargets, setBiometricTargets] = useState<BiometricTarget[]>([]);
  const [activeMetricId, setActiveMetricId] = useState<string>("weight");

  // Logging Form for active biometric
  const [biometricInputVal, setBiometricInputVal] = useState<string>("");
  const [biometricInputDate, setBiometricInputDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [biometricInputNotes, setBiometricInputNotes] = useState<string>("");

  // Target Form
  const [isEditingBiometricTarget, setIsEditingBiometricTarget] = useState<boolean>(false);
  const [biometricTargetInput, setBiometricTargetInput] = useState<string>("");

  // Modal State for creating a new metric type
  const [isCreateMetricModalOpen, setIsCreateMetricModalOpen] = useState<boolean>(false);
  const [newMetricName, setNewMetricName] = useState<string>("");
  const [newMetricUnit, setNewMetricUnit] = useState<string>("");

  // Library Sub-tab State
  const [librarySubTab, setLibrarySubTab] = useState<"custom" | "combos">("custom");

  // Report Date Range State
  const [reportDaysRange, setReportDaysRange] = useState<number>(15);

  // Load Initial Data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const loadedTarget = await dietService.getTarget();
        const loadedLibrary = await dietService.getFoodLibrary();
        const loadedLogs = await dietService.getLogsForDate(selectedDate);
        const loadedWater = await dietService.getWaterLogForDate(selectedDate);
        const loadedWeightLogs = await dietService.getWeightLogs();
        const loadedWeightGoal = await dietService.getWeightGoal();
        const loadedCombos = await dietService.getCombos();
        const loadedDefs = await dietService.getBiometricDefinitions();
        const loadedBiometricLogs = await dietService.getBiometricsLogs();
        const loadedBiometricTargets = await dietService.getBiometricTargets();

        setTarget(loadedTarget);
        setGoalForm(loadedTarget);
        setFoodLibrary(loadedLibrary);
        setLogs(loadedLogs);
        setWaterMl(loadedWater);
        setWeightLogs(loadedWeightLogs);
        setWeightGoal(loadedWeightGoal);
        setWeightGoalInput(String(loadedWeightGoal));
        setCombos(loadedCombos);
        setBiometricDefs(loadedDefs);
        setBiometricLogs(loadedBiometricLogs);
        setBiometricTargets(loadedBiometricTargets);
      } catch (err) {
        console.error("Error loading data:", err);
        toast.error("Failed to load diet data");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [selectedDate]);



  // Calculate Logged Totals for Selected Date
  const totals = useMemo(() => {
    return logs.reduce(
      (acc, log) => {
        const mult = log.quantity;
        acc.calories += Math.round(log.calories * mult);
        acc.protein += Number((log.protein * mult).toFixed(1));
        acc.carbs += Number((log.carbs * mult).toFixed(1));
        acc.fat += Number((log.fat * mult).toFixed(1));
        acc.fiber += Number((log.fiber * mult).toFixed(1));
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  }, [logs]);

  // Weight statistics
  const weightStats = useMemo(() => {
    if (weightLogs.length === 0) return { current: null, goal: weightGoal, weeklyAvg: null, change7d: null };
    
    // Sort weight logs descending
    const sorted = [...weightLogs].sort((a, b) => b.date.localeCompare(a.date));
    const current = sorted[0]?.weight || null;

    // 7-day change
    let change7d = null;
    if (sorted.length > 0) {
      const todayLog = sorted[0];
      const date7dAgo = format(subDays(parseISO(todayLog.date), 7), "yyyy-MM-dd");
      // Find closest log around 7 days ago
      const log7d = weightLogs.find((w) => w.date === date7dAgo) || 
                    weightLogs.filter((w) => w.date <= date7dAgo).sort((a,b) => b.date.localeCompare(a.date))[0];
      if (log7d) {
        change7d = Number((todayLog.weight - log7d.weight).toFixed(1));
      }
    }

    // Weekly Average (Current Week)
    const now = new Date();
    const startOfCurrentWeek = format(startOfWeek(now), "yyyy-MM-dd");
    const endOfCurrentWeek = format(endOfWeek(now), "yyyy-MM-dd");
    const currentWeekLogs = weightLogs.filter(w => w.date >= startOfCurrentWeek && w.date <= endOfCurrentWeek);
    const weeklyAvg = currentWeekLogs.length > 0
      ? Number((currentWeekLogs.reduce((sum, w) => sum + w.weight, 0) / currentWeekLogs.length).toFixed(1))
      : null;

    return {
      current,
      goal: weightGoal,
      weeklyAvg,
      change7d
    };
  }, [weightLogs, weightGoal]);

  // Filters food library based on search
  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) return foodLibrary;
    return foodLibrary.filter((food) =>
      food.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [foodLibrary, searchQuery]);

  // Selected food detail for library preview
  const selectedFoodItem = useMemo(() => {
    return foodLibrary.find((food) => food.id === selectedFoodId);
  }, [foodLibrary, selectedFoodId]);

  // Target Goal updates
  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const saved = await dietService.saveTarget(goalForm);
      setTarget(saved);
      setIsGoalModalOpen(false);
      toast.success("Daily targets updated! 🎯");
    } catch {
      toast.error("Failed to save goals");
    } finally {
      setIsSaving(false);
    }
  };

  // Log food, custom manual, combo, or supplement entry
  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (logFormTab === "library") {
        if (!selectedFoodId) {
          toast.error("Please select a food item");
          setIsSaving(false);
          return;
        }
        const food = foodLibrary.find((f) => f.id === selectedFoodId);
        if (!food) throw new Error("Food not found");

        await dietService.addLogEntry({
          date: selectedDate,
          meal_type: logMealType,
          food_name: food.name,
          serving_size: food.serving_size,
          serving_unit: food.serving_unit,
          quantity: logQuantity,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          fiber: food.fiber,
          is_supplement: false
        });
      } else if (logFormTab === "manual") {
        if (!manualForm.name.trim()) {
          toast.error("Please enter food name");
          setIsSaving(false);
          return;
        }
        await dietService.addLogEntry({
          date: selectedDate,
          meal_type: logMealType,
          food_name: manualForm.name,
          serving_size: 1,
          serving_unit: "serving",
          quantity: 1,
          calories: manualForm.calories,
          protein: manualForm.protein,
          carbs: manualForm.carbs,
          fat: manualForm.fat,
          fiber: manualForm.fiber,
          is_supplement: false
        });
      } else if (logFormTab === "combo") {
        if (!selectedComboId) {
          toast.error("Please select a combo template");
          setIsSaving(false);
          return;
        }
        const selectedCombo = combos.find((c) => c.id === selectedComboId);
        if (!selectedCombo) throw new Error("Combo not found");

        // Log all items inside combo
        for (const item of selectedCombo.items) {
          const food = foodLibrary.find((f) => f.id === item.food_id);
          if (food) {
            await dietService.addLogEntry({
              date: selectedDate,
              meal_type: logMealType,
              food_name: food.name,
              serving_size: food.serving_size,
              serving_unit: food.serving_unit,
              quantity: item.quantity,
              calories: food.calories,
              protein: food.protein,
              carbs: food.carbs,
              fat: food.fat,
              fiber: food.fiber,
              is_supplement: false
            });
          }
        }
      } else {
        // Supplement
        if (!supplementName.trim()) {
          toast.error("Please enter supplement name");
          setIsSaving(false);
          return;
        }
        await dietService.addLogEntry({
          date: selectedDate,
          meal_type: "supplement",
          food_name: supplementName,
          serving_size: 1,
          serving_unit: "tablet",
          quantity: 1,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          is_supplement: true
        });
      }

      // Reload logs
      const loadedLogs = await dietService.getLogsForDate(selectedDate);
      setLogs(loadedLogs);
      setIsLogModalOpen(false);
      
      // Reset forms
      setSelectedFoodId("");
      setLogQuantity(1);
      setSearchQuery("");
      setSelectedComboId("");
      setManualForm({ name: "", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
      setSupplementName("");

      toast.success("Logged successfully! 🍽️");
    } catch (err) {
      toast.error("Failed to save entry");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Logged Entry
  const handleDeleteLog = async (id: string) => {
    try {
      const ok = await dietService.deleteLogEntry(id);
      if (ok) {
        setLogs(logs.filter((l) => l.id !== id));
        toast.success("Entry removed");
      }
    } catch {
      toast.error("Failed to delete entry");
    }
  };

  // Add Custom Food Preset
  const handleAddCustomFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFoodForm.name.trim()) {
      toast.error("Please enter food name");
      return;
    }
    setIsSaving(true);
    try {
      await dietService.addCustomFood(customFoodForm);
      const loadedLibrary = await dietService.getFoodLibrary();
      setFoodLibrary(loadedLibrary);
      setIsCustomFoodModalOpen(false);
      setCustomFoodForm({
        name: "",
        serving_size: 100,
        serving_unit: "g",
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
      });
      toast.success("Saved to Food Library presets! 📚");
    } catch {
      toast.error("Failed to save food");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Preset Food
  const handleDeletePresetFood = async (id: string) => {
    try {
      const ok = await dietService.deleteCustomFood(id);
      if (ok) {
        setFoodLibrary(foodLibrary.filter((f) => f.id !== id));
        toast.success("Preset deleted");
      }
    } catch {
      toast.error("Failed to delete preset");
    }
  };

  // Combo Creator Actions
  const handleAddComboItemRow = () => {
    setComboFormItems([...comboFormItems, { food_id: "", quantity: 1 }]);
  };

  const handleRemoveComboItemRow = (index: number) => {
    const updated = [...comboFormItems];
    updated.splice(index, 1);
    setComboFormItems(updated);
  };

  const handleUpdateComboItemRow = (index: number, field: "food_id" | "quantity", value: any) => {
    const updated = [...comboFormItems];
    updated[index] = {
      ...updated[index],
      [field]: field === "quantity" ? parseFloat(value) || 0 : value
    };
    setComboFormItems(updated);
  };

  const handleCreateCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comboFormName.trim()) {
      toast.error("Please enter combo template name");
      return;
    }
    // Validate rows
    const validRows = comboFormItems.filter((item) => item.food_id && item.quantity > 0);
    if (validRows.length === 0) {
      toast.error("Please add at least one food preset with quantity");
      return;
    }

    setIsSaving(true);
    try {
      await dietService.addCombo(comboFormName, validRows);
      const loadedCombos = await dietService.getCombos();
      setCombos(loadedCombos);
      setIsComboModalOpen(false);
      
      // Reset combo builder
      setComboFormName("");
      setComboFormItems([{ food_id: "", quantity: 1 }]);
      toast.success(`Combo "${comboFormName}" created successfully! 📦`);
    } catch {
      toast.error("Failed to create combo");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCombo = async (id: string) => {
    try {
      const ok = await dietService.deleteCombo(id);
      if (ok) {
        setCombos(combos.filter((c) => c.id !== id));
        toast.success("Combo template deleted");
      }
    } catch {
      toast.error("Failed to delete combo");
    }
  };

  // Log weight submission
  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const wNum = parseFloat(weightInput);
    if (isNaN(wNum) || wNum <= 0) {
      toast.error("Please enter a valid weight in kg");
      return;
    }
    setIsSaving(true);
    try {
      await dietService.addWeightLog(weightLogDate, wNum, weightNotes);
      const loadedWeightLogs = await dietService.getWeightLogs();
      setWeightLogs(loadedWeightLogs);
      
      // Reset form
      setWeightInput("");
      setWeightNotes("");
      toast.success(`Weight of ${wNum} kg logged! ⚖️`);
    } catch {
      toast.error("Failed to log weight");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWeightLog = async (id: string) => {
    try {
      const ok = await dietService.deleteWeightLog(id);
      if (ok) {
        setWeightLogs(weightLogs.filter((w) => w.id !== id));
        toast.success("Weight entry deleted");
      }
    } catch {
      toast.error("Failed to delete weight log");
    }
  };

  const handleSaveWeightGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(weightGoalInput);
    if (isNaN(val) || val <= 0) {
      toast.error("Please enter a valid goal weight");
      return;
    }
    setIsSaving(true);
    try {
      await dietService.saveWeightGoal(val);
      setWeightGoal(val);
      setIsWeightGoalModalOpen(false);
      toast.success(`Target weight updated to ${val} kg! 🎯`);
    } catch {
      toast.error("Failed to save goal");
    } finally {
      setIsSaving(false);
    }
  };

  // Biometrics Logging Handlers
  const handleSaveBiometricLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(biometricInputVal);
    if (isNaN(val)) {
      toast.error("Please enter a valid numeric value");
      return;
    }

    setIsSaving(true);
    try {
      const saved = await dietService.saveBiometricLog(
        activeMetricId,
        val,
        biometricInputDate,
        biometricInputNotes
      );
      
      const refreshedLogs = await dietService.getBiometricsLogs();
      setBiometricLogs(refreshedLogs);
      
      if (activeMetricId === "weight") {
        const refreshedWeightLogs = await dietService.getWeightLogs();
        setWeightLogs(refreshedWeightLogs);
      }
      
      setBiometricInputVal("");
      setBiometricInputNotes("");
      toast.success("Measurement logged successfully! ✅");
    } catch {
      toast.error("Failed to log measurement");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBiometricLog = async (id: string) => {
    try {
      await dietService.deleteBiometricLog(id);
      const refreshedLogs = await dietService.getBiometricsLogs();
      setBiometricLogs(refreshedLogs);
      
      if (activeMetricId === "weight") {
        const refreshedWeightLogs = await dietService.getWeightLogs();
        setWeightLogs(refreshedWeightLogs);
      }
      toast.success("Log deleted");
    } catch {
      toast.error("Failed to delete log");
    }
  };

  const handleSaveBiometricTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(biometricTargetInput);
    if (isNaN(val)) {
      toast.error("Please enter a valid numeric value");
      return;
    }

    setIsSaving(true);
    try {
      await dietService.saveBiometricTarget(activeMetricId, val);
      const refreshedTargets = await dietService.getBiometricTargets();
      setBiometricTargets(refreshedTargets);
      
      if (activeMetricId === "weight") {
        const refreshedWeightGoal = await dietService.getWeightGoal();
        setWeightGoal(refreshedWeightGoal);
        setWeightGoalInput(String(refreshedWeightGoal));
      }
      
      setIsEditingBiometricTarget(false);
      setBiometricTargetInput("");
      toast.success("Target goal updated! ✅");
    } catch {
      toast.error("Failed to save target goal");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateMetricType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMetricName.trim() || !newMetricUnit.trim()) {
      toast.error("Please fill in both name and unit");
      return;
    }

    setIsSaving(true);
    try {
      const newDef = await dietService.addBiometricDefinition(newMetricName, newMetricUnit);
      const refreshedDefs = await dietService.getBiometricDefinitions();
      setBiometricDefs(refreshedDefs);
      setActiveMetricId(newDef.id);
      
      setNewMetricName("");
      setNewMetricUnit("");
      setIsCreateMetricModalOpen(false);
      toast.success(`Metric type "${newDef.name}" created! 🚀`);
    } catch {
      toast.error("Failed to create metric type");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdjustWater = async (amount: number) => {
    const nextVal = Math.max(0, waterMl + amount);
    setWaterMl(nextVal);
    try {
      await dietService.saveWaterLog(selectedDate, nextVal);
    } catch {
      toast.error("Failed to save water log");
    }
  };

  const shiftDate = (days: number) => {
    const nextDate = addDays(parseISO(selectedDate), days);
    setSelectedDate(format(nextDate, "yyyy-MM-dd"));
  };

  const setDateToToday = () => {
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
  };

  const formatHeaderDate = (dateStr: string) => {
    try {
      const parsed = parseISO(dateStr);
      return format(parsed, "EEEE, MMMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  const STANDARD_SUPPLEMENTS = [
    { name: "Multivitamin", category: "Vitamins" },
    { name: "Creatine Monohydrate", category: "Fitness" },
    { name: "Vitamin D3", category: "Vitamins" },
    { name: "Omega-3 Fish Oil", category: "Health" },
    { name: "Magnesium Bisglycinate", category: "Sleep/Recovery" }
  ];

  const handleToggleSupplement = async (suppName: string) => {
    const existingLog = logs.find((l) => l.is_supplement && l.food_name === suppName);
    if (existingLog) {
      await handleDeleteLog(existingLog.id);
      toast.success(`Removed ${suppName} log`);
    } else {
      try {
        await dietService.addLogEntry({
          date: selectedDate,
          meal_type: "supplement",
          food_name: suppName,
          serving_size: 1,
          serving_unit: "tablet",
          quantity: 1,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          is_supplement: true
        });
        const loadedLogs = await dietService.getLogsForDate(selectedDate);
        setLogs(loadedLogs);
        toast.success(`Logged ${suppName} taken! ✅`);
      } catch {
        toast.error("Failed to log supplement");
      }
    }
  };

  // ─── UNIFIED NAVIGATION TABS ───
  // These map to standard component navigation structures
  const unifiedTabs = [
    {
      title: "Daily Log",
      icon: <Utensils size={18} />,
      isActive: activeTab === "logs",
      onClick: () => setActiveTab("logs")
    },
    {
      title: "Biometrics & Body",
      icon: <Activity size={18} />,
      isActive: activeTab === "weight",
      onClick: () => setActiveTab("weight")
    },
    {
      title: "Library & Combos",
      icon: <BookOpen size={18} />,
      isActive: activeTab === "library",
      onClick: () => setActiveTab("library")
    }
  ];

  return (
    <PageWrapper
      title="Nutrition"
      reportHref="/reports/nutrition"
      sectionTabs={unifiedTabs}
      activePath="/diet"
      className="pb-32"
    >
      {/* ─── TAB 2: DAILY LOG ─── */}
      {activeTab === "logs" && (
        <div className="space-y-6">
          {/* Date Picker Switcher */}
          <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-4 flex items-center justify-between">
            <button
              onClick={() => shiftDate(-1)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xs font-black text-foreground">
                {formatHeaderDate(selectedDate)}
              </span>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={setDateToToday}
                  className="text-[9px] font-bold text-primary hover:underline"
                >
                  Go to Today
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-4 h-4 opacity-0 absolute cursor-pointer"
                  id="date-picker-input-logs"
                />
                <label
                  htmlFor="date-picker-input-logs"
                  className="text-[9px] font-bold text-muted-foreground cursor-pointer hover:underline flex items-center gap-0.5"
                >
                  <Calendar size={10} /> Choose Custom
                </label>
              </div>
            </div>
            <button
              onClick={() => shiftDate(1)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Meals Logging breakdown */}
          {(["breakfast", "lunch", "dinner", "snack", "supplement"] as const).map(
            (mealType) => {
              const mealLogs = logs.filter((l) => l.meal_type === mealType);
              const mealCalories = mealLogs.reduce((sum, item) => sum + Math.round(item.calories * item.quantity), 0);

              const categoryDetails = {
                breakfast: { label: "Breakfast", color: "text-amber-500", bg: "bg-amber-500/10" },
                lunch: { label: "Lunch", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                dinner: { label: "Dinner", color: "text-indigo-500", bg: "bg-indigo-500/10" },
                snack: { label: "Snacks", color: "text-rose-500", bg: "bg-rose-500/10" },
                supplement: { label: "Supplements", color: "text-sky-500", bg: "bg-sky-500/10" }
              }[mealType];

              return (
                <div key={mealType} className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border/10 bg-muted/10">
                    <div className="flex items-center gap-3">
                      <span className={`p-2 rounded-xl font-bold text-xs ${categoryDetails.bg} ${categoryDetails.color}`}>
                        <Utensils size={14} />
                      </span>
                      <div>
                        <h4 className="text-xs font-black uppercase text-foreground leading-none">
                          {categoryDetails.label}
                        </h4>
                        {mealType !== "supplement" && (
                          <span className="text-[9px] font-bold text-muted-foreground/60 mt-0.5 block">
                            {mealCalories} kcal logged
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setLogMealType(mealType);
                        setLogFormTab(mealType === "supplement" ? "supplement" : "library");
                        setIsLogModalOpen(true);
                      }}
                      className="flex items-center gap-1 text-[10px] font-black text-primary hover:underline"
                    >
                      <Plus size={12} strokeWidth={3} /> Add
                    </button>
                  </div>

                  <div className="p-4 space-y-3.5">
                    {mealLogs.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground/50 italic py-2 text-center">
                        No logs added yet for {categoryDetails.label.toLowerCase()}.
                      </p>
                    ) : (
                      <div className="divide-y divide-border/10">
                        {mealLogs.map((item, idx) => (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between ${
                              idx > 0 ? "pt-3.5" : ""
                            } ${idx < mealLogs.length - 1 ? "pb-3.5" : ""}`}
                          >
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-foreground">
                                {item.food_name}
                              </span>
                              <span className="text-[10px] font-medium text-muted-foreground/60 mt-1">
                                {item.quantity} × {item.serving_size} {item.serving_unit}
                                {item.calories > 0 && ` • ${Math.round(item.calories * item.quantity)} kcal`}
                              </span>
                              {item.calories > 0 && (
                                <span className="text-[9px] font-bold text-muted-foreground/40 mt-0.5">
                                  P: {(item.protein * item.quantity).toFixed(1)}g | C: {(item.carbs * item.quantity).toFixed(1)}g | F: {(item.fat * item.quantity).toFixed(1)}g
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteLog(item.id)}
                              className="text-muted-foreground hover:text-rose-500 p-2 hover:bg-rose-500/10 rounded-xl transition duration-300"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          )}

          {/* Water Intake & Supplements Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Water */}
            <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
                    <Droplets size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-foreground leading-none">Water Intake</h3>
                    <span className="text-[9px] font-bold text-muted-foreground/60 mt-1 block">Hydration tracker</span>
                  </div>
                </div>
                <span className="text-xs font-black text-sky-500">
                  {waterMl} / {target.water_goal} ml
                </span>
              </div>
              <div className="flex gap-1 justify-between py-1">
                {[250, 500, 750, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000].map((step, idx) => (
                  <div
                    key={idx}
                    className={`h-6 flex-1 rounded-sm transition-all duration-300 ${
                      waterMl >= step ? "bg-sky-500 shadow-sm" : "bg-muted/40 border border-border/10"
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAdjustWater(-250)}
                  disabled={waterMl <= 0}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-muted hover:bg-muted/70 text-foreground transition-all duration-300"
                >
                  -250 ml
                </button>
                <button
                  onClick={() => handleAdjustWater(250)}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-sky-500 hover:bg-sky-600 text-white transition-all duration-300 shadow-md shadow-sky-500/10"
                >
                  +250 ml
                </button>
              </div>
            </div>

            {/* Supplements Checklist */}
            <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-6 space-y-4">
              <div>
                <h3 className="text-sm font-black uppercase text-foreground leading-none">Supplements Checklist</h3>
                <p className="text-[10px] font-bold text-muted-foreground/60 mt-1">
                  Click a row to toggle supplement log above
                </p>
              </div>
              <div className="divide-y divide-border/20 max-h-[170px] overflow-y-auto no-scrollbar">
                {STANDARD_SUPPLEMENTS.map((supp, index) => {
                  const isLogged = logs.some(
                    (l) => l.is_supplement && l.food_name === supp.name
                  );
                  return (
                    <div
                      key={index}
                      onClick={() => handleToggleSupplement(supp.name)}
                      className="flex items-center justify-between py-2 cursor-pointer group hover:bg-muted/30 px-2 -mx-2 rounded-lg transition-all"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground group-hover:text-primary transition-all">
                          {supp.name}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider mt-0.5">
                          {supp.category}
                        </span>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all border ${
                          isLogged
                            ? "bg-primary border-primary text-white shadow-sm shadow-primary/20 scale-105"
                            : "border-border hover:border-muted-foreground/40 bg-muted/20"
                        }`}
                      >
                        {isLogged && <Check size={14} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: BIOMETRICS & BODY TAB ─── */}
      {activeTab === "weight" && (() => {
        const activeMetric = biometricDefs.find(d => d.id === activeMetricId) || { id: "weight", name: "Body Weight", unit: "kg" };
        const activeLogs = biometricLogs.filter(l => l.metric_type === activeMetricId);
        const latestLog = activeLogs[0];
        const activeTarget = biometricTargets.find(t => t.metric_type === activeMetricId);

        return (
          <div className="space-y-6">
            {/* Metric Switcher Row */}
            <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                  <Activity size={20} />
                </span>
                <div>
                  <h3 className="text-sm font-black uppercase text-foreground leading-none">Biometrics & Body</h3>
                  <span className="text-[10px] font-bold text-muted-foreground/60 mt-1 block">Log and track dynamic physiological metrics</span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={activeMetricId}
                  onChange={(e) => {
                    setActiveMetricId(e.target.value);
                    setIsEditingBiometricTarget(false);
                  }}
                  className="bg-muted border-none rounded-xl h-10 px-4 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20 cursor-pointer w-full sm:w-56"
                >
                  {biometricDefs.map((def) => (
                    <option key={def.id} value={def.id}>
                      {def.name} ({def.unit})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setIsCreateMetricModalOpen(true)}
                  className="py-2.5 px-4 rounded-xl text-xs font-black bg-primary text-white shadow-lg shadow-primary/10 hover:bg-primary/95 transition shrink-0"
                >
                  + Add Metric
                </button>
              </div>
            </div>

            {/* Current & Target Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Value Display */}
              <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-6 flex flex-col justify-center min-h-[140px]">
                <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">Current {activeMetric.name}</span>
                <span className="text-3xl font-black text-foreground mt-2">
                  {latestLog ? `${latestLog.value} ${activeMetric.unit}` : `-- ${activeMetric.unit}`}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground/40 mt-2">
                  {latestLog ? `Logged on ${format(parseISO(latestLog.date), "MMM d, yyyy")}` : "No entries logged yet"}
                </span>
              </div>

              {/* Target Goal Display */}
              <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-6 flex flex-col justify-center min-h-[140px] relative group">
                <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">Target Goal</span>
                {isEditingBiometricTarget ? (
                  <form onSubmit={handleSaveBiometricTarget} className="mt-2 flex gap-2 w-full">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Goal value"
                      value={biometricTargetInput}
                      onChange={(e) => setBiometricTargetInput(e.target.value)}
                      className="bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20 w-full"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-4 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-black shadow-sm"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingBiometricTarget(false);
                        setBiometricTargetInput("");
                      }}
                      className="px-3 bg-muted hover:bg-muted/70 text-foreground rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <span className="text-3xl font-black text-foreground mt-2">
                      {activeTarget ? `${activeTarget.target_value} ${activeMetric.unit}` : `-- ${activeMetric.unit}`}
                    </span>
                    <button
                      onClick={() => {
                        setBiometricTargetInput(activeTarget ? String(activeTarget.target_value) : "");
                        setIsEditingBiometricTarget(true);
                      }}
                      className="absolute right-4 top-4 text-[10px] font-black text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Set Goal
                    </button>
                    <span className="text-[10px] font-bold text-muted-foreground/45 mt-2">
                      {latestLog && activeTarget ? (
                        <>
                          {latestLog.value === activeTarget.target_value ? (
                            "Goal achieved! 🎉"
                          ) : (
                            `${Math.abs(latestLog.value - activeTarget.target_value).toFixed(1)} ${activeMetric.unit} to target`
                          )}
                        </>
                      ) : (
                        "No goal threshold set yet"
                      )}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Log & History Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Log Entry Form */}
              <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-black uppercase text-foreground leading-none">Log {activeMetric.name}</h3>
                  <p className="text-[10px] font-bold text-muted-foreground/60 mt-1">
                    Record a new entry for this biometric category
                  </p>
                </div>

                <form onSubmit={handleSaveBiometricLog} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground/60">Date</label>
                      <input
                        type="date"
                        value={biometricInputDate}
                        onChange={(e) => setBiometricInputDate(e.target.value)}
                        className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground/60">Value ({activeMetric.unit})</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 74.5"
                        value={biometricInputVal}
                        onChange={(e) => setBiometricInputVal(e.target.value)}
                        className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground/60">Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Morning fasting, post training"
                      value={biometricInputNotes}
                      onChange={(e) => setBiometricInputNotes(e.target.value)}
                      className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-black shadow-lg shadow-primary/10 transition-all duration-300"
                  >
                    Save Entry
                  </button>
                </form>
              </div>

              {/* Scrollable list of logs */}
              <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-6 flex flex-col justify-between h-[310px] overflow-hidden">
                <div>
                  <h3 className="text-sm font-black uppercase text-foreground leading-none">History Logs</h3>
                  <p className="text-[10px] font-bold text-muted-foreground/60 mt-1">
                    Recent readings list for {activeMetric.name}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar mt-4 divide-y divide-border/20">
                  {activeLogs.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground/50 italic text-center py-12">
                      No logs recorded for this metric yet.
                    </p>
                  ) : (
                    activeLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between py-2.5">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-foreground">
                            {log.value} {activeMetric.unit}
                          </span>
                          <span className="text-[9px] font-bold text-muted-foreground/60 mt-0.5">
                            {format(parseISO(log.date), "EEEE, MMM d, yyyy")}
                          </span>
                          {log.notes && (
                            <span className="text-[9px] font-medium text-muted-foreground/45 italic mt-0.5">
                              "{log.notes}"
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteBiometricLog(log.id)}
                          className="text-muted-foreground hover:text-rose-500 p-2 rounded-lg hover:bg-rose-500/10 transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── TAB 4: LIBRARY & COMBOS TAB ─── */}
      {activeTab === "library" && (
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-6 space-y-5">
            {/* Tab header and actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-black uppercase text-foreground leading-none">Presets Database</h3>
                <p className="text-[10px] font-bold text-muted-foreground/60 mt-1">
                  Search foods and design meal templates for 1-click logging
                </p>
              </div>
              <div className="flex gap-2">
                {librarySubTab === "combos" ? (
                  <button
                    onClick={() => setIsComboModalOpen(true)}
                    className="py-1.5 px-3 rounded-xl text-[10px] font-black bg-primary text-white shadow-lg shadow-primary/10 hover:bg-primary/95 transition"
                  >
                    + Create Combo
                  </button>
                ) : (
                  <button
                    onClick={() => setIsCustomFoodModalOpen(true)}
                    className="py-1.5 px-3 rounded-xl text-[10px] font-black bg-primary text-white shadow-lg shadow-primary/10 hover:bg-primary/95 transition"
                  >
                    + Add Food
                  </button>
                )}
              </div>
            </div>

            {/* Inner Sub-tab Switcher */}
            <div className="flex bg-muted/60 p-1 rounded-lg gap-1 border border-border/10">
              <button
                onClick={() => setLibrarySubTab("custom")}
                className={`flex-1 py-1 text-[10px] font-black rounded-md transition ${
                  librarySubTab === "custom" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                My Foods
              </button>
              <button
                onClick={() => setLibrarySubTab("combos")}
                className={`flex-1 py-1 text-[10px] font-black rounded-md transition ${
                  librarySubTab === "combos" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Meal Combos ({combos.length})
              </button>
            </div>

            {/* Search filter for food list */}
            {librarySubTab !== "combos" && (
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Search my custom foods..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-muted border-none rounded-xl pl-9 pr-4 h-10 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20 placeholder:text-muted-foreground/45"
                />
              </div>
            )}

            {/* Sub-view rendering */}
            <div className="space-y-3.5 pt-2">
              {/* Presets and custom items list */}
              {librarySubTab !== "combos" && (
                filteredFoods
                  .map((food) => (
                    <div
                      key={food.id}
                      className="bg-muted/30 border border-border/10 rounded-xl p-4 flex items-center justify-between hover:scale-[1.01] hover:bg-muted/40 transition-all duration-300"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">{food.name}</span>
                        <span className="text-[10px] font-medium text-muted-foreground/70 mt-1">
                          {food.serving_size} {food.serving_unit} • {food.calories} kcal
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground/45 mt-0.5">
                          P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g | Fi: {food.fiber}g
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedFoodId(food.id);
                            setLogMealType("breakfast");
                            setLogFormTab("library");
                            setIsLogModalOpen(true);
                          }}
                          className="py-1.5 px-3 rounded-lg text-[9px] font-bold bg-muted hover:bg-primary/10 hover:text-primary transition-all duration-300"
                        >
                          Log meal
                        </button>
                        {!food.is_preset && (
                          <button
                            onClick={() => handleDeletePresetFood(food.id)}
                            className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
              )}

              {/* Combos list */}
              {librarySubTab === "combos" && (
                combos.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground/50 italic text-center py-8">
                    No custom meal templates created yet. Create one to bundle multiple foods!
                  </p>
                ) : (
                  combos.map((combo) => {
                    // Compute combo totals
                    const comboTotals = combo.items.reduce(
                      (acc, cItem) => {
                        const food = foodLibrary.find((f) => f.id === cItem.food_id);
                        if (food) {
                          acc.calories += Math.round(food.calories * cItem.quantity);
                          acc.protein += food.protein * cItem.quantity;
                        }
                        return acc;
                      },
                      { calories: 0, protein: 0 }
                    );

                    return (
                      <div
                        key={combo.id}
                        className="bg-muted/30 border border-border/10 rounded-xl p-4 flex items-center justify-between hover:scale-[1.01] hover:bg-muted/40 transition-all duration-300"
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">{combo.name}</span>
                            <span className="bg-primary/10 text-primary text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                              Combo
                            </span>
                          </div>
                          <span className="text-[9px] font-bold text-muted-foreground/50 mt-1 uppercase tracking-wide">
                            {combo.items.length} items logged • {comboTotals.calories} kcal • {comboTotals.protein.toFixed(1)}g Protein
                          </span>
                          <span className="text-[9px] font-medium text-muted-foreground/60 mt-0.5">
                            Contains: {combo.items.map(ci => {
                              const food = foodLibrary.find(f => f.id === ci.food_id);
                              return food ? `${food.name} (×${ci.quantity})` : "";
                            }).filter(Boolean).join(", ")}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedComboId(combo.id);
                              setLogMealType("breakfast");
                              setLogFormTab("combo");
                              setIsLogModalOpen(true);
                            }}
                            className="py-1.5 px-3 rounded-lg text-[9px] font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-300 shadow-sm"
                          >
                            Log combo
                          </button>
                          <button
                            onClick={() => handleDeleteCombo(combo.id)}
                            className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 0: CREATE BIOMETRIC METRIC TYPE ─── */}
      {isCreateMetricModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-border/40 shadow-xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in duration-300">
            <div>
              <h3 className="text-sm font-black uppercase text-foreground leading-none">Add New Metric Type</h3>
              <p className="text-[10px] font-bold text-muted-foreground/60 mt-1">
                Define a custom health or body metric to track over time
              </p>
            </div>

            <form onSubmit={handleCreateMetricType} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/60">Metric Name</label>
                <input
                  type="text"
                  placeholder="e.g. Left Bicep, Blood Sugar"
                  value={newMetricName}
                  onChange={(e) => setNewMetricName(e.target.value)}
                  className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/60">Unit of Measurement</label>
                <input
                  type="text"
                  placeholder="e.g. inches, mmHg, %, cm"
                  value={newMetricUnit}
                  onChange={(e) => setNewMetricUnit(e.target.value)}
                  className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateMetricModalOpen(false);
                    setNewMetricName("");
                    setNewMetricUnit("");
                  }}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-muted hover:bg-muted/70 text-foreground transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-black shadow-lg shadow-primary/10 transition-all duration-300"
                >
                  Create Metric
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 1: EDIT DIET GOALS ─── */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-border/40 shadow-xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in duration-300">
            <div>
              <h3 className="text-sm font-black uppercase text-foreground leading-none">Configure Daily Goals</h3>
              <p className="text-[10px] font-bold text-muted-foreground/60 mt-1">
                Customize your daily target calorie, macronutrient, and hydration targets
              </p>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground/60">Calories (kcal)</label>
                  <input
                    type="number"
                    value={goalForm.calories}
                    onChange={(e) => setGoalForm({ ...goalForm, calories: parseInt(e.target.value) || 0 })}
                    className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground/60">Protein (g)</label>
                  <input
                    type="number"
                    value={goalForm.protein}
                    onChange={(e) => setGoalForm({ ...goalForm, protein: parseInt(e.target.value) || 0 })}
                    className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground/60">Carbs (g)</label>
                  <input
                    type="number"
                    value={goalForm.carbs}
                    onChange={(e) => setGoalForm({ ...goalForm, carbs: parseInt(e.target.value) || 0 })}
                    className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground/60">Fat (g)</label>
                  <input
                    type="number"
                    value={goalForm.fat}
                    onChange={(e) => setGoalForm({ ...goalForm, fat: parseInt(e.target.value) || 0 })}
                    className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground/60">Fiber (g)</label>
                  <input
                    type="number"
                    value={goalForm.fiber}
                    onChange={(e) => setGoalForm({ ...goalForm, fiber: parseInt(e.target.value) || 0 })}
                    className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground/60">Water Goal (ml)</label>
                  <input
                    type="number"
                    value={goalForm.water_goal}
                    onChange={(e) => setGoalForm({ ...goalForm, water_goal: parseInt(e.target.value) || 0 })}
                    className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-muted hover:bg-muted/70 text-foreground transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/95 text-white transition shadow-lg shadow-primary/10"
                >
                  Save Goals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: LOG ITEM MODAL ─── */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-border/40 shadow-xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in duration-300">
            <div>
              <h3 className="text-sm font-black uppercase text-foreground leading-none">Log Item</h3>
              <p className="text-[10px] font-bold text-muted-foreground/60 mt-1">
                Enter your food, drink, or supplement details
              </p>
            </div>

            {/* Inner modal tab switcher */}
            {logMealType !== "supplement" && (
              <div className="flex bg-muted p-1 rounded-lg gap-1 border border-border/10 w-full overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setLogFormTab("library")}
                  className={`flex-1 py-1 text-[10px] font-black rounded-md transition ${
                    logFormTab === "library" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Library
                </button>
                <button
                  type="button"
                  onClick={() => setLogFormTab("manual")}
                  className={`flex-1 py-1 text-[10px] font-black rounded-md transition ${
                    logFormTab === "manual" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Manual Log
                </button>
                <button
                  type="button"
                  onClick={() => setLogFormTab("combo")}
                  className={`flex-1 py-1 text-[10px] font-black rounded-md transition ${
                    logFormTab === "combo" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Combos ({combos.length})
                </button>
              </div>
            )}

            <form onSubmit={handleAddLog} className="space-y-4">
              {/* MEAL TYPE SELECT (Except supplement) */}
              {logMealType !== "supplement" && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground/60">Meal Category</label>
                  <select
                    value={logMealType}
                    onChange={(e) => setLogMealType(e.target.value as any)}
                    className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>
              )}

              {/* OPTIONS TAB 1: FROM LIBRARY PRESETS */}
              {logFormTab === "library" && logMealType !== "supplement" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground/60">Choose Preset Food</label>
                    <select
                      value={selectedFoodId}
                      onChange={(e) => setSelectedFoodId(e.target.value)}
                      className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                    >
                      <option value="">Select a food template...</option>
                      {foodLibrary.map((food) => (
                        <option key={food.id} value={food.id}>
                          {food.name} ({food.serving_size} {food.serving_unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedFoodItem && (
                    <div className="bg-muted/40 p-3 rounded-xl border border-border/10">
                      <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-wide">
                        Macro details (Per portion)
                      </p>
                      <p className="text-xs font-bold text-foreground mt-1">
                        Calories: {selectedFoodItem.calories} kcal
                      </p>
                      <p className="text-[10px] font-medium text-muted-foreground mt-0.5">
                        P: {selectedFoodItem.protein}g | C: {selectedFoodItem.carbs}g | F: {selectedFoodItem.fat}g | Fi: {selectedFoodItem.fiber}g
                      </p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground/60">Quantity / Portion Count</label>
                    <input
                      type="number"
                      step="0.05"
                      value={logQuantity}
                      onChange={(e) => setLogQuantity(parseFloat(e.target.value) || 1)}
                      className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>
              )}

              {/* OPTIONS TAB 2: MANUAL LOG */}
              {logFormTab === "manual" && logMealType !== "supplement" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground/60">Food Item Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rice with chicken curry"
                      value={manualForm.name}
                      onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                      className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground/60">Calories (kcal)</label>
                      <input
                        type="number"
                        value={manualForm.calories}
                        onChange={(e) => setManualForm({ ...manualForm, calories: parseInt(e.target.value) || 0 })}
                        className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground/60">Protein (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={manualForm.protein}
                        onChange={(e) => setManualForm({ ...manualForm, protein: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground/60">Carbs (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={manualForm.carbs}
                        onChange={(e) => setManualForm({ ...manualForm, carbs: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground/60">Fat (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={manualForm.fat}
                        onChange={(e) => setManualForm({ ...manualForm, fat: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* OPTIONS TAB 3: LOG MEAL COMBO */}
              {logFormTab === "combo" && logMealType !== "supplement" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground/60">Select Combo Template</label>
                    <select
                      value={selectedComboId}
                      onChange={(e) => setSelectedComboId(e.target.value)}
                      className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                    >
                      <option value="">Choose combo...</option>
                      {combos.map((combo) => (
                        <option key={combo.id} value={combo.id}>
                          {combo.name} ({combo.items.length} items)
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[9px] font-medium text-muted-foreground/50 leading-normal">
                    Logging a combo will write all of its component food presets with their scaled quantities into your log under the selected meal category.
                  </p>
                </div>
              )}

              {/* OPTIONS TAB 4: SUPPLEMENTS */}
              {logMealType === "supplement" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground/60">Supplement Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Creatine, Vitamin C, Fish Oil"
                      value={supplementName}
                      onChange={(e) => setSupplementName(e.target.value)}
                      className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-muted hover:bg-muted/70 text-foreground transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/95 text-white transition shadow-lg shadow-primary/10"
                >
                  Log Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: ADD CUSTOM PRESET TO FOOD LIBRARY ─── */}
      {isCustomFoodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-border/40 shadow-xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in duration-300">
            <div>
              <h3 className="text-sm font-black uppercase text-foreground leading-none">Add Preset Food</h3>
              <p className="text-[10px] font-bold text-muted-foreground/60 mt-1">
                Save a standard food template to the database for future one-click logging
              </p>
            </div>

            <form onSubmit={handleAddCustomFood} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-muted-foreground/60">Food Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jasmine Rice"
                  value={customFoodForm.name}
                  onChange={(e) => setCustomFoodForm({ ...customFoodForm, name: e.target.value })}
                  className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground/60">Serving Size</label>
                  <input
                    type="number"
                    value={customFoodForm.serving_size}
                    onChange={(e) => setCustomFoodForm({ ...customFoodForm, serving_size: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground/60">Serving Unit</label>
                  <input
                    type="text"
                    value={customFoodForm.serving_unit}
                    onChange={(e) => setCustomFoodForm({ ...customFoodForm, serving_unit: e.target.value })}
                    placeholder="e.g. g, scoop, cup"
                    className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground/60">Calories (kcal)</label>
                  <input
                    type="number"
                    value={customFoodForm.calories}
                    onChange={(e) => setCustomFoodForm({ ...customFoodForm, calories: parseInt(e.target.value) || 0 })}
                    className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground/60">Protein (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customFoodForm.protein}
                    onChange={(e) => setCustomFoodForm({ ...customFoodForm, protein: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground/60">Carbs (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customFoodForm.carbs}
                    onChange={(e) => setCustomFoodForm({ ...customFoodForm, carbs: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground/60">Fat (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customFoodForm.fat}
                    onChange={(e) => setCustomFoodForm({ ...customFoodForm, fat: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground/60">Fiber (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customFoodForm.fiber}
                    onChange={(e) => setCustomFoodForm({ ...customFoodForm, fiber: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold col-span-2 focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomFoodModalOpen(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-muted hover:bg-muted/70 text-foreground transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/95 text-white transition shadow-lg shadow-primary/10"
                >
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: CONFIGURE TARGET WEIGHT ─── */}
      {isWeightGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-border/40 shadow-xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in duration-300">
            <div>
              <h3 className="text-sm font-black uppercase text-foreground leading-none">Target Weight</h3>
              <p className="text-[10px] font-bold text-muted-foreground/60 mt-1">
                Configure your target body weight goal
              </p>
            </div>

            <form onSubmit={handleSaveWeightGoal} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground/60">Goal Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weightGoalInput}
                  onChange={(e) => setWeightGoalInput(e.target.value)}
                  className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWeightGoalModalOpen(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-muted hover:bg-muted/70 text-foreground transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/95 text-white transition shadow-lg shadow-primary/10"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: CONSTRUCT MEAL COMBO / TEMPLATE ─── */}
      {isComboModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border/40 shadow-xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in duration-300">
            <div>
              <h3 className="text-sm font-black uppercase text-foreground leading-none">Design Meal Combo</h3>
              <p className="text-[10px] font-bold text-muted-foreground/60 mt-1">
                Combine several food presets into a single template for 1-click logging
              </p>
            </div>

            <form onSubmit={handleCreateCombo} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-muted-foreground/60">Combo Name</label>
                <input
                  type="text"
                  placeholder="e.g. Standard Protein Oats"
                  value={comboFormName}
                  onChange={(e) => setComboFormName(e.target.value)}
                  className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                />
              </div>

              {/* Dynamic list of foods in combo */}
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                <label className="text-[9px] font-black uppercase text-muted-foreground/60 block">Component Foods</label>
                
                {comboFormItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      value={item.food_id}
                      onChange={(e) => handleUpdateComboItemRow(idx, "food_id", e.target.value)}
                      className="flex-1 bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                    >
                      <option value="">Select food...</option>
                      {foodLibrary.map((food) => (
                        <option key={food.id} value={food.id}>
                          {food.name} ({food.serving_size} {food.serving_unit})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="0.1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleUpdateComboItemRow(idx, "quantity", e.target.value)}
                      className="w-16 bg-muted border-none rounded-xl h-10 px-2 text-center text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                    />

                    {comboFormItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveComboItemRow(idx)}
                        className="text-muted-foreground hover:text-rose-500 p-2 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddComboItemRow}
                className="w-full py-1.5 border border-dashed border-border hover:border-primary/50 text-[10px] font-black text-muted-foreground hover:text-primary rounded-xl transition duration-300"
              >
                + Add Item
              </button>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsComboModalOpen(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-muted hover:bg-muted/70 text-foreground transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/95 text-white transition shadow-lg shadow-primary/10"
                >
                  Create Combo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
