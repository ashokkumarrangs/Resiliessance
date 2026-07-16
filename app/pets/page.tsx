"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PetsRedirect() {
  const router = useRouter();

  useEffect(() => {
    const fetchAndRedirect = async () => {
      const { data, error } = await supabase.from('pet_profile').select('*').order('created_at', { ascending: true }).limit(1);
      
      if (data && data.length > 0) {
        router.replace(`/pets/${data[0].id}`);
      } else {
        router.replace('/pets/add');
      }
    };
    
    fetchAndRedirect();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center font-black animate-pulse bg-background text-muted-foreground">
      LOADING...
    </div>
  );
}
