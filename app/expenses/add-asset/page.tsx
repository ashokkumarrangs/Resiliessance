"use client";
import { format } from 'date-fns';

import { Banknote, Box, CalendarDays, CheckCircle2, ListTodo, MapPin, StickyNote, Tag, Tags , BarChart2 } from "lucide-react";
import Link from "next/link";
import { SaveButton } from "@/components/ui/SaveButton";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/SearchableSelect";
import { PageHeader } from "@/components/PageHeader";
import { SectionNav } from "@/components/SectionNav";
import { EXPENSE_TABS } from "@/lib/navigation";
import { SubNav } from "@/components/SubNav";

export default function AddAssetPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    asset_name: "",
    purchase_price: "",
    current_value: "",
    purchase_date: format(new Date(), 'yyyy-MM-dd'),
    asset_type: "",
    category: "",
    subcategory: "",
    owner: "Me",
    place: "",
    notes: ""
  });

  const [options, setOptions] = useState({
    categories: [] as string[],
    subcategories: [] as string[],
    types: [] as string[],
    places: [] as string[]
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const { data } = await supabase.from('assets').select('category, subcategory, asset_type, place');
      if (data) {
        const unique = (key: string) => Array.from(new Set(data.map((h: any) => h[key]).filter(Boolean)));
        setOptions({
          categories: unique('category'),
          subcategories: unique('subcategory'),
          types: unique('asset_type'),
          places: unique('place')
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.asset_name || !formData.purchase_price) {
      toast.error("Name and Purchase Price are required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (!formData.current_value) formData.current_value = formData.purchase_price;
      const { error } = await supabase.from('assets').insert([formData]);
      if (error) throw error;
      toast.success("Asset added successfully");
      router.push("/expenses/view-assets");
    } catch (error: any) {
      toast.error(error.message || "Failed to add asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        <PageHeader title="Add New Asset"  >
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
          items={["View Assets", "Add Asset", "Update Values"]}
          activeItem="Add Asset"
          onChange={(val) => {
            if (val === "View Assets") router.push("/expenses/view-assets");
            if (val === "Update Values") router.push("/expenses/update-asset");
          }}
        />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full mt-6">
        <div className="bg-card rounded-2xl p-8 shadow-sm border border-border/40 space-y-7">
          
          <div className="grid grid-cols-2 gap-7">
            <div className="space-y-2">
              <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-2 leading-none">
                <Tag size={16} /> Asset Name
              </label>
              <input 
                type="text" 
                placeholder="e.g. Reliance Shares" 
                value={formData.asset_name}
                onChange={(e) => setFormData({...formData, asset_name: e.target.value})}
                className="w-full h-11 bg-muted border-none rounded-lg px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner transition-all placeholder:text-muted-foreground/30"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-2 leading-none">
                <Tags size={16} /> Asset ID
              </label>
              <input 
                type="text" 
                disabled 
                placeholder="Auto-ID" 
                className="w-full h-11 bg-muted border-none rounded-lg px-4 text-sm font-bold text-muted-foreground/30 cursor-not-allowed shadow-inner" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-7">
            <div className="space-y-2">
              <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-2 leading-none">
                <CalendarDays size={16} /> Purchase Date
              </label>
              <div className="relative group">
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                  className="w-full h-11 bg-muted border-none rounded-lg px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner transition-all appearance-none"
                  required
                />
                <CalendarDays size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none group-hover:text-accent transition-colors" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-2 leading-none">
                <Banknote size={16} /> Purchase Price
              </label>
              <div className="relative group">
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({...formData, purchase_price: e.target.value, current_value: formData.current_value || e.target.value})}
                  className="w-full h-11 bg-muted border-none rounded-lg px-4 text-sm font-black text-primary focus:ring-2 focus:ring-accent/20 shadow-inner transition-all placeholder:text-primary/30 font-mono"
                  required
                />
                <Banknote size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-7">
            <SearchableSelect 
              label="Category"
              headerIcon={<Tag size={16} />}
              value={formData.category}
              onChange={(val) => setFormData({...formData, category: val})}
              options={options.categories}
            />
            <SearchableSelect 
              label="Sub-Category"
              headerIcon={<ListTodo size={16} />}
              value={formData.subcategory}
              onChange={(val) => setFormData({...formData, subcategory: val})}
              options={options.subcategories}
            />
          </div>

          <div className="grid grid-cols-2 gap-7">
            <SearchableSelect 
              label="Asset Type"
              headerIcon={<Box size={16} />}
              value={formData.asset_type}
              onChange={(val) => setFormData({...formData, asset_type: val})}
              options={options.types}
            />
            <SearchableSelect 
              label="Place"
              headerIcon={<MapPin size={16} />}
              value={formData.place}
              onChange={(val) => setFormData({...formData, place: val})}
              options={options.places}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-2 leading-none">
              <StickyNote size={16} /> Notes
            </label>
            <input 
              type="text" 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full h-11 bg-muted border-none rounded-lg px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner transition-all placeholder:text-muted-foreground/30" 
              placeholder="Investment rationale or details..."
            />
          </div>

          <div className="flex justify-center pt-8">
            <SaveButton type="submit" isSaving={isSubmitting} disabled={isSubmitting} label="Save Asset" className="w-full max-w-xs h-12 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-muted" />
          </div>
        </div>
      </form>
      </div>
    </div>
  );
}
