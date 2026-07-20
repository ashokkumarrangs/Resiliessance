'use client'
import { Select } from "@/components/Select";;
import Link from "next/link";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { AlertCircle, AlertTriangle, ArrowRight, Calendar, CheckCircle2, ChevronDown, ChevronUp, CircleDot, Clock, Plus, RefreshCw, XCircle , BarChart2 } from "lucide-react";
import { format, addDays, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { toast } from 'sonner';
import { getStatusIcon, getStatusStyles, getStatusColor } from "@/lib/habit-ui-utils";
import { calculateHabitStatus, HabitStatus, HabitConfig as ScoringConfig, sumDurations } from '@/lib/habit-scoring';
import { PageHeader } from "@/components/PageHeader";
import { SaveButton } from "@/components/ui/SaveButton";
import { SectionNav } from "@/components/SectionNav";
import { HABIT_TABS } from "@/lib/navigation";
import { SubNav } from "@/components/SubNav";

interface HabitConfig extends ScoringConfig {
  id: string;
  group_name: string;
  frequency: string;
  emoji: string;
  unit: string;
  group_order: number;
  daily_habit_order: number;
  habit_color: string;
}


const parseDurationStr = (valStr: string) => {
  if (!valStr || !valStr.includes(':')) return { hrs: '', mins: '' };
  const [h, m] = valStr.split(':');
  return { hrs: h || '', mins: m || '' };
};

const formatDurationStr = (hrs: string, mins: string) => {
  const h = hrs.trim() === '' ? '0' : hrs;
  const m = mins.trim() === '' ? '0' : mins;
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
};

export default function HabitDailyPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [configs, setConfigs] = useState<HabitConfig[]>([]);
  const [dailyData, setDailyData] = useState<Record<string, string>>({});
  const [statusMap, setStatusMap] = useState<Record<string, HabitStatus>>({});
  const [eventAggregates, setEventAggregates] = useState<Record<string, { count: number, valueDisplay: string, status: HabitStatus }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => { fetchData(); }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: configData, error: configError } = await supabase.from('habit_config').select('*').eq('is_paused', false).eq('is_archived', false).eq('is_deleted', false).order('group_order').order('daily_habit_order');
      if (configError) throw configError;
      
      const fetchedConfigs = configData || [];
      setConfigs(fetchedConfigs);

      // Initialize all groups to expanded if not already set
      const groups = Array.from(new Set(fetchedConfigs.map(c => c.group_name)));
      setExpandedGroups(prev => {
        const next = { ...prev };
        groups.forEach(g => { if (next[g] === undefined) next[g] = true; });
        return next;
      });

      const { data: logData, error: logError } = await supabase.from('habit_data').select('*').eq('date', selectedDate);
      if (logError) throw logError;

      const dataMap: Record<string, string> = {};
      const sMap: Record<string, HabitStatus> = {};
      (logData || []).forEach(d => { dataMap[d.habit] = d.value; sMap[d.habit] = d.status as HabitStatus; });

      (fetchedConfigs).filter(c => c.frequency === 'daily').forEach(c => {
        if (c.unlogged_is_success && !dataMap[c.habit_name]) { sMap[c.habit_name] = 'Success'; }
      });
      setDailyData(dataMap);
      setStatusMap(sMap);

      const { data: eventData, error: eventError } = await supabase.from('event_log').select('*').eq('date', selectedDate).order('created_at', { ascending: true });
      if (!eventError) {
        const aggs: Record<string, { count: number, valueDisplay: string, status: HabitStatus }> = {};
        (eventData || []).forEach(e => {
          if (!aggs[e.event]) aggs[e.event] = { count: 0, valueDisplay: '', status: 'Not Entered' };
          aggs[e.event].count++;
          
          const habitConfig = fetchedConfigs.find(c => c.habit_name === e.event);
          if (habitConfig) {
            if (habitConfig.input_type === 'duration') {
              aggs[e.event].valueDisplay = sumDurations(aggs[e.event].valueDisplay, e.value);
            } else if (habitConfig.input_type === 'number') {
              const current = parseFloat(aggs[e.event].valueDisplay) || 0;
              aggs[e.event].valueDisplay = String(current + (parseFloat(e.value) || 0));
            } else {
              // Latest non-empty value for Text, Time, etc.
              if (e.value && e.value !== '1') {
                aggs[e.event].valueDisplay = e.value;
              } else if (!aggs[e.event].valueDisplay) {
                aggs[e.event].valueDisplay = e.value || '';
              }
            }
          }
        });

        // Calculate status for each event habit
        Object.keys(aggs).forEach(hName => {
          const config = fetchedConfigs.find(c => c.habit_name === hName);
          if (config) {
            let scoreValue = aggs[hName].valueDisplay;
            if (config.input_type === 'text') {
              scoreValue = String(aggs[hName].count);
            }
            aggs[hName].status = calculateHabitStatus(config, scoreValue);
          }
        });
        
        setEventAggregates(aggs);
      }
    } catch (err: any) { toast.error(err.message || 'Failed to load habit data'); }
    finally { setLoading(false); }
  };

  const handleInputChange = (habitName: string, value: string) => { 
    setDailyData(prev => ({ ...prev, [habitName]: value })); 
    
    // Live Status Update
    const config = configs.find(c => c.habit_name === habitName);
    if (config) {
      const newStatus = calculateHabitStatus(config, value);
      setStatusMap(prev => ({ ...prev, [habitName]: newStatus }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dailyConfigs = configs.filter(c => c.frequency === 'daily' || !c.frequency);
      const allRecords = dailyConfigs.map(c => {
        const val = dailyData[c.habit_name] || '';
        return { 
          date: selectedDate, 
          group_name: c.group_name, 
          habit: c.habit_name, 
          value: String(val), 
          unit: c.unit || '', 
          source: 'daily', 
          status: calculateHabitStatus(c, val) 
        };
      });

      const inserts = allRecords.filter(r => r.value !== '');
      const allHabits = allRecords.map(r => r.habit);

      // 1. Delete all existing records for these habits on this date
      if (allHabits.length > 0) {
        const { error: clearError } = await supabase
          .from('habit_data')
          .delete()
          .eq('date', selectedDate)
          .eq('source', 'daily')
          .in('habit', allHabits);
        
        if (clearError) throw clearError;
      }

      // 2. Insert the active values
      if (inserts.length > 0) {
        const { error: insertError } = await supabase
          .from('habit_data')
          .insert(inserts);
          
        if (insertError) throw insertError;
      }

      toast.success('Habit Tracker updated!');
      fetchData();
    } catch (err: any) { 
      toast.error(err.message || 'Failed to update habits'); 
    } finally { 
      setSaving(false); 
    }
  };



  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const groups = Array.from(new Set(configs.map(c => c.group_name)));

  return (
    <div className="min-h-screen bg-background pb-32 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6 pt-6 md:pt-6">
        <PageHeader title="Daily Log" >
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
          <SectionNav tabs={HABIT_TABS} activePath="/habits/daily-log" />
        </div>
        <SubNav 
          items={["Daily Log", "Event Log"]}
          activeItem="Daily Log"
          onChange={(val) => {
            if (val === "Event Log") router.push("/habits/event-log");
          }}
        />
        
        {loading ? (
          <div className="space-y-6">{[1, 2].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl" />)}</div>
        ) : (
          <div className="space-y-6">
            {/* Integrated Date Picker (Standardized) */}
            <div className="flex justify-center mb-6 mt-6 w-full">
              <div className="bg-card px-6 py-2 rounded-xl border border-border/40 shadow-sm flex items-center gap-3 w-full max-w-xs justify-center group hover:bg-muted transition-all">
                   <Calendar className="w-4 h-4 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                   <input 
                     type="date" 
                     value={selectedDate}
                     onChange={(e) => setSelectedDate(e.target.value)}
                     className="font-black text-md bg-transparent border-none focus:ring-0 cursor-pointer text-foreground uppercase tracking-tight"
                   />
              </div>
            </div>

            {/* Individual Group Cards */}
            {groups.map(group => {
                const groupHabits = configs.filter(c => c.group_name === group);
                if (groupHabits.length === 0) return null;
                const doneCount = groupHabits.filter(c => {
                  const stat = statusMap[c.habit_name];
                  const evStat = eventAggregates[c.habit_name]?.status;
                  return (stat !== undefined && stat !== 'Not Entered') || (evStat !== undefined && evStat !== 'Not Entered');
                }).length;
                const isExpanded = expandedGroups[group];

                return (
                  <div key={group} className="bg-card rounded-2xl shadow-sm border border-border/40 transition-all">
                    <div 
                      onClick={() => toggleGroup(group)}
                      className="p-4 flex justify-between items-center cursor-pointer hover:bg-muted/30 transition-colors select-none"
                    >
                       <div className="flex items-center gap-3">
                          <h2 className="text-xl font-black uppercase tracking-tight text-foreground/80">{group}</h2>
                          {isExpanded ? <ChevronUp size={18} className="opacity-30" /> : <ChevronDown size={18} className="opacity-30" />}
                       </div>
                       <div className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-md">{doneCount}/{groupHabits.length}</div>
                    </div>
                    
                    {isExpanded && (
                      <div className="p-4 pt-0 space-y-5">
                        <div className="border-t border-border/40 pt-4 space-y-5">
                          {groupHabits.map(habit => {
                             const status = habit.frequency === 'event' 
                               ? (eventAggregates[habit.habit_name]?.status || 'Not Entered')
                               : (statusMap[habit.habit_name] || 'Not Entered');
                             const styles = getStatusStyles(status);

                             return (
                               <div key={habit.id} className={`flex items-center gap-2 group/row p-2 rounded-xl transition-all ${styles.bg} ${styles.anim}`}>
                                 <div className="w-8 flex flex-col items-center shrink-0 opacity-50"><span className="text-lg">{habit.emoji}</span></div>
                                 <div className="flex-1 min-w-0 pr-2">
                                   <div className="flex items-center gap-2">
                                     <div className={`text-sm transition-all truncate ${styles.text} ${styles.weight}`}>
                                       {habit.habit_name}
                                     </div>
                                     <div className="shrink-0">
                                       {getStatusIcon(status, 16)}
                                     </div>
                                   </div>
                                 </div>

                           <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                              {habit.frequency === 'event' ? (
                                <div className="flex items-center gap-1 w-20 justify-end">
                                   <div className="bg-muted/50 rounded-lg h-8 w-[36px] flex flex-col items-center justify-center shadow-inner border border-border/5">
                                     <span className="text-[7px] font-black uppercase opacity-30 leading-none mb-0.5">Logs</span>
                                     <div className="text-[10px] font-black text-primary leading-none">{eventAggregates[habit.habit_name]?.count || 0}</div>
                                   </div>
                                   <div className="bg-muted/50 rounded-lg h-8 w-[40px] flex flex-col items-center justify-center shadow-inner border border-border/5">
                                     <span className="text-[7px] font-black uppercase opacity-30 leading-none mb-0.5">Val</span>
                                     <div className="text-[10px] font-black text-accent leading-none px-0.5 truncate max-w-full">
                                       {eventAggregates[habit.habit_name]?.valueDisplay || (habit.input_type === 'text' ? '--' : '0')}
                                     </div>
                                   </div>
                                </div>
                              ) : (
                                <div className="w-20 flex justify-end">
                                  {habit.input_type === 'boolean' ? (
                                    <div className="relative group w-full">
                                      <Select 
                                        value={dailyData[habit.habit_name] || ''} 
                                        onChange={(e) => handleInputChange(habit.habit_name, e.target.value)}
                                        className="w-full h-8 bg-muted border-none rounded-lg pl-2 pr-6 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary/10 appearance-none shadow-inner transition-all text-center"
                                      >
                                        <option value="" disabled>—</option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                      </Select>
                                      <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none group-hover:text-primary transition-colors" />
                                    </div>


                                  ) : habit.input_type === 'duration' ? (
                                    <div className="flex items-center gap-1 w-full justify-end">
                                      <input 
                                        type="number" 
                                        placeholder="0" 
                                        value={parseDurationStr(dailyData[habit.habit_name] || '').hrs}
                                        onChange={(e) => {
                                          const current = parseDurationStr(dailyData[habit.habit_name] || '');
                                          handleInputChange(habit.habit_name, formatDurationStr(e.target.value, current.mins));
                                        }}
                                        inputMode="numeric"
                                        className="w-7 h-8 rounded-lg bg-muted border-none text-center font-bold text-xs focus:ring-2 focus:ring-primary/10 p-0.5 text-foreground"
                                        min="0"
                                      />
                                      <span className="text-[9px] font-bold opacity-40">h</span>
                                      <input 
                                        type="number" 
                                        placeholder="00" 
                                        value={parseDurationStr(dailyData[habit.habit_name] || '').mins}
                                        onChange={(e) => {
                                          const current = parseDurationStr(dailyData[habit.habit_name] || '');
                                          handleInputChange(habit.habit_name, formatDurationStr(current.hrs, e.target.value));
                                        }}
                                        inputMode="numeric"
                                        className="w-7 h-8 rounded-lg bg-muted border-none text-center font-bold text-xs focus:ring-2 focus:ring-primary/10 p-0.5 text-foreground"
                                        min="0"
                                        max="59"
                                      />
                                      <span className="text-[9px] font-bold opacity-40">m</span>
                                    </div>


                                  ) : habit.input_type === 'time' ? (
                                    <div className="relative group w-full">
                                      <Input 
                                        type="time"
                                        value={dailyData[habit.habit_name] || ''}
                                        onChange={(e) => handleInputChange(habit.habit_name, e.target.value)}
                                        className="w-full h-8 rounded-lg bg-muted border-none text-center font-bold text-xs focus:ring-2 focus:ring-primary/10 appearance-none shadow-inner transition-all px-2 text-foreground"
                                      />
                                      <Clock size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none group-hover:text-primary transition-colors" />
                                    </div>
                                  ) : (
                                    <Input 
                                      type={habit.input_type === 'number' ? 'number' : 'text'}
                                      value={dailyData[habit.habit_name] || ''}
                                      onChange={(e) => handleInputChange(habit.habit_name, e.target.value)}
                                      className="w-full h-8 rounded-lg bg-muted border-none text-center font-bold text-xs focus:ring-2 focus:ring-primary/10 text-foreground"
                                      placeholder="--"
                                      inputMode={habit.input_type === 'number' ? 'decimal' : undefined}
                                    />
                                  )}
                                </div>


                              )}
                              <span className="text-[9px] font-black uppercase opacity-30 w-6 text-right truncate">{habit.unit || 'pt'}</span>
                           </div>
                         </div>
                       )})}
                        </div>
                      </div>
                    )}
                  </div>
                );
            })}

            {/* Submit Button Card */}
            <div className="bg-card rounded-2xl p-8 shadow-sm border border-border/40">
              <div className="flex justify-center">
              <SaveButton isSaving={saving} label="Save Daily Log" className="w-full max-w-xs h-12 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-muted" onClick={handleSave} />
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
