"use client"
import { PageHeader } from "@/components/PageHeader";
import { BarChart2 } from "lucide-react";
import Link from "next/link";
export default function V5() {
  return (
    <div className="flex flex-col min-h-screen bg-background pb-32 font-dm-sans">
      <div className="max-w-3xl mx-auto w-full p-4 md:p-6">
        <PageHeader title="Option 5: Command Canvas" >
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
        <p className="text-muted-foreground mb-8">A Notion-style text editor block where you type out the rules naturally.</p>
        <div className="bg-card border border-border/40 p-8 rounded-2xl shadow-inner min-h-[400px]">
           <div className="flex items-center gap-2 text-xl font-medium text-foreground/80 leading-loose">
              I want to build a habit called 
              <input type="text" className="bg-muted/50 border-b-2 border-primary/40 outline-none w-48 px-2 py-1 mx-2 font-black text-foreground" placeholder="Habit Name" />
              which I will do 
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-md cursor-pointer mx-2 font-black text-sm">Every Day</span>
              with a target of
              <input type="number" className="bg-muted/50 border-b-2 border-primary/40 outline-none w-20 px-2 py-1 mx-2 font-black text-foreground text-center" placeholder="10" />
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-md cursor-pointer mx-2 font-black text-sm">Minutes</span>.
           </div>
           <div className="mt-8 text-sm text-muted-foreground">Type '/' to add advanced streak rules...</div>
        </div>
      </div>
    </div>
  )
}
