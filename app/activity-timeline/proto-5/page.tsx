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
  Eye,
  Activity,
} from "lucide-react";

const CATEGORIES = [
  "Social",
  "Dining",
  "Travel",
  "Celebration",
  "Fitness",
  "Entertainment",
  "Work",
  "Other",
];

const CATEGORY_COLORS: Record<string, string> = {
  Social: "bg-blue-500",
  Dining: "bg-rose-500",
  Travel: "bg-amber-500",
  Celebration: "bg-purple-500",
  Fitness: "bg-emerald-500",
  Entertainment: "bg-indigo-500",
  Work: "bg-slate-500",
  Other: "bg-gray-500",
};

const MOODS = [
  { emoji: "🤩", label: "Amazing" },
  { emoji: "😊", label: "Good" },
  { emoji: "😐", label: "Okay" },
  { emoji: "😔", label: "Bad" },
  { emoji: "😡", label: "Terrible" },
];

export default function AddActivityTimelinePreviewPage() {
  const [formData, setFormData] = useState({
    name: "",
    category: "Other",
    date: "",
    time: "",
    duration: "",
    location: "",
    people: "",
    occasion: "",
    mood: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Activity Saved:", formData);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Prototype 5 of 5 · Timeline Preview
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Add Activity</h1>
        </div>

        {/* Section Nav */}
        <nav className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 border-b border-border/40">
          <a
            href="/activity-timeline"
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap rounded-lg hover:bg-muted/50 transition-colors"
          >
            Timeline
          </a>
          <a
            href="/activity-timeline/day"
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap rounded-lg hover:bg-muted/50 transition-colors"
          >
            Day at a Glance
          </a>
          <a
            href="/activity-timeline/add-activity"
            className="px-4 py-2 text-sm font-medium bg-muted text-foreground whitespace-nowrap rounded-lg"
          >
            Add Activity
          </a>
        </nav>

        {/* Main Content */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Form Column */}
          <div className="flex-1">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Activity Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="E.g., Dinner at Mario's"
                    className="w-full h-10 bg-muted rounded-xl border-none px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Category
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full h-10 bg-muted rounded-xl border-none pl-10 pr-3 text-sm appearance-none outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Duration
                    </label>
                    <div className="relative">
                      <Timer className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <input
                        type="text"
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        placeholder="E.g., 2h 30m"
                        className="w-full h-10 bg-muted rounded-xl border-none pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="w-full h-10 bg-muted rounded-xl border-none pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Time
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <input
                        type="time"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        className="w-full h-10 bg-muted rounded-xl border-none pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Where did this happen?"
                      className="w-full h-10 bg-muted rounded-xl border-none pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    People
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      name="people"
                      value={formData.people}
                      onChange={handleChange}
                      placeholder="Add people (comma separated)"
                      className="w-full h-10 bg-muted rounded-xl border-none pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Occasion
                  </label>
                  <div className="relative">
                    <Activity className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      name="occasion"
                      value={formData.occasion}
                      onChange={handleChange}
                      placeholder="E.g., Birthday, Anniversary, Casual"
                      className="w-full h-10 bg-muted rounded-xl border-none pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Mood
                  </label>
                  <div className="flex justify-between max-w-sm">
                    {MOODS.map((mood) => (
                      <button
                        key={mood.label}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, mood: mood.emoji }))
                        }
                        className={`text-2xl p-2 rounded-xl transition-transform hover:scale-110 ${
                          formData.mood === mood.emoji
                            ? "bg-indigo-100 scale-110 dark:bg-indigo-900/30"
                            : "opacity-60 hover:opacity-100"
                        }`}
                        title={mood.label}
                      >
                        {mood.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Any special memories or notes?"
                    className="w-full h-24 bg-muted rounded-xl border-none p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm"
              >
                Save Activity
              </button>
            </form>
          </div>

          {/* Live Preview Column (Hidden on mobile) */}
          <div className="w-72 shrink-0 hidden md:block">
            <div className="sticky top-8">
              <div className="flex items-center gap-2 mb-4 text-xs font-medium text-muted-foreground">
                <Eye className="w-4 h-4" />
                Live Preview
              </div>

              <div className="bg-card border border-border/30 rounded-xl p-4 shadow-sm relative overflow-hidden">
                <div className="flex gap-4">
                  {/* Timeline Dot & Line */}
                  <div className="flex flex-col items-center mt-1">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        CATEGORY_COLORS[formData.category] || "bg-gray-500"
                      }`}
                    />
                    <div className="w-px h-16 bg-border/50 mt-2" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {formData.name || "Untitled Activity"}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      {formData.time || "Time TBD"}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      Activity
                      {formData.location && ` · ${formData.location}`}
                      {formData.people && ` · ${formData.people}`}
                      {formData.occasion && ` · ${formData.occasion}`}
                      {formData.mood && ` · ${formData.mood}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ghosted earlier entries text */}
              <div className="mt-4 flex items-center justify-center">
                <div className="w-px h-6 bg-border/40 border-dashed" />
              </div>
              <div className="text-center text-xs text-muted-foreground/60 italic">
                Earlier entries...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
