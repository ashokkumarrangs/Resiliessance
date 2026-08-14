"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { PageWrapper } from "@/components/PageWrapper";
import { EXPENSE_TABS } from "@/lib/navigation";
import { SubNav } from "@/components/SubNav";
import { Currency } from "@/components/currency";
import { 
  Target, TrendingUp, Wallet, PlusCircle, CheckCircle2, AlertTriangle, 
  PiggyBank, Percent, Calendar, Edit3, Trash2, Info, Coins, Lock, ArrowRight,
  RefreshCw, CheckSquare, Square
} from "lucide-react";
import { format, differenceInMonths, parseISO } from "date-fns";

interface SavingsGoal {
  id: string;
  created_at: string;
  name: string;
  target_amount: number;
  target_date: string | null;
  category: string;
  status: "active" | "completed" | "paused";
  notes: string;
}

interface SavingsAllocation {
  id: string;
  goal_id: string;
  account_name: string;
  allocated_amount: number;
}

interface LiquidityAccount {
  account_name: string;
  balance: number;
  type: string;
  tags: string[];
}

export default function SavingsPage() {
  const [activeTab, setActiveTab] = useState<"Overview" | "Active Goals" | "Completed Goals" | "Add Goal">("Overview");
  
  // Data State
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [allocations, setAllocations] = useState<SavingsAllocation[]>([]);
  const [liquidityAccounts, setLiquidityAccounts] = useState<LiquidityAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit / Allocation Modals State
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [allocationGoal, setAllocationGoal] = useState<SavingsGoal | null>(null);
  const [allocationValues, setAllocationValues] = useState<{ [accountName: string]: string }>({});

  // Form State for Adding / Editing Goals
  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    target_date: "",
    category: "General",
    notes: ""
  });

  const categories = [
    "General", "Emergency Fund", "Travel", "Tech Upgrade", 
    "Vehicle", "Investment", "Lifestyle", "Property"
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Savings Goals
      const { data: goalsData, error: goalsError } = await supabase
        .from("savings_goals")
        .select("*")
        .order("created_at", { ascending: false });
      if (goalsError) throw goalsError;
      setGoals(goalsData || []);

      // 2. Fetch Allocations
      const { data: allocData, error: allocError } = await supabase
        .from("savings_allocations")
        .select("*");
      if (allocError) throw allocError;
      setAllocations(allocData || []);

      // 3. Fetch Liquidity Accounts
      const { data: liqData, error: liqError } = await supabase
        .from("liquidity")
        .select("account_name, balance, type, tags");
      if (liqError) throw liqError;
      setLiquidityAccounts(liqData || []);
    } catch (error: any) {
      console.error("Error fetching savings data:", error);
      toast.error(error.message || "Failed to load savings details");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter accounts that have the "savings" tag (case-insensitive)
  const savingsAccounts = liquidityAccounts.filter(acc => 
    acc.tags && Array.isArray(acc.tags) && acc.tags.some(t => t.toLowerCase() === "savings")
  );

  // Math Calculations for Dashboard
  const totalSavingsPool = savingsAccounts.reduce((sum, acc) => sum + (parseFloat(acc.balance as any) || 0), 0);
  const totalAllocated = allocations.reduce((sum, alloc) => sum + (parseFloat(alloc.allocated_amount as any) || 0), 0);
  const unallocatedSavings = totalSavingsPool - totalAllocated;

  // Calculate allocation totals grouped by account
  const getAllocatedFromAccount = (accountName: string) => {
    return allocations
      .filter(a => a.account_name === accountName)
      .reduce((sum, a) => sum + (parseFloat(a.allocated_amount as any) || 0), 0);
  };

  const getUnallocatedForAccount = (account: LiquidityAccount) => {
    const allocated = getAllocatedFromAccount(account.account_name);
    return account.balance - allocated;
  };

  // Get total allocation for a specific goal
  const getGoalAllocatedAmount = (goalId: string) => {
    return allocations
      .filter(a => a.goal_id === goalId)
      .reduce((sum, a) => sum + (parseFloat(a.allocated_amount as any) || 0), 0);
  };

  const getGoalAllocations = (goalId: string) => {
    return allocations.filter(a => a.goal_id === goalId);
  };

  // Handle Form Submission (Add/Edit Goal)
  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.target_amount) {
      toast.error("Please provide a name and target amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const targetVal = parseFloat(formData.target_amount);
      if (isNaN(targetVal) || targetVal <= 0) {
        throw new Error("Target amount must be a positive number");
      }

      const payload = {
        name: formData.name.trim(),
        target_amount: targetVal,
        target_date: formData.target_date || null,
        category: formData.category,
        notes: formData.notes.trim()
      };

      let error;
      if (editingGoal) {
        const res = await supabase
          .from("savings_goals")
          .update(payload)
          .eq("id", editingGoal.id);
        error = res.error;
      } else {
        const res = await supabase
          .from("savings_goals")
          .insert([payload]);
        error = res.error;
      }

      if (error) throw error;

      toast.success(editingGoal ? "Savings Goal updated!" : "Savings Goal created!");
      setFormData({ name: "", target_amount: "", target_date: "", category: "General", notes: "" });
      setEditingGoal(null);
      setActiveTab("Active Goals");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save goal");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete savings goal
  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Are you sure you want to delete this goal? This will clear all allocations to it.")) return;
    try {
      const { error } = await supabase.from("savings_goals").delete().eq("id", id);
      if (error) throw error;
      toast.success("Goal deleted");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to delete goal");
    }
  };

  // Handle status toggle (active <-> completed/paused)
  const toggleGoalStatus = async (goal: SavingsGoal, nextStatus: "active" | "completed" | "paused") => {
    try {
      const { error } = await supabase
        .from("savings_goals")
        .update({ status: nextStatus })
        .eq("id", goal.id);
      if (error) throw error;
      toast.success(`Goal marked as ${nextStatus}`);
      fetchData();
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  // Open Allocations modal
  const handleOpenAllocationModal = (goal: SavingsGoal) => {
    setAllocationGoal(goal);
    // Initialize allocation values for each savings account
    const values: { [accountName: string]: string } = {};
    savingsAccounts.forEach(acc => {
      const match = allocations.find(a => a.goal_id === goal.id && a.account_name === acc.account_name);
      values[acc.account_name] = match ? match.allocated_amount.toString() : "";
    });
    setAllocationValues(values);
  };

  // Save Allocations from modal
  const handleSaveAllocations = async () => {
    if (!allocationGoal) return;
    setIsSubmitting(true);
    try {
      // Validate all allocations
      const updates = [];
      const deletes = [];

      for (const acc of savingsAccounts) {
        const inputStr = allocationValues[acc.account_name] || "";
        const amount = inputStr.trim() === "" ? 0 : parseFloat(inputStr);

        if (isNaN(amount) || amount < 0) {
          throw new Error(`Invalid allocation amount for ${acc.account_name}`);
        }

        // Calculate total allocated to OTHER goals from this account
        const allocatedToOthers = allocations
          .filter(a => a.account_name === acc.account_name && a.goal_id !== allocationGoal.id)
          .reduce((sum, a) => sum + (parseFloat(a.allocated_amount as any) || 0), 0);

        if (amount > acc.balance - allocatedToOthers) {
          throw new Error(`Insufficient funds in ${acc.account_name}. Maximum available is ₹${(acc.balance - allocatedToOthers).toLocaleString('en-IN')}`);
        }

        const existing = allocations.find(a => a.goal_id === allocationGoal.id && a.account_name === acc.account_name);
        
        if (amount === 0) {
          if (existing) {
            deletes.push(existing.id);
          }
        } else {
          if (existing) {
            updates.push({
              id: existing.id,
              goal_id: allocationGoal.id,
              account_name: acc.account_name,
              allocated_amount: amount
            });
          } else {
            updates.push({
              goal_id: allocationGoal.id,
              account_name: acc.account_name,
              allocated_amount: amount
            });
          }
        }
      }

      // Execute deletions
      if (deletes.length > 0) {
        const { error: delError } = await supabase
          .from("savings_allocations")
          .delete()
          .in("id", deletes);
        if (delError) throw delError;
      }

      // Execute updates / inserts (upsert)
      if (updates.length > 0) {
        const { error: upsertError } = await supabase
          .from("savings_allocations")
          .upsert(updates);
        if (upsertError) throw upsertError;
      }

      toast.success("Allocations updated successfully!");
      setAllocationGoal(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save allocations");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to calculate pace details
  const getGoalPaceMessage = (goal: SavingsGoal) => {
    const allocated = getGoalAllocatedAmount(goal.id);
    const needed = goal.target_amount - allocated;
    if (needed <= 0) return "Goal Achieved! 🎉";
    if (!goal.target_date) return "No target date set";

    const targetDate = parseISO(goal.target_date);
    const months = differenceInMonths(targetDate, new Date());
    if (months <= 0) {
      return `Target month reached! Needs ₹${needed.toLocaleString('en-IN')} immediately`;
    }

    const monthlyRate = Math.ceil(needed / months);
    return `Save ₹${monthlyRate.toLocaleString('en-IN')}/mo for ${months} mos`;
  };

  return (
    <PageWrapper
      title="Savings Tracker"
      reportHref="/reports/finance"
      sectionTabs={EXPENSE_TABS}
      activePath="/expenses/savings"
    >
      <SubNav 
        items={["Overview", "Active Goals", "Completed Goals", "Add Goal"]}
        activeItem={activeTab}
        onChange={(val) => {
          if (val === "Add Goal") {
            setEditingGoal(null);
            setFormData({ name: "", target_amount: "", target_date: "", category: "General", notes: "" });
          }
          setActiveTab(val as any);
        }}
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="animate-spin text-accent" size={32} />
          <p className="text-xs font-black uppercase text-muted-foreground/60 tracking-widest">Retrieving Vault data...</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === "Overview" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Pool Metrics Dashboard Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border/40 p-5 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] font-black uppercase tracking-wider">Savings Pool</span>
                    <Wallet size={16} className="text-primary" />
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black font-mono text-primary leading-none">
                      <Currency value={totalSavingsPool} />
                    </div>
                    <span className="text-[9px] text-muted-foreground/50 font-bold block mt-1">Sum of Savings-tagged accounts</span>
                  </div>
                </div>

                <div className="bg-card border border-border/40 p-5 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] font-black uppercase tracking-wider">Allocated</span>
                    <Target size={16} className="text-emerald-500" />
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black font-mono text-emerald-500 leading-none">
                      <Currency value={totalAllocated} />
                    </div>
                    <span className="text-[9px] text-muted-foreground/50 font-bold block mt-1">Distributed to active goals</span>
                  </div>
                </div>

                <div className="bg-card border border-border/40 p-5 rounded-2xl flex flex-col justify-between col-span-2 relative overflow-hidden">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] font-black uppercase tracking-wider">Unallocated (Available)</span>
                    <Coins size={16} className={unallocatedSavings < 0 ? "text-rose-500" : "text-amber-500"} />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between gap-4">
                    <div>
                      <div className={`text-3xl font-black font-mono leading-none ${unallocatedSavings < 0 ? "text-rose-500" : "text-amber-500"}`}>
                        <Currency value={unallocatedSavings} />
                      </div>
                      <span className="text-[9px] text-muted-foreground/50 font-bold block mt-1.5">Free cash available for envelopes</span>
                    </div>
                    {totalSavingsPool > 0 && (
                      <div className="text-right">
                        <div className="text-xs font-black text-foreground">
                          {Math.max(0, Math.floor((unallocatedSavings / totalSavingsPool) * 100))}%
                        </div>
                        <span className="text-[8px] uppercase tracking-wider text-muted-foreground/40 font-bold">Unassigned</span>
                      </div>
                    )}
                  </div>

                  {unallocatedSavings < 0 && (
                    <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl flex items-start gap-2 text-xs font-bold">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <div>
                        Overallocated by <Currency value={Math.abs(unallocatedSavings)} />! The allocated sums exceed your actual Savings Accounts balances. Re-adjust your allocations.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Savings-Tagged Accounts Pool */}
              <div className="bg-card border border-border/40 rounded-2xl p-6">
                <h3 className="text-xs font-black uppercase tracking-[2px] text-muted-foreground/60 mb-4 flex items-center gap-2">
                  <PiggyBank size={16} /> Savings-Tagged Liquidity Accounts
                </h3>
                {savingsAccounts.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-border/60 rounded-xl bg-muted/20">
                    <p className="text-xs font-bold text-muted-foreground">No accounts tagged with "Savings".</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      Go to <strong>Manage Accounts</strong>, select an account, and add the tag "Savings" to see it here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/20">
                    {savingsAccounts.map(acc => {
                      const allocated = getAllocatedFromAccount(acc.account_name);
                      const unallocated = acc.balance - allocated;
                      const percentage = acc.balance > 0 ? Math.min(100, Math.floor((allocated / acc.balance) * 100)) : 0;
                      
                      return (
                        <div key={acc.account_name} className="py-3 first:pt-0 last:pb-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <div>
                              <span className="text-xs font-black text-foreground">{acc.account_name}</span>
                              <span className="text-[9px] font-bold text-muted-foreground ml-2 uppercase px-1.5 py-0.5 bg-muted rounded-md">{acc.type}</span>
                            </div>
                            <span className="text-xs font-black font-mono text-primary">
                              <Currency value={acc.balance} />
                            </span>
                          </div>
                          
                          {/* Account Allocation breakdown bar */}
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden mb-1.5">
                            <div 
                              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground/50">
                            <span>Allocated: <Currency value={allocated} /> ({percentage}%)</span>
                            <span>Unallocated: <span className={unallocated < 0 ? "text-rose-500" : "text-foreground"}><Currency value={unallocated} /></span></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Summary list of Goals */}
              <div className="bg-card border border-border/40 rounded-2xl p-6">
                <h3 className="text-xs font-black uppercase tracking-[2px] text-muted-foreground/60 mb-4 flex items-center justify-between">
                  <span>Goals Allocation Summary</span>
                  <span className="text-[10px] lowercase text-muted-foreground/40 font-bold">{goals.length} goals</span>
                </h3>
                {goals.length === 0 ? (
                  <p className="text-xs text-center py-6 text-muted-foreground font-bold">No goals added yet.</p>
                ) : (
                  <div className="divide-y divide-border/20">
                    {goals.map(goal => {
                      const allocated = getGoalAllocatedAmount(goal.id);
                      const percent = Math.min(100, Math.floor((allocated / goal.target_amount) * 100));
                      return (
                        <div key={goal.id} className="py-2.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-foreground truncate">{goal.name}</span>
                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                                goal.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                                goal.status === 'paused' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'
                              }`}>
                                {goal.status}
                              </span>
                            </div>
                            <span className="text-[9px] text-muted-foreground/50 font-bold block">{goal.category}</span>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                              <span className="text-xs font-black font-mono text-foreground">
                                <Currency value={allocated} />
                              </span>
                              <span className="text-[10px] text-muted-foreground/40 font-mono"> / <Currency value={goal.target_amount} /></span>
                            </div>
                            <div className="w-10 text-right text-xs font-black text-primary">
                              {percent}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2 & 3: GOALS LISTS (ACTIVE OR COMPLETED) */}
          {(activeTab === "Active Goals" || activeTab === "Completed Goals") && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {goals.filter(g => activeTab === "Active Goals" ? g.status !== 'completed' : g.status === 'completed').length === 0 ? (
                <div className="text-center py-16 bg-card border border-border/40 rounded-2xl">
                  <Target size={36} className="text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-xs font-black uppercase text-muted-foreground/60 tracking-widest">
                    No {activeTab === "Active Goals" ? "Active" : "Completed"} Goals Found
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5">
                  {goals
                    .filter(g => activeTab === "Active Goals" ? g.status !== 'completed' : g.status === 'completed')
                    .map(goal => {
                      const allocated = getGoalAllocatedAmount(goal.id);
                      const percent = Math.min(100, Math.floor((allocated / goal.target_amount) * 100));
                      const isOverAllocated = allocated > goal.target_amount;
                      const goalAllocations = getGoalAllocations(goal.id);
                      
                      return (
                        <div key={goal.id} className="bg-card border border-border/40 rounded-2xl p-6 space-y-4 relative overflow-hidden shadow-sm">
                          
                          {/* Completed watermarked icon */}
                          {goal.status === "completed" && (
                            <div className="absolute right-4 top-4 opacity-5 rotate-12 text-emerald-500">
                              <CheckCircle2 size={96} />
                            </div>
                          )}

                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-black text-foreground leading-snug">{goal.name}</h3>
                                <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent rounded-full">
                                  {goal.category}
                                </span>
                                {goal.status === "paused" && (
                                  <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full">
                                    Paused
                                  </span>
                                )}
                              </div>
                              {goal.target_date && (
                                <span className="text-[9px] text-muted-foreground/50 font-bold block mt-1 flex items-center gap-1">
                                  <Calendar size={10} /> Target Date: {format(parseISO(goal.target_date), "dd MMM yyyy")}
                                </span>
                              )}
                            </div>

                            {/* Options Actions */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingGoal(goal);
                                  setFormData({
                                    name: goal.name,
                                    target_amount: goal.target_amount.toString(),
                                    target_date: goal.target_date || "",
                                    category: goal.category,
                                    notes: goal.notes || ""
                                  });
                                  setActiveTab("Add Goal");
                                }}
                                className="p-2 hover:bg-muted text-muted-foreground/50 hover:text-primary rounded-lg transition-all"
                                title="Edit Goal"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="p-2 hover:bg-rose-500/10 text-muted-foreground/50 hover:text-rose-500 rounded-lg transition-all"
                                title="Delete Goal"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Progress Meter */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-baseline">
                              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">Goal Progress</span>
                              <div className="text-right">
                                <span className="text-sm font-black font-mono text-primary">
                                  <Currency value={allocated} />
                                </span>
                                <span className="text-xs text-muted-foreground/40 font-mono"> / <Currency value={goal.target_amount} /></span>
                              </div>
                            </div>

                            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                              <div 
                                className={`h-2.5 rounded-full transition-all duration-500 ${
                                  goal.status === "completed" ? "bg-emerald-500" :
                                  isOverAllocated ? "bg-cyan-500" : "bg-primary"
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>

                            <div className="flex justify-between text-[9px] font-bold text-muted-foreground/40">
                              <span>{percent}% Saved</span>
                              {allocated < goal.target_amount ? (
                                <span>Remaining: <Currency value={goal.target_amount - allocated} /></span>
                              ) : (
                                <span className="text-emerald-500 font-black">Fully Funded! 🎉</span>
                              )}
                            </div>
                          </div>

                          {/* Pace calculator statement */}
                          {goal.status !== "completed" && (
                            <div className="p-3 bg-muted/30 border border-border/10 rounded-xl flex items-center justify-between text-xs">
                              <span className="font-bold text-muted-foreground/70 flex items-center gap-1.5">
                                <Info size={13} className="text-accent" />
                                {getGoalPaceMessage(goal)}
                              </span>
                              
                              {/* Quick actions for status toggling */}
                              <div className="flex gap-2">
                                {allocated >= goal.target_amount && goal.status === 'active' && (
                                  <button
                                    onClick={() => toggleGoalStatus(goal, 'completed')}
                                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                  >
                                    Mark Complete
                                  </button>
                                )}
                                {goal.status === 'active' ? (
                                  <button
                                    onClick={() => toggleGoalStatus(goal, 'paused')}
                                    className="px-2.5 py-1 bg-muted/65 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                  >
                                    Pause
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => toggleGoalStatus(goal, 'active')}
                                    className="px-2.5 py-1 bg-muted/65 hover:bg-muted text-primary rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                  >
                                    Resume
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          {goal.notes && (
                            <p className="text-[11px] text-muted-foreground/80 italic font-medium leading-relaxed bg-muted/10 p-3 rounded-xl border border-border/20">
                              "{goal.notes}"
                            </p>
                          )}

                          {/* Envelope allocation breakdown */}
                          <div className="border-t border-border/20 pt-4 space-y-2.5">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                                <Lock size={11} className="text-muted-foreground/40" /> Funding Envelopes
                              </span>
                              
                              <button
                                onClick={() => handleOpenAllocationModal(goal)}
                                className="text-[9px] font-black text-accent uppercase tracking-wider hover:underline flex items-center gap-0.5"
                              >
                                {goalAllocations.length > 0 ? "Manage Allocations" : "+ Allocate Cash"} <ArrowRight size={10} />
                              </button>
                            </div>

                            {goalAllocations.length === 0 ? (
                              <p className="text-[10px] text-muted-foreground/40 font-bold italic">No funds allocated from savings accounts yet.</p>
                            ) : (
                              <div className="grid grid-cols-1 gap-2">
                                {goalAllocations.map(a => (
                                  <div key={a.id} className="flex justify-between items-center text-xs font-bold p-2 bg-muted/20 border border-border/20 rounded-xl">
                                    <span className="text-muted-foreground/80">{a.account_name}</span>
                                    <span className="text-primary font-mono"><Currency value={a.allocated_amount} /></span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ADD/EDIT GOAL FORM */}
          {activeTab === "Add Goal" && (
            <form onSubmit={handleSaveGoal} className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/40 space-y-6">
                <div className="text-xs font-black uppercase tracking-[2px] text-accent/60 mb-2 border-b border-border/20 pb-3">
                  {editingGoal ? "Modify Goal Details" : "Define New Savings Goal"}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-2 leading-none">
                    <Target size={16} /> Goal Name
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Emergency Cash, Europe 2027" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full h-11 bg-muted border-none rounded-lg px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner transition-all placeholder:text-muted-foreground/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-2 leading-none">
                      <Wallet size={16} /> Target Amount (₹)
                    </label>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="e.g. 50000" 
                      value={formData.target_amount}
                      onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
                      className="w-full h-11 bg-muted border-none rounded-lg px-4 text-sm font-black text-primary focus:ring-2 focus:ring-accent/20 shadow-inner transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-2 leading-none">
                      <Calendar size={16} /> Target Date
                    </label>
                    <input 
                      type="date" 
                      value={formData.target_date}
                      onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                      className="w-full h-11 bg-muted border-none rounded-lg px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-2 leading-none">
                    <Percent size={16} /> Category
                  </label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full h-11 bg-muted border-none rounded-lg px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner transition-all appearance-none border border-transparent"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-2 leading-none">
                    <Info size={16} /> Notes / Instructions
                  </label>
                  <textarea 
                    placeholder="Provide context like links, model upgrades, or timeline checkpoints..." 
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full min-h-[100px] bg-muted border-none rounded-lg p-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner transition-all placeholder:text-muted-foreground/30 resize-none"
                  />
                </div>

                {/* Submit button layout */}
                <div className="flex gap-4 pt-4">
                  {editingGoal && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingGoal(null);
                        setFormData({ name: "", target_amount: "", target_date: "", category: "General", notes: "" });
                        setActiveTab("Active Goals");
                      }}
                      className="w-1/3 h-12 bg-muted/65 hover:bg-muted text-muted-foreground rounded-xl font-black text-sm flex items-center justify-center transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-muted ${editingGoal ? 'w-2/3' : 'w-full'}`}
                  >
                    {isSubmitting ? "Processing..." : editingGoal ? "Update Goal Details" : "Initiate Savings Goal"}
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>
      )}

      {/* ALLOCATION DIALOG OVERLAY */}
      {allocationGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-3xl p-6 border border-border/80 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="text-base font-black text-foreground flex items-center gap-2">
                  <Lock className="text-accent" size={18} /> Manage Envelope Allocations
                </h3>
                <button
                  onClick={() => setAllocationGoal(null)}
                  className="w-8 h-8 rounded-full bg-muted/40 hover:bg-muted flex items-center justify-center text-muted-foreground font-black text-lg transition-all"
                >
                  ×
                </button>
              </div>
              <p className="text-xs text-muted-foreground/60 font-bold mt-1">
                Distribute savings to <strong>{allocationGoal.name}</strong> (Target: <Currency value={allocationGoal.target_amount} />)
              </p>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-4 pr-1">
              {savingsAccounts.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground font-bold italic">
                  No Savings-tagged accounts available to allocate from.
                </div>
              ) : (
                savingsAccounts.map(acc => {
                  const allocatedToOthers = allocations
                    .filter(a => a.account_name === acc.account_name && a.goal_id !== allocationGoal.id)
                    .reduce((sum, a) => sum + (parseFloat(a.allocated_amount as any) || 0), 0);
                  const maxAvailable = acc.balance - allocatedToOthers;
                  
                  return (
                    <div key={acc.account_name} className="p-4 bg-muted/20 border border-border/30 rounded-2xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-black text-foreground block">{acc.account_name}</span>
                          <span className="text-[9px] text-muted-foreground/50 font-black block mt-0.5">
                            Max Available: <Currency value={maxAvailable} /> 
                            <span className="text-[8px] text-muted-foreground/30 font-bold ml-1">(Balance: <Currency value={acc.balance} />)</span>
                          </span>
                        </div>
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="₹0.00"
                          value={allocationValues[acc.account_name] || ""}
                          onChange={(e) => setAllocationValues({
                            ...allocationValues,
                            [acc.account_name]: e.target.value
                          })}
                          className="w-full h-10 bg-muted border-none rounded-lg px-4 text-xs font-black text-primary focus:ring-2 focus:ring-accent/20 shadow-inner font-mono"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/30 font-black">INR</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAllocationGoal(null)}
                className="w-1/2 h-11 bg-muted/65 hover:bg-muted text-muted-foreground rounded-xl font-black text-xs transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting || savingsAccounts.length === 0}
                onClick={handleSaveAllocations}
                className="w-1/2 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-950/20 flex items-center justify-center transition-all active:scale-95 disabled:bg-muted"
              >
                {isSubmitting ? "Saving..." : "Confirm Envelope"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
