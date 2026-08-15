import React from "react";
import { CheckCircle2, AlertCircle, XCircle, AlertTriangle, CircleDot, Sparkles } from "lucide-react";
import { HabitStatus } from "@/lib/habit-scoring";

export const getStatusIcon = (status: HabitStatus, size = 16) => {
  switch (status) {
    case 'Success': return <CheckCircle2 size={size} className="text-emerald-500" />;
    case 'Tolerance': return <AlertCircle size={size} className="text-amber-500" />;
    case 'Failure': return <XCircle size={size} className="text-rose-500" />;
    case 'Critical': return <AlertTriangle size={size} className="text-red-600" />;
    case 'Joker': return <Sparkles size={size} className="text-amber-500 fill-amber-500/20" />;
    default: return <CircleDot size={size} className="text-muted-foreground/30" />;
  }
};

export const getStatusColor = (status: HabitStatus) => {
  switch (status) {
    case 'Success': return 'bg-emerald-400';
    case 'Failure': return 'bg-rose-500';
    case 'Critical': return 'bg-destructive';
    case 'Tolerance': return 'bg-amber-400';
    case 'Joker': return 'bg-amber-500';
    default: return 'bg-primary/20';
  }
};

export const getStatusStyles = (status: HabitStatus) => {
  switch (status) {
    case 'Success': return { bg: 'bg-emerald-500/5', text: 'text-emerald-600', weight: 'font-black', anim: '' };
    case 'Tolerance': return { bg: 'bg-amber-500/5', text: 'text-amber-600', weight: 'font-bold', anim: '' };
    case 'Failure': return { bg: 'bg-rose-500/5', text: 'text-rose-600', weight: 'font-bold', anim: 'animate-pulse' };
    case 'Critical': return { bg: 'bg-red-600/10', text: 'text-red-700', weight: 'font-black', anim: 'animate-pulse' };
    case 'Joker': return { bg: 'bg-amber-500/10 border border-amber-500/20', text: 'text-amber-600 dark:text-amber-400', weight: 'font-black', anim: '' };
    default: return { bg: '', text: 'text-foreground/90', weight: 'font-bold', anim: '' };
  }
};
