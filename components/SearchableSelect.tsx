"use client";

import React, { useState, useRef, useEffect } from "react";
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
  disableCreate?: boolean;
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
  hideLabel,
  disableCreate = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prevValue, setPrevValue] = useState(value);
  const [search, setSearch] = useState(value);
  const [isTyping, setIsTyping] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const blurTimerRef = useRef<NodeJS.Timeout | null>(null);

  if (value !== prevValue) {
    setPrevValue(value);
    setSearch(value);
  }

  const safeOptions = Array.isArray(options) ? options : [];
  const displayOptions = (isTyping && search)
    ? safeOptions.filter(opt => opt?.toLowerCase().includes(search.toLowerCase()))
    : safeOptions;

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsTyping(false);
        setIsManualEntry(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < displayOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : displayOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < displayOptions.length) {
        const selected = displayOptions[focusedIndex];
        onChange(selected);
        setSearch(selected);
        setIsOpen(false);
        setFocusedIndex(-1);
      } else if (!isManualEntry) {
        const match = safeOptions.find(opt => opt?.toLowerCase() === search?.trim().toLowerCase());
        if (match) {
          onChange(match);
          setSearch(match);
        } else {
          setSearch(value);
        }
        setIsOpen(false);
      } else if (search && isManualEntry) {
        onChange(search);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className={`relative space-y-2 ${isOpen ? 'z-[100]' : ''}`}>
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
          onClick={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            const val = e.target.value;
            setSearch(val);
            if (isManualEntry) {
              onChange(val);
            }
            setIsTyping(true);
            setIsOpen(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => {
            setIsTyping(false);
            setIsOpen(true);
          }}
          onBlur={() => {
            // Commit selection/match synchronously so parent form sees it immediately
            if (!isManualEntry) {
              const match = safeOptions.find(opt => opt?.toLowerCase() === search?.trim().toLowerCase());
              if (match) {
                onChange(match);
                setSearch(match);
              } else {
                setSearch(value);
              }
            }

            blurTimerRef.current = setTimeout(() => {
              setIsOpen(false);
              setIsTyping(false);
              setIsManualEntry(false);
              setFocusedIndex(-1);
            }, 200);
          }}
          className="w-full min-w-0 h-11 bg-muted border-none rounded-lg px-4 pr-10 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20 shadow-inner transition-all placeholder:text-muted-foreground/30 font-sans cursor-text"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none group-hover:text-accent transition-colors">
          {icon || <ChevronDown size={16} />}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[100] left-0 right-0 mt-1 bg-card rounded-xl shadow-2xl border border-border/40 max-h-72 overflow-y-auto p-1.5">
          {displayOptions.map((opt, i) => (
            <button
              key={`${opt}-${i}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(opt);
                setSearch(opt);
                setIsOpen(false);
                setFocusedIndex(-1);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-between mb-0.5 last:mb-0
                ${focusedIndex === i ? "bg-accent/10 text-accent" : ""}
                ${value === opt 
                  ? "bg-primary text-primary-foreground font-black" 
                  : "text-muted-foreground hover:bg-muted hover:text-primary"}`}
            >
              <span className="truncate">{opt}</span>
              {value === opt && <CheckCircle2 size={14} className="text-primary-foreground/60" />}
            </button>
          ))}
          
          {!isManualEntry && !disableCreate && (
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
          
          {isManualEntry && search && !options.includes(search) && !disableCreate && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
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
