"use client"
import Link from "next/link";
import { PageWrapper } from "@/components/PageWrapper";
import { HABIT_TABS } from "@/lib/navigation";
export default function V2() {
  return (
    <PageWrapper
      title="Option 2: Split-Pane Live Editor"
      reportHref="/reports/habits"
      sectionTabs={HABIT_TABS}
    >
        
        <p className="text-muted-foreground mb-8">Scroll the form on the left, see the Live Habit Card update on the right.</p>
        <div className="flex gap-12">
           <div className="w-1/2 space-y-12">
              <div className="bg-card border border-border/40 p-8 rounded-2xl shadow-sm h-[400px]">
                 <h3 className="text-xl font-black mb-4">Input Section 1</h3>
                 <div className="w-full h-12 bg-muted/50 rounded-md"></div>
              </div>
              <div className="bg-card border border-border/40 p-8 rounded-2xl shadow-sm h-[400px]">
                 <h3 className="text-xl font-black mb-4">Input Section 2</h3>
              </div>
           </div>
           <div className="w-1/2 relative">
              <div className="sticky top-12 bg-accent/10 border-4 border-background p-8 rounded-3xl shadow-zenith h-[300px] flex items-center justify-center">
                 <h2 className="text-3xl font-black text-foreground">Live Preview Card</h2>
              </div>
           </div>
        </div>
      
    </PageWrapper>
  )
}
