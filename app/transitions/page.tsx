"use client";
import { Select } from "@/components/Select";
import Link from "next/link";

import { Banknote, CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, KeyIcon, Landmark, ListTodo, MapPin, NotebookPen, PlusCircle, StickyNote, Store, Tag, Tags, X , BarChart2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";

const DEFAULT_OPTIONS = {
  accounts: [],
  categories: [],
  subcategories: [],
  particulars: [],
  vendors: [],
  places: [],
  tags: []
};

// Top 20 transition combinations
const INITIAL_TRANSITIONS = [
  { name: "Fade", class: "animate-in fade-in duration-500" },
  { name: "Slide Up", class: "animate-in fade-in slide-in-from-bottom-4 duration-500" },
  { name: "Slide Down", class: "animate-in fade-in slide-in-from-top-4 duration-500" },
  { name: "Slide Left", class: "animate-in fade-in slide-in-from-left-4 duration-500" },
  { name: "Slide Right", class: "animate-in fade-in slide-in-from-right-4 duration-500" },
  { name: "Zoom In", class: "animate-in fade-in zoom-in-95 duration-500" },
  { name: "Zoom Out", class: "animate-in fade-in zoom-out-105 duration-500" },
  { name: "Zoom Deep", class: "animate-in fade-in zoom-in-75 duration-700 ease-out" },
  { name: "Spin Right", class: "animate-in fade-in spin-in-12 duration-500" },
  { name: "Spin Left", class: "animate-in fade-in spin-in-[-12] duration-500" },
  { name: "Deep Slide Up", class: "animate-in fade-in slide-in-from-bottom-12 duration-700 ease-out" },
  { name: "Deep Slide Dn", class: "animate-in fade-in slide-in-from-top-12 duration-700 ease-out" },
  { name: "Extreme Zoom", class: "animate-in fade-in zoom-in-50 duration-700 ease-out" },
  { name: "Pop In", class: "animate-in fade-in zoom-in-110 duration-300 ease-in" },
  { name: "Slide Far Left", class: "animate-in fade-in slide-in-from-left-8 duration-700 ease-out" },
  { name: "Slide Far Right", class: "animate-in fade-in slide-in-from-right-8 duration-700 ease-out" },
  { name: "Zoom + Slide Up", class: "animate-in fade-in zoom-in-90 slide-in-from-bottom-4 duration-500" },
  { name: "Zoom + Slide Dn", class: "animate-in fade-in zoom-in-90 slide-in-from-top-4 duration-500" },
  { name: "Spin + Slide Lft", class: "animate-in fade-in spin-in-3 slide-in-from-left-4 duration-500" },
  { name: "Spin + Slide Rgt", class: "animate-in fade-in spin-in-[-3] slide-in-from-right-4 duration-500" }
];

export default function TransitionPlaygroundPage() {
  const router = useRouter();
  const [transitionsList, setTransitionsList] = useState(INITIAL_TRANSITIONS);
  const [activeTransition, setActiveTransition] = useState(INITIAL_TRANSITIONS[1]); // Default to Slide Up
  const [activePage, setActivePage] = useState<"A" | "B">("A"); // Toggle between Page A and Page B

  const handleDelete = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = transitionsList.filter(t => t.name !== name);
    setTransitionsList(updated);
    if (activeTransition.name === name && updated.length > 0) {
      setActiveTransition(updated[0]);
    }
  };

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
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
    fetchOptions().then(() => fetchLastEntry());
  }, []);

  const fetchOptions = async () => {
    setOptions(prev => ({ ...prev, ...DEFAULT_OPTIONS }));

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
        
        const tree: any = {};
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
    }
  };

  const fetchLastEntry = async () => {
    const { data } = await supabase.from('history_expenses').select('type, account, category, subcategory, particular, vendor, place, tags').order('id', { ascending: false }).limit(1).single();
    if (data) {
      setLastEntry(data);
      setFormData(prev => ({
        ...prev,
        type: data.type || "Expense",
        account: data.account || "",
        category: data.category || "",
        subcategory: data.subcategory || "",
        particular: data.particular || "",
        vendor: data.vendor || "",
        place: data.place || "",
        tags: data.tags || ""
      }));
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      if (name === 'type' || name === 'category' || name === 'subcategory' || name === 'particular') {
        const type = name === 'type' ? value : updated.type;
        
        if (hierarchy[type]) {
          if (name === 'type') {
            updated.category = ""; 
            updated.subcategory = ""; updated.particular = ""; updated.vendor = ""; 
            const cats = Object.keys(hierarchy[type]);
            if (cats.length > 0) updated.category = cats[0];
          }

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
    if (!formData.account || !formData.amount || !formData.category) {
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
        category: formData.category,
        subcategory: formData.subcategory,
        particular: formData.particular,
        vendor: formData.vendor,
        place: formData.place,
        tags: formData.tags,
        notes: formData.notes
      };

      const { error: histErr } = await supabase.from('history_expenses').insert(payload);
      if (histErr) throw histErr;

      const { data: acc } = await supabase.from('liquidity').select('balance').eq('account_name', formData.account).single();
      if (acc) {
        let newBal = parseFloat(acc.balance) || 0;
        if (formData.type === 'Expense' || formData.type === 'Transfer') newBal -= amount;
        else if (formData.type === 'Income') newBal += amount;

        await supabase.from('liquidity').update({ balance: newBal }).eq('account_name', formData.account);
      }

      if (formData.type === 'Transfer' && formData.to_account) {
        const { data: toAcc } = await supabase.from('liquidity').select('balance').eq('account_name', formData.to_account).single();
        if (toAcc) {
          let toBal = parseFloat(toAcc.balance) || 0;
          toBal += amount;
          await supabase.from('liquidity').update({ balance: toBal }).eq('account_name', formData.to_account);
        }
      }

      toast.success("Entry saved successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to save entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFilteredOptions = () => {
    const { type, category, subcategory, particular } = formData;
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

  return (
    <div className="flex flex-col min-h-screen bg-background pb-32 font-dm-sans">
      
      {/* Interactive Sub Nav for Transitions (Playground feature) */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/40 mb-4 pb-2 shadow-sm pt-4">
        <div className="max-w-lg mx-auto w-full px-4 pt-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest hidden sm:inline-block">Transition Playground</span>
            <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest sm:hidden">UI/UX Playground</span>
            
            <div className="flex items-center gap-1.5">
              <button 
                type="button"
                onClick={() => setActivePage(prev => prev === "A" ? "B" : "A")}
                className="p-1 bg-muted/60 hover:bg-muted text-foreground rounded-md transition-colors active:scale-95"
                title="Switch Mock Page"
              >
                <ChevronLeft size={16} />
              </button>
              
              <span className="bg-accent/10 text-accent px-2 py-0.5 rounded-full text-[10px] font-black truncate max-w-[120px] text-center">
                Page {activePage}
              </span>
              
              <button 
                type="button"
                onClick={() => setActivePage(prev => prev === "A" ? "B" : "A")}
                className="p-1 bg-muted/60 hover:bg-muted text-foreground rounded-md transition-colors active:scale-95"
                title="Switch Mock Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          
          <div className="flex overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory hide-scrollbar gap-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {transitionsList.map((transition) => (
              <div key={transition.name} className="relative group snap-start shrink-0">
                <button
                  onClick={() => setActiveTransition(transition)}
                  className={`pl-4 pr-7 py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all border
                    ${activeTransition.name === transition.name 
                      ? "bg-foreground text-background border-foreground shadow-md scale-105" 
                      : "bg-card text-muted-foreground border-border/40 hover:bg-muted hover:text-foreground"
                    }`}
                >
                  {transition.name}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDelete(transition.name, e)}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity
                    ${activeTransition.name === transition.name ? "text-background hover:bg-background/20" : "text-muted-foreground hover:bg-accent/10"}`}
                  title="Delete Transition"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}} />

      {/* Main Content Area - wrapped with the active transition key and class */}
      <div key={activePage + activeTransition.name} className={`max-w-lg mx-auto w-full p-4 md:p-6 ${activeTransition.class}`}>
        
        {activePage === "A" ? (
          <>
            <PageHeader title="Transition Playground"  >
        <div className="flex items-center gap-2">

          <Link 
            href="/reports" 
            className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-muted-foreground/60 hover:text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
            title="View Reports"
          >
            <BarChart2 className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Link>
        </div>
      </PageHeader>
            <div className="-mt-2 mb-6">
              <div className="h-10 bg-muted/40 rounded-xl border border-border/25 flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Navigation Area Placeholder
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
            <div className="bg-card rounded-md p-7 shadow-zenith border border-white/20 space-y-7">
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

              <div className="grid grid-cols-2 gap-7">
                <div className="space-y-2">
                  <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                    <Tags size={16} className="shrink-0" />
                    Entry Type
                  </label>
                  <div className="relative group">
                    <Select 
                      value={formData.type}
                      onChange={(e) => handleChange('type', e.target.value)}
                      className="w-full h-11 bg-muted border-none rounded-md px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 appearance-none shadow-inner group-hover:bg-muted/80 transition-all"
                    >
                      <option value="Expense">Expense</option>
                      <option value="Income">Income</option>
                      <option value="Transfer">Transfer</option>
                    </Select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none group-hover:text-accent transition-colors" />
                  </div>
                </div>
                <div className="space-y-2">
                  <SearchableSelect 
                    label={formData.type === 'Transfer' ? "From Account" : "Account"}
                    headerIcon={<Landmark size={16} className="shrink-0" />}
                    icon={<KeyIcon size={16} />}
                    value={formData.account}
                    onChange={(val) => handleChange('account', val)}
                    options={options.accounts}
                  />
                </div>
              </div>

              {formData.type === 'Transfer' && (
                <div className="grid grid-cols-1 gap-7">
                  <div className="space-y-2 border border-accent/20 bg-accent/5 p-4 rounded-xl">
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
              )}

              <div className="grid grid-cols-2 gap-7">
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

              <div className="grid grid-cols-2 gap-7">
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

              <div className="grid grid-cols-2 gap-7">
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
                  <SearchableSelect 
                    label="Tags"
                    headerIcon={<Tags size={16} className="shrink-0" />}
                    value={formData.tags}
                    onChange={(val) => handleChange('tags', val)}
                    options={options.tags}
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
                  placeholder="Record any specific details..."
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-1/2 mx-auto h-9 bg-emerald-600 text-white rounded-md font-black text-sm shadow-xl shadow-emerald-900/10 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:bg-muted"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-md animate-spin"></div>
                ) : (
                  <CheckCircle2 size={16} />
                )}
                <span>{isSubmitting ? "Processing..." : "Save Expense"}</span>
              </button>
            </div>
            </form>
          </>
        ) : (
          <>
            <PageHeader title="Habits Daily Viewer Mockup"  >
        <div className="flex items-center gap-2">

          <Link 
            href="/reports" 
            className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-muted-foreground/60 hover:text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
            title="View Reports"
          >
            <BarChart2 className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Link>
        </div>
      </PageHeader>
            <div className="-mt-2 mb-6">
              <div className="h-10 bg-muted/40 rounded-xl border border-border/25 flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Habits Navigation Area
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-center mb-6 mt-6 w-full">
                <div className="bg-card px-4 py-1.5 rounded-xl border border-border/40 shadow-sm flex items-center justify-between w-full max-w-sm">
                   <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground">
                      <ChevronLeft size={16} />
                   </button>
                   <div className="flex items-center gap-2 font-black text-xs text-foreground uppercase tracking-tight">
                      <CalendarDays className="w-3.5 h-3.5 text-primary opacity-50" />
                      <span>{formData.date}</span>
                   </div>
                   <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground">
                      <ChevronRight size={16} />
                   </button>
                </div>
              </div>

              <div className="bg-card border border-border/40 rounded-[2rem] p-6 shadow-sm">
                 <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-6">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                       <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Success</p>
                       <p className="text-2xl font-black text-emerald-600">3</p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                       <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Tolerance</p>
                       <p className="text-2xl font-black text-amber-600">1</p>
                    </div>
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-center">
                       <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-1">Failure</p>
                       <p className="text-2xl font-black text-rose-600">0</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                       <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1">Critical</p>
                       <p className="text-2xl font-black text-red-600">0</p>
                    </div>
                 </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Custom Searchable Dropdown Component (copied from Daily Expenses Entry)
function SearchableSelect({ label, headerIcon, icon, value, onChange, options }: { 
  label: string; 
  headerIcon?: React.ReactNode; 
  icon?: React.ReactNode; 
  value: string; 
  onChange: (val: string) => void;
  options: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const [isTyping, setIsTyping] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  const displayOptions = (isTyping && search)
    ? options.filter(opt => opt?.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div className="relative space-y-2">
      <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
        {headerIcon}
        {label}
      </label>
      <div className="relative group">
        <input 
          ref={inputRef}
          type="text"
          placeholder="Select/Type"
          value={search}
          autoComplete="off"
          readOnly={!isManualEntry}
          onClick={() => { if (!isManualEntry) setIsOpen(true); }}
          onChange={(e) => {
            setSearch(e.target.value);
            onChange(e.target.value);
            setIsTyping(true);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsTyping(false);
            setIsOpen(true);
          }}
          onBlur={() => setTimeout(() => {
            setIsOpen(false);
            setIsTyping(false);
            setIsManualEntry(false);
          }, 200)}
          className={`w-full h-11 bg-muted border-none rounded-md px-4 pr-10 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner group-hover:bg-muted/80 transition-all font-sans ${!isManualEntry ? 'cursor-pointer' : ''}`}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none group-hover:text-accent transition-colors">
          {icon || <ChevronDown size={16} />}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-card rounded-md shadow-2xl border border-border/40 max-h-72 overflow-y-auto overflow-x-hidden p-1.5 animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-500 ease-out">
          {displayOptions.map((opt, i) => (
            <button
              key={`${opt}-${i}`}
              type="button"
              onClick={() => {
                onChange(opt);
                setSearch(opt);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-bold tracking-tight transition-all flex items-center justify-between group/item mb-0.5 last:mb-0
                ${value === opt 
                  ? "bg-primary text-primary-foreground shadow-sm font-black" 
                  : "text-muted-foreground hover:bg-muted hover:text-primary"}`}
            >
              <span className="truncate">{opt}</span>
              {value === opt && <CheckCircle2 size={16} className="text-primary-foreground/60" />}
            </button>
          ))}
          
          {!isManualEntry && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault();
                setIsManualEntry(true);
                setSearch("");
                onChange("");
                setIsOpen(false);
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
              className="w-full text-left px-3 py-3 rounded-md text-sm font-black tracking-tight text-accent hover:bg-accent/5 transition-all flex items-center gap-2 mt-1 border-t border-accent/10 sm:border-none"
            >
              <PlusCircle size={16} className="shrink-0" />
              <span className="truncate">Add New</span>
            </button>
          )}

          {isManualEntry && search && !options.includes(search) && (
            <button
              type="button"
              onClick={() => {
                onChange(search);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-md text-sm font-black tracking-tight text-accent hover:bg-accent/5 transition-all flex items-center gap-2 mt-0.5 border border-accent/10 sm:border-none"
            >
              <PlusCircle size={16} className="shrink-0" />
              <span className="truncate">Create "{search}"</span>
            </button>
          )}

          {displayOptions.length === 0 && !search && (
            <div className="px-3 py-4 text-center">
              <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">Empty List</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
