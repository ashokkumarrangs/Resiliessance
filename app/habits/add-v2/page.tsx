"use client"
import { PageHeader } from "@/components/PageHeader";
import { BarChart2 } from "lucide-react";
import Link from "next/link";
export default function V2() {
  return (
    <div className="flex flex-col min-h-screen bg-background pb-32 font-dm-sans">
      <div className="max-w-6xl mx-auto w-full p-4 md:p-6">
        <PageHeader title="Option 2: Split-Pane Live Editor" >
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
      </div>
    </div>
  )
}
