"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, CheckCircle2, PlusCircle } from "lucide-react";

interface SearchableSelectProps {
  label: string;
  headerIcon?: React.ReactNode;
  icon?: React.ReactNode;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  createLabel?: string;
  placeholder?: string;
  hideLabel?: boolean;
}

export function SearchableSelect({ 
  label, 
  headerIcon, 
  icon, 
  value, 
  onChange, 
  options,
  createLabel,
  placeholder,
  hideLabel
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const [isTyping, setIsTyping] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  const displayOptions = (isTyping && search)
    ? options.filter(opt => opt?.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div className="relative space-y-2">
      {!hideLabel && (
        <label className="text-sm font-black text-muted-foreground/60 flex items-center gap-1.5 leading-none">
          {headerIcon}
          {label}
        </label>
      )}
      <div className="relative group">
        <input 
          ref={inputRef}
          type="text"
          placeholder={placeholder || "Select/Type"}
          value={search}
          autoComplete="off"
          readOnly={!isManualEntry}
          onClick={() => { if (!isManualEntry) setIsOpen(true); }}
          onChange={(e) => {
            setSearch(e.target.value);
            onChange(e.target.value);
            setIsTyping(true);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsTyping(false);
            setIsOpen(true);
          }}
          onBlur={() => setTimeout(() => {
            setIsOpen(false);
            setIsTyping(false);
            setIsManualEntry(false);
          }, 200)}
          className={`w-full h-11 bg-muted border-none rounded-lg px-4 pr-10 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner transition-all placeholder:text-muted-foreground/30 font-sans ${!isManualEntry ? 'cursor-pointer' : ''}`}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none group-hover:text-accent transition-colors">
          {icon || <ChevronDown size={16} />}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-card rounded-xl shadow-2xl border border-border/40 max-h-72 overflow-y-auto p-1.5">
          {displayOptions.map((opt, i) => (
            <button
              key={`${opt}-${i}`}
              type="button"
              onClick={() => {
                onChange(opt);
                setSearch(opt);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-between mb-0.5 last:mb-0
                ${value === opt 
                  ? "bg-primary text-primary-foreground font-black" 
                  : "text-muted-foreground hover:bg-muted hover:text-primary"}`}
            >
              <span className="truncate">{opt}</span>
              {value === opt && <CheckCircle2 size={14} className="text-primary-foreground/60" />}
            </button>
          ))}
          
          {!isManualEntry && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault();
                setIsManualEntry(true);
                setSearch("");
                onChange("");
                setIsOpen(false);
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
              className="w-full text-left px-3 py-3 rounded-lg text-sm font-black text-accent hover:bg-accent/5 transition-all flex items-center gap-2 mt-1 border-t border-border/40"
            >
              <PlusCircle size={14} className="shrink-0" />
              <span className="truncate">Add New</span>
            </button>
          )}
          
          {isManualEntry && search && !options.includes(search) && (
            <button
              type="button"
              onClick={() => {
                onChange(search);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-md text-sm font-black tracking-tight text-accent hover:bg-accent/5 transition-all flex items-center gap-2 mt-0.5 border border-accent/10 sm:border-none"
            >
              <PlusCircle size={16} className="shrink-0" />
              <span className="truncate">{createLabel ? createLabel.replace('{search}', search) : `Create "${search}"`}</span>
            </button>
          )}

          {displayOptions.length === 0 && !search && (
            <div className="px-3 py-4 text-center">
              <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">Empty List</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
