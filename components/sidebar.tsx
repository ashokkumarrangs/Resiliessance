import {
  Bike,
  Car,
  CheckCircle2,
  FileCheck,
  GraduationCap,
  KanbanSquare,
  LayoutDashboard,
  PackageCheck,
  Wallet,
  BarChart,
  Dog,
  PlusCircle,
  Clock,
} from "lucide-react";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {


  const DrawerOverlay = () => (
    <div
      onClick={onClose}
      className={`absolute inset-0 bg-black/55 z-50 transition-opacity duration-300 ${
        isOpen ? "opacity-100 block" : "opacity-0 hidden pointer-events-none"
      }`}
    />
  );

  return (
    <>
      <DrawerOverlay />
      <nav
        className={`absolute top-0 left-0 h-full w-[min(320px,90vw)] bg-white z-[60] transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-[20px_0_40px_rgba(0,0,0,0.05)] overflow-y-auto no-scrollbar ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >

        <div className="pt-10 px-8 pb-6 bg-card">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Resiliessance Logo" className="w-8 h-8 rounded-lg object-contain" />
            <div className="text-3xl font-black tracking-tighter text-foreground leading-none">
              Resiliessance
            </div>
          </div>
        </div>

        <ul className="list-none m-0 py-4 px-4 space-y-1">
          {/* Dashboard */}
          <NavItem href="/" icon={<LayoutDashboard size={20} />} title="Dashboard" onClick={onClose} />
          {/* Reports */}
          <NavItem href="/reports" icon={<BarChart size={20} />} title="Reports" onClick={onClose} />
          {/* Quick Add */}
          <NavItem href="/quick-add" icon={<PlusCircle size={20} />} title="Quick Add" onClick={onClose} />
          {/* Activity Timeline */}
          <NavItem href="/activity-timeline" icon={<Clock size={20} />} title="Activity Timeline" onClick={onClose} />

          <div className="h-px bg-slate-100 my-4 mx-4" />

          {/* Finance */}
          <NavItem href="/expenses/daily-entry?type=Expense" icon={<Wallet size={20} />} title="Finance" onClick={onClose} />

          <div className="h-px bg-slate-50 my-2 mx-4" />

          {/* Habits */}
          <NavItem href="/habits/view" icon={<CheckCircle2 size={20} />} title="Habits" onClick={onClose} />

          <div className="h-px bg-slate-50 my-2 mx-4" />

          {/* Workout */}
          <NavItem href="/workout" icon={<Bike size={20} />} title="Workout" onClick={onClose} />

          <div className="h-px bg-slate-50 my-2 mx-4" />

          {/* Pets & Vehicles */}
          <NavItem href="/pets" icon={<Dog size={20} />} title="Pets" onClick={onClose} />
          <NavItem href="/vehicles/fuel" icon={<Car size={20} />} title="Vehicles" onClick={onClose} />

          <div className="h-px bg-slate-50 my-2 mx-4" />

          {/* Core Apps */}
          <NavItem href="/tasks" icon={<KanbanSquare size={20} />} title="Task Manager" onClick={onClose} />
          <NavItem href="/squareshift" icon={<FileCheck size={20} />} title="SquareShift" onClick={onClose} />
          <NavItem href="/skills" icon={<GraduationCap size={20} />} title="Skills" onClick={onClose} />
          
          <div className="h-px bg-slate-50 my-2 mx-4" />
          
          {/* Inventory */}
          <NavItem href="/inventory" icon={<PackageCheck size={20} />} title="Inventory" onClick={onClose} />
        </ul>

      </nav>
    </>
  );
}

function NavItem({ icon, title, onClick, href }: { icon: React.ReactNode; title: string; onClick?: () => void; href?: string }) {
  const pathname = usePathname();
  const isActive = href && pathname === href;
  
  const content = (
    <div className={`flex items-center gap-4 py-4 px-5 rounded-xl text-[15px] font-bold cursor-pointer transition-all duration-300 select-none
      ${isActive ? "text-primary-foreground bg-primary shadow-xl shadow-primary/10 scale-[1.02]" : "text-muted-foreground hover:text-foreground hover:bg-muted"}
    `}>
      <div className="w-5 flex justify-center">{icon}</div>
      <span>{title}</span>
    </div>
  );

  return (
    <li onClick={onClick}>
      {href ? <Link href={href} prefetch>{content}</Link> : content}
    </li>
  );
}

