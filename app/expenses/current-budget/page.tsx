"use client";

import { BarChart2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Currency } from "@/components/currency";
import { PageHeader } from "@/components/PageHeader";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SectionNav } from "@/components/SectionNav";
import { EXPENSE_TABS } from "@/lib/navigation";
import { toast } from "sonner";
import { SubNav } from "@/components/SubNav";
import { parseISO } from "date-fns";

const incomeCategories = new Set(['Income', 'Salary', 'Business', 'Investments', 'Other Income', 'Bonus', 'Dividend', 'Interest']);

interface SubcategoryData {
  planned: number;
  actual: number;
}

interface CategoryData {
  planned: number;
  actual: number;
  subcategories: Record<string, SubcategoryData>;
}

export default function CurrentBudgetPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [budgetData, setBudgetData] = useState<Record<string, CategoryData>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const currentMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }, []);

  const monthString = useMemo(() => {
    return parseISO(currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [currentMonth]);

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const nextMonth = parseISO(currentMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;

      const { data: plans } = await supabase
        .from('budget_plans')
        .select('*')
        .eq('month', currentMonth);
      
      const { data: actuals } = await supabase
        .from('history_expenses')
        .select('*')
        .eq('type', 'Expense')
        .gte('date', currentMonth)
        .lt('date', nextMonthStr);

      const tree: Record<string, CategoryData> = {};

      plans?.forEach(p => {
        if (incomeCategories.has(p.category)) return;

        if (!tree[p.category]) {
          tree[p.category] = { planned: 0, actual: 0, subcategories: {} };
        }
        const amt = parseFloat(p.planned_amount) || 0;
        tree[p.category].planned += amt;
        tree[p.category].subcategories[p.subcategory] = { planned: amt, actual: 0 };
      });

      actuals?.forEach(a => {
        if (incomeCategories.has(a.category)) return;

        if (!tree[a.category]) {
          tree[a.category] = { planned: 0, actual: 0, subcategories: {} };
        }
        const amt = parseFloat(a.amount) || 0;
        tree[a.category].actual += amt;
        if (!tree[a.category].subcategories[a.subcategory]) {
          tree[a.category].subcategories[a.subcategory] = { planned: 0, actual: 0 };
        }
        tree[a.category].subcategories[a.subcategory].actual += amt;
      });

      setBudgetData(tree);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch budget intelligence");
    } finally {
      setIsLoading(false);
    }
  };

  const totals = useMemo(() => {
    let grandPlanned = 0;
    let grandActual = 0;
    Object.values(budgetData).forEach(cat => {
      grandPlanned += cat.planned;
      grandActual += cat.actual;
    });
    const remaining = grandPlanned - grandActual;
    const percent = grandPlanned > 0 ? Math.round((grandActual / grandPlanned) * 100) : (grandActual > 0 ? 999 : 0);
    return { grandPlanned, grandActual, remaining, percent };
  }, [budgetData]);

  const toggleExpand = (cat: string) => {
    setExpanded(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex flex-col justify-center"><LoadingScreen message="Calculating Financial Intelligence..." /></div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-32 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        <PageHeader title="Current Budget">
        <div className="flex items-center gap-2">

          <div className="flex items-center gap-3">
            <div className="text-[10px] font-black text-indigo-600 tracking-[3px] bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
              {monthString}
            </div>
            <button onClick={fetchData} className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-muted-foreground/60 hover:text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0">
              <RefreshCw className="w-4 h-4 md:w-[18px] md:h-[18px]" />
            </button>
          </div>
        
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
          activeItem="Current Budget"
          onChange={(val) => {
            if (val === "Budget Plan") router.push("/expenses/budget-plan");
          }}
        />

      <div className="space-y-6 w-full">
        
        {/* Compact Utilization Row */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/40 flex items-center justify-between">
           <div>
              <div className="text-[10px] font-black text-muted-foreground/40 tracking-[3px] mb-1">Current Usage</div>
              <div className="flex items-baseline gap-2">
                 <span className={`text-[42px] font-black leading-none tracking-tighter ${totals.percent > 100 ? 'text-destructive' : 'text-foreground'}`}>
                   {totals.percent === Infinity ? '∞' : totals.percent}%
                 </span>
                 <span className="text-xs font-black text-muted-foreground/60">Used</span>
              </div>
           </div>
           
           <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-muted/30">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  className="text-muted/40"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
                <circle
                  className={totals.percent > 100 ? "text-destructive" : "text-indigo-600"}
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - Math.min(totals.percent, 100) / 100)}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
              </svg>
              <BarChart2 size={24} className="text-muted-foreground/30" />
           </div>
        </div>

        {/* Totals Row: 3 Columns */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/40 grid grid-cols-3 gap-4">
           <StatBox label="Total Budget" value={totals.grandPlanned} color="text-foreground" />
           <StatBox label="Spent So Far" value={totals.grandActual} color="text-indigo-600" />
           <StatBox label="Remaining" value={totals.remaining} color={totals.remaining < 0 ? "text-destructive" : "text-emerald-600"} />
        </div>

        {/* Categories List */}
        <div className="space-y-4">
          {Object.entries(budgetData).map(([name, cat]) => {
            const utilization = cat.planned > 0 ? Math.round((cat.actual / cat.planned) * 100) : (cat.actual > 0 ? Infinity : 0);
            const remaining = cat.planned - cat.actual;

            return (
              <div 
                key={name} 
                onClick={() => toggleExpand(name)}
                className="bg-card rounded-2xl shadow-sm border border-border/40 overflow-hidden cursor-pointer hover:border-indigo-600/30 transition-all group"
              >
                {/* Category Row */}
                <div className="p-5">
                   <div className="flex items-center justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[22px] font-medium text-foreground tracking-tight truncate leading-none">{name}</h4>
                      </div>
                      <div className="flex items-center gap-8 text-right">
                        <BudgetCell label="Allotted" value={cat.planned} />
                        <BudgetCell label="Spent" value={cat.actual} highlight={utilization > 100 ? "text-destructive" : "text-indigo-600"} />
                        <BudgetCell label="Remaining" value={remaining} highlight={remaining < 0 ? "text-destructive" : "text-emerald-600"} />
                      </div>
                   </div>

                   {/* Surgical Progress Bar (Aligned with sub-cat) */}
                   <div className="flex flex-col gap-1 mt-2">
                      <span className="text-[9px] font-black text-indigo-600/60 ml-1">{utilization === Infinity ? '∞' : utilization}% used</span>
                      <div className="h-1 bg-muted w-full rounded-full overflow-hidden relative">
                        <div 
                          className={`absolute top-0 left-0 h-full transition-all ${utilization > 100 ? 'bg-destructive' : 'bg-indigo-600'}`} 
                          style={{ width: `${Math.min(utilization, 100)}%` }}
                        />
                      </div>
                   </div>
                </div>

                {/* Subcategories (Expanded) */}
                {expanded[name] && (
                  <div className="p-5 pt-2 space-y-5 bg-muted/10">
                    {Object.entries(cat.subcategories).map(([subName, sub]) => {
                      const subUtil = sub.planned > 0 ? Math.round((sub.actual / sub.planned) * 100) : (sub.actual > 0 ? Infinity : 0);
                      const subRem = sub.planned - sub.actual;
                      
                      return (
                        <div key={subName} className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <span className="text-[15px] font-medium text-muted-foreground truncate block leading-none">{subName}</span>
                            </div>
                            <div className="flex items-center gap-6 text-right">
                              <BudgetCell label="Allotted" value={sub.planned} mini />
                              <BudgetCell label="Spent" value={sub.actual} highlight={subUtil > 100 ? "text-destructive" : "text-indigo-600"} mini />
                              <BudgetCell label="Remaining" value={subRem} highlight={subRem < 0 ? "text-destructive" : "text-emerald-600"} mini />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[8px] font-black text-muted-foreground/50 ml-0.5">{subUtil === Infinity ? '∞' : subUtil}% used</span>
                            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all ${subUtil > 100 ? 'bg-destructive' : 'bg-indigo-400'}`}
                                style={{ width: `${Math.min(subUtil, 100)}%` }}
                              />
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
      </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col">
       <span className="text-[11px] font-black text-muted-foreground/60 tracking-widest mb-1">{label}</span>
       <span className={`text-xl font-black ${color} tracking-tight`}>
         <span className="rupee">₹</span>{value.toLocaleString()}
       </span>
    </div>
  );
}

function BudgetCell({ label, value, highlight = "text-foreground", mini = false }: { 
  label: string; 
  value: number; 
  highlight?: string; 
  mini?: boolean;
}) {
  return (
    <div className="flex flex-col">
       <span className={`${mini ? 'text-[11px]' : 'text-sm'} font-black ${highlight} tracking-tighter leading-none`}>
         <span className="rupee">₹</span>{value.toLocaleString()}
       </span>
       <span className={`${mini ? 'text-[7px]' : 'text-[9px]'} font-black text-muted-foreground/40 tracking-tighter mt-0.5`}>
         {label}
       </span>
    </div>
  );
}
