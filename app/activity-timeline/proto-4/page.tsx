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
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";

// Types
type Category = "Dining" | "Social" | "Travel" | "Celebration" | "Fitness" | "Entertainment" | "Work" | "Other" | null;
type Mood = "Great" | "Good" | "Okay" | "Not great" | null;

interface FormData {
  activityName: string;
  category: Category;
  date: string;
  time: string;
  duration: string;
  location: string;
  people: string[];
  occasion: string;
  mood: Mood;
  notes: string;
}

const CATEGORIES = [
  { label: "Dining", emoji: "🍽️" },
  { label: "Social", emoji: "👥" },
  { label: "Travel", emoji: "✈️" },
  { label: "Celebration", emoji: "🎉" },
  { label: "Fitness", emoji: "💪" },
  { label: "Entertainment", emoji: "🎬" },
  { label: "Work", emoji: "💼" },
  { label: "Other", emoji: "🌀" },
];

const OCCASIONS = [
  { label: "Birthday", emoji: "🎂" },
  { label: "Anniversary", emoji: "💍" },
  { label: "Catch-up", emoji: "☕" },
  { label: "Date Night", emoji: "🌙" },
  { label: "Farewell", emoji: "👋" },
  { label: "Other", emoji: "" },
];

const MOODS = [
  { label: "Great", emoji: "😄" },
  { label: "Good", emoji: "🙂" },
  { label: "Okay", emoji: "😐" },
  { label: "Not great", emoji: "😔" },
];

export default function WizardStepsProtoPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    activityName: "",
    category: null,
    date: "",
    time: "",
    duration: "",
    location: "",
    people: [],
    occasion: "",
    mood: null,
    notes: "",
  });

  const [personInput, setPersonInput] = useState("");

  const totalSteps = 7;

  const handleNext = () => {
    if (step < totalSteps) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const updateForm = (key: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddPerson = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && personInput.trim()) {
      e.preventDefault();
      updateForm("people", [...formData.people, personInput.trim()]);
      setPersonInput("");
    }
  };

  const handleRemovePerson = (index: number) => {
    updateForm(
      "people",
      formData.people.filter((_, i) => i !== index)
    );
  };

  const handleLogActivity = () => {
    console.log("Activity logged:", formData);
    alert("Activity logged (check console)");
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black text-foreground mb-6">What did you do?</h2>
            <div className="space-y-6">
              <div>
                <input
                  type="text"
                  placeholder="e.g. Dinner at Mario's"
                  value={formData.activityName}
                  onChange={(e) => updateForm("activityName", e.target.value)}
                  className="w-full h-14 bg-muted rounded-xl border-none px-4 text-base focus:ring-2 focus:ring-indigo-600/50 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.label}
                    onClick={() => updateForm("category", cat.label as Category)}
                    className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-colors ${
                      formData.category === cat.label
                        ? "bg-indigo-600/10 border border-indigo-600/30 text-indigo-600"
                        : "bg-muted border border-transparent text-foreground hover:bg-muted/80"
                    }`}
                  >
                    <span className="text-2xl">{cat.emoji}</span>
                    <span className="text-xs font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black text-foreground mb-6">When was it?</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => updateForm("date", e.target.value)}
                    className="w-full h-11 bg-muted rounded-xl border-none pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-600/50 outline-none"
                  />
                </div>
                <div className="flex-1 relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => updateForm("time", e.target.value)}
                    className="w-full h-11 bg-muted rounded-xl border-none pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-600/50 outline-none"
                  />
                </div>
              </div>
              <div className="relative">
                <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Duration (e.g. 2 hours)"
                  value={formData.duration}
                  onChange={(e) => updateForm("duration", e.target.value)}
                  className="w-full h-11 bg-muted rounded-xl border-none pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-600/50 outline-none"
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black text-foreground mb-6">Where were you?</h2>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search location..."
                value={formData.location}
                onChange={(e) => updateForm("location", e.target.value)}
                className="w-full h-14 bg-muted rounded-xl border-none pl-12 pr-4 text-base focus:ring-2 focus:ring-indigo-600/50 outline-none"
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-foreground">Who were you with?</h2>
              <button onClick={handleNext} className="text-xs text-muted-foreground/50 hover:text-muted-foreground">Skip</button>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Type a name and press Enter"
                  value={personInput}
                  onChange={(e) => setPersonInput(e.target.value)}
                  onKeyDown={handleAddPerson}
                  className="w-full h-11 bg-muted rounded-xl border-none pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-600/50 outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.people.map((person, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-indigo-600/10 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium">
                    {person}
                    <button onClick={() => handleRemovePerson(i)} className="text-indigo-400 hover:text-indigo-600">&times;</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-foreground">Any special occasion?</h2>
              <button onClick={handleNext} className="text-xs text-muted-foreground/50 hover:text-muted-foreground">Skip</button>
            </div>
            <div className="space-y-6">
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Occasion name"
                  value={formData.occasion}
                  onChange={(e) => updateForm("occasion", e.target.value)}
                  className="w-full h-11 bg-muted rounded-xl border-none pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-600/50 outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {OCCASIONS.map((occ) => (
                  <button
                    key={occ.label}
                    onClick={() => updateForm("occasion", occ.label)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      formData.occasion === occ.label
                        ? "bg-indigo-600 text-white"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {occ.emoji} {occ.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-foreground">How did it feel?</h2>
              <button onClick={handleNext} className="text-xs text-muted-foreground/50 hover:text-muted-foreground">Skip</button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {MOODS.map((mood) => (
                  <button
                    key={mood.label}
                    onClick={() => updateForm("mood", mood.label as Mood)}
                    className={`p-4 rounded-xl flex flex-col items-center gap-3 transition-colors ${
                      formData.mood === mood.label
                        ? "bg-indigo-600/10 border border-indigo-600/30 text-indigo-600"
                        : "bg-muted border border-transparent text-foreground hover:bg-muted/80"
                    }`}
                  >
                    <span className="text-4xl">{mood.emoji}</span>
                    <span className="text-sm font-medium">{mood.label}</span>
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Any other notes? (optional)"
                value={formData.notes}
                onChange={(e) => updateForm("notes", e.target.value)}
                className="w-full h-32 bg-muted rounded-xl border-none p-4 text-sm focus:ring-2 focus:ring-indigo-600/50 outline-none resize-none"
              />
            </div>
          </div>
        );
      case 7:
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black text-foreground mb-6">Summary</h2>
            <div className="bg-card shadow-sm border border-border/40 rounded-2xl p-5 space-y-4">
               <div className="flex justify-between items-center pb-4 border-b border-border/40">
                  <div className="flex items-center gap-3">
                     <span className="text-3xl">{CATEGORIES.find(c => c.label === formData.category)?.emoji || '✨'}</span>
                     <div>
                        <h3 className="font-bold text-lg">{formData.activityName || 'Unnamed Activity'}</h3>
                        <p className="text-sm text-muted-foreground">{formData.category || 'No Category'}</p>
                     </div>
                  </div>
                  {formData.mood && (
                     <span className="text-3xl">{MOODS.find(m => m.label === formData.mood)?.emoji}</span>
                  )}
               </div>
               
               <div className="space-y-3 pt-2">
                  <SummaryRow icon={<Calendar className="w-4 h-4" />} label="When" value={[formData.date, formData.time].filter(Boolean).join(' at ') || 'Not specified'} />
                  {formData.duration && <SummaryRow icon={<Timer className="w-4 h-4" />} label="Duration" value={formData.duration} />}
                  <SummaryRow icon={<MapPin className="w-4 h-4" />} label="Where" value={formData.location || 'Not specified'} />
                  {formData.people.length > 0 && <SummaryRow icon={<Users className="w-4 h-4" />} label="With" value={formData.people.join(', ')} />}
                  {formData.occasion && <SummaryRow icon={<Tag className="w-4 h-4" />} label="Occasion" value={formData.occasion} />}
                  {formData.notes && (
                    <div className="mt-4 pt-4 border-t border-border/40">
                      <p className="text-sm text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{formData.notes}</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header / Nav Mockup */}
      <header className="border-b border-border/40 bg-card">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <h1 className="text-lg font-bold">Add Activity</h1>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold bg-muted px-2 py-1 rounded-md">
            Prototype 4 of 5 · Wizard Steps
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 flex gap-6 mt-2 overflow-x-auto no-scrollbar">
          {["Timeline", "Day at a Glance", "Add Activity"].map((tab, i) => (
            <div
              key={tab}
              className={`pb-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                i === 2 ? "border-indigo-600 text-indigo-600" : "border-transparent text-muted-foreground"
              }`}
            >
              {tab}
            </div>
          ))}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8 sm:py-12">
        {/* Progress bar */}
        <div className="flex gap-2 mb-10">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i < step ? "bg-indigo-600" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Navigation & Content Wrapper */}
        <div className="relative min-h-[400px]">
          {/* Top navigation row */}
          {step > 1 && (
            <button
              onClick={handleBack}
              className="absolute -top-12 left-0 flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </button>
          )}

          {/* Form Step */}
          {renderStep()}
        </div>

        {/* Bottom Actions */}
        <div className="mt-12 flex justify-end">
          {step < totalSteps ? (
            <button
              onClick={handleNext}
              className="flex items-center bg-indigo-600 text-white rounded-xl px-8 h-11 text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          ) : (
            <button
              onClick={handleLogActivity}
              className="flex items-center bg-indigo-600 text-white rounded-xl px-8 h-11 text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Log Activity
              <Check className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
