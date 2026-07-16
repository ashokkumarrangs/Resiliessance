"use client";
import { Select } from "@/components/Select";
import Link from "next/link";

import React, { useState, useEffect, use } from "react";
import { PageHeader } from "@/components/PageHeader";
import { SectionNav } from "@/components/SectionNav";
import { PET_TABS } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";
import { format, differenceInMonths, differenceInYears } from "date-fns";
import { Dog, Activity, PlusCircle, Syringe, HeartPulse, Stethoscope, Bone, BarChart2, Scissors, Sparkles, Mountain, Trees, Waves, Car, Shield, AlertTriangle, GraduationCap, Octagon, Heart, Ear } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function PetDashboard({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: petId } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [petData, setPetData] = useState<any>(null);
  
    const [medicalData, setMedicalData] = useState<any[]>([]);
    const [logsData, setLogsData] = useState<any[]>([]);
  
  // Modals state
    const [showMedicalModal, setShowMedicalModal] = useState(false);
    const [medicalForm, setMedicalForm] = useState({ title: "", type: "Vaccination", date: format(new Date(), "yyyy-MM-dd"), nextDate: "" });

  
  const handleQuickLog = async (type: string) => {
    try {
      const { error } = await supabase.from('pet_logs').insert({
        pet_id: petId,
        log_type: type,
        date: format(new Date(), 'yyyy-MM-dd')
      });
      if (error) {
         toast.error("Failed to log " + type + ". Ensure you created the pet_logs table!");
         return;
      }
      toast.success(type + " logged successfully!");
      fetchDashboardData();
    } catch (e) {
      toast.error("Error logging.");
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

  useEffect(() => {
    if (petId) fetchDashboardData();
  }, [petId]);

    const [isLogPageOpen, setIsLogPageOpen] = useState(false);
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch Profile
      const { data: profile, error: profileErr } = await supabase.from('pet_profile').select('*').eq('id', petId).single();
      if (profileErr || !profile) {
        toast.error("Pet not found");
        router.push("/pets");
        return;
      }
      setPetData(profile);

      // Fetch Logs
      const { data: petLogs } = await supabase.from('pet_logs').select('*').eq('pet_id', petId);
      if (petLogs) setLogsData(petLogs);

      // Fetch Medical
      const { data: meds } = await supabase.from('pet_medical_logs').select('*').eq('pet_id', petId).order('date', { ascending: false });
      if (meds) setMedicalData(meds);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const saveMedical = async () => {
    if (!medicalForm.title) return;
    const { error } = await supabase.from('pet_medical_logs').insert({
      pet_id: petId,
      date: medicalForm.date,
      record_type: medicalForm.type,
      title: medicalForm.title,
      next_due_date: medicalForm.nextDate || null
    });
    if (error) {
      toast.error(error.message || "Failed to add medical record");
      console.error(error);
      return;
    }
    toast.success("Medical record added successfully");
    setMedicalForm({ title: "", type: "Vaccination", date: format(new Date(), "yyyy-MM-dd"), nextDate: "" });
    setShowMedicalModal(false);
    fetchDashboardData();
  };

  
  if (loading || !petData) {
    return <div className="min-h-screen bg-background pb-20 p-6 flex items-center justify-center font-bold text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        <PageHeader title={`${petData.name}'s Dashboard`} >
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
          <SectionNav tabs={PET_TABS} />
        </div>
        <div className="space-y-6 w-full">
        
        {/* Profile Card */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent border border-indigo-500/20 p-8 flex flex-col items-center justify-center text-center shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full bg-background/40 backdrop-blur-3xl -z-10"></div>
          
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-200 to-orange-400 p-1 mb-4 shadow-lg">
            <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
               <Dog size={40} className="text-orange-400" />
            </div>
          </div>
          
          <h2 className="text-3xl font-black tracking-tight mb-1 uppercase">{petData.name}</h2>
          <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
             {calculateAge(petData.dob)} <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span> {petData.breed || "Pet"}
          </p>
        </div>

        
                {/* ACTION HUB - PROTOTYPE 3: DEDICATED PAGE */}
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 p-4 rounded-2xl mb-6 text-sm font-bold">
           Prototype 3: Dedicated Logging Page. Removes clutter, uses a massive button to open a focused diary-like form.
        </div>
        
        {!isLogPageOpen ? (
          <button onClick={() => setIsLogPageOpen(true)} className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 rounded-3xl shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform group">
            <PlusCircle size={28} className="group-hover:rotate-90 transition-transform duration-500" />
            <span className="text-xl font-black uppercase tracking-widest">Add New Log Entry</span>
          </button>
        ) : (
          <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm flex flex-col gap-4 animate-in fade-in zoom-in-95">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-black text-2xl flex items-center gap-2"><PlusCircle className="text-primary"/> New Entry</h3>
               <button onClick={() => setIsLogPageOpen(false)} className="text-muted-foreground font-bold hover:text-foreground">Cancel</button>
             </div>
             
             <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Category</label>
                  <select className="w-full bg-muted p-4 rounded-xl font-bold focus:outline-none">
                     <option>Bathing & Grooming</option>
                     <option>Activity & Outing</option>
                     <option>Medical & Health</option>
                  </select>
               </div>
               <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Date</label>
                  <input type="date" className="w-full bg-muted p-4 rounded-xl font-bold focus:outline-none" />
               </div>
               <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Journal Notes</label>
                  <textarea placeholder="Write down what happened..." className="w-full bg-muted p-4 rounded-xl font-bold focus:outline-none min-h-[150px]"></textarea>
               </div>
               <button onClick={() => { handleQuickLog('Manual Entry'); setIsLogPageOpen(false); }} className="w-full bg-primary text-primary-foreground p-4 rounded-xl font-black uppercase tracking-widest mt-2">Save Entry</button>
             </div>
          </div>
        )}

{/* Medical Records Widget */}
          <div className="bg-card rounded-3xl border shadow-sm p-6 md:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold flex items-center gap-2"><HeartPulse size={18} className="text-rose-500"/> Medical & Reminders</h3>
              <button onClick={() => setShowMedicalModal(true)} className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition">
                Add Record
              </button>
            </div>
            
            <div className="space-y-3">
              {medicalData.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm bg-muted/50 rounded-2xl border border-dashed">No medical records found</div>
              ) : (
                medicalData.map((med, i) => (
                  <div key={i} className="flex items-center p-4 bg-muted/30 rounded-2xl border border-transparent hover:border-border transition group">
                    <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center mr-4 shrink-0 shadow-sm">
                      {med.record_type === 'Vaccination' ? <Syringe size={18} className="text-sky-500"/> : <Stethoscope size={18} className="text-rose-500"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{med.title}</h4>
                      <p className="text-xs text-muted-foreground">{format(new Date(med.date), 'MMM dd, yyyy')} • {med.record_type}</p>
                    </div>
                    {med.next_due_date && (
                      <div className="ml-4 text-right shrink-0">
                         <div className="text-[10px] font-bold text-amber-500 uppercase">Due</div>
                         <div className="text-xs font-semibold">{format(new Date(med.next_due_date), 'MMM dd')}</div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
      </div>

      {/* Modals */}
      {showMedicalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowMedicalModal(false)}></div>
          <div className="relative bg-card w-full max-w-sm rounded-3xl p-6 border shadow-2xl">
            <h3 className="font-bold mb-4">Add Medical Record</h3>
            <div className="space-y-3 mb-6">
              <input 
                type="text" 
                value={medicalForm.title}
                onChange={e => setMedicalForm({...medicalForm, title: e.target.value})}
                placeholder="Record Title (e.g. Rabies Shot)"
                className="w-full bg-muted p-3 rounded-xl font-medium focus:outline-none"
              />
              <Select 
                value={medicalForm.type}
                onChange={e => setMedicalForm({...medicalForm, type: e.target.value})}
                className="w-full bg-muted p-3 rounded-xl font-medium focus:outline-none appearance-none"
              >
                <option>Vaccination</option>
                <option>Deworming</option>
                <option>Checkup</option>
                <option>Illness</option>
              </Select>
              <div className="flex gap-2">
                 <div className="flex-1">
                   <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Date</label>
                   <input type="date" value={medicalForm.date} onChange={e => setMedicalForm({...medicalForm, date: e.target.value})} className="w-full bg-muted p-3 rounded-xl text-sm" />
                 </div>
                 <div className="flex-1">
                   <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Next Due (Opt)</label>
                   <input type="date" value={medicalForm.nextDate} onChange={e => setMedicalForm({...medicalForm, nextDate: e.target.value})} className="w-full bg-muted p-3 rounded-xl text-sm" />
                 </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowMedicalModal(false)} className="flex-1 p-3 rounded-xl font-bold text-muted-foreground hover:bg-muted">Cancel</button>
              <button onClick={saveMedical} className="flex-1 p-3 rounded-xl font-bold bg-primary text-primary-foreground">Save</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
