"use client"
import Link from "next/link";
import { PageWrapper } from "@/components/PageWrapper";
import { HABIT_TABS } from "@/lib/navigation";
export default function V4() {
  return (
    <PageWrapper
      title="Option 4: The Accordion"
      reportHref="/reports/habits"
      sectionTabs={HABIT_TABS}
    >
        
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
      
    </PageWrapper>
  )
}
