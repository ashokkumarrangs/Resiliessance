"use client";
import { format } from 'date-fns';
import { Select } from "@/components/Select";
import Link from "next/link";

import { Banknote, CalendarDays, CheckCircle2, ChevronDown, KeyIcon, Landmark, ListTodo, MapPin, NotebookPen, StickyNote, Store, Tag, Tags , BarChart2 } from "lucide-react";
import { SaveButton } from "@/components/ui/SaveButton";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { SectionNav } from "@/components/SectionNav";
import { SubNav } from "@/components/SubNav";
import { EXPENSE_TABS } from "@/lib/navigation";
import { SearchableSelect } from "@/components/SearchableSelect";

// No persistent hardcoded values to ensure a fully dynamic system.
const DEFAULT_OPTIONS = {
  accounts: [],
  categories: [],
  subcategories: [],
  particulars: [],
  vendors: [],
  places: [],
  tags: []
};

export default function DailyEntryPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: "",
    type: "Expense",
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

  const [history, setHistory] = useState<any[]>([]);
  const [hierarchy, setHierarchy] = useState<any>({});
  const [lastEntry, setLastEntry] = useState<any>(null);

  useEffect(() => {
    fetchOptions().then((tree) => fetchLastEntry(tree));
  }, []);

  const fetchOptions = async () => {
    setOptions(prev => ({ ...prev, ...DEFAULT_OPTIONS }));
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
        hist.forEach((row: any) => {
          const { type, category, subcategory, particular, vendor } = row;
          if (!type || !category) return;
          
          if (!tree[type]) tree[type] = {};
          if (!tree[type][category]) tree[type][category] = {};
          if (!tree[type][category][subcategory]) tree[type][category][subcategory] = {};
          if (!tree[type][category][subcategory][particular]) tree[type][category][subcategory][particular] = new Set();
          
          if (vendor) tree[type][category][subcategory][particular].add(vendor);
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
    } catch (error) {
      // Error handled via silent failure or future toast
    }
    return tree;
  };

  const fetchLastEntry = async (currentHierarchy: any) => {
    // Check if type is explicitly requested in the query parameters
    let finalType = "Expense";
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlType = params.get('type');
      if (urlType === 'Expense' || urlType === 'Income' || urlType === 'Transfer') {
        finalType = urlType;
      }
    }

    // Query the last entry matching the active type to ensure consistent categories
    const { data } = await supabase
      .from('history_expenses')
      .select('type, account, category, subcategory, particular, vendor, place, tags')
      .eq('type', finalType)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setLastEntry(data);
      // Automatic Pre-load on page load
      setFormData(prev => ({
        ...prev,
        type: finalType,
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
        const updated = { ...prev, type: finalType };
        const activeTree = currentHierarchy || hierarchy;
        if (activeTree[finalType]) {
          const cats = Object.keys(activeTree[finalType]);
          if (cats.length > 0) {
            updated.category = cats[0];
            const subNode = activeTree[finalType][cats[0]];
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
      if (name === 'type' || name === 'category' || name === 'subcategory' || name === 'particular') {
        const type = name === 'type' ? value : updated.type;
        
        if (hierarchy[type]) {
          // 1. If TYPE changed -> Reset and Predict Category
          if (name === 'type') {
            updated.category = ""; 
            updated.subcategory = ""; updated.particular = ""; updated.vendor = ""; 
            const cats = Object.keys(hierarchy[type]);
            if (cats.length > 0) updated.category = cats[0];
          }

          // 2. If TYPE or CATEGORY changed -> Predict Sub-Category
          if (name === 'type' || name === 'category') {
            if (name === 'category') {
              updated.subcategory = ""; updated.particular = ""; updated.vendor = "";
            }
            const catNode = hierarchy[type][updated.category];
            if (catNode) {
              const subs = Object.keys(catNode);
              if (subs.length > 0) updated.subcategory = subs[0];
            }
          }

          // 3. If TYPE, CATEGORY, or SUB-CATEGORY changed -> Predict Particular
          if (name === 'type' || name === 'category' || name === 'subcategory') {
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

          // 4. If TYPE, CATEGORY, SUB-CATEGORY, or PARTICULAR changed -> Predict Vendor
          if (name === 'type' || name === 'category' || name === 'subcategory' || name === 'particular') {
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
    const isTransfer = formData.type === 'Transfer';
    if (!formData.account || !formData.amount || (!isTransfer && !formData.category)) {
      toast.error("Required fields missing");
      return;
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
        amount: amount,
        type: formData.type,
        account: formData.account,
        category: isTransfer ? "Transfer" : formData.category,
        subcategory: isTransfer ? "" : formData.subcategory,
        particular: isTransfer ? "" : formData.particular,
        vendor: isTransfer ? "" : formData.vendor,
        place: isTransfer ? "" : formData.place,
        tags: isTransfer ? "" : formData.tags,
        notes: formData.notes
      };

      // 1. Insert into history
      const { error: histErr } = await supabase.from('history_expenses').insert(payload);
      if (histErr) throw histErr;

      // 2. Update balance for source account
      const { data: acc } = await supabase.from('liquidity').select('balance').eq('account_name', formData.account).single();
      if (acc) {
        let newBal = parseFloat(acc.balance) || 0;
        if (formData.type === 'Expense' || formData.type === 'Transfer') newBal -= amount;
        else if (formData.type === 'Income') newBal += amount;

        await supabase.from('liquidity').update({ balance: newBal }).eq('account_name', formData.account);
      }

      // 3. If Transfer, update balance for destination account
      if (formData.type === 'Transfer' && formData.to_account) {
        const { data: toAcc } = await supabase.from('liquidity').select('balance').eq('account_name', formData.to_account).single();
        if (toAcc) {
          let toBal = parseFloat(toAcc.balance) || 0;
          toBal += amount;
          await supabase.from('liquidity').update({ balance: toBal }).eq('account_name', formData.to_account);
        }
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
    const { type, category, subcategory, particular } = formData;
    
    // Always filter the base history by the current type first
    const typeHistory = history.filter(h => h.type === type);

    const out = {
      categories: Array.from(new Set(typeHistory.map(h => h.category).filter(Boolean))),
      subcategories: [] as string[],
      particulars: [] as string[],
      vendors: [] as string[]
    };

    // Smart Cascading logic
    if (category) {
      // If category is picked, filter subcategories strictly
      const catMatches = typeHistory.filter(h => h.category === category);
      out.subcategories = Array.from(new Set(catMatches.map(h => h.subcategory).filter(Boolean)));
      
      if (subcategory) {
        // If subcategory is picked, filter particulars strictly
        const subMatches = catMatches.filter(h => h.subcategory === subcategory);
        out.particulars = Array.from(new Set(subMatches.map(h => h.particular).filter(Boolean)));
        
        if (particular) {
          // If particular is picked, filter vendors strictly
          const partMatches = subMatches.filter(h => h.particular === particular);
          out.vendors = Array.from(new Set(partMatches.map(h => h.vendor).filter(Boolean)));
        } else {
          // No particular picked: show all vendors for this subcategory
          out.vendors = Array.from(new Set(subMatches.map(h => h.vendor).filter(Boolean)));
        }
      } else {
        // No subcomponent picked: show all particulars and vendors for this whole category
        out.particulars = Array.from(new Set(catMatches.map(h => h.particular).filter(Boolean)));
        out.vendors = Array.from(new Set(catMatches.map(h => h.vendor).filter(Boolean)));
      }
    } else {
      // Ultimate Fallbacks (Type-Only): If nothing except Type is selected, show every unique item for that Type
      out.subcategories = Array.from(new Set(typeHistory.map(h => h.subcategory).filter(Boolean)));
      out.particulars = Array.from(new Set(typeHistory.map(h => h.particular).filter(Boolean)));
      out.vendors = Array.from(new Set(typeHistory.map(h => h.vendor).filter(Boolean)));
    }

    return out;
  };

  const filtered = getFilteredOptions();

  return (
    <div className="flex flex-col min-h-screen bg-background pb-32 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6 pt-6 md:pt-6">
        <PageHeader title="Daily Entry" >
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
          <SectionNav tabs={EXPENSE_TABS} />
        </div>

        <div className="flex justify-center w-full">
          <SubNav
            items={["Expense", "Income", "Transfer"]}
            activeItem={formData.type}
            onChange={(val) => handleChange('type', val)}
            className="!mb-0"
          />
        </div>
        
        {/* Autofill Notification */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full mt-6">
        
        <div className="bg-card rounded-2xl p-8 shadow-sm border border-border/40 space-y-7">
          {/* Row 1: Date | Amount */}
          <div className="grid grid-cols-2 gap-7">
            <div className="space-y-2">
      <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                <CalendarDays size={16} className="shrink-0" />
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none"
                required
              />
            </div>
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
                  onChange={(e) => handleChange('amount', e.target.value)}
                  className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-black text-primary focus:ring-2 focus:ring-accent/20 shadow-inner group-hover:bg-muted/80 transition-all appearance-none"
                  required
                />
                <Banknote size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none group-hover:text-accent transition-colors" />
              </div>
            </div>
          </div>

          {/* Conditional Layouts based on SubNav state */}
          {formData.type === 'Transfer' ? (
            <>
              {/* Transfer Layout */}
              <div className="grid grid-cols-2 gap-7 relative z-20">
                <div className="space-y-2">
                  <SearchableSelect 
                    label="From Account"
                    headerIcon={<Landmark size={16} className="shrink-0" />}
                    icon={<KeyIcon size={16} />}
                    value={formData.account}
                    onChange={(val) => handleChange('account', val)}
                    options={options.accounts}
                  />
                </div>
                <div className="space-y-2">
                  <SearchableSelect 
                    label="To Account"
                    headerIcon={<Landmark size={16} className="shrink-0" />}
                    icon={<KeyIcon size={16} />}
                    value={formData.to_account}
                    onChange={(val) => handleChange('to_account', val)}
                    options={options.accounts.filter(a => a !== formData.account)}
                  />
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
                  onChange={(e) => handleChange('notes', e.target.value)}
                  className="w-full h-11 bg-muted border-none rounded-md px-4 text-sm font-semibold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner outline-none" 
                  placeholder="Record details of this transfer..."
                />
              </div>
            </>
          ) : (
            <>
              {/* Expense/Income Layout */}
              {/* Row 2: Account | Tags */}
              <div className="grid grid-cols-2 gap-7 relative z-30">
                <div className="space-y-2">
                  <SearchableSelect 
                    label="Account"
                    headerIcon={<Landmark size={16} className="shrink-0" />}
                    icon={<KeyIcon size={16} />}
                    value={formData.account}
                    onChange={(val) => handleChange('account', val)}
                    options={options.accounts}
                  />
                </div>
                <div className="space-y-2">
                  <SearchableSelect 
                    label="Tags"
                    headerIcon={<Tags size={16} className="shrink-0" />}
                    value={formData.tags}
                    onChange={(val) => handleChange('tags', val)}
                    options={options.tags}
                  />
                </div>
              </div>

              {/* Row 3: Category | Sub-Category */}
              <div className="grid grid-cols-2 gap-7 relative z-20">
                <div className="space-y-2">
                  <SearchableSelect 
                    label="Category"
                    headerIcon={<Tag size={16} className="shrink-0" />}
                    value={formData.category}
                    onChange={(val) => handleChange('category', val)}
                    options={filtered.categories}
                  />
                </div>
                <div className="space-y-2">
                  <SearchableSelect 
                    label="Sub-Category"
                    headerIcon={<ListTodo size={16} className="shrink-0" />}
                    value={formData.subcategory}
                    onChange={(val) => handleChange('subcategory', val)}
                    options={filtered.subcategories}
                  />
                </div>
              </div>

              {/* Row 4: Particular | Vendor */}
              <div className="grid grid-cols-2 gap-7 relative z-10">
                <div className="space-y-2">
                  <SearchableSelect 
                    label="Particular"
                    headerIcon={<NotebookPen size={16} className="shrink-0" />}
                    value={formData.particular}
                    onChange={(val) => handleChange('particular', val)}
                    options={filtered.particulars}
                  />
                </div>
                <div className="space-y-2">
                  <SearchableSelect 
                    label="Vendor"
                    headerIcon={<Store size={16} className="shrink-0" />}
                    value={formData.vendor}
                    onChange={(val) => handleChange('vendor', val)}
                    options={filtered.vendors}
                  />
                </div>
              </div>

              {/* Row 5: Place | Notes */}
              <div className="grid grid-cols-2 gap-7 relative">
                <div className="space-y-2">
                  <SearchableSelect 
                    label="Place"
                    headerIcon={<MapPin size={16} className="shrink-0" />}
                    value={formData.place}
                    onChange={(val) => handleChange('place', val)}
                    options={options.places}
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
                    onChange={(e) => handleChange('notes', e.target.value)}
                    className="w-full h-11 bg-muted border-none rounded-md px-4 text-sm font-semibold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner outline-none" 
                    placeholder="Record any specific details..."
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex justify-center pt-8">
            <SaveButton type="submit" isSaving={isSubmitting} disabled={isSubmitting} label={formData.type === 'Transfer' ? "Save Transfer" : formData.type === 'Income' ? "Save Income" : "Save Expense"} className="w-full max-w-xs h-12 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-muted" />
          </div>
        </div>
      </form>
      </div>
    </div>
  );
}
