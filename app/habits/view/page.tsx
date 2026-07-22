'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { AlertCircle, AlertTriangle, Calendar, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, CircleDot, Clock, PlusCircle, Sliders, XCircle , BarChart2 } from "lucide-react";
import { format, addDays, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { calculateHabitStatus, HabitStatus, sumDurations } from '@/lib/habit-scoring';
import { PageHeader } from '@/components/PageHeader';
import { SectionNav } from '@/components/SectionNav';
import { HABIT_TABS } from '@/lib/navigation';

interface HabitConfig {
  id: string;
  habit_name: string;
  emoji: string;
  frequency: string; // daily, event
  input_type: string; // number, boolean, time, duration, text
  condition_type: string;
  target_value?: number;
  suc_min?: number;
  suc_max?: number;
  tol_min?: number;
  tol_max?: number;
  crit_min?: number;
  crit_max?: number;
  direction?: 'more' | 'less';
  unlogged_is_success?: boolean;
  group_name: string;
  unit: string;
  group_order: number;
}

interface EventLog {
  id: number;
  date: string;
  time: string;
  event: string;
  value: string;
  note: string;
}

export default function HabitViewPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [configs, setConfigs] = useState<HabitConfig[]>([]);
  const [dailyLogs, setDailyLogs] = useState<Record<string, { value: string; status: HabitStatus }>>({});
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [expandedEventHabits, setExpandedEventHabits] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch config data
      const { data: configData, error: configError } = await supabase
        .from('habit_config').select('*').eq('is_deleted', false)
        .order('group_order', { ascending: true })
        .order('habit_name', { ascending: true });

      if (configError) throw configError;
      const allConfigs = (configData || []).map((c: any) => {
        if (c.is_archived) return { ...c, habit_name: `${c.habit_name} (Archived)` };
        if (c.is_paused) return { ...c, habit_name: `${c.habit_name} (Paused)` };
        return c;
      });
      setConfigs(allConfigs);

      // 2. Fetch daily logs
      const { data: logData, error: logError } = await supabase
        .from('habit_data')
        .select('*')
        .eq('date', selectedDate);

      if (logError) throw logError;

      const dailyMap: Record<string, { value: string; status: HabitStatus }> = {};
      (logData || []).forEach(d => {
        let mappedStatus: HabitStatus = 'Not Entered';
        if (d.status === 'Success' || d.status === 'Completed') mappedStatus = 'Success';
        else if (d.status === 'Tolerance') mappedStatus = 'Tolerance';
        else if (d.status === 'Critical') mappedStatus = 'Critical';
        else if (d.status === 'Failure' || d.status === 'Missed') mappedStatus = 'Failure';
        else mappedStatus = (d.status || 'Not Entered') as HabitStatus;

        dailyMap[d.habit] = {
          value: d.value || '',
          status: mappedStatus
        };
      });

      // 3. Fetch event logs
      const { data: eventData, error: eventError } = await supabase
        .from('event_log')
        .select('*')
        .eq('date', selectedDate)
        .order('time', { ascending: true });

      if (eventError) throw eventError;
      const allEvents = eventData || [];
      setEventLogs(allEvents);

      // Calculate status maps dynamically for this selected date
      const calculatedDaily: Record<string, { value: string; status: HabitStatus }> = {};

      allConfigs.forEach(c => {
        if (c.frequency === 'event') {
          // Aggregate event logs
          const matchingEvents = allEvents.filter(e => e.event === c.habit_name);
          const count = matchingEvents.length;

          let valueDisplay = '';
          if (c.input_type === 'duration') {
            matchingEvents.forEach(e => {
              valueDisplay = sumDurations(valueDisplay, e.value);
            });
          } else if (c.input_type === 'number') {
            let total = 0;
            matchingEvents.forEach(e => {
              total += parseFloat(e.value) || 0;
            });
            valueDisplay = String(total);
          } else {
            // Latest value
            const lastEvent = matchingEvents[matchingEvents.length - 1];
            valueDisplay = lastEvent ? lastEvent.value : '';
          }

          let scoreValue = valueDisplay;
          if (c.input_type === 'text') {
            scoreValue = String(count);
          }

          const status = count > 0 
            ? calculateHabitStatus(c, scoreValue) 
            : (c.unlogged_is_success ? 'Success' : 'Not Entered');

          calculatedDaily[c.habit_name] = {
            value: count > 0 ? (c.input_type === 'text' ? `${count} events` : valueDisplay) : '',
            status
          };
        } else {
          // Daily habit
          const record = dailyMap[c.habit_name];
          if (record) {
            calculatedDaily[c.habit_name] = record;
          } else {
            calculatedDaily[c.habit_name] = {
              value: '',
              status: c.unlogged_is_success ? 'Success' : 'Not Entered'
            };
          }
        }
      });

      setDailyLogs(calculatedDaily);

    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch habit logs');
    } finally {
      setLoading(false);
    }
  };

  const toggleEventHabitExpand = (habitName: string) => {
    setExpandedEventHabits(prev => ({ ...prev, [habitName]: !prev[habitName] }));
  };

  const getStatusIcon = (status: HabitStatus, size = 16) => {
    switch (status) {
      case 'Success': return <CheckCircle2 size={size} className="text-emerald-500 shrink-0" />;
      case 'Tolerance': return <AlertCircle size={size} className="text-amber-500 shrink-0" />;
      case 'Failure': return <XCircle size={size} className="text-rose-500 shrink-0" />;
      case 'Critical': return <AlertTriangle size={size} className="text-red-500 shrink-0" />;
      default: return <CircleDot size={size} className="text-muted-foreground/30 shrink-0" />;
    }
  };

  const getStatusStyles = (status: HabitStatus) => {
    switch (status) {
      case 'Success': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'Tolerance': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'Failure': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      case 'Critical': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted/50 text-muted-foreground border-border/40';
    }
  };

  // Group configs by category group
  const groupedHabits: Record<string, HabitConfig[]> = {};
  configs.forEach(c => {
    const group = c.group_name || 'General';
    if (!groupedHabits[group]) groupedHabits[group] = [];
    groupedHabits[group].push(c);
  });

  // Calculate consistency stats
  const activeHabits = configs.length;
  let successCount = 0;
  let toleranceCount = 0;
  let failureCount = 0;
  let criticalCount = 0;
  let notEnteredCount = 0;

  Object.values(dailyLogs).forEach(log => {
    if (log.status === 'Success') successCount++;
    else if (log.status === 'Tolerance') toleranceCount++;
    else if (log.status === 'Failure') failureCount++;
    else if (log.status === 'Critical') criticalCount++;
    else notEnteredCount++;
  });

  const totalEarnedPoints = (successCount * 3) + (toleranceCount * 1) + (failureCount * -1) + (criticalCount * -3);
  const maxPossiblePoints = activeHabits * 3;
  
  const consistencyRate = activeHabits > 0 
    ? Math.max(0, Math.round((totalEarnedPoints / maxPossiblePoints) * 100))
    : 0;

  // Circular gauge settings
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (consistencyRate / 100) * circumference;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-32 text-foreground font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        <PageHeader title="Habits Daily Viewer" >
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
          <SectionNav tabs={HABIT_TABS} activePath="/habits/view" />
        </div>

        {/* Date Swapper */}
        <div className="flex justify-center mb-6 mt-6 w-full">
          <div className="bg-card px-4 py-1.5 rounded-xl border border-border/40 shadow-sm flex items-center justify-between w-full max-w-sm">
             <button 
               onClick={() => setSelectedDate(prev => format(subDays(new Date(prev), 1), 'yyyy-MM-dd'))}
               className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
             >
                <ChevronLeft size={16} />
             </button>
             <div className="flex items-center gap-2 font-black text-xs text-foreground uppercase tracking-tight">
                <Calendar className="w-3.5 h-3.5 text-primary opacity-50" />
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 cursor-pointer font-black text-center"
                />
             </div>
             <button 
               onClick={() => setSelectedDate(prev => format(addDays(new Date(prev), 1), 'yyyy-MM-dd'))}
               className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
             >
                <ChevronRight size={16} />
             </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="h-32 bg-card animate-pulse rounded-xl border border-border/40" />
            {[1, 2].map(i => <div key={i} className="h-64 bg-card animate-pulse rounded-xl border border-border/40" />)}
          </div>
        ) : configs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/60 space-y-4">
            <Sliders className="w-16 h-16 opacity-20" />
            <p className="font-bold text-lg">No habits configured yet</p>
            <Button onClick={() => router.push('/habits/add')} className="rounded-md bg-primary text-primary-foreground">
               Configure First Habit
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Stats Dashboard Ring Card */}
            <Card className="rounded-xl border border-border/40 shadow-sm bg-card overflow-hidden">
              <CardContent className="p-6 flex items-center justify-between gap-6">
                
                {/* SVG Progress Ring */}
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r={radius} stroke="currentColor" className="text-muted/15" strokeWidth="8" fill="transparent" />
                    <circle cx="48" cy="48" r={radius} stroke="currentColor" className="text-emerald-500 transition-all-out" strokeWidth="8" fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                     <span className="text-2xl font-black text-foreground">{consistencyRate}%</span>
                     <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest block leading-none">Daily Score</span>
                  </div>
                </div>

                {/* Score Stats Pills */}
                <div className="flex-1 grid grid-cols-2 gap-2 text-center">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-2 rounded-lg">
                    <span className="text-[7px] font-black text-emerald-600 uppercase tracking-wider block">Success</span>
                    <span className="text-lg font-black text-emerald-600 leading-none">{successCount}</span>
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/10 p-2 rounded-lg">
                    <span className="text-[7px] font-black text-amber-600 uppercase tracking-wider block">Tolerance</span>
                    <span className="text-lg font-black text-amber-600 leading-none">{toleranceCount}</span>
                  </div>
                  <div className="bg-rose-500/5 border border-rose-500/10 p-2 rounded-lg">
                    <span className="text-[7px] font-black text-rose-600 uppercase tracking-wider block">Failure</span>
                    <span className="text-lg font-black text-rose-600 leading-none">{failureCount}</span>
                  </div>
                  <div className="bg-red-500/5 border border-red-500/10 p-2 rounded-lg">
                    <span className="text-[7px] font-black text-red-600 uppercase tracking-wider block">Critical</span>
                    <span className="text-lg font-black text-red-600 leading-none">{criticalCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Habit Groups List */}
            {Object.keys(groupedHabits).map(groupName => {
              const groupConfigs = groupedHabits[groupName];
              return (
                <Card key={groupName} className="rounded-xl border border-border/40 bg-card overflow-hidden">
                  <div className="px-5 py-4 border-b border-border/40 bg-muted/15 flex items-center justify-between">
                     <h3 className="text-md font-black uppercase tracking-tight text-foreground/80">{groupName}</h3>
                     <span className="text-[9px] font-bold text-muted-foreground bg-muted border px-2 py-0.5 rounded-full uppercase tracking-wider">
                       {groupConfigs.length} habits
                     </span>
                  </div>
                  
                  <CardContent className="p-0 divide-y divide-border/20">
                     {groupConfigs.map(habit => {
                       const log = dailyLogs[habit.habit_name] || { value: '', status: 'Not Entered' };
                       const styles = getStatusStyles(log.status);
                       const isEvent = habit.frequency === 'event';
                       const isExpanded = !!expandedEventHabits[habit.habit_name];
                       const matchingEvents = eventLogs.filter(e => e.event === habit.habit_name);

                       return (
                         <div key={habit.id} className="transition-colors hover:bg-muted/10">
                            {/* Main Habit Header Row */}
                            <div 
                              onClick={() => isEvent && matchingEvents.length > 0 && toggleEventHabitExpand(habit.habit_name)}
                              className={`flex items-center justify-between p-5 gap-3 ${isEvent && matchingEvents.length > 0 ? 'cursor-pointer select-none' : ''}`}
                            >
                               <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="w-10 h-10 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-center shrink-0">
                                     <span className="text-xl">{habit.emoji || '⭐'}</span>
                                  </div>
                                  <div className="min-w-0">
                                     <div className="font-bold text-foreground truncate text-sm">{habit.habit_name}</div>
                                     <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                        <span>{habit.frequency}</span>
                                        <span>•</span>
                                        <span>{habit.input_type}</span>
                                     </div>
                                  </div>
                               </div>

                               <div className="flex items-center gap-3 shrink-0">
                                  {log.value && (
                                     <span className="text-xs font-black text-muted-foreground/80 font-mono">
                                       {log.value} {habit.unit}
                                     </span>
                                  )}
                                  
                                  <div className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase border tracking-wider flex items-center gap-1.5 ${styles}`}>
                                     {getStatusIcon(log.status, 10)}
                                     {log.status}
                                  </div>
                                  
                                  {isEvent && matchingEvents.length > 0 && (
                                     <div className="text-muted-foreground/40 hover:text-foreground">
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                     </div>
                                  )}
                               </div>
                            </div>

                            {/* Expandable Sub-panel for Event Logs */}
                            {isEvent && isExpanded && matchingEvents.length > 0 && (
                              <div className="bg-muted/20 border-t border-border/20 px-5 py-4 space-y-2">
                                 <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest block opacity-60">Log Entries Today</span>
                                 <div className="space-y-1.5">
                                    {matchingEvents.map(event => (
                                       <div key={event.id} className="flex items-center justify-between text-xs font-bold bg-card p-2.5 rounded-lg border border-border/30">
                                          <div className="flex items-center gap-2">
                                             <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">{event.time ? event.time.substring(0, 5) : '--:--'}</span>
                                             <span className="text-foreground">{event.value} {habit.unit}</span>
                                             {event.note && (
                                                <span className="text-muted-foreground font-normal italic opacity-70">— {event.note}</span>
                                             )}
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                            )}
                         </div>
                       );
                     })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
