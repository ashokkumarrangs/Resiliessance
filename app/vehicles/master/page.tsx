'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeftCircle, Car, Edit3, Plus, RefreshCw, Save, Trash2 , BarChart2, Hash, Calendar, Gauge, Fuel, Info } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SaveButton } from "@/components/ui/SaveButton";
import { SectionNav } from "@/components/SectionNav";
import { VEHICLE_TABS } from "@/lib/navigation";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

interface Vehicle {
  id: string;
  vehicle_name: string;
  registration_number: string;
  vehicle_type: string;
  fuel_type: string;
  initial_odometer: number;
  insurance_expiry: string;
  next_service_date: string;
  created_at: string;
}

export default function VehicleMasterPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    vehicle_name: '',
    registration_number: '',
    vehicle_type: 'Car',
    fuel_type: 'Petrol',
    initial_odometer: '',
    insurance_expiry: '',
    next_service_date: '',
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('vehicle_config').select('*').order('vehicle_name');
      if (error) throw error;
      setVehicles(data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setFormData({
      vehicle_name: v.vehicle_name,
      registration_number: v.registration_number,
      vehicle_type: v.vehicle_type,
      fuel_type: v.fuel_type,
      initial_odometer: v.initial_odometer?.toString() || '',
      insurance_expiry: v.insurance_expiry || '',
      next_service_date: v.next_service_date || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently delete "${name}"?\nThis will remove all fuel and service logs associated with it.`)) return;
    try {
      // Assuming cascade delete or manual delete logic
      await supabase.from('vehicle_fuel_logs').delete().eq('vehicle_id', id);
      const { error } = await supabase.from('vehicle_config').delete().eq('id', id);
      if (error) throw error;
      toast.success('Vehicle deleted');
      fetchVehicles();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete vehicle');
    }
  };

  const handleSave = async () => {
    if (!formData.vehicle_name || !formData.registration_number) {
      toast.error('Please enter Name and Reg Number');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase.from('vehicle_config').update(formData).eq('id', editingId);
        if (error) throw error;
        toast.success('Vehicle updated');
      } else {
        const { error } = await supabase.from('vehicle_config').insert([formData]);
        if (error) throw error;
        toast.success('Vehicle added');
      }
      setEditingId(null);
      setFormData({ 
        vehicle_name: '', 
        registration_number: '', 
        vehicle_type: 'Car', 
        fuel_type: 'Petrol',
        initial_odometer: '',
        insurance_expiry: '',
        next_service_date: '',
      });
      fetchVehicles();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save vehicle');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        <PageHeader title={editingId ? "Edit Vehicle" : "Add Vehicle"}  >
        <div className="flex items-center gap-2">

          <Link 
            href="/reports/vehicles" 
            className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-muted-foreground/60 hover:text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
            title="View Reports"
          >
            <BarChart2 className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Link>
        </div>
      </PageHeader>
        <div className="-mt-2 mb-6">
          <SectionNav tabs={VEHICLE_TABS} activePath="/vehicles/master" />
        </div>


        
        {/* Form Card */}
        <Card className="rounded-md shadow-zenith border border-white/20 overflow-hidden">
          <CardContent className="p-7 space-y-6 bg-card">
            <div className="space-y-2">
              <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                 <Car className="w-4 h-4 shrink-0" /> Vehicle Name
              </label>
              <input 
                type="text"
                placeholder="Blue Swift, Duke 390..." 
                className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none"
                value={formData.vehicle_name}
                onChange={e => setFormData(p => ({...p, vehicle_name: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                 <Hash className="w-4 h-4 shrink-0" /> Registration No.
              </label>
              <input 
                type="text"
                placeholder="KA-01-XX-0000" 
                className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none uppercase tracking-wider"
                value={formData.registration_number}
                onChange={e => setFormData(p => ({...p, registration_number: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                 <Gauge className="w-4 h-4 shrink-0" /> Initial Odometer (km)
              </label>
              <input 
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Mileage at start" 
                className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none"
                value={formData.initial_odometer}
                onChange={e => setFormData(p => ({...p, initial_odometer: e.target.value}))}
              />
            </div>
            <div className="grid grid-cols-2 gap-7">
              <div className="space-y-2">
                <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                   <Calendar className="w-4 h-4 shrink-0" /> Insurance Expiry
                </label>
                <input 
                  type="date" 
                  className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none"
                  value={formData.insurance_expiry}
                  onChange={e => setFormData(p => ({...p, insurance_expiry: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                   <Calendar className="w-4 h-4 shrink-0" /> Next Service Date
                </label>
                <input 
                  type="date" 
                  className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none"
                  value={formData.next_service_date}
                  onChange={e => setFormData(p => ({...p, next_service_date: e.target.value}))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-7">
              <div className="space-y-2">
                <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                   <Info className="w-4 h-4 shrink-0" /> Type
                </label>
                <Select value={formData.vehicle_type} onValueChange={v => setFormData(p => ({...p, vehicle_type: v}))}>
                  <SelectTrigger className="h-11 min-h-[44px] w-full bg-muted border-none rounded-md px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner flex items-center justify-between">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-md border-border/40">
                    <SelectItem value="Car" className="font-bold tracking-tight">Car</SelectItem>
                    <SelectItem value="Bike" className="font-bold tracking-tight">Bike</SelectItem>
                    <SelectItem value="Scooter" className="font-bold tracking-tight">Scooter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                   <Fuel className="w-4 h-4 shrink-0" /> Fuel Type
                </label>
                <Select value={formData.fuel_type} onValueChange={v => setFormData(p => ({...p, fuel_type: v}))}>
                  <SelectTrigger className="h-11 min-h-[44px] w-full bg-muted border-none rounded-md px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner flex items-center justify-between">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-md border-border/40">
                    <SelectItem value="Petrol" className="font-bold tracking-tight">Petrol</SelectItem>
                    <SelectItem value="Diesel" className="font-bold tracking-tight">Diesel</SelectItem>
                    <SelectItem value="EV" className="font-bold tracking-tight">EV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-center pt-8">
              <SaveButton onClick={handleSave} isSaving={saving} label={editingId ? "Update Vehicle" : "Add Vehicle"} className="w-full max-w-xs h-12 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-muted" />
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-muted-foreground/60 tracking-[3px] py-2 flex items-center gap-2">
            <span className="w-8 h-px bg-border" /> My Fleet <span className="w-8 h-px bg-border" />
          </h3>
          {loading ? (
            [1,2].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-md" />)
          ) : vehicles.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground font-black italic">No vehicles added yet</div>
          ) : (
            vehicles.map(v => (
              <Card key={v.id} className="overflow-hidden border border-border/40 shadow-sm rounded-md group bg-card">
                <CardContent className="p-0 flex items-center">
                  <div className="w-16 h-24 bg-muted flex flex-col items-center justify-center shrink-0 border-r group-hover:bg-accent transition-colors">
                    <Car className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-[8px] font-black text-muted-foreground mt-2 tracking-tighter uppercase">{v.vehicle_type}</span>
                  </div>
                  <div className="flex-1 p-4 min-w-0">
                    <h4 className="font-black text-foreground tracking-tight truncate">{v.vehicle_name}</h4>
                    <p className="text-xs font-black text-muted-foreground/60 mt-1 uppercase tracking-widest">{v.registration_number}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-black uppercase tracking-widest">{v.fuel_type}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 p-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(v)} className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md">
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id, v.vehicle_name)} className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

