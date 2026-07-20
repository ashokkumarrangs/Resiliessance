"use client";
import React, { useState, useEffect, use } from "react";
import { PageHeader } from "@/components/PageHeader";
import { SectionNav } from "@/components/SectionNav";
import { PET_TABS } from "@/lib/navigation";
import { SubNav } from "@/components/SubNav";
import { supabase } from "@/lib/supabase";
import { format, differenceInYears, differenceInMonths } from "date-fns";
import { Dog, PlusCircle, Activity, Sparkles, Trees, Shield, GraduationCap, Trash2, BarChart2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SearchableSelect } from "@/components/SearchableSelect";
const DEFAULT_CATEGORIES: Record<string, string[]> = {
  Grooming: ['Bath', 'Nail Trim', 'Teeth Brushing', 'Ear Cleaning', 'Haircut', 'Coat Brushing'],
  Activities: ['Beach Trip', 'Park Visit', 'Hike', 'Playdate', 'Swimming', 'Long Car Ride', 'Time Apart'],
  Wellness: ['Flea/Tick Meds', 'Heartworm Meds', 'Vomit / Upset Stomach', 'Vaccination', 'Deworming', 'Checkup'],
  Training: ['Training Session', 'Behavioral Incident', 'Separation Training']
};

export default function PetDashboard({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: petId } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [petData, setPetData] = useState<any>(null);
  const [logsData, setLogsData] = useState<any[]>([]);
  const [allPets, setAllPets] = useState<any[]>([]);

  // Entry Form State
  const [entryCategory, setEntryCategory] = useState("Grooming");
  const [entrySubCategory, setEntrySubCategory] = useState("");
  const [entryDate, setEntryDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [entryTime, setEntryTime] = useState(format(new Date(), "HH:mm"));
  const [entryNotes, setEntryNotes] = useState("");
  const [entryNextDate, setEntryNextDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Dynamic Options state
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, string[]>>(DEFAULT_CATEGORIES);

  useEffect(() => {
    if (petId) fetchDashboardData();
  }, [petId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: profile, error: profileErr } = await supabase.from('pet_profile').select('*').eq('id', petId).single();
      if (profileErr || !profile) {
        toast.error("Pet not found");
        router.push("/pets");
        return;
      }
      setPetData(profile);

      const { data: petLogs } = await supabase.from('pet_logs').select('*').eq('pet_id', petId).order('date', { ascending: false });
      const { data: allPetsData } = await supabase.from('pet_profile').select('*');
      if (allPetsData) setAllPets(allPetsData);
      if (petLogs) {
        setLogsData(petLogs);
        
        // Build dynamic options from past logs
        const newOptions = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
        petLogs.forEach((log: any) => {
           if (log.category && log.log_type) {
              if (!newOptions[log.category]) newOptions[log.category] = [];
              if (!newOptions[log.category].includes(log.log_type)) {
                 newOptions[log.category].push(log.log_type);
              }
           }
        });
        setDynamicOptions(newOptions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dobString: string) => {
    if (!dobString) return "Unknown Age";
    const dob = new Date(dobString);
    const today = new Date();
    const years = differenceInYears(today, dob);
    const months = differenceInMonths(today, dob) % 12;
    if (years === 0) return `${months} Months`;
    return `${years} Years, ${months} Months`;
  };

  const handleUnifiedSubmit = async () => {
    if (!entryCategory || !entrySubCategory || !entryDate) {
      toast.error("Category, Subcategory, and Date are required!");
      return;
    }
    
    setIsSubmitting(true);
    try {
       const payload: any = {
          pet_id: petId,
          category: entryCategory,
          log_type: entrySubCategory,
          date: entryDate,
          time: entryTime,
          notes: entryNotes,
       };

       if (entryCategory === 'Wellness' && entryNextDate) {
          payload.next_due_date = entryNextDate;
       }

       const { error } = await supabase.from('pet_logs').insert(payload);
       if (error) {
          toast.error("Failed to insert log. Did you run the SQL script to add category?");
          return;
       }
       toast.success("Entry logged successfully!");
       
       // Reset form
       setEntrySubCategory("");
       setEntryNotes("");
       setEntryNextDate("");
       setEntryTime(format(new Date(), "HH:mm"));

       fetchDashboardData();
    } catch (e) {
       toast.error("An error occurred");
    } finally {
       setIsSubmitting(false);
    }
  };

  const handleDeletePet = async () => {
    if (window.confirm("Are you sure you want to delete this pet? This action cannot be undone.")) {
      const { error } = await supabase.from('pet_profile').delete().eq('id', petId);
      if (error) {
        toast.error("Failed to delete pet.");
      } else {
        toast.success("Pet deleted.");
        router.push("/pets");
      }
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (window.confirm("Delete this log entry?")) {
      const { error } = await supabase.from('pet_logs').delete().eq('id', logId);
      if (error) {
        toast.error("Failed to delete log.");
      } else {
        toast.success("Log deleted.");
        fetchDashboardData();
      }
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-black animate-pulse">LOADING PROFILE...</div>;
  if (!petData) return null;

  const currentOptions = dynamicOptions[entryCategory] || [];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        <PageHeader title={petData.name}>
          <div className="flex items-center gap-2">
            <Link 
              href="/reports/pets" 
              className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-muted-foreground/60 hover:text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
              title="View Reports"
            >
              <BarChart2 className="w-4 h-4 md:w-[18px] md:h-[18px]" />
            </Link>
          </div>
        </PageHeader>
        <div className="-mt-2 mb-6">
          <SectionNav tabs={PET_TABS} activePath="/pets" />
        </div>
        
        <div className="flex items-center justify-center relative mb-6 w-full">
          <SubNav 
            items={allPets.map(p => p.name)}
            activeItem={petData.name}
            onChange={(val) => {
              const p = allPets.find(x => x.name === val);
              if (p) router.push(`/pets/${p.id}`);
            }}
            className="!mb-0 !mx-0"
          />
        </div>
        
        <div className="space-y-6 w-full">
          {/* Profile Card */}
          <div className="bg-gradient-to-r from-amber-500/90 to-orange-500/90 rounded-3xl p-6 text-white shadow-xl flex items-center gap-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
             <div className="absolute bottom-0 left-10 w-24 h-24 bg-black/10 rounded-full -mb-10 blur-lg"></div>
             <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full border-4 border-white/30 flex items-center justify-center shrink-0 shadow-inner z-10">
               {petData.species === 'Cat' ? <Activity size={40} className="text-white"/> : <Dog size={40} className="text-white" />}
             </div>
             <div className="z-10 flex-1">
               <h2 className="text-3xl font-black mb-1 drop-shadow-md">{petData.name}</h2>
               <p className="font-bold text-white/90 text-sm tracking-wide uppercase">{petData.breed || petData.species}</p>
               <p className="text-sm font-semibold mt-1 bg-black/20 inline-block px-3 py-1 rounded-full">{calculateAge(petData.dob)}</p>
             </div>
             <button onClick={handleDeletePet} className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all" title="Delete Pet">
               <Trash2 size={16} />
             </button>
          </div>

          {/* UNIFIED ENTRY CARD */}
          <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
             <div className="flex items-center gap-2 mb-6">
                <PlusCircle className="text-primary" size={24} />
                <h3 className="text-2xl font-black">New Log Entry</h3>
             </div>

             <div className="space-y-5 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Category</label>
                    <div className="relative">
                      <select 
                        value={entryCategory} 
                        onChange={e => { setEntryCategory(e.target.value); setEntrySubCategory(""); }} 
                        className="w-full bg-muted p-3.5 pr-10 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none shadow-sm"
                      >
                        <option value="Grooming">Grooming</option>
                        <option value="Activities">Activities</option>
                        <option value="Wellness">Wellness</option>
                        <option value="Training">Training</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                         <Activity size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
                        {entryCategory === 'Wellness' ? 'Event / Administered Date' : 'Date'}
                      </label>
                      <input 
                         type="date" 
                         value={entryDate} 
                         onChange={e => setEntryDate(e.target.value)} 
                         className="w-full bg-muted p-3.5 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm" 
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Time</label>
                      <input 
                         type="time" 
                         value={entryTime} 
                         onChange={e => setEntryTime(e.target.value)} 
                         className="w-full bg-muted p-3.5 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm" 
                      />
                    </div>
                  </div>
                </div>

                {/* Subcategory (Creatable) */}
                <div className="bg-background rounded-xl p-1 border shadow-sm">
                   <SearchableSelect
                      label="Subcategory / Log Type"
                      hideLabel
                      options={currentOptions}
                      value={entrySubCategory}
                      onChange={setEntrySubCategory}
                      placeholder={`Select or type new ${entryCategory} log...`}
                      createLabel="Create new: {search}"
                   />
                </div>

                {/* Next Planned Date (Conditional) */}
                {entryCategory === 'Wellness' && (
                  <div className="animate-in slide-in-from-top-2 fade-in bg-rose-500/5 p-4 rounded-xl border border-rose-500/10">
                    <label className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                       <Shield size={12} /> Next Due / Planned Date
                    </label>
                    <input 
                       type="date" 
                       value={entryNextDate} 
                       onChange={e => setEntryNextDate(e.target.value)} 
                       className="w-full bg-card p-3 rounded-xl font-bold focus:outline-none border shadow-sm focus:border-rose-500/50" 
                    />
                    <p className="text-[10px] text-muted-foreground mt-2 font-semibold">Leave blank if this was a one-time event (like an upset stomach).</p>
                  </div>
                )}

                {/* Notes */}
                <div>
                   <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Notes (Optional)</label>
                   <textarea 
                     value={entryNotes} 
                     onChange={e => setEntryNotes(e.target.value)} 
                     placeholder="How did they do? Any details to remember?" 
                     className="w-full bg-muted p-4 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm min-h-[100px]"
                   />
                </div>

                <button 
                  onClick={handleUnifiedSubmit} 
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground p-4 rounded-xl font-black uppercase tracking-widest shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? "Saving..." : "Save Entry"}
                </button>
             </div>
          </div>
          
          {/* Recent History Preview */}
          <div className="px-2">
             <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-widest mb-4">Recent Entries</h4>
             {logsData.slice(0, 5).map((log: any) => (
                <div key={log.id} className="flex items-center gap-4 mb-3 bg-card p-3 rounded-2xl border shadow-sm">
                   <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                      {log.category === 'Grooming' && <Sparkles size={16} />}
                      {log.category === 'Activities' && <Trees size={16} />}
                      {log.category === 'Wellness' && <Shield size={16} />}
                      {log.category === 'Training' && <GraduationCap size={16} />}
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="font-bold truncate text-sm">{log.log_type}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(log.date + 'T12:00:00'), 'MMM dd, yyyy')}</div>
                   </div>
                   {log.category === 'Wellness' && log.next_due_date && (
                      <div className="text-right">
                         <div className="text-[9px] font-black uppercase text-rose-500">Next</div>
                         <div className="text-xs font-bold">{format(new Date(log.next_due_date), 'MMM dd')}</div>
                      </div>
                   )}
                   <button onClick={() => handleDeleteLog(log.id)} className="p-2 text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-all shrink-0 ml-1">
                     <Trash2 size={14} />
                   </button>
                </div>
             ))}
          </div>

        </div>
      </div>
    </div>
  );
}
