"use client";
import { format } from 'date-fns';
import { Select } from "@/components/Select";
import Link from "next/link";

import { Banknote, CalendarDays, CheckCircle2, ChevronDown, Landmark, ListTodo, StickyNote, Tags, Users , BarChart2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { SaveButton } from "@/components/ui/SaveButton";
import { SearchableSelect } from "@/components/SearchableSelect";
import { PageHeader } from "@/components/PageHeader";
import { SectionNav } from "@/components/SectionNav";
import { EXPENSE_TABS } from "@/lib/navigation";
import { SubNav } from "@/components/SubNav";

function AddLiabilityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialParty = searchParams.get('party');

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: "",
    type: "Principal",
    account: "Paid", // Uses 'Paid'/'Received' for context in history_liabilities
    party: "",
    party_type: "",
    notes: ""
  });

  const [options, setOptions] = useState({
    parties: [] as string[],
    partyTypes: [] as string[],
    accounts: ["Paid", "Received"]
  });

  const [partyDetail, setPartyDetail] = useState<any>(null);

  useEffect(() => {
    fetchOptions();
    if (initialParty) {
      handlePartySelect(initialParty);
    }
  }, [initialParty]);

  const fetchOptions = async () => {
    const { data } = await supabase.from('liabilities').select('party, party_type');
    if (data) {
      setOptions(prev => ({
        ...prev,
        parties: Array.from(new Set(data.map(d => d.party))),
        partyTypes: Array.from(new Set(data.map(d => d.party_type)))
      }));
    }
  };

  const handlePartySelect = async (party: string) => {
    setFormData(prev => ({ ...prev, party }));
    const { data } = await supabase.from('liabilities').select('*').eq('party', party).single();
    if (data) {
      setPartyDetail(data);
      setFormData(prev => ({ ...prev, party_type: data.party_type }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.party || !formData.type) {
      toast.error("Amount, Party, and Type are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const amt = parseFloat(formData.amount);
      let newTotal = amt;
      let newRemaining = amt;
      let newInterest = 0;

      if (partyDetail) {
        newTotal = parseFloat(partyDetail.total_amount) || 0;
        newRemaining = parseFloat(partyDetail.remaining) || 0;
        newInterest = parseFloat(partyDetail.interest_paid) || 0;

        if (formData.type === "Interest") {
          newInterest += amt;
        }
      }

      if (partyDetail) {
        const { error: libErr } = await supabase
          .from('liabilities')
          .update({ 
            remaining: newRemaining, 
            interest_paid: newInterest,
            total_amount: newTotal,
            updated_at: new Date().toISOString()
          })
          .eq('party', formData.party);
        
        if (libErr) throw libErr;
      } else {
        const { error: libErr } = await supabase.from('liabilities').insert({
          party: formData.party,
          party_type: formData.party_type,
          total_amount: newTotal || amt,
          remaining: newRemaining || (formData.type !== 'Interest' ? amt : 0),
          interest_paid: newInterest,
          notes: formData.notes
        });
        if (libErr) throw libErr;
      }

      const payload = {
        ...formData,
        amount: amt
      };
      const { error: histErr } = await supabase.from('history_liabilities').insert(payload);
      if (histErr) throw histErr;

      toast.success("Liability record saved");
      router.push("/expenses/view-liability");
    } catch (error: any) {
      console.error("Error saving liability:", error);
      toast.error(error.message || "Failed to save record");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        <PageHeader title="Add Liability"  >
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
          <SectionNav tabs={EXPENSE_TABS} activePath="/expenses/view-liability" />
        </div>
        <SubNav 
          items={["View Liabilities", "Add Liability"]}
          activeItem="Add Liability"
          onChange={(val) => {
            if (val === "View Liabilities") router.push("/expenses/view-liability");
          }}
        />
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full mt-6">
        <div className="bg-card rounded-2xl p-8 shadow-sm border border-border/40 space-y-7">
          
          <div className="grid grid-cols-2 gap-7">
            <SearchableSelect 
              label="Party"
              headerIcon={<Users size={16} />}
              value={formData.party}
              onChange={handlePartySelect}
              options={options.parties}
            />
            <SearchableSelect 
              label="Party Type"
              headerIcon={<Tags size={16} />}
              value={formData.party_type}
              onChange={(val) => setFormData({...formData, party_type: val})}
              options={options.partyTypes}
            />
          </div>

          <div className="grid grid-cols-2 gap-7">
            <div className="space-y-2">
              <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-2 leading-none">
                <CalendarDays size={16} /> Date
              </label>
              <div className="relative group">
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full h-11 bg-muted border-none rounded-lg px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none transition-all"
                  required
                />
                <CalendarDays size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none group-hover:text-accent transition-colors" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-2 leading-none">
                <Banknote size={16} /> Amount
              </label>
              <div className="relative group">
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full h-11 bg-muted border-none rounded-lg px-4 text-sm font-black text-primary focus:ring-2 focus:ring-accent/20 shadow-inner transition-all font-mono"
                  required
                />
                <Banknote size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-7">
            <div className="space-y-2">
              <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-2 leading-none">
                <ListTodo size={16} /> Type
              </label>
              <div className="relative group">
                <Select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full h-11 bg-muted border-none rounded-lg px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 appearance-none shadow-inner group-hover:bg-muted/80 transition-all"
                >
                  <option value="Principal">Pay Back Principal</option>
                  <option value="Interest">Pay Interest Only</option>
                  <option value="Borrowed">Take New Loan</option>
                </Select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none group-hover:text-accent transition-colors" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-2 leading-none">
                <Landmark size={16} /> Category
              </label>
              <div className="relative group">
                <Select 
                  value={formData.account}
                  onChange={(e) => setFormData({...formData, account: e.target.value})}
                  className="w-full h-11 bg-muted border-none rounded-lg px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 appearance-none shadow-inner group-hover:bg-muted/80 transition-all"
                >
                  <option value="Paid">Paid Out</option>
                  <option value="Received">Received In</option>
                </Select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none group-hover:text-accent transition-colors" />
              </div>
            </div>
          </div>

          {partyDetail && (
            <div className="bg-muted/30 rounded-xl p-6 border border-border/40 space-y-4 shadow-inner">
               <div className="text-[10px] font-black uppercase tracking-[2px] text-primary/60 border-b border-border/40 pb-2 mb-2 flex items-center gap-2">
                 Reference Specs
               </div>
               <div className="grid grid-cols-2 gap-y-4">
                  <SpecItem label="Current Debt" value={`₹${parseFloat(partyDetail?.remaining || 0).toLocaleString()}`} />
                  <SpecItem label="Interest Paid" value={`₹${parseFloat(partyDetail?.interest_paid || 0).toLocaleString()}`} />
               </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-2 leading-none">
              <StickyNote size={16} /> Notes
            </label>
            <input 
              type="text" 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full h-11 bg-muted border-none rounded-lg px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner transition-all placeholder:text-muted-foreground/30" 
              placeholder="Context for this transaction..."
            />
          </div>

          <div className="flex justify-center pt-8">
            <SaveButton type="submit" isSaving={isSubmitting} disabled={isSubmitting} label="Save Liability" className="w-full max-w-xs h-12 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-muted" />
          </div>
        </div>
      </form>
      </div>
    </div>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[8px] font-black uppercase text-muted-foreground tracking-wider">{label}</span>
      <span className="text-xs font-bold text-foreground">{value}</span>
    </div>
  );
}

export default function AddLiabilityPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground font-black tracking-widest uppercase text-xs">Synchronizing...</div>}>
      <AddLiabilityContent />
    </Suspense>
  );
}
