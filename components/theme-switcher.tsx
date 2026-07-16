"use client";

import { useEffect, useState } from "react";
import { Palette } from "lucide-react";

const THEMES = [
  { id: "nordic", label: "🌿 Nordic Sage", color: "#f0f4f1" },
  { id: "terracotta", label: "🏜️ Terracotta", color: "#fbf9f6" },
  { id: "ocean", label: "🌊 Ocean Mist", color: "#f0f4f8" },
  { id: "lavender", label: "🌸 Lavender", color: "#f5f3f7" }
];

export function ThemeSwitcher() {
  const [activeTheme, setActiveTheme] = useState("nordic");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load saved theme or default to nordic
    const saved = localStorage.getItem("resiliessance_ui_theme") || "nordic";
    console.log("🎨 ThemeSwitcher: Initializing theme ->", saved);
    setActiveTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const changeTheme = (tId: string) => {
    console.log("🎨 ThemeSwitcher: Changing theme to ->", tId);
    setActiveTheme(tId);
    document.documentElement.setAttribute("data-theme", tId);
    localStorage.setItem("resiliessance_ui_theme", tId);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-32 right-6 z-[100]">
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-card border border-border shadow-2xl p-2 rounded-2xl flex flex-col gap-1 w-48">
          <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/50 text-center mb-2 mt-1">Select Palette</div>
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => changeTheme(t.id)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black transition-all ${activeTheme === t.id ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"}`}
            >
              <span>{t.label}</span>
              <div className="w-3 h-3 rounded-full shadow-inner border border-black/10" style={{ backgroundColor: t.color }} />
            </button>
          ))}
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-4 border-background"
      >
        <Palette size={24} />
      </button>
    </div>
  );
}
