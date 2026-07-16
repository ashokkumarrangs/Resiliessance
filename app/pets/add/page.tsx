"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { SectionNav } from "@/components/SectionNav";
import { PET_TABS } from "@/lib/navigation";
import { SubNav } from "@/components/SubNav";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Dog , BarChart2 } from "lucide-react";

export default function AddPetPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    breed: "",
  });
  const [loading, setLoading] = useState(false);
  const [allPets, setAllPets] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchPets = async () => {
      const { data } = await supabase.from('pet_profile').select('*');
      if (data) setAllPets(data);
    };
    fetchPets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Pet name is required");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.from('pet_profile').insert({
        name: formData.name,
        dob: formData.dob || null,
        breed: formData.breed || null
      });
      
      if (error) {
        toast.error(error.message || "Failed to add pet");
        console.error(error);
        return;
      }
      
      toast.success(`${formData.name} added successfully!`);
      router.push("/pets");
    } catch (err: any) {
      toast.error("An error occurred while adding the pet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        <PageHeader title="Add Pet" >
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
          <SectionNav tabs={PET_TABS} activePath="/pets/add" />
        </div>
        
        <div className="flex items-center justify-center relative mb-6 w-full">
          <SubNav 
            items={allPets.map(p => p.name)}
            activeItem=""
            onChange={(val) => {
              const p = allPets.find(x => x.name === val);
              if (p) router.push(`/pets/${p.id}`);
            }}
            className="!mb-0 !mx-0"
          />
        </div>
        <div className="w-full">
        <form onSubmit={handleSubmit} className="bg-card border border-border shadow-sm rounded-2xl p-6 space-y-6">
          <div className="flex justify-center mb-6">
             <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
               <Dog size={32} className="text-primary" />
             </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-1 block">Pet Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-muted p-4 rounded-xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. Luna"
                autoFocus
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-1 block">Date of Birth</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full bg-muted p-4 rounded-xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-1 block">Breed / Species</label>
              <input
                type="text"
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                className="w-full bg-muted p-4 rounded-xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. Golden Retriever"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-black tracking-widest uppercase p-4 rounded-xl shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:transform-none"
          >
            {loading ? "Adding..." : "Add Pet"}
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
