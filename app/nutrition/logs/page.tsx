"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format, subDays, addDays, parseISO } from "date-fns";
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
  BookOpen,
  Utensils,
  PlusCircle,
  HelpCircle,
  Activity,
  Info,
  CalendarDays
} from "lucide-react";
import {
  dietService,
  DietTarget,
  FoodLibraryItem,
  DietLogEntry,
  MealCombo
} from "@/lib/services/diet";
import { PageWrapper } from "@/components/PageWrapper";

const sectionTabs = [
  {
    title: "Daily Log",
    icon: <Utensils size={18} />,
    href: "/nutrition/logs"
  },
  {
    title: "Biometrics & Body",
    icon: <Activity size={18} />,
    href: "/nutrition/biometrics"
  },
  {
    title: "Library & Combos",
    icon: <BookOpen size={18} />,
    href: "/nutrition/library"
  }
];

function DailyLogPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedDate = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");

  const setSelectedDate = (dateStr: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", dateStr);
    router.push(`/nutrition/logs?${params.toString()}`);
  };
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
  const [combos, setCombos] = useState<MealCombo[]>([]);

  // Modals & Forms State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Goal Form State
  const [goalForm, setGoalForm] = useState<DietTarget>({ ...target });

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

  // Load Data on Date Change
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const loadedTarget = await dietService.getTarget();
        const loadedLibrary = await dietService.getFoodLibrary();
        const loadedLogs = await dietService.getLogsForDate(selectedDate);
        const loadedWater = await dietService.getWaterLogForDate(selectedDate);
        const loadedCombos = await dietService.getCombos();

        setTarget(loadedTarget);
        setGoalForm(loadedTarget);
        setFoodLibrary(loadedLibrary);
        setLogs(loadedLogs);
        setWaterMl(loadedWater);
        setCombos(loadedCombos);
      } catch (err) {
        console.error("Error loading daily log data:", err);
        toast.error("Failed to load daily log data");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [selectedDate]);

  // Calculate Logged Totals
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

  // Selected food item helper
  const selectedFoodItem = useMemo(() => {
    return foodLibrary.find((food) => food.id === selectedFoodId);
  }, [foodLibrary, selectedFoodId]);

  // Filter food library based on search
  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return foodLibrary.filter((food) =>
      food.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [foodLibrary, searchQuery]);

  // Handlers
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

  const handleAdjustWater = async (amount: number) => {
    const nextVal = Math.max(0, waterMl + amount);
    setWaterMl(nextVal);
    try {
      await dietService.saveWaterLog(selectedDate, nextVal);
    } catch {
      toast.error("Failed to save water log");
    }
  };

  const toggleSupplementLogged = async (suppName: string, isCurrentlyLogged: boolean) => {
    try {
      if (isCurrentlyLogged) {
        const found = logs.find((l) => l.is_supplement && l.food_name === suppName);
        if (found) {
          await handleDeleteLog(found.id);
        }
      } else {
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
        toast.success(`${suppName} completed!`);
      }
    } catch {
      toast.error("Failed to toggle supplement");
    }
  };

  const setDateToToday = () => {
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
  };

  // Supplement list presets
  const SUPPLEMENT_PRESETS = ["Multivitamin", "Omega-3", "Creatine Monohydrate", "Vitamin D3", "Magnesium Glycinate"];

  // Meal types list
  const MEALS: { type: DietLogEntry["meal_type"]; title: string }[] = [
    { type: "breakfast", title: "Breakfast" },
    { type: "lunch", title: "Lunch" },
    { type: "dinner", title: "Dinner" },
    { type: "snack", title: "Snacks" }
  ];

  return (
    <PageWrapper
      title="Nutrition"
      reportHref="/reports/nutrition"
      sectionTabs={sectionTabs}
      activePath="/nutrition/logs"
      headerActions={
        <button
          onClick={() => setIsGoalModalOpen(true)}
          className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-muted-foreground/60 hover:text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
        >
          <Settings className="w-4 h-4 md:w-[18px] md:h-[18px]" />
        </button>
      }
    >
      <div className="space-y-6">
        {/* Centered Date Picker (Standardized from Habits) */}
        <div className="flex justify-center mb-6 mt-6 w-full">
          <div className="bg-card px-6 py-2 rounded-xl border border-border/40 shadow-sm flex items-center gap-3 w-full max-w-xs justify-center group hover:bg-muted transition-all">
            <Calendar className="w-4 h-4 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="font-black text-md bg-transparent border-none focus:ring-0 cursor-pointer text-foreground uppercase tracking-tight"
            />
          </div>
        </div>

        {/* Unified Calories and Macros Card */}
        <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-8 justify-center">
            {/* SVG Progress Ring */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 128 128" className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  className="stroke-muted"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  className="stroke-primary"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={
                    2 * Math.PI * 52 * (1 - Math.min(1, totals.calories / target.calories))
                  }
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-wider">
                  Calories
                </span>
                <span className="text-3xl font-black mt-1 text-foreground leading-none">
                  {totals.calories}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground/50 mt-1">
                  /{target.calories} kcal
                </span>
              </div>
            </div>

            {/* Macro Bars */}
            <div className="flex-1 w-full space-y-4">
              {/* Protein */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-wider">
                  <span className="text-foreground/80">Protein</span>
                  <span className="text-muted-foreground">
                    {totals.protein}g / <span className="text-foreground/90">{target.protein}g</span>
                  </span>
                </div>
                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (totals.protein / target.protein) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Carbs */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-wider">
                  <span className="text-foreground/80">Carbohydrates</span>
                  <span className="text-muted-foreground">
                    {totals.carbs}g / <span className="text-foreground/90">{target.carbs}g</span>
                  </span>
                </div>
                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (totals.carbs / target.carbs) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Fat */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-wider">
                  <span className="text-foreground/80">Fats</span>
                  <span className="text-muted-foreground">
                    {totals.fat}g / <span className="text-foreground/90">{target.fat}g</span>
                  </span>
                </div>
                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (totals.fat / target.fat) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Log Entries Lists */}
        {MEALS.map(({ type, title }) => {
          const mealEntries = logs.filter((l) => l.meal_type === type);
          return (
            <div key={type} className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
              <div className="p-5 flex justify-between items-center border-b border-border/10 bg-muted/10">
                <div className="flex items-center gap-2.5">
                  <Utensils size={14} className="text-primary opacity-60" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                    {title}
                  </h3>
                  <span className="text-[10px] font-bold text-muted-foreground/60 px-2 py-0.5 bg-muted rounded-full">
                    {mealEntries.reduce((sum, item) => sum + Math.round(item.calories * item.quantity), 0)} kcal
                  </span>
                </div>
                <button
                  onClick={() => {
                    setLogMealType(type);
                    setLogFormTab("library");
                    setIsLogModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-primary hover:bg-primary/5 active:scale-95 transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="divide-y divide-border/15">
                {mealEntries.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground/45 italic py-6 px-5 text-center">
                    No logs recorded for {title.toLowerCase()}.
                  </p>
                ) : (
                  mealEntries.map((log) => (
                    <div key={log.id} className="p-4 flex items-center justify-between group hover:bg-muted/10 transition-all">
                      <div className="flex-1 pr-4">
                        <span className="text-xs font-black text-foreground block">
                          {log.food_name}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground/60 mt-0.5 block">
                          {log.quantity} {log.serving_unit === "serving" ? "serving" : `${log.serving_size} ${log.serving_unit}`}(s)
                          {" · "}
                          {Math.round(log.calories * log.quantity)} kcal
                          {" · "}
                          P: {Math.round(log.protein * log.quantity)}g
                          {" · "}
                          C: {Math.round(log.carbs * log.quantity)}g
                          {" · "}
                          F: {Math.round(log.fat * log.quantity)}g
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="text-muted-foreground/50 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}

        {/* Unified Hydration & Supplements Card */}
        <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-6 space-y-6">
          {/* Hydration Tracker */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Droplets size={16} className="text-blue-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Water Hydration
                </h3>
              </div>
              <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full">
                {waterMl} / {target.water_goal} ml
              </span>
            </div>

            <div className="h-4 w-full bg-muted rounded-full overflow-hidden relative border border-border/5">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (waterMl / target.water_goal) * 100)}%` }}
              />
            </div>

            <div className="flex gap-2 justify-center pt-1">
              {[-500, -250, 250, 500].map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleAdjustWater(amount)}
                  className={`py-1.5 px-3 rounded-lg text-[9px] font-black transition-all border border-border/30 active:scale-95 ${
                    amount > 0
                      ? "bg-blue-500 text-white shadow-md shadow-blue-500/10 hover:bg-blue-600"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {amount > 0 ? `+${amount} ml` : `${amount} ml`}
                </button>
              ))}
            </div>
          </div>

          {/* Supplements Checklist */}
          <div className="space-y-4 pt-5 border-t border-border/10">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                Daily Supplement Stack
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SUPPLEMENT_PRESETS.map((supp) => {
                const isLogged = logs.some((l) => l.is_supplement && l.food_name === supp);
                return (
                  <button
                    key={supp}
                    onClick={() => toggleSupplementLogged(supp, isLogged)}
                    className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all active:scale-[0.98] ${
                      isLogged
                        ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <span className="text-[10px] font-black tracking-wide">{supp}</span>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      isLogged ? "bg-emerald-500 border-emerald-500 text-white" : "border-muted-foreground/30"
                    }`}>
                      {isLogged && <Check size={10} strokeWidth={4} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODAL: EDIT GOALS ─── */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-border/40 shadow-xl overflow-hidden p-6 space-y-5">
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
                  <label className="text-[10px] font-black uppercase text-muted-foreground/60">Fats (g)</label>
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
                    step="50"
                    value={goalForm.water_goal}
                    onChange={(e) => setGoalForm({ ...goalForm, water_goal: parseInt(e.target.value) || 0 })}
                    className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setGoalForm({ ...target });
                    setIsGoalModalOpen(false);
                  }}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-muted hover:bg-muted/70 text-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-black shadow-lg shadow-primary/10 transition-all"
                >
                  Save Goals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD LOG ENTRY ─── */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-border/40 shadow-xl overflow-hidden p-6 space-y-5">
            <div>
              <h3 className="text-sm font-black uppercase text-foreground leading-none">Add Log Entry</h3>
              <p className="text-[10px] font-bold text-muted-foreground/60 mt-1 capitalize">
                Select method to log item under {logMealType}
              </p>
            </div>

            {/* Sub-selector tabs within modal */}
            <div className="flex bg-muted/60 p-1 rounded-lg gap-1 border border-border/10">
              {(["library", "manual", "combo", "supplement"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setLogFormTab(t)}
                  className={`py-1.5 px-2 text-[9px] font-black rounded-md flex-1 text-center capitalize transition-all ${
                    logFormTab === t
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <form onSubmit={handleAddLog} className="space-y-4">
              {/* LIBRARY TAB */}
              {logFormTab === "library" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground/60">Search Library</label>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-3 text-muted-foreground/50" />
                      <input
                        type="text"
                        placeholder="Search custom foods..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-muted border-none rounded-xl h-10 pl-9 pr-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                  </div>

                  {/* Autocomplete Results */}
                  {searchQuery.trim() && (
                    <div className="max-h-40 overflow-y-auto border border-border/10 rounded-xl divide-y divide-border/10 bg-muted/30">
                      {filteredFoods.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground/50 italic p-3 text-center">No presets match search query.</p>
                      ) : (
                        filteredFoods.map((food) => (
                          <button
                            key={food.id}
                            type="button"
                            onClick={() => {
                              setSelectedFoodId(food.id);
                              setSearchQuery(food.name);
                            }}
                            className={`w-full text-left p-2.5 text-[10px] font-black hover:bg-muted transition flex items-center justify-between ${
                              selectedFoodId === food.id ? "text-primary bg-primary/5" : "text-foreground"
                            }`}
                          >
                            <span>{food.name}</span>
                            <span className="text-[9px] text-muted-foreground font-bold">
                              {food.calories} kcal ({food.serving_size} {food.serving_unit})
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {selectedFoodItem && (
                    <div className="p-3 bg-muted/20 border border-border/20 rounded-xl text-[10px] font-bold text-muted-foreground/80 space-y-1">
                      <span className="font-black text-foreground block">{selectedFoodItem.name}</span>
                      <span>Serving size: {selectedFoodItem.serving_size} {selectedFoodItem.serving_unit}</span>
                      <div className="grid grid-cols-4 gap-2 pt-1 font-black text-foreground/90">
                        <span>Cals: {selectedFoodItem.calories}</span>
                        <span>Prot: {selectedFoodItem.protein}g</span>
                        <span>Carb: {selectedFoodItem.carbs}g</span>
                        <span>Fat: {selectedFoodItem.fat}g</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground/60">Servings (Multiplier)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={logQuantity}
                      onChange={(e) => setLogQuantity(parseFloat(e.target.value) || 1)}
                      className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>
              )}

              {/* MANUAL TAB */}
              {logFormTab === "manual" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground/60">Food Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Scrambled Eggs with Avocado"
                      value={manualForm.name}
                      onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                      className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground/60">Calories (kcal)</label>
                      <input
                        type="number"
                        value={manualForm.calories || ""}
                        onChange={(e) => setManualForm({ ...manualForm, calories: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground/60">Protein (g)</label>
                      <input
                        type="number"
                        value={manualForm.protein || ""}
                        onChange={(e) => setManualForm({ ...manualForm, protein: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground/60">Carbs (g)</label>
                      <input
                        type="number"
                        value={manualForm.carbs || ""}
                        onChange={(e) => setManualForm({ ...manualForm, carbs: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground/60">Fat (g)</label>
                      <input
                        type="number"
                        value={manualForm.fat || ""}
                        onChange={(e) => setManualForm({ ...manualForm, fat: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground/60">Fiber (g)</label>
                    <input
                      type="number"
                      value={manualForm.fiber || ""}
                      onChange={(e) => setManualForm({ ...manualForm, fiber: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>
              )}

              {/* COMBO TEMPLATE TAB */}
              {logFormTab === "combo" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground/60">Select Combo Template</label>
                    <select
                      value={selectedComboId}
                      onChange={(e) => setSelectedComboId(e.target.value)}
                      className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20 cursor-pointer"
                    >
                      <option value="">-- Choose template --</option>
                      {combos.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  {selectedComboId && (
                    <div className="p-3 bg-muted/20 border border-border/20 rounded-xl space-y-1 text-[10px] font-bold text-muted-foreground/80">
                      <span className="font-black text-foreground block">
                        Items inside:
                      </span>
                      {combos.find(c => c.id === selectedComboId)?.items.map((item, idx) => {
                        const food = foodLibrary.find(f => f.id === item.food_id);
                        return (
                          <div key={idx} className="flex justify-between">
                            <span>{food ? food.name : "Unknown"}</span>
                            <span>×{item.quantity}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SUPPLEMENT TAB */}
              {logFormTab === "supplement" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground/60">Supplement Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Zinc Picolinate"
                      value={supplementName}
                      onChange={(e) => setSupplementName(e.target.value)}
                      className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-muted hover:bg-muted/70 text-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-black shadow-lg shadow-primary/10 transition-all"
                >
                  Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

export default function DailyLogPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center font-black animate-pulse">LOADING NUTRITION LOGS...</div>}>
      <DailyLogPageContent />
    </Suspense>
  );
}
