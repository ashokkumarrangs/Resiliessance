"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AddAssetPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/finance/capital/assets?action=add");
  }, []);
  return <div className="p-8 text-center text-muted-foreground font-black tracking-widest uppercase text-xs">Redirecting...</div>;
}
