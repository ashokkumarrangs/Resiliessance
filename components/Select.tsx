"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, CheckCircle2 } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Select({ value, onChange, className, disabled, dropdownClassName, children, ...props }: { value: any; onChange: (e: any) => void; className?: string; disabled?: boolean; dropdownClassName?: string; children: React.ReactNode }) {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      className={`relative z-30 flex items-center justify-between cursor-pointer select-none outline-none ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${className || 'w-full h-11 bg-muted border border-border rounded-md px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20'}`} 
      onClick={(e) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(!isOpen);
      }}
      {...props}
    >
      <span className="truncate">{selectedLabel}</span>
      <ChevronDown size={14} className="ml-2 opacity-50 shrink-0 pointer-events-none" />
      
      {isOpen && (
        <div className={`absolute z-[100] right-0 top-full mt-1 min-w-[130px] w-max max-w-[260px] bg-popover rounded-lg shadow-md border border-border max-h-72 overflow-y-auto p-1 before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150 ${dropdownClassName || ''}`}>
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
              className={`w-full text-left px-3 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-between gap-3 mb-0.5 last:mb-0 cursor-pointer whitespace-nowrap
                ${String(value) === String(opt.value) 
                  ? "bg-accent text-accent-foreground shadow-sm font-black" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <span className="whitespace-nowrap">{opt.label}</span>
              {String(value) === String(opt.value) && <CheckCircle2 size={12} className="text-accent-foreground shrink-0" />}
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
