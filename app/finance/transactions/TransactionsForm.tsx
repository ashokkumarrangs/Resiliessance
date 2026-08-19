"use client";
import { format } from 'date-fns';

import { Banknote, CalendarDays, KeyIcon, Landmark, ListTodo, MapPin, NotebookPen, StickyNote, Store, Tag, Tags } from "lucide-react";
import { SaveButton } from "@/components/ui/SaveButton";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { PageWrapper } from "@/components/PageWrapper";
import { SubNav } from "@/components/SubNav";
import { EXPENSE_TABS } from "@/lib/navigation";
import { SearchableSelect } from "@/components/SearchableSelect";

const DEFAULT_OPTIONS = {
  accounts: [],
  categories: [],
  subcategories: [],
  particulars: [],
  vendors: [],
  places: [],
  tags: []
};

interface TransactionsFormProps {
  type: "Expense" | "Income" | "Transfer";
}

export default function TransactionsForm({ type }: TransactionsFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    amount: "",
    type: type,
    account: "",
    category: "",
    subcategory: "",
    particular: "",
    vendor: "",
    place: "",
    tags: "",
    notes: "",
    to_account: ""
  });

  // Options State
  const [options, setOptions] = useState({
    accounts: [] as string[],
    categories: [] as string[],
    subcategories: [] as string[],
    particulars: [] as string[],
    vendors: [] as string[],
    places: [] as string[],
    tags: [] as string[]
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [history, setHistory] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [hierarchy, setHierarchy] = useState<any>({});

  useEffect(() => {
    fetchOptions().then((tree) => fetchLastEntry(tree));
  }, [type]);

  const fetchOptions = async () => {
    setOptions(prev => ({ ...prev, ...DEFAULT_OPTIONS }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tree: any = {};

    try {
      const [
        { data: accs },
        { data: hist }
      ] = await Promise.all([
        supabase.from('liquidity').select('account_name'),
        supabase.from('history_expenses').select('type, category, subcategory, particular, vendor, place, tags').order('id', { ascending: false }).limit(2000)
      ]);

      if (accs) setOptions(prev => ({ ...prev, accounts: accs.map(a => a.account_name) }));
      
      if (hist && hist.length > 0) {
        setHistory(hist);
        
        // Build Hierarchy: Type -> Category -> Sub -> Particular -> [Vendors]
        hist.forEach((row) => {
          const { type: rType, category, subcategory, particular, vendor } = row;
          if (!rType || !category) return;
          
          if (!tree[rType]) tree[rType] = {};
          if (!tree[rType][category]) tree[rType][category] = {};
          if (!tree[rType][category][subcategory]) tree[rType][category][subcategory] = {};
          if (!tree[rType][category][subcategory][particular]) tree[rType][category][subcategory][particular] = new Set();
          
          if (vendor) tree[rType][category][subcategory][particular].add(vendor);
        });
        setHierarchy(tree);

        // Initial unique lists for when nothing is selected
        const unique = (key: string) => Array.from(new Set(hist.map((h: any) => h[key]).filter(Boolean)));
        setOptions(prev => ({
          ...prev,
          categories: unique('category'),
          subcategories: unique('subcategory'),
          particulars: unique('particular'),
          vendors: unique('vendor'),
          places: unique('place'),
          tags: unique('tags')
        }));
      }
    } catch (error: any) {
      console.error("Error loading expense options:", error);
      toast.error("Failed to load options");
    }
    return tree;
  };

  const fetchLastEntry = async (currentHierarchy: any) => {
    // Query the last entry matching the active type to ensure consistent categories
    const { data } = await supabase
      .from('history_expenses')
      .select('type, account, category, subcategory, particular, vendor, place, tags')
      .eq('type', type)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setFormData(prev => ({
        ...prev,
        type: type,
        account: data.account || "",
        category: data.category || "",
        subcategory: data.subcategory || "",
        particular: data.particular || "",
        vendor: data.vendor || "",
        place: data.place || "",
        tags: data.tags || ""
      }));
    } else {
      // Fallback: Default fields using hierarchy for the target type
      setFormData(prev => {
        const updated = { ...prev, type: type };
        const activeTree = currentHierarchy || hierarchy;
        if (activeTree[type]) {
          const cats = Object.keys(activeTree[type]);
          if (cats.length > 0) {
            updated.category = cats[0];
            const subNode = activeTree[type][cats[0]];
            if (subNode) {
              const subs = Object.keys(subNode);
              if (subs.length > 0) {
                updated.subcategory = subs[0];
                const partNode = subNode[subs[0]];
                if (partNode) {
                  const parts = Object.keys(partNode);
                  if (parts.length > 0) {
                    updated.particular = parts[0];
                  }
                }
              }
            }
          }
        }
        return updated;
      });
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Cascading Prediction Logic: ONLY predict downstream when a parent changes
      if (name === 'category' || name === 'subcategory' || name === 'particular') {
        if (hierarchy[type]) {
          // If CATEGORY changed -> Predict Sub-Category
          if (name === 'category') {
            updated.subcategory = ""; updated.particular = ""; updated.vendor = "";
            const catNode = hierarchy[type][updated.category];
            if (catNode) {
              const subs = Object.keys(catNode);
              if (subs.length > 0) updated.subcategory = subs[0];
            }
          }

          // If CATEGORY or SUB-CATEGORY changed -> Predict Particular
          if (name === 'category' || name === 'subcategory') {
            if (name === 'subcategory') {
              updated.particular = ""; updated.vendor = "";
            }
            const catNode = hierarchy[type][updated.category];
            const subNode = catNode ? catNode[updated.subcategory] : null;
            if (subNode) {
              const parts = Object.keys(subNode);
              if (parts.length > 0) updated.particular = parts[0];
            }
          }

          // If CATEGORY, SUB-CATEGORY, or PARTICULAR changed -> Predict Vendor
          if (name === 'category' || name === 'subcategory' || name === 'particular') {
            if (name === 'particular') {
              updated.vendor = "";
            }
            const catNode = hierarchy[type][updated.category];
            const subNode = catNode ? catNode[updated.subcategory] : null;
            const partNode = subNode ? subNode[updated.particular] : null;
            if (partNode) {
              const vendors = Array.from(partNode as Set<string>);
              if (vendors.length > 0) updated.vendor = vendors[0];
            }
          }
        }
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isTransfer = type === 'Transfer';
    if (!formData.account || !formData.amount || (!isTransfer && !formData.category)) {
      toast.error("Required fields missing");
      return;
    }
    if (isTransfer) {
      if (!formData.to_account) {
        toast.error("Please select a destination account for the transfer");
        return;
      }
      if (formData.account === formData.to_account) {
        toast.error("Source and destination accounts must be different");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Invalid amount");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        date: formData.date,
        time: formData.time,
        amount: amount,
        type: type,
        account: formData.account,
        category: isTransfer ? "Transfer" : formData.category,
        subcategory: isTransfer ? (formData.to_account ? `To: ${formData.to_account}` : "") : formData.subcategory,
        particular: isTransfer ? `Transfer to ${formData.to_account}` : formData.particular,
        vendor: isTransfer ? "" : formData.vendor,
        place: isTransfer ? "" : formData.place,
        tags: isTransfer 
          ? ["transfer"] 
          : formData.tags 
            ? formData.tags.split(",").map(t => t.trim()).filter(Boolean) 
            : [],
        notes: isTransfer ? `${formData.notes ? formData.notes + ' | ' : ''}Transferred to ${formData.to_account}` : formData.notes
      };

      // 1. Insert into history
      const { data: insertedHist, error: histErr } = await supabase
        .from('history_expenses')
        .insert(payload)
        .select('id')
        .single();
      if (histErr) throw histErr;

      try {
        // 2. Update balance for source account
        const { data: acc, error: accErr } = await supabase
          .from('liquidity')
          .select('balance')
          .eq('account_name', formData.account)
          .single();
        if (accErr) throw accErr;
        if (!acc) throw new Error("Account not found");

        let newBal = parseFloat(acc.balance) || 0;
        if (type === 'Expense' || type === 'Transfer') newBal -= amount;
        else if (type === 'Income') newBal += amount;

        const { error: updErr } = await supabase
          .from('liquidity')
          .update({ balance: newBal })
          .eq('account_name', formData.account);
        if (updErr) throw updErr;

        // 3. If Transfer, update balance for destination account
        if (isTransfer && formData.to_account) {
          const { data: toAcc, error: toAccErr } = await supabase
            .from('liquidity')
            .select('balance')
            .eq('account_name', formData.to_account)
            .single();
          if (toAccErr) throw toAccErr;
          if (!toAcc) throw new Error("Destination account not found");

          let toBal = parseFloat(toAcc.balance) || 0;
          toBal += amount;
          const { error: toUpdErr } = await supabase
            .from('liquidity')
            .update({ balance: toBal })
            .eq('account_name', formData.to_account);
          if (toUpdErr) throw toUpdErr;
        }
      } catch (err) {
        // ROLLBACK: Delete the inserted transaction log since the account balance update failed!
        if (insertedHist?.id) {
          await supabase.from('history_expenses').delete().eq('id', insertedHist.id);
        }
        throw err;
      }

      toast.success("Entry saved successfully");
      router.push("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to save entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic Filtering Logic (Strict Cascading)
  const getFilteredOptions = () => {
    const { category, subcategory, particular } = formData;
    const typeHistory = history.filter(h => h.type === type);

    const out = {
      categories: Array.from(new Set(typeHistory.map(h => h.category).filter(Boolean))),
      subcategories: [] as string[],
      particulars: [] as string[],
      vendors: [] as string[]
    };

    if (category) {
      const catMatches = typeHistory.filter(h => h.category === category);
      out.subcategories = Array.from(new Set(catMatches.map(h => h.subcategory).filter(Boolean)));
      
      if (subcategory) {
        const subMatches = catMatches.filter(h => h.subcategory === subcategory);
        out.particulars = Array.from(new Set(subMatches.map(h => h.particular).filter(Boolean)));
        
        if (particular) {
          const partMatches = subMatches.filter(h => h.particular === particular);
          out.vendors = Array.from(new Set(partMatches.map(h => h.vendor).filter(Boolean)));
        } else {
          out.vendors = Array.from(new Set(subMatches.map(h => h.vendor).filter(Boolean)));
        }
      } else {
        out.particulars = Array.from(new Set(catMatches.map(h => h.particular).filter(Boolean)));
        out.vendors = Array.from(new Set(catMatches.map(h => h.vendor).filter(Boolean)));
      }
    } else {
      out.subcategories = Array.from(new Set(typeHistory.map(h => h.subcategory).filter(Boolean)));
      out.particulars = Array.from(new Set(typeHistory.map(h => h.particular).filter(Boolean)));
      out.vendors = Array.from(new Set(typeHistory.map(h => h.vendor).filter(Boolean)));
    }

    return out;
  };

  const filtered = getFilteredOptions();

  const handleSubNavChange = (val: string) => {
    if (val === 'Capital') {
      router.push("/finance/capital/liabilities");
    } else {
      router.push(`/finance/transactions/${val.toLowerCase()}`);
    }
  };

  return (
    <PageWrapper
      title="Transactions"
      reportHref="/reports/finance"
      sectionTabs={EXPENSE_TABS}
    >
      <div className="flex justify-center w-full">
        <SubNav
          items={["Expense", "Income", "Transfer", "Capital"]}
          activeItem={type}
          onChange={handleSubNavChange}
          className="!mb-0"
        />
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full mt-6">
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/40 space-y-5">
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4 relative z-50">
            <div className="space-y-2">
              <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                <CalendarDays size={16} className="shrink-0" />
                Date
              </label>
              <input
                type="date"
                max={new Date().toLocaleDateString('en-CA')}
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                Time
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none"
                required
              />
            </div>
          </div>

          {type === 'Transfer' ? (
            <>
              {/* Transfer: From -> To */}
              <div className="grid grid-cols-2 gap-4 relative z-20">
                <SearchableSelect 
                  label="From Account"
                  headerIcon={<Landmark size={16} className="shrink-0" />}
                  icon={<KeyIcon size={16} />}
                  value={formData.account}
                  onChange={(val) => setFormData(prev => ({ ...prev, account: val }))}
                  options={options.accounts}
                />
                <SearchableSelect 
                  label="To Account"
                  headerIcon={<Landmark size={16} className="shrink-0" />}
                  icon={<KeyIcon size={16} />}
                  value={formData.to_account}
                  onChange={(val) => setFormData(prev => ({ ...prev, to_account: val }))}
                  options={options.accounts.filter(a => a !== formData.account)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 relative z-40">
                <div className="space-y-2">
                  <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                    <Banknote size={16} className="shrink-0" />
                    Amount
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      inputMode="decimal"
                      className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-black text-primary focus:ring-2 focus:ring-accent/20 shadow-inner group-hover:bg-muted/80 transition-all appearance-none"
                      required
                    />
                    <Banknote size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none group-hover:text-accent transition-colors" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                    <StickyNote size={16} className="shrink-0" />
                    Notes
                  </label>
                  <input 
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full h-11 bg-muted border-none rounded-md px-4 text-sm font-semibold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner outline-none" 
                    placeholder="Record details of this transfer..."
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Expense / Income */}
              <div className="grid grid-cols-2 gap-4 relative z-30">
                <SearchableSelect 
                  label="Account"
                  headerIcon={<Landmark size={16} className="shrink-0" />}
                  icon={<KeyIcon size={16} />}
                  value={formData.account}
                  onChange={(val) => setFormData(prev => ({ ...prev, account: val }))}
                  options={options.accounts}
                />
                <div className="space-y-2">
                  <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                    <Banknote size={16} className="shrink-0" />
                    Amount
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      inputMode="decimal"
                      className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-black text-primary focus:ring-2 focus:ring-accent/20 shadow-inner group-hover:bg-muted/80 transition-all appearance-none"
                      required
                    />
                    <Banknote size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none group-hover:text-accent transition-colors" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-20">
                <SearchableSelect 
                  label="Category"
                  headerIcon={<Tag size={16} className="shrink-0" />}
                  value={formData.category}
                  onChange={(val) => handleChange('category', val)}
                  options={filtered.categories}
                />
                <SearchableSelect 
                  label="Sub-Category"
                  headerIcon={<ListTodo size={16} className="shrink-0" />}
                  value={formData.subcategory}
                  onChange={(val) => handleChange('subcategory', val)}
                  options={filtered.subcategories}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10">
                <SearchableSelect 
                  label="Particular"
                  headerIcon={<NotebookPen size={16} className="shrink-0" />}
                  value={formData.particular}
                  onChange={(val) => handleChange('particular', val)}
                  options={filtered.particulars}
                />
                <SearchableSelect 
                  label="Vendor"
                  headerIcon={<Store size={16} className="shrink-0" />}
                  value={formData.vendor}
                  onChange={(val) => handleChange('vendor', val)}
                  options={filtered.vendors}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 relative">
                <SearchableSelect 
                  label="Place"
                  headerIcon={<MapPin size={16} className="shrink-0" />}
                  value={formData.place}
                  onChange={(val) => setFormData(prev => ({ ...prev, place: val }))}
                  options={options.places}
                />
                <SearchableSelect 
                  label="Tags"
                  headerIcon={<Tags size={16} className="shrink-0" />}
                  value={formData.tags}
                  onChange={(val) => setFormData(prev => ({ ...prev, tags: val }))}
                  options={options.tags}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                  <StickyNote size={16} className="shrink-0" />
                  Notes
                </label>
                <input 
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full h-11 bg-muted border-none rounded-md px-4 text-sm font-semibold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner outline-none" 
                  placeholder="Record any specific details..."
                />
              </div>
            </>
          )}

          <div className="flex justify-center pt-8">
            <SaveButton 
              type="submit" 
              isSaving={isSubmitting} 
              disabled={isSubmitting} 
              label={type === 'Transfer' ? "Save Transfer" : type === 'Income' ? "Save Income" : "Save Expense"} 
              className="w-full max-w-xs h-12 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-muted" 
            />
          </div>
        </div>
      </form>
    </PageWrapper>
  );
}
