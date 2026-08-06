"use client";

import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { SectionNav } from "@/components/SectionNav";
import { SaveButton } from "@/components/ui/SaveButton";
import { supabase } from "@/lib/supabase";
import {
  MapPin,
  Users,
  Calendar,
  Clock,
  Timer,
  FileText,
  Plus,
  X,
  Activity,
  Heart,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const MOODS = [
  { emoji: "🤩", label: "Excited" },
  { emoji: "😄", label: "Great" },
  { emoji: "🙂", label: "Good" },
  { emoji: "😐", label: "Okay" },
  { emoji: "😔", label: "Low" },
  { emoji: "😤", label: "Frustrated" },
  { emoji: "😴", label: "Tired" },
  { emoji: "🥰", label: "Loved" },
];

const NAV_TABS = [
  { title: "Timeline",        href: "/activity-timeline",             icon: <Activity size={15} /> },
  { title: "Day at a Glance", href: "/activity-timeline/day",        icon: <Clock size={15} /> },
  { title: "Add Activity",    href: "/activity-timeline/add-activity", icon: <Plus size={15} /> },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function nowTimeStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatTime12(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ─── InlineChip ───────────────────────────────────────────────────────────────

interface ChipProps {
  value: string;
  placeholder: string;
  icon?: React.ReactNode;
  onChange: (val: string) => void;
  type?: "text" | "time" | "date" | "select" | "searchable-select";
  options?: string[];
}

function InlineChip({ value, placeholder, icon, onChange, type = "text", options = [] }: ChipProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState(value);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing) {
      Promise.resolve().then(() => {
        setSearch(value);
        setIsManualEntry(false);
      });
    }
  }, [isEditing, value]);

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsEditing(false);
      }
    }
    if (isEditing && type === "searchable-select") {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing, type]);

  const handleBlur = () => {
    if (type !== "searchable-select") {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      if (type === "searchable-select") {
        onChange(search);
      }
      setIsEditing(false);
    }
  };

  if (isEditing) {
    if (type === "select") {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={value}
          onChange={(e) => { onChange(e.target.value); setIsEditing(false); }}
          onBlur={handleBlur}
          className="inline-flex items-center h-10 px-4 rounded-full bg-black/20 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 font-medium text-base appearance-none cursor-pointer"
        >
          <option value="" disabled>{placeholder}</option>
          {options.map(opt => <option key={opt} value={opt} className="bg-slate-800 text-white">{opt}</option>)}
        </select>
      );
    }

    if (type === "searchable-select") {
      const filteredOptions = search
        ? options.filter(opt => opt?.toLowerCase().includes(search.toLowerCase()))
        : options;

      return (
        <div ref={containerRef} className="relative inline-flex items-center">
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (isManualEntry) {
                onChange(e.target.value);
              }
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="inline-flex items-center h-10 px-4 min-w-[140px] rounded-full bg-black/20 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 font-medium text-base placeholder:text-white/40"
            style={{ width: `${Math.max((search.length || placeholder.length) * 10 + 48, 140)}px` }}
          />
          {/* Dropdown Menu */}
          <div className="absolute z-50 left-0 top-full mt-1 bg-slate-850 border border-white/10 rounded-xl shadow-2xl p-1.5 min-w-[200px] max-h-48 overflow-y-auto">
            {filteredOptions.map((opt, i) => (
              <button
                key={`${opt}-${i}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(opt);
                  setSearch(opt);
                  setIsEditing(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-between mb-0.5 last:mb-0
                  ${value === opt 
                    ? "bg-primary text-white font-black" 
                    : "text-white/80 hover:bg-white/10 hover:text-white"}`}
              >
                <span>{opt}</span>
              </button>
            ))}

            {!isManualEntry && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setIsManualEntry(true);
                  setSearch("");
                  onChange("");
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-black text-white/90 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-1.5 mt-1 border-t border-white/5"
              >
                <Plus size={12} />
                <span>Add New</span>
              </button>
            )}

            {filteredOptions.length === 0 && !search && (
              <div className="px-3 py-3 text-center text-xs text-white/30 font-bold uppercase tracking-wider">
                Empty List
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="inline-flex items-center h-10 px-4 min-w-[120px] rounded-full bg-black/20 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 font-medium text-base placeholder:text-white/40"
        style={{ width: `${Math.max((value.length || placeholder.length) * 10 + 48, 120)}px` }}
      />
    );
  }

  const isEmpty = !value;
  const displayValue = type === "time" && value ? formatTime12(value) : value;
  const displayDate = type === "date" && value === todayStr() ? "Today" : value;

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className={`inline-flex items-center h-10 px-4 rounded-full text-base font-medium transition-all duration-200 gap-2 ${
        isEmpty
          ? "bg-white/10 text-white/80 border border-dashed border-white/20 hover:bg-white/25"
          : "bg-black/20 text-white border border-white/15 hover:bg-black/30"
      }`}
    >
      {icon && <span className={isEmpty ? "opacity-50" : "text-white/70"}>{icon}</span>}
      {isEmpty ? placeholder : (type === "time" ? displayValue : type === "date" ? displayDate : value)}
    </button>
  );
}

// ─── PeopleTags ───────────────────────────────────────────────────────────────

function PeopleTags({ people, onChange }: { people: string[]; onChange: (p: string[]) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isEditing && inputRef.current) inputRef.current.focus(); }, [isEditing]);

  const addPerson = () => {
    if (inputValue.trim() && !people.includes(inputValue.trim())) {
      onChange([...people, inputValue.trim()]);
    }
    setInputValue("");
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addPerson(); }
    else if (e.key === "Escape") { setIsEditing(false); setInputValue(""); }
  };

  return (
    <span className="inline-flex items-center flex-wrap gap-2 align-middle">
      {people.map(person => (
        <span key={person} className="inline-flex items-center h-10 pl-3 pr-2 rounded-full bg-black/20 text-white border border-white/15 font-medium text-base">
          <Users size={14} className="text-white/70 mr-2" />
          {person}
          <button
            type="button"
            onClick={() => onChange(people.filter(p => p !== person))}
            className="ml-2 p-0.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X size={13} />
          </button>
        </span>
      ))}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={addPerson}
          onKeyDown={handleKeyDown}
          placeholder="Name..."
          className="inline-flex items-center h-10 px-4 w-32 rounded-full bg-black/20 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 font-medium text-base placeholder:text-white/40"
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className={`inline-flex items-center h-10 px-4 rounded-full text-base font-medium transition-all duration-200 gap-2 ${
            people.length === 0
              ? "bg-transparent text-white/80 border border-dashed border-white/30 hover:bg-white/10"
              : "bg-white/5 text-white border border-dashed border-white/20 hover:bg-white/15"
          }`}
        >
          <Plus size={16} />
          {people.length === 0 ? "friends" : "add more"}
        </button>
      )}
    </span>
  );
}

// ─── Live Preview ─────────────────────────────────────────────────────────────

function LivePreview({
  activity, location, people, occasion, mood, time,
}: {
  activity: string; location: string; people: string[]; occasion: string;
  mood: string; time: string;
}) {
  const dotColor = "bg-violet-500";
  const moodEmoji = MOODS.find(m => m.label === mood)?.emoji || "";
  const subtitle = [
    location,
    people.length > 0 ? `with ${people.join(", ")}` : "",
    occasion,
    moodEmoji,
  ].filter(Boolean).join(" · ");

  const isEmpty = !activity && !location && !occasion && !time;

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border/40 p-5">
      <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest block mb-4">
        Timeline Preview
      </span>
      <div className="relative border-l border-border/60 ml-3.5 pl-6 space-y-0 py-1">
        {isEmpty ? (
          <div className="relative">
            <span className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-background bg-muted ring-4 ring-muted/10" />
            <h4 className="text-xs font-bold text-muted-foreground/30">Your activity will appear here...</h4>
            <p className="text-[10px] text-muted-foreground/20 font-medium mt-0.5">Activity · details · mood</p>
          </div>
        ) : (
          <div className="relative">
            <span className={`absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-background ring-4 ring-muted/10 ${dotColor}`} />
            <h4 className="text-xs font-bold text-foreground">
              {time ? `${formatTime12(time)} – ` : ""}{activity || "Activity"}
            </h4>
            <p className="text-[10px] text-muted-foreground/80 font-medium mt-0.5">
              Activity{subtitle ? ` · ${subtitle}` : ""}
            </p>
          </div>
        )}
        {/* Ghost entries below */}
        <div className="relative pt-4 opacity-20 pointer-events-none select-none">
          <span className="absolute -left-[31px] top-5.5 w-2 h-2 rounded-full bg-muted" />
          <h4 className="text-[10px] font-semibold text-muted-foreground pt-4">Earlier entries...</h4>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AddActivityPage() {
  const [activity, setActivity]   = useState("");
  const [location, setLocation]   = useState("");
  const [people, setPeople]       = useState<string[]>([]);
  const [occasion, setOccasion]   = useState("");
  const [date, setDate]           = useState(todayStr);
  const [time, setTime]           = useState(nowTimeStr);
  const [duration, setDuration]   = useState("");
  const [mood, setMood]           = useState("");
  const [notes, setNotes]         = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pastActivities, setPastActivities] = useState<string[]>([]);

  const fetchPastActivities = async () => {
    try {
      const { data } = await supabase.from("activity_logs").select("activity");
      if (data) {
        const unique = Array.from(new Set(data.map((d) => d.activity).filter(Boolean))) as string[];
        setPastActivities(unique);
      }
    } catch (err) {
      console.error("Failed to fetch past activities:", err);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchPastActivities();
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("activity_logs").insert({
        activity,
        location:  location || null,
        people:    people.length > 0 ? people.join(", ") : null,
        occasion:  occasion  || null,
        date,
        time:      time      || null,
        duration:  duration  || null,
        mood:      mood      || null,
        notes:     notes     || null,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      // Reset form
      setActivity(""); setLocation(""); setPeople([]); setOccasion("");
      setDate(todayStr()); setTime(nowTimeStr()); setDuration("");
      setMood(""); setNotes("");
      fetchPastActivities();
    } catch (err) {
      console.error("Failed to save activity:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper title="Add Activity" className="pb-24">
      <SectionNav tabs={NAV_TABS} />

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Story Card ─────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-primary to-accent/80 rounded-3xl p-7 text-white shadow-xl relative overflow-hidden border border-white/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
          <div className="absolute bottom-0 left-10 w-24 h-24 bg-black/10 rounded-full -mb-10 blur-lg"></div>

          <h2 className="text-[9px] font-black tracking-widest text-white/70 uppercase mb-6 flex items-center gap-2 relative z-10">
            <FileText size={13} /> Describe your activity
          </h2>

          <div className="text-xl md:text-2xl leading-loose font-medium text-white flex flex-wrap items-center gap-y-4 gap-x-2.5 relative z-10">
            <span>On</span>
            <InlineChip value={date} onChange={setDate} placeholder="today" type="date" icon={<Calendar size={16} />} />
            <span>at</span>
            <InlineChip value={time} onChange={setTime} placeholder="time" type="time" icon={<Clock size={16} />} />
            <span>, I spent</span>
            <InlineChip value={duration} onChange={setDuration} placeholder="duration" icon={<Timer size={16} />} />
            <span>doing</span>
            <InlineChip
              value={activity}
              onChange={setActivity}
              placeholder="what activity?"
              type="searchable-select"
              options={pastActivities}
            />
            <span>at</span>
            <InlineChip value={location} onChange={setLocation} placeholder="where?" icon={<MapPin size={16} />} />
            <span>with</span>
            <PeopleTags people={people} onChange={setPeople} />
            <span>for</span>
            <InlineChip value={occasion} onChange={setOccasion} placeholder="what occasion?" icon={<Heart size={16} />} />
            <span>.</span>
          </div>
        </div>

        {/* ── Live Preview ────────────────────────────────────────────── */}
        <LivePreview
          activity={activity}
          location={location}
          people={people}
          occasion={occasion}
          mood={mood}
          time={time}
        />

        {/* ── Mood + Notes row ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Mood */}
          <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/40">
            <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest block mb-4">
              How did it feel?
            </span>
            <div className="grid grid-cols-4 gap-2">
              {MOODS.map(m => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => setMood(mood === m.label ? "" : m.label)}
                  className={`flex flex-col items-center justify-center py-3 px-1 rounded-xl border transition-all ${
                    mood === m.label
                      ? "bg-primary/10 border-primary/30 scale-105 shadow-sm"
                      : "bg-muted/40 border-transparent hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="text-2xl mb-1">{m.emoji}</span>
                  <span className="text-[9px] font-black tracking-wide">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/40 flex flex-col gap-3">
            <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">
              Notes
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special memories or details..."
              rows={5}
              className="w-full bg-muted/40 border-none rounded-xl p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/40 transition-all"
            />
          </div>
        </div>

        {/* ── Save Button ─────────────────────────────────────────────── */}
        <div className="flex justify-center pt-2">
          <SaveButton
            type="submit"
            isSaving={isSubmitting}
            disabled={isSubmitting || !activity}
            label="Save Activity"
            className="w-full max-w-xs h-12 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-muted"
          />
        </div>

      </form>
    </PageWrapper>
  );
}
