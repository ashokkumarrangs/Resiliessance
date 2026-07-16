"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  FileCheck,
  GraduationCap,
  KanbanSquare,
  PlusCircle,
  Wallet,
  Car,
  Flame,
  TrendingUp,
  Zap,
  LayoutGrid,
  Box,
  CircleDot,
  Layers,
  Grid,
  Compass,
  Sliders,
  Cpu,
  Bookmark,
  Sparkles,
} from "lucide-react";

interface LauncherItem {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  colorClass: string;
  bgGlowClass: string;
  brutalistBg: string;
  category: string;
}

export default function HybridPlaygroundPage() {
  const [selectedStyle, setSelectedStyle] = useState<number>(1);

  // The 10 individual quick-add items, sorted/categorized cleanly
  const launcherItems: LauncherItem[] = [
    // Finance
    {
      title: "Expense Entry",
      description: "Log expenses/income",
      href: "/expenses/daily-entry",
      icon: <Wallet size={16} />,
      colorClass: "text-rose-500",
      bgGlowClass: "from-rose-500/10 to-rose-500/0",
      brutalistBg: "bg-rose-100",
      category: "Finance",
    },
    {
      title: "Budget Plan",
      description: "Update planned allowances",
      href: "/expenses/budget-plan",
      icon: <TrendingUp size={16} />,
      colorClass: "text-emerald-500",
      bgGlowClass: "from-emerald-500/10 to-emerald-500/0",
      brutalistBg: "bg-emerald-100",
      category: "Finance",
    },
    // Habits & Skills
    {
      title: "Daily Habits",
      description: "Check daily habit log status",
      href: "/habits/daily-log",
      icon: <CheckCircle2 size={16} />,
      colorClass: "text-emerald-500",
      bgGlowClass: "from-emerald-500/10 to-emerald-500/0",
      brutalistBg: "bg-emerald-100",
      category: "Habits",
    },
    {
      title: "Event Log",
      description: "Adjust habit occurrences",
      href: "/habits/event-log",
      icon: <PlusCircle size={16} />,
      colorClass: "text-amber-500",
      bgGlowClass: "from-amber-500/10 to-amber-500/0",
      brutalistBg: "bg-amber-100",
      category: "Habits",
    },
    {
      title: "Skills Focus",
      description: "Log skill practice minutes",
      href: "/skills/focus",
      icon: <GraduationCap size={16} />,
      colorClass: "text-violet-400",
      bgGlowClass: "from-violet-400/10 to-violet-400/0",
      brutalistBg: "bg-violet-100",
      category: "Habits",
    },
    // Vehicles
    {
      title: "Mileage Log",
      description: "Record odometer reading",
      href: "/vehicles/mileage",
      icon: <Car size={16} />,
      colorClass: "text-sky-500",
      bgGlowClass: "from-sky-500/10 to-sky-500/0",
      brutalistBg: "bg-sky-100",
      category: "Vehicles",
    },
    {
      title: "Fuel Log",
      description: "Save refueling logs",
      href: "/vehicles/fuel",
      icon: <Flame size={16} />,
      colorClass: "text-amber-500",
      bgGlowClass: "from-amber-500/10 to-amber-500/0",
      brutalistBg: "bg-amber-100",
      category: "Vehicles",
    },
    // Work & Workout
    {
      title: "Task Manager",
      description: "Add pending checklist tasks",
      href: "/tasks",
      icon: <KanbanSquare size={16} />,
      colorClass: "text-rose-400",
      bgGlowClass: "from-rose-400/10 to-rose-400/0",
      brutalistBg: "bg-rose-100",
      category: "Work",
    },
    {
      title: "SquareShift",
      description: "Add active project tasks",
      href: "/squareshift",
      icon: <FileCheck size={16} />,
      colorClass: "text-indigo-500",
      bgGlowClass: "from-indigo-500/10 to-indigo-500/0",
      brutalistBg: "bg-indigo-100",
      category: "Work",
    },
    {
      title: "Workout Log",
      description: "Log training sets, reps, weight",
      href: "/workout",
      icon: <Activity size={16} />,
      colorClass: "text-violet-500",
      bgGlowClass: "from-violet-500/10 to-violet-500/0",
      brutalistBg: "bg-violet-100",
      category: "Work",
    },
  ];

  const conceptLabels = [
    "Concept 1: Bento Micro-Dock (Glassmorphic Tray)",
    "Concept 2: Neo-Brutalist Tiny Grid (Bold Borders)",
    "Concept 3: Floating Bubble Clusters (Soft Pastel Pills)",
    "Concept 4: Micro Bento-Tiles Grid (Individually Sorted)",
    "Concept 5: Cyber Retro Command Strip (Compact Command Bar)",
    "Concept 6: Orbit Radial Wheel (Interactive Carousel)",
    "Concept 7: Hexagonal Honeycomb Honey Dock (Geometric)",
    "Concept 8: Minimal Pill Stream (Fluid List)",
    "Concept 9: Neo-Brutalist Bubble Pills (Heavy-Shadow Pills)",
    "Concept 10: Glassmorphic Brutalist Micro-Tiles (Pro-Hybrid)",
  ];

  return (
    <div className="p-5 max-w-lg mx-auto bg-transparent min-h-screen pb-24 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="space-y-1">
        <Link href="/quick-add" className="text-[10px] font-black text-primary hover:underline flex items-center gap-1">
          &larr; Back to standard cockpit
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-[26px] font-black text-foreground tracking-tight leading-none mb-1.5">
              Hybrid Playground
            </h1>
            <div className="text-[11px] text-accent font-bold">
              {conceptLabels[selectedStyle - 1]}
            </div>
          </div>
          <div className="p-2.5 bg-card rounded-md border border-border/40 text-accent">
            <Sparkles size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>
      </div>

      {/* 10 Concept Switcher Buttons */}
      <div className="bg-card rounded-lg border border-border/30 p-3 space-y-2 shadow-sm">
        <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-1">
          Select Hybrid Concept
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 10 }).map((_, i) => {
            const num = i + 1;
            const isActive = selectedStyle === num;
            return (
              <button
                key={num}
                onClick={() => setSelectedStyle(num)}
                className={`rounded-md font-mono text-[11px] font-black border flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-primary border-primary text-primary-foreground scale-105 shadow-sm shadow-primary/25"
                    : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/65 hover:text-foreground"
                }`}
                style={{ width: "32px", height: "32px" }}
              >
                {num}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Sandbox Area */}
      <div className="bg-muted/5 rounded-xl border border-border/20 p-4 min-h-[220px] flex items-center justify-center">
        {/* ==================== 1. BENTO MICRO-DOCK ==================== */}
        {selectedStyle === 1 && (
          <div className="w-full py-4 flex flex-col items-center justify-center space-y-3">
            <span className="text-[9px] font-black tracking-widest text-muted-foreground uppercase">Bento Micro-Dock</span>
            <div className="flex flex-wrap gap-2.5 justify-center bg-card/60 backdrop-blur-md border border-border/30 p-3 rounded-2xl shadow-lg">
              {launcherItems.map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  title={item.title}
                  className={`w-10 h-10 rounded-xl bg-muted/20 border border-border/10 flex items-center justify-center transition-all duration-200 hover:scale-110 hover:-translate-y-1 hover:bg-muted/30 group`}
                >
                  <div className={`${item.colorClass} group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ==================== 2. NEO-BRUTALIST TINY GRID ==================== */}
        {selectedStyle === 2 && (
          <div className="w-full py-2 space-y-3">
            <span className="text-[9px] font-black tracking-widest text-black/60 uppercase block text-center">Neo-Brutalist Tiny Grid</span>
            <div className="grid grid-cols-5 gap-2.5 max-w-sm mx-auto">
              {launcherItems.map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  title={item.title}
                  className={`aspect-square border-2 border-black ${item.brutalistBg} flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:scale-95 transition-all text-black`}
                >
                  {item.icon}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ==================== 3. FLOATING BUBBLE CLUSTERS ==================== */}
        {selectedStyle === 3 && (
          <div className="w-full py-3 flex flex-col items-center justify-center space-y-4">
            <span className="text-[9px] font-black tracking-widest text-muted-foreground uppercase">Floating Bubble Clusters</span>
            <div className="flex flex-wrap gap-3 justify-center max-w-sm">
              {launcherItems.map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  title={item.title}
                  className={`w-11 h-11 rounded-full bg-card border border-border/40 hover:border-primary/50 shadow-md flex items-center justify-center hover:scale-115 hover:-rotate-12 transition-all duration-300`}
                >
                  <div className={`${item.colorClass} scale-110`}>{item.icon}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ==================== 4. MICRO BENTO-TILES GRID ==================== */}
        {selectedStyle === 4 && (
          <div className="w-full py-2 space-y-3">
            <span className="text-[9px] font-black tracking-widest text-muted-foreground uppercase block text-center">Micro Bento-Tiles</span>
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
              {launcherItems.map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  className="group flex items-center gap-3 p-2 bg-card border border-border/30 hover:border-primary/40 rounded-lg transition-all hover:bg-muted/10"
                >
                  <div className={`p-1.5 rounded bg-muted/20 ${item.colorClass}`}>
                    {item.icon}
                  </div>
                  <div className="text-left leading-none">
                    <span className="text-[10px] font-black text-foreground block group-hover:text-primary transition-colors">
                      {item.title}
                    </span>
                    <span className="text-[8px] text-muted-foreground/60 font-semibold block">
                      {item.category}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ==================== 5. CYBER RETRO COMMAND STRIP ==================== */}
        {selectedStyle === 5 && (
          <div className="w-full py-4 flex flex-col items-center justify-center space-y-3">
            <span className="text-[9px] font-mono font-black tracking-widest text-cyan-400 uppercase">Cyber Retro Command Strip</span>
            <div className="w-full max-w-md bg-zinc-950 border border-cyan-500/20 p-2.5 rounded-lg flex items-center justify-between gap-1 overflow-x-auto">
              {launcherItems.map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  title={`${item.title} (Key ${i + 1})`}
                  className="relative group w-9 h-9 border border-cyan-500/30 bg-zinc-900 flex items-center justify-center text-cyan-400 hover:border-cyan-400 hover:text-white hover:bg-cyan-500/10 transition-all rounded"
                >
                  {item.icon}
                  <span className="absolute bottom-0 right-0.5 text-[6px] font-mono text-cyan-500/50 group-hover:text-cyan-400">
                    {i + 1 === 10 ? "0" : i + 1}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ==================== 6. ORBIT RADIAL WHEEL ==================== */}
        {selectedStyle === 6 && (
          <div className="w-full py-4 flex flex-col items-center justify-center space-y-4">
            <span className="text-[9px] font-black tracking-widest text-muted-foreground uppercase">Orbit Radial Dock</span>
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* Central badge */}
              <div className="absolute w-12 h-12 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary z-10">
                <Zap size={18} className="animate-pulse" />
              </div>
              {/* Outer Orbit Icons */}
              {launcherItems.map((item, i) => {
                const angle = (i * 360) / launcherItems.length;
                const radius = 64; // px
                const x = radius * Math.cos((angle * Math.PI) / 180);
                const y = radius * Math.sin((angle * Math.PI) / 180);

                return (
                  <Link
                    key={i}
                    href={item.href}
                    title={item.title}
                    className="absolute w-8 h-8 rounded-full bg-card hover:bg-muted/10 border border-border/40 hover:border-primary/50 flex items-center justify-center shadow-md transition-all hover:scale-125 z-20"
                    style={{
                      transform: `translate(${x}px, ${y}px)`,
                    }}
                  >
                    <div className={`${item.colorClass} scale-90`}>{item.icon}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== 7. HEXAGONAL HONEYCOMB DOCK ==================== */}
        {selectedStyle === 7 && (
          <div className="w-full py-3 flex flex-col items-center justify-center space-y-3">
            <span className="text-[9px] font-black tracking-widest text-muted-foreground uppercase">Honeycomb Honey Dock</span>
            <div className="flex flex-wrap justify-center gap-1 max-w-xs">
              {launcherItems.map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  title={item.title}
                  className="w-10 h-11 bg-muted/15 hover:bg-muted/30 border border-border/30 flex items-center justify-center hover:scale-110 hover:-translate-y-0.5 transition-all"
                  style={{
                    clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  }}
                >
                  <div className={item.colorClass}>{item.icon}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ==================== 8. MINIMAL PILL STREAM ==================== */}
        {selectedStyle === 8 && (
          <div className="w-full py-2 space-y-3">
            <span className="text-[9px] font-black tracking-widest text-muted-foreground uppercase block text-center">Minimal Pill Stream</span>
            <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
              {launcherItems.map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  className="flex items-center gap-1.5 py-1 px-2.5 bg-card hover:bg-muted/15 border border-border/30 rounded-full text-foreground hover:scale-[1.03] transition-all text-xs font-black shadow-sm"
                >
                  <div className={item.colorClass}>{item.icon}</div>
                  <span className="text-[9px] tracking-tight">{item.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ==================== 9. NEO-BRUTALIST BUBBLE PILLS ==================== */}
        {selectedStyle === 9 && (
          <div className="w-full py-2 space-y-3">
            <span className="text-[9px] font-black tracking-widest text-black/60 uppercase block text-center">Neo-Brutalist Bubble Pills</span>
            <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
              {launcherItems.map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  className={`flex items-center gap-2 py-1 px-3 border-2 border-black ${item.brutalistBg} rounded-full text-black hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all text-xs font-black`}
                >
                  {item.icon}
                  <span className="text-[9px] tracking-tight uppercase">{item.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ==================== 10. GLASSMORPHIC BRUTALIST MICRO-TILES ==================== */}
        {selectedStyle === 10 && (
          <div className="w-full py-2 space-y-3">
            <span className="text-[9px] font-black tracking-widest text-foreground/70 uppercase block text-center">Glassmorphic Brutalist Micro-Tiles</span>
            <div className="grid grid-cols-2 gap-2.5 max-w-md mx-auto">
              {launcherItems.map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  className="group flex items-center justify-between p-2 bg-card/40 backdrop-blur-md border-2 border-black hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1 border border-black/25 bg-card`}>
                      <div className={item.colorClass}>{item.icon}</div>
                    </div>
                    <span className="text-[10px] font-black text-foreground uppercase tracking-tight block group-hover:text-primary transition-colors">
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[9px] text-muted-foreground/50 group-hover:text-primary">&rarr;</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
