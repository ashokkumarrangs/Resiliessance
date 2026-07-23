'use client'
import { Select } from "@/components/Select";;
import Link from "next/link";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { AlertTriangle, AlignLeft, ArrowRight, Award, CheckCircle2, CheckSquare, ChevronDown, ChevronUp, CircleDot, Clock, Flame, Hash, History, Info, Palette, RefreshCw, Settings2, ShieldCheck, Timer , BarChart2 } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { PageHeader } from "@/components/PageHeader";
import { SaveButton } from "@/components/ui/SaveButton";
import { SectionNav } from "@/components/SectionNav";
import { SubNav } from "@/components/SubNav";
import { HABIT_TABS } from "@/lib/navigation";

const STEPS = [
  { id: 'basics', title: 'Basics' },
  { id: 'display', title: 'Display' },
  { id: 'conditions', title: 'Conditions' },
  { id: 'preview', title: 'Preview' },
];

const timeToDecimal = (timeStr: string) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) + ((m || 0) / 60);
};

const EMOJIS = ['🥳', '🏃', '💧', '🏋️', '🧘', '📚', '💊', '🚴', '🥗', '☕', '📱', '🖋️', '💤', '🥬', '🚶'];

import { use } from "react";
export default function EditHabitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [originalName, setOriginalName] = useState<string>("");
  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: groupData } = await supabase.from('habit_config').select('group_name');
      if (groupData) {
        const groups = Array.from(new Set(groupData.map(d => d.group_name))).filter(Boolean);
        setExistingGroups(groups as string[]);
      }

      const { data, error } = await supabase
        .from('habit_config')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (data) {
        setFormData({
          ...data,
          enable_tol: data.tol_min != null || data.tol_max != null,
          enable_crit: data.crit_min != null || data.crit_max != null,
          use_grace: (data.grace_days || 0) > 0,
          use_soft_grace: (data.soft_grace_days || 0) > 0,
          use_escalation: (data.escalation_days || 0) > 0,
          use_tol_cap: (data.tol_cap_days || 0) > 0,
        });
        setOriginalName(data.habit_name);
      }
    } catch (err: any) {
      toast.error('Failed to load habit');
      router.back();
    } finally {
      setLoading(false);
    }
  };
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [eventScoringMethod, setEventScoringMethod] = useState<'sum'|'count'>('sum');
  const [saving, setSaving] = useState(false);
  const [existingGroups, setExistingGroups] = useState<string[]>([]);
  const [isNewGroup, setIsNewGroup] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    habit_name: '',
    group_name: 'Core',
    frequency: 'daily',
    input_type: 'number',
    unit: '',
    condition_type: 'at_least_n',
    target_value: 1,
    suc_min: undefined as number | undefined,
    suc_max: undefined as number | undefined,
    tol_min: undefined as number | undefined,
    tol_max: undefined as number | undefined,
    crit_min: undefined as number | undefined,
    crit_max: undefined as number | undefined,
    direction: 'more' as 'more' | 'less',
    emoji: '🥳',
    habit_color: '#3b82f6',
    unlogged_is_success: false,
    group_order: 1,
    daily_habit_order: 1,
    // Streak Rules
    grace_days: 0,
    soft_grace_days: 0,
    escalation_days: 0,
    tol_cap_days: 0,
    enable_tol: false,
    enable_crit: false,
    use_grace: false,
    use_soft_grace: false,
    use_escalation: false,
    use_tol_cap: false,
  });

  const [groupHabits, setGroupHabits] = useState<{ id: string; habit_name: string; group_order: number }[]>([]);

  useEffect(() => {
    fetchExistingGroups();
  }, []);

  useEffect(() => {
    if (formData.group_name && !isNewGroup) {
      fetchGroupHabits(formData.group_name);
    } else {
      setGroupHabits([]);
    }
  }, [formData.group_name, isNewGroup]);

  const fetchGroupHabits = async (groupName: string) => {
    try {
      const { data } = await supabase
        .from('habit_config')
        .select('id, habit_name, group_order')
        .eq('group_name', groupName)
        .order('group_order', { ascending: true });
      if (data) {
        // Normalize group_order to be strictly sequential (1, 2, 3...) 
        // to fix any dirty data where multiple habits might have the same order
        const normalizedData = data.map((item, index) => ({
          ...item,
          group_order: index + 1
        }));
        setGroupHabits(normalizedData.filter((h: any) => h.id !== id));
        // Default new habit to end of list
        setFormData(prev => ({ ...prev, group_order: normalizedData.length + 1 }));
      }
    } catch (err) {
      console.error("Error fetching group habits:", err);
    }
  };

  const moveHabitUp = (index: number) => {
    if (index === 0) return;
    const list = [...groupHabits.map(h => ({ ...h, isNew: false })), { habit_name: formData.habit_name || 'Your Habit', group_order: formData.group_order, isNew: true, id: 'new' }].sort((a, b) => a.group_order - b.group_order);
    const current = list[index];
    const above = list[index - 1];
    const currentOrder = current.group_order;
    const aboveOrder = above.group_order;
    if (current.isNew) handleChange('group_order', aboveOrder);
    else if (above.isNew) handleChange('group_order', currentOrder);
    setGroupHabits(prev => prev.map(h => {
      if (h.id === current.id) return { ...h, group_order: aboveOrder };
      if (h.id === above.id) return { ...h, group_order: currentOrder };
      return h;
    }));
  };

  const moveHabitDown = (index: number) => {
    const list = [...groupHabits.map(h => ({ ...h, isNew: false })), { habit_name: formData.habit_name || 'Your Habit', group_order: formData.group_order, isNew: true, id: 'new' }].sort((a, b) => a.group_order - b.group_order);
    if (index >= list.length - 1) return;
    const current = list[index];
    const below = list[index + 1];
    const currentOrder = current.group_order;
    const belowOrder = below.group_order;
    if (current.isNew) handleChange('group_order', belowOrder);
    else if (below.isNew) handleChange('group_order', currentOrder);
    setGroupHabits(prev => prev.map(h => {
      if (h.id === current.id) return { ...h, group_order: belowOrder };
      if (h.id === below.id) return { ...h, group_order: currentOrder };
      return h;
    }));
  };

  const fetchExistingGroups = async () => {
    const { data } = await supabase.from('habit_config').select('group_name');
    if (data) {
      const groups = Array.from(new Set(data.map(d => d.group_name))).filter(Boolean);
      setExistingGroups(groups as string[]);
    }
  };

  const handleChange = (key: string, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [key]: value };
      // If frequency is event, yes/no (boolean) is not allowed
      if (key === 'frequency' && value === 'event' && prev.input_type === 'boolean') {
        next.input_type = 'number';
      }
      if (key === 'frequency' && value === 'event') {
        next.unlogged_is_success = false;
      }
      // Automate condition type for boolean input types
      if (key === 'input_type' && value === 'boolean') {
        next.condition_type = 'exactly_n';
      } else if (key === 'input_type' && prev.input_type === 'boolean' && value !== 'boolean') {
        next.condition_type = '';
      }
      return next;
    });
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      if (currentStep === 0 && !formData.habit_name) {
        toast.error('Please enter a habit name');
        return;
      }
      if (currentStep === 1) {
        if (!formData.group_name || !formData.group_name.trim()) {
          toast.error('Please select or create a category group');
          return;
        }
      }
      if (currentStep === 2) {
        if (formData.input_type !== 'boolean' && !formData.condition_type) {
          toast.error('Please select a success condition type');
          return;
        }
        if (formData.condition_type === 'between') {
          if (formData.suc_min !== undefined && formData.suc_max !== undefined && parseFloat(formData.suc_min as any) > parseFloat(formData.suc_max as any)) {
            toast.error('Success MIN cannot be greater than Success MAX');
            return;
          }
        } else {
          if (formData.target_value === undefined || formData.target_value === null || Number.isNaN(formData.target_value)) {
            toast.error('Please enter a valid target value');
            return;
          }
        }
      }
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
    else router.back();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { 
        ...formData,
        target_value: typeof formData.target_value === 'string' && formData.input_type === 'time' ? timeToDecimal(formData.target_value) : (typeof formData.target_value === 'string' ? parseFloat(formData.target_value) : formData.target_value),
        suc_min: typeof formData.suc_min === 'string' && formData.input_type === 'time' ? timeToDecimal(formData.suc_min) : (typeof formData.suc_min === 'string' ? parseFloat(formData.suc_min) : formData.suc_min),
        suc_max: typeof formData.suc_max === 'string' && formData.input_type === 'time' ? timeToDecimal(formData.suc_max) : (typeof formData.suc_max === 'string' ? parseFloat(formData.suc_max) : formData.suc_max),
        tol_min: formData.enable_tol ? formData.tol_min : null,
        tol_max: formData.enable_tol ? formData.tol_max : null,
        crit_min: formData.enable_crit ? formData.crit_min : null,
        crit_max: formData.enable_crit ? formData.crit_max : null,
        grace_days: formData.use_grace ? formData.grace_days : 0,
        soft_grace_days: formData.use_soft_grace ? formData.soft_grace_days : 0,
        escalation_days: formData.use_escalation ? formData.escalation_days : 0,
        tol_cap_days: formData.use_tol_cap ? formData.tol_cap_days : 0,
      };

      if (payload.condition_type === 'between') {
        if (payload.suc_min !== undefined && payload.suc_max !== undefined && parseFloat(payload.suc_min as any) > parseFloat(payload.suc_max as any)) {
          toast.error('Success MIN cannot be greater than Success MAX');
          setSaving(false);
          return;
        }
      } else {
        if (payload.target_value === undefined || payload.target_value === null || Number.isNaN(payload.target_value)) {
          toast.error('Please enter a valid target value');
          setSaving(false);
          return;
        }
      }

      // @ts-ignore
      delete payload.use_grace;
      // @ts-ignore
      delete payload.use_soft_grace;
      // @ts-ignore
      delete payload.use_escalation;
      // @ts-ignore
      delete payload.use_tol_cap;
      // @ts-ignore
      delete payload.enable_tol;
      // @ts-ignore
      delete payload.enable_crit;
      // @ts-ignore
      delete payload.id;
      // @ts-ignore
      delete payload.created_at;

      const newName = formData.habit_name.trim();

      if (originalName !== newName) {
        // 1. Check uniqueness of the new name
        const { data: nameCheck } = await supabase
          .from('habit_config')
          .select('id')
          .eq('habit_name', newName)
          .neq('id', id)
          .maybeSingle();

        if (nameCheck) {
          toast.error(`A habit named "${newName}" already exists. Please choose a unique name.`);
          setSaving(false);
          return;
        }

        // 2. Update config record
        const { error: updateError } = await supabase
          .from('habit_config')
          .update({ ...payload, habit_name: newName })
          .eq('id', id);
        if (updateError) throw updateError;

        // 3. Update referencing logs in habit_data
        await supabase
          .from('habit_data')
          .update({ habit: newName })
          .eq('habit', originalName);

        // 4. Update referencing logs in event_log
        await supabase
          .from('event_log')
          .update({ event: newName })
          .eq('event', originalName);

      } else {
        const { error } = await supabase
          .from('habit_config')
          .update(payload)
          .eq('id', id);

        if (error) throw error;
      }

      if (groupHabits.length > 0) {
        for (const h of groupHabits) {
          await supabase.from('habit_config').update({ group_order: h.group_order }).eq('id', h.id);
        }
      }

      toast.success('Habit updated successfully!');
      router.push('/habits/manage');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update habit');
    } finally {
      setSaving(false);
    }
  };
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
       <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground/20" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background pb-32 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        <PageHeader title="Edit Habit" >
        <div className="flex items-center gap-2">

          <Link 
            href="/reports/habits" 
            className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-muted-foreground/60 hover:text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
            title="View Reports"
          >
            <BarChart2 className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Link>
        </div>
      </PageHeader>
        <div className="-mt-2 mb-6">
          <SectionNav tabs={HABIT_TABS} />
        </div>

        {/* Stepper */}
        <SubNav 
          items={STEPS.map(s => s.title)}
          activeItem={STEPS[currentStep].title}
          onChange={(val) => {
            const idx = STEPS.findIndex(s => s.title === val);
            if (idx < currentStep) setCurrentStep(idx);
          }}
        />
        <div className="space-y-6 w-full mt-6">
        <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest text-center mt-2">
          Step {currentStep + 1} of 4 — {STEPS[currentStep].id === 'basics' ? 'Core Details' : STEPS[currentStep].id === 'display' ? 'Appearance' : STEPS[currentStep].id === 'conditions' ? 'Success conditions' : 'Review'}
        </div>

        {/* STEP 1: BASICS */}
        {currentStep === 0 && (
          <div className="space-y-4">
            {/* Identity Card */}
            <Card className="rounded-md border-white/20 shadow-zenith bg-card overflow-hidden">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                   <div className="flex items-center gap-2 text-primary">
                      <Palette size={14} className="fill-current" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Identity</span>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-sm font-black text-foreground">Habit Name <span className="text-primary">*</span></Label>
                      <Input 
                        placeholder="e.g. Sleep, Morning Walk, Water" 
                        value={formData.habit_name}
                        onChange={(e) => handleChange('habit_name', e.target.value)}
                        className="h-16 rounded-md bg-muted/50 border border-border shadow-inner text-lg font-bold placeholder:text-muted-foreground/30 focus:ring-primary/20 text-foreground"
                      />
                   </div>
                   <div className="space-y-3">
                      <Label className="text-xs font-bold text-muted-foreground/60 italic">Emoji <span className="font-normal opacity-60">optional</span></Label>
                      <div className="flex flex-wrap gap-2">
                        {EMOJIS.map(e => (
                          <button 
                            key={e}
                            onClick={() => handleChange('emoji', e)}
                            className={`w-11 h-11 flex items-center justify-center text-xl rounded-md transition-all ${formData.emoji === e ? 'bg-primary/20 ring-2 ring-primary scale-110 shadow-lg' : 'bg-muted/50 hover:bg-muted text-muted-foreground'}`}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                   </div>
                </div>
              </CardContent>
            </Card>

            {/* READONLY: TRACKING LOGIC */}
            <Card className="rounded-md border-white/20 shadow-zenith bg-muted/20">
              <CardContent className="p-6 space-y-4 opacity-70">
                <div className="flex items-center gap-4 justify-between">
                   <div className="flex items-center gap-2 text-primary/40">
                      <History size={14} className="fill-current" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tracking Log</span>
                   </div>
                   <div className="flex gap-2">
                      <div className="px-2 py-1 rounded bg-background border border-border/40 text-[9px] font-black uppercase tracking-widest">{formData.frequency === 'daily' ? 'Daily' : 'Event'}</div>
                      <div className="px-2 py-1 rounded bg-background border border-border/40 text-[9px] font-black uppercase tracking-widest">{formData.input_type}</div>
                   </div>
                </div>
                <div className="text-[10px] font-medium text-muted-foreground/40 italic flex items-center gap-1">
                   <Info size={12}/> Frequency and Input Type cannot be changed after creation.
                </div>
              </CardContent>
            </Card>

            {/* Unit Card */}
            {formData.input_type !== 'boolean' && (
            <Card className="rounded-md border-white/20 shadow-zenith bg-card overflow-hidden">
               <CardContent className="p-6 space-y-5">
                  <div className="flex items-center gap-2 text-primary">
                     <AlignLeft size={14} />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em]">Measurement Unit</span>
                  </div>
                  <div className="space-y-1.5 pt-2">
                     <Label className="text-xs font-bold text-muted-foreground/60 font-mono">Unit <span className="text-[8px] font-normal opacity-50 ml-1 italic">shown next to value</span></Label>
                     <Input 
                       placeholder="hrs, glasses, steps, km..." 
                       value={formData.unit}
                       onChange={(e) => handleChange('unit', e.target.value)}
                       className="h-14 rounded-md bg-muted/50 border border-border shadow-inner font-bold text-foreground placeholder:text-muted-foreground/30"
                     />
                  </div>
               </CardContent>
            </Card>
            )}
          </div>
        )}

        {/* STEP 2: DISPLAY */}
        {currentStep === 1 && (
          <div className="space-y-6">
             <Card className="rounded-md border-white/20 shadow-zenith bg-card overflow-hidden">
                <CardContent className="p-8 space-y-8">
                   <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-primary mb-2">
                         <div className="w-4 h-4 bg-primary rounded-md flex items-center justify-center text-primary-foreground"><ArrowRight size={10} /></div>
                         <span className="text-[10px] font-black uppercase tracking-[0.2em]">Group</span>
                      </div>
                      <Label className="text-lg font-black text-foreground">Group <span className="text-primary ml-1 font-black">*</span> <span className="text-[9px] font-bold text-muted-foreground/60 ml-2 uppercase tracking-tighter opacity-70 italic">groups habits into cards</span></Label>
                      <div className="relative pt-2">
                        <div className="absolute left-6 top-[2.4rem] w-1.5 h-1.5 rounded-md bg-muted-foreground/30 z-10" />
                        <Select 
                          value={isNewGroup ? 'NEW' : formData.group_name} 
                          onChange={(e) => {
                            if (e.target.value === 'NEW') {
                              setIsNewGroup(true);
                              handleChange('group_name', '');
                            } else {
                              setIsNewGroup(false);
                              handleChange('group_name', e.target.value);
                            }
                          }}
                          className="w-full h-16 rounded-md bg-muted/50 border border-border shadow-inner px-12 font-bold text-foreground appearance-none focus:ring-primary/20 cursor-pointer"
                        >
                          <option value="">— Select existing group —</option>
                          {existingGroups.map(g => <option key={g} value={g}>{g}</option>)}
                          <option value="NEW">+ Create New Group</option>
                        </Select>
                      </div>
                      {isNewGroup && (
                        <div className="pt-2">
                          <Input 
                            placeholder="Enter new group name..." 
                            value={formData.group_name}
                            className="h-14 rounded-md border border-primary/20 bg-muted/30 font-bold text-foreground"
                            onChange={(e) => handleChange('group_name', e.target.value)}
                          />
                        </div>
                      )}
                   </div>

                   <div className="pt-4 border-t border-border/10">
                     <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3">Order in {formData.group_name || 'Group'}</div>
                     
                     <div className="bg-muted/30 rounded-xl p-3 space-y-1">
                        {[...groupHabits.map(h => ({ ...h, isNew: false })), { habit_name: formData.habit_name || 'Your Habit', group_order: formData.group_order, isNew: true, id: 'new' }]
                           .sort((a, b) => a.group_order - b.group_order)
                           .map((gh, idx, arr) => (
                           <div key={gh.id} className={`flex items-center justify-between p-2 rounded-lg transition-all ${gh.isNew ? 'bg-primary/10 border border-primary/20 shadow-sm' : 'hover:bg-card border border-transparent'}`}>
                              <div className="flex items-center gap-3">
                                 <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black ${gh.isNew ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/10 text-muted-foreground'}`}>
                                    {gh.group_order}
                                 </div>
                                 <span className={`text-xs font-bold ${gh.isNew ? 'text-primary' : 'text-foreground/70'}`}>
                                    {gh.habit_name} {gh.isNew && '(New)'}
                                 </span>
                              </div>
                              
                              <div className="flex gap-1">
                                 <button
                                    onClick={() => moveHabitUp(idx)}
                                    disabled={idx === 0}
                                    className="w-6 h-6 flex items-center justify-center rounded bg-card hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm border border-border/40"
                                 >
                                    <ChevronUp size={12} />
                                 </button>
                                 <button
                                    onClick={() => moveHabitDown(idx)}
                                    disabled={idx === arr.length - 1}
                                    className="w-6 h-6 flex items-center justify-center rounded bg-card hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm border border-border/40"
                                 >
                                    <ChevronDown size={12} />
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>
                   </div>
                </CardContent>
             </Card>
          </div>
        )}

        {/* STEP 3: CONDITIONS */}
        {currentStep === 2 && (
          <div className="space-y-6">
             <Card className="rounded-md border-white/20 shadow-zenith bg-card overflow-hidden">
                <CardContent className="p-6 space-y-6">
                   <div className="flex items-center gap-2 text-primary">
                      <Award size={14} className="fill-current" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Success Condition</span>
                   </div>

                    {formData.frequency === 'event' && (
                       <>
                         {['number', 'duration'].includes(formData.input_type) && (
                           <div className="mb-6 space-y-3">
                             <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Event Scoring Strategy</Label>
                             <div className="flex gap-2">
                               <button type="button" onClick={() => setEventScoringMethod('sum')} className={`flex-1 h-12 rounded-lg font-black text-xs transition-all ${eventScoringMethod === 'sum' ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' : 'bg-muted/50 text-muted-foreground border border-border'}`}>
                                 Sum of Values
                               </button>
                               <button type="button" onClick={() => setEventScoringMethod('count')} className={`flex-1 h-12 rounded-lg font-black text-xs transition-all ${eventScoringMethod === 'count' ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' : 'bg-muted/50 text-muted-foreground border border-border'}`}>
                                 Count of Events
                               </button>
                             </div>
                           </div>
                         )}
                         <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-start gap-2 mb-4">
                            <Info size={14} className="text-primary mt-0.5 shrink-0" />
                            <p className="text-[10px] font-medium text-foreground leading-relaxed">
                               <strong className="font-black text-primary uppercase tracking-wider block mb-0.5">Scoring Strategy</strong>
                               {['number', 'duration'].includes(formData.input_type) 
                                 ? (eventScoringMethod === 'sum' 
                                     ? "Target represents the SUM of all values logged today (e.g. 20 mins + 30 mins = 50 mins)." 
                                     : "Target represents the TOTAL COUNT of events logged today (e.g. worked out 2 times).")
                                 : "Target represents the TOTAL COUNT of events logged today (e.g. took medicine 3 times)."}
                            </p>
                         </div>
                       </>
                    )}
                   {formData.input_type !== 'boolean' && (
                   <div className="space-y-4">
                      <Label className="text-lg font-black text-foreground">Condition Type <span className="text-primary">*</span></Label>
                      <div className="flex flex-wrap gap-2">
                         <ConditionBtn icon={<AlignLeft size={16}/>} label="Between" active={formData.condition_type === 'between'} onClick={() => handleChange('condition_type', 'between')} color="bg-primary" />
                         <ConditionBtn icon={<ArrowRight size={16}/>} label="Above/Below" active={formData.condition_type === 'above_below'} onClick={() => handleChange('condition_type', 'above_below')} color="bg-primary" />
                         <ConditionBtn icon={<Hash size={16}/>} label="Exact Value" active={formData.condition_type === 'exactly_n'} onClick={() => handleChange('condition_type', 'exactly_n')} color="bg-primary" />
                      </div>
                   </div>
                   )}

                   {/* BOOLEAN TARGET */}
                   {formData.input_type === 'boolean' && (
                      <div className="space-y-4">
                         <Label className="text-lg font-black text-foreground">Target Answer <span className="text-primary">*</span></Label>
                         <InputRange label="SUCCESS" value={formData.target_value ?? 1} onChange={(v: any) => handleChange('target_value', v)} color="border-accent/40 bg-accent/10 text-accent-foreground" inputType="boolean" />
                         <p className="text-xs text-muted-foreground/60 italic">If you select NO, logging a NO will be treated as a success.</p>
                      </div>
                   )}

                   {/* DYNAMIC RULE FIELDS */}
                   {formData.condition_type === 'between' && formData.input_type !== 'boolean' && (
                      <div className="space-y-6">
                         <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Success Range</Label>
                            <div className="grid grid-cols-2 gap-4">
                               <InputRange label="MIN" value={formData.suc_min || ''} onChange={(v: any) => handleChange('suc_min', v)} color="border-accent/40 bg-accent/10 text-accent-foreground" inputType={formData.input_type} />
                               <InputRange label="MAX" value={formData.suc_max || ''} onChange={(v: any) => handleChange('suc_max', v)} color="border-accent/40 bg-accent/10 text-accent-foreground" inputType={formData.input_type} />
                            </div>
                         </div>
                         <div className="space-y-3">
                            <div className="flex items-center justify-between">
                               <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Tolerance Zone <span className="text-[8px] font-normal italic opacity-60 lowercase ml-2 flex items-center gap-1 inline-flex"><Info size={8}/> optional — close but not quite</span></Label>
                               <Switch checked={formData.enable_tol} onCheckedChange={(v: any) => handleChange("enable_tol", v)} />
                            </div>
                            {formData.enable_tol && (
                               <div className="grid grid-cols-2 gap-4">
                               <InputRange label="BELOW SUC" value={formData.tol_min || ''} onChange={(v: any) => handleChange('tol_min', v)} color="border-border/60 bg-muted/30 text-foreground" inputType={formData.input_type} />
                               <InputRange label="ABOVE SUC" value={formData.tol_max || ''} onChange={(v: any) => handleChange('tol_max', v)} color="border-border/60 bg-muted/30 text-foreground" inputType={formData.input_type} />
                            </div>
                            )}
                         </div>
                         <div className="space-y-3">
                            <div className="flex items-center justify-between">
                               <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Critical Zone <span className="text-[8px] font-normal italic opacity-60 lowercase ml-2 flex items-center gap-1 inline-flex"><Info size={8}/> optional — danger</span></Label>
                               <Switch checked={formData.enable_crit} onCheckedChange={(v: any) => handleChange("enable_crit", v)} />
                            </div>
                            {formData.enable_crit && (
                               <div className="grid grid-cols-2 gap-4">
                               <InputRange label="BELOW" value={formData.crit_min || ''} onChange={(v: any) => handleChange('crit_min', v)} color="border-primary/20 bg-primary/10 text-primary" inputType={formData.input_type} />
                               <InputRange label="ABOVE" value={formData.crit_max || ''} onChange={(v: any) => handleChange('crit_max', v)} color="border-primary/20 bg-primary/10 text-primary" inputType={formData.input_type} />
                            </div>
                            )}
                         </div>
                      </div>
                   )}

                    {formData.condition_type === 'above_below' && (
                      <div className="space-y-6">
                         <div className="space-y-3">
                            <Label className="text-lg font-black text-foreground">Direction</Label>
                            <div className="flex gap-4">
                               <SelectBtn active={formData.direction === 'more'} label="More is better" icon={<CheckCircle2 size={16}/>} onClick={() => handleChange('direction', 'more')} />
                               <SelectBtn active={formData.direction === 'less'} label="Less is better" icon={<AlertTriangle size={16}/>} onClick={() => handleChange('direction', 'less')} />
                            </div>
                         </div>
                         <div className="space-y-4">
                            <Label className="text-lg font-black text-foreground">Success Threshold</Label>
                            <InputRange label="TARGET" value={formData.target_value} onChange={(v: any) => handleChange('target_value', v)} color="border-accent/40 bg-accent/10 text-accent-foreground" inputType={formData.input_type} />
                         </div>
                         <div className="space-y-4">
                            <div className="flex items-center justify-between">
                               <Label className="text-lg font-black text-foreground">Tolerance <span className="text-[8px] font-normal italic opacity-60 lowercase ml-2 flex items-center gap-1 inline-flex"><Info size={8}/> optional — just below/above target</span></Label>
                               <Switch checked={formData.enable_tol} onCheckedChange={(v: any) => handleChange("enable_tol", v)} />
                            </div>
                            {formData.enable_tol && (
                               <InputRange label={formData.direction === 'more' ? 'TOL. MIN' : 'TOL. MAX'} value={formData.direction === 'more' ? formData.tol_min || '' : formData.tol_max || ''} onChange={(v: any) => formData.direction === 'more' ? handleChange('tol_min', v) : handleChange('tol_max', v)} color="border-border/60 bg-muted/30 text-foreground" inputType={formData.input_type} />
                            )}
                         </div>
                         <div className="space-y-4">
                            <div className="flex items-center justify-between">
                               <Label className="text-lg font-black text-foreground">Critical Threshold <span className="text-[8px] font-normal italic opacity-60 lowercase ml-2 inline-flex"><Info size={8}/> optional</span></Label>
                               <Switch checked={formData.enable_crit} onCheckedChange={(v: any) => handleChange("enable_crit", v)} />
                            </div>
                            {formData.enable_crit && (
                               <InputRange label="DANGER" value={formData.direction === 'more' ? formData.crit_min || '' : formData.crit_max || ''} onChange={(v: any) => formData.direction === 'more' ? handleChange('crit_min', v) : handleChange('crit_max', v)} color="border-primary/20 bg-primary/10 text-primary" inputType={formData.input_type} />
                            )}
                         </div>
                      </div>
                    )}

                    {formData.condition_type === 'at_least_n' && formData.input_type !== 'boolean' && (
                       <div className="space-y-6">
                          <div className="space-y-4">
                             <Label className="text-lg font-black text-foreground">Success Threshold</Label>
                             <InputRange label="TARGET" value={formData.target_value} onChange={(v: any) => handleChange('target_value', v)} color="border-accent/40 bg-accent/10 text-accent-foreground" inputType={formData.input_type} />
                          </div>
                          <div className="space-y-4">
                             <div className="flex items-center justify-between">
                               <Label className="text-lg font-black text-foreground">Tolerance <span className="text-[8px] font-normal italic opacity-60 lowercase ml-2 flex items-center gap-1 inline-flex"><Info size={8}/> optional — just below target</span></Label>
                               <Switch checked={formData.enable_tol} onCheckedChange={(v: any) => handleChange("enable_tol", v)} />
                            </div>
                            {formData.enable_tol && (
                               <InputRange label="TOL. MIN" value={formData.tol_min || ''} onChange={(v: any) => handleChange('tol_min', v)} color="border-border/60 bg-muted/30 text-foreground" inputType={formData.input_type} />
                            )}
                          </div>
                          <div className="space-y-4">
                             <div className="flex items-center justify-between">
                               <Label className="text-lg font-black text-foreground">Critical Threshold <span className="text-[8px] font-normal italic opacity-60 lowercase ml-2 inline-flex"><Info size={8}/> optional</span></Label>
                               <Switch checked={formData.enable_crit} onCheckedChange={(v: any) => handleChange("enable_crit", v)} />
                            </div>
                            {formData.enable_crit && (
                               <InputRange label="DANGER" value={formData.crit_min || ''} onChange={(v: any) => handleChange('crit_min', v)} color="border-primary/20 bg-primary/10 text-primary" inputType={formData.input_type} />
                            )}
                          </div>
                       </div>
                    )}

                    {formData.condition_type === 'at_most_n' && formData.input_type !== 'boolean' && (
                       <div className="space-y-6">
                          <div className="space-y-4">
                             <Label className="text-lg font-black text-foreground">Success Threshold</Label>
                             <InputRange label="TARGET" value={formData.target_value} onChange={(v: any) => handleChange('target_value', v)} color="border-accent/40 bg-accent/10 text-accent-foreground" inputType={formData.input_type} />
                          </div>
                          <div className="space-y-4">
                             <div className="flex items-center justify-between">
                               <Label className="text-lg font-black text-foreground">Tolerance <span className="text-[8px] font-normal italic opacity-60 lowercase ml-2 flex items-center gap-1 inline-flex"><Info size={8}/> optional — just above target</span></Label>
                               <Switch checked={formData.enable_tol} onCheckedChange={(v: any) => handleChange("enable_tol", v)} />
                            </div>
                            {formData.enable_tol && (
                               <InputRange label="TOL. MAX" value={formData.tol_max || ''} onChange={(v: any) => handleChange('tol_max', v)} color="border-border/60 bg-muted/30 text-foreground" inputType={formData.input_type} />
                            )}
                          </div>
                          <div className="space-y-4">
                             <div className="flex items-center justify-between">
                               <Label className="text-lg font-black text-foreground">Critical Threshold <span className="text-[8px] font-normal italic opacity-60 lowercase ml-2 inline-flex"><Info size={8}/> optional</span></Label>
                               <Switch checked={formData.enable_crit} onCheckedChange={(v: any) => handleChange("enable_crit", v)} />
                            </div>
                            {formData.enable_crit && (
                               <InputRange label="DANGER" value={formData.crit_max || ''} onChange={(v: any) => handleChange('crit_max', v)} color="border-primary/20 bg-primary/10 text-primary" inputType={formData.input_type} />
                            )}
                          </div>
                       </div>
                    )}

                    {formData.condition_type === 'exactly_n' && formData.input_type !== 'boolean' && (
                       <div className="space-y-6">
                          <div className="space-y-4">
                             <Label className="text-lg font-black text-foreground">Success Target</Label>
                             <InputRange label="TARGET" value={formData.target_value} onChange={(v: any) => handleChange('target_value', v)} color="border-accent/40 bg-accent/10 text-accent-foreground" inputType={formData.input_type} />
                          </div>
                          <div className="space-y-3">
                             <div className="flex items-center justify-between">
                               <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Tolerance Zone <span className="text-[8px] font-normal italic opacity-60 lowercase ml-2 flex items-center gap-1 inline-flex"><Info size={8}/> optional — close to target</span></Label>
                               <Switch checked={formData.enable_tol} onCheckedChange={(v: any) => handleChange("enable_tol", v)} />
                            </div>
                            {formData.enable_tol && (
                               <div className="grid grid-cols-2 gap-4">
                                <InputRange label="MIN" value={formData.tol_min || ''} onChange={(v: any) => handleChange('tol_min', v)} color="border-border/60 bg-muted/30 text-foreground" inputType={formData.input_type} />
                                <InputRange label="MAX" value={formData.tol_max || ''} onChange={(v: any) => handleChange('tol_max', v)} color="border-border/60 bg-muted/30 text-foreground" inputType={formData.input_type} />
                             </div>
                            )}
                          </div>
                          <div className="space-y-3">
                             <div className="flex items-center justify-between">
                               <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Critical Zone <span className="text-[8px] font-normal italic opacity-60 lowercase ml-2 flex items-center gap-1 inline-flex"><Info size={8}/> optional — far from target</span></Label>
                               <Switch checked={formData.enable_crit} onCheckedChange={(v: any) => handleChange("enable_crit", v)} />
                            </div>
                            {formData.enable_crit && (
                               <div className="grid grid-cols-2 gap-4">
                                <InputRange label="BELOW" value={formData.crit_min || ''} onChange={(v: any) => handleChange('crit_min', v)} color="border-primary/20 bg-primary/10 text-primary" inputType={formData.input_type} />
                                <InputRange label="ABOVE" value={formData.crit_max || ''} onChange={(v: any) => handleChange('crit_max', v)} color="border-primary/20 bg-primary/10 text-primary" inputType={formData.input_type} />
                             </div>
                            )}
                          </div>
                       </div>
                    )}
                 </CardContent>
              </Card>

              {/* AVOIDANCE LOGIC CARD */}
              {formData.frequency !== 'event' && (
                <Card className="rounded-md border-white/20 shadow-zenith bg-card overflow-hidden">
                   <CardContent className="p-6">
                      <div className="flex items-center justify-between gap-4">
                         <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 text-primary mb-1">
                               <ShieldCheck size={14} className="fill-current" />
                               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Avoidance Logic</span>
                            </div>
                            <h4 className="text-sm font-black text-foreground uppercase tracking-tight">Mark as success by default?</h4>
                            <p className="text-[10px] font-medium text-muted-foreground/60 leading-normal">
                               If active, this habit will be marked as a <span className="text-accent font-bold italic">Success</span> even if you don&apos;t log it today. Perfect for habits like &quot;No Junk Food&quot;.
                            </p>
                         </div>
                         <Switch 
                           checked={formData.unlogged_is_success} 
                           onCheckedChange={(val) => handleChange('unlogged_is_success', val)}
                           className="data-[state=checked]:bg-primary"
                         />
                      </div>
                   </CardContent>
                </Card>
              )}

             {/* STREAK RULES CARD */}
             <Card className="rounded-md border-white/20 shadow-zenith bg-card overflow-hidden">
                <CardContent className="p-6 space-y-4">
                   <div className="flex items-center gap-2 text-primary mb-2">
                       <RefreshCw size={14} className="fill-current" />
                       <span className="text-[10px] font-black uppercase tracking-[0.2em]">Streak Rules</span>
                       <span className="text-[8px] font-normal italic opacity-40 lowercase ml-auto self-center">all optional</span>
                   </div>
                   
                   <div className="space-y-3">
                      <RuleToggle 
                        icon="🎁" 
                        title="Grace" 
                        desc={<span>after <span className="bg-accent/10 px-1.5 rounded-md font-mono text-accent">N consecutive successes</span> → today&apos;s <span className="bg-primary/10 text-primary px-1.5 rounded-md font-mono">failure</span> = <span className="bg-accent/10 text-accent px-1 rounded-md font-mono">success</span></span>}
                        active={formData.use_grace} 
                        days={formData.grace_days}
                        onToggle={(v: any) => handleChange('use_grace', v)}
                        onDaysChange={(v: any) => handleChange('grace_days', v)}
                        daysLabel="consecutive successes"
                      />
                      <RuleToggle 
                        icon="☁️" 
                        disabled={!formData.enable_tol}
                        title="Soft Grace" 
                        desc={<span>after <span className="bg-accent/10 px-1.5 rounded-md font-mono text-accent">N consecutive successes</span> → today&apos;s <span className="bg-muted/30 text-foreground px-1.5 rounded-md font-mono">tolerance</span> = <span className="bg-accent/10 text-accent px-1 rounded-md font-mono">success</span></span>}
                        active={formData.use_soft_grace} 
                        days={formData.soft_grace_days}
                        onToggle={(v: any) => handleChange('use_soft_grace', v)}
                        onDaysChange={(v: any) => handleChange('soft_grace_days', v)}
                        daysLabel="consecutive successes"
                      />
                      <RuleToggle 
                        icon="🚨" 
                        disabled={!formData.enable_crit}
                        title="Escalation" 
                        desc={<span>after <span className="bg-primary/10 text-primary px-1.5 rounded-md font-mono">N consecutive failures</span> → today&apos;s <span className="bg-primary/10 text-primary px-1.5 rounded-md font-mono">failure</span> = <span className="bg-muted text-muted-foreground px-1.5 rounded-md font-mono">critical</span></span>}
                        active={formData.use_escalation} 
                        days={formData.escalation_days}
                        onToggle={(v: any) => handleChange('use_escalation', v)}
                        onDaysChange={(v: any) => handleChange('escalation_days', v)}
                        daysLabel="consecutive failures"
                      />
                      <RuleToggle 
                        icon="📉" 
                        disabled={!formData.enable_tol}
                        title="Tolerance Cap" 
                        desc={<span>after <span className="bg-muted/30 text-foreground px-1.5 rounded-md font-mono">N consecutive tolerance days</span> → today&apos;s <span className="bg-muted/30 text-foreground px-1.5 rounded-md font-mono">tolerance</span> = <span className="bg-primary/10 text-primary px-1 rounded-md font-mono">failure</span></span>}
                        active={formData.use_tol_cap} 
                        days={formData.tol_cap_days}
                        onToggle={(v: any) => handleChange('use_tol_cap', v)}
                        onDaysChange={(v: any) => handleChange('tol_cap_days', v)}
                        daysLabel="consecutive tolerance days"
                      />
                   </div>
                </CardContent>
             </Card>
          </div>
        )}

        {/* STEP 4: PREVIEW */}
        {currentStep === 3 && (
          <div className="space-y-6">
              {/* PREVIEW CONTAINER */}
              {formData.frequency === 'daily' ? (
                <div className="flex flex-col gap-2">
                   <div className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Preview — Daily Log Card</div>
                   <div className="bg-card rounded-2xl border border-border/40 p-5 shadow-sm">
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/20 border border-border/30">
                         <div className="w-8 flex flex-col items-center shrink-0 opacity-50"><span className="text-lg">{formData.emoji || '⭐'}</span></div>
                         <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                               <div className="text-sm font-bold text-foreground truncate">
                                  {formData.habit_name || 'My Habit'}
                                </div>
                                <div className="shrink-0">
                                   <CircleDot size={16} className="text-muted-foreground/30 shrink-0" />
                                </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                            <div className="w-20 flex justify-end">
                               {formData.input_type === 'boolean' ? (
                                  <div className="relative group w-full">
                                     <select disabled className="w-full h-8 bg-muted border-none rounded-lg pl-2 pr-6 text-xs font-bold text-foreground appearance-none shadow-inner text-center">
                                        <option>—</option>
                                        <option>Yes</option>
                                        <option>No</option>
                                     </select>
                                     <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none" />
                                  </div>
                               ) : formData.input_type === 'duration' ? (
                                  <div className="flex items-center gap-1 w-full justify-end">
                                     <input disabled type="number" placeholder="0" className="w-7 h-8 rounded-lg bg-muted border-none text-center font-bold text-xs p-0.5 text-foreground" />
                                     <span className="text-[9px] font-bold opacity-40">h</span>
                                     <input disabled type="number" placeholder="00" className="w-7 h-8 rounded-lg bg-muted border-none text-center font-bold text-xs p-0.5 text-foreground" />
                                     <span className="text-[9px] font-bold opacity-40">m</span>
                                  </div>
                               ) : formData.input_type === 'time' ? (
                                  <div className="relative group w-full">
                                     <input disabled type="time" className="w-full h-8 rounded-lg bg-muted border-none text-center font-bold text-xs appearance-none shadow-inner px-2 text-foreground" />
                                     <Clock size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none" />
                                  </div>
                               ) : (
                                  <input disabled type={formData.input_type === 'number' ? 'number' : 'text'} placeholder="--" className="w-full h-8 rounded-lg bg-muted border-none text-center font-bold text-xs text-foreground" />
                               )}
                            </div>
                            <span className="text-[9px] font-black uppercase opacity-30 w-6 text-right truncate">{formData.unit || 'pt'}</span>
                         </div>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Event Previews */}
                  <div className="flex flex-col gap-2">
                     <div className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Preview 1 — Event Log Card</div>
                     <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden bg-card transition-all">
                        <div className="p-5 flex flex-col gap-4">
                           <div className="flex justify-between items-center">
                              <h2 className="text-xl font-bold uppercase tracking-tighter flex items-center gap-2">
                                 <span className="text-2xl">{formData.emoji || '⭐'}</span>
                                 <span className="truncate">{formData.habit_name || 'My Habit'}</span>
                                 <CircleDot size={18} className="text-muted-foreground/30 shrink-0" />
                              </h2>
                              <div className="flex items-center gap-2">
                                 <div className="h-8 min-w-[36px] px-2 flex items-center justify-center bg-muted text-foreground border border-border/40 rounded-md text-xs font-black shadow-sm">
                                    0
                                 </div>
                                 <div className="h-8 min-w-[40px] px-2.5 flex items-center justify-center rounded-md border border-border/40 text-xs font-black tracking-wider shadow-sm bg-muted text-foreground">
                                    0{formData.unit ? ` ${formData.unit}` : ''}
                                 </div>
                              </div>
                           </div>

                           <div className="flex items-end gap-2.5 min-h-[50px] w-full">
                              <div className="w-[70px] flex flex-col justify-end">
                                 <label className="text-[9px] font-black uppercase opacity-30 mb-1 ml-1 leading-none">Time</label>
                                 <input disabled type="time" className="bg-muted/50 border-none h-9 min-h-[36px] rounded-md font-bold text-center py-0 px-1 text-foreground text-xs w-full" />
                              </div>

                              <div className="flex-[2] flex flex-col justify-end">
                                 <label className="text-[9px] font-black uppercase opacity-30 mb-1 ml-1 leading-none">Notes</label>
                                 <input disabled placeholder="Details..." className="bg-muted/50 border-none h-9 min-h-[36px] rounded-md font-bold shadow-inner placeholder:text-muted-foreground/30 text-foreground text-xs py-0 px-2 w-full" />
                              </div>

                              {formData.input_type === 'boolean' ? (
                                 <div className="flex-1 flex flex-col justify-end">
                                    <label className="text-[9px] font-black uppercase opacity-30 mb-1 ml-1 leading-none">Value</label>
                                    <div className="relative group">
                                       <select disabled className="w-full h-9 min-h-[36px] bg-muted/50 border-none rounded-md pl-1.5 pr-5 text-xs font-bold text-foreground appearance-none shadow-inner transition-all py-0">
                                          <option>Yes</option>
                                          <option>No</option>
                                       </select>
                                       <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none" />
                                    </div>
                                 </div>
                              ) : (
                                 <div className="flex-1 flex flex-col justify-end relative">
                                    <label className="text-[9px] font-black uppercase opacity-30 mb-1 ml-1 leading-none">
                                       {formData.input_type === 'time' ? 'Time' : formData.input_type === 'duration' ? 'Duration' : 'Value'}
                                    </label>
                                    <input disabled type={formData.input_type === 'time' || formData.input_type === 'duration' ? 'time' : formData.input_type === 'number' ? 'number' : 'text'} placeholder={formData.input_type === 'text' ? 'Enter...' : formData.input_type === 'duration' ? 'HH:MM' : '0'} className="bg-muted/50 border-none h-9 min-h-[36px] rounded-md font-black text-center shadow-inner text-foreground placeholder:text-muted-foreground/20 text-xs py-0 px-1 w-full" />
                                 </div>
                              )}

                              <button disabled className="h-9 min-h-[36px] px-3.5 bg-emerald-600/50 text-white rounded-md text-xs font-black transition-all flex items-center justify-center gap-1">
                                 Log
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-col gap-2">
                     <div className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Preview 2 — Daily Log Row (Aggregated View)</div>
                     <div className="bg-card rounded-2xl border border-border/40 p-5 shadow-sm">
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/20 border border-border/30">
                           <div className="w-8 flex flex-col items-center shrink-0 opacity-50"><span className="text-lg">{formData.emoji || '⭐'}</span></div>
                           <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-2">
                                 <div className="text-sm font-bold text-foreground truncate">
                                    {formData.habit_name || 'My Habit'}
                                 </div>
                                 <div className="shrink-0">
                                    <CircleDot size={16} className="text-muted-foreground/30 shrink-0" />
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                              <div className="flex items-center gap-1 w-20 justify-end">
                                 <div className="bg-muted/50 rounded-lg h-8 w-[36px] flex flex-col items-center justify-center shadow-inner border border-border/5">
                                    <span className="text-[7px] font-black uppercase opacity-30 leading-none mb-0.5">Logs</span>
                                    <div className="text-[10px] font-black text-primary leading-none">0</div>
                                 </div>
                                 <div className="bg-muted/50 rounded-lg h-8 w-[40px] flex flex-col items-center justify-center shadow-inner border border-border/5">
                                    <span className="text-[7px] font-black uppercase opacity-30 leading-none mb-0.5">Val</span>
                                    <div className="text-[10px] font-black text-accent leading-none px-0.5 truncate max-w-full">
                                       {formData.input_type === 'text' ? '--' : '0'}
                                    </div>
                                 </div>
                              </div>
                              <span className="text-[9px] font-black uppercase opacity-30 w-6 text-right truncate">{formData.unit || 'pt'}</span>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {/* SUMMARY TABLE */}
              <Card className="rounded-md border-white/20 shadow-zenith overflow-hidden bg-card">
                 <CardContent className="p-0 flex flex-col divide-y divide-border/40">
                    <div className="bg-muted/50 p-6 flex items-center gap-3">
                       <AlignLeft size={20} className="text-muted-foreground/60" />
                       <span className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">Summary</span>
                    </div>
                    <SummaryRow label="Habit Name" value={formData.habit_name} />
                    <SummaryRow label="Emoji" value={formData.emoji} />
                    <SummaryRow label="Frequency" value={formData.frequency === 'daily' ? 'Daily' : 'Event'} />
                    <SummaryRow label="Input Type" value={formData.input_type} />
                    <SummaryRow label="Group" value={formData.group_name} />
                    <SummaryRow label="Condition" value={formData.condition_type ? formData.condition_type.replace('_', ' ') : 'None'} />
                    {formData.use_grace && <SummaryRow label="Grace" value={`After ${formData.grace_days} successes`} color="text-accent" />}
                    {formData.use_escalation && <SummaryRow label="Escalation" value={`After ${formData.escalation_days} failures`} color="text-primary" />}
                 </CardContent>
              </Card>
           </div>
        )}

        {/* NAVIGATION BUTTONS INSIDE CONTAINER */}
        <div className="flex gap-4 pt-4 pb-12">
          <Button 
            variant="outline" 
            className="flex-1 h-12 rounded-xl font-black text-sm border border-border bg-card hover:bg-muted/50 transition-all text-muted-foreground active:scale-95" 
            onClick={handleBack}
          >
            ← Back
          </Button>
          {currentStep === STEPS.length - 1 ? (
             <SaveButton isSaving={saving} label="Update Habit" className="flex-[2] h-12 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-muted" onClick={handleSave} />
          ) : (
            <Button 
              className={`flex-[2] h-12 rounded-xl font-black text-sm shadow-xl shadow-primary/10 transition-all active:scale-95 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground`}
              onClick={handleNext}
            >
              Next Step →
            </Button>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

// Sub-components for cleaner code
function InputTypeBtn({ icon, label, sub, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-3 p-3 pt-4 rounded-md transition-all border-none shadow-sm relative group ${active ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 z-10' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
    >
      <div className={`p-2 rounded-md transition-colors ${active ? 'bg-white/20 text-primary-foreground' : 'bg-card shadow-sm text-muted-foreground group-hover:text-primary'}`}>
        {icon}
      </div>
      <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] font-black uppercase tracking-tight leading-none">{label}</span>
          {sub && <span className="text-[6px] font-mono opacity-60 leading-none">{sub}</span>}
      </div>
    </button>
  );
}

function ConditionBtn({ icon, label, active, onClick, color }: any) {
  return (
    <button 
      onClick={onClick}
      className={`h-11 px-6 rounded-md flex items-center gap-2.5 font-black text-xs transition-all border-none shadow-sm
        ${active ? `${color} text-primary-foreground shadow-lg scale-105` : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
    >
      <div className={`p-1 rounded-md ${active ? 'bg-white/20' : 'bg-card'}`}>{icon}</div>
      {label}
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-md bg-white animate-pulse" />}
    </button>
  );
}

function InputRange({ label, value, onChange, color, inputType }: any) {
  const timeToDecimal = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) + ((m || 0) / 60);
  };

  const decimalToTime = (decimal: number) => {
    const d = (isNaN(decimal) || decimal === null || decimal === undefined) ? 0 : decimal;
    const hrs = Math.floor(d);
    const mins = Math.round((d - hrs) * 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  if (inputType === 'boolean') {
    return (
      <div className={`rounded-md border border-border bg-card/50 p-3 transition-colors ${color}`}>
         <div className="flex items-center gap-2 mb-1">
            <CheckSquare size={10} className="opacity-60" />
            <span className="text-[8px] font-black uppercase tracking-widest opacity-60">{label}</span>
         </div>
         <Select 
           value={value === 1 ? 'yes' : 'no'} 
           onChange={(e) => onChange(e.target.value === 'yes' ? 1 : 0)}
           className="bg-transparent border-none p-0 text-3xl font-black w-full focus:outline-none focus:ring-0 appearance-none cursor-pointer text-foreground"
         >
           <option value="yes" className="bg-card">YES</option>
           <option value="no" className="bg-card">NO</option>
         </Select>
      </div>
    );
  }

  if (inputType === 'time' || inputType === 'duration') {
    return (
      <div className={`rounded-md border border-border bg-card/50 p-3 transition-colors ${color}`}>
         <div className="flex items-center gap-2 mb-1">
            <Clock size={10} className="opacity-60" />
            <span className="text-[8px] font-black uppercase tracking-widest opacity-60">{label}</span>
         </div>
         <input 
           type="time" 
           value={decimalToTime(parseFloat(value))} 
           onChange={(e) => onChange(timeToDecimal(e.target.value))}
           className="bg-transparent border-none p-0 text-3xl font-black w-full focus:outline-none focus:ring-0 placeholder:opacity-20 text-foreground"
         />
      </div>
    );
  }

  const isText = inputType === 'text';

  return (
    <div className={`rounded-md border border-border bg-card/50 p-3 transition-colors ${color}`}>
       <div className="flex items-center gap-2 mb-1">
          <CheckSquare size={10} className="opacity-60" />
          <span className="text-[8px] font-black uppercase tracking-widest opacity-60">{label}</span>
       </div>
       <input 
         type={isText ? "text" : "number"} 
         value={isText ? (value ?? '') : (value ?? 0)} 
         onChange={(e) => onChange(isText ? e.target.value : (e.target.value === '' ? 0 : parseFloat(e.target.value)))}
         className="bg-transparent border-none p-0 text-3xl font-black w-full focus:outline-none focus:ring-0 placeholder:opacity-20 text-foreground"
         placeholder={isText ? "abc..." : "0"}
       />
    </div>
  );
}

function SelectBtn({ active, label, icon, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 h-14 rounded-md flex items-center justify-center gap-3 font-black text-xs transition-all shadow-sm border-none ${active ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105' : 'bg-muted/50 text-muted-foreground opacity-60 hover:opacity-100'}`}
    >
      <div className={`p-1.5 rounded-md ${active ? 'bg-white/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{icon}</div>
      {label}
    </button>
  );
}

function RuleToggle({ icon, title, desc, active, days, onToggle, onDaysChange, daysLabel, disabled }: any) {
  return (
    <div 
      onClick={() => { if (!disabled) onToggle(!active); }}
      className={`p-5 rounded-md transition-all border border-border/40 select-none ${disabled ? 'opacity-30 cursor-not-allowed grayscale' : 'cursor-pointer'} ${active && !disabled ? 'bg-card text-foreground border-border' : 'bg-muted/50 border-transparent opacity-60'}`}
    >
       <div className="flex items-center gap-4">
          <div className="text-2xl pt-1">{icon}</div>
          <div className="flex-1 space-y-1">
             <div className="flex items-center gap-2">
                <h4 className="text-sm font-black uppercase tracking-tight">{title}:</h4>
                <div className="text-[10px] font-medium leading-normal">{desc}</div>
             </div>
             {active && (
                <div className="flex items-center gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
                   <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Last</span>
                   <input 
                     type="number" 
                     value={days}
                     onChange={(e) => onDaysChange(parseInt(e.target.value))}
                     className="w-14 h-10 rounded-md bg-card border border-border shadow-inner text-center font-black text-sm text-foreground focus:ring-primary/20"
                   />
                   <span className="text-[9px] font-bold text-muted-foreground lowercase tracking-widest">{daysLabel}</span>
                </div>
             )}
          </div>
          <Switch disabled={disabled} checked={active && !disabled} onCheckedChange={onToggle} className="data-[state=checked]:bg-primary" onClick={(e) => e.stopPropagation()} />
       </div>
    </div>
  );
}

function SummaryRow({ label, value, color }: any) {
  return (
    <div className="flex items-center justify-between p-6">
       <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
       <span className={`text-md font-black text-right ${color || 'text-foreground'}`}>{value || '—'}</span>
    </div>
  );
}

function RefreshCwIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={`w-5 h-5 ${className}`} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

