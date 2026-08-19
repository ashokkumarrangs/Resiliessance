import React from 'react';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import { Currency } from '@/components/currency';

interface FinancialSummaryPanelProps {
  isLoading: boolean;
  netWorth: number;
  liquidity: number;
  assetsTotal: number;
  receivablesTotal: number;
  liabilitiesTotal: number;
  budgetActual: number;
  budgetPlanned: number;
}

export function FinancialSummaryPanel({
  isLoading,
  netWorth,
  liquidity,
  assetsTotal,
  receivablesTotal,
  liabilitiesTotal,
  budgetActual,
  budgetPlanned,
}: FinancialSummaryPanelProps) {
  return (
    <Link href="/finance/net-worth" className="block group">
      <div className="bg-card rounded-md border border-border/40 shadow-zenith p-6 transition-all group-hover:scale-[1.01]">
        {/* Top Section: Net Worth Hero */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest mb-1">Net Worth</div>
            <div className={`text-[36px] font-black leading-none tracking-tighter ${netWorth < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {isLoading ? "..." : <Currency value={netWorth} />}
            </div>
          </div>
          <div className="p-2 bg-emerald-500/10 rounded-md">
            <TrendingUp size={20} className="text-emerald-500" />
          </div>
        </div>

        {/* Grid Section: Core Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div>
            <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-wider mb-1">Liquidity</div>
            <div className="text-[14px] font-black text-foreground">
              {isLoading ? "..." : <Currency value={liquidity} />}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-wider mb-1">Assets</div>
            <div className="text-[14px] font-black text-foreground">
              {isLoading ? "..." : <Currency value={assetsTotal} />}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-wider mb-1">Receivables</div>
            <div className="text-[14px] font-black text-emerald-500">
              {isLoading ? "..." : <Currency value={receivablesTotal} />}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-wider mb-1">Liabilities</div>
            <div className="text-[14px] font-black text-foreground">
              {isLoading ? "..." : <Currency value={liabilitiesTotal} />}
            </div>
          </div>
        </div>

        {/* Bottom Section: Budget Pulse */}
        <div className="pt-5 border-t border-border/40">
          <div className="flex justify-between items-center mb-2">
            <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-wider">Budget Pulse</div>
            <div className="text-[10px] font-black text-foreground flex items-center gap-1">
              {isLoading ? "..." : <Currency value={budgetActual} />} 
              <span className="text-muted-foreground/30">/</span> 
              {isLoading ? "..." : <Currency value={budgetPlanned} />}
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden relative">
            <div 
              className={`absolute top-0 left-0 h-full transition-all ${ budgetActual > budgetPlanned ? 'bg-rose-500' : (budgetActual / budgetPlanned) > 0.8 ? 'bg-amber-500' : 'bg-emerald-500' }`}
              style={{ width: budgetActual > 0 && budgetPlanned === 0 ? '100%' : budgetPlanned > 0 ? `${Math.min((budgetActual / budgetPlanned) * 100, 100)}%` : '0%' }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
