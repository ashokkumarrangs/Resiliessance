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
import { GroupManager } from '../GroupManager'; // NOTE: This will be adjusted for subfolders

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

export default function HabitManageGroupsPage() {

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
          activeItem="Groups"
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
            <GroupManager configs={configs.filter(c => !c.is_deleted)} fetchConfigs={fetchConfigs} />
          )}
        </div>
      </div>
    </div>
  );
}
