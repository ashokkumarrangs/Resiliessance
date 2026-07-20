"use client";

import React, { useState, useEffect } from "react";
import { X, Clock, Check } from "lucide-react";
import { format, subMinutes, subHours } from "date-fns";

interface TaskCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (completedAt: string) => void;
  taskTitle: string;
}

export function TaskCompletionModal({
  isOpen,
  onClose,
  onConfirm,
  taskTitle
}: TaskCompletionModalProps) {
  const [option, setOption] = useState<"now" | "15m" | "1h" | "custom">("now");
  const [customDateTime, setCustomDateTime] = useState("");

  useEffect(() => {
    if (isOpen) {
      setOption("now");
      setCustomDateTime(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let completedAtISO = new Date().toISOString();

    if (option === "15m") {
      completedAtISO = subMinutes(new Date(), 15).toISOString();
    } else if (option === "1h") {
      completedAtISO = subHours(new Date(), 1).toISOString();
    } else if (option === "custom" && customDateTime) {
      completedAtISO = new Date(customDateTime).toISOString();
    }

    onConfirm(completedAtISO);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-dm-sans animate-fadeIn">
      <div className="bg-card w-full max-w-sm rounded-2xl border border-border/40 shadow-2xl overflow-hidden p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={16} className="text-primary" />
              Complete Task
            </h3>
            <p className="text-xs text-muted-foreground font-bold">
              When did you finish this?
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

        {/* Task Name */}
        <div className="bg-muted/30 p-3 rounded-lg border border-border/20">
          <p className="text-xs font-bold text-foreground line-clamp-2">
            {taskTitle}
          </p>
        </div>

        {/* Options Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            {/* Quick Option: Now */}
            <button
              type="button"
              onClick={() => setOption("now")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-bold transition-all
                ${option === "now" 
                  ? "bg-primary/5 border-primary text-primary" 
                  : "border-border/30 text-muted-foreground hover:bg-muted/30"}`}
            >
              <span>Just Now</span>
              {option === "now" && <Check size={14} />}
            </button>

            {/* Quick Option: 15m ago */}
            <button
              type="button"
              onClick={() => setOption("15m")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-bold transition-all
                ${option === "15m" 
                  ? "bg-primary/5 border-primary text-primary" 
                  : "border-border/30 text-muted-foreground hover:bg-muted/30"}`}
            >
              <span>15 minutes ago</span>
              {option === "15m" && <Check size={14} />}
            </button>

            {/* Quick Option: 1h ago */}
            <button
              type="button"
              onClick={() => setOption("1h")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-bold transition-all
                ${option === "1h" 
                  ? "bg-primary/5 border-primary text-primary" 
                  : "border-border/30 text-muted-foreground hover:bg-muted/30"}`}
            >
              <span>1 hour ago</span>
              {option === "1h" && <Check size={14} />}
            </button>

            {/* Custom Option Toggle */}
            <button
              type="button"
              onClick={() => setOption("custom")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-bold transition-all
                ${option === "custom" 
                  ? "bg-primary/5 border-primary text-primary" 
                  : "border-border/30 text-muted-foreground hover:bg-muted/30"}`}
            >
              <span>Custom Date & Time</span>
              {option === "custom" && <Check size={14} />}
            </button>
          </div>

          {/* Custom Date Time Input */}
          {option === "custom" && (
            <div className="space-y-1.5 animate-fadeIn">
              <label className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest px-1">
                Select Date & Time
              </label>
              <input
                type="datetime-local"
                value={customDateTime}
                onChange={(e) => setCustomDateTime(e.target.value)}
                className="w-full h-11 bg-muted border border-border/40 rounded-xl px-4 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20 outline-none"
                required
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full h-11 bg-primary text-primary-foreground rounded-xl font-black text-xs shadow-lg flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
          >
            Mark Completed
          </button>
        </form>
      </div>
    </div>
  );
}
