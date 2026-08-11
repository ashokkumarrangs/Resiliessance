'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { HABIT_TABS } from "@/lib/navigation";
import { SubNav } from "@/components/SubNav";
import { GroupManager } from '../GroupManager'; // NOTE: This will be adjusted for subfolders
import { PageWrapper } from "@/components/PageWrapper";
import { useDialog } from "@/components/dialog-provider";

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
  const { confirm } = useDialog();
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
    if (!(await confirm(`PERMANENTLY delete "${name}"?\n\nThis cannot be undone and will wipe all history.`))) return;
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
    <PageWrapper
      title="Manage Habits"
      reportHref="/reports/habits"
      sectionTabs={HABIT_TABS}
      activePath="/habits/manage"
    >
        
        
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
    </PageWrapper>
  );
}