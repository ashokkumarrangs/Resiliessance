'use client'
import { Select } from "@/components/Select";;
import Link from "next/link";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { AlertCircle, AlertTriangle, Calendar, CheckCircle2, ChevronDown, ChevronRight, CircleDot, Clock, Plus, RefreshCw, Trash2, XCircle , BarChart2 } from "lucide-react";
import { getStatusIcon, getStatusStyles, getStatusColor } from "@/lib/habit-ui-utils";
import { calculateHabitStatus, HabitStatus, sumDurations } from '@/lib/habit-scoring';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

import { PageHeader } from '@/components/PageHeader';
import { SectionNav } from "@/components/SectionNav";
import { HABIT_TABS } from "@/lib/navigation";
import { SubNav } from "@/components/SubNav";

import { toast } from 'sonner';

interface HabitConfig {
  id: string;
  habit_name: string;
  group_name: string;
  input_type: string;
  unit: string;
  frequency: string;
  emoji: string;
  habit_color: string;
}

interface EventAggregate {
  count: number;
  valueDisplay: string;
  lastValue: string;
  status: HabitStatus;
}


const EVENT_COLORS: Record<string, string> = {
  'alpha': 'bg-card border-border/40 text-foreground',
  'value': 'bg-primary/10 border-primary/20 text-primary',
  'count': 'bg-accent/10 border-accent/20 text-accent-foreground',
  'time': 'bg-muted border-border/40 text-foreground',
  'duration': 'bg-card border-border/40 text-foreground',
  'boolean': 'bg-primary/20 border-primary/40 text-primary',
  'default': 'bg-card border-border/40 text-foreground'
};

export default function HabitEventLogPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eventConfigs, setEventConfigs] = useState<HabitConfig[]>([]);
  const [aggregates, setAggregates] = useState<Record<string, EventAggregate>>({});
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState<Record<string, boolean>>({});
  const [rawEvents, setRawEvents] = useState<any[]>([]);

  // Form states for each card
  const [formNotes, setFormNotes] = useState<Record<string, string>>({});
  const [formTimes, setFormTimes] = useState<Record<string, string>>({});
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: configData, error: configError } = await supabase
        .from('habit_config')
        .select('*')
        .eq('is_paused', false)
        .eq('is_archived', false)
        .eq('is_deleted', false)
        .eq('frequency', 'event');

      if (configError) throw configError;
      setEventConfigs(configData || []);

      const times: Record<string, string> = {};
      const notes: Record<string, string> = {};
      const vals: Record<string, string> = {};

      (configData || []).forEach(c => {
        times[c.habit_name] = '';
        notes[c.habit_name] = '';
        vals[c.habit_name] = '';
      });
      setFormTimes(times);
      setFormNotes(notes);
      setFormValues(vals);

      const { data: eventData, error: eventError } = await supabase
        .from('event_log')
        .select('*')
        .eq('date', selectedDate)
        .order('created_at', { ascending: true });

      if (eventError) throw eventError;

      const aggs: Record<string, EventAggregate> = {};
      (eventData || []).forEach(e => {
        if (!aggs[e.event]) {
          aggs[e.event] = { count: 0, valueDisplay: '', lastValue: e.value, status: 'Not Entered' };
        }
        aggs[e.event].count++;
        
        const config = (configData || []).find(c => c.habit_name === e.event);
        if (config) {
          if (config.input_type === 'duration') {
            aggs[e.event].valueDisplay = sumDurations(aggs[e.event].valueDisplay, e.value);
          } else if (config.input_type === 'number') {
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

      // Calculate status for each aggregate
      Object.keys(aggs).forEach(hName => {
        const config = (configData || []).find(c => c.habit_name === hName);
        if (config) {
          let scoreValue = aggs[hName].valueDisplay;
          if (config.input_type === 'text') {
            scoreValue = String(aggs[hName].count);
          }
          aggs[hName].status = calculateHabitStatus(config, scoreValue);
        }
      });

      setRawEvents(eventData || []);
      setAggregates(aggs);
    } catch (err: any) {
      console.error('Event Log Fetch Error:', err);
      toast.error(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const syncEventDayToHabitData = async (habitName: string, dateStr: string) => {
    try {
      // 1. Fetch config to know how to aggregate
      const { data: configData } = await supabase.from('habit_config').select('*').eq('habit_name', habitName).single();
      if (!configData) return;

      // 2. Fetch all events for that day
      const { data: events } = await supabase.from('event_log').select('*').eq('event', habitName).eq('date', dateStr);
      
      if (!events || events.length === 0) {
        // Delete the roll-up if no events exist
        await supabase.from('habit_data').delete().eq('habit', habitName).eq('date', dateStr);
        return;
      }

      // 3. Aggregate
      let aggValue = '0';
      const isCount = configData.condition_type.endsWith('_count') || ['text', 'time', 'boolean'].includes(configData.input_type);
      
      if (isCount) {
        aggValue = String(events.length);
      } else if (configData.input_type === 'number') {
        const sum = events.reduce((acc, e) => acc + (parseFloat(e.value) || 0), 0);
        aggValue = String(sum);
      } else if (configData.input_type === 'duration') {
        aggValue = events.reduce((acc, e) => sumDurations(acc, e.value || '00:00'), '00:00');
      }

      // 4. Calculate Final Status
      const scoringConfig = { ...configData };
      if (isCount) {
         scoringConfig.input_type = 'number'; // The engine should treat the count as a number
      }
      
      const finalStatus = calculateHabitStatus(scoringConfig, aggValue);

      // 5. Upsert to habit_data
      const { data: existingData } = await supabase.from('habit_data').select('id').eq('habit', habitName).eq('date', dateStr).maybeSingle();
      if (existingData) {
         await supabase.from('habit_data').update({ value: aggValue, status: finalStatus, notes: 'Aggregated from events' }).eq('id', existingData.id);
      } else {
         await supabase.from('habit_data').insert({
            date: dateStr,
            habit: habitName,
            value: aggValue,
            status: finalStatus,
            notes: 'Aggregated from events'
         });
      }
    } catch (err) {
      console.error("Failed to sync event to habit_data", err);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    try {
      const { error } = await supabase.from('event_log').delete().eq('id', id);
      if (error) throw error;
      toast.success('Event log deleted!');
      const deletedEvent = rawEvents.find(e => e.id === id);
      if (deletedEvent) await syncEventDayToHabitData(deletedEvent.event, deletedEvent.date);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete event log');
    }
  };



  const handleLogEvent = async (habitName: string) => {
    const config = eventConfigs.find(c => c.habit_name === habitName);
    if (!config) return;

    const val = formValues[habitName];
    if ((config.input_type === 'number' || config.input_type === 'duration' || config.input_type === 'time') && (!val || val.trim() === '')) {
      toast.error(`Please enter a valid ${config.input_type} value`);
      return;
    }

    setLogging(prev => ({ ...prev, [habitName]: true }));
    try {
      const logVal = val || (config.input_type === 'boolean' || config.input_type === 'number' ? '1' : '');
      const time = formTimes[habitName] || format(new Date(), 'HH:mm');
      const note = formNotes[habitName];

      const { error: logError } = await supabase.from('event_log').insert({
        date: selectedDate,
        time: time,
        event: habitName,
        value: String(logVal),
        note: note
      });

      if (logError) throw logError;

      toast.success(`${habitName} logged!`);
      await syncEventDayToHabitData(habitName, selectedDate);
      // Reset only value and note
      setFormNotes(prev => ({ ...prev, [habitName]: '' }));
      setFormValues(prev => ({ ...prev, [habitName]: '' }));
      fetchData();
    } catch (err: any) {
      console.error('Event Log Save Error:', err);
      toast.error(err.message || 'Failed to log event');
    } finally {
      setLogging(prev => ({ ...prev, [habitName]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        <PageHeader title="Event Log"  >
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
          activeItem="Event Log"
          onChange={(val) => {
            if (val === "Daily Log") router.push("/habits/daily-log");
          }}
        />

        {/* Integrated Date Picker */}
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

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-muted animate-pulse rounded-[1.5rem]" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {eventConfigs.map(habit => {
              const colorKey = habit.habit_name.toLowerCase().includes('sleep') ? 'value' : 
                               habit.habit_name.toLowerCase().includes('count') ? 'count' :
                               habit.habit_name.toLowerCase().includes('time') ? 'time' :
                               habit.habit_name.toLowerCase().includes('duration') ? 'duration' :
                               habit.habit_name.toLowerCase().includes('boolean') ? 'boolean' : 'default';
              
              const colorClasses = EVENT_COLORS[colorKey] || EVENT_COLORS['default'];
              const agg = aggregates[habit.habit_name] || { count: 0, valueDisplay: '', status: 'Not Entered' as HabitStatus };
              const styles = getStatusStyles(agg.status);

              return (
                <Card key={habit.habit_name} className={`rounded-md border shadow-zenith overflow-hidden transition-all active:scale-[0.99] ${colorClasses} ${styles.bg} ${styles.anim}`}>
                  <CardContent className="p-5 flex flex-col gap-4">
                    {/* Header Row */}
                     <div className="flex justify-between items-center">
                        <h2 className={`text-xl uppercase tracking-tighter flex items-center gap-2 transition-all ${styles.text} ${styles.weight}`}>
                           <span className="text-2xl">{habit.emoji}</span>
                           <div className="flex items-center gap-2">
                              {habit.habit_name}
                              <div className="ml-1">
                                 {getStatusIcon(agg.status, 20)}
                              </div>
                           </div>
                        </h2>
                       <div className="flex items-center gap-2">
                          <div className="bg-card text-foreground border border-border/40 px-3 py-1 rounded-md text-lg font-black min-w-10 text-center shadow-sm">
                             {agg.count}
                          </div>
                          <div className={`px-4 py-1.5 rounded-md text-sm font-black tracking-widest ${colorKey === 'count' || colorKey === 'boolean' ? 'bg-primary/20' : 'bg-muted'}`}>
                             {agg.valueDisplay || (habit.input_type === 'text' ? '--' : '0')} {habit.input_type !== 'text' && habit.unit}
                          </div>
                       </div>
                    </div>

                    {/* Dynamic Input Area */}
                     <div className="flex items-end gap-3 min-h-[60px]">
                        <div className="w-20 flex flex-col justify-end">
                           <label className="text-[10px] font-black uppercase opacity-30 mb-1 ml-1">Time</label>
                           <Input 
                             type="time"
                             value={formTimes[habit.habit_name] || ''}
                             onChange={(e) => setFormTimes(prev => ({ ...prev, [habit.habit_name]: e.target.value }))}
                             className="bg-muted/50 border-none h-11 rounded-md font-bold text-center p-1 text-foreground"
                           />
                        </div>

                        <div className="flex-[2] flex flex-col justify-end">
                           <label className="text-[10px] font-black uppercase opacity-30 mb-1 ml-1">Notes</label>
                           <Input 
                             placeholder="Details..." 
                             value={formNotes[habit.habit_name] || ''}
                             onChange={(e) => setFormNotes(prev => ({ ...prev, [habit.habit_name]: e.target.value }))}
                             className="bg-muted/50 border-none h-11 rounded-md font-bold shadow-inner placeholder:text-muted-foreground/30 text-foreground"
                           />
                        </div>

                        {habit.input_type === 'boolean' ? (
                          <div className="flex-1 flex flex-col justify-end">
                             <label className="text-[10px] font-black uppercase opacity-30 mb-1 ml-1">Value</label>
                             <div className="relative group">
                               <Select 
                                 value={formValues[habit.habit_name] || 'Yes'} 
                                 onChange={(e) => setFormValues(prev => ({ ...prev, [habit.habit_name]: e.target.value }))}
                                 className="w-full h-11 bg-muted/50 border-none rounded-md px-3 text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/10 appearance-none shadow-inner transition-all"
                               >
                                 <option value="Yes">Yes</option>
                                 <option value="No">No</option>
                               </Select>
                               <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none group-hover:text-primary transition-colors" />
                             </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col justify-end relative">
                             <label className="text-[10px] font-black uppercase opacity-30 mb-1 ml-1">
                               {habit.input_type === 'time' ? 'Time' : habit.input_type === 'duration' ? 'Duration' : 'Value'}
                             </label>
                             <Input 
                               type={habit.input_type === 'time' || habit.input_type === 'duration' ? 'time' : habit.input_type === 'number' ? 'number' : 'text'} 
                               placeholder={habit.input_type === 'text' ? 'Enter text...' : habit.input_type === 'duration' ? 'HH:MM' : '0'}
                               value={formValues[habit.habit_name] || ''}
                               onChange={(e) => setFormValues(prev => ({ ...prev, [habit.habit_name]: e.target.value }))}
                               className="bg-muted/50 border-none h-11 rounded-md font-black text-center shadow-inner text-foreground placeholder:text-muted-foreground/20"
                             />
                          </div>
                        )}

                        <Button 
                           onClick={() => handleLogEvent(habit.habit_name)}
                           disabled={logging[habit.habit_name]}
                           className="flex-1 h-11 rounded-md bg-primary hover:bg-primary/90 shadow-lg text-primary-foreground font-black text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-tighter"
                        >
                           {logging[habit.habit_name] ? <RefreshCw className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4" />}
                           ADD
                        </Button>
                     </div>

                     {/* Log List Section */}
                     {rawEvents.filter(e => e.event === habit.habit_name).length > 0 && (
                       <div className="mt-4 border-t border-border/20 pt-4 space-y-2">
                          <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground opacity-60">Today's Logs</div>
                          <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                             {rawEvents.filter(e => e.event === habit.habit_name).map((log: any) => (
                               <div key={log.id} className="flex items-center justify-between text-xs font-bold bg-muted/30 p-2 rounded-lg border border-border/10">
                                  <div className="flex items-center gap-2">
                                     <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">{log.time ? log.time.substring(0, 5) : '--:--'}</span>
                                     <span className="text-foreground">{log.value} {habit.unit}</span>
                                     {log.note && <span className="text-muted-foreground opacity-70 italic font-normal">— {log.note}</span>}
                                  </div>
                                  <button 
                                    onClick={() => handleDeleteEvent(log.id)}
                                    className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                                    title="Delete log"
                                  >
                                     <Trash2 size={12} />
                                  </button>
                               </div>
                             ))}
                          </div>
                       </div>
                     )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="py-10 flex flex-col items-center gap-4">
            <Button 
                variant="ghost" 
                onClick={() => router.push('/habits/daily-log')}
                className="group font-black uppercase tracking-widest text-foreground flex items-center gap-2 hover:bg-muted p-6 rounded-md transition-all"
            >
               Habit Tracker <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <div className="text-[10px] font-bold text-muted-foreground/20 uppercase tracking-[0.2em]">End of Active Stream</div>
        </div>
      </div>
    </div>
  );
}
