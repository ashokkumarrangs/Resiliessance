import React from 'react';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

interface FocusSkill {
  id: string;
  name: string;
  icon: string;
  color: string;
  target: number;
  sessions: number;
  daysLeft: number | null;
  streak: number;
  practicedToday: boolean;
}

interface SkillsFocusPanelProps {
  focusSkillDash: FocusSkill | null;
}

export function SkillsFocusPanel({ focusSkillDash }: SkillsFocusPanelProps) {
  if (!focusSkillDash) {
    return (
      <Link href="/skills" className="bg-card rounded-md border border-border shadow-sm p-7 flex flex-col justify-between group hover:scale-[1.01] transition-all min-h-[180px]">
        <div className="text-[10px] font-black text-muted-foreground tracking-wider flex items-center gap-2">
          <GraduationCap size={16} className="text-primary" /> Focus Skill
        </div>
        <div className="text-xs font-bold text-muted-foreground/30 py-4 text-center">No active focus skill</div>
        <div className="bg-muted rounded-md h-1.5 w-full overflow-hidden" />
      </Link>
    );
  }

  return (
    <Link href="/skills" className="bg-card rounded-md border border-border shadow-sm p-7 flex flex-col justify-between group hover:scale-[1.01] transition-all"
      style={{ borderLeft: `4px solid ${focusSkillDash.sessions >= focusSkillDash.target ? "#10b981" : focusSkillDash.color}` }}>
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-black text-muted-foreground tracking-wider flex items-center gap-2">
          <GraduationCap size={16} className="text-primary" /> Focus Skill
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {focusSkillDash.streak > 0 && (
            <span className="text-[8px] font-black text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-full">
              🔥 {focusSkillDash.streak}d
            </span>
          )}
        </div>
      </div>
      
      <div>
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none">{focusSkillDash.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-black text-foreground truncate leading-tight">{focusSkillDash.name}</div>
            <div className="text-[9px] text-muted-foreground font-bold mt-0.5">
              {focusSkillDash.sessions}/{focusSkillDash.target} sessions
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-muted rounded-md h-1.5 w-full overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${Math.min((focusSkillDash.sessions / (focusSkillDash.target || 1)) * 100, 100)}%`, backgroundColor: focusSkillDash.sessions >= (focusSkillDash.target || 1) ? "#10b981" : focusSkillDash.color }} />
      </div>
    </Link>
  );
}
