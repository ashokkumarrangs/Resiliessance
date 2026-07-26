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
  Tag,
  FileText,
  Plus,
  X,
  Activity,
  Heart,
  Star,
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

const CATEGORIES = [
  "Social",
  "Food & Dining",
  "Travel",
  "Celebration",
  "Fitness",
  "Entertainment",
  "Work",
  "Other",
];

const CATEGORY_COLOR: Record<string, string> = {
  "Social":        "bg-blue-500",
  "Food & Dining": "bg-rose-500",
  "Travel":        "bg-amber-500",
  "Celebration":   "bg-purple-500",
  "Fitness":       "bg-emerald-500",
  "Entertainment": "bg-indigo-500",
  "Work":          "bg-slate-500",
  "Other":         "bg-gray-400",
};

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
  type?: "text" | "time" | "date" | "select";
  options?: string[];
}

function InlineChip({ value, placeholder, icon, onChange, type = "text", options = [] }: ChipProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  const handleBlur = () => setIsEditing(false);
  const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Enter") setIsEditing(false); };

  if (isEditing) {
    if (type === "select") {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={value}
          onChange={(e) => { onChange(e.target.value); setIsEditing(false); }}
          onBlur={handleBlur}
          className="inline-flex items-center h-10 px-4 rounded-full bg-indigo-900/50 text-indigo-100 border border-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-base appearance-none cursor-pointer"
        >
          <option value="" disabled>{placeholder}</option>
          {options.map(opt => <option key={opt} value={opt} className="bg-indigo-950">{opt}</option>)}
        </select>
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
        className="inline-flex items-center h-10 px-4 min-w-[120px] rounded-full bg-indigo-900/50 text-indigo-100 border border-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-base placeholder:text-indigo-300/50"
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
          ? "bg-transparent text-indigo-300/60 border border-dashed border-indigo-300/40 hover:bg-indigo-900/30"
          : "bg-indigo-900/40 text-indigo-50 border border-indigo-400/30 hover:bg-indigo-800/50"
      }`}
    >
      {icon && <span className={isEmpty ? "opacity-50" : "text-indigo-300"}>{icon}</span>}
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
        <span key={person} className="inline-flex items-center h-10 pl-3 pr-2 rounded-full bg-indigo-900/40 text-indigo-50 border border-indigo-400/30 font-medium text-base">
          <Users size={14} className="text-indigo-300 mr-2" />
          {person}
          <button
            type="button"
            onClick={() => onChange(people.filter(p => p !== person))}
            className="ml-2 p-0.5 rounded-full hover:bg-indigo-800/60 text-indigo-300 hover:text-white transition-colors"
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
          className="inline-flex items-center h-10 px-4 w-32 rounded-full bg-indigo-900/50 text-indigo-100 border border-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-base placeholder:text-indigo-300/50"
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className={`inline-flex items-center h-10 px-4 rounded-full text-base font-medium transition-all duration-200 gap-2 ${
            people.length === 0
              ? "bg-transparent text-indigo-300/60 border border-dashed border-indigo-300/40 hover:bg-indigo-900/30"
              : "bg-indigo-900/20 text-indigo-300 border border-dashed border-indigo-400/30 hover:bg-indigo-800/40"
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
  activity, location, people, occasion, mood, time, category,
}: {
  activity: string; location: string; people: string[]; occasion: string;
  mood: string; time: string; category: string;
}) {
  const dotColor = CATEGORY_COLOR[category] || "bg-violet-500";
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
      <div className="relative border-l border-border/60 ml-3 pl-5 space-y-0 py-1">
        {isEmpty ? (
          <div className="relative">
            <span className="absolute -left-[27px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-background bg-muted ring-4 ring-muted/10" />
            <h4 className="text-xs font-bold text-muted-foreground/30">Your activity will appear here...</h4>
            <p className="text-[10px] text-muted-foreground/20 font-medium mt-0.5">Activity · details · mood</p>
          </div>
        ) : (
          <div className="relative">
            <span className={`absolute -left-[27px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-background ring-4 ring-muted/10 ${dotColor}`} />
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
          <span className="absolute -left-[27px] top-5.5 w-2 h-2 rounded-full bg-muted" />
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
  const [category, setCategory]   = useState("");
  const [mood, setMood]           = useState("");
  const [notes, setNotes]         = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        category:  category  || null,
        mood:      mood      || null,
        notes:     notes     || null,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      // Reset form
      setActivity(""); setLocation(""); setPeople([]); setOccasion("");
      setDate(todayStr()); setTime(nowTimeStr()); setDuration("");
      setCategory(""); setMood(""); setNotes("");
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
        <div className="bg-indigo-950 rounded-3xl p-7 shadow-xl shadow-indigo-900/20 border border-indigo-800/50">
          <h2 className="text-[9px] font-black tracking-widest text-indigo-400/70 uppercase mb-6 flex items-center gap-2">
            <FileText size={13} /> Describe your activity
          </h2>

          <div className="text-xl md:text-2xl leading-loose font-medium text-indigo-100 flex flex-wrap items-center gap-y-4 gap-x-2.5">
            <span>On</span>
            <InlineChip value={date} onChange={setDate} placeholder="today" type="date" icon={<Calendar size={16} />} />
            <span>at</span>
            <InlineChip value={time} onChange={setTime} placeholder="time" type="time" icon={<Clock size={16} />} />
            <span>, I spent</span>
            <InlineChip value={duration} onChange={setDuration} placeholder="duration" icon={<Timer size={16} />} />
            <span>doing</span>
            <InlineChip value={activity} onChange={setActivity} placeholder="what activity?" />
            <span>at</span>
            <InlineChip value={location} onChange={setLocation} placeholder="where?" icon={<MapPin size={16} />} />
            <span>with</span>
            <PeopleTags people={people} onChange={setPeople} />
            <span>for</span>
            <InlineChip value={occasion} onChange={setOccasion} placeholder="what occasion?" icon={<Heart size={16} />} />
            <span>. This was a</span>
            <InlineChip value={category} onChange={setCategory} placeholder="category" type="select" options={CATEGORIES} icon={<Tag size={16} />} />
            <span>activity.</span>
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
          category={category}
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
