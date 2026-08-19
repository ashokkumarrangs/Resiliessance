"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DailyEntryRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/finance/transactions/expense");
  }, []);
  return <div className="p-8 text-center text-muted-foreground font-black tracking-widest uppercase text-xs">Redirecting...</div>;
}
