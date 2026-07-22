'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Calendar, CreditCard, Gauge, RefreshCw, Save , BarChart2, Clock, Store, FileText, Wrench } from "lucide-react";
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
import { SearchableSelect } from '@/components/SearchableSelect';

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
    time: format(new Date(), 'HH:mm'),
    odometer: '',
    amount: '',
    service_center: '',
    details: '',
    notes: '',
    next_service_date: '',
  });
  
  const [mileageData, setMileageData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    odometer: '',
    notes: ''
  });

  const [serviceOptions, setServiceOptions] = useState({
    service_centers: [] as string[],
    details: [] as string[]
  });

  useEffect(() => {
    fetchVehicles();
    fetchServiceOptions();
  }, []);

  const fetchServiceOptions = async () => {
    try {
      const { data } = await supabase
        .from('vehicle_service_logs')
        .select('service_center, details')
        .order('id', { ascending: false });
      if (data) {
        const centers = Array.from(new Set(data.map(d => d.service_center).filter(Boolean)));
        const detailsList = Array.from(new Set(data.map(d => d.details).filter(Boolean)));
        setServiceOptions({
          service_centers: centers,
          details: detailsList
        });
      }
    } catch (e) {
      console.error('Failed to load service options:', e);
    }
  };

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
      setServiceData({ ...serviceData, odometer: '', amount: '', service_center: '', details: '', notes: '', next_service_date: '', time: format(new Date(), 'HH:mm') });
      fetchServiceOptions();
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
      <div className="max-w-lg mx-auto w-full p-4 md:p-6 pt-6 md:pt-6">
        <PageHeader title="Service"  >
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
          <SectionNav tabs={VEHICLE_TABS} activePath="/vehicles/service" />
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
                     <div className="grid grid-cols-2 gap-7">
                        <div className="space-y-2">
                           <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                              <Calendar className="w-4 h-4 shrink-0" /> Date
                           </label>
                           <input 
                              type="date" 
                              value={serviceData.date} 
                              onChange={e => setServiceData(p =>({...p, date: e.target.value}))} 
                              className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none" 
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                              <Clock className="w-4 h-4 shrink-0" /> Time
                           </label>
                           <input 
                              type="time" 
                              value={serviceData.time} 
                              onChange={e => setServiceData(p =>({...p, time: e.target.value}))} 
                              className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none" 
                           />
                        </div>
                     </div>
  
                     <div className="grid grid-cols-2 gap-7">
                        <div className="space-y-2">
                           <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                              <Gauge className="w-4 h-4 shrink-0" /> Odometer
                           </label>
                           <input 
                              type="number" 
                              inputMode="numeric" 
                              pattern="[0-9]*" 
                              placeholder="Readings" 
                              value={serviceData.odometer} 
                              onChange={e => setServiceData(p =>({...p, odometer: e.target.value}))} 
                              className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none" 
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                              <CreditCard className="w-4 h-4 shrink-0" /> Total Paid
                           </label>
                           <input 
                              type="number" 
                              step="0.01" 
                              inputMode="decimal" 
                              placeholder="Service Amount" 
                              value={serviceData.amount} 
                              onChange={e => setServiceData(p =>({...p, amount: e.target.value}))} 
                              className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none" 
                           />
                        </div>
                     </div>
 
                     <div className="grid grid-cols-2 gap-7 relative z-30">
                       <div className="space-y-1">
                          <SearchableSelect 
                            label="Service Center"
                            value={serviceData.service_center}
                            onChange={val => setServiceData(p =>({...p, service_center: val}))}
                            options={serviceOptions.service_centers}
                            placeholder="Select or Type Center"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none mb-1">
                             <Calendar className="w-4 h-4 shrink-0" /> Next Service Date
                          </label>
                          <input 
                             type="date" 
                             value={serviceData.next_service_date} 
                             onChange={e => setServiceData(p =>({...p, next_service_date: e.target.value}))} 
                             className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none" 
                          />
                       </div>
                     </div>
 
                     <div className="space-y-1 relative z-20">
                        <SearchableSelect 
                          label="Work Details"
                          value={serviceData.details}
                          onChange={val => setServiceData(p =>({...p, details: val}))}
                          options={serviceOptions.details}
                          placeholder="Select or Type Work"
                        />
                     </div>
 
                     <div className="space-y-2">
                        <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
                           <FileText className="w-4 h-4 shrink-0" /> Notes
                        </label>
                        <input 
                          type="text"
                          placeholder="Enter service notes or extra details..." 
                          value={serviceData.notes} 
                          onChange={e => setServiceData(p =>({...p, notes: e.target.value}))} 
                          className="w-full h-11 min-h-[44px] bg-muted border-none rounded-md px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner appearance-none" 
                        />
                     </div>
 
                     <div className="flex justify-center pt-8">
                      <SaveButton onClick={handleServiceSave} isSaving={saving} label="Save Service Log" className="w-full max-w-xs h-12 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-muted" />
                  </div>
                 </CardContent>
             </Card>

          
        </div>
      </div>
      </div>
    </div>
  );
}

