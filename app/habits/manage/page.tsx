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

export default function HabitManagePage() {

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

  const activeConfigs = configs.filter(c => !c.is_archived && !c.is_paused && !c.is_deleted);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6 pt-6 md:pt-6">
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
          activeItem="Active"
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
          ) : activeConfigs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/60 space-y-4">
              <Settings2 className="w-16 h-16 opacity-20" />
              <p className="font-bold text-lg">No active habits</p>
              <Button onClick={() => router.push('/habits/add')} className="rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                 <Plus className="w-4 h-4 mr-2" /> Add Your First Habit
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeConfigs.map((habit) => (
                <Card key={habit.id} className="overflow-hidden border border-border/40 bg-card shadow-zenith transition-shadow rounded-md group">
                  <CardContent className="p-0 flex items-center">
                    <div 
                      className="w-16 h-16 flex items-center justify-center shrink-0" 
                      style={{ backgroundColor: `${habit.habit_color}15` }}
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">{habit.emoji || '📝'}</span>
                    </div>
                    
                    <div className="flex-1 px-4 py-2 min-w-0 border-l border-border/40">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-foreground truncate uppercase tracking-tight">{habit.habit_name}</h3>
                        <Badge variant="secondary" className="px-2 py-0 h-4 text-[8px] font-black uppercase tracking-widest bg-muted text-muted-foreground">
                          {habit.frequency}
                        </Badge>
                      </div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        {habit.group_name}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 p-2 border-l border-border/40">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md"
                        onClick={() => router.push(`/habits/manage/${habit.id}`)}
                        title="Edit Habit"
                      >
                        <Edit3 className="w-5 h-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 rounded-md"
                        onClick={() => {
                           if (confirm(`Pause "${habit.habit_name}"?\n\nIt will be moved to the Inactive tab and its streak will be frozen.`)) {
                              handleStateChange(habit.id, habit.habit_name, 'is_paused', true, `Paused ${habit.habit_name}`);
                           }
                        }}
                        title="Pause Habit"
                      >
                        <Pause className="w-5 h-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 text-muted-foreground hover:text-slate-500 hover:bg-slate-500/10 rounded-md"
                        onClick={() => {
                           if (confirm(`Archive "${habit.habit_name}"?\n\nIt will be moved to the Inactive tab.`)) {
                              handleStateChange(habit.id, habit.habit_name, 'is_archived', true, `Archived ${habit.habit_name}`);
                           }
                        }}
                        title="Archive Habit"
                      >
                        <Archive className="w-5 h-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                        onClick={() => {
                           if (confirm(`Move "${habit.habit_name}" to Trash?\n\nIt will be moved to the Inactive tab.`)) {
                              handleStateChange(habit.id, habit.habit_name, 'is_deleted', true, `Moved ${habit.habit_name} to Trash`);
                           }
                        }}
                        title="Move to Trash"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
