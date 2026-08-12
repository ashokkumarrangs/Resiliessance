"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { PlusCircle, Trash2, Edit2, Play, Search, Dumbbell, X, Save, CalendarDays, Check } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PageWrapper } from "@/components/PageWrapper";
import { WORKOUT_TABS } from "@/lib/navigation";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SearchableSelect } from "@/components/SearchableSelect";
import { SaveButton } from "@/components/ui/SaveButton";

interface TemplateSet {
  weight: string;
  reps: string;
}

interface TemplateExercise {
  id: string; // uuid from db or temp random string
  name: string;
  notes: string;
  sets: TemplateSet[];
}

interface Template {
  id: string;
  name: string;
  description: string;
  exercises?: TemplateExercise[];
}

export default function WorkoutTemplatesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [view, setView] = useState<'list' | 'editor'>('list');
  
  // Editor State
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [exercises, setExercises] = useState<TemplateExercise[]>([]);
  
  // For SearchableSelect options
  const [exerciseHistory, setExerciseHistory] = useState<string[]>([]);

  // Scheduling State
  const [schedulingTemplateId, setSchedulingTemplateId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");

  useEffect(() => {
    fetchTemplates();
    fetchExerciseHistory();
  }, []);

  async function fetchTemplates() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('workout_template')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchExerciseHistory() {
    try {
      const { data } = await supabase
        .from('workout_log')
        .select('workout_name')
        .not('workout_name', 'is', null);
      if (data) {
        const unique = Array.from(new Set(data.map(d => d.workout_name)));
        setExerciseHistory(unique as string[]);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function loadTemplateForEdit(template: Template) {
    setIsLoading(true);
    try {
      setEditingTemplateId(template.id);
      setTemplateName(template.name);
      setTemplateDesc(template.description || "");
      
      const { data: exData, error: exError } = await supabase
        .from('workout_template_exercise')
        .select('*, workout_template_set(*)')
        .eq('template_id', template.id)
        .order('sort_order', { ascending: true });
        
      if (exError) throw exError;
      
      const loadedExercises = (exData || []).map(ex => ({
        id: ex.id,
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
      setView('editor');
    } catch (error) {
      console.error(error);
      toast.error("Failed to load template details");
    } finally {
      setIsLoading(false);
    }
  }

  const handleCreateNew = () => {
    setEditingTemplateId(null);
    setTemplateName("");
    setTemplateDesc("");
    setExercises([]);
    setView('editor');
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

  const handleAddSet = (exIndex: number) => {
    const updated = [...exercises];
    updated[exIndex].sets.push({ weight: "", reps: "" });
    setExercises(updated);
  };

  const handleRemoveSet = (exIndex: number, setIndex: number) => {
    const updated = [...exercises];
    updated[exIndex].sets.splice(setIndex, 1);
    setExercises(updated);
  };

  const updateSet = (exIndex: number, setIndex: number, field: keyof TemplateSet, value: string) => {
    const updated = [...exercises];
    updated[exIndex].sets[setIndex][field] = value;
    setExercises(updated);
  };

  const updateExercise = (exIndex: number, field: keyof TemplateExercise, value: any) => {
    const updated = [...exercises];
    (updated[exIndex] as any)[field] = value;
    setExercises(updated);
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error("Template name is required");
      return;
    }
    if (exercises.length === 0) {
      toast.error("Please add at least one exercise");
      return;
    }

    for (const ex of exercises) {
      if (!ex.name.trim()) {
        toast.error("All exercises must have a name");
        return;
      }
      if (ex.sets.length === 0) {
        toast.error(`Exercise ${ex.name} must have at least one set`);
        return;
      }
    }

    setIsSaving(true);
    try {
      let tId = editingTemplateId;

      if (!tId) {
        // Insert new template
        const { data: newT, error: tErr } = await supabase
          .from('workout_template')
          .insert({ name: templateName, description: templateDesc })
          .select()
          .single();
        if (tErr) throw tErr;
        tId = newT.id;
      } else {
        // Update existing template
        const { error: tErr } = await supabase
          .from('workout_template')
          .update({ name: templateName, description: templateDesc })
          .eq('id', tId);
        if (tErr) throw tErr;
        
        // Delete old exercises (cascade will delete sets)
        const { error: delErr } = await supabase
          .from('workout_template_exercise')
          .delete()
          .eq('template_id', tId);
        if (delErr) throw delErr;
      }

      // Insert new exercises and sets
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        const { data: newEx, error: exErr } = await supabase
          .from('workout_template_exercise')
          .insert({
            template_id: tId,
            exercise_name: ex.name,
            sort_order: i,
            notes: ex.notes
          })
          .select()
          .single();
          
        if (exErr) throw exErr;

        const setsToInsert = ex.sets.map((s, idx) => ({
          template_exercise_id: newEx.id,
          set_no: idx + 1,
          target_weight: parseFloat(s.weight) || null,
          target_reps: parseInt(s.reps) || null
        }));

        const { error: sErr } = await supabase
          .from('workout_template_set')
          .insert(setsToInsert);
        
        if (sErr) throw sErr;
      }

      toast.success("Template saved successfully");
      setView('list');
      fetchTemplates();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const { error } = await supabase.from('workout_template').delete().eq('id', id);
      if (error) throw error;
      toast.success("Template deleted");
      fetchTemplates();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete template");
    }
  };

  const handleScheduleTemplate = async (templateId: string) => {
    if (!scheduleDate) {
      toast.error("Please select a date to schedule.");
      return;
    }
    try {
      const { error } = await supabase
        .from('scheduled_workout')
        .insert({
          template_id: templateId,
          scheduled_date: scheduleDate,
          status: 'planned'
        });
      
      if (error) throw error;
      toast.success("Workout scheduled successfully!");
      setSchedulingTemplateId(null);
      setScheduleDate("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to schedule workout.");
    }
  };

  if (isLoading && view === 'list') {
    return (
      <PageWrapper title="Templates" sectionTabs={WORKOUT_TABS}>
        <LoadingScreen message="Loading templates..." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Templates" sectionTabs={WORKOUT_TABS}>
      {view === 'list' ? (
        <div className="space-y-6 w-full">
          <div className="flex justify-between items-center bg-card p-6 rounded-md shadow-sm border border-border/40">
            <div>
              <h2 className="text-xl font-black text-foreground">My Templates</h2>
              <p className="text-sm text-muted-foreground mt-1">Create predefined routines to speed up your daily logging.</p>
            </div>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md font-bold text-sm transition-all shadow-sm"
            >
              <PlusCircle size={18} />
              Create Template
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(t => (
              <div 
                key={t.id} 
                onClick={() => loadTemplateForEdit(t)}
                className="group bg-card rounded-md p-6 shadow-sm border border-border/40 hover:border-accent/40 hover:shadow-md transition-all cursor-pointer relative"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-foreground group-hover:text-accent transition-colors">
                    {t.name}
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Optional: Navigate to logger with this template selected
                        router.push(`/workout?template=${t.id}`);
                      }}
                      className="p-2 bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-md transition-colors"
                      title="Start Workout"
                    >
                      <Play size={16} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSchedulingTemplateId(t.id);
                        setScheduleDate(new Date().toISOString().split('T')[0]);
                      }}
                      className="p-2 bg-muted text-muted-foreground hover:bg-accent/10 hover:text-accent rounded-md transition-colors"
                      title="Schedule Template"
                    >
                      <CalendarDays size={16} />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteTemplate(e, t.id)}
                      className="p-2 bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors"
                      title="Delete Template"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {t.description || "No description provided."}
                </p>

                {schedulingTemplateId === t.id && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="mt-4 p-4 bg-muted/30 rounded-md border border-border/50 flex flex-col gap-3"
                  >
                    <label className="text-xs font-bold text-muted-foreground">Select Date</label>
                    <div className="flex gap-2">
                      <input 
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="flex-1 bg-card border-none rounded-md px-3 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner h-9"
                      />
                      <button 
                        onClick={() => handleScheduleTemplate(t.id)}
                        className="bg-accent text-accent-foreground px-3 py-1 rounded-md text-xs font-bold hover:bg-accent/90 flex items-center gap-1"
                      >
                        <Check size={14} /> Schedule
                      </button>
                      <button 
                        onClick={() => setSchedulingTemplateId(null)}
                        className="bg-muted text-muted-foreground px-3 py-1 rounded-md text-xs font-bold hover:bg-muted/80 flex items-center gap-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {templates.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-card/50 rounded-md border border-dashed border-border">
                <Dumbbell className="mx-auto h-12 w-12 opacity-20 mb-3" />
                <p>No templates created yet.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6 w-full relative z-0">
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={() => setView('list')}
              className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              ← Back to Templates
            </button>
          </div>

          <div className="bg-card rounded-md p-7 shadow-sm border border-border/40 space-y-4">
            <div>
              <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Push Day A"
                className="w-full min-w-0 h-11 bg-muted border-none rounded-md px-3 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner"
              />
            </div>
            <div>
              <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                placeholder="Short description..."
                className="w-full min-w-0 h-11 bg-muted border-none rounded-md px-3 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-6">
            {exercises.map((ex, exIdx) => (
              <div key={ex.id} className="bg-card rounded-md p-6 shadow-sm border border-border/40 overflow-visible relative z-20">
                <div className="flex justify-between items-start mb-6 gap-4 relative z-30">
                  <div className="flex-1 space-y-1 relative">
                    <SearchableSelect 
                      label=""
                      headerIcon={<Dumbbell size={16} className="shrink-0" />}
                      value={ex.name}
                      onChange={(val) => updateExercise(exIdx, "name", val)}
                      options={exerciseHistory}
                      createLabel="Exercise"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(exIdx)}
                    className="p-2.5 mt-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all shadow-sm"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="space-y-2 mb-6">
                   <input
                     type="text"
                     value={ex.notes}
                     onChange={(e) => updateExercise(exIdx, "notes", e.target.value)}
                     placeholder="Notes (e.g. form cues)"
                     className="w-full min-w-0 h-9 bg-muted/50 border-none rounded-md px-3 text-xs text-foreground focus:ring-1 focus:ring-accent/20"
                   />
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-3 px-2 text-xs font-black text-muted-foreground/60 uppercase tracking-wider">
                    <div className="col-span-2 text-center">Set</div>
                    <div className="col-span-4 text-center">Target Weight</div>
                    <div className="col-span-4 text-center">Target Reps</div>
                    <div className="col-span-2"></div>
                  </div>

                  {ex.sets.map((set, setIdx) => (
                    <div key={setIdx} className="grid grid-cols-12 gap-3 items-center group relative z-10">
                      <div className="col-span-2 text-center text-sm font-bold text-muted-foreground">
                        {setIdx + 1}
                      </div>
                      <div className="col-span-4 relative">
                        <input
                          type="number"
                          inputMode="decimal"
                          value={set.weight}
                          onChange={(e) => updateSet(exIdx, setIdx, "weight", e.target.value)}
                          placeholder="—"
                          className="w-full min-w-0 h-11 bg-muted border-none rounded-md px-3 text-sm font-bold text-center text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner"
                        />
                      </div>
                      <div className="col-span-4 relative">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={set.reps}
                          onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value)}
                          placeholder="—"
                          className="w-full min-w-0 h-11 bg-muted border-none rounded-md px-3 text-sm font-bold text-center text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner"
                        />
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveSet(exIdx, setIdx)}
                          className="p-2 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleAddSet(exIdx)}
                  className="mt-6 w-full h-11 border-2 border-dashed border-border/50 hover:border-accent/40 rounded-md text-sm font-bold text-muted-foreground hover:text-accent transition-all flex items-center justify-center gap-2"
                >
                  <PlusCircle size={16} />
                  Add Set
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddExercise}
            className="w-full h-14 bg-card hover:bg-accent/5 border border-border/40 hover:border-accent/30 rounded-md text-sm font-black text-muted-foreground hover:text-accent transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <PlusCircle size={18} />
            Add Exercise
          </button>

          <div className="sticky bottom-4 z-50 pt-6">
            <SaveButton 
              onClick={handleSave} 
              isSaving={isSaving} 
              label={editingTemplateId ? "Update Template" : "Save Template"}
            />
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
