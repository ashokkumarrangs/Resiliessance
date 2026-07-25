"use client"
import Link from "next/link";
import { PageWrapper } from "@/components/PageWrapper";
import { HABIT_TABS } from "@/lib/navigation";
export default function V1() {
  return (
    <PageWrapper
      title="Option 1: The Bento Box"
      reportHref="/reports/habits"
      sectionTabs={HABIT_TABS}
    >
        
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
      
    </PageWrapper>
  )
}
