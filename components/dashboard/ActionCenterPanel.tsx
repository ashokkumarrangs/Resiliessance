import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface SystemAlert {
  id: string;
  type: string;
  section: string;
  text: string;
}

interface ActionCenterPanelProps {
  alerts: SystemAlert[];
}

export function ActionCenterPanel({ alerts }: ActionCenterPanelProps) {
  if (alerts.length === 0) return null;
  
  return (
    <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-widest">
        <AlertCircle size={14} />
        <span>Action Center ({alerts.length} Warning{alerts.length > 1 ? 's' : ''})</span>
      </div>
      <div className="space-y-1.5 mt-2">
        {alerts.map((a, i) => (
          <div key={a.id || i} className="flex items-start gap-2 text-xs font-bold text-foreground/80">
            <span className="text-rose-500 mt-0.5">•</span>
            <span className="flex-1 text-[11px] leading-tight">{a.text}</span>
            <span className="text-[7px] font-black uppercase text-muted-foreground/50 bg-muted/40 px-1.5 py-0.5 rounded leading-none">{a.section}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
