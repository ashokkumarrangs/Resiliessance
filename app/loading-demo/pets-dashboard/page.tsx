"use client";
import React, { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Calendar, Plus, Heart, Bone, ShieldAlert, Sparkles, ChevronRight, Activity, Eye, Stethoscope, Droplet, User } from "lucide-react";

export default function PetsDashboardDemoPage() {
  const [activeTab, setActiveTab] = useState<number>(11); // Default to the consolidated mockup
  const [demoPet, setDemoPet] = useState("Leo (Golden Retriever)");

  const designs = [
    { id: 11, name: "★ 11. Consolidated Pet Profile Summary (Recommended)", desc: "Activity intervals, next 3 vaccinations, and detailed grooming history" },
    { id: 1, name: "1. Feeding Trackers", desc: "Horizontal progress bar logs for feeding, hydration, and treats" },
    { id: 2, name: "2. Tactile Quick Actions", desc: "Instant log buttons with action indicators" },
    { id: 3, name: "3. Tabbed Multi-Pet Switcher", desc: "Minimal list header toggling multiple profiles" },
    { id: 4, name: "4. Status List Cards", desc: "Compact indicator list with color alert badges" },
    { id: 5, name: "5. Medical Event Log", desc: "Vet visits, vaccines, and medication timelines" },
    { id: 6, name: "6. Wellness Rings", desc: "Visual health ring metrics (Diet, Activity, Sleep)" },
    { id: 7, name: "7. Profile Avatar Focus", desc: "A prominent card layout highlighting pet details" },
    { id: 8, name: "8. Metric Highlights Grid", desc: "Box grid tracking weight, age, and records" },
    { id: 9, name: "9. Reminder Timetable", desc: "Chronological agenda for daily to-dos" },
    { id: 10, name: "10. Premium Glassmorphic Stats", desc: "Dark theme stats card with color indicators" }
  ];

  return (
    <div className="min-h-screen bg-background pb-32 font-dm-sans relative overflow-hidden">
      
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        <PageHeader title="Pet Dashboard Mockups" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          
          {/* Controls list */}
          <div className="bg-card rounded-2xl p-6 border border-border/40 shadow-sm space-y-6">
            <div>
              <h2 className="text-sm font-black text-muted-foreground/60 uppercase tracking-widest mb-3">
                Select Design
              </h2>
              <div className="grid grid-cols-1 gap-2 max-h-[360px] overflow-y-auto pr-2">
                {designs.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setActiveTab(d.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${activeTab === d.id ? 'bg-primary/10 border-primary shadow-sm' : 'bg-muted/20 border-transparent hover:bg-muted/40'}`}
                  >
                    <div className="font-bold text-sm">{d.name}</div>
                    <div className="text-[11px] text-muted-foreground">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Rendering Box */}
          <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-6 min-h-[350px] flex flex-col justify-center relative">
            <div className="absolute top-4 left-4 text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">Dashboard Preview</div>
            
            <div className="w-full mt-4">
              
              {/* DESIGN 11: CONSOLIDATED PET SUMMARY PROFILE */}
              {activeTab === 11 && (
                <div className="space-y-4">
                  {/* Pet Header Profile */}
                  <div className="flex items-center gap-3 bg-muted/10 p-3 rounded-xl border border-border/30">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black">L</div>
                    <div>
                      <h4 className="font-black text-xs text-foreground">Leo (Golden Retriever)</h4>
                      <p className="text-[9px] text-muted-foreground">32.4 kg • 2 Years Old</p>
                    </div>
                  </div>

                  {/* Activity Metric Section */}
                  <div className="bg-card p-3 rounded-xl border border-border/40 flex justify-between items-center shadow-sm">
                    <div>
                      <span className="text-xs font-black block">Active Exercise</span>
                      <span className="text-[9px] text-muted-foreground">Last session: Running in Park</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">2 Days Ago</span>
                    </div>
                  </div>

                  {/* Grooming Profile (Moved Above Medical) */}
                  <div className="bg-muted/10 border border-border/20 p-3 rounded-xl flex items-center justify-between text-xs font-bold">
                    <div>
                      <span className="block text-foreground">Anti-Tick Grooming</span>
                      <span className="text-[9px] text-muted-foreground font-normal">Groomed with: Himalaya Erina-EP Shampoo</span>
                    </div>
                    <span className="text-[9px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-md">6 Days Ago</span>
                  </div>

                  {/* Next 3 Medical Dates */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-muted/10 border border-border/20 p-2 rounded-lg text-center">
                      <span className="text-[8px] font-bold text-muted-foreground block truncate">RABIES VAX</span>
                      <span className="text-[10px] font-black text-rose-500">18 Jul</span>
                    </div>
                    <div className="bg-muted/10 border border-border/20 p-2 rounded-lg text-center">
                      <span className="text-[8px] font-bold text-muted-foreground block truncate">DEWORM TAB</span>
                      <span className="text-[10px] font-black text-amber-500">24 Jul</span>
                    </div>
                    <div className="bg-muted/10 border border-border/20 p-2 rounded-lg text-center">
                      <span className="text-[8px] font-bold text-muted-foreground block truncate">ANNUAL CKUP</span>
                      <span className="text-[10px] font-black text-primary">12 Aug</span>
                    </div>
                  </div>
                </div>
              )}

              {/* DESIGN 1: FEED TRACKERS */}
              {activeTab === 1 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-muted-foreground/80 uppercase tracking-wider mb-2">🐾 Leo\\'s Day</h3>
                  <div className="space-y-3">
                    {/* Progress 1 */}
                    <div className="space-y-1 bg-muted/20 border border-border/20 p-3 rounded-xl">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="flex items-center gap-1.5"><Bone size={12} className="text-amber-500" /> Morning Feed</span>
                        <span className="text-primary">Completed</span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden mt-1.5">
                        <div className="bg-emerald-500 h-full w-full"></div>
                      </div>
                    </div>
                    {/* Progress 2 */}
                    <div className="space-y-1 bg-muted/20 border border-border/20 p-3 rounded-xl">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="flex items-center gap-1.5"><Droplet size={12} className="text-blue-500" /> Hydration</span>
                        <span className="text-muted-foreground">1.2L / 2L</span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden mt-1.5">
                        <div className="bg-blue-500 h-full w-[60%]"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DESIGN 2: TACTILE QUICK ACTIONS */}
              {activeTab === 2 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-muted-foreground/80 uppercase tracking-wider mb-2">🐾 Quick Logs</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex flex-col items-center justify-center gap-1 text-emerald-500 hover:bg-emerald-500/20 active:scale-95 transition-all">
                      <Bone size={18} />
                      <span className="text-[10px] font-black uppercase">Log Food</span>
                    </button>
                    <button className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl flex flex-col items-center justify-center gap-1 text-blue-500 hover:bg-blue-500/20 active:scale-95 transition-all">
                      <Droplet size={18} />
                      <span className="text-[10px] font-black uppercase">Log Water</span>
                    </button>
                    <button className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-xl flex flex-col items-center justify-center gap-1 text-purple-500 hover:bg-purple-500/20 active:scale-95 transition-all">
                      <Activity size={18} />
                      <span className="text-[10px] font-black uppercase">Log Walk</span>
                    </button>
                    <button className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex flex-col items-center justify-center gap-1 text-rose-500 hover:bg-rose-500/20 active:scale-95 transition-all">
                      <Heart size={18} />
                      <span className="text-[10px] font-black uppercase">Log Health</span>
                    </button>
                  </div>
                </div>
              )}

              {/* DESIGN 3: TABBED MULTI-PET SWITCHER */}
              {activeTab === 3 && (
                <div className="space-y-4">
                  <div className="flex bg-muted/60 p-1 rounded-xl border border-border/20 mb-3">
                    {["Leo", "Bella", "Coco"].map(p => (
                      <button 
                        key={p} 
                        onClick={() => setDemoPet(p)} 
                        className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${demoPet.startsWith(p) ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="bg-muted/20 border border-border/20 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black">{demoPet[0]}</div>
                      <div>
                        <div className="font-bold text-xs">{demoPet}</div>
                        <div className="text-[9px] text-muted-foreground">Active and healthy today</div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </div>
                </div>
              )}

              {/* DESIGN 4: STATUS LIST CARDS */}
              {activeTab === 4 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-muted-foreground/80 uppercase tracking-wider mb-1">🐾 Health Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted/10 border border-border/25 rounded-xl">
                      <span className="text-xs font-bold">Vaccinations</span>
                      <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full uppercase">Up to date</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/10 border border-border/25 rounded-xl">
                      <span className="text-xs font-bold">Next Vet Visit</span>
                      <span className="text-[9px] font-black bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full uppercase">In 12 days</span>
                    </div>
                  </div>
                </div>
              )}

              {/* DESIGN 5: MEDICAL EVENT LOG */}
              {activeTab === 5 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-muted-foreground/80 uppercase tracking-wider mb-2">🐾 Medical History</h3>
                  <div className="relative border-l border-border pl-4 space-y-4 ml-2">
                    <div className="relative">
                      <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 bg-primary rounded-full"></div>
                      <div className="text-xs font-bold">Rabies Vaccine Dose 3</div>
                      <div className="text-[9px] text-muted-foreground">Logged on 10/07/2026</div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
                      <div className="text-xs font-bold">Deworming Tablet</div>
                      <div className="text-[9px] text-muted-foreground">Due in 5 days</div>
                    </div>
                  </div>
                </div>
              )}

              {/* DESIGN 6: CIRCULAR WELLNESS RINGS */}
              {activeTab === 6 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-muted-foreground/80 uppercase tracking-wider mb-2">🐾 Wellness Metrics</h3>
                  <div className="flex items-center justify-around py-2">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="relative w-12 h-12 rounded-full border-4 border-emerald-500/20 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-emerald-500 animate-pulse"></div>
                        <span className="text-[9px] font-black text-emerald-500">80%</span>
                      </div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">Diet</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="relative w-12 h-12 rounded-full border-4 border-blue-500/20 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-blue-500 animate-pulse"></div>
                        <span className="text-[9px] font-black text-blue-500">55%</span>
                      </div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">Hydra</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="relative w-12 h-12 rounded-full border-4 border-purple-500/20 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-r-purple-500 animate-pulse"></div>
                        <span className="text-[9px] font-black text-purple-500">92%</span>
                      </div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">Sleep</span>
                    </div>
                  </div>
                </div>
              )}

              {/* DESIGN 7: PROFILE AVATAR FOCUS */}
              {activeTab === 7 && (
                <div className="bg-muted/10 border border-border/20 rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><User size={24} /></div>
                  <div className="flex-1 space-y-1">
                    <h3 className="text-sm font-black text-foreground">Leo</h3>
                    <div className="text-[10px] text-muted-foreground font-bold">2 Year Old Golden Retriever</div>
                    <div className="flex gap-1.5 mt-2">
                      <span className="text-[8px] font-black tracking-wider uppercase px-2 py-0.5 bg-muted/40 border border-border/20 rounded-full text-muted-foreground">32.4 kg</span>
                      <span className="text-[8px] font-black tracking-wider uppercase px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/20 rounded-full text-emerald-500">Healthy</span>
                    </div>
                  </div>
                </div>
              )}

              {/* DESIGN 8: METRIC HIGHLIGHTS GRID */}
              {activeTab === 8 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-muted-foreground/80 uppercase tracking-wider mb-1">🐾 Quick Stats</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/20 border border-border/20 p-3.5 rounded-xl text-center">
                      <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-wider block mb-0.5">Average Weight</span>
                      <span className="text-sm font-black text-primary">32.4 kg</span>
                    </div>
                    <div className="bg-muted/20 border border-border/20 p-3.5 rounded-xl text-center">
                      <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-wider block mb-0.5">Age</span>
                      <span className="text-sm font-black text-primary">2.4 Years</span>
                    </div>
                  </div>
                </div>
              )}

              {/* DESIGN 9: REMINDER TIMETABLE */}
              {activeTab === 9 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-muted-foreground/80 uppercase tracking-wider mb-2">🐾 Leo\\'s Schedule</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-muted/15 border border-border/20 rounded-xl">
                      <span className="text-[9px] font-black text-muted-foreground/40 w-12 shrink-0">08:00 AM</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      <span className="text-xs font-bold">Morning Feed (Kibble)</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/15 border border-border/20 rounded-xl">
                      <span className="text-[9px] font-black text-muted-foreground/40 w-12 shrink-0">05:30 PM</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                      <span className="text-xs font-bold">Evening Walk (Park)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* DESIGN 10: PREMIUM GLASSMORPHIC STATS */}
              {activeTab === 10 && (
                <div className="relative overflow-hidden bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Pet Wellness</h3>
                      <h4 className="text-lg font-black text-white">Leo</h4>
                    </div>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">ACTIVE</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-2 border-t border-white/5">
                    <div className="text-center">
                      <span className="text-[8px] font-bold text-slate-500 block uppercase">Feed</span>
                      <span className="text-xs font-black text-white">100%</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[8px] font-bold text-slate-500 block uppercase">Walk</span>
                      <span className="text-xs font-black text-white">45 min</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[8px] font-bold text-slate-500 block uppercase">Heart</span>
                      <span className="text-xs font-black text-white">72 bpm</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
