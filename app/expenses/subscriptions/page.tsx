"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { PageWrapper } from "@/components/PageWrapper";
import { EXPENSE_TABS } from "@/lib/navigation";
import { SubNav } from "@/components/SubNav";
import { Currency } from "@/components/currency";
import { SearchableSelect } from "@/components/SearchableSelect";
import { SaveButton } from "@/components/ui/SaveButton";
import { 
  CalendarDays, Play, Pause, Trash2, CheckSquare, Square, 
  RefreshCw, PlusCircle, CreditCard, ChevronRight, CheckCircle2,
  Calendar, DollarSign, Tag, ListTodo, Store, StickyNote
} from "lucide-react";
import { format, addMonths, addYears, addDays } from "date-fns";

interface Subscription {
  id: string;
  created_at: string;
  name: string;
  amount: number;
  frequency: "weekly" | "bi-weekly" | "monthly" | "bi-monthly" | "quarterly" | "yearly";
  next_due_date: string;
  category: string;
  subcategory: string;
  vendor: string;
  notes: string;
  status: "active" | "paused";
  account: string;
  type: "Subscription" | "Loan" | "Payment";
}

interface Account {
  account_name: string;
  balance: string;
}

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<"Active" | "Paused" | "Add Subscription">("Active");
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    frequency: "monthly" as "weekly" | "bi-weekly" | "monthly" | "bi-monthly" | "quarterly" | "yearly",
    next_due_date: format(new Date(), "yyyy-MM-dd"),
    category: "",
    subcategory: "",
    vendor: "",
    account: "",
    notes: "",
    type: "Subscription" as "Subscription" | "Loan" | "Payment"
  });

  const [entryTypes, setEntryTypes] = useState<string[]>(["Subscription", "Loan", "Payment"]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch subscriptions
      const { data: subsData, error: subsError } = await supabase
        .from("subscriptions")
        .select("*")
        .order("next_due_date", { ascending: true });
      if (subsError) throw subsError;
      setSubscriptions(subsData || []);

      // Gather unique entry types from database
      const dbTypes = Array.from(new Set(subsData?.map(s => s.type).filter(Boolean) || []));
      setEntryTypes(Array.from(new Set([...["Subscription", "Loan", "Payment"], ...dbTypes])));

      // 2. Fetch liquidity accounts
      const { data: accData } = await supabase
        .from("liquidity")
        .select("account_name");
      setAccounts(accData?.map(a => a.account_name) || []);

      // 3. Fetch autocomplete options from past history_expenses
      const { data: histData } = await supabase
        .from("history_expenses")
        .select("category, subcategory, vendor")
        .order("id", { ascending: false })
        .limit(1000);

      if (histData) {
        setCategories(Array.from(new Set(histData.map(h => h.category).filter(Boolean))));
        setSubcategories(Array.from(new Set(histData.map(h => h.subcategory).filter(Boolean))));
        setVendors(Array.from(new Set(histData.map(h => h.vendor).filter(Boolean))));
      }
    } catch (err: any) {
      console.error("Error fetching subscription data:", err);
      toast.error(err.message || "Failed to load subscriptions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount || !formData.next_due_date || !formData.account) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        amount: amt,
        frequency: formData.frequency,
        next_due_date: formData.next_due_date,
        category: formData.category || "Subscriptions",
        subcategory: formData.subcategory || "",
        vendor: formData.vendor || formData.name,
        account: formData.account,
        notes: formData.notes || "",
        status: editingSub ? editingSub.status : "active",
        type: formData.type || "Subscription"
      };

      if (editingSub) {
        const { error } = await supabase
          .from("subscriptions")
          .update(payload)
          .eq("id", editingSub.id);
        if (error) throw error;
        toast.success(`${formData.type} updated successfully`);
      } else {
        const { error } = await supabase
          .from("subscriptions")
          .insert([payload]);
        if (error) throw error;
        toast.success(`${formData.type} created successfully`);
      }

      resetForm();
      fetchData();
      setActiveTab("Active");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingSub(null);
    setFormData({
      name: "",
      amount: "",
      frequency: "monthly",
      next_due_date: format(new Date(), "yyyy-MM-dd"),
      category: "",
      subcategory: "",
      vendor: "",
      account: accounts[0] || "",
      notes: "",
      type: "Subscription"
    });
  };

  const handleEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setFormData({
      name: sub.name,
      amount: sub.amount.toString(),
      frequency: sub.frequency,
      next_due_date: sub.next_due_date,
      category: sub.category,
      subcategory: sub.subcategory,
      vendor: sub.vendor,
      account: sub.account,
      notes: sub.notes,
      type: sub.type || "Subscription"
    });
    setActiveTab("Add Subscription");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscription?")) return;
    try {
      const { error } = await supabase
        .from("subscriptions")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Subscription deleted");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete subscription");
    }
  };

  const toggleStatus = async (sub: Subscription) => {
    const newStatus = sub.status === "active" ? "paused" : "active";
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: newStatus })
        .eq("id", sub.id);
      if (error) throw error;
      toast.success(`Subscription ${newStatus === "active" ? "reactivated" : "paused"}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  // Helper to calculate next billing date based on frequency
  const calculateNextBillingDate = (currentDateStr: string, frequency: "weekly" | "bi-weekly" | "monthly" | "bi-monthly" | "quarterly" | "yearly"): string => {
    const cur = new Date(currentDateStr);
    let nextDate = new Date();
    if (frequency === "weekly") {
      nextDate = addDays(cur, 7);
    } else if (frequency === "bi-weekly") {
      nextDate = addDays(cur, 14);
    } else if (frequency === "monthly") {
      nextDate = addMonths(cur, 1);
    } else if (frequency === "bi-monthly") {
      nextDate = addMonths(cur, 2);
    } else if (frequency === "quarterly") {
      nextDate = addMonths(cur, 3);
    } else if (frequency === "yearly") {
      nextDate = addYears(cur, 1);
    }
    return format(nextDate, "yyyy-MM-dd");
  };

  // Log single payment
  const logPayment = async (sub: Subscription) => {
    setIsSubmitting(true);
    try {
      await processPayment(sub);
      toast.success(`Logged payment for ${sub.name}`);
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to log payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Log multiple payments
  const logMultiplePayments = async () => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    let count = 0;
    try {
      for (const id of selectedIds) {
        const sub = subscriptions.find(s => s.id === id);
        if (sub) {
          await processPayment(sub);
          count++;
        }
      }
      toast.success(`Logged payments for ${count} subscriptions`);
      setSelectedIds([]);
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed logging bulk payments");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Main atomic payment handler
  const processPayment = async (sub: Subscription) => {
    const dateStr = format(new Date(), "yyyy-MM-dd");
    const timeStr = format(new Date(), "HH:mm");

    const entryType = sub.type || "Subscription";
    const particularVal = `${entryType} Renewal: ${sub.name}`;
    const tagVal = `${entryType.toLowerCase()}, recurring`;
    const notesVal = sub.notes ? `${entryType} renewal payment. | ${sub.notes}` : `${entryType} renewal payment.`;
    const activityVal = `Paid ${entryType.toLowerCase()} for ${sub.name} (Amount: ₹${sub.amount})`;

    // 1. Insert into history_expenses
    const expensePayload = {
      date: dateStr,
      time: timeStr,
      amount: sub.amount,
      type: "Expense",
      account: sub.account,
      category: sub.category || "Subscriptions",
      subcategory: sub.subcategory || "",
      particular: particularVal,
      vendor: sub.vendor || sub.name,
      place: "",
      tags: tagVal,
      notes: notesVal
    };

    const { error: expError } = await supabase
      .from("history_expenses")
      .insert([expensePayload]);
    if (expError) throw expError;

    // 2. Post to activity_logs
    const logPayload = {
      activity: activityVal,
      date: dateStr,
      time: timeStr,
      occasion: "Recurring Bill Payment",
      notes: `Logged automatically from Subscriptions manager. Paid via ${sub.account}.`,
      created_at: new Date().toISOString()
    };
    await supabase.from("activity_logs").insert([logPayload]); // best effort

    // 3. Deduct Account Balance from Liquidity
    const { data: acc } = await supabase
      .from("liquidity")
      .select("balance")
      .eq("account_name", sub.account)
      .single();

    if (acc) {
      const newBal = (parseFloat(acc.balance) || 0) - sub.amount;
      await supabase
        .from("liquidity")
        .update({ balance: newBal.toFixed(2) })
        .eq("account_name", sub.account);
    }

    // 4. Update next due date in subscriptions table
    const nextDate = calculateNextBillingDate(sub.next_due_date, sub.frequency);
    const { error: subUpdateError } = await supabase
      .from("subscriptions")
      .update({ next_due_date: nextDate })
      .eq("id", sub.id);
    if (subUpdateError) throw subUpdateError;
  };

  const handleSelectToggle = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const activeSubs = subscriptions.filter(s => s.status === "active");
    if (selectedIds.length === activeSubs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(activeSubs.map(s => s.id));
    }
  };

  // Math totals for active subscriptions
  const activeSubs = subscriptions.filter(s => s.status === "active");
  const pausedSubs = subscriptions.filter(s => s.status === "paused");

  const monthlyEquivalent = (sub: Subscription) => {
    if (sub.frequency === "monthly") return sub.amount;
    if (sub.frequency === "quarterly") return sub.amount / 3;
    if (sub.frequency === "yearly") return sub.amount / 12;
    return 0;
  };

  const monthlyForecast = activeSubs.reduce((sum, s) => sum + monthlyEquivalent(s), 0);
  
  // Find next upcoming due subscription
  const nextDueSub = activeSubs.length > 0 
    ? [...activeSubs].sort((a, b) => new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime())[0]
    : null;

  return (
    <PageWrapper
      title="Subscriptions"
      reportHref="/reports/finance"
      sectionTabs={EXPENSE_TABS}
      activePath="/expenses/subscriptions"
      headerActions={
        <button 
          onClick={fetchData}
          className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-muted-foreground/60 hover:text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 md:w-[18px] md:h-[18px] ${isLoading ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <div className="flex items-center justify-center relative mb-6 w-full">
        <SubNav 
          items={["Active", "Paused", "Add Subscription"]}
          activeItem={activeTab}
          onChange={(val) => {
            if (val === "Add Subscription" && !editingSub) resetForm();
            setActiveTab(val as any);
          }}
          className="!mb-0 !mx-0"
        />
      </div>

      {/* Header Metrics */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 w-full">
        <div className="bg-card rounded-2xl p-3 md:p-5 shadow-sm border border-border/40 text-center overflow-hidden flex flex-col justify-center min-w-0">
          <div className="text-[9px] md:text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest mb-1.5 truncate">Monthly Forecast</div>
          <div className="text-xs sm:text-lg font-black text-primary truncate">
            <Currency value={monthlyForecast} />
          </div>
        </div>
        <div className="bg-card rounded-2xl p-3 md:p-5 shadow-sm border border-border/40 text-center overflow-hidden flex flex-col justify-center min-w-0">
          <div className="text-[9px] md:text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest mb-1.5 truncate">Active Subs</div>
          <div className="text-xs sm:text-lg font-black text-emerald-500 truncate">
            {activeSubs.length}
          </div>
        </div>
        <div className="bg-card rounded-2xl p-3 md:p-5 shadow-sm border border-border/40 text-center overflow-hidden flex flex-col justify-center min-w-0">
          <div className="text-[9px] md:text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest mb-1.5 truncate">Next Up</div>
          <div className="text-[10px] sm:text-xs font-black text-foreground truncate">
            {nextDueSub ? `${nextDueSub.name} (${format(new Date(nextDueSub.next_due_date), "MMM d")})` : "None"}
          </div>
        </div>
      </div>

      {/* Main Views */}
      <div className="w-full relative">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground font-black tracking-widest uppercase text-xs">Loading...</div>
        ) : activeTab === "Active" ? (
          <div>
            {activeSubs.length > 0 && (
              <div className="flex justify-between items-center mb-4 px-2">
                <button
                  onClick={handleSelectAll}
                  className="text-xs font-bold text-primary hover:text-accent flex items-center gap-1.5 cursor-pointer"
                >
                  {selectedIds.length === activeSubs.length ? (
                    <>
                      <CheckSquare className="w-4 h-4 text-primary shrink-0" /> Deselect All
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4 text-muted-foreground/40 shrink-0" /> Select All
                    </>
                  )}
                </button>
                <span className="text-xs text-muted-foreground/60">
                  {selectedIds.length} selected
                </span>
              </div>
            )}

            {activeSubs.length === 0 ? (
              <div className="bg-card border border-border/40 rounded-2xl p-12 text-center shadow-sm">
                <CreditCard className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-1">No Active Subscriptions</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-6">Create recurring subscriptions to keep track of your pre-committed billing and auto-log payments.</p>
                <button 
                  onClick={() => setActiveTab("Add Subscription")}
                  className="bg-primary text-primary-foreground text-xs font-black px-4 py-2 rounded-xl shadow-sm hover:bg-accent transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" /> Add Subscription
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-24">
                {activeSubs.map((sub) => {
                  const isSelected = selectedIds.includes(sub.id);
                  const isOverdue = new Date(sub.next_due_date).getTime() < new Date().setHours(0,0,0,0);
                  return (
                    <div 
                      key={sub.id} 
                      className={`bg-card border rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between ${
                        isSelected ? "border-primary ring-2 ring-primary/15" : "border-border/40"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={() => handleSelectToggle(sub.id)}
                              className="text-muted-foreground/40 hover:text-primary transition-colors cursor-pointer shrink-0"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-[18px] h-[18px] text-primary" />
                              ) : (
                                <Square className="w-[18px] h-[18px]" />
                              )}
                            </button>
                            <div>
                              <h3 className="font-black text-foreground text-base tracking-tight leading-tight">{sub.name}</h3>
                              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">{sub.category}</span>
                            </div>
                          </div>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 tracking-wider ${
                            isOverdue ? "bg-red-50 text-red-500 border border-red-100" : "bg-primary/10 text-primary"
                          }`}>
                            {sub.frequency}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-1.5 mb-4">
                          <span className="text-xl font-black text-foreground"><Currency value={sub.amount} /></span>
                          <span className="text-xs text-muted-foreground">via {sub.account}</span>
                        </div>

                        {sub.notes && (
                          <p className="text-xs text-muted-foreground/70 bg-muted/30 p-2 rounded-xl border border-border/20 mb-4 line-clamp-2">
                            {sub.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-border/20 pt-4 mt-auto">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-wider">Next Due</span>
                          <span className={`text-xs font-bold ${isOverdue ? "text-red-500" : "text-foreground"}`}>
                            {format(new Date(sub.next_due_date), "MMM d, yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(sub)}
                            className="text-xs font-bold text-muted-foreground hover:text-primary transition-all p-1.5 hover:bg-muted rounded-lg cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleStatus(sub)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-600 hover:text-amber-700 text-xs font-black px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Pause className="w-3.5 h-3.5" /> Pause
                          </button>
                          <button
                            onClick={() => logPayment(sub)}
                            className="bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary text-xs font-black px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                          >
                            Log Payment
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bulk Action Footer Bar */}
            {selectedIds.length > 0 && (
              <div className="fixed bottom-[80px] left-1/2 -translate-x-1/2 w-[90%] max-w-xl bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl p-4 shadow-xl z-50 flex items-center justify-between animate-in slide-in-from-bottom duration-300">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-foreground">
                    {selectedIds.length} Selected
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground/60">
                    Total: <Currency value={subscriptions.filter(s => selectedIds.includes(s.id)).reduce((sum, s) => sum + s.amount, 0)} />
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedIds([])}
                    className="text-xs font-bold text-muted-foreground/80 hover:text-foreground px-3 py-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={logMultiplePayments}
                    className="bg-primary text-primary-foreground text-xs font-black px-4 py-2.5 rounded-xl shadow-md hover:bg-accent transition-all cursor-pointer flex items-center gap-1.5"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Logging..."
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 shrink-0" /> Log Payments ({selectedIds.length})
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === "Paused" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pausedSubs.length === 0 ? (
              <div className="bg-card border border-border/40 rounded-2xl p-12 text-center shadow-sm w-full col-span-2">
                <Pause className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-1">No Paused Subscriptions</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">Subscriptions you pause temporarily will show up here, keeping your records intact for quick reactivation.</p>
              </div>
            ) : (
              pausedSubs.map((sub) => (
                <div key={sub.id} className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm flex flex-col justify-between opacity-80 hover:opacity-100 transition-all">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div>
                        <h3 className="font-black text-foreground text-base tracking-tight leading-tight">{sub.name}</h3>
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">{sub.category}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded-full shrink-0 tracking-wider">
                        {sub.frequency}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1.5 mb-4">
                      <span className="text-xl font-black text-muted-foreground"><Currency value={sub.amount} /></span>
                      <span className="text-xs text-muted-foreground/60">via {sub.account}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/20 pt-4 mt-auto">
                    <span className="text-xs text-muted-foreground/50 font-bold">Paused</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg cursor-pointer"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                      </button>
                      <button
                        onClick={() => toggleStatus(sub)}
                        className="bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary text-xs font-black px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5 fill-current shrink-0" /> Reactivate
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Add / Edit Subscription Form */
          <div className="bg-card border border-border/40 rounded-2xl p-5 md:p-6 shadow-sm w-full mt-6 relative z-35">
            <h2 className="text-base font-black text-foreground mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary shrink-0" />
              {editingSub ? `Edit: ${editingSub.name}` : "Add New Entry"}
            </h2>

            <form onSubmit={handleCreateOrUpdate} className="space-y-5">
              {/* Row 1: Entry Type & Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-50">
                <SearchableSelect 
                  label="Entry Type*"
                  headerIcon={<Tag size={16} />}
                  value={formData.type}
                  onChange={(val) => {
                    setFormData(prev => ({ ...prev, type: val as any }));
                    if (val && !entryTypes.includes(val)) {
                      setEntryTypes(prev => [...prev, val]);
                    }
                  }}
                  options={entryTypes}
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-wider">Name*</label>
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="e.g. Netflix, Home Loan, Insurance"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full h-11 bg-muted border-none rounded-md px-4 text-sm font-black focus:ring-2 focus:ring-accent/20 shadow-inner group-hover:bg-muted/80 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Amount & Billing Frequency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-40">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-wider">Amount*</label>
                  <div className="relative group">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      inputMode="decimal"
                      className="w-full h-11 bg-muted border-none rounded-md px-4 text-sm font-black focus:ring-2 focus:ring-accent/20 shadow-inner group-hover:bg-muted/80 transition-all"
                      required
                    />
                  </div>
                </div>

                <SearchableSelect 
                  label="Billing Frequency*"
                  headerIcon={<CalendarDays size={16} />}
                  value={
                    formData.frequency === "weekly" ? "Weekly" :
                    formData.frequency === "bi-weekly" ? "Bi-Weekly" :
                    formData.frequency === "monthly" ? "Monthly" :
                    formData.frequency === "bi-monthly" ? "Bi-Monthly" :
                    formData.frequency === "quarterly" ? "Quarterly" : "Yearly"
                  }
                  onChange={(val) => setFormData(prev => ({ ...prev, frequency: val.toLowerCase() as any }))}
                  options={["Weekly", "Bi-Weekly", "Monthly", "Bi-Monthly", "Quarterly", "Yearly"]}
                  disableCreate={true}
                />
              </div>

              {/* Row 3: Next Due Date & Source Account */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-30">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-wider">Next Due Date*</label>
                  <input
                    type="date"
                    value={formData.next_due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, next_due_date: e.target.value }))}
                    className="w-full h-11 bg-muted border-none rounded-md px-4 text-sm font-black focus:ring-2 focus:ring-accent/20 shadow-inner hover:bg-muted/80 transition-all"
                    required
                  />
                </div>

                <SearchableSelect 
                  label="Source Account*"
                  headerIcon={<CreditCard size={16} />}
                  value={formData.account}
                  onChange={(val) => setFormData(prev => ({ ...prev, account: val }))}
                  options={accounts}
                  disableCreate={true}
                />
              </div>

              {/* Row 4: Category & Sub-Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-20">
                <SearchableSelect 
                  label="Category"
                  headerIcon={<Tag size={16} />}
                  value={formData.category}
                  onChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                  options={categories}
                />
                <SearchableSelect 
                  label="Sub-Category"
                  headerIcon={<ListTodo size={16} />}
                  value={formData.subcategory}
                  onChange={(val) => setFormData(prev => ({ ...prev, subcategory: val }))}
                  options={subcategories}
                />
              </div>

              {/* Row 5: Vendor / Merchant */}
              <div className="flex flex-col gap-1.5 relative z-10">
                <SearchableSelect 
                  label="Vendor / Merchant"
                  headerIcon={<Store size={16} />}
                  value={formData.vendor}
                  onChange={(val) => setFormData(prev => ({ ...prev, vendor: val }))}
                  options={vendors}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-wider">Notes</label>
                <textarea
                  placeholder="Additional details..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full h-20 bg-muted border-none rounded-md p-4 text-sm font-black focus:ring-2 focus:ring-accent/20 shadow-inner hover:bg-muted/80 transition-all resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveTab("Active");
                  }}
                  className="w-full h-11 border border-border/60 text-muted-foreground text-xs font-black rounded-xl hover:bg-muted transition-all cursor-pointer flex items-center justify-center"
                >
                  Cancel
                </button>
                <SaveButton 
                  isSaving={isSubmitting} 
                  className="w-full h-11"
                  label={editingSub ? "Update Subscription" : "Create Subscription"}
                />
              </div>

            </form>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
