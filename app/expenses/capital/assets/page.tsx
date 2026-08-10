"use client";
import { format } from 'date-fns';
import { Banknote, Box, CalendarDays, Landmark, ListTodo, MapPin, StickyNote, Tag, Tags } from "lucide-react";
import { SaveButton } from "@/components/ui/SaveButton";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { PageWrapper } from "@/components/PageWrapper";
import { SubNav } from "@/components/SubNav";
import { EXPENSE_TABS } from "@/lib/navigation";
import { SearchableSelect } from "@/components/SearchableSelect";

const CAPITAL_CATEGORIES = ["Liabilities", "Receivables", "Assets"];
const ASSET_ACTIONS = ["Add", "Update Value", "Sell"];

function AssetsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    action: "Add", // Add | Update Value | Sell
    asset_name: "",
    asset_existing_id: "",
    category: "",
    subcategory: "",
    asset_type: "",
    place: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    amount: "",
    account: "",
    notes: ""
  });

  // Options State
  const [options, setOptions] = useState({
    accounts: [] as string[],
    assets: [] as any[],
    categories: [] as string[],
    subcategories: [] as string[],
    assetTypes: [] as string[],
    places: [] as string[]
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  // Handle URL deep-linking
  useEffect(() => {
    if (options.assets.length === 0) return;
    const urlAction = searchParams.get('action');
    const urlId = searchParams.get('id');
    
    if (urlAction === 'update' || urlAction === 'sell') {
      const act = urlAction === 'update' ? 'Update Value' : 'Sell';
      setFormData(prev => ({ ...prev, action: act }));
    }

    if (urlId) {
      const found = options.assets.find(a => a.id === urlId);
      if (found) {
        setFormData(prev => ({
          ...prev,
          asset_name: found.asset_name,
          asset_existing_id: urlId,
          action: urlAction === 'sell' ? 'Sell' : 'Update Value'
        }));
      }
    }
  }, [searchParams, options.assets]);

  const fetchOptions = async () => {
    try {
      const [{ data: accs }, { data: assetData }] = await Promise.all([
        supabase.from('liquidity').select('account_name'),
        supabase.from('assets').select('*').order('asset_name')
      ]);

      if (accs) setOptions(prev => ({ ...prev, accounts: accs.map(a => a.account_name) }));
      if (assetData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const unique = (key: string) => Array.from(new Set(assetData.map((d: any) => d[key]).filter(Boolean)));
        setOptions(prev => ({
          ...prev,
          assets: assetData,
          categories: unique('category'),
          subcategories: unique('subcategory'),
          assetTypes: unique('asset_type'),
          places: unique('place')
        }));
      }
    } catch (error: any) {
      console.error("Error loading assets options:", error);
      toast.error("Failed to load options");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) { toast.error("Invalid amount"); return; }

    setIsSubmitting(true);
    try {
      let activityLabel = '';

      if (formData.action === 'Add') {
        if (!formData.asset_name) throw new Error("Asset Name is required");
        if (!formData.account) throw new Error("Account is required");

        const { error } = await supabase.from('assets').insert([{
          asset_name: formData.asset_name,
          purchase_price: amt,
          current_value: amt,
          purchase_date: formData.date,
          category: formData.category,
          subcategory: formData.subcategory,
          asset_type: formData.asset_type,
          place: formData.place,
          owner: "Me",
          notes: formData.notes
        }]);
        if (error) throw error;
        activityLabel = `Added Asset: ${formData.asset_name}`;

        try {
          await supabase.from('history_assets').insert({
            date: formData.date,
            action: 'Add',
            asset_name: formData.asset_name,
            account: formData.account,
            amount: amt,
            category: formData.category,
            asset_type: formData.asset_type,
            notes: formData.notes
          });
        } catch { /* best-effort */ }

        // Deduct from account balance
        const { data: acc } = await supabase.from('liquidity').select('balance').eq('account_name', formData.account).single();
        if (acc) {
          await supabase.from('liquidity').update({ balance: (parseFloat(acc.balance) || 0) - amt }).eq('account_name', formData.account);
        }

      } else if (formData.action === 'Update Value') {
        if (!formData.asset_existing_id) throw new Error("Please select an asset to update");

        const { error } = await supabase.from('assets').update({
          current_value: amt,
          ...(formData.notes ? { notes: formData.notes } : {})
        }).eq('id', formData.asset_existing_id);
        if (error) throw error;
        activityLabel = `Updated Valuation: ${formData.asset_name}`;

      } else if (formData.action === 'Sell') {
        if (!formData.asset_existing_id) throw new Error("Please select an asset to sell");
        if (!formData.account) throw new Error("Credit Account is required");

        const { error } = await supabase.from('assets').update({
          current_value: 0,
          notes: `Sold. Sale price: ₹${amt.toLocaleString()}${formData.notes ? '. ' + formData.notes : ''}`
        }).eq('id', formData.asset_existing_id);
        if (error) throw error;
        activityLabel = `Sold Asset: ${formData.asset_name}`;

        try {
          await supabase.from('history_assets').insert({
            date: formData.date,
            action: 'Sell',
            asset_name: formData.asset_name,
            account: formData.account,
            amount: amt,
            notes: formData.notes
          });
        } catch { /* best-effort */ }

        // Add to account balance
        const { data: acc } = await supabase.from('liquidity').select('balance').eq('account_name', formData.account).single();
        if (acc) {
          await supabase.from('liquidity').update({ balance: (parseFloat(acc.balance) || 0) + amt }).eq('account_name', formData.account);
        }
      }

      // Insert into activity_logs (best-effort)
      try {
        await supabase.from('activity_logs').insert({
          activity: activityLabel,
          date: formData.date,
          time: formData.time || null,
          notes: `₹${amt.toLocaleString()}${formData.category ? ' · ' + formData.category : ''}${formData.notes ? ' · ' + formData.notes : ''}`,
          created_at: new Date().toISOString()
        });
      } catch { /* non-critical */ }

      toast.success("Asset saved successfully");
      router.push("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to save asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubNavChange = (val: string) => {
    if (val === 'Capital') return;
    router.push(`/expenses/transactions/${val.toLowerCase()}`);
  };

  const handleCategoryChange = (val: string) => {
    if (val === 'Assets') return;
    router.push(`/expenses/capital/${val.toLowerCase()}`);
  };

  const PillToggle = ({ label, options: opts, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) => (
    <div className="space-y-2">
      <label className="text-sm font-black text-muted-foreground/60 leading-none">{label}</label>
      <div className="flex bg-muted rounded-lg p-1 gap-1">
        {opts.map(o => (
          <button key={o} type="button" onClick={() => onChange(o)}
            className={`flex-1 h-9 rounded-md text-xs font-black transition-all active:scale-95 ${value === o ? 'bg-card text-primary shadow-sm border border-border/40' : 'text-muted-foreground/60 hover:text-foreground'}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );

  const directionBanner = formData.action === 'Sell'
    ? { isIn: true, text: '↑ Money IN · Account balance will increase' }
    : null;

  return (
    <PageWrapper title="Capital" reportHref="/reports/finance" sectionTabs={EXPENSE_TABS}>
      <div className="flex justify-center w-full">
        <SubNav
          items={["Expense", "Income", "Transfer", "Capital"]}
          activeItem="Capital"
          onChange={handleSubNavChange}
          className="!mb-0"
        />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full mt-6">
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/40 space-y-5">
          {/* Category Dropdown */}
          <div className="relative z-50">
            <SearchableSelect
              label="Category"
              headerIcon={<Landmark size={16} className="shrink-0" />}
              value="Assets"
              onChange={handleCategoryChange}
              options={CAPITAL_CATEGORIES}
              disableCreate
            />
          </div>

          <PillToggle label="Action" options={ASSET_ACTIONS}
            value={formData.action}
            onChange={(v) => setFormData(prev => ({ ...prev, action: v, asset_name: '', asset_existing_id: '', amount: '' }))} />

          {/* Sell banner */}
          {formData.action === 'Sell' && directionBanner && (
            <div className="w-full px-4 py-2.5 rounded-lg text-xs font-black flex items-center gap-2 bg-emerald-50 text-emerald-800">
              {directionBanner.text}
            </div>
          )}

          {/* Asset Name | Asset ID */}
          <div className="grid grid-cols-2 gap-4 relative z-40">
            {formData.action === 'Add' ? (
              <div className="space-y-2">
                <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none"><Tag size={16} /> Asset Name</label>
                <input type="text" placeholder="e.g. HDFC Bank FD"
                  value={formData.asset_name} onChange={(e) => setFormData(prev => ({ ...prev, asset_name: e.target.value }))}
                  className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner" required />
              </div>
            ) : (
              <SearchableSelect label="Select Asset" headerIcon={<Box size={16} className="shrink-0" />}
                value={formData.asset_name}
                onChange={(val) => {
                  const found = options.assets.find(a => a.asset_name === val);
                  setFormData(prev => ({ ...prev, asset_name: val, asset_existing_id: found?.id || '' }));
                }}
                options={options.assets.map(a => a.asset_name)}
                disableCreate />
            )}
            <div className="space-y-2">
              <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none"><Tag size={16} /> Asset ID</label>
              <input
                type="text"
                disabled
                value={formData.asset_existing_id ? formData.asset_existing_id.slice(0, 8).toUpperCase() : ''}
                placeholder="Auto-ID"
                className="w-full h-11 bg-muted border-none rounded-md px-4 text-sm font-bold text-muted-foreground/40 cursor-not-allowed shadow-inner"
              />
            </div>
          </div>

          {/* Category/Type/Place/Date — only for Add */}
          {formData.action === 'Add' && (
            <>
              <div className="grid grid-cols-2 gap-4 relative z-30">
                <SearchableSelect label="Category" headerIcon={<Tag size={16} />}
                  value={formData.category} onChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                  options={options.categories} />
                <SearchableSelect label="Sub-Category" headerIcon={<ListTodo size={16} />}
                  value={formData.subcategory} onChange={(val) => setFormData(prev => ({ ...prev, subcategory: val }))}
                  options={options.subcategories} />
              </div>
              <div className="grid grid-cols-2 gap-4 relative z-20">
                <SearchableSelect label="Asset Type" headerIcon={<Box size={16} />}
                  value={formData.asset_type} onChange={(val) => setFormData(prev => ({ ...prev, asset_type: val }))}
                  options={options.assetTypes} />
                <SearchableSelect label="Place" headerIcon={<MapPin size={16} />}
                  value={formData.place} onChange={(val) => setFormData(prev => ({ ...prev, place: val }))}
                  options={options.places} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none"><CalendarDays size={16} /> Purchase Date</label>
                  <input type="date" max={new Date().toLocaleDateString('en-CA')} value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-muted-foreground/60 leading-none">Time</label>
                  <input type="time" value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none" />
                </div>
              </div>
            </>
          )}

          {/* ── Update Value: Date | Time → Current Value vs Updated Value ── */}
          {formData.action === 'Update Value' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none"><CalendarDays size={16} /> Date</label>
                  <input type="date" max={new Date().toLocaleDateString('en-CA')} value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-muted-foreground/60 leading-none">Time</label>
                  <input type="time" value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none"><Banknote size={16} /> Current Value</label>
                  <input
                    type="text"
                    disabled
                    value={formData.asset_existing_id ? `₹${parseFloat(options.assets.find(a => a.id === formData.asset_existing_id)?.current_value || 0).toLocaleString()}` : ''}
                    placeholder="Select asset first"
                    className="w-full h-11 bg-muted border-none rounded-md px-4 text-sm font-bold text-muted-foreground/50 cursor-not-allowed shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none"><Banknote size={16} /> Updated Value</label>
                  <div className="relative group">
                    <input type="number" placeholder="0.00" value={formData.amount} inputMode="decimal"
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-black text-primary focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none" required />
                    <Banknote size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none" />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Sell: Date | Time → Credit Account | Sale Amount ── */}
          {formData.action === 'Sell' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none"><CalendarDays size={16} /> Sale Date</label>
                  <input type="date" max={new Date().toLocaleDateString('en-CA')} value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-muted-foreground/60 leading-none">Time</label>
                  <input type="time" value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <SearchableSelect label="Credit Account" headerIcon={<Landmark size={16} className="shrink-0" />}
                  value={formData.account}
                  onChange={(val) => setFormData(prev => ({ ...prev, account: val }))}
                  options={options.accounts} />
                <div className="space-y-2">
                  <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none"><Banknote size={16} /> Sale Amount</label>
                  <div className="relative group">
                    <input type="number" placeholder="0.00" value={formData.amount} inputMode="decimal"
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-black text-primary focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none" required />
                    <Banknote size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none" />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Add: Account | Purchase Price ── */}
          {formData.action === 'Add' && (
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <SearchableSelect label="Account" headerIcon={<Landmark size={16} className="shrink-0" />}
                value={formData.account}
                onChange={(val) => setFormData(prev => ({ ...prev, account: val }))}
                options={options.accounts} />
              <div className="space-y-2">
                <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none"><Banknote size={16} /> Purchase Price</label>
                <div className="relative group">
                  <input type="number" placeholder="0.00" value={formData.amount} inputMode="decimal"
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-black text-primary focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none" required />
                  <Banknote size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none"><StickyNote size={16} /> Notes</label>
            <input type="text" value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full h-11 bg-muted border-none rounded-md px-4 text-sm font-semibold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner outline-none"
              placeholder="e.g. 1 year FD at 7.2% p.a." />
          </div>

          <div className="flex justify-center pt-8">
            <SaveButton type="submit" isSaving={isSubmitting} disabled={isSubmitting}
              label={formData.action === 'Update Value' ? 'Update Valuation' : formData.action === 'Sell' ? 'Record Sale' : 'Save Asset'}
              className="w-full max-w-xs h-12 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-muted" />
          </div>
        </div>
      </form>
    </PageWrapper>
  );
}

export default function AssetsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground font-black tracking-widest uppercase text-xs">Loading Form...</div>}>
      <AssetsContent />
    </Suspense>
  );
}
