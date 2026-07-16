"use client";
import React, { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { RefreshCw, Play, Sparkles } from "lucide-react";

export default function LoadingDemoPage() {
  const [activeAnimation, setActiveAnimation] = useState<number>(1);
  const [loadingText, setLoadingText] = useState("Loading system records...");

  const animations = [
    // Current Types
    { id: 1, name: "1. 2x2 Grid Bounce (Current default)", desc: "Four blocks bouncing sequentially in a grid layout" },
    { id: 2, name: "2. Pulse Skeleton (Current default)", desc: "Translucent grey shapes pulsing to mimic future content layout" },
    { id: 3, name: "3. Micro Circular Ring (Current default)", desc: "Standard rotating ring spinner used inside buttons" },
    
    // 15 New Animation Options
    { id: 4, name: "4. Orbiting Rings", desc: "Two concentric loops rotating in opposite directions" },
    { id: 5, name: "5. DNA Double Helix", desc: "Alternating vertical lines pulsing like a rotating strand" },
    { id: 6, name: "6. Fluid Morphing Liquid", desc: "A blob changing shapes organically" },
    { id: 7, name: "7. Ripple Radar", desc: "Concentric waves expanding outwards" },
    { id: 8, name: "8. Typing Terminal Console", desc: "Command prompt cursor cursor blink" },
    { id: 9, name: "9. Newton\\'s Cradle", desc: "Five swinging circles hitting back and forth" },
    { id: 10, name: "10. Infinite Loom Loop", desc: "A soft infinity track path tracing in real-time" },
    { id: 11, name: "11. Hourglass Sand Flip", desc: "A geometric hourglass rotating 180 degrees" },
    { id: 12, name: "12. Bar Code Scanner Line", desc: "A glowing red scan laser sliding up and down" },
    { id: 13, name: "13. Retro Arcade Pixel Block", desc: "Staggered 8-bit blocks sliding in a cycle" },
    { id: 14, name: "14. Sound Wave Matrix", desc: "Equalizer bar indicators moving up and down" },
    { id: 15, name: "15. Origami Folding Box", desc: "A square folding inwards continuously" },
    { id: 16, name: "16. Shimmer Gloss Overlay", desc: "A diagonal glint gloss swipe passing over text" },
    { id: 17, name: "17. Solar System Eclipse", desc: "A tiny moon sphere orbiting around a central hub" },
    { id: 18, name: "18. Elastic Dots Stretch", desc: "Three dots stretching and snapping together" }
  ];

  return (
    <div className="min-h-screen bg-background pb-32 font-dm-sans relative overflow-hidden">
      
      {/* Styles Injector */}
      <style jsx global>{`
        /* 4. Orbiting Rings */
        .ring-orb {
          border: 3px solid transparent;
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1.2s linear infinite;
        }
        
        /* 5. DNA Helix */
        .dna-dot {
          animation: helixPulse 1.2s ease-in-out infinite alternate;
        }

        /* 6. Morphing Blob */
        @keyframes morphBlob {
          0% { border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%; }
          50% { border-radius: 70% 30% 52% 48% / 60% 40% 60% 40%; }
          100% { border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%; }
        }

        /* 7. Ripple Waves */
        @keyframes rippleWave {
          0% { transform: scale(0.1); opacity: 1; }
          100% { transform: scale(1.2); opacity: 0; }
        }

        /* 9. Newton Cradle */
        @keyframes swingLeft {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(30deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes swingRight {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(-30deg); }
          100% { transform: rotate(0deg); }
        }

        /* 11. Hourglass */
        @keyframes sandFlip {
          0% { transform: rotate(0); }
          40% { transform: rotate(180deg); }
          50% { transform: rotate(180deg); }
          90% { transform: rotate(360deg); }
          100% { transform: rotate(360deg); }
        }

        /* 12. Laser Scan */
        @keyframes laserScan {
          0%, 100% { top: 0%; }
          50% { top: 100%; }
        }

        /* 14. Sound Wave */
        @keyframes soundWave {
          0%, 100% { height: 8px; }
          50% { height: 32px; }
        }

        /* 15. Folding Box */
        @keyframes foldBox {
          0% { transform: perspective(80px) rotateX(0deg) rotateY(0deg); }
          50% { transform: perspective(80px) rotateX(180deg) rotateY(0deg); }
          100% { transform: perspective(80px) rotateX(180deg) rotateY(180deg); }
        }

        /* 16. Shimmer */
        @keyframes shimmerSwipe {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(150%); }
        }

        /* 18. Elastic Dots */
        @keyframes elasticStretch {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(1.8); }
        }

        @keyframes helixPulse {
          0% { transform: scale(0.4); opacity: 0.3; }
          100% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          50% { opacity: .5; }
        }
      `}</style>

      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        <PageHeader title="Loading Animations" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          
          {/* Controls Column */}
          <div className="bg-card rounded-2xl p-6 border border-border/40 shadow-sm space-y-6">
            <div>
              <h2 className="text-sm font-black text-muted-foreground/60 uppercase tracking-widest mb-3">
                Select Loader Style
              </h2>
              <div className="grid grid-cols-1 gap-2 max-h-[360px] overflow-y-auto pr-2">
                {animations.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setActiveAnimation(a.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${activeAnimation === a.id ? 'bg-primary/10 border-primary shadow-sm' : 'bg-muted/20 border-transparent hover:bg-muted/40'}`}
                  >
                    <div className="font-bold text-sm">{a.name}</div>
                    <div className="text-[11px] text-muted-foreground">{a.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Custom Loading Message</label>
              <input 
                type="text" 
                value={loadingText} 
                onChange={e => setLoadingText(e.target.value)} 
                className="w-full h-11 bg-muted rounded-xl px-4 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Preview Container Column */}
          <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-6 flex flex-col items-center justify-center min-h-[300px] relative">
            <div className="absolute top-4 left-4 text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">Live Rendering Preview</div>
            
            <div className="h-40 flex items-center justify-center w-full">
              
              {/* Render Selected Animation */}
              {activeAnimation === 1 && (
                <div className="grid grid-cols-2 gap-1.5 animate-pulse">
                  <div className="w-4 h-4 bg-primary rounded-sm animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-4 h-4 bg-primary/80 rounded-sm animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-4 h-4 bg-primary/60 rounded-sm animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  <div className="w-4 h-4 bg-primary/40 rounded-sm animate-bounce" style={{ animationDelay: "450ms" }}></div>
                </div>
              )}

              {activeAnimation === 2 && (
                <div className="w-64 space-y-4 animate-pulse">
                  <div className="h-4 bg-muted/80 rounded w-3/4"></div>
                  <div className="h-10 bg-muted/50 rounded-xl w-full"></div>
                  <div className="h-4 bg-muted/80 rounded w-1/2"></div>
                </div>
              )}

              {activeAnimation === 3 && (
                <div className="w-8 h-8 border-3 border-muted border-t-primary rounded-full animate-spin"></div>
              )}

              {activeAnimation === 4 && (
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 ring-orb"></div>
                  <div className="absolute inset-2 ring-orb" style={{ animationDirection: "reverse", animationDuration: "0.8s" }}></div>
                </div>
              )}

              {activeAnimation === 5 && (
                <div className="flex gap-2.5 items-center">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex flex-col gap-2.5 items-center">
                      <div className="w-2.5 h-2.5 bg-primary rounded-full dna-dot" style={{ animationDelay: `${i * 150}ms` }}></div>
                      <div className="w-0.5 h-6 bg-border/40"></div>
                      <div className="w-2.5 h-2.5 bg-primary/60 rounded-full dna-dot" style={{ animationDelay: `${(i * 150) + 300}ms` }}></div>
                    </div>
                  ))}
                </div>
              )}

              {activeAnimation === 6 && (
                <div className="w-20 h-20 bg-primary/25 border-2 border-primary/40 animate-[morphBlob_4s_ease-in-out_infinite]"></div>
              )}

              {activeAnimation === 7 && (
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="absolute w-full h-full border-2 border-primary rounded-full animate-[rippleWave_1.5s_ease-out_infinite]"></div>
                  <div className="absolute w-full h-full border-2 border-primary rounded-full animate-[rippleWave_1.5s_ease-out_infinite]" style={{ animationDelay: "0.5s" }}></div>
                  <div className="w-4 h-4 bg-primary rounded-full"></div>
                </div>
              )}

              {activeAnimation === 8 && (
                <div className="font-mono text-sm text-primary flex items-center gap-1 font-bold">
                  <span>SYSTEM_INIT &gt;</span>
                  <span className="w-2 h-4 bg-primary animate-[pulse_1s_infinite]"></span>
                </div>
              )}

              {activeAnimation === 9 && (
                <div className="flex items-center pt-8">
                  <div className="w-4 h-4 bg-primary rounded-full origin-[center_-20px] animate-[swingLeft_0.6s_ease-out_infinite_alternate]"></div>
                  <div className="w-4 h-4 bg-primary/95 rounded-full"></div>
                  <div className="w-4 h-4 bg-primary/90 rounded-full"></div>
                  <div className="w-4 h-4 bg-primary/80 rounded-full origin-[center_-20px] animate-[swingRight_0.6s_ease-out_infinite_alternate]"></div>
                </div>
              )}

              {activeAnimation === 10 && (
                <div className="relative w-16 h-8 flex items-center justify-center">
                  <div className="absolute w-12 h-12 border-4 border-dashed border-primary/45 rounded-full animate-spin"></div>
                  <div className="absolute w-6 h-6 border-4 border-dashed border-primary/65 rounded-full animate-spin" style={{ animationDirection: "reverse" }}></div>
                </div>
              )}

              {activeAnimation === 11 && (
                <div className="w-10 h-16 border-2 border-primary rounded-t-xl rounded-b-xl flex flex-col justify-between p-1 animate-[sandFlip_2.5s_infinite]">
                  <div className="h-6 bg-primary rounded-sm w-full"></div>
                  <div className="h-0.5 bg-border/40 mx-auto w-1"></div>
                  <div className="h-1 bg-primary/40 rounded-sm w-full"></div>
                </div>
              )}

              {activeAnimation === 12 && (
                <div className="relative w-48 h-10 border border-border bg-muted/10 rounded-md overflow-hidden">
                  <div className="absolute left-0 right-0 h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-[laserScan_2s_ease-in-out_infinite]"></div>
                </div>
              )}

              {activeAnimation === 13 && (
                <div className="flex gap-1 items-end h-8">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-3 bg-primary animate-pulse" style={{ height: "100%", animationDelay: `${i * 200}ms` }}></div>
                  ))}
                </div>
              )}

              {activeAnimation === 14 && (
                <div className="flex gap-1.5 items-center h-10">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-1.5 bg-primary rounded-full animate-[soundWave_1s_ease-in-out_infinite]" style={{ animationDelay: `${i * 180}ms` }}></div>
                  ))}
                </div>
              )}

              {activeAnimation === 15 && (
                <div className="w-10 h-10 bg-primary/30 border-2 border-primary rounded-md animate-[foldBox_1.8s_ease_infinite]"></div>
              )}

              {activeAnimation === 16 && (
                <div className="relative overflow-hidden bg-muted/30 rounded-xl p-4 w-60 border border-border/40">
                  <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-card/30 to-transparent -translate-x-full animate-[shimmerSwipe_1.5s_infinite]"></div>
                </div>
              )}

              {activeAnimation === 17 && (
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="w-6 h-6 bg-primary rounded-full"></div>
                  <div className="absolute w-2 h-2 bg-primary/75 rounded-full origin-[24px_center] animate-spin" style={{ animationDuration: "2s" }}></div>
                </div>
              )}

              {activeAnimation === 18 && (
                <div className="flex gap-2 items-center justify-center animate-[elasticStretch_1.2s_ease-in-out_infinite]">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <div className="w-3 h-3 bg-primary/80 rounded-full"></div>
                  <div className="w-3 h-3 bg-primary/60 rounded-full"></div>
                </div>
              )}

            </div>

            <p className="text-[10px] font-black text-muted-foreground/60 tracking-widest uppercase text-center mt-4">
              {loadingText}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
