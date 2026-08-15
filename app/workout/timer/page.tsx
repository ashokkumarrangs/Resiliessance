"use client";

import React, { useState, useEffect, useRef } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { WORKOUT_TABS } from "@/lib/navigation";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Sparkles, 
  Timer, 
  Save, 
  AlertCircle,
  Undo,
  ArrowRight,
  Info
} from "lucide-react";
import { toast } from "sonner";

interface ActionPhase {
  id: string;
  label: string;
  duration: number; // in seconds
}

interface SequenceTemplate {
  id: string;
  name: string;
  phases: ActionPhase[];
}

export default function WorkoutTimerPage() {
  // Timer States: 'setup' | 'play' | 'completed'
  const [timerState, setTimerState] = useState<'setup' | 'play' | 'completed'>('setup');
  
  // Custom Saved Templates from localStorage
  const [templates, setTemplates] = useState<SequenceTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Editor states (for building a new template)
  const [editorName, setEditorName] = useState("");
  const [editorPhases, setEditorPhases] = useState<ActionPhase[]>([
    { id: "1", label: "Warmup", duration: 50 },
    { id: "2", label: "Jump Rope", duration: 50 },
    { id: "3", label: "Rest", duration: 30 }
  ]);

  // Active Playback States
  const [activeTemplate, setActiveTemplate] = useState<SequenceTemplate | null>(null);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Controls
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);

  // Background-safe interval hooks
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const pausedTimeLeftRef = useRef<number | null>(null);

  // Load custom templates on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("resiliessance_sequence_templates");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setTemplates(parsed);
          if (parsed.length > 0) {
            setSelectedTemplateId(parsed[0].id);
            loadTemplateIntoEditor(parsed[0]);
          }
        } catch (e) {
          console.error("Failed to parse templates", e);
        }
      }
    }
  }, []);

  const loadTemplateIntoEditor = (template: SequenceTemplate) => {
    setEditorName(template.name);
    setEditorPhases(template.phases.map(p => ({ ...p })));
  };

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const template = templates.find(t => t.id === id);
    if (template) {
      loadTemplateIntoEditor(template);
    }
  };

  // Phase list modifiers
  const addPhase = () => {
    setEditorPhases(prev => [
      ...prev,
      { id: Math.random().toString(36).substr(2, 9), label: "Action", duration: 30 }
    ]);
  };

  const removePhase = (index: number) => {
    if (editorPhases.length <= 1) {
      toast.error("A template must contain at least one phase");
      return;
    }
    setEditorPhases(prev => prev.filter((_, idx) => idx !== index));
  };

  const updatePhase = (index: number, field: keyof ActionPhase, val: string | number) => {
    setEditorPhases(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  // Save template to local storage
  const saveTemplate = () => {
    const nameToSave = editorName.trim();
    if (!nameToSave) {
      toast.error("Please enter a template name");
      return;
    }

    // Validate phases
    for (let i = 0; i < editorPhases.length; i++) {
      const ph = editorPhases[i];
      if (!ph.label.trim()) {
        toast.error(`Please enter a label for step ${i + 1}`);
        return;
      }
      if (ph.duration <= 0) {
        toast.error(`Duration for step "${ph.label}" must be greater than 0s`);
        return;
      }
    }

    const updatedTemplate: SequenceTemplate = {
      id: selectedTemplateId || Math.random().toString(36).substr(2, 9),
      name: nameToSave,
      phases: editorPhases.map(p => ({
        id: p.id,
        label: p.label.trim(),
        duration: p.duration
      }))
    };

    setTemplates(prev => {
      let nextTemplates;
      const exists = prev.some(t => t.id === updatedTemplate.id);
      if (exists) {
        nextTemplates = prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t);
      } else {
        nextTemplates = [...prev, updatedTemplate];
      }
      localStorage.setItem("resiliessance_sequence_templates", JSON.stringify(nextTemplates));
      return nextTemplates;
    });

    setSelectedTemplateId(updatedTemplate.id);
    toast.success(`Template "${nameToSave}" saved successfully!`);
  };

  // Create a brand new template reset
  const handleNewTemplate = () => {
    setSelectedTemplateId("");
    setEditorName("");
    setEditorPhases([
      { id: "1", label: "Warmup", duration: 50 },
      { id: "2", label: "Jump Rope", duration: 50 },
      { id: "3", label: "Rest", duration: 30 }
    ]);
  };

  // Delete template
  const deleteTemplate = () => {
    if (!selectedTemplateId) return;
    const target = templates.find(t => t.id === selectedTemplateId);
    if (!target) return;

    if (confirm(`Are you sure you want to delete the template "${target.name}"?`)) {
      const nextTemplates = templates.filter(t => t.id !== selectedTemplateId);
      localStorage.setItem("resiliessance_sequence_templates", JSON.stringify(nextTemplates));
      setTemplates(nextTemplates);
      if (nextTemplates.length > 0) {
        setSelectedTemplateId(nextTemplates[0].id);
        loadTemplateIntoEditor(nextTemplates[0]);
      } else {
        handleNewTemplate();
      }
      toast.success("Template deleted");
    }
  };

  // Web Audio Alert Synthesizer
  const initAudio = () => {
    if (!audioCtxRef.current && typeof window !== "undefined") {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtxRef.current = new AudioCtxClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  const playTone = (toneType: 'tick' | 'go' | 'victory') => {
    if (!soundEnabled) return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const playBeep = (freq: number, duration: number, delay = 0) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
      };

      if (toneType === 'tick') {
        playBeep(600, 0.05);
      } else if (toneType === 'go') {
        playBeep(880, 0.15, 0);
        playBeep(1100, 0.25, 0.1);
      } else if (toneType === 'victory') {
        playBeep(523.25, 0.15, 0); // C5
        playBeep(659.25, 0.15, 0.1); // E5
        playBeep(783.99, 0.15, 0.2); // G5
        playBeep(1046.50, 0.4, 0.3); // C6
      }
    } catch (e) {
      console.warn("Audio Context failed", e);
    }
  };

  const triggerVibrate = (pattern: number | number[]) => {
    if (vibrateEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  // Playback Control logic
  const startPlayback = () => {
    if (editorPhases.length === 0) {
      toast.error("Please add at least one phase to start");
      return;
    }
    
    // Auto-save temporary template configuration if it has a name
    const activeTimeline: SequenceTemplate = {
      id: selectedTemplateId || "temp-workout",
      name: editorName.trim() || "Quick Sequence",
      phases: editorPhases.map(p => ({ ...p }))
    };

    setActiveTemplate(activeTimeline);
    setCurrentPhaseIndex(0);
    setIsPaused(false);
    setTimerState('play');

    const firstPhase = activeTimeline.phases[0];
    setTimeLeft(firstPhase.duration);
    setTotalDuration(firstPhase.duration);
    endTimeRef.current = Date.now() + firstPhase.duration * 1000;
    
    playTone('go');
    triggerVibrate([200, 100, 200]);
  };

  useEffect(() => {
    if (timerState === 'play' && !isPaused) {
      timerIntervalRef.current = setInterval(() => {
        if (endTimeRef.current) {
          const now = Date.now();
          const diff = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));

          // Beep at final 3 seconds
          if (diff > 0 && diff <= 3 && diff !== timeLeft) {
            playTone('tick');
            triggerVibrate(50);
          }

          setTimeLeft(diff);

          if (diff <= 0) {
            clearInterval(timerIntervalRef.current!);
            handlePhaseTransition();
          }
        }
      }, 100);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerState, isPaused, timeLeft, currentPhaseIndex, activeTemplate]);

  const handlePhaseTransition = () => {
    if (!activeTemplate) return;
    const nextIndex = currentPhaseIndex + 1;

    if (nextIndex < activeTemplate.phases.length) {
      setCurrentPhaseIndex(nextIndex);
      const nextPhase = activeTemplate.phases[nextIndex];
      setTimeLeft(nextPhase.duration);
      setTotalDuration(nextPhase.duration);
      endTimeRef.current = Date.now() + nextPhase.duration * 1000;

      playTone('go');
      triggerVibrate([200, 100, 200]);
    } else {
      setTimerState('completed');
      playTone('victory');
      triggerVibrate([500, 100, 500]);
    }
  };

  const togglePause = () => {
    if (isPaused) {
      endTimeRef.current = Date.now() + pausedTimeLeftRef.current!;
      setIsPaused(false);
    } else {
      pausedTimeLeftRef.current = endTimeRef.current! - Date.now();
      setIsPaused(true);
    }
  };

  const skipPhase = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    handlePhaseTransition();
  };

  const adjustTime = (seconds: number) => {
    if (isPaused) {
      pausedTimeLeftRef.current = Math.max(1000, pausedTimeLeftRef.current! + seconds * 1000);
      setTimeLeft(Math.ceil(pausedTimeLeftRef.current / 1000));
    } else if (endTimeRef.current) {
      endTimeRef.current += seconds * 1000;
      const diff = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(diff);
      setTotalDuration(prev => Math.max(prev, prev + seconds));
    }
  };

  const resetTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerState('setup');
    setActiveTemplate(null);
    setCurrentPhaseIndex(0);
    setTimeLeft(0);
  };

  // Helper time displays
  const formatSeconds = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // SVG circular calculations
  const progressPercent = totalDuration > 0 ? (timeLeft / totalDuration) * 100 : 0;
  const strokeDashoffset = 283 - (283 * progressPercent) / 100;

  // Dynamic Theme mapping based on Phase Label strings
  const getPhaseTheme = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes("warmup") || lower.includes("prep")) {
      return {
        bg: "from-indigo-600/10 via-background to-indigo-950/10 border-indigo-500/20 shadow-indigo-500/10",
        ring: "text-indigo-500",
        glow: "bg-indigo-500",
        badge: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
        text: "text-indigo-400"
      };
    } else if (lower.includes("rest") || lower.includes("recover") || lower.includes("break")) {
      return {
        bg: "from-amber-600/10 via-background to-amber-950/10 border-amber-500/30 shadow-amber-500/15",
        ring: "text-amber-500",
        glow: "bg-amber-500",
        badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
        text: "text-amber-400"
      };
    }
    // Default Active Work phases
    return {
      bg: "from-emerald-600/10 via-background to-emerald-950/10 border-emerald-500/30 shadow-emerald-500/15",
      ring: "text-emerald-500 animate-pulse",
      glow: "bg-emerald-500",
      badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      text: "text-emerald-400"
    };
  };

  const activePhaseLabel = activeTemplate?.phases[currentPhaseIndex]?.label || "Action";
  const theme = getPhaseTheme(activePhaseLabel);

  return (
    <PageWrapper title="Sequence Timer" sectionTabs={WORKOUT_TABS}>
      <div className="w-full space-y-6">

        {/* SETUP & EDITOR MODE */}
        {timerState === 'setup' && (
          <div className="space-y-6">

            {/* Template selector card */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/40 space-y-4">
              <div className="flex items-center justify-between border-b border-border/20 pb-3">
                <h3 className="font-black text-base text-foreground flex items-center gap-2">
                  <Sparkles size={18} className="text-accent" />
                  Select Saved Timeline
                </h3>
                {selectedTemplateId && (
                  <button
                    onClick={handleNewTemplate}
                    className="text-xs font-bold text-accent hover:underline"
                  >
                    + Create New
                  </button>
                )}
              </div>

              {templates.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  No saved sequence templates found. Use the editor below to build and save your first routine.
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                    className="flex-1 h-12 bg-muted border-none rounded-xl px-3.5 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner"
                  >
                    <option value="">Select a template...</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {selectedTemplateId && (
                    <button
                      onClick={deleteTemplate}
                      className="bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white px-4 rounded-xl transition-all"
                      title="Delete Template"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Sequence Editor Form Card */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/40 space-y-5">
              <h3 className="font-black text-base text-foreground flex items-center gap-2 border-b border-border/20 pb-3">
                <Timer size={18} className="text-accent" />
                Timeline Configurator
              </h3>

              <div className="space-y-4">
                
                {/* Template Name field */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Routine Name</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. HIIT Routine, Yoga Flow..."
                      value={editorName}
                      onChange={(e) => setEditorName(e.target.value)}
                      className="flex-1 h-11 bg-muted border-none rounded-xl px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner"
                    />
                    <button
                      onClick={saveTemplate}
                      className="bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground px-4.5 rounded-xl font-bold text-sm transition-all flex items-center gap-1.5"
                    >
                      <Save size={16} /> Save
                    </button>
                  </div>
                </div>

                {/* Steps/Phases Timeline */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Sequence Steps</label>
                    <button
                      type="button"
                      onClick={addPhase}
                      className="text-xs font-black uppercase tracking-wider text-accent hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Step
                    </button>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {editorPhases.map((ph, idx) => (
                      <div key={ph.id} className="bg-muted/30 border border-border/30 rounded-xl p-3 flex items-center justify-between gap-3 relative">
                        <span className="font-black text-xs text-muted-foreground/50 shrink-0 w-6 text-center">
                          {idx + 1}
                        </span>
                        
                        {/* Step Label Input */}
                        <div className="flex-1">
                          <input 
                            type="text" 
                            placeholder="e.g. Warmup, Jump, Rest"
                            value={ph.label}
                            onChange={(e) => updatePhase(idx, 'label', e.target.value)}
                            className="w-full h-9 bg-muted border-none rounded-lg px-2.5 font-bold text-xs text-foreground focus:ring-1 focus:ring-accent/20"
                          />
                        </div>

                        {/* Step Duration Input */}
                        <div className="w-24 shrink-0">
                          <div className="relative">
                            <input 
                              type="number" 
                              placeholder="secs"
                              value={ph.duration || ""}
                              onChange={(e) => updatePhase(idx, 'duration', Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-full h-9 bg-muted border-none rounded-lg pr-7 pl-2 text-right font-bold text-xs text-foreground focus:ring-1 focus:ring-accent/20"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/40">
                              s
                            </span>
                          </div>
                        </div>

                        {/* Step Delete Trigger */}
                        <button
                          type="button"
                          onClick={() => removePhase(idx)}
                          className="text-muted-foreground/35 hover:text-rose-500 p-1 rounded-md transition-colors"
                          title="Delete Step"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Haptic Toggles */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/20">
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border ${soundEnabled ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-muted/40 border-border/20 text-muted-foreground'}`}
                  >
                    Sound {soundEnabled ? "On" : "Off"}
                  </button>

                  <button
                    onClick={() => setVibrateEnabled(!vibrateEnabled)}
                    className={`h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border ${vibrateEnabled ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-muted/40 border-border/20 text-muted-foreground'}`}
                  >
                    Vibrate {vibrateEnabled ? "On" : "Off"}
                  </button>
                </div>

                {/* Start Active Player */}
                <div className="pt-2">
                  <button
                    onClick={startPlayback}
                    className="w-full h-14 bg-gradient-to-r from-accent to-indigo-600 text-white rounded-2xl font-black text-base shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/35 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    <Play fill="white" size={18} />
                    Start Sequence Player
                  </button>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ACTIVE TIMELINE COUNTDOWN PLAYER */}
        {timerState === 'play' && activeTemplate && (
          <div className="space-y-6">
            
            {/* Countdown Player Card */}
            <div className={`relative bg-gradient-to-b ${theme.bg} border rounded-3xl p-8 shadow-2xl transition-all duration-500 overflow-hidden flex flex-col items-center justify-center`}>
              
              {/* Glow animation blur behind */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full ${theme.glow} opacity-[0.04] blur-3xl pointer-events-none transition-all duration-500`} />

              {/* Header Phase label */}
              <div className="mb-6 relative z-10 text-center">
                <span className={`px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest ${theme.badge} block max-w-xs truncate mx-auto`}>
                  {activePhaseLabel}
                </span>
              </div>

              {/* Circular progress meter */}
              <div className="relative w-64 h-64 flex items-center justify-center mb-6 z-10">
                <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" className="stroke-muted/30" strokeWidth="4" fill="transparent" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    className={`stroke-current transition-all duration-300 ${theme.ring}`}
                    strokeWidth="5"
                    fill="transparent"
                    strokeDasharray="283"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>

                <div className="text-center space-y-1 select-none">
                  <div className="font-mono text-6xl font-black text-foreground tracking-tighter leading-none">
                    {formatSeconds(timeLeft)}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Step {currentPhaseIndex + 1} of {activeTemplate.phases.length}
                  </div>
                </div>
              </div>

              {/* Playback step labels queue */}
              <div className="text-center space-y-1 mb-8 z-10 min-h-[44px]">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 block">Current Action</span>
                <span className="text-base font-extrabold text-foreground block max-w-xs truncate">{activePhaseLabel}</span>
              </div>

              {/* Adjust / Action Bar */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-4 relative z-10">
                <button
                  onClick={() => adjustTime(-10)}
                  className="h-10 bg-muted hover:bg-muted/70 text-foreground font-bold text-xs rounded-xl transition-all border border-border/20 active:scale-95"
                >
                  -10s
                </button>
                <div className="flex items-center justify-center text-xs font-black uppercase text-muted-foreground/40 tracking-wider">
                  Adjust
                </div>
                <button
                  onClick={() => adjustTime(30)}
                  className="h-10 bg-muted hover:bg-muted/70 text-foreground font-bold text-xs rounded-xl transition-all border border-border/20 active:scale-95"
                >
                  +30s
                </button>
              </div>

              {/* Controls triggers */}
              <div className="flex items-center justify-center gap-4 w-full relative z-10">
                <button
                  onClick={resetTimer}
                  className="p-4 bg-muted hover:bg-muted/70 text-muted-foreground hover:text-foreground rounded-2xl transition-all border border-border/20 active:scale-95"
                  title="Quit Session"
                >
                  <RotateCcw size={20} />
                </button>

                <button
                  onClick={togglePause}
                  className={`p-6 ${isPaused ? 'bg-emerald-500 shadow-emerald-500/25' : 'bg-foreground text-background'} rounded-3xl transition-all shadow-xl hover:scale-105 active:scale-95`}
                >
                  {isPaused ? <Play fill="white" className="text-white ml-0.5" size={24} /> : <Pause fill="currentColor" size={24} />}
                </button>

                <button
                  onClick={skipPhase}
                  className="p-4 bg-muted hover:bg-muted/70 text-muted-foreground hover:text-foreground rounded-2xl transition-all border border-border/20 active:scale-95"
                  title="Skip Step"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

            </div>

            {/* Next step preview display block */}
            {currentPhaseIndex + 1 < activeTemplate.phases.length && (
              <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-accent">
                    <ArrowRight size={18} />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 block">Next Action Step</span>
                    <span className="text-xs font-bold text-foreground">
                      {activeTemplate.phases[currentPhaseIndex + 1].label} ({activeTemplate.phases[currentPhaseIndex + 1].duration}s)
                    </span>
                  </div>
                </div>
                <AlertCircle size={16} className="text-muted-foreground/30" />
              </div>
            )}

          </div>
        )}

        {/* WORKOUT SEQUENCE COMPLETED SUMMARY */}
        {timerState === 'completed' && activeTemplate && (
          <div className="bg-card rounded-2xl p-8 border border-border/40 shadow-xl text-center space-y-6">
            
            <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto text-amber-500 relative animate-bounce">
              <Sparkles className="absolute top-2 right-2 text-amber-400 animate-pulse" size={16} />
              <ChevronRight className="text-amber-500 font-extrabold rotate-90" size={32} />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Sequence Done!</h2>
              <p className="text-sm text-muted-foreground">You completed every step of your sequenced workout.</p>
            </div>

            {/* Stats list summary */}
            <div className="bg-muted/30 border border-border/30 rounded-2xl p-4 max-w-xs mx-auto text-left space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground">Routine Name:</span>
                <span className="text-foreground">{activeTemplate.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold border-t border-border/20 pt-2">
                <span className="text-muted-foreground">Total Action Steps:</span>
                <span className="text-foreground">{activeTemplate.phases.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold border-t border-border/20 pt-2">
                <span className="text-muted-foreground">Total Timing:</span>
                <span className="text-foreground">
                  {formatSeconds(activeTemplate.phases.reduce((acc, p) => acc + p.duration, 0))}
                </span>
              </div>
            </div>

            {/* Back button configuration */}
            <div className="pt-2">
              <button
                onClick={resetTimer}
                className="w-full h-12 bg-muted hover:bg-muted/70 text-foreground font-black text-sm rounded-xl transition-all border border-border/20 flex items-center justify-center gap-1.5"
              >
                <Undo size={16} /> Back to Editor
              </button>
            </div>

          </div>
        )}

      </div>
    </PageWrapper>
  );
}
