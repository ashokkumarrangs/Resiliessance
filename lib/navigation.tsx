import React from "react";
import {
  Archive,
    Bookmark,
  Box,
  BarChart2,
    CalendarDays,
  Car,
  Dog,
  Droplets,
  Edit3,
  Eye,
  FileCheck,
  Flame,
  Fuel,
  Gauge,
  GraduationCap,
  Inbox,
  LayoutGrid,
  LayoutPanelLeft,
  LineChart,
  ListTodo,
  PlusCircle,
  Sliders,
  Star,
  Target,
  TrendingUp,
  Wallet,
  Wrench,
  Zap,
  Activity,
  } from "lucide-react";

// ─── Finance ──────────────────────────────────────────────────────────────────
export const EXPENSE_TABS = [
  { title: "Daily Entry", href: "/expenses/daily-entry", icon: <Edit3 size={16} /> },
  { title: "Liquidity", href: "/expenses/liquidity", icon: <Droplets size={16} /> },
  { title: "Liabilities", href: "/expenses/view-liability", icon: <Eye size={16} /> },
  { title: "Assets", href: "/expenses/view-assets", icon: <Box size={16} /> },
  { title: "Budget", href: "/expenses/current-budget", icon: <BarChart2 size={16} /> },
  { title: "Net Worth", href: "/expenses/net-worth", icon: <TrendingUp size={16} /> },
];

// ─── Habits ───────────────────────────────────────────────────────────────────
export const HABIT_TABS = [
  { title: "Logs", href: "/habits/daily-log", icon: <FileCheck size={16} /> },
  { title: "Viewer", href: "/habits/view", icon: <Eye size={16} /> },
  { title: "Add", href: "/habits/add", icon: <PlusCircle size={16} /> },
  { title: "Manage", href: "/habits/manage", icon: <Sliders size={16} /> },
];

// ─── Vehicles ─────────────────────────────────────────────────────────────────
export const VEHICLE_TABS = [
  { title: "Fuel", href: "/vehicles/fuel", icon: <Fuel size={16} /> },
  { title: "Service", href: "/vehicles/service", icon: <Wrench size={16} /> },
  { title: "Mileage", href: "/vehicles/mileage", icon: <Gauge size={16} /> },
  { title: "Add Vehicle", href: "/vehicles/master", icon: <Activity size={16} /> },
];

// ─── Workout ──────────────────────────────────────────────────────────────────
export const WORKOUT_TABS = [
  { title: "Logger", href: "/workout", icon: <PlusCircle size={16} /> },
  { title: "History", href: "/workout/history", icon: <CalendarDays size={16} /> },
];

// ─── Pets ─────────────────────────────────────────────────────────────────────
export const PET_TABS = [
  { title: "Pets", href: "/pets", icon: <Eye size={16} /> },
  { title: "Add Pet", href: "/pets/add", icon: <PlusCircle size={16} /> },
];

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const TASK_TABS = [
  { title: "Quick Notes", href: "/tasks/inbox", icon: <Inbox size={16} /> },
  { title: "Today", href: "/tasks/today", icon: <Star size={16} /> },
  { title: "Week", href: "/tasks/week", icon: <Bookmark size={16} /> },
  { title: "Workspace", href: "/tasks/workspace", icon: <LayoutGrid size={16} /> },
];

// ─── Skills ───────────────────────────────────────────────────────────────────
export const SKILL_TABS = [
  { title: "Focus", href: "/skills/focus", icon: <Target size={16} /> },
  { title: "Plan", href: "/skills/plan", icon: <CalendarDays size={16} /> },
  { title: "Archive", href: "/skills/archive", icon: <Archive size={16} /> },
];

// ─── Reports ──────────────────────────────────────────────────────────────────
export const REPORT_TABS = [
  { title: "ALL", href: "/reports", icon: <LayoutPanelLeft size={16} /> },
  { title: "FINANCE", href: "/reports/finance", icon: <Wallet size={16} /> },
  { title: "HABITS", href: "/reports/habits", icon: <Flame size={16} /> },
  { title: "WORKOUT", href: "/reports/workout", icon: <Zap size={16} /> },
  { title: "VEHICLES", href: "/reports/vehicles", icon: <Car size={16} /> },
  { title: "TASKS", href: "/reports/tasks", icon: <ListTodo size={16} /> },
  { title: "SKILLS", href: "/reports/skills", icon: <GraduationCap size={16} /> },
  { title: "PETS", href: "/reports/pets", icon: <Dog size={16} /> },
  { title: "SUMMARY", href: "/reports/summary", icon: <CalendarDays size={16} /> },
  { title: "CORRELATIONS", href: "/reports/correlations", icon: <LineChart size={16} /> },
];

// ─── Report Summary Sub-tabs ──────────────────────────────────────────────────
export const SUMMARY_TABS = [
  { title: "Weekly", href: "/reports/summary/weekly", icon: <CalendarDays size={14} /> },
  { title: "Monthly", href: "/reports/summary/monthly", icon: <Flame size={14} /> },
  { title: "Yearly", href: "/reports/summary/yearly", icon: <TrendingUp size={14} /> },
];
