"use client";

import React, { useState } from "react";
import {
  Activity,
  CheckCircle2,
  PlusCircle,
  Wallet,
  Dog,
  ChevronLeft,
  Calendar,
  Layers,
  Sparkles
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

// Mock logs matching user's exact examples
const mockEvents = [
  {
    time: "6:00 AM",
    title: "Woke up",
    type: "Habits",
    value: "6am",
    icon: <CheckCircle2 size={14} />,
    colorClass: "bg-emerald-500 text-white",
    borderColor: "border-emerald-500/20",
    textColor: "text-emerald-500",
    badgeBg: "bg-emerald-500/10"
  },
  {
    time: "7:00 AM",
    title: "Smoking",
    type: "Habits",
    value: "2 counts",
    icon: <PlusCircle size={14} />,
    colorClass: "bg-amber-500 text-white",
    borderColor: "border-amber-500/20",
    textColor: "text-amber-500",
    badgeBg: "bg-amber-500/10"
  },
  {
    time: "8:00 AM",
    title: "Spent on vegetables",
    type: "Expenses",
    value: "Rs 390",
    icon: <Wallet size={14} />,
    colorClass: "bg-rose-500 text-white",
    borderColor: "border-rose-500/20",
    textColor: "text-rose-500",
    badgeBg: "bg-rose-500/10"
  },
  {
    time: "9:00 AM",
    title: "Beach with Roscoe",
    type: "Pets",
    value: "Activity - Beach",
    icon: <Dog size={14} />,
    colorClass: "bg-sky-500 text-white",
    borderColor: "border-sky-500/20",
    textColor: "text-sky-500",
    badgeBg: "bg-sky-500/10"
  },
  {
    time: "10:30 AM",
    title: "Push workout",
    type: "Workout",
    value: "16 Sets (8,420 kg)",
    icon: <Activity size={14} />,
    colorClass: "bg-violet-500 text-white",
    borderColor: "border-violet-500/20",
    textColor: "text-violet-500",
    badgeBg: "bg-violet-500/10"
  }
];

export default function PrototypesPage() {
  const [selectedDesign, setSelectedDesign] = useState<number>(1);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        {/* Standard Page Header */}
        <div className="flex items-center gap-2 mb-6">
          <a href="/activity-timeline" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft size={20} />
          </a>
          <PageHeader title="Timeline Prototypes" />
        </div>

        {/* Prototype Switcher Tabs */}
        <div className="bg-card border border-border/30 rounded-2xl p-1.5 shadow-sm mb-8 flex flex-col gap-2">
          <div className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60 px-2 pt-1 flex items-center gap-1">
            <Layers size={10} /> Choose Design Layout
          </div>
          <div className="grid grid-cols-5 gap-1">
            {[1, 2, 3, 4, 5].map(num => (
              <button
                key={num}
                onClick={() => setSelectedDesign(num)}
                className={`py-2 text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer ${
                  selectedDesign === num
                    ? "bg-primary text-primary-foreground shadow"
                    : "hover:bg-muted/50 text-muted-foreground"
                }`}
              >
                Opt {num}
              </button>
            ))}
          </div>
          <div className="text-[10px] text-muted-foreground/75 px-2 pb-1 italic font-medium">
            {selectedDesign === 1 && "Option 1: Modern Minimalist — Ultra clean vertical log with dot accents."}
            {selectedDesign === 2 && "Option 2: Glassmorphic Cards — Floating transparent cards with dynamic glows."}
            {selectedDesign === 3 && "Option 3: Column Split Timeline — Split layout with time column on the left."}
            {selectedDesign === 4 && "Option 4: Dynamic Badges — Metadata highlighted in capsule tags."}
            {selectedDesign === 5 && "Option 5: Neo-Brutalist — Playful, high-contrast bordered containers."}
          </div>
        </div>

        {/* Dynamic Timeline Area */}
        <div className="bg-card border border-border/20 rounded-3xl p-6 shadow-sm min-h-[400px]">
          <div className="flex justify-between items-center mb-8 border-b border-border/30 pb-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1.5">
              <Calendar size={12} className="text-primary" /> Today's Log Preview
            </div>
            <div className="text-[10px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={8} /> Layout {selectedDesign} Active
            </div>
          </div>

          {/* Render option based on selection */}
          {selectedDesign === 1 && (
            <div className="relative border-l border-border/60 ml-3.5 pl-6 space-y-6">
              {mockEvents.map((e, idx) => (
                <div key={idx} className="relative">
                  {/* Dot Accent */}
                  <span className={`absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-background ring-4 ring-muted/10 ${e.colorClass}`} />
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      {e.time} &ndash; {e.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground/80 font-medium mt-0.5">
                      {e.type} &middot; <span className="font-semibold text-primary/80">Value: {e.value}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedDesign === 2 && (
            <div className="relative border-l-2 border-dashed border-border/40 ml-3.5 pl-6 space-y-5">
              {mockEvents.map((e, idx) => (
                <div key={idx} className="relative">
                  {/* Floating Icon Connector */}
                  <span className={`absolute -left-[34px] top-2.5 w-4 h-4 rounded-full flex items-center justify-center shadow-sm ${e.colorClass}`}>
                    {e.icon}
                  </span>
                  {/* Glassmorphic Container Card */}
                  <div className={`bg-card/45 backdrop-blur-md border ${e.borderColor} rounded-2xl p-3.5 shadow-sm hover:scale-[1.01] transition-all`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{e.time}</span>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${e.badgeBg} ${e.textColor}`}>{e.type}</span>
                    </div>
                    <h4 className="text-xs font-black text-foreground mt-1.5">{e.title}</h4>
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/20 text-[9px] font-bold text-muted-foreground">
                      <span>Value:</span>
                      <span className={`font-black uppercase tracking-wider ${e.textColor}`}>{e.value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedDesign === 3 && (
            <div className="space-y-6">
              {mockEvents.map((e, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-4 items-start">
                  {/* Left-hand column for times */}
                  <div className="col-span-1 text-right text-xs font-black text-muted-foreground/80 pt-1">
                    {e.time}
                  </div>
                  {/* Main content right */}
                  <div className="col-span-3 border-l-2 border-primary/20 pl-4">
                    <h4 className="text-xs font-bold text-foreground">{e.title}</h4>
                    <div className="flex items-center gap-2 mt-1 text-[9px] font-medium text-muted-foreground">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${e.badgeBg} ${e.textColor}`}>{e.type}</span>
                      <span>&bull;</span>
                      <span>Value: <span className="font-semibold text-foreground">{e.value}</span></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedDesign === 4 && (
            <div className="space-y-4">
              {mockEvents.map((e, idx) => (
                <div key={idx} className="flex gap-4 items-center bg-muted/20 border border-border/30 rounded-2xl p-3 hover:bg-muted/30 transition-all">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-inner ${e.colorClass}`}>
                    {e.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] font-black uppercase text-muted-foreground">{e.time}</span>
                      <h4 className="text-xs font-black text-foreground truncate">{e.title}</h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${e.badgeBg} ${e.textColor}`}>
                        {e.type}
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground/60">Value:</span>
                      <span className="text-[9px] font-black uppercase text-foreground bg-card border border-border/40 px-2 py-0.5 rounded-full shadow-sm">
                        {e.value}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedDesign === 5 && (
            <div className="space-y-4">
              {mockEvents.map((e, idx) => (
                <div key={idx} className="border-2 border-foreground bg-card rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-black text-foreground uppercase tracking-wide">
                      {e.time} &ndash; {e.title}
                    </h4>
                    <span className="border-2 border-foreground bg-amber-200 text-foreground text-[8px] font-black uppercase px-2 py-0.5 rounded">
                      {e.type}
                    </span>
                  </div>
                  <div className="bg-muted/40 border border-foreground/30 rounded-lg p-2 mt-3 flex items-center justify-between text-[10px] font-bold">
                    <span className="text-muted-foreground uppercase tracking-widest text-[8px]">Value Mapped:</span>
                    <span className="text-foreground uppercase tracking-wider">{e.value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
