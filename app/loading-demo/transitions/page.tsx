"use client";
import React, { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Sparkles, Calendar, Landmark, Activity, LayoutDashboard, ChevronRight } from "lucide-react";

export default function TransitionsPreviewPage() {
  const [activeTransition, setActiveTransition] = useState<number>(1);
  const [demoKey, setDemoKey] = useState<number>(0);

  const transitions = [
    { id: 1, name: "1. Spring Slide-Up", class: "animate-in fade-in slide-in-from-bottom-8 duration-500 ease-out" },
    { id: 2, name: "2. iOS Slide-Left", class: "animate-in fade-in slide-in-from-right-16 duration-400 ease-out" },
    { id: 3, name: "3. Smooth Fade-In", class: "animate-in fade-in duration-700 ease-in-out" },
    { id: 4, name: "4. Scale-Up Pop", class: "animate-in fade-in zoom-in-95 duration-450 cubic-bezier(0.34,1.56,0.64,1)" },
    { id: 5, name: "5. Scale-Down Float", class: "animate-in fade-in zoom-out-105 duration-500 ease-out" },
    { id: 6, name: "6. Spin & Slide", class: "animate-in fade-in spin-in-6 slide-in-from-left-8 duration-600 ease-out" },
    { id: 7, name: "7. Origami Flip", class: "animate-in fade-in duration-500 [transform-style:preserve-3d] [backface-visibility:hidden] [perspective:600px] animate-[flipIn_0.6s_ease-out]" },
    { id: 8, name: "8. Cyberpunk Glitch", class: "animate-in fade-in animate-[glitchIn_0.3s_linear]" },
    { id: 9, name: "9. Staggered Rows", class: "staggered-entry" },
    { id: 10, name: "10. Elastic Snap", class: "animate-in fade-in slide-in-from-bottom-12 duration-600 [animation-timing-function:cubic-bezier(0.175,0.885,0.32,1.275)]" },
    { id: 11, name: "11. Left-Gate Pivot", class: "animate-in fade-in origin-left [transform:rotateY(-25deg)] duration-500 ease-out" },
    { id: 12, name: "12. Right-Gate Pivot", class: "animate-in fade-in origin-right [transform:rotateY(25deg)] duration-500 ease-out" },
    { id: 13, name: "13. Top Liquid Drop", class: "animate-in fade-in slide-in-from-top-16 duration-600 ease-out" },
    { id: 14, name: "14. Shimmer Glint Reveal", class: "animate-in fade-in duration-500 relative overflow-hidden" },
    { id: 15, name: "15. Split Page Open", class: "animate-in fade-in duration-500 [transform:scale(0.95)] animate-[splitOpen_0.5s_ease-out_forwards]" }
  ];

  const triggerTransition = (id: number) => {
    setActiveTransition(id);
    setDemoKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background pb-32 font-dm-sans relative overflow-hidden">
      
      {/* Custom Styles Injection */}
      <style jsx global>{`
        @keyframes flipIn {
          0% { transform: perspective(600px) rotateX(-20deg); opacity: 0; }
          100% { transform: perspective(600px) rotateX(0deg); opacity: 1; }
        }
        @keyframes glitchIn {
          0% { transform: skewX(-8deg); opacity: 0; filter: hue-rotate(90deg); }
          50% { transform: skewX(8deg); opacity: 0.8; }
          100% { transform: skewX(0deg); opacity: 1; }
        }
        @keyframes splitOpen {
          0% { transform: scale(0.96) translateY(10px); }
          100% { transform: scale(1) translateY(0); }
        }
        .stagger-child-1 { animation: fadeIn 0.4s ease-out forwards; opacity: 0; }
        .stagger-child-2 { animation: fadeIn 0.4s ease-out 150ms forwards; opacity: 0; }
        .stagger-child-3 { animation: fadeIn 0.4s ease-out 300ms forwards; opacity: 0; }
        @keyframes fadeIn {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        <PageHeader title="Page transitions" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          
          {/* Controls column */}
          <div className="bg-card rounded-2xl p-6 border border-border/40 shadow-sm space-y-6">
            <div>
              <h2 className="text-sm font-black text-muted-foreground/60 uppercase tracking-widest mb-3">
                Transition Styles
              </h2>
              <div className="grid grid-cols-1 gap-2 max-h-[360px] overflow-y-auto pr-2">
                {transitions.map(t => (
                  <button
                    key={t.id}
                    onClick={() => triggerTransition(t.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${activeTransition === t.id ? 'bg-primary/10 border-primary shadow-sm' : 'bg-muted/20 border-transparent hover:bg-muted/40'}`}
                  >
                    <div className="font-bold text-sm">{t.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setDemoKey(prev => prev + 1)}
              className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              Re-Trigger Active Transition
            </button>
          </div>

          {/* Rendering Preview screen */}
          <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-6 min-h-[400px] relative overflow-hidden flex flex-col">
            <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest mb-4">View Screen Preview</div>
            
            {/* The Outer Animated Container wrapper simulating a page load */}
            <div 
              key={demoKey} 
              className={`flex-1 flex flex-col space-y-6 ${activeTransition !== 9 ? (transitions.find(t => t.id === activeTransition)?.class || "") : ""}`}
            >
              
              {/* Card 1 */}
              <div className={`bg-muted/30 border border-border/40 p-4 rounded-xl flex items-center justify-between ${activeTransition === 9 ? 'stagger-child-1 translate-y-4' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><Calendar size={18} /></div>
                  <div>
                    <div className="font-bold text-xs">Expense Logger</div>
                    <div className="text-[9px] text-muted-foreground">Save entry details</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>

              {/* Card 2 */}
              <div className={`bg-muted/30 border border-border/40 p-4 rounded-xl flex items-center justify-between ${activeTransition === 9 ? 'stagger-child-2 translate-y-4' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center"><Landmark size={18} /></div>
                  <div>
                    <div className="font-bold text-xs">Accounts Registry</div>
                    <div className="text-[9px] text-muted-foreground">Update bank values</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>

              {/* Card 3 */}
              <div className={`bg-muted/30 border border-border/40 p-4 rounded-xl flex items-center justify-between ${activeTransition === 9 ? 'stagger-child-3 translate-y-4' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center"><Activity size={18} /></div>
                  <div>
                    <div className="font-bold text-xs">Workout Logger</div>
                    <div className="text-[9px] text-muted-foreground">Log daily performance</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
