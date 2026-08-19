"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  CheckCircle2,
  PlusCircle,
  Wallet,
  Car,
  ChevronRight,
  Calendar,
  CalendarDays,
  CalendarRange,
  KanbanSquare,
  FileCheck,
  GraduationCap,
  TrendingUp,
  Utensils,
  HeartPulse,
  Brain
} from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";
import { TabItem } from "@/components/SectionNav";

interface LauncherItem {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  colorClass: string;
  bgGlowClass: string;
  category: string;
}

export default function DailyQuickAddPage() {
  const router = useRouter();

  const launcherItems: LauncherItem[] = [
    {
      title: "Expense Entry",
      description: "Log expenses/income",
      href: "/finance/daily-entry?type=Expense",
      icon: <Wallet size={20} />,
      colorClass: "text-rose-500",
      bgGlowClass: "from-rose-500/10 to-rose-500/0",
      category: "Finance",
    },
    {
      title: "Income Entry",
      description: "Log incoming payments & income",
      href: "/finance/daily-entry?type=Income",
      icon: <TrendingUp size={20} />,
      colorClass: "text-emerald-500",
      bgGlowClass: "from-emerald-500/10 to-emerald-500/0",
      category: "Finance",
    },
    {
      title: "Workout Log",
      description: "Log training sets, reps, weight",
      href: "/workout",
      icon: <Activity size={20} />,
      colorClass: "text-violet-500",
      bgGlowClass: "from-violet-500/10 to-violet-500/0",
      category: "Work & Workout",
    },
    {
      title: "Daily Habits",
      description: "Check daily habit log status",
      href: "/habits/daily-log",
      icon: <CheckCircle2 size={20} />,
      colorClass: "text-emerald-500",
      bgGlowClass: "from-emerald-500/10 to-emerald-500/0",
      category: "Habits & Skills",
    },
    {
      title: "Event Log",
      description: "Adjust habit occurrences",
      href: "/habits/event-log",
      icon: <PlusCircle size={20} />,
      colorClass: "text-amber-500",
      bgGlowClass: "from-amber-500/10 to-amber-500/0",
      category: "Habits & Skills",
    },
    {
      title: "Skills Focus",
      description: "Log skill practice minutes",
      href: "/skills/focus",
      icon: <GraduationCap size={20} />,
      colorClass: "text-violet-400",
      bgGlowClass: "from-violet-400/10 to-violet-400/0",
      category: "Habits & Skills",
    },
    {
      title: "Mileage Log",
      description: "Record odometer reading",
      href: "/vehicles/mileage",
      icon: <Car size={20} />,
      colorClass: "text-sky-500",
      bgGlowClass: "from-sky-500/10 to-sky-500/0",
      category: "Vehicles",
    },
    {
      title: "Nutrition Log",
      description: "Log meals & food intake",
      href: "/nutrition/logs",
      icon: <Utensils size={20} />,
      colorClass: "text-teal-500",
      bgGlowClass: "from-teal-500/10 to-teal-500/0",
      category: "Health",
    },
    {
      title: "Biometrics",
      description: "Record weight & body stats",
      href: "/nutrition/biometrics",
      icon: <HeartPulse size={20} />,
      colorClass: "text-rose-400",
      bgGlowClass: "from-rose-400/10 to-rose-400/0",
      category: "Health",
    },
    {
      title: "Quick Capture",
      description: "Capture fleeting thoughts & notes",
      href: "/second-brain/inbox",
      icon: <Brain size={20} />,
      colorClass: "text-indigo-400",
      bgGlowClass: "from-indigo-400/10 to-indigo-400/0",
      category: "Notes",
    },
    {
      title: "Task Manager",
      description: "Add pending checklist tasks",
      href: "/tasks",
      icon: <KanbanSquare size={20} />,
      colorClass: "text-rose-400",
      bgGlowClass: "from-rose-400/10 to-rose-400/0",
      category: "Work & Workout",
    },
    {
      title: "SquareShift",
      description: "Add active project tasks",
      href: "/squareshift",
      icon: <FileCheck size={20} />,
      colorClass: "text-indigo-500",
      bgGlowClass: "from-indigo-500/10 to-indigo-500/0",
      category: "Work & Workout",
    },
  ];

  const navigationTabs: TabItem[] = [
    {
      title: "Daily",
      icon: <Calendar className="w-5 h-5" />,
      isActive: true,
      onClick: () => router.push("/quick-add/daily"),
    },
    {
      title: "Weekly",
      icon: <CalendarDays className="w-5 h-5" />,
      isActive: false,
      onClick: () => router.push("/quick-add/weekly"),
    },
    {
      title: "Monthly",
      icon: <CalendarRange className="w-5 h-5" />,
      isActive: false,
      onClick: () => router.push("/quick-add/monthly"),
    },
  ];

  return (
    <PageWrapper title="Quick Add" sectionTabs={navigationTabs} className="pb-24">
      <div className="grid grid-cols-2 gap-3.5 animate-fadeIn">
        {launcherItems.map((item, i) => (
          <Link
            key={i}
            href={item.href}
            className="group relative flex flex-col justify-between p-4 bg-card hover:bg-muted/10 border border-border/30 hover:border-primary/40 rounded-xl transition-all duration-300 shadow-sm hover:scale-[1.03]"
          >
            <div className="flex justify-between items-start w-full mb-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <span className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-wider">
                {item.category.split(" ")[0]}
              </span>
            </div>

            <div className="text-left w-full space-y-0.5">
              <span className="text-[13px] font-black text-foreground block group-hover:text-primary transition-colors leading-tight">
                {item.title}
              </span>
              <span className="text-[10px] text-muted-foreground/70 font-semibold block leading-tight">
                {item.description}
              </span>
            </div>

            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight size={14} className="text-primary" />
            </div>
          </Link>
        ))}
      </div>
    </PageWrapper>
  );
}
