"use client";
import { format } from 'date-fns';
import { Select } from "@/components/Select";

import { Banknote, CalendarDays, ChevronDown, Landmark, ListTodo, StickyNote, Tags, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { SaveButton } from "@/components/ui/SaveButton";
import { SearchableSelect } from "@/components/SearchableSelect";
import { PageWrapper } from "@/components/PageWrapper";
import { EXPENSE_TABS } from "@/lib/navigation";
import { SubNav } from "@/components/SubNav";

function AddReceivableContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialParty = searchParams.get('party');

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: "",
    type: "Pay", // We are paying it out (lending it) by default
    account: "Principal",
    party: "",
    party_type: "",
    notes: ""
  });

  const [options, setOptions] = useState({
    parties: [] as string[],
    partyTypes: [] as string[]
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [partyDetail, setPartyDetail] = useState<any>(null);

  useEffect(() => {
    fetchOptions();
    if (initialParty) {
      handlePartySelect(initialParty);
    }
  }, [initialParty]);

  async function fetchOptions() {
    const { data } = await supabase.from('receivables').select('party, party_type');
    if (data) {
      setOptions(prev => ({
        ...prev,
        parties: Array.from(new Set(data.map(d => d.party))),
        partyTypes: Array.from(new Set(data.map(d => d.party_type)))
      }));
    }
  }

  async function handlePartySelect(party: string) {
    setFormData(prev => ({ ...prev, party }));
    const { data } = await supabase.from('receivables').select('*').eq('party', party).single();
    if (data) {
      setPartyDetail(data);
      setFormData(prev => ({ ...prev, party_type: data.party_type }));
    }
  }

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
        newInterest = parseFloat(partyDetail.interest_received) || 0;

        if (formData.type === "Pay") {
          // Lent more
          if (formData.account === "Principal") {
            newTotal += amt;
            newRemaining += amt;
          }
        } else if (formData.type === "Receive") {
          // Repaid
          if (formData.account === "Principal") {
            newRemaining = Math.max(0, newRemaining - amt);
          } else if (formData.account === "Interest") {
            newInterest += amt;
          }
        }
      } else {
        newTotal = (formData.type === "Pay" && formData.account === "Principal") ? amt : 0;
        newRemaining = newTotal;
        newInterest = (formData.type === "Receive" && formData.account === "Interest") ? amt : 0;
      }

      if (partyDetail) {
        const { error: libErr } = await supabase
          .from('receivables')
          .update({ 
            remaining: newRemaining, 
            interest_received: newInterest,
            total_amount: newTotal,
            updated_at: new Date().toISOString()
          })
          .eq('party', formData.party);
        
        if (libErr) throw libErr;
      } else {
        const { error: libErr } = await supabase.from('receivables').insert({
          party: formData.party,
          party_type: formData.party_type,
          total_amount: newTotal,
          remaining: newRemaining,
          interest_received: newInterest,
          notes: formData.notes
        });
        if (libErr) throw libErr;
      }

      const payload = {
        ...formData,
        amount: amt
      };
      const { error: histErr } = await supabase.from('history_receivables').insert(payload);
      if (histErr) throw histErr;

      toast.success("Receivable record saved");
      router.push("/expenses/view-receivable");
    } catch (error: any) {
      console.error("Error saving receivable:", error);
      toast.error(error.message || "Failed to save record");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper
      title="Add Receivable"
      reportHref="/reports/finance"
      sectionTabs={EXPENSE_TABS}
      activePath="/expenses/view-receivable"
    >
        <SubNav 
          items={["View Receivables", "Add Receivable"]}
          activeItem="Add Receivable"
          onChange={(val) => {
            if (val === "View Receivables") router.push("/expenses/view-receivable");
          }}
        />
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full mt-6">
        <div className="bg-card rounded-2xl p-8 shadow-sm border border-border/40 space-y-7">
          
          <div className="grid grid-cols-2 gap-7 relative z-50">
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

          <div className="grid grid-cols-2 gap-7 relative z-40">
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
                  inputMode="decimal"
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

          <div className="grid grid-cols-2 gap-7 relative z-30">
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
                  <option value="Receive">Receive</option>
                  <option value="Pay">Pay</option>
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
                  <option value="Principal">Principal</option>
                  <option value="Interest">Interest</option>
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
                  <SpecItem label="Current Asset" value={`₹${parseFloat(partyDetail?.remaining || 0).toLocaleString()}`} />
                  <SpecItem label="Interest Received" value={`₹${parseFloat(partyDetail?.interest_received || 0).toLocaleString()}`} />
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
            <SaveButton type="submit" isSaving={isSubmitting} disabled={isSubmitting} label="Save Receivable" className="w-full max-w-xs h-12 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-muted" />
          </div>
        </div>
      </form>
      </PageWrapper>
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

export default function AddReceivablePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground font-black tracking-widest uppercase text-xs">Synchronizing...</div>}>
      <AddReceivableContent />
    </Suspense>
  );
}
