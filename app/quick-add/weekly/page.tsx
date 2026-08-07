"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Flame,
  ChevronRight,
  Calendar,
  CalendarDays
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

export default function WeeklyQuickAddPage() {
  const router = useRouter();

  const launcherItems: LauncherItem[] = [
    {
      title: "Budget Plan",
      description: "Update planned allowances",
      href: "/expenses/budget-plan",
      icon: <TrendingUp size={20} />,
      colorClass: "text-emerald-500",
      bgGlowClass: "from-emerald-500/10 to-emerald-500/0",
      category: "Finance",
    },
    {
      title: "Fuel Log",
      description: "Save refueling logs",
      href: "/vehicles/fuel",
      icon: <Flame size={20} />,
      colorClass: "text-amber-500",
      bgGlowClass: "from-amber-500/10 to-amber-500/0",
      category: "Vehicles",
    },
  ];

  const navigationTabs: TabItem[] = [
    {
      title: "Daily",
      icon: <Calendar className="w-5 h-5" />,
      isActive: false,
      onClick: () => router.push("/quick-add/daily"),
    },
    {
      title: "Weekly",
      icon: <CalendarDays className="w-5 h-5" />,
      isActive: true,
      onClick: () => router.push("/quick-add/weekly"),
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
