"use client";

import { Eye, Landmark, Pencil, Plus, RefreshCw , BarChart2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Currency } from "@/components/currency";
import { PageHeader } from "@/components/PageHeader";
import { SectionNav } from "@/components/SectionNav";
import { EXPENSE_TABS } from "@/lib/navigation";
import { SubNav } from "@/components/SubNav";

interface Account {
  account_name: string;
  balance: string;
  type: string;
  account_no?: string;
  card_no?: string;
  nb_user?: string;
  last_confirmed_at?: string;
}

export default function LiquidityPage() {
  const router = useRouter();
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('liquidity')
        .select('*')
        .order('balance', { ascending: false });
      
      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalBalance = accounts.reduce((s, a) => s + (parseFloat(a.balance) || 0), 0);
  const avgBalance = accounts.length > 0 ? totalBalance / accounts.length : 0;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        <PageHeader title="Liquidity"  >
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchAccounts}
            className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-muted-foreground/60 hover:text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 md:w-[18px] md:h-[18px] ${isLoading ? "animate-spin" : ""}`} />
          </button>
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
          <SectionNav tabs={EXPENSE_TABS} activePath="/expenses/liquidity" />
        </div>
        <div className="flex items-center justify-center relative mb-6 w-full">
          <SubNav 
            items={["Overview", "Manage Accounts"]}
            activeItem="Overview"
            onChange={(val) => {
              if (val === "Manage Accounts") router.push("/expenses/accounts");
            }}
            className="!mb-0 !mx-0"
          />
        </div>


        <div className="space-y-8 w-full">

      <div className="grid grid-cols-3 gap-2 md:gap-3 mb-8">
        <div className="bg-card rounded-2xl p-3 md:p-5 shadow-sm border border-border/40 text-center overflow-hidden flex flex-col justify-center min-w-0">
          <div className="text-[9px] md:text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest mb-1.5 truncate">Accounts</div>
          <div className="text-sm sm:text-xl font-black text-primary truncate">{accounts.length}</div>
        </div>
        <div className="bg-card rounded-2xl p-3 md:p-5 shadow-sm border border-border/40 text-center overflow-hidden flex flex-col justify-center min-w-0">
          <div className="text-[9px] md:text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest mb-1.5 truncate">Total</div>
          <div className="text-sm sm:text-xl font-black text-emerald-500 truncate"><Currency value={totalBalance} /></div>
        </div>
        <div className="bg-card rounded-2xl p-3 md:p-5 shadow-sm border border-border/40 text-center overflow-hidden flex flex-col justify-center min-w-0">
          <div className="text-[9px] md:text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest mb-1.5 truncate">Avg</div>
          <div className="text-sm sm:text-xl font-black text-foreground truncate"><Currency value={avgBalance} /></div>
        </div>
      </div>


      <div className="grid grid-cols-2 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-card rounded-2xl animate-pulse border border-border/40" />
          ))
        ) : (
          <>
            {accounts.map((acc, i) => (
              <div
                key={i}
                onClick={() => setSelectedAccount(acc)}
                className="bg-card rounded-2xl p-6 shadow-sm border border-border/40 text-center cursor-pointer hover:-translate-y-1 transition-all flex flex-col justify-between items-center group relative overflow-hidden"
              >
                {/* Edit icon for directly editing this account */}
                <Link
                  href={`/expenses/accounts?name=${encodeURIComponent(acc.account_name)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-3 right-3 p-1.5 bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-primary rounded-lg transition-colors cursor-pointer z-10"
                  title="Edit Account"
                >
                  <Pencil size={12} />
                </Link>

                <div className="text-[9px] font-black text-primary-foreground bg-primary px-3 py-1.5 rounded-lg mb-4 uppercase tracking-widest">
                  {acc.type || 'Savings'}
                </div>
                <h3 className="text-sm font-black text-foreground mb-3 leading-tight truncate w-full px-2">
                  {acc.account_name}
                </h3>
                <div className="text-lg font-black text-primary">
                  <Currency value={acc.balance} />
                </div>
                {/* Decorative background element */}
                <div className="absolute -bottom-2 -right-2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity text-muted-foreground">
                  <Landmark size={80} />
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Detail Overlay */}
      {selectedAccount && (
        <div 
          onClick={() => setSelectedAccount(null)}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end justify-center p-4 transition-all"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="bg-card w-full max-w-md rounded-2xl border border-border/40 shadow-2xl p-8 overflow-y-auto flex flex-col relative"
          >
            <div className="w-16 h-1.5 bg-muted rounded-full mx-auto mb-10" />
            
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{selectedAccount.type}</div>
                <h3 className="text-2xl font-black text-foreground leading-tight">
                  {selectedAccount.account_name}
                </h3>
              </div>
              <button onClick={() => setSelectedAccount(null)} className="p-3 bg-muted/20 hover:bg-muted/40 rounded-xl text-muted-foreground transition-colors">
                <Plus className="rotate-45" size={20} />
              </button>
            </div>

            <div className="space-y-3 mb-8">
              <div className="p-6 rounded-2xl bg-muted/20 border border-border/40">
                <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-2">Available Balance</div>
                <div className="text-3xl font-black text-primary"><Currency value={selectedAccount.balance} /></div>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <InfoRow label="Account Number" value={selectedAccount.account_no || 'Not set'} />
                <SecretRow label="Card Number" value={selectedAccount.card_no || 'Not set'} />
                <SecretRow label="Net Banking ID" value={selectedAccount.nb_user || 'Not set'} />
              </div>
            </div>

            <Link 
              href={`/expenses/accounts?name=${encodeURIComponent(selectedAccount.account_name)}`}
              className="w-full h-16 bg-primary text-primary-foreground rounded-xl font-black text-center flex items-center justify-center hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
            >
              Edit Account Details
            </Link>
          </div>
        </div>
      )}
      </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-4 px-6 rounded-xl bg-muted/20 text-sm border border-border/40">
      <span className="font-bold text-muted-foreground/60 uppercase text-[10px] tracking-widest">{label}</span>
      <span className="font-black text-foreground">{value}</span>
    </div>
  );
}

function SecretRow({ label, value }: { label: string; value: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex justify-between items-center py-4 px-6 rounded-xl bg-muted/20 text-sm border border-border/40">
      <span className="font-bold text-muted-foreground/60 uppercase text-[10px] tracking-widest">{label}</span>
      <div className="flex items-center gap-4">
        <span className={`font-black tracking-tight ${show ? 'text-foreground' : 'text-muted-foreground/30'}`}>
          {show ? value : '•••• •••• ••••'}
        </span>
        <button 
          onClick={() => { setShow(true); setTimeout(() => setShow(false), 5000) }}
          className="p-1.5 text-primary hover:text-primary/80 transition-colors"
        >
          <Eye size={16} />
        </button>
      </div>
    </div>
  );
}
