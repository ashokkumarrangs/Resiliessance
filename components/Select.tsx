"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, CheckCircle2 } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Select({ value, onChange, className, children, ...props }: { value: any; onChange: (e: any) => void; className?: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Extract options from children <option value="X">Label</option>
  const options = React.Children.toArray(children).map((child) => {
    const el = child as React.ReactElement<any>;
    if (el && el.type === 'option') {
      return { 
        value: el.props.value !== undefined ? el.props.value : el.props.children, 
        label: el.props.children 
      };
    }
    return null;
  }).filter(Boolean) as { value: string | number; label: string }[];

  const selectedLabel = options.find((o) => String(o.value) === String(value))?.label || value;

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div 
      ref={containerRef}
      tabIndex={0}
      className={`relative z-30 flex items-center justify-between cursor-pointer select-none outline-none ${className || ''}`} 
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(!isOpen);
      }}
      {...props}
    >
      <span className="truncate">{selectedLabel}</span>
      <ChevronDown size={14} className="ml-2 opacity-50 shrink-0 pointer-events-none" />
      
      {isOpen && (
        <div className="absolute z-[100] left-0 right-0 top-full mt-1 w-full bg-card rounded-xl shadow-2xl border border-border/40 max-h-72 overflow-y-auto p-1.5">
          {options.map((opt, i) => (
            <div
              key={i}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                containerRef.current?.focus();
                if (onChange) onChange({ target: { value: opt.value } });
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-between mb-0.5 last:mb-0 cursor-pointer
                ${String(value) === String(opt.value) 
                  ? "bg-primary text-primary-foreground shadow-sm font-black" 
                  : "text-muted-foreground hover:bg-muted hover:text-primary"}`}
            >
              <span className="truncate pr-4">{opt.label}</span>
              {String(value) === String(opt.value) && <CheckCircle2 size={14} className="text-primary-foreground/60 shrink-0" />}
            </div>
          ))}
          {options.length === 0 && (
            <div className="px-3 py-4 text-center">
              <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">Empty List</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
