"use client"
import { PageHeader } from "@/components/PageHeader";
export default function V3() {
  return (
    <div className="flex flex-col min-h-screen bg-background pb-32 font-dm-sans">
      <div className="max-w-3xl mx-auto w-full p-4 md:p-6 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="text-[12px] font-black uppercase tracking-widest text-primary mb-4">Step 1 of 4</div>
        <h1 className="text-5xl font-black text-foreground text-center mb-12">What habit are you building today?</h1>
        <input type="text" placeholder="e.g. Read 10 Pages..." className="w-full bg-transparent border-b-4 border-muted focus:border-primary outline-none text-4xl font-bold text-center pb-4 transition-colors" />
        <button className="mt-12 px-8 py-4 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-full hover:scale-105 transition-transform">Press Enter →</button>
      </div>
    </div>
  )
}
