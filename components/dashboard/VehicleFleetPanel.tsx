import React from 'react';
import Link from 'next/link';
import { Car } from 'lucide-react';
import { format } from 'date-fns';

interface VehicleReminder {
  name: string;
  type: 'ok' | 'warn' | 'error';
  lifetimeMileage: number | null;
  totalSpent: number;
  costPerKm: number | null;
  insuranceDays: number | null;
  insuranceExpiry: string | null;
  serviceDays: number | null;
  serviceDate: string | null;
  lastFuelDate: string | null;
  lastServiceDate: string | null;
}

interface VehicleFleetPanelProps {
  vehicleReminders: VehicleReminder[];
  activeVehicleIndex: number;
  setActiveVehicleIndex: (idx: number) => void;
}

export function VehicleFleetPanel({
  vehicleReminders,
  activeVehicleIndex,
  setActiveVehicleIndex,
}: VehicleFleetPanelProps) {
  return (
    <div className="bg-card rounded-md border border-border shadow-sm p-7 flex flex-col justify-between group hover:scale-[1.01] transition-all min-h-[220px]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-black text-muted-foreground tracking-wider flex items-center gap-2">
          <Car size={16} className="text-accent" /> Vehicles
        </div>
        <span className="text-[10px] font-black text-primary">{vehicleReminders.length} Active</span>
      </div>
      
      <div 
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 py-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onScroll={(e) => {
          const el = e.currentTarget;
          const idx = Math.round(el.scrollLeft / el.clientWidth);
          if (idx !== activeVehicleIndex && idx >= 0 && idx < vehicleReminders.length) {
            setActiveVehicleIndex(idx);
          }
        }}
      >
        {vehicleReminders.length > 0 ? (
          vehicleReminders.map((v, i) => (
            <Link key={i} href="/vehicles/fuel" className="min-w-full snap-center block flex flex-col justify-center space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-foreground capitalize truncate max-w-[120px]">{v.name}</span>
                {v.lifetimeMileage !== null && (
                  <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {v.lifetimeMileage} km/L
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-muted/10 border border-border/10 rounded-lg p-2.5 flex flex-col">
                  <span className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">Insurance</span>
                  <span className={`text-xs font-black ${v.insuranceDays === null ? 'text-muted-foreground' : v.insuranceDays < 0 ? 'text-rose-500' : v.insuranceDays < 30 ? 'text-amber-500' : 'text-foreground'}`}>
                    {v.insuranceDays === null ? 'N/A' : `${v.insuranceDays}d`}
                  </span>
                </div>
                <div className="bg-muted/10 border border-border/10 rounded-lg p-2.5 flex flex-col">
                  <span className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">Service</span>
                  <span className={`text-xs font-black ${v.serviceDays === null ? 'text-muted-foreground' : v.serviceDays < 0 ? 'text-rose-500' : v.serviceDays < 14 ? 'text-amber-500' : 'text-foreground'}`}>
                    {v.serviceDays === null ? 'N/A' : `${v.serviceDays}d`}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-muted-foreground border-t border-border/10 pt-2">
                <div>
                  <span className="block text-[8px] font-black uppercase text-muted-foreground/50">Last Service</span>
                  <span className="font-bold text-foreground">{v.lastServiceDate ? format(new Date(v.lastServiceDate), "d MMM yyyy") : "Never"}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[8px] font-black uppercase text-muted-foreground/50">Cost / km</span>
                  <span className="font-bold text-foreground">{v.costPerKm !== null ? `₹${v.costPerKm}` : "N/A"}</span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="min-w-full text-xs font-bold text-muted-foreground/30 py-2 text-center snap-center">No vehicles registered</div>
        )}
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-1.5 mt-2">
        {vehicleReminders.length > 1 && vehicleReminders.map((_, idx) => (
          <div 
            key={idx} 
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === activeVehicleIndex ? 'bg-primary w-3' : 'bg-primary/20'}`} 
          />
        ))}
      </div>
    </div>
  );
}
