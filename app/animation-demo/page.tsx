"use client";

import React, { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";

export default function AnimationDemo() {
  const [openStates, setOpenStates] = useState<Record<number, boolean>>({});

  const toggleOpen = (id: number) => {
    setOpenStates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const Dropdown = ({ id, title, vibe, animationClass }: any) => {
    const isOpen = openStates[id] || false;
    
    return (
      <div className="relative space-y-2 w-full max-w-sm mx-auto mb-12">
        <div className="flex justify-between items-end mb-1">
          <label className="text-sm font-black text-foreground">{title}</label>
          <span className="text-[10px] font-bold text-accent uppercase tracking-widest">{vibe}</span>
        </div>
        
        <div 
          className="w-full h-12 bg-card border border-border/40 rounded-xl px-4 flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-accent/20 shadow-sm active:scale-[0.98] transition-transform"
          onClick={() => toggleOpen(id)}
        >
          <span className="text-sm font-bold text-muted-foreground">Tap to view animation</span>
          <ChevronDown size={16} className={`text-muted-foreground/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
        
        {isOpen && (
          <div className={`absolute z-50 left-0 right-0 mt-2 bg-card rounded-xl shadow-2xl border border-border/40 p-2 ${animationClass}`}>
            <div className="px-3 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer">Option 1</div>
            <div className="px-3 py-2.5 text-sm font-black bg-primary/10 text-primary rounded-lg flex items-center justify-between cursor-pointer">
              <span>Option 2 (Selected)</span>
              <Sparkles size={14} />
            </div>
            <div className="px-3 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer">Option 3</div>
          </div>
        )}
      </div>
    );
  };

  const animations = [
    {
      title: "1. The Pop & Scale",
      vibe: "Snappy & Native",
      classes: "zoom-in-95 duration-200 ease-out"
    },
    {
      title: "2. The Smooth Slide-Down",
      vibe: "Elegant & Professional",
      classes: "slide-in-from-top-3 duration-200 ease-out"
    },
    {
      title: "3. The Mobile Drawer",
      vibe: "Modern & Grounded",
      classes: "slide-in-from-bottom-3 duration-200 ease-out"
    },
    {
      title: "4. The Ghost Fade",
      vibe: "Instant & Minimal",
      classes: "duration-150"
    },
    {
      title: "5. The Gravity Drop",
      vibe: "Heavy & Deliberate",
      classes: "slide-in-from-top-6 duration-300 ease-in-out"
    },
    {
      title: "6. The Fluid Morph",
      vibe: "Playful & Expanding",
      classes: "zoom-in-75 slide-in-from-top-2 duration-300 ease-out"
    },
    {
      title: "7. The Quick Snap",
      vibe: "Hyper-responsive",
      classes: "zoom-in-90 duration-75"
    },
    {
      title: "8. The Side Swipe",
      vibe: "Unique & Quirky",
      classes: "slide-in-from-right-4 duration-200 ease-out"
    },
    {
      title: "9. The Cinematic Float",
      vibe: "Luxurious & Slow",
      classes: "slide-in-from-bottom-4 zoom-in-95 duration-500 ease-out"
    }
  ];

  return (
    <div className="p-4 md:p-12 bg-background min-h-screen pb-32">
      <div className="text-center max-w-xl mx-auto mb-16">
        <h1 className="text-3xl font-black text-foreground tracking-tight mb-3">Pro Animation Suite</h1>
        <p className="text-muted-foreground/60 text-sm leading-relaxed">
          I've designed 9 distinct animation profiles for you. 
          Tap through them and find the one that perfectly matches the personality of your app.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 max-w-7xl mx-auto">
        {animations.map((anim, idx) => (
          <Dropdown 
            key={idx}
            id={idx}
            title={anim.title}
            vibe={anim.vibe}
            animationClass={anim.classes}
          />
        ))}
      </div>
    </div>
  );
}
