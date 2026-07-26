"use client";

import React, { useState } from 'react';
import { 
  MapPin, 
  Users, 
  Calendar, 
  Clock, 
  Timer, 
  Tag, 
  Smile, 
  FileText, 
  Plus, 
  X, 
  ChevronDown 
} from 'lucide-react';
import Link from 'next/link';

export default function Proto2Page() {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [location, setLocation] = useState('');
  const [personInput, setPersonInput] = useState('');
  const [people, setPeople] = useState<string[]>([]);
  const [activityName, setActivityName] = useState('');
  const [category, setCategory] = useState('');
  const [occasion, setOccasion] = useState('');
  const [mood, setMood] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const emojis = ['😄', '😊', '😐', '😔', '😩'];

  const handleAddPerson = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && personInput.trim()) {
      e.preventDefault();
      setPeople([...people, personInput.trim()]);
      setPersonInput('');
    }
  };

  const removePerson = (index: number) => {
    setPeople(people.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    console.log('Saved Activity Data:', {
      date, time, duration, location, people, activityName, category, occasion, mood, notes
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="space-y-4">
          <div className="text-xs font-medium text-muted-foreground">
            Prototype 2 of 5 · Card Sections
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Add Activity</h1>
          
          {/* SectionNav tabs */}
          <nav className="flex space-x-1 bg-muted p-1 rounded-xl max-w-fit overflow-x-auto">
            <Link href="/activity-timeline" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg transition-colors">
              Timeline
            </Link>
            <Link href="/activity-timeline/day" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg transition-colors">
              Day at a Glance
            </Link>
            <Link href="/activity-timeline/add-activity" className="px-4 py-2 text-sm font-medium bg-background text-foreground shadow-sm rounded-lg transition-colors">
              Add Activity
            </Link>
          </nav>
        </div>

        {/* Main Form Card */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/40 space-y-8">
          
          {/* 1. WHEN */}
          <section className="space-y-3">
            <h2 className="text-[9px] font-black tracking-widest text-muted-foreground/50 uppercase">When</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-11 bg-muted rounded-xl border-none pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-foreground"
                />
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="time" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full h-11 bg-muted rounded-xl border-none pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-foreground"
                />
              </div>
              <div className="relative">
                <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="number" 
                  placeholder="Duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full h-11 bg-muted rounded-xl border-none pl-10 pr-12 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-foreground"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">mins</span>
              </div>
            </div>
          </section>

          <div className="border-t border-border/20" />

          {/* 2. WHERE */}
          <section className="space-y-3">
            <h2 className="text-[9px] font-black tracking-widest text-muted-foreground/50 uppercase">Where</h2>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Add location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full h-11 bg-muted rounded-xl border-none pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </section>

          <div className="border-t border-border/20" />

          {/* 3. WHO */}
          <section className="space-y-3">
            <h2 className="text-[9px] font-black tracking-widest text-muted-foreground/50 uppercase">Who</h2>
            <div className="space-y-3">
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Type a name and press Enter..."
                  value={personInput}
                  onChange={(e) => setPersonInput(e.target.value)}
                  onKeyDown={handleAddPerson}
                  className="w-full h-11 bg-muted rounded-xl border-none pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-foreground placeholder:text-muted-foreground"
                />
              </div>
              {people.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {people.map((person, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-full text-sm font-medium">
                      {person}
                      <button onClick={() => removePerson(idx)} className="hover:bg-indigo-100 dark:hover:bg-indigo-800/50 rounded-full p-0.5 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <div className="border-t border-border/20" />

          {/* 4. WHAT */}
          <section className="space-y-3">
            <h2 className="text-[9px] font-black tracking-widest text-muted-foreground/50 uppercase">What</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Activity Name"
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  className="w-full h-11 bg-muted rounded-xl border-none pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 bg-muted rounded-xl border-none pl-10 pr-10 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all appearance-none text-foreground"
                >
                  <option value="" disabled>Select Category</option>
                  <option value="leisure">Leisure</option>
                  <option value="work">Work</option>
                  <option value="health">Health</option>
                  <option value="social">Social</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </section>

          <div className="border-t border-border/20" />

          {/* 5. WHY */}
          <section className="space-y-3">
            <h2 className="text-[9px] font-black tracking-widest text-muted-foreground/50 uppercase">Why</h2>
            <div className="relative">
              <Smile className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Occasion (e.g. Birthday, Anniversary)"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full h-11 bg-muted rounded-xl border-none pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </section>

          <div className="border-t border-border/20" />

          {/* 6. MOOD */}
          <section className="space-y-3">
            <h2 className="text-[9px] font-black tracking-widest text-muted-foreground/50 uppercase">Mood</h2>
            <div className="flex items-center gap-3">
              {emojis.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => setMood(idx)}
                  className={`text-2xl w-11 h-11 rounded-xl flex items-center justify-center transition-all ${mood === idx ? 'bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-600 shadow-sm' : 'bg-muted hover:bg-muted/80 border-2 border-transparent'}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </section>

          <div className="border-t border-border/20" />

          {/* 7. NOTES */}
          <section className="space-y-3">
            <h2 className="text-[9px] font-black tracking-widest text-muted-foreground/50 uppercase">Notes</h2>
            <textarea 
              placeholder="Add any additional details here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-muted rounded-xl border-none p-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all resize-none min-h-[100px] text-foreground placeholder:text-muted-foreground"
            />
          </section>

        </div>

        {/* Action Bar */}
        <div className="flex justify-center pt-4 pb-12">
          <button 
            onClick={handleSave}
            className="w-full max-w-xs h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Save Activity
          </button>
        </div>

      </div>
    </div>
  );
}
