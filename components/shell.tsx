"use client";

import React, { useState } from "react";
import Header from "./header";
import Sidebar from "./sidebar";
import { usePathname } from "next/navigation";

export default function Shell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen bg-background sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl sm:mx-auto shadow-zenith overflow-hidden flex flex-col">
      <Header onMenuClick={() => setIsSidebarOpen(true)} />

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 overflow-y-auto no-scrollbar pt-[64px] w-full">
        <div key={pathname} className="page-stagger-container min-h-full w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
