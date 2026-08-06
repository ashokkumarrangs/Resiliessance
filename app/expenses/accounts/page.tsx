"use client";
import { Select } from "@/components/Select";

import { Banknote, ChevronDown, CreditCard, FileText, Landmark, Settings2, StickyNote, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { SaveButton } from "@/components/ui/SaveButton";
import { SearchableSelect } from "@/components/SearchableSelect";
import { PageWrapper } from "@/components/PageWrapper";
import { EXPENSE_TABS } from "@/lib/navigation";
import { SubNav } from "@/components/SubNav";

function AccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialName = searchParams.get('name');

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [accountTypes, setAccountTypes] = useState<string[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<any>({
    id: null,
    account_name: "",
    type: "Savings",
    balance: "",
    account_no: "",
    card_no: "",
    card_pin: "",
    nb_user: "",
    nb_pass: "",
    nb_txn: "",
    mb_pass: "",
    mb_mpin: "",
    mb_txn: "",
    notes: ""
  });

  useEffect(() => {
    fetchAccounts();
    if (initialName) {
      handleAccountSelect(initialName);
    }
  }, [initialName]);

  async function fetchAccounts() {
    const { data } = await supabase.from('liquidity').select('account_name, type');
    if (data) {
      setAccounts(data.map(a => a.account_name));
      const types = Array.from(new Set(data.map(a => a.type).filter(Boolean))) as string[];
      setAccountTypes(types);
    }
  }

  async function handleAccountSelect(name: string) {
    if (!name) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('liquidity')
        .select('*')
        .eq('account_name', name)
        .single();
      
      if (error) throw error;
      if (data) {
        setFormData({
          id: data.id,
          account_name: data.account_name,
          type: data.type || "Savings",
          balance: data.balance?.toString() || "0",
          account_no: data.account_no || "",
          card_no: data.card_no || "",
          card_pin: data.card_pin || "",
          nb_user: data.nb_user || "",
          nb_pass: data.nb_pass || "",
          nb_txn: data.nb_txn || "",
          mb_pass: data.mb_pass || "",
          mb_mpin: data.mb_mpin || "",
          mb_txn: data.mb_txn || "",
          notes: data.notes || ""
        });
      }
    } catch (error: any) {
      console.error("Error loading account:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_name) {
      toast.error("Account name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        balance: parseFloat(formData.balance) || 0
      };

      const { id, ...updatePayload } = payload;

      let error;
      if (id) {
        const res = await supabase.from('liquidity').update(updatePayload).eq('id', id);
        error = res.error;
      } else {
        const res = await supabase.from('liquidity').insert([updatePayload]);
        error = res.error;
      }
      
      if (error) throw error;

      toast.success("Account updated successfully");
      router.push("/expenses/liquidity");
    } catch (error: any) {
      toast.error(error.message || "Failed to save account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!formData.account_name) return;
    if (!confirm("Are you sure you want to delete this account?")) return;

    try {
      const { error } = await supabase.from('liquidity').delete().eq('account_name', formData.account_name);
      if (error) throw error;
      toast.success("Account deleted");
      router.push("/expenses/liquidity");
    } catch (error: any) {
      toast.error("Failed to delete account");
    }
  };

  return (
    <PageWrapper
      title="Manage Accounts"
      reportHref="/reports/finance"
      sectionTabs={EXPENSE_TABS}
      activePath="/expenses/liquidity"
    >
        <SubNav 
          items={["Overview", "Manage Accounts"]}
          activeItem="Manage Accounts"
          onChange={(val) => {
            if (val === "Overview") router.push("/expenses/liquidity");
          }}
        />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full mt-6">
        <div className="bg-card rounded-2xl p-8 shadow-sm border border-border/40 space-y-7">
          
          <div className="grid grid-cols-2 gap-7 relative z-50">
            <SearchableSelect 
              label="Select Account"
              headerIcon={<Landmark size={16} />}
              value={formData.account_name}
              onChange={(val) => handleAccountSelect(val)}
              options={accounts}
            />
            <div className="space-y-2">
              <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-2 leading-none">
                <FileText size={16} /> Account Name
              </label>
              <input 
                type="text" 
                placeholder="Custom Label" 
                value={formData.account_name}
                onChange={(e) => setFormData({...formData, account_name: e.target.value})}
                className="w-full h-11 bg-muted border-none rounded-lg px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner transition-all placeholder:text-muted-foreground/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-7 relative z-40">
            <div className="space-y-2">
              <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-2 leading-none">
                <Banknote size={16} /> Current Balance
              </label>
              <div className="relative group">
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({...formData, balance: e.target.value})}
                  className="w-full h-11 bg-muted border-none rounded-lg px-4 text-sm font-black text-primary focus:ring-2 focus:ring-accent/20 shadow-inner transition-all font-mono"
                />
                <Banknote size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30" />
              </div>
            </div>
            <SearchableSelect 
              label="Account Type"
              headerIcon={<Settings2 size={16} />}
              value={formData.type}
              onChange={(val) => setFormData({...formData, type: val})}
              options={accountTypes}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-2 leading-none">
              <CreditCard size={16} /> Account Number
            </label>
            <input 
              type="text" 
              value={formData.account_no}
              onChange={(e) => setFormData({...formData, account_no: e.target.value})}
              className="w-full h-11 bg-muted border-none rounded-lg px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner tracking-widest placeholder:text-muted-foreground/30"
              placeholder="XXXX XXXX XXXX XXXX"
            />
          </div>

          <div className="border-t border-border/40 pt-6 space-y-4">
            <div className="text-[10px] font-black uppercase tracking-[3px] text-accent/60 mb-2">Vault & Credentials</div>
            <div className="grid grid-cols-2 gap-7 relative z-30">
              <div className="space-y-2">
                <span className="text-[9px] font-black text-muted-foreground uppercase ml-1">Card Serial</span>
                <input 
                  type="text" 
                  placeholder="Card No"
                  value={formData.card_no}
                  onChange={(e) => setFormData({...formData, card_no: e.target.value})}
                  className="w-full h-11 bg-muted border-none rounded-lg px-4 text-xs font-bold text-foreground shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <span className="text-[9px] font-black text-muted-foreground uppercase ml-1">Security PIN</span>
                <input 
                  type="password" 
                  placeholder="PIN"
                  value={formData.card_pin}
                  onChange={(e) => setFormData({...formData, card_pin: e.target.value})}
                  className="w-full h-11 bg-muted border-none rounded-lg px-4 text-xs font-bold text-foreground shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <span className="text-[9px] font-black text-muted-foreground uppercase ml-1">NetBanking User</span>
                <input 
                  type="text" 
                  placeholder="Username"
                  value={formData.nb_user}
                  onChange={(e) => setFormData({...formData, nb_user: e.target.value})}
                  className="w-full h-11 bg-muted border-none rounded-lg px-4 text-xs font-bold text-foreground shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <span className="text-[9px] font-black text-muted-foreground uppercase ml-1">NetBanking Pass</span>
                <input 
                  type="password" 
                  placeholder="Password"
                  value={formData.nb_pass}
                  onChange={(e) => setFormData({...formData, nb_pass: e.target.value})}
                  className="w-full h-11 bg-muted border-none rounded-lg px-4 text-xs font-bold text-foreground shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <span className="text-[9px] font-black text-muted-foreground uppercase ml-1">Mobile App Pass</span>
                <input 
                  type="password" 
                  placeholder="App Pass"
                  value={formData.mb_pass}
                  onChange={(e) => setFormData({...formData, mb_pass: e.target.value})}
                  className="w-full h-11 bg-muted border-none rounded-lg px-4 text-xs font-bold text-foreground shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <span className="text-[9px] font-black text-muted-foreground uppercase ml-1">Mobile MPIN</span>
                <input 
                  type="password" 
                  placeholder="MPIN"
                  value={formData.mb_mpin}
                  onChange={(e) => setFormData({...formData, mb_mpin: e.target.value})}
                  className="w-full h-11 bg-muted border-none rounded-lg px-4 text-xs font-bold text-foreground shadow-inner"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-2 leading-none">
              <StickyNote size={16} /> Executive Notes
            </label>
            <input 
              type="text" 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full h-11 bg-muted border-none rounded-lg px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner transition-all placeholder:text-muted-foreground/30" 
              placeholder="Record any account specifics here..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={handleDelete}
              className="w-14 h-12 bg-destructive/5 text-destructive rounded-xl flex items-center justify-center hover:bg-destructive/10 transition-all active:scale-95 border border-destructive/10"
            >
              <Trash2 size={20} />
            </button>

            <div className="flex justify-center pt-8 flex-1">
            <SaveButton type="submit" isSaving={isSubmitting} disabled={isSubmitting} label={formData.id ? "Update Account" : "Save Account"} className="w-full max-w-xs h-12 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-muted" />
          </div>
          </div>
        </div>
      </form>
      </PageWrapper>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground font-black tracking-widest uppercase text-xs">Synchronizing...</div>}>
      <AccountPageContent />
    </Suspense>
  );
}
