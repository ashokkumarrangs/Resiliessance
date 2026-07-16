import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronUp, ChevronDown, Edit3, Save, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface HabitConfig {
  id: string;
  habit_name: string;
  group_name: string;
  group_order?: number;
  group_display_order?: number;
}

interface GroupManagerProps {
  configs: HabitConfig[];
  fetchConfigs: () => void;
}

export function GroupManager({ configs, fetchConfigs }: GroupManagerProps) {
  const [groups, setGroups] = useState<{ name: string; displayOrder: number }[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Extract unique groups and their display order
    const groupMap = new Map<string, number>();
    configs.forEach(c => {
      const g = c.group_name || 'Core';
      if (!groupMap.has(g)) {
        groupMap.set(g, c.group_display_order ?? 999);
      }
    });
    const groupList = Array.from(groupMap.entries()).map(([name, displayOrder]) => ({ name, displayOrder }));
    groupList.sort((a, b) => a.displayOrder - b.displayOrder);
    setGroups(groupList);
  }, [configs]);

  const moveGroupUp = async (index: number) => {
    if (index === 0) return;
    const list = [...groups];
    
    const temp = list[index].displayOrder;
    list[index].displayOrder = list[index - 1].displayOrder;
    list[index - 1].displayOrder = temp;
    
    if (list[index].displayOrder === 999 && list[index - 1].displayOrder === 999) {
       list.forEach((g, i) => g.displayOrder = i + 1);
       const t2 = list[index].displayOrder;
       list[index].displayOrder = list[index - 1].displayOrder;
       list[index - 1].displayOrder = t2;
    }

    list.sort((a, b) => a.displayOrder - b.displayOrder);
    setGroups(list);
    await saveGroupOrders(list);
  };

  const moveGroupDown = async (index: number) => {
    if (index >= groups.length - 1) return;
    const list = [...groups];
    
    const temp = list[index].displayOrder;
    list[index].displayOrder = list[index + 1].displayOrder;
    list[index + 1].displayOrder = temp;
    
    if (list[index].displayOrder === 999 && list[index + 1].displayOrder === 999) {
       list.forEach((g, i) => g.displayOrder = i + 1);
       const t2 = list[index].displayOrder;
       list[index].displayOrder = list[index + 1].displayOrder;
       list[index + 1].displayOrder = t2;
    }

    list.sort((a, b) => a.displayOrder - b.displayOrder);
    setGroups(list);
    await saveGroupOrders(list);
  };

  const saveGroupOrders = async (list: { name: string; displayOrder: number }[]) => {
    try {
      for (const g of list) {
        await supabase.from('habit_config').update({ group_display_order: g.displayOrder }).eq('group_name', g.name);
      }
      fetchConfigs();
    } catch (err: any) {
      toast.error('Failed to update group order');
    }
  };

  const handleRenameGroup = async (oldName: string) => {
    if (!editGroupName || editGroupName.trim() === '' || editGroupName === oldName) {
      setExpandedGroup(null);
      return;
    }
    setSaving(true);
    try {
      await supabase.from('habit_config').update({ group_name: editGroupName }).eq('group_name', oldName);
      toast.success('Group renamed');
      setExpandedGroup(null);
      fetchConfigs();
    } catch (err: any) {
      toast.error('Failed to rename group');
    } finally {
      setSaving(false);
    }
  };

  const habitsInExpanded = configs.filter(c => (c.group_name || 'Core') === expandedGroup).sort((a, b) => (a.group_order || 999) - (b.group_order || 999));

  const moveHabitUp = async (index: number) => {
    if (index === 0) return;
    const list = [...habitsInExpanded];
    const temp = list[index].group_order;
    list[index].group_order = list[index - 1].group_order;
    list[index - 1].group_order = temp;

    if (!list[index].group_order || !list[index-1].group_order) {
       list.forEach((h, i) => h.group_order = i + 1);
       const t2 = list[index].group_order;
       list[index].group_order = list[index - 1].group_order;
       list[index - 1].group_order = t2;
    }

    await saveHabitOrders(list);
  };

  const moveHabitDown = async (index: number) => {
    if (index >= habitsInExpanded.length - 1) return;
    const list = [...habitsInExpanded];
    const temp = list[index].group_order;
    list[index].group_order = list[index + 1].group_order;
    list[index + 1].group_order = temp;

    if (!list[index].group_order || !list[index+1].group_order) {
       list.forEach((h, i) => h.group_order = i + 1);
       const t2 = list[index].group_order;
       list[index].group_order = list[index + 1].group_order;
       list[index + 1].group_order = t2;
    }

    await saveHabitOrders(list);
  };

  const saveHabitOrders = async (list: HabitConfig[]) => {
    try {
      for (const h of list) {
        await supabase.from('habit_config').update({ group_order: h.group_order }).eq('id', h.id);
      }
      fetchConfigs();
    } catch (err: any) {
      toast.error('Failed to update habit order');
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center mb-6">
         Reorder groups or click to edit habits inside
      </div>
      
      {groups.map((group, idx) => (
        <div key={group.name} className={`border border-border/40 rounded-xl overflow-hidden transition-all duration-300 ${expandedGroup === group.name ? 'bg-card shadow-lg' : 'bg-muted/10 cursor-pointer hover:bg-muted/30'}`}>
          <div className="p-4 flex justify-between items-center" onClick={() => {
             if (expandedGroup !== group.name) {
                setExpandedGroup(group.name);
                setEditGroupName(group.name);
             } else {
                setExpandedGroup(null);
             }
          }}>
             <div className="flex items-center gap-3">
               <span className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black ${expandedGroup === group.name ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'}`}>{idx + 1}</span>
               <h3 className="font-bold text-foreground truncate uppercase tracking-tight">{group.name}</h3>
             </div>
             <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                   onClick={() => moveGroupUp(idx)}
                   disabled={idx === 0}
                   className="w-8 h-8 flex items-center justify-center rounded bg-card hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed border border-border/40 shadow-sm"
                >
                   <ChevronUp size={16} />
                </button>
                <button
                   onClick={() => moveGroupDown(idx)}
                   disabled={idx === groups.length - 1}
                   className="w-8 h-8 flex items-center justify-center rounded bg-card hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed border border-border/40 shadow-sm"
                >
                   <ChevronDown size={16} />
                </button>
             </div>
          </div>
          
          {expandedGroup === group.name && (
            <div className="p-4 pt-0 space-y-6 border-t border-border/10 mt-2 bg-card">
               
               <div className="space-y-2 pt-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Rename Group</label>
                 <div className="flex gap-2">
                    <Input 
                      value={editGroupName} 
                      onChange={(e) => setEditGroupName(e.target.value)} 
                      className="font-bold h-10 bg-muted/50"
                    />
                    <Button onClick={() => handleRenameGroup(group.name)} disabled={saving || editGroupName === group.name} className="h-10">
                       {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save'}
                    </Button>
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Habits in {group.name}</label>
                 <div className="bg-muted/30 p-2 rounded-lg space-y-1">
                    {habitsInExpanded.map((habit, hIdx) => (
                       <div key={habit.id} className="flex items-center justify-between p-2 rounded-md hover:bg-card border border-transparent transition-colors">
                          <div className="flex items-center gap-3">
                             <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black bg-muted-foreground/10 text-muted-foreground">
                                {hIdx + 1}
                             </div>
                             <span className="text-xs font-bold text-foreground/70 uppercase tracking-tight">{habit.habit_name}</span>
                          </div>
                          <div className="flex gap-1">
                             <button
                                onClick={() => moveHabitUp(hIdx)}
                                disabled={hIdx === 0}
                                className="w-6 h-6 flex items-center justify-center rounded bg-card hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed border border-border/40 shadow-sm"
                             >
                                <ChevronUp size={12} />
                             </button>
                             <button
                                onClick={() => moveHabitDown(hIdx)}
                                disabled={hIdx === habitsInExpanded.length - 1}
                                className="w-6 h-6 flex items-center justify-center rounded bg-card hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed border border-border/40 shadow-sm"
                             >
                                <ChevronDown size={12} />
                             </button>
                          </div>
                       </div>
                    ))}
                 </div>
               </div>

            </div>
          )}
        </div>
      ))}
    </div>
  );
}
