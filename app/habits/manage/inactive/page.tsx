'use client';

import { useState, useEffect } from 'react';
import { BarChart2 } from "lucide-react";
import Link from "next/link";
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Settings2, Trash2, Edit3, CheckCircle2, Archive, ArchiveRestore, Plus, Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { PageHeader } from "@/components/PageHeader";
import { SectionNav } from "@/components/SectionNav";
import { HABIT_TABS } from "@/lib/navigation";
import { SubNav } from "@/components/SubNav";
 // NOTE: This will be adjusted for subfolders

interface HabitConfig {
  id: string;
  habit_name: string;
  group_name: string;
  frequency: string;
  emoji: string;
  habit_color: string;
  is_archived?: boolean;
  is_paused?: boolean;
  is_deleted?: boolean;
  group_order?: number;
  group_display_order?: number;
}

export default function HabitManageInactivePage() {

  const router = useRouter();
  const [configs, setConfigs] = useState<HabitConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('habit_config')
        .select('*')
        .order('group_order')
        .order('daily_habit_order');

      if (error) throw error;
      setConfigs(data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load habit configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleStateChange = async (id: string, name: string, field: 'is_paused' | 'is_archived' | 'is_deleted', value: boolean, msg: string) => {
    try {
      const { error } = await supabase.from('habit_config').update({ [field]: value }).eq('id', id);
      if (error) throw error;
      toast.success(msg);
      fetchConfigs();
    } catch (err: any) {
      toast.error(err.message || `Failed to update habit.`);
    }
  };

  const handleHardDelete = async (id: string, name: string) => {
    if (!confirm(`PERMANENTLY delete "${name}"?\n\nThis cannot be undone and will wipe all history.`)) return;
    try {
      const { error } = await supabase.from('habit_config').delete().eq('id', id);
      if (error) throw error;
      toast.success(`Permanently deleted ${name}`);
      fetchConfigs();
    } catch (err: any) {
      toast.error('Failed to permanently delete.');
    }
  };

  const pausedConfigs = configs.filter(c => c.is_paused && !c.is_deleted && !c.is_archived);
  const archivedConfigs = configs.filter(c => c.is_archived && !c.is_deleted);
  const deletedConfigs = configs.filter(c => c.is_deleted);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        <PageHeader title="Manage Habits"  >
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
          <SectionNav tabs={HABIT_TABS} activePath="/habits/manage" />
        </div>
        <SubNav 
          items={['Active', 'Groups', 'Inactive']}
          activeItem="Inactive"
          onChange={(val) => {
             if (val === 'Active') router.push('/habits/manage');
             if (val === 'Groups') router.push('/habits/manage/groups');
             if (val === 'Inactive') router.push('/habits/manage/inactive');
          }}
        />
        
        <div className="mt-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-muted/50 animate-pulse rounded-md" />
              ))}
            </div>
          ) : (
            <div className="space-y-10">
               {/* PAUSED SECTION */}
               <div className="space-y-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 border-b border-border/40 pb-2">On Hold (Paused)</div>
                  {pausedConfigs.length === 0 && <div className="text-xs text-muted-foreground p-2">No paused habits.</div>}
                  {pausedConfigs.map((habit) => (
                    <Card key={habit.id} className="border border-amber-500/20 bg-card grayscale opacity-90">
                      <CardContent className="p-0 flex items-center">
                        <div className="w-14 h-14 flex items-center justify-center shrink-0" style={{ backgroundColor: `${habit.habit_color}15` }}>
                          <span className="text-xl">{habit.emoji || '📝'}</span>
                        </div>
                        <div className="flex-1 px-3 py-2 min-w-0 border-l border-border/40">
                          <h3 className="font-bold text-foreground truncate uppercase tracking-tight text-sm">{habit.habit_name}</h3>
                          <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{habit.group_name}</div>
                        </div>
                        <div className="flex items-center p-2 border-l border-border/40">
                           <Button variant="ghost" size="sm" className="text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                                   onClick={() => handleStateChange(habit.id, habit.habit_name, 'is_paused', false, `Resumed ${habit.habit_name}`)}>
                              <Play className="w-4 h-4 mr-2"/> Resume
                           </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
               </div>

               {/* ARCHIVED SECTION */}
               <div className="space-y-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-border/40 pb-2">The Vault (Archived)</div>
                  {archivedConfigs.length === 0 && <div className="text-xs text-muted-foreground p-2">No archived habits.</div>}
                  {archivedConfigs.map((habit) => (
                    <Card key={habit.id} className="border border-border/40 bg-card opacity-50 transition-opacity hover:opacity-100">
                      <CardContent className="p-0 flex items-center">
                        <div className="w-14 h-14 flex items-center justify-center shrink-0" style={{ backgroundColor: `${habit.habit_color}15` }}>
                          <span className="text-xl">{habit.emoji || '📝'}</span>
                        </div>
                        <div className="flex-1 px-3 py-2 min-w-0 border-l border-border/40">
                          <h3 className="font-bold text-foreground truncate uppercase tracking-tight text-sm">{habit.habit_name}</h3>
                          <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{habit.group_name}</div>
                        </div>
                        <div className="flex items-center p-2 border-l border-border/40">
                           <Button variant="ghost" size="sm" className="hover:bg-primary/10"
                                   onClick={() => handleStateChange(habit.id, habit.habit_name, 'is_archived', false, `Restored ${habit.habit_name}`)}>
                              <ArchiveRestore className="w-4 h-4 mr-2"/> Restore
                           </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
               </div>

               {/* DELETED SECTION */}
               <div className="space-y-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 border-b border-border/40 pb-2">Trash (Deleted)</div>
                  {deletedConfigs.length === 0 && <div className="text-xs text-muted-foreground p-2">Trash is empty.</div>}
                  {deletedConfigs.map((habit) => (
                    <Card key={habit.id} className="border border-red-500/20 bg-card opacity-40 hover:opacity-100 transition-opacity">
                      <CardContent className="p-0 flex items-center">
                        <div className="w-14 h-14 flex items-center justify-center shrink-0" style={{ backgroundColor: `${habit.habit_color}15` }}>
                          <span className="text-xl">{habit.emoji || '📝'}</span>
                        </div>
                        <div className="flex-1 px-3 py-2 min-w-0 border-l border-border/40">
                          <h3 className="font-bold text-red-500 truncate uppercase tracking-tight text-sm line-through">{habit.habit_name}</h3>
                          <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{habit.group_name}</div>
                        </div>
                        <div className="flex items-center gap-1 p-2 border-l border-border/40">
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" title="Restore"
                                   onClick={() => handleStateChange(habit.id, habit.habit_name, 'is_deleted', false, `Recovered ${habit.habit_name}`)}>
                              <RotateCcw className="w-4 h-4"/>
                           </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 text-destructive" title="Permanently Delete"
                                   onClick={() => handleHardDelete(habit.id, habit.habit_name)}>
                              <Trash2 className="w-4 h-4"/>
                           </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
