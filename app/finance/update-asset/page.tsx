"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';
  useEffect(() => {
    const url = `/finance/capital/assets?action=update${id ? `&id=${encodeURIComponent(id)}` : ''}`;
    router.replace(url);
  }, []);
  return <div className="p-8 text-center text-muted-foreground font-black tracking-widest uppercase text-xs">Redirecting...</div>;
}

export default function UpdateAssetPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground font-black tracking-widest uppercase text-xs">Redirecting...</div>}>
      <RedirectContent />
    </Suspense>
  );
}
