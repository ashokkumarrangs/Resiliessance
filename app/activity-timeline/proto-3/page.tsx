"use client";

import React, { useState } from "react";
import {
  MapPin,
  Users,
  Calendar,
  Clock,
  Timer,
  Tag,
  Smile,
  Plus,
  X,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";

export default function Proto3Page() {
  const [showMore, setShowMore] = useState(false);
  const [activityName, setActivityName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [mood, setMood] = useState("");
  const [location, setLocation] = useState("");
  const [people, setPeople] = useState<string[]>([]);
  const [personInput, setPersonInput] = useState("");
  const [occasion, setOccasion] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  const handleAddPerson = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && personInput.trim()) {
      e.preventDefault();
      setPeople([...people, personInput.trim()]);
      setPersonInput("");
    }
  };

  const removePerson = (index: number) => {
    setPeople(people.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    console.log("Saving:", { activityName, date, time, mood, location, people, occasion, category, duration, notes });
  };

  const moods = [
    { emoji: "😭", value: "awful" },
    { emoji: "🙁", value: "bad" },
    { emoji: "😐", value: "neutral" },
    { emoji: "🙂", value: "good" },
    { emoji: "🤩", value: "awesome" },
  ];

  return (
    <div className="min-h-screen bg-muted/30 pb-20 font-sans">
      <header className="bg-background border-b border-border/40 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-foreground">Add Activity</h1>
      </header>

      <div className="px-4 pt-4 pb-2 overflow-x-auto no-scrollbar">
        <div className="flex space-x-2">
          <Link href="/activity-timeline" className="px-4 py-2 text-sm rounded-full bg-background border border-border/40 text-muted-foreground whitespace-nowrap">Timeline</Link>
          <Link href="/activity-timeline/day" className="px-4 py-2 text-sm rounded-full bg-background border border-border/40 text-muted-foreground whitespace-nowrap">Day at a Glance</Link>
          <Link href="/activity-timeline/proto-3" className="px-4 py-2 text-sm rounded-full bg-indigo-600 text-white whitespace-nowrap">Add Activity</Link>
        </div>
      </div>

      <main className="px-4 pt-4 max-w-md mx-auto">
        <div className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider pl-1">Prototype 3 of 5 · Quick Log</div>

        <div className="bg-card rounded-2xl shadow-sm border border-border/40 p-5 flex flex-col space-y-4">
          <div>
            <input type="text" placeholder="What did you do?" value={activityName} onChange={(e) => setActivityName(e.target.value)} className="w-full text-xl font-bold bg-transparent border-none p-0 focus:outline-none focus:ring-0 placeholder:text-muted-foreground/50 text-foreground" autoFocus />
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-1 flex items-center bg-muted/50 rounded-lg border border-border/40 px-3 py-2">
              <Calendar className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent border-none p-0 text-sm focus:outline-none focus:ring-0 text-foreground" />
            </div>
            <div className="flex-1 flex items-center bg-muted/50 rounded-lg border border-border/40 px-3 py-2">
              <Clock className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-transparent border-none p-0 text-sm focus:outline-none focus:ring-0 text-foreground" />
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">Mood</div>
            <div className="flex justify-between items-center bg-muted/30 p-2 rounded-xl border border-border/40">
              {moods.map((m) => (
                <button key={m.value} onClick={() => setMood(m.value)} className={`p-2 rounded-lg text-lg transition-colors ${mood === m.value ? "bg-indigo-600/10 scale-110" : "hover:bg-muted"}`}>{m.emoji}</button>
              ))}
            </div>
          </div>

          <button onClick={() => setShowMore(!showMore)} className="flex items-center text-xs font-black text-indigo-600 mt-1 focus:outline-none w-fit">
            {showMore ? "Less" : "More Details"}
            {showMore ? <ChevronUp className="w-3 h-3 ml-1" /> : <Plus className="w-3 h-3 ml-1" />}
          </button>

          <div className={`transition-all duration-300 ease-in-out overflow-hidden flex flex-col space-y-4 ${showMore ? "max-h-[1000px] opacity-100 mt-2" : "max-h-0 opacity-0 m-0"}`}>
            <div className="flex items-center border-b border-border/40 pb-2 mt-2">
              <MapPin className="w-4 h-4 text-muted-foreground mr-3 shrink-0" />
              <input type="text" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full text-sm bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-foreground" />
            </div>

            <div className="border-b border-border/40 pb-2">
              <div className="flex items-center">
                <Users className="w-4 h-4 text-muted-foreground mr-3 shrink-0" />
                <div className="flex-1 flex flex-wrap gap-1 items-center">
                  {people.map((person, idx) => (
                    <span key={idx} className="inline-flex items-center bg-muted px-2 py-1 rounded-md text-xs text-foreground">
                      {person}
                      <button onClick={() => removePerson(idx)} className="ml-1 text-muted-foreground hover:text-foreground focus:outline-none"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                  <input type="text" placeholder={people.length === 0 ? "Who was with you?" : "Add person..."} value={personInput} onChange={(e) => setPersonInput(e.target.value)} onKeyDown={handleAddPerson} className="flex-1 text-sm bg-transparent border-none p-0 focus:outline-none focus:ring-0 min-w-[120px] text-foreground" />
                </div>
              </div>
            </div>

            <div className="flex items-center border-b border-border/40 pb-2">
              <Smile className="w-4 h-4 text-muted-foreground mr-3 shrink-0" />
              <input type="text" placeholder="Occasion (e.g. Birthday)" value={occasion} onChange={(e) => setOccasion(e.target.value)} className="w-full text-sm bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-foreground" />
            </div>

            <div className="flex items-center space-x-3 border-b border-border/40 pb-2">
              <div className="flex-1 flex items-center">
                <Tag className="w-4 h-4 text-muted-foreground mr-3 shrink-0" />
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full text-sm bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-foreground">
                  <option value="" disabled>Category</option>
                  <option value="work">Work</option>
                  <option value="leisure">Leisure</option>
                  <option value="health">Health</option>
                  <option value="social">Social</option>
                </select>
              </div>
              <div className="flex-1 flex items-center border-l border-border/40 pl-3">
                <Timer className="w-4 h-4 text-muted-foreground mr-3 shrink-0" />
                <input type="text" placeholder="Duration (e.g. 1h 30m)" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full text-sm bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-foreground" />
              </div>
            </div>

            <div className="pt-1">
              <textarea placeholder="Any other notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full text-sm bg-muted/30 rounded-xl border border-border/40 p-3 focus:outline-none focus:ring-1 focus:ring-indigo-600 resize-none text-foreground placeholder:text-muted-foreground" />
            </div>
          </div>
        </div>

        <button onClick={handleSave} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl mt-4 shadow-sm transition-colors flex items-center justify-center text-sm">
          Save Activity
        </button>
      </main>
    </div>
  );
}
