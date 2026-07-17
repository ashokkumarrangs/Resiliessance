import { Menu } from "lucide-react";
import React, { useEffect, useState } from "react";

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const d = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    setDateStr(`${days[d.getDay()]}\n${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`);
  }, []);

  return (
    <header className="absolute top-0 left-0 right-0 h-[64px] bg-background/80 backdrop-blur-md border-b border-border/40 flex items-center justify-between px-6 z-40 text-foreground">
      <button onClick={onMenuClick} className="p-2 -ml-2 text-foreground hover:bg-muted rounded-xl transition-colors">

        <Menu size={22} />
      </button>
      
      <div className="absolute left-1/2 -translate-x-1/2 text-2xl font-black tracking-tighter flex items-center gap-2">
        <img src="/logo.svg" alt="Resiliessance Logo" className="w-6 h-6 rounded-md object-contain" />
        <span>Resiliessance</span>
      </div>
      
      <div className="text-[9px] font-black text-slate-400 text-right uppercase tracking-widest leading-tight">
        {dateStr}
      </div>
    </header>
  );
}
