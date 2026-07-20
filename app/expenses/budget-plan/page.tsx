"use client";
import { Select } from "@/components/Select";
import Link from "next/link";

import { CheckCircle2, ChevronRight, Save, TrendingUp , BarChart2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useMemo, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { SaveButton } from "@/components/ui/SaveButton";
import { PageHeader } from "@/components/PageHeader";
import { SectionNav } from "@/components/SectionNav";
import { EXPENSE_TABS } from "@/lib/navigation";
import { SubNav } from "@/components/SubNav";

const incomeCats = new Set(['Income', 'Salary', 'Business', 'Investments', 'Other Income', 'Bonus', 'Dividend', 'Interest']);

interface BudgetItem {
  prevBudget: number;
  prevActual: number;
  currentPlan: number;
}

interface BudgetStructure {
  [category: string]: {
    [subcategory: string]: BudgetItem;
  };
}

function BudgetPlanContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  
  const toggleExpand = (cat: string) => {
    setExpanded(prev => ({ ...prev, [cat]: !prev[cat] }));
  };
  
  const [targetMonth, setTargetMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [planCompMonth, setPlanCompMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [actualCompMonth, setActualCompMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });

  // Target months list: current month + next 11 months
  const targetMonthOptions = useMemo(() => {
    const options = [];
    const base = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      options.push({ value: val, label });
    }
    return options;
  }, []);

  // Comparison months list: past 12 months
  const compMonthOptions = useMemo(() => {
    const options = [];
    const base = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      options.push({ value: val, label });
    }
    return options;
  }, []);

  const [budgetData, setBudgetData] = useState<BudgetStructure>({});
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  const [globalChangePct, setGlobalChangePct] = useState("0");

  useEffect(() => {
    fetchData();
  }, [targetMonth, planCompMonth, actualCompMonth]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Get all unique active categories & subcategories from history_expenses
      const { data: allTx } = await supabase.from('history_expenses').select('category, subcategory');
      
      const uniqueCats: Record<string, Set<string>> = {};
      if (allTx) {
        allTx.forEach(tx => {
          if (!uniqueCats[tx.category]) uniqueCats[tx.category] = new Set();
          if (tx.subcategory) uniqueCats[tx.category].add(tx.subcategory);
        });
      }

      // Also grab any explicitly defined from budget_plans to ensure we catch everything
      const { data: allPlans } = await supabase.from('budget_plans').select('category, subcategory');
      if (allPlans) {
        allPlans.forEach(p => {
          if (!uniqueCats[p.category]) uniqueCats[p.category] = new Set();
          if (p.subcategory) uniqueCats[p.category].add(p.subcategory);
        });
      }

      // 2. Fetch specific data
      const nextPlanCompMonth = new Date(planCompMonth);
      nextPlanCompMonth.setMonth(nextPlanCompMonth.getMonth() + 1);
      const planCompNextStr = `${nextPlanCompMonth.getFullYear()}-${String(nextPlanCompMonth.getMonth() + 1).padStart(2, '0')}-01`;

      const nextActualCompMonth = new Date(actualCompMonth);
      nextActualCompMonth.setMonth(nextActualCompMonth.getMonth() + 1);
      const actualCompNextStr = `${nextActualCompMonth.getFullYear()}-${String(nextActualCompMonth.getMonth() + 1).padStart(2, '0')}-01`;

      const [ { data: currentPlans }, { data: prevPlans }, { data: prevActuals } ] = await Promise.all([
        supabase.from('budget_plans').select('*').eq('month', targetMonth),
        supabase.from('budget_plans').select('*').eq('month', planCompMonth),
        supabase.from('history_expenses').select('category, subcategory, amount').gte('date', actualCompMonth).lt('date', actualCompNextStr)
      ]);

      const dataMap: BudgetStructure = {};
      
      Object.keys(uniqueCats).forEach(cat => {
        dataMap[cat] = {};
        uniqueCats[cat].forEach(sub => {
          dataMap[cat][sub] = { prevBudget: 0, prevActual: 0, currentPlan: 0 };
        });
      });

      // Populate previous budgets
      prevPlans?.forEach(p => {
        if (dataMap[p.category]?.[p.subcategory]) {
          dataMap[p.category][p.subcategory].prevBudget = parseFloat(p.planned_amount) || 0;
        }
      });

      // Populate previous actuals
      prevActuals?.forEach(a => {
        if (dataMap[a.category]?.[a.subcategory]) {
          dataMap[a.category][a.subcategory].prevActual += (parseFloat(a.amount) || 0);
        }
      });

      // Populate current plans (or default to prevBudget if not set)
      const currentPlanSet = new Set<string>();
      currentPlans?.forEach(p => {
        if (dataMap[p.category]?.[p.subcategory]) {
          dataMap[p.category][p.subcategory].currentPlan = parseFloat(p.planned_amount) || 0;
          currentPlanSet.add(`${p.category}-${p.subcategory}`);
        }
      });



      setBudgetData(dataMap);

      // Expand all by default
      const exp: Record<string, boolean> = {};
      Object.keys(dataMap).forEach(c => exp[c] = true);
      setExpandedCats(exp);

    } catch (err: any) {
      toast.error(err.message || "Failed to load");
    } finally {
      setIsLoading(false);
    }
  };

  const handleValChange = (cat: string, sub: string, val: string) => {
    let num = parseFloat(val);
    if (isNaN(num)) num = 0;
    
    setBudgetData(prev => ({
      ...prev,
      [cat]: {
        ...prev[cat],
        [sub]: {
          ...prev[cat][sub],
          currentPlan: num
        }
      }
    }));
  };

  const applyGlobalChange = () => {
    const pct = parseFloat(globalChangePct);
    if (isNaN(pct)) return;
    const factor = 1 + (pct / 100);

    const newData = JSON.parse(JSON.stringify(budgetData));
    Object.keys(newData).forEach(cat => {
      Object.keys(newData[cat]).forEach(sub => {
        newData[cat][sub].currentPlan = Math.round(newData[cat][sub].prevBudget * factor);
      });
    });
    setBudgetData(newData);
    toast.success(`Applied ${pct}% global change`);
  };

  const handleValueChange = (cat: string, sub: string, field: keyof BudgetItem, val: string) => {
    const num = parseFloat(val) || 0;
    setBudgetData(prev => ({
      ...prev,
      [cat]: {
        ...prev[cat],
        [sub]: { ...prev[cat][sub], [field]: num }
      }
    }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const payloads: any[] = [];
      Object.entries(budgetData).forEach(([category, subcategories]) => {
        Object.entries(subcategories).forEach(([subcategory, item]) => {
          payloads.push({
            category,
            subcategory,
            month: targetMonth,
            planned_amount: item.currentPlan
          });
        });
      });

      const { error } = await supabase.from('budget_plans').upsert(payloads, { onConflict: 'category, subcategory, month' });
      if (error) throw error;
      toast.success("Budget Saved!");
    } catch (error: any) {
      toast.error(error.message || "Submit failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totals = useMemo(() => {
    let grandIncome = 0;
    let grandExpense = 0;
    let grandIncomePrevBudget = 0;
    let grandIncomePrevActual = 0;
    let grandExpensePrevBudget = 0;
    let grandExpensePrevActual = 0;
    const cats: Record<string, { incomePlan: number, expensePlan: number }> = {};
    
    Object.entries(budgetData).forEach(([cat, subs]) => {
      const isInc = cat === "Income" || incomeCats.has(cat);
      cats[cat] = { incomePlan: 0, expensePlan: 0 };
      Object.values(subs).forEach(item => {
        if (isInc) {
          grandIncome += item.currentPlan;
          grandIncomePrevBudget += item.prevBudget;
          grandIncomePrevActual += item.prevActual;
          cats[cat].incomePlan += item.currentPlan;
        } else {
          grandExpense += item.currentPlan;
          grandExpensePrevBudget += item.prevBudget;
          grandExpensePrevActual += item.prevActual;
          cats[cat].expensePlan += item.currentPlan;
        }
      });
    });
    return { 
      grandIncome, grandExpense, 
      grandIncomePrevBudget, grandIncomePrevActual,
      grandExpensePrevBudget, grandExpensePrevActual,
      cats 
    };
  }, [budgetData]);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-48 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        <PageHeader title="Budget Plan"  >
        <div className="flex items-center gap-2">

          <Link 
            href="/reports/finance" 
            className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-muted-foreground/60 hover:text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
            title="View Reports"
          >
            <BarChart2 className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Link>
        </div>
      </PageHeader>
        <div className="-mt-2 mb-6">
          <SectionNav tabs={EXPENSE_TABS} activePath="/expenses/current-budget" />
        </div>
        <SubNav 
          items={["Current Budget", "Budget Plan"]}
          activeItem="Budget Plan"
          onChange={(val) => {
            if (val === "Current Budget") router.push("/expenses/current-budget");
          }}
        />

      <div className={`space-y-6 w-full transition-opacity duration-300 ${isLoading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
        
        {/* Comparison Config (Restored Selectors) */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/40 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black text-muted-foreground/60 ml-1">Reference Plan</span>
                <div className="bg-muted rounded-lg p-3 flex items-center shadow-inner">
                  <Select 
                    value={planCompMonth}
                    onChange={(e) => setPlanCompMonth(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-xs font-black text-foreground focus:ring-0 appearance-none tracking-tighter cursor-pointer"
                  >
                    {compMonthOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black text-muted-foreground/60 ml-1">Reference Actuals</span>
                <div className="bg-muted rounded-lg p-3 flex items-center shadow-inner">
                  <Select 
                    value={actualCompMonth}
                    onChange={(e) => setActualCompMonth(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-xs font-black text-foreground focus:ring-0 appearance-none tracking-tighter cursor-pointer"
                  >
                    {compMonthOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </div>
              </div>
           </div>

           <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-indigo-600 ml-1">Target Period</span>
              <div className="bg-indigo-50/30 rounded-lg p-4 flex items-center justify-between border border-indigo-100/50 shadow-inner">
                 <Select 
                   value={targetMonth}
                   onChange={(e) => setTargetMonth(e.target.value)}
                   className="bg-transparent border-none p-0 text-lg font-black text-indigo-600 focus:ring-0 appearance-none tracking-tighter cursor-pointer"
                 >
                   {targetMonthOptions.map(opt => (
                     <option key={opt.value} value={opt.value}>{opt.label}</option>
                   ))}
                 </Select>
                 <TrendingUp size={20} className="text-indigo-600 opacity-30" />
              </div>
           </div>
        </div>
        
        {/* Summary Cards: Income and Total Budget */}
        <div className="space-y-4 mb-8">
           <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/40 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                 <h2 className="text-[20px] font-medium text-emerald-600 tracking-tighter leading-none">Total Income</h2>
                 <span className="text-[9px] font-black text-muted-foreground/40 tracking-[2px]">Planned revenue</span>
              </div>
              <TripleBox 
                val1={totals.grandIncomePrevBudget}
                val2={totals.grandIncomePrevActual}
                val3={totals.grandIncome}
                readOnly
                highlight="text-emerald-600"
                isCategory
              />
           </div>

           <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/40 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                 <h2 className="text-[20px] font-medium text-indigo-600 tracking-tighter leading-none">Total Budget</h2>
                 <span className="text-[9px] font-black text-muted-foreground/40 tracking-[2px]">Planned expenses</span>
              </div>
              <TripleBox 
                val1={totals.grandExpensePrevBudget}
                val2={totals.grandExpensePrevActual}
                val3={totals.grandExpense}
                readOnly
                highlight="text-indigo-600"
                isCategory
              />
           </div>
        </div>

        {/* Categories List */}
        <div className="space-y-4">
          {Object.entries(budgetData).map(([cat, subs]) => {
            const isIncome = cat === "Income" || incomeCats.has(cat);

            const catTotals = totals.cats[cat];
            const catValue = isIncome ? catTotals.incomePlan : catTotals.expensePlan;
            const grandTotal = isIncome ? totals.grandIncome : totals.grandExpense;
            const catPercent = grandTotal > 0 ? Math.round((catValue / grandTotal) * 100) : 0;
            
            let catPrevBudget = 0;
            let catPrevActual = 0;
            Object.values(subs).forEach(item => {
              catPrevBudget += item.prevBudget;
              catPrevActual += item.prevActual;
            });

            return (
              <div 
                key={cat} 
                className="bg-card rounded-2xl shadow-sm border border-border/40 overflow-hidden hover:border-indigo-600/30 transition-all group"
              >
                {/* Category Row */}
                <div className="p-5 cursor-pointer" onClick={() => toggleExpand(cat)}>
                   <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between mb-3">
                      <h2 className="text-[20px] font-medium text-foreground tracking-tighter leading-none">
                        {cat}
                      </h2>
                      <TripleBox 
                        val1={catPrevBudget} 
                        val2={catPrevActual} 
                        val3={catValue}
                        readOnly
                        highlight={isIncome ? "text-emerald-600" : "text-indigo-600"}
                        isCategory
                      />
                   </div>

                   {/* Surgical Progress Bar (Category vs Total) */}
                   <div className="flex flex-col gap-1 mt-2">
                     <span className="text-[9px] font-black text-indigo-600/60 ml-1">{catPercent}% weight</span>
                     <div className="h-1 bg-muted w-full relative rounded-full overflow-hidden">
                       <div 
                         className="absolute top-0 left-0 h-full transition-all bg-indigo-600" 
                         style={{ width: `${catPercent}%` }}
                       />
                     </div>
                   </div>
                </div>

                {/* Sub-categories */}
                {expanded[cat] && (
                  <div className="p-5 pt-2 space-y-6 bg-muted/10 border-t border-border/40">
                    <TripleBox headerMode />
                    {Object.entries(subs).map(([sub, item]) => {
                      const subPercent = catValue > 0 ? Math.round((item.currentPlan / catValue) * 100) : 0;
                      return (
                        <div key={sub} className="flex flex-col gap-2">
                          <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[14px] font-medium text-foreground tracking-tight leading-none">{sub}</span>
                            </div>
                            <TripleBox 
                              val1={item.prevBudget}
                              val2={item.prevActual}
                              val3={item.currentPlan}
                              onChange={(field, val) => handleValueChange(cat, sub, field, val)}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                             <span className="text-[8px] font-black text-muted-foreground/40 ml-0.5">{subPercent}% weight</span>
                             <div className="w-full h-0.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full transition-all bg-indigo-600" style={{ width: `${subPercent}%` }} />
                             </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-8 pb-32 flex justify-center">
           <SaveButton type="submit" isSaving={isSubmitting} disabled={isSubmitting} label="Save" className="w-full max-w-xs h-12 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-muted" />
        </div>
      </div>
      </div>
    </div>
  );
}

function TripleBox({ 
  headerMode = false, 
  val1 = 0, 
  val2 = 0, 
  val3 = 0, 
  readOnly = false,
  highlight = "",
  isCategory = false,
  onChange
}: { 
  headerMode?: boolean; 
  val1?: number; 
  val2?: number; 
  val3?: number; 
  readOnly?: boolean; 
  highlight?: string;
  isCategory?: boolean;
  onChange?: (field: 'prevBudget' | 'prevActual' | 'currentPlan', val: string) => void;
}) {
  if (headerMode) {
    return (
            <div className="flex gap-2 justify-end px-2">
        <div className="w-[70px] text-center text-[7px] font-black tracking-[1px] text-muted-foreground/30 leading-none">Budget</div>
        <div className="w-[70px] text-center text-[7px] font-black tracking-[1px] text-muted-foreground/30 leading-none">Actual</div>
        <div className="w-[80px] text-center text-[7px] font-black tracking-[1px] text-indigo-600/50 leading-none font-sans">Plan</div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
       <div className={`${isCategory ? 'w-[80px] h-12 text-[11px]' : 'w-[70px] h-10 text-[10px]'} bg-muted/50 rounded-lg flex items-center justify-center font-black text-muted-foreground/40 truncate px-1`}>
         <span className="rupee">₹</span>{Math.round(val1).toLocaleString()}
       </div>
       <div className={`${isCategory ? 'w-[80px] h-12 text-[11px]' : 'w-[70px] h-10 text-[10px]'} bg-muted/50 rounded-lg flex items-center justify-center font-black text-muted-foreground/40 truncate px-1`}>
         <span className="rupee">₹</span>{Math.round(val2).toLocaleString()}
       </div>
       <input 
         type="number"
         value={val3}
         readOnly={readOnly}
         onChange={(e) => onChange?.('currentPlan', e.target.value)}
         placeholder="0"
         inputMode="decimal"
         className={`${isCategory ? 'w-[90px] h-12 text-sm' : 'w-[80px] h-10 text-xs'} bg-card rounded-lg border border-border/40 text-center font-black focus:ring-2 focus:ring-indigo-600/10 transition-all outline-none ${highlight || 'text-foreground'} shadow-inner`}
       />
    </div>
  );
}

export default function BudgetPlanPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground font-black tracking-widest text-xs animate-pulse">Simulating Plan...</div>}>
      <BudgetPlanContent />
    </Suspense>
  );
}
