"use client";

import React, { useState } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { PET_TABS } from "@/lib/navigation";
import { SubNav } from "@/components/SubNav";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Dog } from "lucide-react";

export default function AddPetPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    breed: "",
  });
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    } catch (err) {
      toast.error("An error occurred while adding the pet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper
      title="Add Pet"
      reportHref="/reports/pets"
      sectionTabs={PET_TABS}
      activePath="/pets/add"
      className="pb-20"
    >
        
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
    </PageWrapper>
  );
}
