"use client";

import { Landmark, PlusCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Currency } from "@/components/currency";
import { PageWrapper } from "@/components/PageWrapper";
import { EXPENSE_TABS } from "@/lib/navigation";
import { SubNav } from "@/components/SubNav";

interface Receivable {
  party: string;
  party_type: string;
  total_amount: number;
  remaining: number;
  interest_received: number;
  notes: string;
  updated_at?: string;
}

export default function ViewReceivablePage() {
  const router = useRouter();
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReceivables();
  }, []);

  const fetchReceivables = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('receivables').select('*');
      if (error) throw error;
      setReceivables(data || []);
    } catch (error: any) {
      console.error("Error fetching receivables:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalRemaining = receivables.reduce((s, l) => s + (parseFloat(l.remaining as any) || 0), 0);
  const totalLent = receivables.reduce((s, l) => s + (parseFloat(l.total_amount as any) || 0), 0);

  return (
    <PageWrapper
      title="View Receivables"
      reportHref="/reports/finance"
      sectionTabs={EXPENSE_TABS}
      activePath="/expenses/view-receivable"
      headerActions={
        <button 
          onClick={fetchReceivables} 
          className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-muted-foreground/60 hover:text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 md:w-[18px] md:h-[18px] ${isLoading ? "animate-spin" : ""}`} />
        </button>
      }
    >
        
        <div className="flex items-center justify-center relative mb-6 w-full">
          <SubNav 
            items={["View Receivables", "Add Receivable"]}
            activeItem="View Receivables"
            onChange={(val) => {
              if (val === "Add Receivable") router.push("/expenses/capital/receivables");
            }}
            className="!mb-0 !mx-0"
          />
        </div>


        <div className="space-y-8 w-full">

      <div className="grid grid-cols-3 gap-2 md:gap-3 mb-8">
        <div className="bg-card rounded-2xl p-3 md:p-5 shadow-sm border border-border/40 text-center overflow-hidden flex flex-col justify-center min-w-0">
          <div className="text-[9px] md:text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest mb-1.5 leading-tight truncate">Parties</div>
          <div className="text-sm sm:text-xl font-black text-primary truncate">{receivables.length}</div>
        </div>
        <div className="bg-card rounded-2xl p-3 md:p-5 shadow-sm border border-border/40 text-center overflow-hidden flex flex-col justify-center min-w-0">
          <div className="text-[9px] md:text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest mb-1.5 leading-tight truncate">Lent</div>
          <div className="text-sm sm:text-xl font-black text-foreground truncate"><Currency value={totalLent} /></div>
        </div>
        <div className="bg-card rounded-2xl p-3 md:p-5 shadow-sm border border-border/40 text-center overflow-hidden flex flex-col justify-center items-center min-w-0">
          <div className="text-[9px] md:text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest mb-1.5 leading-tight truncate">Remaining</div>
          <div className="text-sm sm:text-xl font-black text-emerald-500 leading-none mb-1 truncate"><Currency value={totalRemaining} /></div>
          <div className="text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 shrink-0">
            ASSET
          </div>
        </div>
      </div>


      <div className="grid grid-cols-2 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 bg-card rounded-2xl animate-pulse border border-border/40" />)
        ) : (
          receivables.map((lib, i) => (
            <div
              key={i}
              onClick={() => setSelectedReceivable(lib)}
              className="bg-card rounded-2xl p-6 shadow-sm border border-border/40 text-center cursor-pointer hover:-translate-y-1 transition-all flex flex-col items-center relative overflow-hidden group"
            >
              <div className="text-[9px] font-black text-primary-foreground bg-emerald-600 px-3 py-1.5 rounded-lg mb-4 uppercase tracking-widest z-10">
                {lib.party_type || 'Personal'}
              </div>
              <h3 className="text-sm font-black text-foreground mb-3 leading-tight truncate w-full px-2 z-10">
                {lib.party}
              </h3>
              <div className="text-lg font-black text-emerald-500 z-10">
                <Currency value={lib.remaining} />
              </div>
              <div className="text-[10px] font-bold text-amber-500 mt-2 z-10">
                Interest: <Currency value={lib.interest_received || 0} />
              </div>

              <div className="absolute -bottom-2 -right-2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity text-muted-foreground">
                <Landmark size={80} />
              </div>
            </div>
          ))
        )}
      </div>
      </div>

      {selectedReceivable && (
        <div 
          onClick={() => setSelectedReceivable(null)}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end justify-center p-4 transition-all"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="bg-card w-full max-w-md rounded-2xl border border-border/40 shadow-2xl p-8 overflow-y-auto flex flex-col relative"
          >
            <div className="w-16 h-1.5 bg-muted rounded-full mx-auto mb-10" />
            
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">{selectedReceivable.party_type}</div>
                <h3 className="text-2xl font-black text-foreground leading-tight">
                  {selectedReceivable.party}
                </h3>
              </div>
              <button onClick={() => setSelectedReceivable(null)} className="p-3 bg-muted/20 hover:bg-muted/40 rounded-xl text-muted-foreground transition-colors">
                <PlusCircle className="rotate-45" size={20} />
              </button>
            </div>

            <div className="space-y-3 mb-8">
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Remaining Asset</div>
                <div className="text-3xl font-black text-emerald-500"><Currency value={selectedReceivable.remaining} /></div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <SmallCard label="Total Lent" value={<Currency value={selectedReceivable.total_amount} />} color="text-foreground" />
                <SmallCard label="Interest Received" value={<Currency value={selectedReceivable.interest_received} />} color="text-amber-500" />
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-muted/20 border border-border/40 mb-8">
               <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-2">Internal Notes</div>
               <div className="text-sm font-bold text-muted-foreground leading-relaxed">"{selectedReceivable.notes || 'No specific notes recorded for this party.'}"</div>
            </div>

            <div className="flex gap-4">
              <button 
                className="flex-1 h-16 bg-primary text-primary-foreground rounded-xl font-black text-center flex items-center justify-center hover:bg-primary/95 transition-all shadow-xl shadow-primary/20"
                onClick={() => router.push(`/expenses/capital/receivables?party=${encodeURIComponent(selectedReceivable.party)}`)}
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
      </PageWrapper>
  );
}

function SmallCard({ label, value, color }: { label: string; value: React.ReactNode; color: string }) {
  return (
    <div className="bg-card rounded-2xl p-4 border border-border/40 shadow-sm flex flex-col justify-center">
      <div className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-md font-black ${color}`}>{value}</div>
    </div>
  );
}
