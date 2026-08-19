import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface PetActivity {
  title: string;
  detail: string;
  days: number | null;
}

interface PetGrooming {
  title: string;
  detail: string;
  days: number | null;
}

interface PetMedicalLog {
  title: string;
  formattedDate: string;
}

export interface Pet {
  id: string;
  name: string;
  breed?: string;
  weight?: number;
  age?: string;
  activity: PetActivity;
  grooming: PetGrooming;
  medical: PetMedicalLog[];
}

interface PetWellnessPanelProps {
  petsData: Pet[];
  activePetIndex: number;
  setActivePetIndex: (idx: number) => void;
}

export function PetWellnessPanel({
  petsData,
  activePetIndex,
  setActivePetIndex,
}: PetWellnessPanelProps) {
  if (petsData.length === 0) return null;

  return (
    <div className="bg-card rounded-md border border-border/40 shadow-zenith p-6 transition-all space-y-4">
      <div 
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 py-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onScroll={(e) => {
          const el = e.currentTarget;
          const idx = Math.round(el.scrollLeft / el.clientWidth);
          if (idx !== activePetIndex && idx >= 0 && idx < petsData.length) {
            setActivePetIndex(idx);
          }
        }}
      >
        {petsData.map((pet) => (
          <Link key={pet.id} href={`/pets/pets/${pet.id}`} className="min-w-full snap-center block space-y-4">
            {/* Pet Header Profile */}
            <div className="flex items-center justify-between pb-3 border-b border-border/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black">
                  {pet.name[0]}
                </div>
                <div>
                  <h4 className="font-black text-sm text-foreground">{pet.name} {pet.breed ? `(${pet.breed})` : ""}</h4>
                  <p className="text-[10px] text-muted-foreground font-bold">
                    {pet.weight ? `${pet.weight} kg` : ""} {pet.age ? `• ${pet.age}` : ""}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </div>

            {/* Activity Metric */}
            <div className="bg-muted/10 p-3.5 rounded-xl border border-border/20 flex justify-between items-center shadow-inner">
              <div>
                <span className="text-xs font-black block text-foreground">{pet.activity.title}</span>
                <span className="text-[10px] text-muted-foreground font-normal leading-normal">{pet.activity.detail}</span>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${pet.activity.days === null ? 'bg-muted text-muted-foreground/50' : pet.activity.days <= 1 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  {pet.activity.days === null ? 'Never' : pet.activity.days === 0 ? 'Today' : pet.activity.days === 1 ? '1 Day Ago' : `${pet.activity.days} Days Ago`}
                </span>
              </div>
            </div>

            {/* Grooming Metric */}
            <div className="bg-muted/10 p-3.5 rounded-xl border border-border/20 flex justify-between items-center shadow-inner">
              <div>
                <span className="text-xs font-black block text-foreground">{pet.grooming.title}</span>
                <span className="text-[10px] text-muted-foreground font-normal leading-normal">{pet.grooming.detail}</span>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${pet.grooming.days === null ? 'bg-muted text-muted-foreground/50' : pet.grooming.days <= 7 ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-500'}`}>
                  {pet.grooming.days === null ? 'Never' : pet.grooming.days === 0 ? 'Today' : pet.grooming.days === 1 ? '1 Day Ago' : `${pet.grooming.days} Days Ago`}
                </span>
              </div>
            </div>

            {/* Next 3 Medical Dates */}
            {pet.medical.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {pet.medical.map((med, i) => (
                  <div key={i} className="bg-muted/15 border border-border/20 p-2.5 rounded-lg text-center shadow-sm">
                    <span className="text-[8px] font-black text-muted-foreground/60 block truncate uppercase tracking-wider mb-0.5">{med.title}</span>
                    <span className="text-[10px] font-black text-rose-500">{med.formattedDate}</span>
                  </div>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-1.5 mt-2">
        {petsData.length > 1 && petsData.map((_, idx) => (
          <div 
            key={idx} 
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === activePetIndex ? 'bg-primary w-3' : 'bg-primary/20'}`} 
          />
        ))}
      </div>
    </div>
  );
}
