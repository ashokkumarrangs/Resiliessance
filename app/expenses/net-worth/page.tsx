"use client";

import { Briefcase, ChevronDown, Landmark, RefreshCw, Wallet , BarChart2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Currency } from "@/components/currency";
import { PageHeader } from "@/components/PageHeader";
import { SectionNav } from "@/components/SectionNav";
import { EXPENSE_TABS } from "@/lib/navigation";

interface NetWorthItem {
  name: string;
  value: number;
}

export default function NetWorthPage() {
  const router = useRouter();
  const [data, setData] = useState({
    liquidity: 0,
    assets: 0,
    liabilities: 0,
    netWorth: 0
  });
  const [lists, setLists] = useState({
    liquidity: [] as NetWorthItem[],
    assets: [] as NetWorthItem[],
    liabilities: [] as NetWorthItem[]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetchNetWorthData();
  }, []);

  const fetchNetWorthData = async () => {
    setIsLoading(true);
    try {
      const results = await Promise.all([
        supabase.from('liquidity').select('account_name, balance'),
        supabase.from('assets').select('asset_name, current_value'),
        supabase.from('liabilities').select('party, remaining')
      ]);

      
      if (results.some(r => r.error)) {
        throw new Error("One or more tables failed to load properly.");
      }
      const [ { data: liqData }, { data: astData }, { data: libData } ] = results;
      
      const liqItems = (liqData || []).map(d => ({ name: d.account_name, value: parseFloat(d.balance as any) || 0 }));
      const astItems = (astData || []).map(d => ({ name: d.asset_name, value: parseFloat(d.current_value as any) || 0 }));
      const libItems = (libData || []).map(d => ({ name: d.party, value: parseFloat(d.remaining as any) || 0 }));

      const liqTotal = liqItems.reduce((s, i) => s + i.value, 0);
      const astTotal = astItems.reduce((s, i) => s + i.value, 0);
      const libTotal = libItems.reduce((s, i) => s + i.value, 0);
      
      setData({
        liquidity: liqTotal,
        assets: astTotal,
        liabilities: libTotal,
        netWorth: liqTotal + astTotal - libTotal
      });

      setLists({
        liquidity: liqItems,
        assets: astItems,
        liabilities: libItems
      });
    } catch (error) {
      console.error("Error fetching net worth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isPositive = data.netWorth >= 0;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        <PageHeader title="Financial Net Worth" >
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

        <div className="space-y-6">
        
        {/* Net Worth Card */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/40 flex flex-col items-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-[60px] pointer-events-none" />
           
           <div className={`text-[44px] font-black tracking-tighter leading-none ${isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
              {isLoading ? "..." : <Currency value={data.netWorth} />}
           </div>
        </div>

        {/* Breakdown Cards with Expansion */}
        <div className="grid grid-cols-1 gap-4">
           <BreakdownCard 
             label="Liquidity" 
             value={data.liquidity} 
             icon={<Wallet size={24} />} 
             color="text-indigo-600" 
             bg="bg-indigo-50/50" 
             items={lists.liquidity}
             isExpanded={expanded === 'liquidity'}
             onToggle={() => setExpanded(expanded === 'liquidity' ? null : 'liquidity')}
           />
           <BreakdownCard 
             label="Assets" 
             value={data.assets} 
             icon={<Briefcase size={24} />} 
             color="text-emerald-600" 
             bg="bg-emerald-50/50" 
             items={lists.assets}
             isExpanded={expanded === 'assets'}
             onToggle={() => setExpanded(expanded === 'assets' ? null : 'assets')}
           />
           <BreakdownCard 
             label="Liabilities" 
             value={data.liabilities} 
             icon={<Landmark size={24} />} 
             color="text-rose-500" 
             bg="bg-rose-50/50" 
             items={lists.liabilities}
             isExpanded={expanded === 'liabilities'}
             onToggle={() => setExpanded(expanded === 'liabilities' ? null : 'liabilities')}
           />
        </div>

        {/* Simple Refresh Action */}
        <div className="pt-8 text-center">
           <button 
             onClick={fetchNetWorthData}
             className="text-[10px] font-black text-muted-foreground/40 hover:text-indigo-600 transition-all flex items-center gap-2 mx-auto"
           >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              <span>Update Valuations</span>
           </button>
        </div>
      </div>
      </div>
    </div>
  );
}

function BreakdownCard({ 
  label, 
  value, 
  icon, 
  color, 
  bg, 
  items, 
  isExpanded, 
  onToggle 
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode; 
  color: string; 
  bg: string;
  items: NetWorthItem[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div 
      onClick={onToggle}
      className={`bg-card rounded-2xl shadow-sm border transition-all cursor-pointer overflow-hidden ${isExpanded ? 'border-indigo-600/30 ring-4 ring-indigo-600/5' : 'border-border/40 hover:border-indigo-600/20'}`}
    >
       <div className="p-5 flex items-center gap-5">
          <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center ${color} shrink-0`}>
             {icon}
          </div>
          <div className="flex-1 min-w-0">
             <div className="text-[10px] font-medium text-muted-foreground/60 tracking-widest mb-1">{label}</div>
             <div className={`text-2xl font-black ${color} tracking-tight truncate`}><Currency value={value} /></div>
          </div>
          <ChevronDown size={20} className={`text-muted-foreground/20 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
       </div>

       {isExpanded && (
         <div className="px-5 pb-5 pt-2 space-y-3 bg-muted/10 border-t border-border/40">
            {items.length > 0 ? items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center group">
                 <span className="text-[14px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">{item.name || "Unnamed"}</span>
                 <span className="text-sm font-black text-foreground"><Currency value={item.value} /></span>
              </div>
            )) : (
              <div className="text-[11px] font-medium text-muted-foreground/40 text-center py-2">No items found</div>
            )}
         </div>
       )}
    </div>
  );
}
