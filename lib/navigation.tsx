import React from "react";
import {
  Edit3,
  Droplets,
  Eye,
  Box,
  BarChart2,
  Calendar,
  TrendingUp,
  FileCheck,
  CalendarDays,
  PlusCircle,
  Sliders,
  Gauge,
  Fuel,
  Activity,
  Bike,
  Wrench,
  Dog
} from "lucide-react";

export const EXPENSE_TABS = [
  { title: "Daily Entry", href: "/expenses/daily-entry", icon: <Edit3 size={16} /> },
  { title: "Liquidity", href: "/expenses/liquidity", icon: <Droplets size={16} /> },
  { title: "Liabilities", href: "/expenses/view-liability", icon: <Eye size={16} /> },
  { title: "Assets", href: "/expenses/view-assets", icon: <Box size={16} /> },
  { title: "Budget", href: "/expenses/current-budget", icon: <BarChart2 size={16} /> },
  { title: "Net Worth", href: "/expenses/net-worth", icon: <TrendingUp size={16} /> },
];

export const HABIT_TABS = [
  { title: "Logs", href: "/habits/daily-log", icon: <FileCheck size={16} /> },
  { title: "Viewer", href: "/habits/view", icon: <Eye size={16} /> },
  { title: "Add", href: "/habits/add", icon: <PlusCircle size={16} /> },
  { title: "Manage", href: "/habits/manage", icon: <Sliders size={16} /> },
];

export const VEHICLE_TABS = [
  { title: "Fuel", href: "/vehicles/fuel", icon: <Fuel size={16} /> },
  { title: "Service", href: "/vehicles/service", icon: <Wrench size={16} /> },
  { title: "Mileage", href: "/vehicles/mileage", icon: <Gauge size={16} /> },
  { title: "Add Vehicle", href: "/vehicles/master", icon: <Activity size={16} /> },
];

export const WORKOUT_TABS = [
  { title: "Logger", href: "/workout", icon: <PlusCircle size={16} /> },
  { title: "History", href: "/workout/history", icon: <CalendarDays size={16} /> },
];

export const PET_TABS = [
  { title: "Pets", href: "/pets", icon: <Eye size={16} /> },
  { title: "Add Pet", href: "/pets/add", icon: <PlusCircle size={16} /> },
];
