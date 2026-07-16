"use client"
import { PageHeader } from "@/components/PageHeader";
import { BarChart2 } from "lucide-react";
import Link from "next/link";
export default function V4() {
  return (
    <div className="flex flex-col min-h-screen bg-background pb-32 font-dm-sans">
      <div className="max-w-2xl mx-auto w-full p-4 md:p-6">
        <PageHeader title="Option 4: The Accordion" >
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
        <p className="text-muted-foreground mb-8">A highly condensed vertical list. Click a header to expand its settings.</p>
        <div className="space-y-4">
           <div className="bg-card border border-border/40 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-primary/5 p-6 flex justify-between items-center cursor-pointer border-b border-border/40">
                 <h3 className="text-xl font-black">1. Core Identity</h3>
                 <span className="text-primary font-black">-</span>
              </div>
              <div className="p-6 h-[200px]">
                 Expanded content here...
              </div>
           </div>
           <div className="bg-muted/30 border border-transparent rounded-2xl shadow-sm overflow-hidden opacity-60">
              <div className="p-6 flex justify-between items-center cursor-pointer">
                 <h3 className="text-xl font-black">2. Schedule</h3>
                 <span className="text-muted-foreground font-black">+</span>
              </div>
           </div>
           <div className="bg-muted/30 border border-transparent rounded-2xl shadow-sm overflow-hidden opacity-60">
              <div className="p-6 flex justify-between items-center cursor-pointer">
                 <h3 className="text-xl font-black">3. Targeting</h3>
                 <span className="text-muted-foreground font-black">+</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
