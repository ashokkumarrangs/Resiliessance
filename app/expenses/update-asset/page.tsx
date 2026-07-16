"use client";
import { format } from 'date-fns';

import { Banknote, CalendarDays, CheckCircle2, Gem, StickyNote , BarChart2 } from "lucide-react";
import Link from "next/link";
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

function UpdateAssetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assetId = searchParams.get('id');

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    current_value: "",
    notes: ""
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    if (assetId && assets.length > 0) {
      const asset = assets.find(a => a.id === assetId);
      if (asset) handleAssetSelect(asset);
    }
  }, [assetId, assets]);

  const fetchAssets = async () => {
    const { data } = await supabase.from('assets').select('*').order('asset_name');
    if (data) setAssets(data);
  };

  const handleAssetSelect = (asset: any) => {
    setSelectedAsset(asset);
    setFormData(prev => ({
      ...prev,
      current_value: asset.current_value?.toString() || "",
      notes: asset.notes || ""
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !formData.current_value) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('assets')
        .update({ 
          current_value: parseFloat(formData.current_value),
          notes: formData.notes,
          last_updated_at: new Date().toISOString()
        })
        .eq('id', selectedAsset.id);
        
      if (error) throw error;
      toast.success("Value updated!");
      router.push('/expenses/view-assets');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        <PageHeader title="Update Values"  >
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
        <SubNav 
          items={["View Portfolio", "Add Asset", "Update Values"]}
          activeItem="Update Values"
          onChange={(val) => {
            if (val === "View Portfolio") router.push("/expenses/view-assets");
            if (val === "Add Asset") router.push("/expenses/add-asset");
          }}
        />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full mt-6">
        <div className="bg-card rounded-2xl p-8 shadow-sm border border-border/40 space-y-7">
          
          <div className="space-y-2">
            <SearchableSelect 
              label="Select Asset"
              headerIcon={<Gem size={16} />}
              value={selectedAsset?.asset_name || ""}
              onChange={(val) => {
                const asset = assets.find(a => a.asset_name === val);
                if (asset) handleAssetSelect(asset);
              }}
              options={assets.map(a => a.asset_name)}
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
                <Banknote size={16} /> Current Value
              </label>
              <div className="relative group">
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.current_value}
                  onChange={(e) => setFormData({...formData, current_value: e.target.value})}
                  className="w-full h-11 bg-muted border-none rounded-lg px-4 text-sm font-black text-primary focus:ring-2 focus:ring-accent/20 shadow-inner transition-all font-mono"
                  required
                />
                <Banknote size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30" />
              </div>
            </div>
          </div>

          {selectedAsset && (
            <div className="bg-muted/30 rounded-xl p-6 border border-border/40 space-y-4 shadow-inner">
               <div className="text-[10px] font-black uppercase tracking-[2px] text-primary/60 border-b border-border/40 pb-2 mb-2 flex items-center gap-2">
                 Reference Specs
               </div>
               <div className="grid grid-cols-2 gap-y-4">
                  <SpecItem label="Asset Type" value={selectedAsset.asset_type || '-'} />
                  <SpecItem label="Category" value={selectedAsset.category || '-'} />
                  <SpecItem label="Purchase Price" value={`₹${parseFloat(selectedAsset.purchase_price).toLocaleString()}`} />
                  <SpecItem label="Buy Date" value={selectedAsset.purchase_date || '-'} />
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
              placeholder="Market trends or update reason..."
            />
          </div>

          <div className="flex justify-center pt-8">
            <SaveButton type="submit" isSaving={isSubmitting} disabled={!selectedAsset} label="Update Asset Value" className="w-full max-w-xs h-12 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-muted" />
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

export default function UpdateAssetPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground font-black tracking-widest uppercase text-xs">Synchronizing...</div>}>
      <UpdateAssetContent />
    </Suspense>
  );
}
