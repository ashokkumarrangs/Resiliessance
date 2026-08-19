"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const party = searchParams.get('party') || '';
  useEffect(() => {
    const url = `/finance/capital/liabilities${party ? `?party=${encodeURIComponent(party)}` : ''}`;
    router.replace(url);
  }, []);
  return <div className="p-8 text-center text-muted-foreground font-black tracking-widest uppercase text-xs">Redirecting...</div>;
}

export default function AddLiabilityPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground font-black tracking-widest uppercase text-xs">Redirecting...</div>}>
      <RedirectContent />
    </Suspense>
  );
}
