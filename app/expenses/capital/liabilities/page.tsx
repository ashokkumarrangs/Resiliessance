"use client";
import { format } from 'date-fns';
import { Banknote, CalendarDays, Landmark, StickyNote, Tags, Users } from "lucide-react";
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

function LiabilitiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    party: "",
    party_type: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    amount: "",
    type: "Receive", // Receive (borrow) | Pay (repay)
    category: "Principal", // Principal | Interest
    account: "",
    notes: ""
  });

  // Options State
  const [options, setOptions] = useState({
    accounts: [] as string[],
    parties: [] as string[],
    partyTypes: [] as string[]
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [partyDetail, setPartyDetail] = useState<any>(null);

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    const urlParty = searchParams.get('party');
    if (urlParty) {
      handlePartySelect(urlParty);
    }
  }, [searchParams, options.parties]);

  const fetchOptions = async () => {
    try {
      const [{ data: accs }, { data: liabData }] = await Promise.all([
        supabase.from('liquidity').select('account_name'),
        supabase.from('liabilities').select('party, party_type')
      ]);

      if (accs) setOptions(prev => ({ ...prev, accounts: accs.map(a => a.account_name) }));
      if (liabData) {
        setOptions(prev => ({
          ...prev,
          parties: Array.from(new Set(liabData.map(d => d.party).filter(Boolean))),
          partyTypes: Array.from(new Set(liabData.map(d => d.party_type).filter(Boolean)))
        }));
      }
    } catch (error: any) {
      console.error("Error loading liabilities options:", error);
      toast.error("Failed to load options");
    }
  };

  const handlePartySelect = async (party: string) => {
    setFormData(prev => ({ ...prev, party }));
    const { data } = await supabase.from('liabilities').select('*').eq('party', party).maybeSingle();
    if (data) {
      setPartyDetail(data);
      setFormData(prev => ({ ...prev, party, party_type: data.party_type || '' }));
    } else {
      setPartyDetail(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.party) { toast.error("Party is required"); return; }
    if (!formData.amount) { toast.error("Amount is required"); return; }
    if (!formData.account) { toast.error("Account is required"); return; }
    
    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) { toast.error("Invalid amount"); return; }

    setIsSubmitting(true);
    try {
      let newTotal = 0, newRemaining = 0, newInterest = 0;
      if (partyDetail) {
        newTotal = parseFloat(partyDetail.total_amount) || 0;
        newRemaining = parseFloat(partyDetail.remaining) || 0;
        newInterest = parseFloat(partyDetail.interest_paid) || 0;
        
        if (formData.type === 'Receive' && formData.category === 'Principal') {
          newTotal += amt;
          newRemaining += amt;
        } else if (formData.type === 'Pay' && formData.category === 'Principal') {
          newRemaining = Math.max(0, newRemaining - amt);
        } else if (formData.type === 'Pay' && formData.category === 'Interest') {
          newInterest += amt;
        }
      } else {
        newTotal = (formData.type === 'Receive' && formData.category === 'Principal') ? amt : 0;
        newRemaining = newTotal;
        newInterest = (formData.type === 'Pay' && formData.category === 'Interest') ? amt : 0;
      }

      // 1. Upsert liability record
      if (partyDetail) {
        const { error } = await supabase.from('liabilities').update({
          remaining: newRemaining,
          interest_paid: newInterest,
          total_amount: newTotal,
          updated_at: new Date().toISOString()
        }).eq('party', formData.party);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('liabilities').insert([{
          party: formData.party,
          party_type: formData.party_type,
          total_amount: newTotal,
          remaining: newRemaining,
          interest_paid: newInterest,
          notes: formData.notes
        }]);
        if (error) throw error;
      }

      // 2. Insert history row
      const { error: histErr } = await supabase.from('history_liabilities').insert({
        date: formData.date,
        amount: amt,
        type: formData.type,
        account: formData.category, // 'Principal' or 'Interest'
        party: formData.party,
        party_type: formData.party_type,
        notes: formData.notes
      });
      if (histErr) throw histErr;

      // 3. Update liquidity
      const { data: acc } = await supabase.from('liquidity').select('balance').eq('account_name', formData.account).single();
      if (acc) {
        const isIn = formData.type === 'Receive';
        const newBal = (parseFloat(acc.balance) || 0) + (isIn ? amt : -amt);
        await supabase.from('liquidity').update({ balance: newBal }).eq('account_name', formData.account);
      }

      // 4. Insert into activity_logs (best-effort)
      try {
        const actionLabel = formData.type === 'Receive' ? `Borrowed from ${formData.party}` : `Repaid ${formData.party}`;
        await supabase.from('activity_logs').insert({
          activity: actionLabel,
          date: formData.date,
          time: formData.time || null,
          notes: `₹${amt.toLocaleString()} · ${formData.category} · ${formData.account}${formData.notes ? ' · ' + formData.notes : ''}`,
          created_at: new Date().toISOString()
        });
      } catch { /* non-critical */ }

      toast.success("Liability saved successfully");
      router.push("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to save liability");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubNavChange = (val: string) => {
    if (val === 'Capital') return;
    router.push(`/expenses/transactions/${val.toLowerCase()}`);
  };

  const handleCategoryChange = (val: string) => {
    if (val === 'Liabilities') return;
    router.push(`/expenses/capital/${val.toLowerCase()}`);
  };

  const directionBanner = formData.type === 'Receive'
    ? { isIn: true, text: '↑ Money IN · Account balance will increase' }
    : { isIn: false, text: '↓ Money OUT · Account balance will decrease' };

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
              value="Liabilities"
              onChange={handleCategoryChange}
              options={CAPITAL_CATEGORIES}
              disableCreate
            />
          </div>

          {/* Party and Party Type */}
          <div className="grid grid-cols-2 gap-4 relative z-40">
            <SearchableSelect label="Party" headerIcon={<Users size={16} className="shrink-0" />}
              value={formData.party} onChange={handlePartySelect} options={options.parties} />
            <SearchableSelect label="Party Type" headerIcon={<Tags size={16} className="shrink-0" />}
              value={formData.party_type} onChange={(val) => setFormData(prev => ({ ...prev, party_type: val }))}
              options={options.partyTypes} />
          </div>

          {/* Date and Time */}
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

          <PillToggle label="Type" options={['Receive', 'Pay']}
            value={formData.type} onChange={(v) => setFormData(prev => ({ ...prev, type: v }))} />

          {/* Direction banner */}
          <div className={`w-full px-4 py-2.5 rounded-lg text-xs font-black flex items-center gap-2 ${directionBanner.isIn ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
            {directionBanner.text}
          </div>

          {/* Account and Amount */}
          <div className="grid grid-cols-2 gap-4 relative z-30">
            <SearchableSelect label="Account" headerIcon={<Landmark size={16} className="shrink-0" />}
              value={formData.account} onChange={(val) => setFormData(prev => ({ ...prev, account: val }))} options={options.accounts} />
            <div className="space-y-2">
              <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none"><Banknote size={16} /> Amount</label>
              <div className="relative group">
                <input type="number" placeholder="0.00" value={formData.amount} inputMode="decimal"
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-black text-primary focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none" required />
                <Banknote size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none" />
              </div>
            </div>
          </div>

          <PillToggle label="Category" options={['Principal', 'Interest']}
            value={formData.category} onChange={(v) => setFormData(prev => ({ ...prev, category: v }))} />

          <div className="space-y-2">
            <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none"><StickyNote size={16} /> Notes</label>
            <input type="text" value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full h-11 bg-muted border-none rounded-md px-4 text-sm font-semibold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner outline-none"
              placeholder="Context for this transaction..." />
          </div>

          {partyDetail && (
            <div className="bg-blue-50/60 rounded-xl p-4 space-y-2 border border-blue-100">
              <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/60">{formData.party}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-wider">Current Debt</p>
                  <p className="text-sm font-black text-foreground">₹{parseFloat(partyDetail.remaining || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-wider">Interest Paid</p>
                  <p className="text-sm font-black text-amber-600">₹{parseFloat(partyDetail.interest_paid || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center pt-8">
            <SaveButton type="submit" isSaving={isSubmitting} disabled={isSubmitting}
              label="Save Liability"
              className="w-full max-w-xs h-12 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-muted" />
          </div>
        </div>
      </form>
    </PageWrapper>
  );
}

export default function LiabilitiesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground font-black tracking-widest uppercase text-xs">Loading Form...</div>}>
      <LiabilitiesContent />
    </Suspense>
  );
}
