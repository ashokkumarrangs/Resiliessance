"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftCircle, ArrowRightCircle, Home } from "lucide-react";
import Link from "next/link";

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, children }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 md:gap-3 pt-2 md:pt-0 mb-4 md:mb-6 w-full">
      {/* Home Button */}
      <Link 
        href="/" 
        className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-muted-foreground/60 hover:text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
        title="Home"
      >
        <Home className="w-4 h-4 md:w-[18px] md:h-[18px]" />
      </Link>

      {/* Back Button */}
      <button 
        onClick={() => router.back()} 
        className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
        title="Back"
      >
        <ArrowLeftCircle className="w-4 h-4 md:w-[18px] md:h-[18px]" />
      </button>

      {/* Next/Forward Button */}
      <button 
        onClick={() => router.forward()} 
        className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
        title="Forward"
      >
        <ArrowRightCircle className="w-4 h-4 md:w-[18px] md:h-[18px]" />
      </button>

      {/* Page Title */}
      <h1 className="text-base md:text-xl font-black text-foreground tracking-tight leading-tight md:leading-none ml-1 md:ml-2 line-clamp-2 md:line-clamp-1">
        {title}
      </h1>

      {/* Spacer and Page-Specific Actions */}
      <div className="flex-1" />
      {children}
    </div>
  );
}
