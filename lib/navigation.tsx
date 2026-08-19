import React from "react";
import {
  Archive,
    Bookmark,
  BookOpen,
  Box,
  BarChart2,
    CalendarDays,
  Car,
  Dog,
  ClipboardList,
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
  RefreshCw,
  Sliders,
  Star,
  Target,
  TrendingUp,
  Wallet,
  Wrench,
  Zap,
  Activity,
  HandCoins,
  Apple,
  Timer,
  Clock,
  } from "lucide-react";

// ─── Finance ──────────────────────────────────────────────────────────────────
export const FINANCE_TABS = [
  { title: "Transactions", href: "/finance/transactions/expense", icon: <Edit3 size={16} /> },
  { title: "Subscriptions", href: "/finance/subscriptions", icon: <CalendarDays size={16} /> },
  { title: "Liquidity", href: "/finance/liquidity", icon: <Droplets size={16} /> },
  { title: "Liabilities", href: "/finance/view-liability", icon: <Eye size={16} /> },
  { title: "Receivables", href: "/finance/view-receivable", icon: <HandCoins size={16} /> },
  { title: "Assets", href: "/finance/view-assets", icon: <Box size={16} /> },
  { title: "Savings", href: "/finance/savings", icon: <Target size={16} /> },
  { title: "Budget", href: "/finance/current-budget", icon: <BarChart2 size={16} /> },
  { title: "Net Worth", href: "/finance/net-worth", icon: <TrendingUp size={16} /> },
];
export const EXPENSE_TABS = FINANCE_TABS;

// ─── Habits ───────────────────────────────────────────────────────────────────
export const HABIT_TABS = [
  { title: "Logs", href: "/habits/daily-log", icon: <FileCheck size={16} /> },
  { title: "Analytics", href: "/habits/view", icon: <Eye size={16} /> },
  { title: "Add", href: "/habits/add", icon: <PlusCircle size={16} /> },
  { title: "Manage", href: "/habits/manage", icon: <Sliders size={16} /> },
];

// ─── Vehicles ─────────────────────────────────────────────────────────────────
export const VEHICLE_TABS = [
  { title: "Fuel", href: "/vehicles/fuel", icon: <Fuel size={16} /> },
  { title: "Service", href: "/vehicles/service", icon: <Wrench size={16} /> },
  { title: "Mileage", href: "/vehicles/mileage", icon: <Gauge size={16} /> },
  { title: "Components", href: "/vehicles/components", icon: <Sliders size={16} /> },
  { title: "Vehicle Fleet", href: "/vehicles/master", icon: <Activity size={16} /> },
];

// ─── Workout ──────────────────────────────────────────────────────────────────
export const WORKOUT_TABS = [
  { title: "Logger", href: "/workout/logger", icon: <PlusCircle size={16} /> },
  { title: "Templates", href: "/workout/templates", icon: <ClipboardList size={16} /> },
  { title: "Stopwatch", href: "/workout/stopwatch", icon: <Clock size={16} /> },
  { title: "Rest Timer", href: "/workout/timer", icon: <Timer size={16} /> },
  { title: "History", href: "/workout/history", icon: <CalendarDays size={16} /> },
];

// ─── Pets ─────────────────────────────────────────────────────────────────────
export const PET_TABS = [
  { title: "Pets", href: "/pets/pets", icon: <Eye size={16} /> },
  { title: "Add Pet", href: "/pets/add", icon: <PlusCircle size={16} /> },
];

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const TASK_TABS = [
  { title: "Inbox", href: "/tasks/inbox", icon: <Inbox size={16} /> },
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

// ─── Second Brain ─────────────────────────────────────────────────────────────
export const BRAIN_TABS = [
  { title: "Cards", href: "/second-brain/cards", icon: <BookOpen size={16} /> },
  { title: "Inbox", href: "/second-brain/inbox", icon: <Inbox size={16} /> },
  { title: "Review", href: "/second-brain/review", icon: <RefreshCw size={16} /> },
];

// ─── Reports ──────────────────────────────────────────────────────────────────
export const REPORT_TABS = [
  { title: "All", href: "/reports/all", icon: <LayoutPanelLeft size={16} /> },
  { title: "Finance", href: "/reports/finance", icon: <Wallet size={16} /> },
  { title: "Habits", href: "/reports/habits", icon: <Flame size={16} /> },
  { title: "Workout", href: "/reports/workout", icon: <Zap size={16} /> },
  { title: "Vehicles", href: "/reports/vehicles", icon: <Car size={16} /> },
  { title: "Tasks", href: "/reports/tasks", icon: <ListTodo size={16} /> },
  { title: "Skills", href: "/reports/skills", icon: <GraduationCap size={16} /> },
  { title: "Pets", href: "/reports/pets", icon: <Dog size={16} /> },
  { title: "Nutrition", href: "/reports/nutrition", icon: <Apple size={16} /> },
  { title: "Summary", href: "/reports/summary", icon: <CalendarDays size={16} /> },
  { title: "Correlations", href: "/reports/correlations", icon: <LineChart size={16} /> },
];

// ─── Report Summary Sub-tabs ──────────────────────────────────────────────────
export const SUMMARY_TABS = [
  { title: "Weekly", href: "/reports/summary/weekly", icon: <CalendarDays size={14} /> },
  { title: "Monthly", href: "/reports/summary/monthly", icon: <Flame size={14} /> },
  { title: "Yearly", href: "/reports/summary/yearly", icon: <TrendingUp size={14} /> },
];

// ─── Nutrition ────────────────────────────────────────────────────────────────
export const NUTRITION_TABS = [
  { title: "Daily Log", href: "/nutrition/logs", icon: <Apple size={16} /> },
  { title: "Biometrics & Body", href: "/nutrition/biometrics", icon: <Activity size={16} /> },
  { title: "Library & Combos", href: "/nutrition/library", icon: <BookOpen size={16} /> },
];

// ─── Activity Timeline ────────────────────────────────────────────────────────
export const ACTIVITY_TABS = [
  { title: "Timeline", href: "/activity-timeline/timeline", icon: <Activity size={16} /> },
  { title: "Day at a Glance", href: "/activity-timeline/day", icon: <Clock size={16} /> },
  { title: "Add Activity", href: "/activity-timeline/add-activity", icon: <PlusCircle size={16} /> },
];

// ─── SquareShift ──────────────────────────────────────────────────────────────
export const SQUARESHIFT_TABS = [
  { title: "Today", href: "/squareshift/today", icon: <Star size={16} /> },
  { title: "Notes", href: "/squareshift/notes", icon: <BookOpen size={16} /> },
];
