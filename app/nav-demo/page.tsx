"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { LayoutDashboard, CalendarDays, ListTodo, BarChart3, Settings, Zap, Grid, Layers, Sparkles, Trash2, RotateCcw , BarChart2 } from "lucide-react";

export default function SubNavDemoPage() {
  const [activeTab, setActiveTab] = useState("Workspace");
  const [deletedBlocks, setDeletedBlocks] = useState<string[]>([]);

  const tabs = ["Workspace", "Weekly", "Today", "Analytics"];

  const iconMap: any = {
    "Workspace": <LayoutDashboard size={16} />,
    "Weekly": <CalendarDays size={16} />,
    "Today": <ListTodo size={16} />,
    "Analytics": <BarChart3 size={16} />
  };

  const NavBlock = ({ title, description, children }: any) => {
    if (deletedBlocks.includes(title)) return null;
    return (
      <div className="relative flex flex-col gap-4 p-6 bg-card border border-border/40 rounded-2xl shadow-sm group transition-all">
        <button 
          onClick={() => setDeletedBlocks([...deletedBlocks, title])}
          className="absolute top-4 right-4 p-2 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-all active:scale-95"
          title="Remove this style"
        >
          <Trash2 size={16} />
        </button>
        <div className="flex flex-col gap-1 mb-2 pr-10">
          <h3 className="text-lg font-black text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground/60 leading-relaxed">{description}</p>
        </div>
        <div className="w-full flex items-center justify-center p-8 bg-background/50 rounded-xl border border-dashed border-border/60">
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen pb-32 space-y-8 font-dm-sans">
      <PageHeader title="Sub-Nav Demo" >
        <div className="flex items-center gap-2">

          <Link 
            href="/reports" 
            className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-muted-foreground/60 hover:text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
            title="View Reports"
          >
            <BarChart2 className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Link>
        </div>
      </PageHeader>
      
      <div className="max-w-4xl mx-auto text-center space-y-3 mb-12 mt-4">
        <h1 className="text-3xl font-black tracking-tight text-primary">10 Pro Sub-Navigation Styles</h1>
        <p className="text-muted-foreground/70 text-sm">
          Click around to feel the interactions. Find the style that perfectly fits your app's DNA. 
          Hover over a block and click the trash icon to eliminate styles you don't like!
        </p>
        {deletedBlocks.length > 0 && (
          <button 
            onClick={() => setDeletedBlocks([])}
            className="inline-flex items-center gap-2 px-4 py-2 mt-4 bg-muted text-muted-foreground hover:text-foreground text-xs font-bold rounded-full transition-all active:scale-95"
          >
            <RotateCcw size={14} /> Restore Deleted Styles
          </button>
        )}
      </div>

      <div className="max-w-4xl mx-auto space-y-10">
        
        <NavBlock 
          title="0. The Original (Task Manager)" 
          description="The exact style currently used in your Task Manager page. Large, thick touch targets with internal icons."
        >
          <div className="flex bg-muted/40 p-1.5 rounded-xl border border-border/20 w-full max-w-md mx-auto">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex-1 min-w-[80px] h-14 rounded-lg font-black text-xs uppercase tracking-widest flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${ activeTab === t ? "bg-card text-primary shadow-sm border border-border/40" : "text-muted-foreground/60 hover:text-foreground" }`}
              >
                <div className={`${activeTab === t ? "text-primary" : "opacity-60"}`}>
                  {iconMap[t]}
                </div>
                <span className="text-[9px]">{t}</span>
              </button>
            ))}
          </div>
        </NavBlock>

        <NavBlock 
          title="1. The Apple Pill (Segmented Control)" 
          description="A hyper-clean, iOS-inspired segmented layout. Active states feel embedded and permanent."
        >
          <div className="flex items-center p-1 bg-muted/50 rounded-xl">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`relative px-5 py-2 text-sm font-bold rounded-lg transition-all ${ activeTab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground/60 hover:text-foreground" }`}
              >
                {t}
              </button>
            ))}
          </div>
        </NavBlock>

        <NavBlock 
          title="2. The Dynamic Island (Floating Glass)" 
          description="A detached, floating navigation bar with heavy glassmorphism. Perfect for keeping nav sticky at the top of long pages."
        >
          <div className="flex items-center gap-1 p-1.5 backdrop-blur-2xl bg-card/60 border border-border/50 rounded-full shadow-xl">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex items-center gap-2 px-6 py-2.5 text-sm font-black rounded-full transition-all ${ activeTab === t ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground/60 hover:bg-muted/50" }`}
              >
                {iconMap[t]}
                {t}
              </button>
            ))}
          </div>
        </NavBlock>

        <NavBlock 
          title="3. The Cyber Neon (Underline Glow)" 
          description="Minimalist text with a striking glowing underline. Excellent for data-heavy dashboard pages."
        >
          <div className="flex items-center gap-8 border-b border-border/40">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`relative pb-3 text-sm font-bold transition-all ${ activeTab === t ? "text-primary" : "text-muted-foreground/50 hover:text-foreground" }`}
              >
                {t}
                {activeTab === t && (
                  <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)] rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </NavBlock>

        <NavBlock 
          title="4. The Expanded Grid Cards" 
          description="Large touch targets that look like dashboard widgets. Great for mobile-first top navigation."
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${ activeTab === t ? "bg-primary/10 border-primary text-primary shadow-lg scale-[1.02]" : "bg-card border-border/40 text-muted-foreground hover:bg-muted/50" }`}
              >
                <div className={`p-2 rounded-full ${activeTab === t ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {iconMap[t]}
                </div>
                <span className="text-xs font-black uppercase tracking-wider">{t}</span>
              </button>
            ))}
          </div>
        </NavBlock>

        <NavBlock 
          title="5. The Classic Connected Folder" 
          description="Tabs physically connect to the content below them. A timeless mental model for complex applications."
        >
          <div className="flex items-end w-full max-w-md border-b border-border">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-5 py-2.5 text-sm font-bold border-t border-l border-r rounded-t-xl transition-all -mb-[1px] ${ activeTab === t ? "bg-background border-border text-foreground" : "bg-muted/30 border-transparent text-muted-foreground/60 hover:bg-muted/80" }`}
              >
                {t}
              </button>
            ))}
          </div>
        </NavBlock>

        <NavBlock 
          title="6. The Solid & Ghost" 
          description="A pure button approach. Active state is solid and heavy, inactive states are ghostly and lightweight."
        >
          <div className="flex items-center gap-2">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-black rounded-lg transition-all active:scale-95 ${ activeTab === t ? "bg-foreground text-background shadow-lg" : "bg-transparent text-muted-foreground hover:bg-muted" }`}
              >
                {t}
              </button>
            ))}
          </div>
        </NavBlock>

        <NavBlock 
          title="7. The Grouped Block (Stepped Layout)" 
          description="Buttons merged into a single block with internal dividers. Feels very structural and analytical."
        >
          <div className="flex items-center rounded-xl overflow-hidden border border-border/60 shadow-sm">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-6 py-2.5 text-sm font-bold border-r border-border/40 last:border-0 transition-all ${ activeTab === t ? "bg-accent/10 text-accent" : "bg-card text-muted-foreground hover:bg-muted/50" }`}
              >
                {t}
              </button>
            ))}
          </div>
        </NavBlock>

        <NavBlock 
          title="8. The FinTech Badge" 
          description="Tiny, rounded badges with aggressive glowing backgrounds on the active state. Common in crypto/banking apps."
        >
          <div className="flex items-center gap-2">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-full transition-all ${ activeTab === t ? "bg-gradient-to-r from-emerald-900/40 to-emerald-600/20 border border-emerald-500/30 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]" : "bg-transparent border border-transparent text-muted-foreground/50 hover:text-muted-foreground" }`}
              >
                {t}
              </button>
            ))}
          </div>
        </NavBlock>

        <NavBlock 
          title="9. The Minimalist Dot" 
          description="Incredibly stripped down. A small glowing dot indicates the active section. Maximum space efficiency."
        >
          <div className="flex items-center gap-8">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex flex-col items-center gap-1.5 transition-all ${ activeTab === t ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground" }`}
              >
                <div className={`p-3 rounded-2xl ${activeTab === t ? "bg-primary/10" : "bg-transparent"}`}>
                  {iconMap[t]}
                </div>
                <div className={`w-1.5 h-1.5 rounded-full transition-all ${ activeTab === t ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),1)] scale-100" : "bg-transparent scale-0" }`} />
              </button>
            ))}
          </div>
        </NavBlock>

        <NavBlock 
          title="10. The Sliding High-Contrast Marker" 
          description="A bold, brutalist-inspired thick marker that slides left to right. Assertive and unapologetic."
        >
          <div className="relative flex items-center gap-1 bg-muted/30 p-2 rounded-none border-b-4 border-muted">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`relative px-6 py-2 text-sm font-black transition-all z-10 ${ activeTab === t ? "text-foreground" : "text-muted-foreground/60 hover:text-muted-foreground" }`}
              >
                {t}
                {activeTab === t && (
                  <div className="absolute -bottom-[10px] left-0 right-0 h-[4px] bg-foreground shadow-lg" />
                )}
              </button>
            ))}
          </div>
        </NavBlock>

      </div>
    </div>
  );
}
