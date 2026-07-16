"use client";
import React, { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { CheckCircle2, AlertCircle, X, Sparkles, Flame, ShieldAlert, BellRing } from "lucide-react";

interface ToastProps {
  id: number;
  message: string;
  type: "success" | "error";
  styleId: number;
  onClose: () => void;
}

const ToastItem = ({ message, type, styleId, onClose }: ToastProps) => {
  const isErr = type === "error";
  
  // Custom Class Mapping for all 15 options
  const styleClasses: Record<number, string> = {
    1: `animate-[springSlide_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards] border-l-4 ${isErr ? 'border-rose-500 bg-card' : 'border-emerald-500 bg-card'} shadow-lg rounded-r-xl p-4 flex items-center justify-between gap-4 w-80`,
    2: `animate-[expandDot_0.4s_ease-out_forwards] overflow-hidden ${isErr ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'} rounded-full py-3 px-6 flex items-center justify-between gap-4 w-80 font-black`,
    3: `animate-[iosScale_0.3s_cubic-bezier(0.34,1.56,0.64,1)_forwards] bg-card/95 text-foreground rounded-2xl p-4 shadow-[0_15px_30px_rgba(0,0,0,0.08)] border border-border/40 flex items-center justify-between gap-4 w-80`,
    4: `animate-[deckStack_0.5s_ease_forwards] bg-card border border-border rounded-xl p-4 shadow-xl flex items-center justify-between gap-4 w-80`,
    5: `animate-[glassGlow_0.6s_ease_forwards] backdrop-blur-md bg-card/40 border border-white/10 rounded-2xl p-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] flex items-center justify-between gap-4 w-80 relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r ${isErr ? 'after:from-rose-500/5 after:to-transparent' : 'after:from-emerald-500/5 after:to-transparent'}`,
    6: `animate-[liquidDrop_0.6s_cubic-bezier(0.6,0.05,0.28,1.2)_forwards] bg-card border border-border/50 rounded-b-2xl rounded-t-lg p-4 shadow-lg flex items-center justify-between gap-4 w-80 border-t-4 ${isErr ? 'border-t-rose-500' : 'border-t-emerald-500'}`,
    7: `animate-[pageFold_0.5s_ease_forwards] bg-card border border-border rounded-lg rounded-tl-3xl p-4 shadow-md flex items-center justify-between gap-4 w-80`,
    8: `animate-[particleBurn_0.8s_ease-out_forwards] bg-zinc-950 text-white rounded-lg p-4 flex items-center justify-between gap-4 w-80 border border-zinc-800`,
    9: `animate-[chunkyNeo_0.2s_ease-in-out_forwards] border-4 border-black ${isErr ? 'bg-rose-400' : 'bg-emerald-400'} text-black rounded-none p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-4 w-80 font-black`,
    10: `animate-[cyberGlitch_0.3s_linear_forwards] font-mono bg-zinc-900 border border-cyan-500 text-cyan-400 p-4 shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center justify-between gap-4 w-80 relative before:absolute before:inset-y-0 before:left-0 before:w-1 ${isErr ? 'before:bg-rose-500 text-rose-400 border-rose-500' : 'before:bg-cyan-500'}`,
    11: `animate-[jellySquish_0.6s_ease_forwards] bg-card border border-border rounded-xl p-4 shadow-lg flex items-center justify-between gap-4 w-80`,
    12: `animate-[coinBounce_0.8s_ease_forwards] bg-card border border-border rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4 w-80`,
    13: `animate-[springSlide_0.5s_cubic-bezier(0.175,0.885,0.32,1)_forwards] bg-card border border-border rounded-xl p-4 shadow-lg flex items-center justify-between gap-4 w-80 relative overflow-hidden`,
    14: `animate-[springSlide_0.5s_cubic-bezier(0.175,0.885,0.32,1)_forwards] bg-transparent border-2 ${isErr ? 'border-rose-500/40 text-rose-500 bg-rose-500/5' : 'border-emerald-500/40 text-emerald-500 bg-emerald-500/5'} rounded-xl p-4 flex items-center justify-between gap-4 w-80 backdrop-blur-sm`,
    15: `animate-[iosScale_0.3s_ease_forwards] bg-card border border-border rounded-xl p-4 shadow-lg flex items-center justify-between gap-4 w-80`,
    16: `bg-card border border-border shadow-md rounded-lg p-4 flex items-center justify-between gap-4 w-80 text-foreground`,
    17: `animate-[jellySquish_0.6s_ease_forwards] ${isErr ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'} rounded-full py-3 px-6 flex items-center justify-between gap-4 w-80 font-black`
  };

  return (
    <div className={styleClasses[styleId] || styleClasses[1]}>
      <div className="flex items-center gap-3">
        {isErr ? (
          <AlertCircle className={`w-5 h-5 shrink-0 ${styleId === 9 ? 'text-black' : styleId === 10 ? 'text-rose-400' : 'text-rose-500'}`} />
        ) : (
          <CheckCircle2 className={`w-5 h-5 shrink-0 ${styleId === 9 ? 'text-black' : styleId === 10 ? 'text-cyan-400' : 'text-emerald-500'}`} />
        )}
        <span className={`text-sm ${styleId === 9 ? 'text-black font-black' : 'font-bold'}`}>{message}</span>
      </div>
      <button onClick={onClose} className="p-1 hover:bg-muted/80 rounded-md transition-colors shrink-0">
        <X className={`w-4 h-4 ${styleId === 9 ? 'text-black' : 'text-muted-foreground'}`} />
      </button>

      {/* Progress Bar overlay for Style 13 */}
      {styleId === 13 && (
        <div className={`absolute bottom-0 left-0 h-1 ${isErr ? 'bg-rose-500' : 'bg-emerald-500'} animate-[progressFill_3s_linear_forwards]`} style={{ width: "100%" }}></div>
      )}
    </div>
  );
};

export default function ToastDemoPage() {
  const [toasts, setToasts] = useState<Omit<ToastProps, "onClose">[]>([]);
  const [activeStyle, setActiveStyle] = useState<number>(1);

  const triggerToast = (type: "success" | "error") => {
    const id = Date.now();
    const message = type === "success" ? "Entry saved successfully!" : "Failed to save entry.";
    setToasts(prev => [...prev, { id, message, type, styleId: activeStyle }]);
    
    // Auto remove after 3.5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const styles = [
    { id: 1, name: "1. Spring Slide-In", desc: "Squirms in with spring-loaded physical bounce" },
    { id: 2, name: "2. Expanding Pill", desc: "Grows outward from a center point to wrap text" },
    { id: 3, name: "3. iOS Elastic Scale", desc: "Elastic scaling pop-up like Apple notifications" },
    { id: 4, name: "4. Stacked Cards", desc: "New cards slide in stacking in front of old cards" },
    { id: 5, name: "5. Glassmorphism Radial", desc: "Soft frosted glass panel with ambient glow borders" },
    { id: 6, name: "6. Liquid Bezel Drop", desc: "Drops smoothly down from the screen bezel" },
    { id: 7, name: "7. Origami Fold", desc: "Page folding paper-peel corner entry" },
    { id: 8, name: "8. Smoke Particle", desc: "Fades in with light drifting particle smoke" },
    { id: 9, name: "9. Neobrutalist Block", desc: "Thick lines, retro block styling, stiff bounce" },
    { id: 10, name: "10. Cyberpunk Terminal", desc: "Glowing chromatic cyan scanner line slide" },
    { id: 11, name: "11. Jelly Squish", desc: "Wobbles and stretches like visual jelly" },
    { id: 12, name: "12. Bouncing Coin", desc: "Bounces twice on an invisible table floor" },
    { id: 13, name: "13. Progress Bar Fill", desc: "Clean timer bar ticking along the bottom edge" },
    { id: 14, name: "14. Ghost Neon Outline", desc: "Transparent dark cards with glowing neon borders" },
    { id: 15, name: "15. Split Card", desc: "Icon and text panel sliding open in depth" },
    { id: 16, name: "16. Current Default Toast", desc: "The standard default Sonner design currently rendering in the app" },
    { id: 17, name: "17. Custom Jelly Pill (Center)", desc: "Pill shape (Style 2 UI) with Jelly wobble animation (Style 11 motion) placed in the center of the screen" }
  ];

  return (
    <div className="min-h-screen bg-background pb-32 font-dm-sans relative overflow-hidden">
      
      {/* Styles Injection */}
      <style jsx global>{`
        @keyframes springSlide {
          0% { transform: translateY(40px) scale(0.9); opacity: 0; }
          60% { transform: translateY(-4px) scale(1.02); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes expandDot {
          0% { width: 50px; opacity: 0; border-radius: 9999px; }
          50% { width: 320px; opacity: 1; }
          100% { width: 320px; opacity: 1; border-radius: 9999px; }
        }
        @keyframes iosScale {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes deckStack {
          0% { transform: scale(0.9) translateY(20px); opacity: 0; z-index: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; z-index: 10; }
        }
        @keyframes glassGlow {
          0% { backdrop-filter: blur(0px); opacity: 0; }
          100% { backdrop-filter: blur(12px); opacity: 1; }
        }
        @keyframes liquidDrop {
          0% { transform: translateY(-100px); }
          70% { transform: translateY(10px); }
          100% { transform: translateY(0); }
        }
        @keyframes pageFold {
          0% { transform: rotate3d(1, 1, 0, 90deg); opacity: 0; }
          100% { transform: rotate3d(0, 0, 0, 0deg); opacity: 1; }
        }
        @keyframes particleBurn {
          0% { filter: blur(4px); opacity: 0; transform: scale(0.95); }
          100% { filter: blur(0px); opacity: 1; transform: scale(1); }
        }
        @keyframes chunkyNeo {
          0% { transform: translate(4px, 4px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes cyberGlitch {
          0% { transform: skewX(-15deg); opacity: 0; }
          50% { transform: skewX(15deg); opacity: 0.8; }
          100% { transform: skewX(0deg); opacity: 1; }
        }
        @keyframes jellySquish {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1, 0.9); }
          75% { transform: scale(0.95, 1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes coinBounce {
          0% { transform: translateY(-50px); opacity: 0; }
          40% { transform: translateY(0); }
          65% { transform: translateY(-15px); }
          85% { transform: translateY(0); }
          95% { transform: translateY(-4px); }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes progressFill {
          0% { width: 100%; }
          100% { width: 0%; }
        }
      `}</style>

      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        <PageHeader title="Toast Animation Demo" />
        
        <div className="bg-card rounded-2xl p-6 border border-border/40 shadow-sm space-y-6 mt-6">
          <div className="space-y-2">
            <h2 className="text-sm font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2">
              <BellRing size={16} /> Choose Toast Variant
            </h2>
            <div className="grid grid-cols-1 gap-2 max-h-[320px] overflow-y-auto pr-2">
              {styles.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveStyle(s.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${activeStyle === s.id ? 'bg-primary/10 border-primary shadow-sm' : 'bg-muted/20 border-transparent hover:bg-muted/40'}`}
                >
                  <div className="font-bold text-sm">{s.name}</div>
                  <div className="text-[11px] text-muted-foreground">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => triggerToast("success")}
              className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-950/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>Trigger Success</span>
            </button>
            <button
              onClick={() => triggerToast("error")}
              className="flex-1 h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-sm shadow-xl shadow-rose-950/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <AlertCircle size={16} />
              <span>Trigger Error</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Toasts container */}
      {/* Bottom Right Floating Toasts container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.filter(t => t.styleId !== 17).map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem
              id={t.id}
              message={t.message}
              type={t.type}
              styleId={t.styleId}
              onClose={() => removeToast(t.id)}
            />
          </div>
        ))}
      </div>

      {/* Center Screen Floating Toasts container for Style 17 */}
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 pointer-events-none">
        {toasts.filter(t => t.styleId === 17).map(t => (
          <div key={t.id} className="pointer-events-auto shadow-2xl">
            <ToastItem
              id={t.id}
              message={t.message}
              type={t.type}
              styleId={t.styleId}
              onClose={() => removeToast(t.id)}
            />
          </div>
        ))}
      </div>

    </div>
  );
}
