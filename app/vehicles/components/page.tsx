'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Calendar, 
  Gauge, 
  Wrench, 
  Sliders, 
  Trash2, 
  Edit3, 
  Plus, 
  Clock, 
  Info, 
  CheckCircle,
  AlertTriangle,
  FileText,
  ChevronRight,
  TrendingUp,
  RotateCcw
} from "lucide-react";
import { format, parseISO, differenceInDays } from 'date-fns';
import { PageWrapper } from "@/components/PageWrapper";
import { SaveButton } from "@/components/ui/SaveButton";
import { SubNav } from "@/components/SubNav";
import { VEHICLE_TABS } from "@/lib/navigation";
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useDialog } from '@/components/dialog-provider';
import { useVehicleComponents, VehicleComponent, ComponentHistoryRecord } from '@/hooks/useVehicleComponents';

interface Vehicle {
  id: string;
  vehicle_name: string;
  registration_number: string;
  initial_odometer: number;
}

const CATEGORIES = ['Fluids', 'Brakes', 'Filters', 'Electrical', 'Tires', 'Belts', 'Other'];

const PRESETS = [
  { name: 'Engine Oil', category: 'Fluids', limitOdo: 10000, limitMonths: 6 },
  { name: 'Cabin Air Filter', category: 'Filters', limitOdo: 20000, limitMonths: 12 },
  { name: 'Engine Air Filter', category: 'Filters', limitOdo: 20000, limitMonths: 12 },
  { name: 'Front Brake Pads', category: 'Brakes', limitOdo: 40000, limitMonths: 36 },
  { name: 'Rear Brake Pads', category: 'Brakes', limitOdo: 40000, limitMonths: 36 },
  { name: 'Spark Plugs', category: 'Electrical', limitOdo: 80000, limitMonths: 48 },
  { name: 'Tires', category: 'Tires', limitOdo: 60000, limitMonths: 60 },
  { name: 'Car Battery', category: 'Electrical', limitOdo: 50000, limitMonths: 36 },
  { name: 'Brake Fluid', category: 'Fluids', limitOdo: 40000, limitMonths: 24 },
  { name: 'Engine Coolant', category: 'Fluids', limitOdo: 100000, limitMonths: 60 },
];

function VehicleComponentsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedVehicle = searchParams.get("vehicle") || '';
  const { confirm } = useDialog();
  const { 
    getComponents, 
    getComponentHistory, 
    addComponent, 
    updateComponent, 
    deleteComponent, 
    replaceComponent 
  } = useVehicleComponents();

  const setSelectedVehicle = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) {
      params.set("vehicle", id);
    } else {
      params.delete("vehicle");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [components, setComponents] = useState<VehicleComponent[]>([]);
  const [history, setHistory] = useState<ComponentHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // UI Tabs: 'active' | 'history'
  const [activeSubTab, setActiveSubTab] = useState<'active' | 'history'>('active');

  // Add/Edit Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingComp, setEditingComp] = useState<VehicleComponent | null>(null);
  const [formData, setFormData] = useState({
    component_name: '',
    category: 'Fluids',
    brand_model: '',
    cost: '',
    installed_date: format(new Date(), 'yyyy-MM-dd'),
    installed_odometer: '',
    limit_odometer: '',
    limit_months: '',
    notes: '',
  });

  // Replace Modal state
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replacingComp, setReplacingComp] = useState<VehicleComponent | null>(null);
  const [replaceData, setReplaceData] = useState({
    replacedDate: format(new Date(), 'yyyy-MM-dd'),
    replacedOdometer: '',
    cost: '',
    brandModel: '',
    serviceCenter: '',
    replacementReason: 'Scheduled',
    notes: '',
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (selectedVehicle) {
      fetchComponentsAndHistory();
    } else {
      setComponents([]);
      setHistory([]);
    }
  }, [selectedVehicle]);

  async function fetchVehicles() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('vehicle_config').select('*').order('vehicle_name');
      if (error) throw error;
      setVehicles(data || []);
      
      // Auto-select first vehicle if none selected
      if (data && data.length > 0 && !selectedVehicle) {
        setSelectedVehicle(data[0].id);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }

  async function fetchComponentsAndHistory() {
    setLoading(true);
    try {
      const [comps, hist] = await Promise.all([
        getComponents(selectedVehicle),
        getComponentHistory(selectedVehicle)
      ]);
      setComponents(comps);
      setHistory(hist);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load components');
    } finally {
      setLoading(false);
    }
  }

  // Handle preset clicks
  const applyPreset = (preset: typeof PRESETS[0]) => {
    setFormData(prev => ({
      ...prev,
      component_name: preset.name,
      category: preset.category,
      limit_odometer: preset.limitOdo.toString(),
      limit_months: preset.limitMonths.toString(),
    }));
  };

  // Open add/edit modal
  const openFormModal = (comp: VehicleComponent | null = null) => {
    if (comp) {
      setEditingComp(comp);
      setFormData({
        component_name: comp.component_name,
        category: comp.category,
        brand_model: comp.brand_model || '',
        cost: comp.cost?.toString() || '',
        installed_date: comp.installed_date,
        installed_odometer: comp.installed_odometer.toString(),
        limit_odometer: comp.limit_odometer?.toString() || '',
        limit_months: comp.limit_months?.toString() || '',
        notes: comp.notes || '',
      });
    } else {
      setEditingComp(null);
      // Auto populate current odometer as default installation odometer
      const currentOdo = getCurrentVehicleOdo();
      setFormData({
        component_name: '',
        category: 'Fluids',
        brand_model: '',
        cost: '',
        installed_date: format(new Date(), 'yyyy-MM-dd'),
        installed_odometer: currentOdo ? currentOdo.toString() : '',
        limit_odometer: '',
        limit_months: '',
        notes: '',
      });
    }
    setShowFormModal(true);
  };

  // Helper to find the current odometer of selected vehicle from calculation results
  const getCurrentVehicleOdo = () => {
    if (components.length > 0 && components[0].health) {
      return components[0].health.componentId ? components[0].installed_odometer + Math.round(components[0].health.odometerWear * (components[0].limit_odometer || 0)) : 0;
    }
    const currentVeh = vehicles.find(v => v.id === selectedVehicle);
    return currentVeh?.initial_odometer || 0;
  };

  const handleSaveComponent = async () => {
    if (!formData.component_name || !formData.installed_date || !formData.installed_odometer) {
      toast.error('Component name, installation date, and odometer are required');
      return;
    }
    setSaving(true);
    try {
      const parsedData = {
        vehicle_id: selectedVehicle,
        component_name: formData.component_name,
        category: formData.category,
        brand_model: formData.brand_model || null,
        cost: parseFloat(formData.cost) || 0,
        installed_date: formData.installed_date,
        installed_odometer: parseInt(formData.installed_odometer) || 0,
        limit_odometer: formData.limit_odometer ? parseInt(formData.limit_odometer) : null,
        limit_months: formData.limit_months ? parseInt(formData.limit_months) : null,
        notes: formData.notes || null,
      };

      if (editingComp) {
        await updateComponent(editingComp.id, parsedData);
        toast.success('Component updated successfully!');
      } else {
        await addComponent(parsedData);
        toast.success('Component added successfully!');
      }
      setShowFormModal(false);
      fetchComponentsAndHistory();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save component');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComponent = async (id: string, name: string) => {
    if (!(await confirm(`Are you sure you want to permanently delete component "${name}"?\nThis cannot be undone.`))) return;
    try {
      await deleteComponent(id);
      toast.success('Component deleted');
      fetchComponentsAndHistory();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete component');
    }
  };

  // Open replace modal
  const openReplaceModal = (comp: VehicleComponent) => {
    setReplacingComp(comp);
    
    // Attempt to guess current odometer to pre-fill
    const currentOdo = getCurrentVehicleOdo();
    
    setReplaceData({
      replacedDate: format(new Date(), 'yyyy-MM-dd'),
      replacedOdometer: currentOdo ? currentOdo.toString() : '',
      cost: '',
      brandModel: comp.brand_model || '',
      serviceCenter: '',
      replacementReason: 'Scheduled',
      notes: '',
    });
    setShowReplaceModal(true);
  };

  const handleReplaceComponentSubmit = async () => {
    if (!replacingComp) return;
    if (!replaceData.replacedDate || !replaceData.replacedOdometer) {
      toast.error('Replacement date and odometer are required');
      return;
    }
    
    const targetOdo = parseInt(replaceData.replacedOdometer);
    if (targetOdo < replacingComp.installed_odometer) {
      toast.error(`Replacement odometer (${targetOdo}) cannot be less than the installation odometer (${replacingComp.installed_odometer})`);
      return;
    }

    setSaving(true);
    try {
      await replaceComponent({
        component: replacingComp,
        replacedDate: replaceData.replacedDate,
        replacedOdometer: targetOdo,
        cost: parseFloat(replaceData.cost) || 0,
        brandModel: replaceData.brandModel || null,
        serviceCenter: replaceData.serviceCenter || null,
        replacementReason: replaceData.replacementReason,
        notes: replaceData.notes || null,
      });

      toast.success(`${replacingComp.component_name} replaced & service logged successfully!`);
      setShowReplaceModal(false);
      fetchComponentsAndHistory();
    } catch (err: any) {
      toast.error(err.message || 'Failed to replace component');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper
      title="Components"
      reportHref="/reports/vehicles"
      sectionTabs={VEHICLE_TABS}
      activePath="/vehicles/components"
    >
      <div className="mt-6 w-full">
        {/* Vehicle Selection SubNav */}
        {loading && vehicles.length === 0 ? (
          <div className="w-full max-w-sm mx-auto h-9 bg-muted/60 animate-pulse rounded-lg mb-6" />
        ) : (
          <div className="mb-6 w-full flex justify-center">
            <SubNav
              items={vehicles.map(v => v.vehicle_name)}
              activeItem={vehicles.find(v => v.id === selectedVehicle)?.vehicle_name || ""}
              onChange={(name) => {
                const matched = vehicles.find(v => v.vehicle_name === name);
                if (matched) setSelectedVehicle(matched.id);
              }}
            />
          </div>
        )}

        {/* Action Header & Subtab Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex bg-muted/40 p-1 rounded-xl border border-border/20 shadow-sm shrink-0">
            <button
              onClick={() => setActiveSubTab('active')}
              className={`px-4 py-2 text-xs font-black transition-all rounded-lg ${
                activeSubTab === 'active' 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground/60 hover:text-foreground"
              }`}
            >
              Active Components
            </button>
            <button
              onClick={() => setActiveSubTab('history')}
              className={`px-4 py-2 text-xs font-black transition-all rounded-lg ${
                activeSubTab === 'history' 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground/60 hover:text-foreground"
              }`}
            >
              History Log
            </button>
          </div>

          <button
            onClick={() => openFormModal()}
            className="h-10 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
          >
            <Plus size={14} /> Add Component
          </button>
        </div>

        {/* Loading Indicator */}
        {loading && components.length === 0 ? (
          <div className="space-y-4 py-8">
            <div className="w-full h-32 bg-muted/30 animate-pulse rounded-2xl border border-border/10" />
            <div className="w-full h-32 bg-muted/30 animate-pulse rounded-2xl border border-border/10" />
          </div>
        ) : (
          <div>
            {/* SUBTAB 1: ACTIVE COMPONENTS */}
            {activeSubTab === 'active' && (
              <div>
                {components.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground font-black italic bg-card border border-white/10 rounded-2xl p-6">
                    No tracked components yet. Click "Add Component" to get started!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {components.map((comp) => {
                      const health = comp.health;
                      const wearPercent = health ? Math.max(0, 100 - health.unifiedHealth) : 0;
                      
                      let statusColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
                      let barColor = 'bg-emerald-500';
                      
                      if (health?.status === 'critical') {
                        statusColor = 'text-rose-500 bg-rose-500/10 border-rose-500/20 animate-pulse';
                        barColor = 'bg-rose-500';
                      } else if (health?.status === 'warning') {
                        statusColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
                        barColor = 'bg-amber-500';
                      }

                      return (
                        <Card key={comp.id} className="rounded-2xl border border-white/10 overflow-hidden bg-card/60 backdrop-blur-md shadow-sm transition-all hover:shadow-md hover:border-white/20">
                          <CardContent className="p-5 space-y-4">
                            
                            {/* Card Top Title & Status */}
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <h3 className="text-base font-black text-foreground flex items-center gap-1.5">
                                  {comp.component_name}
                                </h3>
                                <div className="text-xs font-bold text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                                  <span className="bg-muted px-2 py-0.5 rounded-md text-[10px] uppercase font-black tracking-wide border border-border/10">{comp.category}</span>
                                  {comp.brand_model && <span>• {comp.brand_model}</span>}
                                </div>
                              </div>
                              
                              <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 shrink-0 ${statusColor}`}>
                                {health?.status === 'critical' && <AlertTriangle size={10} />}
                                {health?.status === 'warning' && <AlertTriangle size={10} />}
                                {health?.status === 'healthy' && <CheckCircle size={10} />}
                                {health?.unifiedHealth}% Health
                              </div>
                            </div>

                            {/* Limits progress bars */}
                            <div className="space-y-3">
                              {/* 1. Distance Lifespan progress bar */}
                              {comp.limit_odometer && comp.limit_odometer > 0 && health && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs font-bold leading-none">
                                    <span className="text-muted-foreground flex items-center gap-1"><Gauge size={12} /> Distance Wear</span>
                                    <span className="text-foreground">{Math.round(health.odometerWear * 100)}%</span>
                                  </div>
                                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all ${barColor}`} 
                                      style={{ width: `${Math.min(100, Math.round(health.odometerWear * 100))}%` }} 
                                    />
                                  </div>
                                  <div className="text-[10px] font-bold text-muted-foreground/60 text-right leading-none mt-0.5">
                                    Driven: {Math.max(0, getCurrentVehicleOdo() - comp.installed_odometer)} / {comp.limit_odometer} units
                                  </div>
                                </div>
                              )}

                              {/* 2. Time Lifespan progress bar */}
                              {comp.limit_months && comp.limit_months > 0 && health && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs font-bold leading-none">
                                    <span className="text-muted-foreground flex items-center gap-1"><Calendar size={12} /> Time Wear</span>
                                    <span className="text-foreground">{Math.round(health.timeWear * 100)}%</span>
                                  </div>
                                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all ${barColor}`} 
                                      style={{ width: `${Math.min(100, Math.round(health.timeWear * 100))}%` }} 
                                    />
                                  </div>
                                  <div className="text-[10px] font-bold text-muted-foreground/60 text-right leading-none mt-0.5">
                                    Installed: {comp.installed_date} ({Math.round(health.timeWear * comp.limit_months)} / {comp.limit_months} mo)
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Predictive banner */}
                            {health?.estimatedExpiryDate && (
                              <div className="bg-muted/40 p-2.5 rounded-xl border border-border/20 flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                <Info size={14} className="shrink-0 text-primary" />
                                <span>
                                  Expected replacement: <strong className="text-foreground">{format(new Date(health.estimatedExpiryDate), 'MMM d, yyyy')}</strong>
                                  {health.status === 'critical' ? ' (Overdue!)' : ` (~${Math.max(0, differenceInDays(new Date(health.estimatedExpiryDate), new Date()))} days remaining)`}
                                </span>
                              </div>
                            )}

                            {/* Actions buttons */}
                            <div className="flex justify-between items-center pt-2 border-t border-border/10">
                              <button
                                onClick={() => openReplaceModal(comp)}
                                className="h-8 px-3 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 rounded-lg text-xs font-black flex items-center gap-1 transition-all"
                              >
                                <RotateCcw size={12} /> Replace
                              </button>
                              
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openFormModal(comp)}
                                  className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-all"
                                  title="Edit"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteComponent(comp.id, comp.component_name)}
                                  className="p-2 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded-lg transition-all"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SUBTAB 2: HISTORY LOG */}
            {activeSubTab === 'history' && (
              <div>
                {history.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground font-black italic bg-card border border-white/10 rounded-2xl p-6">
                    No replacement history found for this vehicle.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((record) => (
                      <Card key={record.id} className="rounded-2xl border border-white/10 overflow-hidden bg-card/40 shadow-sm">
                        <CardContent className="p-5 space-y-3">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h4 className="text-sm font-black text-foreground flex items-center gap-1.5">
                                {record.component_name}
                              </h4>
                              <div className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider mt-0.5">
                                category: {record.category} {record.brand_model && `• brand: ${record.brand_model}`}
                              </div>
                            </div>
                            <span className="bg-muted/80 text-muted-foreground px-2 py-0.5 rounded text-[10px] font-black border border-border/10">
                              {record.replaced_date}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs font-bold pt-2 border-t border-border/10">
                            <div>
                              <span className="text-muted-foreground/60">Duration:</span>{' '}
                              <span className="text-foreground">{record.months_in_service} months</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground/60">Distance:</span>{' '}
                              <span className="text-foreground">{record.distance_traveled} units</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground/60">Replacement Cost:</span>{' '}
                              <span className="text-foreground">${record.cost.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground/60">Reason:</span>{' '}
                              <span className="text-foreground capitalize">{record.replacement_reason || 'N/A'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── ADD/EDIT COMPONENT DIALOG MODAL ─── */}
      {showFormModal && (
        <div className="fixed inset-0 z-[5000] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border text-card-foreground p-6 rounded-3xl shadow-zenith max-w-md w-full space-y-6 animate-in zoom-in-95 duration-200 my-8">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-foreground">
                {editingComp ? `Edit Component` : `Add Tracked Component`}
              </h3>
              <button 
                onClick={() => setShowFormModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold px-2 py-1 rounded-lg hover:bg-muted"
              >
                Close
              </button>
            </div>

            {/* Presets Helper (only show for adding) */}
            {!editingComp && (
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground/60 uppercase tracking-wide">
                  Quick Presets
                </label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 flex-nowrap">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="px-3 py-1.5 bg-muted/60 text-foreground hover:bg-muted/80 rounded-full text-xs font-bold border border-border/10 cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="space-y-1">
                <label className="text-xs font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                  Component Name
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Engine Oil, Air Filter"
                  value={formData.component_name} 
                  onChange={e => setFormData(p =>({...p, component_name: e.target.value}))} 
                  className="w-full h-11 bg-muted border-none rounded-xl px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData(p =>({...p, category: e.target.value}))}
                    className="w-full h-11 bg-muted border-none rounded-xl px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner outline-none appearance-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                    Brand / Model
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Mobil1 5W30"
                    value={formData.brand_model} 
                    onChange={e => setFormData(p =>({...p, brand_model: e.target.value}))} 
                    className="w-full h-11 bg-muted border-none rounded-xl px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                    Odometer Limit
                  </label>
                  <input 
                    type="number" 
                    placeholder="e.g. 10000"
                    value={formData.limit_odometer} 
                    onChange={e => setFormData(p =>({...p, limit_odometer: e.target.value}))} 
                    className="w-full h-11 bg-muted border-none rounded-xl px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                    Months Limit
                  </label>
                  <input 
                    type="number" 
                    placeholder="e.g. 12"
                    value={formData.limit_months} 
                    onChange={e => setFormData(p =>({...p, limit_months: e.target.value}))} 
                    className="w-full h-11 bg-muted border-none rounded-xl px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                    Install Date
                  </label>
                  <input 
                    type="date" 
                    value={formData.installed_date} 
                    onChange={e => setFormData(p =>({...p, installed_date: e.target.value}))} 
                    className="w-full h-11 bg-muted border-none rounded-xl px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                    Install Odometer
                  </label>
                  <input 
                    type="number" 
                    value={formData.installed_odometer} 
                    onChange={e => setFormData(p =>({...p, installed_odometer: e.target.value}))} 
                    className="w-full h-11 bg-muted border-none rounded-xl px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                    Purchase Cost ($)
                  </label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={formData.cost} 
                    onChange={e => setFormData(p =>({...p, cost: e.target.value}))} 
                    className="w-full h-11 bg-muted border-none rounded-xl px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                  Notes
                </label>
                <textarea 
                  placeholder="Installation notes, part serial number, etc."
                  value={formData.notes} 
                  onChange={e => setFormData(p =>({...p, notes: e.target.value}))} 
                  className="w-full bg-muted border-none rounded-xl p-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner min-h-20 outline-none" 
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted font-bold text-sm transition-all flex-1 cursor-pointer"
              >
                Cancel
              </button>
              <SaveButton
                onClick={handleSaveComponent}
                isSaving={saving}
                label={editingComp ? "Update" : "Add Component"}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 transition-all flex-1 cursor-pointer flex items-center justify-center gap-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── MARK COMPONENT REPLACED DIALOG MODAL ─── */}
      {showReplaceModal && replacingComp && (
        <div className="fixed inset-0 z-[5000] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border text-card-foreground p-6 rounded-3xl shadow-zenith max-w-md w-full space-y-6 animate-in zoom-in-95 duration-200 my-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-foreground">
                  Replace Component
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground/60">
                  Resets baseline values and logs service event.
                </p>
              </div>
              <button 
                onClick={() => setShowReplaceModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold px-2 py-1 rounded-lg hover:bg-muted"
              >
                Close
              </button>
            </div>

            <div className="bg-muted/40 p-3 rounded-2xl border border-border/10 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Active Component</span>
              <h4 className="text-sm font-black text-foreground leading-none">{replacingComp.component_name}</h4>
              <p className="text-[11px] font-bold text-muted-foreground/60">
                Last replaced at {replacingComp.installed_odometer} units ({replacingComp.installed_date})
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                    Replacement Date
                  </label>
                  <input 
                    type="date" 
                    value={replaceData.replacedDate} 
                    onChange={e => setReplaceData(p =>({...p, replacedDate: e.target.value}))} 
                    className="w-full h-11 bg-muted border-none rounded-xl px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                    Odometer Reading
                  </label>
                  <input 
                    type="number" 
                    placeholder="Current readings"
                    value={replaceData.replacedOdometer} 
                    onChange={e => setReplaceData(p =>({...p, replacedOdometer: e.target.value}))} 
                    className="w-full h-11 bg-muted border-none rounded-xl px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                    New Brand / Model
                  </label>
                  <input 
                    type="text" 
                    placeholder={replacingComp.brand_model || "e.g. Brembo"}
                    value={replaceData.brandModel} 
                    onChange={e => setReplaceData(p =>({...p, brandModel: e.target.value}))} 
                    className="w-full h-11 bg-muted border-none rounded-xl px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                    Cost of Replacement ($)
                  </label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={replaceData.cost} 
                    onChange={e => setReplaceData(p =>({...p, cost: e.target.value}))} 
                    className="w-full h-11 bg-muted border-none rounded-xl px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                    Service Center
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. DIY, Honda Service"
                    value={replaceData.serviceCenter} 
                    onChange={e => setReplaceData(p =>({...p, serviceCenter: e.target.value}))} 
                    className="w-full h-11 bg-muted border-none rounded-xl px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                    Replacement Reason
                  </label>
                  <select
                    value={replaceData.replacementReason}
                    onChange={e => setReplaceData(p =>({...p, replacementReason: e.target.value}))}
                    className="w-full h-11 bg-muted border-none rounded-xl px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner outline-none appearance-none"
                  >
                    <option value="Scheduled">Scheduled Wear</option>
                    <option value="Wear/Failure">Premature Wear / Failure</option>
                    <option value="Upgrade">Upgrade</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                  Notes
                </label>
                <textarea 
                  placeholder="Notes about the installation or part condition..."
                  value={replaceData.notes} 
                  onChange={e => setReplaceData(p =>({...p, notes: e.target.value}))} 
                  className="w-full bg-muted border-none rounded-xl p-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner min-h-20 outline-none" 
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReplaceModal(false)}
                className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted font-bold text-sm transition-all flex-1 cursor-pointer"
              >
                Cancel
              </button>
              <SaveButton
                onClick={handleReplaceComponentSubmit}
                isSaving={saving}
                label="Confirm Replacement"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 transition-all flex-1 cursor-pointer flex items-center justify-center gap-2"
              />
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

export default function VehicleComponentsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center font-black animate-pulse">LOADING COMPONENTS...</div>}>
      <VehicleComponentsContent />
    </Suspense>
  );
}
