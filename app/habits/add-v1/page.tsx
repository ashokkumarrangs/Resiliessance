"use client"
import { PageHeader } from "@/components/PageHeader";
import { BarChart2 } from "lucide-react";
import Link from "next/link";
export default function V1() {
  return (
    <div className="flex flex-col min-h-screen bg-background pb-32 font-dm-sans">
      <div className="max-w-4xl mx-auto w-full p-4 md:p-6">
        <PageHeader title="Option 1: The Bento Box" >
        <div className="flex items-center gap-2">

          <Link 
            href="/reports/habits" 
            className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-muted-foreground/60 hover:text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
            title="View Reports"
          >
            <BarChart2 className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Link>
        </div>
      </PageHeader>
        <p className="text-muted-foreground mb-8">A dashboard of cards. Click a card to edit that section.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border/40 p-6 rounded-2xl shadow-sm hover:border-primary/50 transition-colors cursor-pointer min-h-[200px]">
             <h3 className="text-xl font-black mb-2">1. Identity</h3>
             <p className="text-muted-foreground/60">Name, Icon, Category</p>
          </div>
          <div className="bg-card border border-border/40 p-6 rounded-2xl shadow-sm hover:border-primary/50 transition-colors cursor-pointer min-h-[200px]">
             <h3 className="text-xl font-black mb-2">2. Rhythm</h3>
             <p className="text-muted-foreground/60">Daily, Weekly, Events</p>
          </div>
          <div className="bg-card border border-border/40 p-6 rounded-2xl shadow-sm hover:border-primary/50 transition-colors cursor-pointer min-h-[200px]">
             <h3 className="text-xl font-black mb-2">3. Targets</h3>
             <p className="text-muted-foreground/60">Exact, Range, Boolean</p>
          </div>
          <div className="bg-card border border-border/40 p-6 rounded-2xl shadow-sm hover:border-primary/50 transition-colors cursor-pointer min-h-[200px]">
             <h3 className="text-xl font-black mb-2">4. Streaks</h3>
             <p className="text-muted-foreground/60">Grace, Escalation</p>
          </div>
        </div>
      </div>
    </div>
  )
}
