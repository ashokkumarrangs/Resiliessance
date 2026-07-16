"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { SectionNav } from "@/components/SectionNav";
import { EXPENSE_TABS, HABIT_TABS, VEHICLE_TABS } from "@/lib/navigation";
import { Folder , BarChart2 } from "lucide-react";

export default function SubNavStylesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background pb-32 font-dm-sans">
      <div className="max-w-xl mx-auto w-full p-4 md:p-6">
        <PageHeader title="SubNav Styles Playground"  >
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
        <p className="text-sm text-muted-foreground mb-8">
          Review these 10 concepts for the Level 2 "Sub Navigation". Each is shown directly beneath a Level 1 `SectionNav` so you can see how they look together in the real app.
        </p>

        <div className="space-y-16">
          
          {/* 1. The Classic Pill */}
          <Section title="1. Minimalist Pill" tabs={EXPENSE_TABS} activeTab="/expenses/daily-entry">
            <Nav1 items={["Expense", "Income", "Transfer"]} />
          </Section>

          {/* 2. iOS Segmented Control */}
          <Section title="2. iOS Segmented Control" tabs={HABIT_TABS} activeTab="/habits/manage">
            <Nav2 items={["Active Habits", "Archived Habits"]} />
          </Section>

          {/* 3. Underline Accent */}
          <Section title="3. Sleek Underline" tabs={HABIT_TABS} activeTab="/habits/view">
            <Nav3 items={["Today's Score", "Weekly Matrix", "Monthly Matrix"]} />
          </Section>

          {/* 4. High Contrast Outline */}
          <Section title="4. Outline Pill" tabs={VEHICLE_TABS} activeTab="/vehicles/fuel">
            <Nav4 items={["My Car", "Wife's Car", "Bike", "+ Add"]} />
          </Section>

          {/* 5. Neumorphic Soft */}
          <Section title="5. Neumorphic Soft" tabs={EXPENSE_TABS} activeTab="/expenses/daily-entry">
            <Nav5 items={["Expense", "Income", "Transfer"]} />
          </Section>

          {/* 6. Dot Indicator */}
          <Section title="6. Minimal Dot" tabs={HABIT_TABS} activeTab="/habits/view">
            <Nav6 items={["Today", "Weekly", "Trends"]} />
          </Section>

          {/* 7. Glassmorphism */}
          <Section title="7. Frosted Glass" tabs={VEHICLE_TABS} activeTab="/vehicles/fuel-service">
            <Nav7 items={["Log Fuel", "Fuel History"]} />
          </Section>

          {/* 8. Block / Card Style */}
          <Section title="8. High Contrast Card" tabs={HABIT_TABS} activeTab="/habits/manage">
            <Nav8 items={["Active", "Archived"]} />
          </Section>

          {/* 9. Glowing Gradient */}
          <Section title="9. Gradient Glow" tabs={EXPENSE_TABS} activeTab="/expenses/daily-entry">
            <Nav9 items={["Expense", "Income", "Transfer"]} />
          </Section>

          {/* 10. Floating Bubble */}
          <Section title="10. Floating Bubble" tabs={VEHICLE_TABS} activeTab="/vehicles/fuel">
            <Nav10 items={["My Car", "Wife's Car", "Bike"]} />
          </Section>

        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// REUSABLE WRAPPER
// ---------------------------------------------------------
function Section({ title, tabs, activeTab, children }: { title: string; tabs: any; activeTab: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black text-foreground/80 uppercase tracking-widest pl-2">{title}</h3>
      <div className="bg-card border border-border/40 rounded-2xl shadow-sm overflow-hidden flex flex-col pb-6">
        {/* Mocking the real page structure: SectionNav on top, SubNav directly below */}
        <div className="p-4 md:p-6 pb-2 border-b border-border/20">
          <SectionNav tabs={tabs} activePath={activeTab} />
        </div>
        
        {/* The SubNav Area */}
        <div className="px-4 md:px-6 pt-4 w-full overflow-x-auto hide-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// STYLES
// ---------------------------------------------------------

function Nav1({ items }: { items: string[] }) {
  const [active, setActive] = useState(items[0]);
  return (
    <div className="flex items-center gap-1 w-max">
      {items.map(tab => (
        <button
          key={tab}
          onClick={() => setActive(tab)}
          className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${ active === tab ? "bg-foreground text-background shadow-md scale-105" : "text-muted-foreground hover:bg-muted" }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function Nav2({ items }: { items: string[] }) {
  const [active, setActive] = useState(items[0]);
  return (
    <div className="flex items-center bg-muted/80 p-1 rounded-lg w-full max-w-sm shrink-0">
      {items.map(tab => (
        <button
          key={tab}
          onClick={() => setActive(tab)}
          className={`flex-1 py-1.5 px-3 text-xs font-black transition-all rounded-md ${ active === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground/80" }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function Nav3({ items }: { items: string[] }) {
  const [active, setActive] = useState(items[0]);
  return (
    <div className="flex items-center gap-6 border-b border-border/40 w-max">
      {items.map(tab => (
        <button
          key={tab}
          onClick={() => setActive(tab)}
          className={`pb-2 text-xs font-black relative transition-colors ${ active === tab ? "text-primary" : "text-muted-foreground hover:text-foreground" }`}
        >
          {tab}
          {active === tab && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(var(--primary),0.5)]" />
          )}
        </button>
      ))}
    </div>
  );
}

function Nav4({ items }: { items: string[] }) {
  const [active, setActive] = useState(items[0]);
  return (
    <div className="flex items-center gap-2 w-max">
      {items.map(tab => (
        <button
          key={tab}
          onClick={() => setActive(tab)}
          className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all border ${ active === tab ? "border-accent text-accent bg-accent/5 shadow-sm" : "border-border/40 text-muted-foreground hover:border-foreground/20" }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function Nav5({ items }: { items: string[] }) {
  const [active, setActive] = useState(items[0]);
  return (
    <div className="flex items-center gap-3 w-max">
      {items.map(tab => (
        <button
          key={tab}
          onClick={() => setActive(tab)}
          className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${ active === tab ? "shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2),inset_-2px_-2px_5px_rgba(255,255,255,0.05)] bg-background text-primary" : "shadow-[2px_2px_5px_rgba(0,0,0,0.2),-2px_-2px_5px_rgba(255,255,255,0.02)] bg-card text-muted-foreground" }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function Nav6({ items }: { items: string[] }) {
  const [active, setActive] = useState(items[0]);
  return (
    <div className="flex items-center gap-6 w-max">
      {items.map(tab => (
        <button
          key={tab}
          onClick={() => setActive(tab)}
          className={`text-xs font-black flex items-center gap-1.5 transition-all ${ active === tab ? "text-foreground" : "text-muted-foreground opacity-50 hover:opacity-100" }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full transition-all ${active === tab ? "bg-emerald-500 scale-100" : "bg-transparent scale-0"}`} />
          {tab}
        </button>
      ))}
    </div>
  );
}

function Nav7({ items }: { items: string[] }) {
  const [active, setActive] = useState(items[0]);
  return (
    <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-emerald-500/10 backdrop-blur-xl border border-white/10 w-max">
      {items.map(tab => (
        <button
          key={tab}
          onClick={() => setActive(tab)}
          className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${ active === tab ? "bg-white/20 text-white shadow-lg backdrop-blur-md" : "text-foreground/50 hover:text-foreground/80 hover:bg-white/5" }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function Nav8({ items }: { items: string[] }) {
  const [active, setActive] = useState(items[0]);
  return (
    <div className="flex items-center gap-0 w-max rounded-lg overflow-hidden border border-border/50 shadow-sm shrink-0">
      {items.map(tab => (
        <button
          key={tab}
          onClick={() => setActive(tab)}
          className={`px-5 py-2 text-xs font-black transition-all border-r border-border/50 last:border-r-0 ${ active === tab ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-background hover:text-foreground" }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function Nav9({ items }: { items: string[] }) {
  const [active, setActive] = useState(items[0]);
  return (
    <div className="flex items-center gap-4 w-max">
      {items.map(tab => (
        <button
          key={tab}
          onClick={() => setActive(tab)}
          className={`relative px-4 py-1.5 text-xs font-black transition-all group overflow-hidden rounded-md ${ active === tab ? "text-white" : "text-muted-foreground hover:text-foreground" }`}
        >
          {active === tab && (
            <div className="absolute inset-0 bg-gradient-to-r from-accent to-purple-600 opacity-90 rounded-md -z-10" />
          )}
          {tab}
        </button>
      ))}
    </div>
  );
}

function Nav10({ items }: { items: string[] }) {
  const [active, setActive] = useState(items[0]);
  return (
    <div className="flex items-center gap-6 pt-2 w-max">
      {items.map(tab => (
        <button
          key={tab}
          onClick={() => setActive(tab)}
          className={`relative text-xs font-black transition-all ${ active === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground/70" }`}
        >
          {active === tab && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full animate-bounce shadow-[0_0_8px_rgba(var(--accent),0.8)]" />
          )}
          {tab}
        </button>
      ))}
    </div>
  );
}
