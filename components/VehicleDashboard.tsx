'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, Bike, Car, ChevronDown, ChevronUp, Clock, Droplets, Fuel, Gauge, IndianRupee, RefreshCw, ShieldAlert, ShieldCheck, ShieldX, TrendingUp, Truck, Wrench, Zap, Calendar, MapPin } from "lucide-react";
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

interface VehicleStats {
  id: string;
  vehicle_name: string;
  registration_number: string;
  vehicle_type: string;
  fuel_type: string;
  current_odometer: number;
  initial_odometer: number;
  ft_mileage: number | null;
  trip_mileage: number | null;
  lifetime_mileage: number | null;
  insurance_expiry: string | null;
  next_service_date: string | null;
  last_fuel_date: string | null;
  last_service_actual_date: string | null;
  total_fuel_spent: number;
  total_service_spent: number;
  total_spent: number;
  total_liters: number;
}

function getVehicleIcon(type: string) {
  if (type === 'Bike' || type === 'Scooter') return Bike;
  if (type === 'Truck') return Truck;
  return Car;
}

function getInsuranceStatus(expiry: string | null) {
  const now = new Date();
  if (!expiry) return { color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', icon: ShieldAlert, label: 'No Data', days: null, pill: 'bg-muted text-muted-foreground' };
  const days = differenceInDays(new Date(expiry), now);
  if (days < 0) return { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20', icon: ShieldX, label: 'Expired', days, pill: 'bg-destructive/10 text-destructive' };
  if (days < 30) return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: ShieldAlert, label: `${days}d left`, days, pill: 'bg-amber-500/10 text-amber-400' };
  return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: ShieldCheck, label: `${days}d left`, days, pill: 'bg-emerald-500/10 text-emerald-400' };
}

function getServiceStatus(date: string | null) {
  const now = new Date();
  if (!date) return { color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', label: 'Not Set', days: null, pill: 'bg-muted text-muted-foreground' };
  const days = differenceInDays(new Date(date), now);
  if (days < 0) return { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20', label: 'Overdue', days, pill: 'bg-destructive/10 text-destructive' };
  if (days < 14) return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: `${days}d away`, days, pill: 'bg-amber-500/10 text-amber-400' };
  return { color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', label: `${days}d away`, days, pill: 'bg-sky-500/10 text-sky-400' };
}

function StatCell({
  icon: Icon,
  label,
  value,
  iconColor,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  iconColor: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />
        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-sm font-black text-foreground leading-none">{value}</span>
      {sub && <span className="text-[9px] text-muted-foreground/60">{sub}</span>}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">{label}</span>
      <div className="flex-1 h-px bg-border/30" />
    </div>
  );
}

function VehicleCard({ v, idx }: { v: VehicleStats; idx: number }) {
  const [expanded, setExpanded] = useState(true);
  const VehicleIcon = getVehicleIcon(v.vehicle_type);
  const insurance = getInsuranceStatus(v.insurance_expiry);
  const service = getServiceStatus(v.next_service_date);
  const InsuranceIcon = insurance.icon;
  const distanceTraveled = v.current_odometer - v.initial_odometer;
  const costPerKm = distanceTraveled > 0 ? (v.total_spent / distanceTraveled).toFixed(1) : null;

  return (
    <div
      className="rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden group"
      style={{
        animation: `slideUp 0.4s ease both`,
        animationDelay: `${idx * 80}ms`,
      }}
    >
      {/* ── Card Header ── */}
      <div className="relative px-5 pt-5 pb-4 bg-gradient-to-br from-primary/5 via-card to-card border-b border-border/20 overflow-hidden">
        {/* Watermark */}
        <VehicleIcon className="absolute -right-5 -bottom-5 w-32 h-32 text-primary/4 rotate-6 pointer-events-none select-none" />

        <div className="flex items-start justify-between relative z-10">
          {/* Icon + Name */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
              <VehicleIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black text-foreground tracking-tight capitalize leading-none">{v.vehicle_name}</h2>
              <p className="text-[10px] font-semibold text-muted-foreground/60 tracking-[2px] uppercase mt-1">{v.registration_number}</p>
            </div>
          </div>

          {/* Type + Fuel badges stacked */}
          <div className="flex flex-col items-end gap-1 shrink-0 mx-2">
            <span className="text-[8px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/40">{v.vehicle_type}</span>
            <span className="text-[8px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/40">{v.fuel_type}</span>
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-2 rounded-lg bg-muted/50 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted transition-all shrink-0"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Odometer + Efficiency strip */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/20 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-black text-foreground">{v.current_odometer.toLocaleString()} km</span>
            <span className="text-[9px] text-muted-foreground/50 font-semibold">odometer</span>
          </div>
          <div className="w-px h-3 bg-border/40" />
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-violet-400" />
            <span className="text-xs font-black text-foreground">{v.lifetime_mileage ? `${v.lifetime_mileage} km/L` : '--'}</span>
            <span className="text-[9px] text-muted-foreground/50 font-semibold">efficiency</span>
          </div>
          {costPerKm && (
            <>
              <div className="w-px h-3 bg-border/40" />
              <div className="flex items-center gap-1.5">
                <IndianRupee className="w-3 h-3 text-emerald-400" />
                <span className="text-xs font-black text-foreground">₹{costPerKm}/km</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Collapsible Body ── */}
      <div
        className="overflow-hidden transition-all-out"
        style={{ maxHeight: expanded ? '1000px' : '0px', opacity: expanded ? 1 : 0 }}
      >
        <div className="px-5 py-4 space-y-4">

          {/* Fuel Efficiency */}
          <div className="space-y-2">
            <SectionDivider label="Fuel Efficiency" />
            <div className="grid grid-cols-3 gap-2">
              <StatCell
                icon={Zap}
                label="Full Tank"
                value={v.ft_mileage ? `${v.ft_mileage} km/L` : '--'}
                iconColor="text-sky-400"
              />
              <StatCell
                icon={Activity}
                label="Trip"
                value={v.trip_mileage ? `${v.trip_mileage} km/L` : '--'}
                iconColor="text-emerald-400"
              />
              <StatCell
                icon={TrendingUp}
                label="Lifetime"
                value={v.lifetime_mileage ? `${v.lifetime_mileage} km/L` : '--'}
                iconColor="text-violet-400"
              />
            </div>
          </div>

          {/* Spending */}
          <div className="space-y-2">
            <SectionDivider label="Spending" />
            <div className="grid grid-cols-3 gap-2">
              <StatCell
                icon={Fuel}
                label="Fuel Cost"
                value={`₹${v.total_fuel_spent.toLocaleString()}`}
                iconColor="text-primary"
              />
              <StatCell
                icon={Wrench}
                label="Service"
                value={`₹${v.total_service_spent.toLocaleString()}`}
                iconColor="text-amber-400"
              />
              <StatCell
                icon={IndianRupee}
                label="Total Spent"
                value={`₹${v.total_spent.toLocaleString()}`}
                iconColor="text-violet-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatCell
                icon={Droplets}
                label="Total Fuel"
                value={`${v.total_liters.toFixed(1)} L`}
                iconColor="text-sky-400"
              />
              {costPerKm && (
                <StatCell
                  icon={TrendingUp}
                  label="Cost / km"
                  value={`₹${costPerKm}`}
                  iconColor="text-emerald-400"
                />
              )}
            </div>
          </div>

          {/* Last Activity */}
          <div className="space-y-2">
            <SectionDivider label="Last Activity" />
            <div className="grid grid-cols-2 gap-2">
              <StatCell
                icon={Fuel}
                label="Last Fuel"
                value={v.last_fuel_date ? format(new Date(v.last_fuel_date), 'dd MMM yyyy') : '--'}
                iconColor="text-primary"
                sub={v.last_fuel_date ? `${differenceInDays(new Date(), new Date(v.last_fuel_date))}d ago` : undefined}
              />
              <StatCell
                icon={Wrench}
                label="Last Service"
                value={v.last_service_actual_date ? format(new Date(v.last_service_actual_date), 'dd MMM yyyy') : '--'}
                iconColor="text-amber-400"
                sub={v.last_service_actual_date ? `${differenceInDays(new Date(), new Date(v.last_service_actual_date))}d ago` : undefined}
              />
            </div>
          </div>

          {/* Compliance */}
          <div className="space-y-2">
            <SectionDivider label="Compliance" />
            <div className="grid grid-cols-2 gap-2">

              {/* Insurance */}
              <div className={`rounded-xl border p-3 ${insurance.bg} ${insurance.border} transition-colors`}>
                <div className="flex items-center gap-2 mb-2">
                  <InsuranceIcon className={`w-4 h-4 shrink-0 ${insurance.color}`} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Insurance</span>
                </div>
                <span className={`text-sm font-black ${insurance.color}`}>{insurance.label}</span>
                {v.insurance_expiry && (
                  <p className="text-[9px] text-muted-foreground/50 font-semibold mt-0.5">
                    {format(new Date(v.insurance_expiry), 'dd MMM yyyy')}
                  </p>
                )}
              </div>

              {/* Next Service */}
              <div className={`rounded-xl border p-3 ${service.bg} ${service.border} transition-colors`}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className={`w-4 h-4 shrink-0 ${service.color}`} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Next Service</span>
                </div>
                <span className={`text-sm font-black ${service.color}`}>{service.label}</span>
                {v.next_service_date && (
                  <p className="text-[9px] text-muted-foreground/50 font-semibold mt-0.5">
                    {format(new Date(v.next_service_date), 'dd MMM yyyy')}
                  </p>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>

    </div>
  );
}



export function VehicleDashboard() {

  const [stats, setStats] = useState<VehicleStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalFleetSpend, setTotalFleetSpend] = useState(0);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data: vehicles, error: vError } = await supabase.from('vehicle_config').select('*');
      if (vError) throw vError;

      const [{ data: allFuelLogsRaw }, { data: allServiceLogsRaw }] = await Promise.all([
        supabase.from('vehicle_fuel_logs').select('vehicle_id, odometer, mileage, full_tank_mileage, liters, amount, date'),
        supabase.from('vehicle_service_logs').select('vehicle_id, odometer, date, amount'),
      ]);

      const results: VehicleStats[] = [];

      for (const v of vehicles) {
        const fuelLogs = allFuelLogsRaw
          ?.filter(l => l.vehicle_id === v.id)
          .sort((a, b) => b.odometer - a.odometer) || [];
        const serviceLogs = allServiceLogsRaw
          ?.filter(l => l.vehicle_id === v.id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];

        const maxOdo = Math.max(...(fuelLogs.map(l => l.odometer)), ...(serviceLogs.map(l => l.odometer)), v.initial_odometer || 0);
        const validFuelLogs = fuelLogs.filter(l => l.odometer > (v.initial_odometer || 0));
        const totalLiters = validFuelLogs.reduce((acc, curr) => acc + (curr.liters || 0), 0) || 0;
        const totalDist = maxOdo - (v.initial_odometer || 0);
        const lifetimeMil = totalDist > 0 && totalLiters > 0 ? totalDist / totalLiters : 0;
        const latestFTLog = fuelLogs.find(l => (l.full_tank_mileage || 0) > 0);
        const latestTripLog = fuelLogs[0];
        const totalFuel = fuelLogs.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
        const totalService = serviceLogs.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

        results.push({
          id: v.id,
          vehicle_name: v.vehicle_name,
          registration_number: v.registration_number,
          vehicle_type: v.vehicle_type,
          fuel_type: v.fuel_type,
          current_odometer: maxOdo,
          initial_odometer: v.initial_odometer || 0,
          ft_mileage: latestFTLog ? parseFloat(latestFTLog.full_tank_mileage.toFixed(2)) : null,
          trip_mileage: latestTripLog ? parseFloat((latestTripLog.mileage || 0).toFixed(2)) : null,
          lifetime_mileage: lifetimeMil > 0 ? parseFloat(lifetimeMil.toFixed(2)) : null,
          insurance_expiry: v.insurance_expiry,
          next_service_date: v.next_service_date,
          last_fuel_date: fuelLogs[0]?.date || null,
          last_service_actual_date: serviceLogs[0]?.date || null,
          total_fuel_spent: totalFuel,
          total_service_spent: totalService,
          total_spent: totalFuel + totalService,
          total_liters: totalLiters,
        });
      }

      setStats(results);
      setTotalFleetSpend(results.reduce((s, v) => s + v.total_spent, 0));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load vehicle stats');
    } finally {
      setLoading(false);
    }
  };



  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="w-full mb-6">
        <div className="flex justify-end items-center mb-6 mt-6">
          <div className="flex items-center gap-4">
            <div className="text-[10px] text-muted-foreground/60 font-semibold tracking-widest bg-muted/40 px-3 py-1.5 rounded-lg border border-border/40">
              {stats.length} vehicle{stats.length !== 1 ? 's' : ''} · ₹{totalFleetSpend.toLocaleString()} total
            </div>
            <button
              onClick={fetchStats}
              className="p-2 bg-card rounded-xl shadow-sm text-muted-foreground/60 hover:text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center shrink-0"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="w-full space-y-4">
          {/* Fleet Summary Strip */}
          {!loading && stats.length > 0 && (
            <div
              className="grid grid-cols-3 gap-2"
              style={{ animation: 'slideUp 0.35s ease both' }}
            >
              {[
                { icon: Fuel, label: 'Fuel Cost', value: `₹${stats.reduce((s, v) => s + v.total_fuel_spent, 0).toLocaleString()}`, color: 'text-primary' },
                { icon: Wrench, label: 'Service Cost', value: `₹${stats.reduce((s, v) => s + v.total_service_spent, 0).toLocaleString()}`, color: 'text-amber-400' },
                { icon: IndianRupee, label: 'Total Fleet', value: `₹${totalFleetSpend.toLocaleString()}`, color: 'text-violet-400' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-card rounded-2xl border border-border/40 p-3 text-center shadow-sm">
                  <Icon className={`w-4 h-4 ${color} mx-auto mb-1.5`} />
                  <div className="text-[8px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-0.5">{label}</div>
                  <div className="text-xs font-black text-foreground">{value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Vehicle Cards */}
          {loading ? (
            [1, 2].map(i => (
              <div key={i} className="h-72 rounded-2xl bg-muted/30 animate-pulse border border-border/20" />
            ))
          ) : stats.length === 0 ? (
            <div className="text-center py-24 space-y-3">
              <Car className="w-16 h-16 text-muted-foreground/20 mx-auto" />
              <p className="text-muted-foreground/50 font-black text-sm">No vehicles in your fleet yet.</p>
            </div>
          ) : (
            stats.map((v, idx) => (
              <VehicleCard key={v.id} v={v} idx={idx} />
            ))
          )}
        </div>
      </div>
    </>
  );
}
