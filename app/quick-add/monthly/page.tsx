"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PieChart,
  CreditCard,
  Landmark,
  PiggyBank,
  Receipt,
  Package,
  Dog,
  ChevronRight,
  Calendar,
  CalendarDays,
  CalendarRange
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

export default function MonthlyQuickAddPage() {
  const router = useRouter();

  const launcherItems: LauncherItem[] = [
    {
      title: "Monthly Summary",
      description: "Review monthly performance & stats",
      href: "/reports/summary/monthly",
      icon: <PieChart size={20} />,
      colorClass: "text-indigo-500",
      bgGlowClass: "from-indigo-500/10 to-indigo-500/0",
      category: "Reports",
    },
    {
      title: "Subscriptions",
      description: "Review active monthly recurring bills",
      href: "/finance/subscriptions",
      icon: <CreditCard size={20} />,
      colorClass: "text-rose-500",
      bgGlowClass: "from-rose-500/10 to-rose-500/0",
      category: "Finance",
    },
    {
      title: "Net Worth & Capital",
      description: "Update assets, liabilities & total capital",
      href: "/finance/net-worth",
      icon: <Landmark size={20} />,
      colorClass: "text-emerald-500",
      bgGlowClass: "from-emerald-500/10 to-emerald-500/0",
      category: "Finance",
    },
    {
      title: "Savings Goals",
      description: "Update monthly savings progress & targets",
      href: "/finance/savings",
      icon: <PiggyBank size={20} />,
      colorClass: "text-amber-500",
      bgGlowClass: "from-amber-500/10 to-amber-500/0",
      category: "Finance",
    },
    {
      title: "Accounts Audit",
      description: "Reconcile monthly bank accounts & balances",
      href: "/finance/accounts",
      icon: <Receipt size={20} />,
      colorClass: "text-sky-500",
      bgGlowClass: "from-sky-500/10 to-sky-500/0",
      category: "Finance",
    },
    {
      title: "Inventory Audit",
      description: "Audit & update household inventory stock",
      href: "/inventory",
      icon: <Package size={20} />,
      colorClass: "text-violet-500",
      bgGlowClass: "from-violet-500/10 to-violet-500/0",
      category: "Household",
    },
    {
      title: "Pet Care Log",
      description: "Update monthly pet logs & health records",
      href: "/pets",
      icon: <Dog size={20} />,
      colorClass: "text-orange-500",
      bgGlowClass: "from-orange-500/10 to-orange-500/0",
      category: "Household",
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
      isActive: false,
      onClick: () => router.push("/quick-add/weekly"),
    },
    {
      title: "Monthly",
      icon: <CalendarRange className="w-5 h-5" />,
      isActive: true,
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
