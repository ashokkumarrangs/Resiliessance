"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Repeat, Check } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: {
    title: string;
    due_date: string | null;
    recurrence_type: string;
    recurrence_interval: number;
    recurrence_days: number[] | null;
    recurrence_anchor: string | null;
  }) => void;
  task: {
    title: string;
    due_date?: string | null;
    due?: string | null; // support both
    recurrence_type?: string | null;
    recurrence_interval?: number | null;
    recurrence_days?: number[] | null;
    recurrence_anchor?: string | null;
  };
}

const WEEKDAYS = [
  { label: "Su", value: 0 },
  { label: "Mo", value: 1 },
  { label: "Tu", value: 2 },
  { label: "We", value: 3 },
  { label: "Th", value: 4 },
  { label: "Fr", value: 5 },
  { label: "Sa", value: 6 },
];

export function TaskEditModal({ isOpen, onClose, onSave, task }: TaskEditModalProps) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [recurrenceType, setRecurrenceType] = useState("none");
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen && task) {
      setTitle(task.title || "");
      
      const rawDue = task.due_date || task.due || "";
      if (rawDue) {
        try {
          const parsed = parseISO(rawDue);
          if (isValid(parsed)) {
            setDueDate(format(parsed, "yyyy-MM-dd"));
          } else {
            setDueDate("");
          }
        } catch {
          setDueDate("");
        }
      } else {
        setDueDate("");
      }

      setRecurrenceType(task.recurrence_type || "none");
      setRecurrenceInterval(task.recurrence_interval || 1);
      setRecurrenceDays(task.recurrence_days || []);
    }
  }, [isOpen, task]);

  if (!isOpen) return null;

  const handleToggleDay = (dayValue: number) => {
    setRecurrenceDays((prev) =>
      prev.includes(dayValue)
        ? prev.filter((d) => d !== dayValue)
        : [...prev, dayValue].sort((a, b) => a - b)
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Anchor is set to the due date if provided, otherwise today
    const anchor = dueDate || format(new Date(), "yyyy-MM-dd");

    onSave({
      title: title.trim(),
      due_date: dueDate || null,
      recurrence_type: recurrenceType,
      recurrence_interval: recurrenceInterval,
      recurrence_days: recurrenceType === "weekly" ? recurrenceDays : null,
      recurrence_anchor: recurrenceType !== "none" ? anchor : null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-dm-sans animate-fadeIn">
      <div className="bg-card w-full max-w-sm rounded-2xl border border-border/40 shadow-2xl overflow-hidden p-6 space-y-5">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
              Edit Task Details
            </h3>
            <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wide">
              Configure deadlines & repetition
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-muted-foreground/40 hover:text-foreground active:scale-95 transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4 text-left">
          {/* Task Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest px-1">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Daily Standup"
              className="w-full h-11 bg-muted/30 border border-border/40 rounded-xl px-4 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary/10 focus:bg-card outline-none transition-all"
              required
            />
          </div>

          {/* Deadline / Due Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest px-1 flex items-center gap-1">
              <Calendar size={12} className="text-primary" /> Deadline (Optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-11 bg-muted/30 border border-border/40 rounded-xl px-4 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary/10 focus:bg-card outline-none transition-all"
            />
          </div>

          {/* Recurrence Settings */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest px-1 flex items-center gap-1">
              <Repeat size={12} className="text-primary" /> Repeat Schedule
            </label>
            <select
              value={recurrenceType}
              onChange={(e) => setRecurrenceType(e.target.value)}
              className="w-full h-11 bg-muted/30 border border-border/40 rounded-xl px-4 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary/10 focus:bg-card outline-none transition-all"
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Interval setting for Daily / Monthly */}
          {recurrenceType !== "none" && recurrenceType !== "weekly" && (
            <div className="space-y-1.5 animate-fadeIn">
              <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest px-1">
                Repeat Every
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={recurrenceInterval}
                  onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                  className="w-20 h-11 bg-muted/30 border border-border/40 rounded-xl px-4 text-xs font-bold text-foreground text-center focus:ring-2 focus:ring-primary/10 focus:bg-card outline-none transition-all"
                />
                <span className="text-xs font-bold text-muted-foreground">
                  {recurrenceType === "daily" ? (recurrenceInterval === 1 ? "day" : "days") : (recurrenceInterval === 1 ? "month" : "months")}
                </span>
              </div>
            </div>
          )}

          {/* Weekly Days selection */}
          {recurrenceType === "weekly" && (
            <div className="space-y-2 animate-fadeIn">
              <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest px-1">
                Repeat On Days
              </label>
              <div className="flex justify-between gap-1">
                {WEEKDAYS.map((day) => {
                  const isSelected = recurrenceDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => handleToggleDay(day.value)}
                      className={`w-9 h-9 rounded-xl border text-xs font-black transition-all flex items-center justify-center cursor-pointer
                        ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-muted/15 border-border/30 text-muted-foreground hover:bg-muted/30"
                        }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 border border-border/50 text-foreground/80 hover:bg-muted/20 rounded-xl font-bold text-xs flex items-center justify-center active:scale-[0.98] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-11 bg-primary text-primary-foreground rounded-xl font-black text-xs shadow-lg flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
            >
              Save Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
