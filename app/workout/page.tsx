"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Activity, ArrowLeftCircle, CalendarDays, CheckCircle2, ChevronDown, Dumbbell, Flame, PlusCircle, Trash2, Trophy, X , BarChart2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { SaveButton } from "@/components/ui/SaveButton";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SectionNav } from "@/components/SectionNav";
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

export default function WorkoutPage() {
  const router = useRouter();
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

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (date) loadWorkoutData(date);
  }, [date]);

  const fetchHistory = async () => {
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
  };

  const loadWorkoutData = async (selectedDate: string) => {
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
  };

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

  const updateExercise = (exerciseIndex: number, field: keyof Exercise, value: any) => {
    const updated = [...exercises];
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
    }

    setIsSaving(true);
    try {
      const payload = exercises.flatMap((ex) => 
        ex.sets.map((set, idx) => ({
          date,
          workout_day: workoutDay,
          workout_name: ex.name,
          set_no: idx + 1,
          weight: parseFloat(set.weight) || 0,
          reps: parseInt(set.reps) || 0,
          notes: ex.notes,
          time,
          duration_minutes: parseInt(duration) || 30
        }))
      );

      await supabase.from('workout_log').delete().eq('date', date);
      const { error } = await supabase.from('workout_log').insert(payload);
      if (error) throw error;

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
    <div className="flex flex-col min-h-screen bg-background pb-24 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        <PageHeader title="Workout Logger" >
        <div className="flex items-center gap-2">

          <Link 
            href="/reports/workout" 
            className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-muted-foreground/60 hover:text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
            title="View Reports"
          >
            <BarChart2 className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Link>
        </div>
      </PageHeader>
        <div className="-mt-2 mb-6">
          <SectionNav tabs={WORKOUT_TABS} />
        </div>

        <div className="space-y-6 w-full">
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="w-full space-y-6">
          <div className="bg-card rounded-md p-7 shadow-sm border border-border/40 space-y-7 relative z-40">
            <div className="grid grid-cols-[1.3fr_0.7fr] gap-3 relative z-30 w-full min-w-0">
              <div className="space-y-2 min-w-0">
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
              <div className="space-y-2 min-w-0">
                <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                  Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full min-w-0 h-11 bg-muted border-none rounded-md px-3 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner"
                />
              </div>
            </div>

            <div className="grid grid-cols-[1.3fr_0.7fr] gap-3 relative z-20 w-full min-w-0">
              <div className="space-y-2 min-w-0">
                <SearchableSelect 
                  label="Workout Day"
                  headerIcon={<Flame size={16} className="shrink-0" />}
                  value={workoutDay}
                  onChange={setWorkoutDay}
                  options={dayHistory}
                  createLabel="Workout Day"
                />
              </div>
              <div className="space-y-2 min-w-0">
                <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                  Duration
                </label>
                <input
                  type="number"
                  placeholder="30"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  inputMode="numeric"
                  className="w-full min-w-0 h-11 bg-muted border-none rounded-md px-3 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner"
                />
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
                      <div className="grid grid-cols-[3.5rem_1fr_1fr_2.5rem] gap-3 px-1 mb-1">
                        <div className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest text-center">Set</div>
                        <div className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest text-center">Weight</div>
                        <div className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest text-center">Reps</div>
                        <div></div>
                      </div>
                    )}

                    {ex.sets.map((set, setIdx) => {
                      const isPR = stats && parseFloat(set.weight) > stats.maxWeight && parseFloat(set.weight) > 0;
                      return (
                        <div key={setIdx} className="grid grid-cols-[3.5rem_1fr_1fr_2.5rem] gap-3 items-center">
                          <div className="h-12 flex items-center justify-center bg-muted/50 text-foreground font-black text-base rounded-md border border-border/40 shadow-sm">
                            {setIdx + 1}
                          </div>
                          <div className="relative group">
                            <input
                              type="number"
                              placeholder="kg"
                              value={set.weight}
                              onChange={(e) => updateSet(exIdx, setIdx, "weight", e.target.value)}
                              inputMode="decimal"
                              className={`w-full h-12 bg-muted border-none focus:ring-2 shadow-inner font-black text-lg text-center rounded-md transition-all ${isPR ? 'text-amber-600 focus:ring-amber-500/20' : 'text-foreground focus:ring-accent/20'}`}
                            />
                            {isPR && <Trophy size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 animate-pulse pointer-events-none" />}
                          </div>
                          <input
                            type="number"
                            placeholder="reps"
                            value={set.reps}
                            onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value)}
                            inputMode="numeric"
                            className="w-full h-12 bg-muted border-none focus:ring-2 focus:ring-accent/20 shadow-inner text-foreground font-black text-lg text-center rounded-md"
                          />
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
      </div>
    </div>
  );
}
