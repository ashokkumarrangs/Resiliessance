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
  ChevronRight,
  Calendar,
  CalendarDays,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SectionNav, TabItem } from "@/components/SectionNav";

interface LauncherItem {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  colorClass: string;
  bgGlowClass: string;
  category: string;
  type: "daily" | "weekly";
}

export default function QuickAddLauncherPage() {
  const [activeTab, setActiveTab] = useState<string>("Daily");

  const launcherItems: LauncherItem[] = [
    // Finance
    {
      title: "Expense Entry",
      description: "Log expenses/income",
      href: "/expenses/daily-entry?type=Expense",
      icon: <Wallet size={20} />,
      colorClass: "text-rose-500",
      bgGlowClass: "from-rose-500/10 to-rose-500/0",
      category: "Finance",
      type: "daily",
    },
    {
      title: "Workout Log",
      description: "Log training sets, reps, weight",
      href: "/workout",
      icon: <Activity size={20} />,
      colorClass: "text-violet-500",
      bgGlowClass: "from-violet-500/10 to-violet-500/0",
      category: "Work & Workout",
      type: "daily",
    },
    {
      title: "Budget Plan",
      description: "Update planned allowances",
      href: "/expenses/budget-plan",
      icon: <TrendingUp size={20} />,
      colorClass: "text-emerald-500",
      bgGlowClass: "from-emerald-500/10 to-emerald-500/0",
      category: "Finance",
      type: "weekly",
    },
    // Habits & Skills
    {
      title: "Daily Habits",
      description: "Check daily habit log status",
      href: "/habits/daily-log",
      icon: <CheckCircle2 size={20} />,
      colorClass: "text-emerald-500",
      bgGlowClass: "from-emerald-500/10 to-emerald-500/0",
      category: "Habits & Skills",
      type: "daily",
    },
    {
      title: "Event Log",
      description: "Adjust habit occurrences",
      href: "/habits/event-log",
      icon: <PlusCircle size={20} />,
      colorClass: "text-amber-500",
      bgGlowClass: "from-amber-500/10 to-amber-500/0",
      category: "Habits & Skills",
      type: "daily",
    },
    {
      title: "Skills Focus",
      description: "Log skill practice minutes",
      href: "/skills/focus",
      icon: <GraduationCap size={20} />,
      colorClass: "text-violet-400",
      bgGlowClass: "from-violet-400/10 to-violet-400/0",
      category: "Habits & Skills",
      type: "daily",
    },
    // Vehicles
    {
      title: "Mileage Log",
      description: "Record odometer reading",
      href: "/vehicles/mileage",
      icon: <Car size={20} />,
      colorClass: "text-sky-500",
      bgGlowClass: "from-sky-500/10 to-sky-500/0",
      category: "Vehicles",
      type: "daily",
    },
    {
      title: "Fuel Log",
      description: "Save refueling logs",
      href: "/vehicles/fuel",
      icon: <Flame size={20} />,
      colorClass: "text-amber-500",
      bgGlowClass: "from-amber-500/10 to-amber-500/0",
      category: "Vehicles",
      type: "weekly",
    },
    // Work & Workout
    {
      title: "Task Manager",
      description: "Add pending checklist tasks",
      href: "/tasks",
      icon: <KanbanSquare size={20} />,
      colorClass: "text-rose-400",
      bgGlowClass: "from-rose-400/10 to-rose-400/0",
      category: "Work & Workout",
      type: "daily",
    },
    {
      title: "SquareShift",
      description: "Add active project tasks",
      href: "/squareshift",
      icon: <FileCheck size={20} />,
      colorClass: "text-indigo-500",
      bgGlowClass: "from-indigo-500/10 to-indigo-500/0",
      category: "Work & Workout",
      type: "daily",
    },
  ];

  const filteredItems = launcherItems.filter(
    (item) => item.type === activeTab.toLowerCase()
  );

  const navigationTabs: TabItem[] = [
    {
      title: "Daily",
      icon: <Calendar className="w-5 h-5" />,
      isActive: activeTab === "Daily",
      onClick: () => setActiveTab("Daily"),
    },
    {
      title: "Weekly",
      icon: <CalendarDays className="w-5 h-5" />,
      isActive: activeTab === "Weekly",
      onClick: () => setActiveTab("Weekly"),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        {/* Standard Page Header */}
        <PageHeader title="Quick Add" />

        {/* SectionNav Component Container with Offset Margins */}
        <div className="-mt-2 mb-6">
          <SectionNav tabs={navigationTabs} />
        </div>

        {/* Bento Tiles Grid Layout */}
        <div className="grid grid-cols-2 gap-3.5 animate-fadeIn">
          {filteredItems.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className="group relative flex flex-col justify-between p-4 bg-card hover:bg-muted/10 border border-border/30 hover:border-primary/40 rounded-xl transition-all duration-300 shadow-sm hover:scale-[1.03]"
            >
              {/* Top Row: Icon and Category Tag */}
              <div className="flex justify-between items-start w-full mb-3">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <span className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-wider">
                  {item.category.split(" ")[0]}
                </span>
              </div>

              {/* Bottom Row: Text content */}
              <div className="text-left w-full space-y-0.5">
                <span className="text-[13px] font-black text-foreground block group-hover:text-primary transition-colors leading-tight">
                  {item.title}
                </span>
                <span className="text-[10px] text-muted-foreground/70 font-semibold block leading-tight">
                  {item.description}
                </span>
              </div>

              {/* Hover Action Indicator */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={14} className="text-primary" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
