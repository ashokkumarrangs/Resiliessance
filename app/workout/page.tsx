"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Activity, CalendarDays, Check, Dumbbell, Flame, Pause, Play, PlusCircle, Trash2, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { SaveButton } from "@/components/ui/SaveButton";
import { LoadingScreen } from "@/components/LoadingScreen";
import { WORKOUT_TABS } from "@/lib/navigation";
import { SearchableSelect } from "@/components/SearchableSelect";

interface WorkoutSet {
  weight: string;
  reps: string;
}

interface Exercise {
  id: string;
  name: string;
  notes: string;
  sets: WorkoutSet[];
}

function WorkoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [workoutDay, setWorkoutDay] = useState("");
  const [time, setTime] = useState(format(new Date(), "HH:mm"));
  const [duration, setDuration] = useState("30");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  
  // History data for dynamic dropdowns and PRs
  const [dayHistory, setDayHistory] = useState<string[]>([]);
  const [hierarchy, setHierarchy] = useState<Record<string, string[]>>({});
  const [exerciseStats, setExerciseStats] = useState<Record<string, { maxWeight: number, lastSessionStr: string }>>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [templates, setTemplates] = useState<{id: string, name: string}[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [scheduleId, setScheduleId] = useState<string | null>(null);

  // Floating Rest Timer states
  const [defaultRestTime, setDefaultRestTime] = useState(60);
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});
  
  const [floatingTimer, setFloatingTimer] = useState<{
    isActive: boolean;
    timeLeft: number;
    totalDuration: number;
    isPaused: boolean;
    setLabel: string;
  }>({
    isActive: false,
    timeLeft: 0,
    totalDuration: 0,
    isPaused: false,
    setLabel: ""
  });

  const floatingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const floatingEndTimeRef = useRef<number | null>(null);
  const floatingPausedTimeLeftRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    fetchHistory();
    fetchTemplates();
    
    // Check URL params
    const tId = searchParams.get("template");
    const sId = searchParams.get("schedule_id");
    if (tId) {
      setSelectedTemplateId(tId);
      handleLoadTemplate(tId);
    }
    if (sId) {
      setScheduleId(sId);
    }
  }, [searchParams]);

  // Clean up floating rest timer on unmount
  useEffect(() => {
    return () => {
      if (floatingIntervalRef.current) clearInterval(floatingIntervalRef.current);
    };
  }, []);

  // Floating Rest Timer loop
  useEffect(() => {
    if (floatingTimer.isActive && !floatingTimer.isPaused) {
      floatingIntervalRef.current = setInterval(() => {
        if (floatingEndTimeRef.current) {
          const now = Date.now();
          const diff = Math.max(0, Math.ceil((floatingEndTimeRef.current - now) / 1000));
          
          if (diff > 0 && diff <= 3 && diff !== floatingTimer.timeLeft) {
            playLoggerTone('tick');
          }

          setFloatingTimer(prev => ({ ...prev, timeLeft: diff }));

          if (diff <= 0) {
            clearInterval(floatingIntervalRef.current!);
            playLoggerTone('go');
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }
            toast.success("Rest finished! Time to lift! 🏋️");
            dismissFloatingTimer();
          }
        }
      }, 100);
    }
    return () => {
      if (floatingIntervalRef.current) clearInterval(floatingIntervalRef.current);
    };
  }, [floatingTimer.isActive, floatingTimer.isPaused, floatingTimer.timeLeft]);

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

  const playLoggerTone = (toneType: 'tick' | 'go' | 'rest') => {
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
      } else if (toneType === 'rest') {
        playBeep(440, 0.2, 0);
        playBeep(330, 0.3, 0.15);
      }
    } catch (e) {
      console.warn("Audio failed", e);
    }
  };

  const startFloatingRest = (seconds: number, setLabel: string) => {
    if (seconds <= 0) return;
    if (floatingIntervalRef.current) clearInterval(floatingIntervalRef.current);
    
    playLoggerTone('rest');
    setFloatingTimer({
      isActive: true,
      timeLeft: seconds,
      totalDuration: seconds,
      isPaused: false,
      setLabel
    });
    
    floatingEndTimeRef.current = Date.now() + seconds * 1000;
  };

  const toggleFloatingPause = () => {
    setFloatingTimer(prev => {
      if (prev.isPaused) {
        floatingEndTimeRef.current = Date.now() + floatingPausedTimeLeftRef.current!;
        return { ...prev, isPaused: false };
      } else {
        floatingPausedTimeLeftRef.current = floatingEndTimeRef.current! - Date.now();
        return { ...prev, isPaused: true };
      }
    });
  };

  const skipFloatingRest = () => {
    dismissFloatingTimer();
  };

  const extendFloatingRest = (seconds: number) => {
    setFloatingTimer(prev => {
      let nextTimeLeft = prev.timeLeft + seconds;
      if (prev.isPaused) {
        floatingPausedTimeLeftRef.current = Math.max(0, floatingPausedTimeLeftRef.current! + seconds * 1000);
        nextTimeLeft = Math.ceil(floatingPausedTimeLeftRef.current / 1000);
      } else if (floatingEndTimeRef.current) {
        floatingEndTimeRef.current += seconds * 1000;
        nextTimeLeft = Math.max(0, Math.ceil((floatingEndTimeRef.current - Date.now()) / 1000));
      }
      return {
        ...prev,
        timeLeft: nextTimeLeft,
        totalDuration: Math.max(prev.totalDuration, prev.totalDuration + seconds)
      };
    });
  };

  const dismissFloatingTimer = () => {
    if (floatingIntervalRef.current) clearInterval(floatingIntervalRef.current);
    setFloatingTimer({
      isActive: false,
      timeLeft: 0,
      totalDuration: 0,
      isPaused: false,
      setLabel: ""
    });
  };

  const toggleSetCompletion = (exIdx: number, setIdx: number, exName: string) => {
    const key = `${exIdx}-${setIdx}`;
    const isNowCompleted = !completedSets[key];
    setCompletedSets(prev => ({
      ...prev,
      [key]: isNowCompleted
    }));

    if (isNowCompleted) {
      const displayExName = exName || `Exercise ${exIdx + 1}`;
      startFloatingRest(defaultRestTime, `${displayExName} (Set ${setIdx + 1})`);
    } else {
      const currentTargetLabel = `${exName || `Exercise ${exIdx + 1}`} (Set ${setIdx + 1})`;
      if (floatingTimer.isActive && floatingTimer.setLabel === currentTargetLabel) {
        dismissFloatingTimer();
      }
    }
  };

  async function fetchTemplates() {
    try {
      const { data, error } = await supabase
        .from('workout_template')
        .select('id, name')
        .order('name');
      if (data) {
        setTemplates(data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleLoadTemplate(templateId: string) {
    if (!templateId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('workout_template_exercise')
        .select('*, workout_template_set(*)')
        .eq('template_id', templateId)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const loadedExercises: Exercise[] = (data || []).map(ex => ({
        id: Math.random().toString(36).substr(2, 9),
        name: ex.exercise_name,
        notes: ex.notes || "",
        sets: (ex.workout_template_set || [])
          .sort((a: any, b: any) => a.set_no - b.set_no)
          .map((s: any) => ({
            weight: s.target_weight?.toString() || "",
            reps: s.target_reps?.toString() || ""
          }))
      }));

      setExercises(loadedExercises);
      
      const t = templates.find(t => t.id === templateId);
      if (t) setWorkoutDay(t.name);
      
      toast.success("Template loaded successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to load template");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (date) loadWorkoutData(date);
  }, [date]);

  async function fetchHistory() {
    try {
      const { data } = await supabase
        .from('workout_log')
        .select('date, workout_day, workout_name, weight, reps, set_no')
        .order('date', { ascending: false })
        .order('set_no', { ascending: true })
        .limit(5000);
      
      if (data) {
        const uniqueDays = Array.from(new Set(data.map(d => d.workout_day).filter(Boolean)));
        setDayHistory(uniqueDays as string[]);

        const tree: Record<string, Set<string>> = {};
        const stats: Record<string, { maxWeight: number, lastSessionDate: string, lastSessionSets: string[] }> = {};

        data.forEach(row => {
          if (!row.workout_day || !row.workout_name) return;
          
          if (!tree[row.workout_day]) tree[row.workout_day] = new Set();
          tree[row.workout_day].add(row.workout_name);

          // PRs and Last Session
          if (!stats[row.workout_name]) {
            stats[row.workout_name] = { maxWeight: 0, lastSessionDate: "", lastSessionSets: [] };
          }
          
          const w = parseFloat(row.weight) || 0;
          if (w > stats[row.workout_name].maxWeight) {
            stats[row.workout_name].maxWeight = w;
          }

          // Build last session string 
          if (!stats[row.workout_name].lastSessionDate) {
            stats[row.workout_name].lastSessionDate = row.date;
          }
          if (stats[row.workout_name].lastSessionDate === row.date) {
            stats[row.workout_name].lastSessionSets.push(`${row.weight}kg x ${row.reps}`); 
          }
        });

        const finalTree: Record<string, string[]> = {};
        for (const [day, exSet] of Object.entries(tree)) {
          finalTree[day] = Array.from(exSet as Set<string>);
        }
        setHierarchy(finalTree);

        const finalStats: Record<string, { maxWeight: number, lastSessionStr: string }> = {};
        for (const [ex, s] of Object.entries(stats)) {
          finalStats[ex] = {
            maxWeight: s.maxWeight,
            lastSessionStr: s.lastSessionSets.join(", ")
          };
        }
        setExerciseStats(finalStats);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  }

  async function loadWorkoutData(selectedDate: string) {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('workout_log')
        .select('*')
        .eq('date', selectedDate)
        .order('workout_name')
        .order('set_no');

      if (error) throw error;

      if (data && data.length > 0) {
        setWorkoutDay(data[0].workout_day || "");
        setTime(data[0].time || format(new Date(), "HH:mm"));
        setDuration(String(data[0].duration_minutes || "30"));
        
        const grouped: Record<string, Exercise> = {};
        data.forEach((row) => {
          if (!grouped[row.workout_name]) {
            grouped[row.workout_name] = {
              id: Math.random().toString(36).substr(2, 9),
              name: row.workout_name,
              notes: row.notes || "",
              sets: []
            };
          }
          grouped[row.workout_name].sets.push({
            weight: String(row.weight),
            reps: String(row.reps)
          });
        });
        
        setExercises(Object.values(grouped));
      } else {
        setExercises([]);
      }
    } catch (error) {
      console.error("Error loading workout data:", error);
      toast.error("Failed to load workout data");
    } finally {
      setIsLoading(false);
    }
  }

  const handleAddExercise = () => {
    setExercises([
      ...exercises, 
      { 
        id: Math.random().toString(36).substr(2, 9), 
        name: "", 
        notes: "", 
        sets: [{ weight: "", reps: "" }] 
      }
    ]);
  };

  const handleRemoveExercise = (index: number) => {
    const updated = [...exercises];
    updated.splice(index, 1);
    setExercises(updated);
  };

  const handleAddSet = (exerciseIndex: number) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets.push({ weight: "", reps: "" });
    setExercises(updated);
  };


  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets.splice(setIndex, 1);
    setExercises(updated);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof WorkoutSet, value: string) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets[setIndex][field] = value;
    setExercises(updated);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateExercise = (exerciseIndex: number, field: keyof Exercise, value: any) => {
    const updated = [...exercises];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[exerciseIndex] as any)[field] = value;
    setExercises(updated);
  };

  const handleSave = async () => {
    if (!date || !workoutDay) {
      toast.error("Please select date and workout day");
      return;
    }

    if (exercises.length === 0) {
      toast.error("Please add at least one exercise");
      return;
    }

    // Validate
    for (const ex of exercises) {
      if (!ex.name.trim()) {
        toast.error("Exercise name is required");
        return;
      }
      if (ex.sets.length === 0) {
        toast.error(`At least one set required for ${ex.name}`);
        return;
      }
      for (const s of ex.sets) {
        const w = parseFloat(s.weight);
        const r = parseInt(s.reps);
        if (isNaN(w) || w < 0) {
          toast.error(`Invalid weight for ${ex.name}`);
          return;
        }
        if (isNaN(r) || r <= 0) {
          toast.error(`Reps must be at least 1 for ${ex.name}`);
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      const payload = exercises.flatMap((ex) => 
        ex.sets.map((set, idx) => ({
          date,
          workout_day: workoutDay,
          workout_name: ex.name,
          set_no: idx + 1,
          weight: parseFloat(String(set.weight).replace(',', '.')) || 0,
          reps: parseInt(set.reps) || 0,
          notes: ex.notes,
          time,
          duration_minutes: parseInt(duration) || 30
        }))
      );

      const { error: delError } = await supabase.from('workout_log').delete().eq('date', date);
      if (delError) throw delError;
      const { error } = await supabase.from('workout_log').insert(payload);
      if (error) throw error;

      if (scheduleId) {
        await supabase
          .from('scheduled_workout')
          .update({ status: 'completed' })
          .eq('id', scheduleId);
      }

      toast.success("Workout saved successfully!");
      fetchHistory(); 
      router.push('/');
    } catch (error) {
      console.error("Error saving workout:", error);
      toast.error("Failed to save workout");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredExercises = workoutDay && hierarchy[workoutDay] ? hierarchy[workoutDay] : [];

  return (
    <PageWrapper
      title="Workout Logger"
      reportHref="/reports/workout"
      sectionTabs={WORKOUT_TABS}
    >

        <div className="space-y-6 w-full">
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="w-full space-y-6">
          <div className="bg-card rounded-md p-7 shadow-sm border border-border/40 space-y-7 relative z-40">
            {templates.length > 0 && (
              <div className="grid grid-cols-1 gap-4 relative z-40">
                <div className="space-y-2">
                  <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                    Start from Template
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => {
                      setSelectedTemplateId(e.target.value);
                      handleLoadTemplate(e.target.value);
                    }}
                    className="w-full min-w-0 h-11 bg-muted border-none rounded-md px-3 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner"
                  >
                    <option value="">Select a template...</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 relative z-30">
              <div className="space-y-2">
                <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                  <CalendarDays size={16} className="shrink-0" /> Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full min-w-0 h-11 bg-muted border-none rounded-md px-3 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                  Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full min-w-0 h-11 bg-muted border-none rounded-md px-3 text-sm font-bold text-center text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-20">
              <div className="space-y-2">
                <SearchableSelect 
                  label="Workout Day"
                  headerIcon={<Flame size={16} className="shrink-0" />}
                  value={workoutDay}
                  onChange={setWorkoutDay}
                  options={dayHistory}
                  createLabel="Workout Day"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground/60 uppercase leading-none block truncate">
                    Duration (m)
                  </label>
                  <input
                    type="number"
                    placeholder="30"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    inputMode="numeric"
                    className="w-full min-w-0 h-11 bg-muted border-none rounded-md px-2 text-sm font-bold text-center text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground/60 uppercase leading-none block truncate flex items-center gap-1">
                    Set Rest (s)
                  </label>
                  <input
                    type="number"
                    placeholder="60"
                    value={defaultRestTime}
                    onChange={(e) => setDefaultRestTime(Math.max(0, parseInt(e.target.value) || 0))}
                    inputMode="numeric"
                    className="w-full min-w-0 h-11 bg-muted border-none rounded-md px-2 text-sm font-bold text-center text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner"
                  />
                </div>
              </div>
            </div>



          </div>


        {isLoading ? (
          <LoadingScreen message="Recalibrating metrics..." />
        ) : (
          <div className="space-y-6">
            {exercises.map((ex, exIdx) => {
              const stats = exerciseStats[ex.name];
              const currentVol = ex.sets.reduce((s, set) => s + ((parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0)), 0);
              
              return (
                <div key={ex.id} className="bg-card rounded-md p-6 shadow-sm border border-border/40 overflow-hidden">
                  <div className="flex justify-between items-start mb-6 gap-4">
                    <div className="flex-1 space-y-1 relative">
                      <SearchableSelect 
                        label=""
                        value={ex.name}
                        onChange={(val) => updateExercise(exIdx, "name", val)}
                        options={filteredExercises}
                        createLabel="Exercise"
                        placeholder="Select or Type Exercise..."
                        hideLabel={true}
                      />
                      {stats && ex.name && (
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mt-2 px-1">
                          {stats.lastSessionStr && (
                            <span className="flex items-center gap-1">
                              <Activity size={12} /> Last: {stats.lastSessionStr}
                            </span>
                          )}
                          {stats.maxWeight > 0 && (
                            <span className="flex items-center gap-1 text-amber-500/80">
                              <Trophy size={12} /> PR: {stats.maxWeight}kg
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(exIdx)}
                      className="p-2.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-md transition-all shrink-0 mt-1"
                    >
                      <Trash2 size={18} />
                    </button>

                  </div>

                  <div className="space-y-3 mb-4">
                    {ex.sets.length > 0 && (
                      <div className="grid grid-cols-[2.5rem_2.5rem_1fr_1fr_2.5rem] gap-2 px-1 mb-1">
                        <div className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest text-center">Done</div>
                        <div className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest text-center">Set</div>
                        <div className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest text-center">Weight</div>
                        <div className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest text-center">Reps</div>
                        <div></div>
                      </div>
                    )}

                    {ex.sets.map((set, setIdx) => {
                      const isPR = stats && parseFloat(set.weight) > stats.maxWeight && parseFloat(set.weight) > 0;
                      const setKey = `${exIdx}-${setIdx}`;
                      const isCompleted = !!completedSets[setKey];
                      return (
                        <div key={setIdx} className="grid grid-cols-[2.5rem_2.5rem_1fr_1fr_2.5rem] gap-2 items-center">
                          {/* Checkmark Button */}
                          <button
                            type="button"
                            onClick={() => toggleSetCompletion(exIdx, setIdx, ex.name)}
                            className={`h-9 w-9 flex items-center justify-center rounded-lg border transition-all ${
                              isCompleted
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'bg-muted/50 border-border/40 text-muted-foreground/30 hover:border-accent/40 hover:text-accent'
                            }`}
                          >
                            <Check size={14} className={isCompleted ? "stroke-[3]" : "opacity-0 hover:opacity-100"} />
                          </button>

                          {/* Set number */}
                          <div className={`h-12 flex items-center justify-center font-black text-base rounded-md border transition-all shadow-sm ${
                            isCompleted 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                              : 'bg-muted/50 border-border/40 text-foreground'
                          }`}>
                            {setIdx + 1}
                          </div>

                          {/* Weight */}
                          <div className="relative group">
                            <input
                              type="number"
                              placeholder="kg"
                              value={set.weight}
                              disabled={isCompleted}
                              onChange={(e) => updateSet(exIdx, setIdx, "weight", e.target.value)}
                              inputMode="decimal"
                              className={`w-full h-12 bg-muted border-none focus:ring-2 shadow-inner font-black text-lg text-center rounded-md transition-all ${
                                isCompleted 
                                  ? 'opacity-40 line-through text-muted-foreground' 
                                  : isPR 
                                    ? 'text-amber-600 focus:ring-amber-500/20' 
                                    : 'text-foreground focus:ring-accent/20'
                              }`}
                            />
                            {isPR && !isCompleted && <Trophy size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 animate-pulse pointer-events-none" />}
                          </div>

                          {/* Reps */}
                          <input
                            type="number"
                            placeholder="reps"
                            value={set.reps}
                            disabled={isCompleted}
                            onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value)}
                            inputMode="numeric"
                            className={`w-full h-12 bg-muted border-none focus:ring-2 focus:ring-accent/20 shadow-inner text-foreground font-black text-lg text-center rounded-md transition-all ${
                              isCompleted ? 'opacity-40 line-through text-muted-foreground' : ''
                            }`}
                          />

                          {/* Remove Set */}
                          <button
                            type="button"
                            onClick={() => handleRemoveSet(exIdx, setIdx)}
                            className="h-12 flex items-center justify-center text-muted-foreground/30 hover:text-rose-500 transition-colors"
                          >
                            <X size={18} />
                          </button>

                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between mt-5 pt-5 border-t border-border/40">
                    <button
                      type="button"
                      onClick={() => handleAddSet(exIdx)}
                      className="text-xs font-black uppercase tracking-widest text-accent hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      <PlusCircle size={14} /> Add Set
                    </button>

                    {currentVol > 0 && (
                      <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                        Vol: {currentVol.toLocaleString()}kg
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={handleAddExercise}
              className="w-full h-14 bg-card border-2 border-dashed border-border/60 text-muted-foreground rounded-md font-black flex items-center justify-center gap-2 hover:bg-muted hover:text-foreground transition-all"
            >
              <Dumbbell size={18} />
              <span>Add Exercise</span>
            </button>


            <div className="flex justify-center pt-8">
              <SaveButton onClick={handleSave} isSaving={isSaving} label="Save Workout" className="w-full max-w-xs h-12 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-muted" />
            </div>
          </div>
        )}
      </form>
        </div>

        {/* Floating Rest Timer Widget */}
        {floatingTimer.isActive && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-card/95 backdrop-blur-md border border-amber-500/30 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4 z-50 transition-all duration-300 transform translate-y-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-11.5 h-11.5 flex items-center justify-center shrink-0">
                <svg className="absolute w-12 h-12 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" className="stroke-muted/40" strokeWidth="6" fill="transparent" />
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    className="stroke-amber-500 transition-all duration-300"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="276"
                    strokeDashoffset={276 - (276 * (floatingTimer.timeLeft / floatingTimer.totalDuration)) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="font-mono text-xs font-black text-foreground z-10">
                  {floatingTimer.timeLeft}
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-black uppercase text-amber-500 tracking-widest block leading-none mb-1">
                  Resting
                </span>
                <span className="text-xs font-extrabold text-foreground block truncate">
                  {floatingTimer.setLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => extendFloatingRest(30)}
                className="h-8 px-2 bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-lg transition-colors border border-border/20"
              >
                +30s
              </button>
              <button
                type="button"
                onClick={toggleFloatingPause}
                className="p-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors border border-border/20"
              >
                {floatingTimer.isPaused ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />}
              </button>
              <button
                type="button"
                onClick={skipFloatingRest}
                className="h-8 px-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-bold text-xs rounded-lg transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        )}
    </PageWrapper>
  );
}

export default function WorkoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkoutPageContent />
    </Suspense>
  );
}
