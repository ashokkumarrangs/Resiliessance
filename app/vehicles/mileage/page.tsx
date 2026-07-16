'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Calendar, CreditCard, Gauge, RefreshCw, Save , BarChart2 } from "lucide-react";
import { format } from 'date-fns';
import { PageHeader } from "@/components/PageHeader";
import { SaveButton } from "@/components/ui/SaveButton";
import { SubNav } from "@/components/SubNav";
import { SectionNav } from "@/components/SectionNav";
import { VEHICLE_TABS } from "@/lib/navigation";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  initial_odometer: number;
}

export default function VehicleFuelServicePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form States
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [activeTab, setActiveTab] = useState('Log Fuel');

  const [fuelData, setFuelData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    odometer: '',
    liters: '',
    amount: '',
    station: '',
    full_tank: true,
  });

  const [serviceData, setServiceData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    odometer: '',
    amount: '',
    service_center: '',
    details: '',
    next_service_date: '',
  });
  
  const [mileageData, setMileageData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    odometer: '',
    notes: ''
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('vehicle_config').select('id, vehicle_name, registration_number, initial_odometer').order('vehicle_name');
      if (error) throw error;
      setVehicles(data || []);
      if (data && data.length > 0) setSelectedVehicle(data[0].id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleFuelSave = async () => {
    if (!selectedVehicle || !fuelData.odometer || !fuelData.liters || !fuelData.amount) {
      toast.error('Please fill all mandatory fuel fields');
      return;
    }
    setSaving(true);
    try {
      // 1. Get previous log and total history for calculations
      const [{ data: lastLog }, { data: allFuelLogs }] = await Promise.all([
        supabase
          .from('vehicle_fuel_logs')
          .select('odometer, full_tank')
          .eq('vehicle_id', selectedVehicle)
          .order('odometer', { ascending: false })
          .limit(1),
        supabase
          .from('vehicle_fuel_logs')
          .select('odometer, liters, full_tank')
          .eq('vehicle_id', selectedVehicle)
          .order('odometer', { ascending: false })
      ]);

      const vehicle = vehicles.find(v => v.id === selectedVehicle);
      const initialOdo = vehicle?.initial_odometer || 0;
      const currentOdo = parseFloat(fuelData.odometer);
      const currentLiters = parseFloat(fuelData.liters);

      // A. Reserve Mileage (Trip-to-Trip)
      const prevOdo = lastLog && lastLog.length > 0 ? lastLog[0].odometer : initialOdo;
      const tripDistance = currentOdo - prevOdo;
      const reserveMileage = tripDistance > 0 ? (tripDistance / currentLiters).toFixed(2) : 0;

      // B. Full Tank Mileage (Tank-to-Tank Cycle)
      let ftMileage = null;
      if (fuelData.full_tank) {
        const lastFT = allFuelLogs?.find(l => l.full_tank === true);
        if (lastFT) {
          const ftDistance = currentOdo - lastFT.odometer;
          // Sum liters since last full tank
          const intermediateLogs = allFuelLogs?.filter(l => l.odometer > lastFT.odometer) || [];
          const totalLitersInCycle = intermediateLogs.reduce((sum, l) => sum + (l.liters || 0), 0) + currentLiters;
          ftMileage = ftDistance > 0 ? (ftDistance / totalLitersInCycle).toFixed(2) : 0;
        } else {
          // If this is the first full tank, use initial odo
          const ftDistance = currentOdo - initialOdo;
          const totalLitersInCycle = (allFuelLogs?.reduce((sum, l) => sum + (l.liters || 0), 0) || 0) + currentLiters;
          ftMileage = ftDistance > 0 ? (ftDistance / totalLitersInCycle).toFixed(2) : 0;
        }
      }

      const { error } = await supabase.from('vehicle_fuel_logs').insert([{
        vehicle_id: selectedVehicle,
        ...fuelData,
        odometer: currentOdo,
        liters: currentLiters,
        amount: parseFloat(fuelData.amount),
        mileage: parseFloat(String(reserveMileage)),
        full_tank_mileage: ftMileage ? parseFloat(String(ftMileage)) : null
      }]);

      if (error) throw error;
      toast.success('Fuel log saved successfully!');
      setFuelData({ ...fuelData, odometer: '', liters: '', amount: '', station: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to save fuel log');
    } finally {
      setSaving(false);
    }
  };

  const handleServiceSave = async () => {
    if (!selectedVehicle || !serviceData.odometer || !serviceData.amount) {
      toast.error('Please fill odometer and amount');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('vehicle_service_logs').insert([{
        vehicle_id: selectedVehicle,
        ...serviceData,
        odometer: parseFloat(serviceData.odometer),
        amount: parseFloat(serviceData.amount)
      }]);

      if (error) throw error;

      // Update vehicle master with next service date
      if (serviceData.next_service_date) {
        await supabase.from('vehicle_config').update({ next_service_date: serviceData.next_service_date }).eq('id', selectedVehicle);
      }

      toast.success('Service log saved successfully!');
      setServiceData({ ...serviceData, odometer: '', amount: '', service_center: '', details: '', next_service_date: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to save service log');
    } finally {
      setSaving(false);
    }
  };

  const handleMileageSave = async () => {
    if (!selectedVehicle || !mileageData.odometer) {
      toast.error('Please enter odometer reading');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('vehicle_mileage_logs').insert([{
        vehicle_id: selectedVehicle,
        ...mileageData,
        odometer: parseFloat(mileageData.odometer)
      }]);
      if (error) throw error;
      toast.success('Mileage log saved successfully!');
      setMileageData({ ...mileageData, odometer: '', notes: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to save mileage log');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        <PageHeader title="Mileage"  >
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
          <SectionNav tabs={VEHICLE_TABS} activePath="/vehicles/mileage" />
        </div>


        
        <div className="mt-6 w-full">
        {/* Vehicle Selection */}
        
        {/* Vehicle Switcher */}
        {loading ? (
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


        <div className="w-full space-y-6">
          

          

          
             <Card className="rounded-md border border-white/20 shadow-zenith overflow-hidden bg-card">

                 <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground/40 uppercase flex items-center gap-1"><Calendar className="w-3 h-3" /> Date</label>
                          <Input type="date" value={mileageData.date} onChange={e => setMileageData(p =>({...p, date: e.target.value}))} className="h-12 rounded-md border border-border bg-muted/30 font-bold" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground/40 uppercase flex items-center gap-1"><Gauge className="w-3 h-3" /> Odometer</label>
                          <Input type="number" placeholder="Readings" value={mileageData.odometer} onChange={e => setMileageData(p =>({...p, odometer: e.target.value}))} className="h-12 rounded-md border border-border bg-muted/30 font-bold text-center" />
                       </div>
                    </div>
 
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest px-1">Notes</label>
                       <textarea 
                         className="w-full rounded-md border border-border bg-muted/30 font-bold p-4 min-h-24 outline-none focus:ring-2 ring-primary/10 text-foreground shadow-inner"
                         placeholder="Trip to city, casual drive, etc."
                         value={mileageData.notes}
                         onChange={e => setMileageData(p =>({...p, notes: e.target.value}))}
                       />
                    </div>
 
                    <div className="flex justify-center pt-8">
                     <SaveButton onClick={handleMileageSave} isSaving={saving} label="Save Mileage Log" className="w-full max-w-xs h-12 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-muted" />
                  </div>
                 </CardContent>
             </Card>
        </div>
      </div>
      </div>
    </div>
  );
}

