"use client";

import { Box, Briefcase, CalendarDays, Pencil, PlusCircle, RefreshCw, TrendingDown, TrendingUp , BarChart2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Currency } from "@/components/currency";
import { format } from "date-fns";
import { PageHeader } from "@/components/PageHeader";
import { SectionNav } from "@/components/SectionNav";
import { EXPENSE_TABS } from "@/lib/navigation";
import { SubNav } from "@/components/SubNav";

interface Asset {
  id: string;
  asset_name: string;
  asset_type: string;
  current_value: number;
  purchase_price: number;
  purchase_date: string;
  owner: string;
  notes: string;
  last_updated_at?: string;
}

export default function ViewAssetsPage() {
  const router = useRouter();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('assets').select('*');
      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalBuyVal = assets.reduce((s, a) => s + (parseFloat(a.purchase_price as any) || 0), 0);
  const totalCurrVal = assets.reduce((s, a) => s + (parseFloat(a.current_value as any) || 0), 0);
  const profit = totalCurrVal - totalBuyVal;
  const profitPct = totalBuyVal > 0 ? (profit / totalBuyVal) * 100 : 0;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        
        <PageHeader title="View Assets"  >
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
          <SectionNav tabs={EXPENSE_TABS} activePath="/expenses/view-assets" />
        </div>
        
        <div className="flex items-center justify-center relative mb-6 w-full">
          <SubNav 
            items={["View Assets", "Add Asset", "Update Values"]}
            activeItem="View Assets"
            onChange={(val) => {
              if (val === "Add Asset") router.push("/expenses/add-asset");
              if (val === "Update Values") router.push("/expenses/update-asset");
            }}
            className="!mb-0 !mx-0"
          />
          <div className="absolute right-0">
            <button 
              onClick={fetchAssets} 
              className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-muted-foreground/60 hover:text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 md:w-[18px] md:h-[18px] ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="space-y-8 w-full">

      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/40 text-center">
          <div className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest mb-1.5 leading-tight">Total Assets</div>
          <div className="text-xl font-black text-primary">{assets.length}</div>
        </div>
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/40 text-center">
          <div className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest mb-1.5 leading-tight">Investment</div>
          <div className="text-sm font-black text-foreground"><Currency value={totalBuyVal} /></div>
        </div>
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/40 text-center flex flex-col justify-center items-center">
          <div className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest mb-1.5 leading-tight">Current Value</div>
          <div className="text-xl font-black text-emerald-500 leading-none mb-1"><Currency value={totalCurrVal} /></div>
          <div className={`text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 ${profitPct >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            {profitPct >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(profitPct).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 bg-card rounded-2xl animate-pulse border border-border/40" />)
        ) : (
          assets.map((ast, i) => {
            const profit = ast.current_value >= ast.purchase_price;
            return (
              <div
                key={i}
                onClick={() => setSelectedAsset(ast)}
                className="bg-card rounded-2xl p-6 shadow-sm border border-border/40 text-center cursor-pointer hover:-translate-y-1 transition-all flex flex-col items-center relative overflow-hidden group"
              >
                <div className={`text-[9px] font-black text-primary-foreground px-3 py-1.5 rounded-lg mb-4 uppercase tracking-widest z-10 ${profit ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                  {ast.asset_type || 'General'}
                </div>
                <h3 className="text-sm font-black text-foreground mb-3 leading-tight truncate w-full px-2 z-10">
                  {ast.asset_name}
                </h3>
                <div className="text-[11px] font-bold text-muted-foreground/40 line-through mb-1">
                  <Currency value={ast.purchase_price} />
                </div>
                <div className={`text-lg font-black z-10 ${profit ? 'text-emerald-500' : 'text-rose-500'}`}>
                  <Currency value={ast.current_value} />
                </div>

                <div className="absolute -bottom-2 -right-2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity text-muted-foreground">
                  <Briefcase size={80} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedAsset && (
        <div 
          onClick={() => setSelectedAsset(null)}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end justify-center p-4 transition-all"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="bg-card w-full max-w-md rounded-2xl border border-border/40 shadow-2xl p-8 overflow-y-auto flex flex-col relative"
          >
            <div className="w-16 h-1.5 bg-muted rounded-full mx-auto mb-10" />
            
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{selectedAsset.asset_type}</div>
                <h3 className="text-2xl font-black text-foreground leading-tight">
                  {selectedAsset.asset_name}
                </h3>
              </div>
              <button onClick={() => setSelectedAsset(null)} className="p-3 bg-muted/20 hover:bg-muted/40 rounded-xl text-muted-foreground transition-colors">
                <PlusCircle className="rotate-45" size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
               <div className="bg-muted/20 rounded-2xl p-6 border border-border/40 text-center">
                  <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-1">Buy Value</div>
                  <div className="text-lg font-black text-foreground"><Currency value={selectedAsset.purchase_price} /></div>
               </div>
               <div className="bg-emerald-500/10 rounded-2xl p-6 border border-emerald-500/20 text-center">
                  <div className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest mb-1">Current Value</div>
                  <div className="text-lg font-black text-emerald-500"><Currency value={selectedAsset.current_value} /></div>
               </div>
            </div>

            <div className="space-y-3 mb-8">
              <InfoRow label="Owner" value={selectedAsset.owner || 'Me'} icon={<TrendingUp size={14}/>} />
              <InfoRow label="Buy Date" value={selectedAsset.purchase_date ? format(new Date(selectedAsset.purchase_date), 'dd MMM yyyy') : 'Unknown'} icon={<CalendarDays size={14}/>} />
              <InfoRow label="Notes" value={selectedAsset.notes || 'No notes added'} icon={<Box size={14}/>} />
            </div>

            <button 
              className="w-full h-16 bg-primary text-primary-foreground rounded-xl font-black text-center flex items-center justify-center hover:bg-primary/95 transition-all shadow-xl shadow-primary/20"
              onClick={() => router.push(`/expenses/update-asset?id=${selectedAsset.id}`)}
            >
              Update Valuation
            </button>
          </div>
        </div>
      )}
      </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-4 px-6 rounded-xl bg-muted/20 text-sm border border-border/40">
      <span className="font-bold text-muted-foreground/60 uppercase text-[10px] tracking-widest flex items-center gap-2">
        {icon && <span className="text-muted-foreground/40">{icon}</span>}
        {label}
      </span>
      <span className="font-black text-foreground text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}
