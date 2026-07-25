"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Folder, Notebook, Plus, Check, Trash2, ArrowLeft, ArrowRight, RefreshCw, Eye, EyeOff
} from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";
import { HABIT_TABS } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SubNav } from "@/components/SubNav";

const STEPS = [
  { id: "template", title: "Template" },
  { id: "identity", title: "Identity" },
  { id: "rules", title: "Rules" },
  { id: "preview", title: "Launch" }
];

const TEMPLATES = [
  { name: "Drink Water", emoji: "💧", color: "text-sky-500", bg: "bg-sky-500/10", group: "Health", target: 3, unit: "Liters" },
  { name: "Daily Gym", emoji: "🏋️", color: "text-emerald-500", bg: "bg-emerald-500/10", group: "Fitness", target: 1, unit: "Session" },
  { name: "Read Books", emoji: "📚", color: "text-amber-500", bg: "bg-amber-500/10", group: "Mindset", target: 15, unit: "Pages" },
  { name: "Meditate", emoji: "🧘", color: "text-purple-500", bg: "bg-purple-500/10", group: "Mindset", target: 10, unit: "Minutes" },
  { name: "Early Sleep", emoji: "💤", color: "text-indigo-500", bg: "bg-indigo-500/10", group: "Sleep", target: 8, unit: "Hours" },
];

const COLORS = [
  { name: "Emerald", text: "text-emerald-500", bg: "bg-emerald-500/10", fill: "bg-emerald-500" },
  { name: "Sky", text: "text-sky-500", bg: "bg-sky-500/10", fill: "bg-sky-500" },
  { name: "Amber", text: "text-amber-500", bg: "bg-amber-500/10", fill: "bg-amber-500" },
  { name: "Purple", text: "text-purple-500", bg: "bg-purple-500/10", fill: "bg-purple-500" },
  { name: "Rose", text: "text-rose-500", bg: "bg-rose-500/10", fill: "bg-rose-500" },
];

const EMOJIS = ["💧", "🏋️", "📚", "🧘", "💤", "🏃", "🥗", "🚶", "🧠", "🥬", "💊"];

export default function AddHabitV6Page() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Dynamic Habit state
  const [habitName, setHabitName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("💧");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [group, setGroup] = useState("Health");
  
  // Rule Metrics
  const [target, setTarget] = useState(1);
  const [unit, setUnit] = useState("Times");
  const [rulePreset, setRulePreset] = useState<"standard" | "strict" | "forgiving">("standard");
  const [loggingType, setLoggingType] = useState<"boolean" | "numeric">("boolean");
  const [frequency, setFrequency] = useState<"daily" | "event">("daily");

  // Apply templates
  const applyTemplate = (t: typeof TEMPLATES[0]) => {
    setHabitName(t.name);
    setSelectedEmoji(t.emoji);
    setGroup(t.group);
    setTarget(t.target);
    setUnit(t.unit);
    setLoggingType(t.target === 1 ? "boolean" : "numeric");
    setFrequency("daily");
    const colorObj = COLORS.find(c => c.text.includes(t.color.split("-")[1])) || COLORS[0];
    setSelectedColor(colorObj);
    setCurrentStep(1); // Proceed to Identity step immediately
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.push("/habits/manage");
    }
  };

  return (
    <PageWrapper
      title="Add Habit v2"
      reportHref="/reports/habits"
      sectionTabs={HABIT_TABS}
    >
      {/* ─── LIVE DYNAMIC DASHBOARD PREVIEW ─── */}
      <div className="mb-8 select-none">
        <div className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest mb-3 px-1">Live Dashboard Preview</div>
        <div className="bg-card rounded-2xl border border-border/40 p-5 shadow-zenith flex items-center gap-4 relative overflow-hidden transition-all duration-300">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-inner transition-colors duration-300 ${selectedColor.bg}`}>
            <span className="text-2xl">{selectedEmoji}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full transition-colors ${selectedColor.bg} ${selectedColor.text}`}>
                {group || "General"}
              </span>
              <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">
                {frequency === "daily" ? "Daily Habit" : "Event Tracker"}
              </span>
            </div>
            <h3 className="text-base font-black text-foreground truncate leading-tight transition-all">
              {habitName || "Name your Habit"}
            </h3>
            <p className="text-xs font-bold text-muted-foreground/60 mt-0.5">
              {loggingType === "boolean" ? "Logging: Done/Not Done" : `Goal: ${target} ${unit}`}
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-1">
            <div className={`w-3 h-3 rounded-full ${selectedColor.fill}`} />
            <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Active</span>
          </div>
        </div>
      </div>

      {/* Stepper Navigation */}
      <SubNav 
        items={STEPS.map(s => s.title)}
        activeItem={STEPS[currentStep].title}
        onChange={(val) => {
          const idx = STEPS.findIndex(s => s.title === val);
          setCurrentStep(idx);
        }}
        className="mb-8"
      />

      <Card className="rounded-2xl border border-border/40 shadow-sm bg-card overflow-hidden min-h-[350px]">
        <CardContent className="p-6">
          {/* STEP 1: TEMPLATE SELECTION */}
          {currentStep === 0 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="space-y-1">
                <h4 className="text-sm font-black uppercase tracking-wider text-foreground">Select a Template</h4>
                <p className="text-xs text-muted-foreground font-bold">Pick one to instantly populate name and target rules.</p>
              </div>
              
              <div className="grid grid-cols-1 gap-2.5">
                {TEMPLATES.map((t, idx) => (
                  <button 
                    key={idx}
                    onClick={() => applyTemplate(t)}
                    className="flex items-center justify-between p-4 bg-muted/20 border border-border/40 rounded-xl hover:bg-muted/40 hover:scale-[1.01] active:scale-95 transition-all text-left font-bold"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{t.emoji}</span>
                      <div>
                        <div className="text-sm font-black text-foreground">{t.name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.group} • {t.target} {t.unit}</div>
                      </div>
                    </div>
                    <span className="text-xs text-primary font-black">Choose →</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: IDENTITY SETUP */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Habit Title</Label>
                <Input 
                  placeholder="e.g. Read books, Stretch daily"
                  value={habitName}
                  onChange={e => setHabitName(e.target.value)}
                  className="h-14 text-base font-bold bg-muted/30 border border-border/40 focus:bg-card focus:border-primary transition-all rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Group / Category</Label>
                  <select 
                    value={group}
                    onChange={e => setGroup(e.target.value)}
                    className="w-full h-14 bg-muted/30 border border-border/40 rounded-xl px-4 text-sm font-bold text-foreground focus:outline-none"
                  >
                    <option>Health</option>
                    <option>Fitness</option>
                    <option>Mindset</option>
                    <option>Sleep</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Unit</Label>
                  <Input 
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    placeholder="Liters, Min, Times"
                    className="h-14 text-sm font-bold bg-muted/30 border border-border/40 rounded-xl"
                  />
                </div>
              </div>

              {/* Emoji Selector Grid */}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Icon / Emoji</Label>
                <div className="flex flex-wrap gap-2.5 bg-muted/10 p-3 rounded-xl border border-border/20">
                  {EMOJIS.map(emo => (
                    <button
                      type="button"
                      key={emo}
                      onClick={() => setSelectedEmoji(emo)}
                      className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl hover:scale-110 active:scale-95 transition-all
                        ${selectedEmoji === emo ? "bg-primary text-primary-foreground shadow-sm scale-105" : "bg-card border border-border/40 opacity-70"}`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selector Grid */}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Visual Theme</Label>
                <div className="flex gap-3 bg-muted/10 p-3 rounded-xl border border-border/20">
                  {COLORS.map(col => (
                    <button
                      type="button"
                      key={col.name}
                      onClick={() => setSelectedColor(col)}
                      className={`w-9 h-9 rounded-full ${col.fill} relative flex items-center justify-center transition-all hover:scale-105 active:scale-95`}
                    >
                      {selectedColor.name === col.name && (
                        <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-md">
                          <Check className="w-2.5 h-2.5 text-foreground stroke-[4]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: RULES CONFIGURATION */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Frequency Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Logging Frequency</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "daily", title: "Daily Log", desc: "Logged once a day" },
                    { id: "event", title: "Event Log", desc: "Log multiple times" }
                  ].map(f => (
                    <button
                      type="button"
                      key={f.id}
                      onClick={() => setFrequency(f.id as any)}
                      className={`p-3.5 rounded-xl border text-center font-bold transition-all active:scale-95
                        ${frequency === f.id 
                          ? "bg-primary/5 border-primary text-primary" 
                          : "bg-muted/10 border-border/30 text-muted-foreground/75 hover:bg-muted/30"}`}
                    >
                      <div className="text-sm font-black">{f.title}</div>
                      <div className="text-[9px] opacity-60 tracking-tight mt-0.5">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Type Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Logging Method</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "boolean", title: "Check-off", desc: "Done / Not Done" },
                    { id: "numeric", title: "Numeric Value", desc: "Log values or amounts" }
                  ].map(t => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => {
                        setLoggingType(t.id as any);
                        if (t.id === "boolean") setTarget(1);
                      }}
                      className={`p-3.5 rounded-xl border text-center font-bold transition-all active:scale-95
                        ${loggingType === t.id 
                          ? "bg-primary/5 border-primary text-primary" 
                          : "bg-muted/10 border-border/30 text-muted-foreground/75 hover:bg-muted/30"}`}
                    >
                      <div className="text-sm font-black">{t.title}</div>
                      <div className="text-[9px] opacity-60 tracking-tight mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Target Picker (Only if Numeric) */}
              {loggingType === "numeric" && (
                <div className="space-y-2 animate-fadeIn">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Daily Target Goal</Label>
                  <div className="flex items-center gap-3">
                    <button 
                      type="button" 
                      onClick={() => setTarget(Math.max(1, target - 1))}
                      className="w-12 h-12 bg-muted/40 hover:bg-muted rounded-xl flex items-center justify-center font-black text-lg active:scale-90 transition-all border border-border/40"
                    >
                      -
                    </button>
                    <div className="flex-1 text-center font-black text-2xl bg-muted/10 h-12 flex items-center justify-center rounded-xl border border-border/20">
                      {target} <span className="text-xs font-bold text-muted-foreground ml-1.5">{unit}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setTarget(target + 1)}
                      className="w-12 h-12 bg-muted/40 hover:bg-muted rounded-xl flex items-center justify-center font-black text-lg active:scale-90 transition-all border border-border/40"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Rules Preset Cards */}
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Ruleset Preset</Label>
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { id: "standard", title: "Standard", desc: "Allows 1 warning day before penalty occurs." },
                    { id: "strict", title: "Strict Builder", desc: "No grace days. Failed if target isn't logged daily." },
                    { id: "forgiving", title: "Forgiving (Grace)", desc: "Provides 2 soft grace days and safety buffers." }
                  ].map(p => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setRulePreset(p.id as any)}
                      className={`p-4 rounded-xl border text-left font-bold transition-all hover:scale-[1.01] active:scale-95
                        ${rulePreset === p.id 
                          ? "bg-primary/5 border-primary text-primary" 
                          : "bg-muted/10 border-border/30 text-muted-foreground/75 hover:bg-muted/30"}`}
                    >
                      <div className="text-sm font-black text-foreground">{p.title}</div>
                      <div className="text-[10px] text-muted-foreground font-bold mt-0.5 leading-snug">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: LAUNCH REVIEW */}
          {currentStep === 3 && (
            <div className="space-y-6 text-center py-6 animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-3xl animate-bounce">
                🎉
              </div>
              <div className="space-y-1 max-w-xs mx-auto">
                <h4 className="text-lg font-black text-foreground">Habit Ready to Launch!</h4>
                <p className="text-xs text-muted-foreground font-bold leading-normal">
                  Your new habit builder is successfully configured. Click below to add it to your profile.
                </p>
              </div>
              
              <div className="bg-muted/15 border border-border/20 rounded-xl p-4 text-left max-w-xs mx-auto space-y-2">
                <div className="flex justify-between text-xs font-bold text-muted-foreground">
                  <span>Name</span>
                  <span className="text-foreground font-black">{habitName || "No Title"}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-muted-foreground">
                  <span>Goal</span>
                  <span className="text-foreground font-black">{target} {unit}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-muted-foreground">
                  <span>Safety Preset</span>
                  <span className="text-foreground font-black capitalize">{rulePreset}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer Navigation */}
      <div className="flex gap-3 mt-6">
        <Button 
          variant="outline" 
          onClick={handleBack}
          className="flex-1 h-12 rounded-xl font-black text-sm border bg-card hover:bg-muted/50 transition-all active:scale-95"
        >
          <ArrowLeft size={16} className="mr-1.5" /> Back
        </Button>
        {currentStep === STEPS.length - 1 ? (
          <Button 
            onClick={() => router.push("/habits/manage")}
            className="flex-[2] h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-955/20 active:scale-95 transition-all"
          >
            Launch Habit!
          </Button>
        ) : (
          <Button 
            onClick={handleNext}
            className="flex-[2] h-12 rounded-xl font-black text-sm shadow-xl shadow-primary/10 active:scale-95 transition-all bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Continue <ArrowRight size={16} className="ml-1.5" />
          </Button>
        )}
      </div>
    </PageWrapper>
  );
}
