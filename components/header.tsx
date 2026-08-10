import { Menu, Settings } from "lucide-react";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const d = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const formatted = `${days[d.getDay()]}\n${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    const timer = setTimeout(() => {
      setDateStr(formatted);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <header className="absolute top-0 left-0 right-0 h-[64px] bg-background/80 backdrop-blur-md border-b border-border/40 flex items-center justify-between px-6 z-40 text-foreground">
      <button onClick={onMenuClick} className="min-w-[44px] min-h-[44px] p-2 flex items-center justify-center -ml-2 text-foreground hover:bg-muted active:bg-muted rounded-xl transition-colors">
        <Menu size={22} />
      </button>
      
      <div className="absolute left-1/2 -translate-x-1/2 text-2xl font-black tracking-tighter flex items-center gap-2">
        <Image src="/logo.svg" alt="Resiliessance Logo" width={24} height={24} className="rounded-md object-contain" />
        <span>Resiliessance</span>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="hidden sm:block text-[9px] font-black text-slate-400 text-right uppercase tracking-widest leading-tight">
          {dateStr}
        </div>
        <Link href="/settings" className="min-w-[44px] min-h-[44px] p-2 flex items-center justify-center -mr-2 text-foreground hover:bg-muted active:bg-muted rounded-xl transition-colors" title="Settings">
          <Settings size={20} />
        </Link>
      </div>
    </header>
  );
}
