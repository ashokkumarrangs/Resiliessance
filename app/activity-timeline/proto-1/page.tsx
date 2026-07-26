"use client";

import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { SectionNav } from "@/components/SectionNav";
import { 
  MapPin, 
  Users, 
  Calendar, 
  Clock, 
  Timer, 
  Tag, 
  Smile, 
  Heart, 
  FileText, 
  Plus, 
  X, 
  ChevronLeft, 
  Save,
  Activity,
} from "lucide-react";

const MOODS = [
  { emoji: "😄", label: "Great" },
  { emoji: "🙂", label: "Good" },
  { emoji: "😐", label: "Okay" },
  { emoji: "😔", label: "Not great" }
];

const CATEGORIES = [
  "Social",
  "Food & Dining",
  "Travel",
  "Celebration",
  "Fitness",
  "Entertainment",
  "Work",
  "Other"
];

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
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => setIsEditing(false);
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') setIsEditing(false);
  };

  if (isEditing) {
    if (type === "select") {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsEditing(false);
          }}
          onBlur={handleBlur}
          className="inline-flex items-center h-10 px-4 rounded-full bg-indigo-900/50 text-indigo-100 border border-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-lg appearance-none cursor-pointer"
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
        className="inline-flex items-center h-10 px-4 min-w-[120px] rounded-full bg-indigo-900/50 text-indigo-100 border border-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-lg placeholder:text-indigo-300/50"
        style={{ width: `${Math.max(value.length * 12 + 40, 120)}px` }}
      />
    );
  }

  const isEmpty = !value;
  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className={`
        inline-flex items-center h-10 px-4 rounded-full text-lg font-medium transition-all duration-200 gap-2
        ${isEmpty 
          ? 'bg-transparent text-indigo-300/60 border border-dashed border-indigo-300/40 hover:bg-indigo-900/30' 
          : 'bg-indigo-900/40 text-indigo-50 border border-indigo-400/30 hover:bg-indigo-800/50'
        }
      `}
    >
      {icon && <span className={isEmpty ? 'opacity-50' : 'text-indigo-300'}>{icon}</span>}
      {isEmpty ? placeholder : value}
    </button>
  );
}

function PeopleTags({ people, onChange }: { people: string[], onChange: (people: string[]) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const addPerson = () => {
    if (inputValue.trim() && !people.includes(inputValue.trim())) {
      onChange([...people, inputValue.trim()]);
    }
    setInputValue("");
    setIsEditing(false);
  };

  const removePerson = (person: string) => {
    onChange(people.filter(p => p !== person));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPerson();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue("");
    }
  };

  return (
    <span className="inline-flex items-center flex-wrap gap-2 align-middle">
      {people.map(person => (
        <span key={person} className="inline-flex items-center h-10 pl-4 pr-2 rounded-full bg-indigo-900/40 text-indigo-50 border border-indigo-400/30 font-medium text-lg">
          <Users size={16} className="text-indigo-300 mr-2" />
          {person}
          <button 
            type="button" 
            onClick={() => removePerson(person)}
            className="ml-2 p-1 rounded-full hover:bg-indigo-800/50 text-indigo-300 hover:text-white transition-colors"
          >
            <X size={14} />
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
          className="inline-flex items-center h-10 px-4 w-32 rounded-full bg-indigo-900/50 text-indigo-100 border border-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-lg placeholder:text-indigo-300/50"
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className={`
            inline-flex items-center h-10 px-4 rounded-full text-lg font-medium transition-all duration-200 gap-2
            ${people.length === 0 
              ? 'bg-transparent text-indigo-300/60 border border-dashed border-indigo-300/40 hover:bg-indigo-900/30' 
              : 'bg-indigo-900/20 text-indigo-300 border border-dashed border-indigo-400/30 hover:bg-indigo-800/40'
            }
          `}
        >
          <Plus size={18} />
          {people.length === 0 ? 'friends' : 'add'}
        </button>
      )}
    </span>
  );
}


export default function StoryModeActivityPage() {
  const [activity, setActivity] = useState("");
  const [location, setLocation] = useState("");
  const [people, setPeople] = useState<string[]>([]);
  const [occasion, setOccasion] = useState("");
  const [date, setDate] = useState("Today");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("");
  const [category, setCategory] = useState("");
  const [mood, setMood] = useState("");
  const [notes, setNotes] = useState("");

  const navTabs = [
    { title: 'Timeline', href: '/activity-timeline', icon: <Activity size={15} /> },
    { title: 'Day at a Glance', href: '/activity-timeline/day', icon: <Clock size={15} /> },
    { title: 'Add Activity', href: '/activity-timeline/proto-1', icon: <Plus size={15} /> }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Saving Activity:", {
      activity, location, people, occasion, date, time, duration, category, mood, notes
    });
    // In a real app, reset form or redirect
  };

  return (
    <PageWrapper title="Add Activity">
      <div className="max-w-4xl mx-auto pb-24">
        
        <div className="mb-6 flex justify-between items-center">
          <SectionNav tabs={navTabs} />
          <span className="text-xs font-medium text-indigo-500/80 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Prototype 1 of 5 · Story Mode
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="bg-indigo-950 rounded-3xl p-8 md:p-12 shadow-xl shadow-indigo-900/20 border border-indigo-800/50">
            <h2 className="text-sm font-semibold tracking-widest text-indigo-400 uppercase mb-8 flex items-center gap-2">
              <FileText size={16} /> Describe your activity
            </h2>
            
            <div className="text-2xl md:text-3xl lg:text-4xl leading-loose md:leading-[3rem] font-medium text-indigo-100 flex flex-wrap items-center gap-y-6 gap-x-3">
              <span>On</span>
              <InlineChip 
                value={date} 
                onChange={setDate} 
                placeholder="Today" 
                icon={<Calendar size={20} />} 
              />
              <span>at</span>
              <InlineChip 
                value={time} 
                onChange={setTime} 
                placeholder="time" 
                type="time" 
                icon={<Clock size={20} />} 
              />
              <span>, I spent</span>
              <InlineChip 
                value={duration} 
                onChange={setDuration} 
                placeholder="duration (e.g. 2 hrs)" 
                icon={<Timer size={20} />} 
              />
              <span>doing</span>
              <InlineChip 
                value={activity} 
                onChange={setActivity} 
                placeholder="what activity?" 
              />
              <span>at</span>
              <InlineChip 
                value={location} 
                onChange={setLocation} 
                placeholder="where?" 
                icon={<MapPin size={20} />} 
              />
              <span>with</span>
              <PeopleTags people={people} onChange={setPeople} />
              <span>for</span>
              <InlineChip 
                value={occasion} 
                onChange={setOccasion} 
                placeholder="what occasion?" 
                icon={<Heart size={20} />} 
              />
              <span>. This was a</span>
              <InlineChip 
                value={category} 
                onChange={setCategory} 
                placeholder="category"
                type="select"
                options={CATEGORIES}
                icon={<Tag size={20} />} 
              />
              <span>activity.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/40 flex flex-col gap-4">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Smile size={16} /> How did it feel?
              </label>
              <div className="flex gap-3 mt-2">
                {MOODS.map(m => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => setMood(m.label)}
                    className={`
                      flex flex-col items-center justify-center p-3 rounded-2xl border transition-all flex-1
                      ${mood === m.label 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-100 scale-105' 
                        : 'bg-muted/30 border-transparent hover:bg-muted text-muted-foreground'
                      }
                    `}
                  >
                    <span className="text-3xl mb-1">{m.emoji}</span>
                    <span className="text-xs font-medium">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/40 flex flex-col gap-4">
              <label htmlFor="notes" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText size={16} /> Extra Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special memories or details?"
                className="w-full bg-muted/30 border-transparent focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 rounded-xl p-4 text-foreground min-h-[100px] resize-none transition-all placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-lg rounded-2xl py-4 px-6 flex items-center justify-center gap-3 transition-colors shadow-sm shadow-indigo-600/20 active:scale-[0.99]"
          >
            <Save size={24} />
            Save Activity
          </button>
          
        </form>
      </div>
    </PageWrapper>
  );
}
