"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2, BookOpen, Utensils, Activity } from "lucide-react";
import { dietService, FoodLibraryItem, MealCombo } from "@/lib/services/diet";
import { PageWrapper } from "@/components/PageWrapper";
import { SubNav } from "@/components/SubNav";
import { useRouter } from "next/navigation";

const sectionTabs = [
  { title: "Daily Log", icon: <Utensils size={18} />, href: "/nutrition/logs" },
  { title: "Biometrics & Body", icon: <Activity size={18} />, href: "/nutrition/biometrics" },
  { title: "Library & Combos", icon: <BookOpen size={18} />, href: "/nutrition/library" }
];

export default function LibraryCombosPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [foodLibrary, setFoodLibrary] = useState<FoodLibraryItem[]>([]);
  const [combos, setCombos] = useState<MealCombo[]>([]);
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);

  const [comboFormName, setComboFormName] = useState("");
  const [comboFormItems, setComboFormItems] = useState<{ food_id: string; quantity: number }[]>([
    { food_id: "", quantity: 1 }
  ]);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const loadedLibrary = await dietService.getFoodLibrary();
        const loadedCombos = await dietService.getCombos();
        setFoodLibrary(loadedLibrary);
        setCombos(loadedCombos);
      } catch (err) {
        console.error("Error loading library data:", err);
        toast.error("Failed to load combos");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

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
      
      setComboFormName("");
      setComboFormItems([{ food_id: "", quantity: 1 }]);
      toast.success(`Combo "${comboFormName}" created! 📦`);
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

  if (isLoading) {
    return (
      <PageWrapper title="Nutrition" reportHref="/reports/nutrition" sectionTabs={sectionTabs} activePath="/nutrition/library">
        <div className="py-24 text-center text-xs font-bold text-muted-foreground/60">
          Loading combos templates...
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
          activeItem="Meal Combos"
          onChange={(val) => {
            if (val === "My Foods") router.push("/nutrition/library/foods");
          }}
        />

        <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-6 space-y-5">
          <div className="flex justify-between items-center border-b border-border/10 pb-4">
            <div>
              <h3 className="text-xs font-black uppercase text-foreground leading-none">Meal Combo Templates</h3>
              <p className="text-[10px] font-bold text-muted-foreground/50 mt-1">Combine multiple food items into single-tap presets</p>
            </div>
            <button
              onClick={() => setIsComboModalOpen(true)}
              className="py-1.5 px-3 rounded-xl text-[10px] font-black bg-primary text-white shadow-md shadow-primary/10 hover:bg-primary/95 transition"
            >
              + Create Combo
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {combos.length === 0 ? (
              <div className="col-span-full py-12 text-center">
                <p className="text-[10px] text-muted-foreground/45 italic">
                  No combo templates designed yet. Click "+ Create Combo" to start.
                </p>
              </div>
            ) : (
              combos.map((combo) => {
                const totals = combo.items.reduce(
                  (acc, item) => {
                    const food = foodLibrary.find((f) => f.id === item.food_id);
                    if (food) {
                      acc.calories += Math.round(food.calories * item.quantity);
                      acc.protein += food.protein * item.quantity;
                    }
                    return acc;
                  },
                  { calories: 0, protein: 0 }
                );

                return (
                  <div
                    key={combo.id}
                    className="p-4 bg-muted/20 border border-border/20 rounded-2xl flex flex-col justify-between hover:scale-[1.01] hover:bg-muted/30 transition-all group relative"
                  >
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-foreground pr-8 truncate">
                        {combo.name}
                      </h4>
                      <div className="flex gap-2.5 text-[9px] font-bold text-muted-foreground/75">
                        <span>{totals.calories} kcal</span>
                        <span>P: {Math.round(totals.protein)}g</span>
                        <span>{combo.items.length} item(s)</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteCombo(combo.id)}
                      className="absolute right-2 top-2 text-muted-foreground/50 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {isComboModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-border/40 shadow-xl overflow-hidden p-6 space-y-5">
            <div>
              <h3 className="text-sm font-black uppercase text-foreground leading-none">Create Combo Template</h3>
              <p className="text-[10px] font-bold text-muted-foreground/60 mt-1">
                Select custom foods and quantities to build a single-tap log shortcut
              </p>
            </div>

            <form onSubmit={handleCreateCombo} className="space-y-4 max-h-[450px] overflow-y-auto no-scrollbar">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/60">Combo Template Name</label>
                <input
                  type="text"
                  placeholder="e.g. Standard Breakfast Stack"
                  value={comboFormName}
                  onChange={(e) => setComboFormName(e.target.value)}
                  className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase text-muted-foreground/60">Included Items</label>
                  <button
                    type="button"
                    onClick={handleAddComboItemRow}
                    className="text-[9px] font-black text-primary hover:underline"
                  >
                    + Add Item Row
                  </button>
                </div>

                <div className="space-y-2">
                  {comboFormItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        value={item.food_id}
                        onChange={(e) => handleUpdateComboItemRow(index, "food_id", e.target.value)}
                        className="flex-1 bg-muted border-none rounded-xl h-9 px-2.5 text-[10px] font-black focus:ring-2 focus:ring-accent/20 cursor-pointer"
                      >
                        <option value="">-- Select Food --</option>
                        {foodLibrary.map((food) => (
                          <option key={food.id} value={food.id}>
                            {food.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleUpdateComboItemRow(index, "quantity", e.target.value)}
                        className="w-16 bg-muted border-none rounded-xl h-9 px-2 text-[10px] font-black text-center focus:ring-2 focus:ring-accent/20"
                      />
                      {comboFormItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveComboItemRow(index)}
                          className="p-1.5 text-muted-foreground hover:text-rose-500 rounded"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsComboModalOpen(false);
                    setComboFormName("");
                    setComboFormItems([{ food_id: "", quantity: 1 }]);
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
                  Save Combo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
