"use client";
import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { SectionNav } from "@/components/SectionNav";
import {
  LayoutPanelLeft, Wallet, Flame, Zap, Car, ListTodo,
  GraduationCap, Dog, CalendarDays, LineChart,
} from "lucide-react";

/**
 * Shared navigation bar for all /reports/* pages.
 * Include this at the top of any standalone reports sub-page so the
 * tab bar is always visible, matching /reports/page.tsx exactly.
 */
export function ReportsNav() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { title: "ALL",          icon: <LayoutPanelLeft size={16} />, isActive: pathname === "/reports",            onClick: () => router.push("/reports") },
    { title: "FINANCE",      icon: <Wallet size={16} />,          isActive: pathname === "/reports/finance",    onClick: () => router.push("/reports/finance") },
    { title: "HABITS",       icon: <Flame size={16} />,           isActive: pathname === "/reports/habits",     onClick: () => router.push("/reports/habits") },
    { title: "WORKOUT",      icon: <Zap size={16} />,             isActive: pathname === "/reports/workout",    onClick: () => router.push("/reports/workout") },
    { title: "VEHICLES",     icon: <Car size={16} />,             isActive: pathname === "/reports/vehicles",   onClick: () => router.push("/reports/vehicles") },
    { title: "TASKS",        icon: <ListTodo size={16} />,        isActive: pathname === "/reports/tasks",      onClick: () => router.push("/reports/tasks") },
    { title: "SKILLS",       icon: <GraduationCap size={16} />,   isActive: pathname === "/reports/skills",     onClick: () => router.push("/reports/skills") },
    { title: "PETS",         icon: <Dog size={16} />,             isActive: pathname === "/reports/pets",       onClick: () => router.push("/reports/pets") },
    { title: "SUMMARY",      icon: <CalendarDays size={16} />,    isActive: pathname.startsWith("/reports/summary"),       onClick: () => router.push("/reports/summary") },
    { title: "CORRELATIONS", icon: <LineChart size={16} />,       isActive: pathname.startsWith("/reports/correlations"),  onClick: () => router.push("/reports/correlations") },
  ];

  return <SectionNav tabs={tabs} />;
}
