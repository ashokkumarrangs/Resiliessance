"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2, BookOpen, Utensils, Activity } from "lucide-react";
import { dietService, FoodLibraryItem } from "@/lib/services/diet";
import { PageWrapper } from "@/components/PageWrapper";
import { SubNav } from "@/components/SubNav";
import { useRouter } from "next/navigation";

const sectionTabs = [
  { title: "Daily Log", icon: <Utensils size={18} />, href: "/nutrition/logs" },
  { title: "Biometrics & Body", icon: <Activity size={18} />, href: "/nutrition/biometrics" },
  { title: "Library & Combos", icon: <BookOpen size={18} />, href: "/nutrition/library" }
];

export default function LibraryFoodsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [foodLibrary, setFoodLibrary] = useState<FoodLibraryItem[]>([]);
  const [isCustomFoodModalOpen, setIsCustomFoodModalOpen] = useState(false);

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

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const loadedLibrary = await dietService.getFoodLibrary();
        setFoodLibrary(loadedLibrary);
      } catch (err) {
        console.error("Error loading library data:", err);
        toast.error("Failed to load food library");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

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
      toast.success("Saved to Food Library! 📚");
    } catch {
      toast.error("Failed to save food");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePresetFood = async (id: string) => {
    try {
      const ok = await dietService.deleteCustomFood(id);
      if (ok) {
        setFoodLibrary(foodLibrary.filter((f) => f.id !== id));
        toast.success("Food item deleted");
      }
    } catch {
      toast.error("Failed to delete item");
    }
  };

  if (isLoading) {
    return (
      <PageWrapper title="Nutrition" reportHref="/reports/nutrition" sectionTabs={sectionTabs} activePath="/nutrition/library">
        <div className="py-24 text-center text-xs font-bold text-muted-foreground/60">
          Loading food library...
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Nutrition"
      reportHref="/reports/nutrition"
      sectionTabs={sectionTabs}
      activePath="/nutrition/library"
    >
      <div className="space-y-6 animate-fadeIn">
        <SubNav
          items={["My Foods", "Meal Combos"]}
          activeItem="My Foods"
          onChange={(val) => {
            if (val === "Meal Combos") router.push("/nutrition/library/combos");
          }}
        />

        <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-6 space-y-5">
          <div className="flex justify-between items-center border-b border-border/10 pb-4">
            <div>
              <h3 className="text-xs font-black uppercase text-foreground leading-none">Custom Foods Library</h3>
              <p className="text-[10px] font-bold text-muted-foreground/50 mt-1">Manage food parameters for calculations</p>
            </div>
            <button
              onClick={() => setIsCustomFoodModalOpen(true)}
              className="py-1.5 px-3 rounded-xl text-[10px] font-black bg-primary text-white shadow-md shadow-primary/10 hover:bg-primary/95 transition"
            >
              + Add Food
            </button>
          </div>

          <div className="divide-y divide-border/15 max-h-[500px] overflow-y-auto no-scrollbar">
            {foodLibrary.length === 0 ? (
              <p className="text-[10px] text-muted-foreground/45 italic py-12 text-center">
                Your custom food library is empty. Click "+ Add Food" to populate it.
              </p>
            ) : (
              foodLibrary.map((food) => (
                <div key={food.id} className="py-3 flex items-center justify-between group hover:bg-muted/5 transition-all">
                  <div className="flex-1">
                    <span className="text-xs font-black text-foreground block">{food.name}</span>
                    <span className="text-[9px] font-bold text-muted-foreground/60 mt-0.5 block">
                      Serving: {food.serving_size} {food.serving_unit}
                      {" · "}
                      {food.calories} kcal
                      {" · "}
                      P: {food.protein}g / C: {food.carbs}g / F: {food.fat}g
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeletePresetFood(food.id)}
                    className="text-muted-foreground/50 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isCustomFoodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-border/40 shadow-xl overflow-hidden p-6 space-y-5">
            <div>
              <h3 className="text-sm font-black uppercase text-foreground leading-none">Add Custom Food</h3>
              <p className="text-[10px] font-bold text-muted-foreground/60 mt-1">
                Input macro attributes to register food item parameters
              </p>
            </div>

            <form onSubmit={handleAddCustomFood} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/60">Food Name</label>
                <input
                  type="text"
                  placeholder="e.g. Peanut Butter (Creamy)"
                  value={customFoodForm.name}
                  onChange={(e) => setCustomFoodForm({ ...customFoodForm, name: e.target.value })}
                  className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground/60">Serving Size</label>
                  <input
                    type="number"
                    value={customFoodForm.serving_size}
                    onChange={(e) => setCustomFoodForm({ ...customFoodForm, serving_size: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground/60">Serving Unit</label>
                  <input
                    type="text"
                    value={customFoodForm.serving_unit}
                    onChange={(e) => setCustomFoodForm({ ...customFoodForm, serving_unit: e.target.value })}
                    className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground/60">Calories (kcal)</label>
                  <input
                    type="number"
                    value={customFoodForm.calories || ""}
                    onChange={(e) => setCustomFoodForm({ ...customFoodForm, calories: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground/60">Protein (g)</label>
                  <input
                    type="number"
                    value={customFoodForm.protein || ""}
                    onChange={(e) => setCustomFoodForm({ ...customFoodForm, protein: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground/60">Carbohydrates (g)</label>
                  <input
                    type="number"
                    value={customFoodForm.carbs || ""}
                    onChange={(e) => setCustomFoodForm({ ...customFoodForm, carbs: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground/60">Fat (g)</label>
                  <input
                    type="number"
                    value={customFoodForm.fat || ""}
                    onChange={(e) => setCustomFoodForm({ ...customFoodForm, fat: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/60">Fiber (g)</label>
                <input
                  type="number"
                  value={customFoodForm.fiber || ""}
                  onChange={(e) => setCustomFoodForm({ ...customFoodForm, fiber: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomFoodModalOpen(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-muted hover:bg-muted/70 text-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-black shadow-lg shadow-primary/10 transition-all"
                >
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
