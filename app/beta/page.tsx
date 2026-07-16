"use client";
import React from "react";
import Link from "next/link";
import { Clock, BarChart2, TrendingUp, Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export default function BetaHubPage() {
  const features = [
    {
      title: "Day at a Glance",
      description: "A chronological visual schedule of today's tasks, habits, workouts, and events in one unified timeline.",
      href: "/day-at-a-glance",
      icon: <Clock size={18} className="text-primary" />,
      badge: "Timeline",
    },
    {
      title: "Cross-Module Correlations",
      description: "Interactive charts that cross-reference habits, workouts, and spending to surface meaningful patterns.",
      href: "/reports/correlations",
      icon: <BarChart2 size={18} className="text-primary" />,
      badge: "Analytics",
    },
    {
      title: "Weekly Progress Summary",
      description: "Week-over-week comparison for finance, habits, tasks, and workouts with clear trend indicators.",
      href: "/reports/weekly-summary",
      icon: <TrendingUp size={18} className="text-primary" />,
      badge: "Reports",
    },
    {
      title: "Interactive Timeline Filter",
      description: "Search your entire 6-month activity history with live keyword search and category filters.",
      href: "/activity-timeline/filtered",
      icon: <Search size={18} className="text-primary" />,
      badge: "Search",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 page-stagger-container">
      <PageHeader title="Beta Features" />

      <div className="mb-6">
        <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
          Four standalone experimental views connected to your live data. No existing screens were modified to build these.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((f, i) => (
          <Link key={i} href={f.href} prefetch>
            <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4 hover:scale-[1.01] hover:shadow-md transition-all cursor-pointer shadow-zenith min-h-[160px]">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  {f.icon}
                </div>
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest bg-muted px-2 py-1 rounded-md">
                  {f.badge}
                </span>
              </div>
              <div>
                <h2 className="text-[14px] font-black text-foreground leading-tight mb-1">{f.title}</h2>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
              <div className="text-[10px] font-black text-primary uppercase tracking-wider mt-auto">
                Open →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
