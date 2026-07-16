"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AlignJustify, Archive, ArrowUpCircle, CalendarDays, CheckCircle2, ChevronDown, ChevronUp, Clock, Flame, GraduationCap, ListOrdered, Loader2, Plus, Target, Trophy, X, Zap , BarChart2 } from "lucide-react";
import { format, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { SectionNav } from "@/components/SectionNav";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SkillItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string | null;
  status: "focus" | "archived" | "queued";
  focus_month: string | null;
  queue_order: number;
  target_sessions_per_month: number;
  created_at: string;
}

interface SkillLog {
  id: string;
  skill_id: string;
  date: string;
  duration_minutes: number;
  notes: string | null;
  mood: "great" | "good" | "okay" | "hard";
  created_at: string;
}

// ─── Mood config ──────────────────────────────────────────────────────────────
const MOOD_CONFIG = {
  great: { emoji: "🔥", label: "Great", color: "text-orange-400" },
  good:  { emoji: "💪", label: "Good",  color: "text-emerald-400" },
  okay:  { emoji: "😐", label: "Okay",  color: "text-amber-400" },
  hard:  { emoji: "😓", label: "Hard",  color: "text-rose-400" },
};

const PRESET_ICONS = ["🎯","📚","🥊","🥋","🎸","🏊","🇪🇸","🎨","💻","🏃","🧘","🎹","✍️","📷","🌱"];
const PRESET_COLORS = ["#3d4a3e","#c26d5c","#2b5c8f","#7c5c96","#10b981","#f59e0b","#3b82f6","#ec4899"];

// ─── Radial Progress Ring ─────────────────────────────────────────────────────
function ProgressRing({ value, max, color, size = 140 }: { value: number; max: number; color: string; size?: number }) {
  const r = (size - 20) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circ * (1 - pct);
  const ringColor = (max > 0 && value >= max) ? "#10b981" : color;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={12} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={ringColor} strokeWidth={12}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }} />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SkillsPage() {
  const router = useRouter();
  const tab: any = "Focus";
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [logs, setLogs] = useState<SkillLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedArchive, setExpandedArchive] = useState<Set<string>>(new Set());

  // Modals
  const [showLogModal, setShowLogModal] = useState(false);
  const [logTargetSkill, setLogTargetSkill] = useState<SkillItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPromoteConfirm, setShowPromoteConfirm] = useState<SkillItem | null>(null);

  // Log form
  const [logDate, setLogDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [logDuration, setLogDuration] = useState("45");
  const [logNotes, setLogNotes] = useState("");
  const [logMood, setLogMood] = useState<"great"|"good"|"okay"|"hard">("good");
  const [saving, setSaving] = useState(false);

  // Add skill form
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("🎯");
  const [newColor, setNewColor] = useState("#7c3aed");
  const [newDesc, setNewDesc] = useState("");
  const [newTarget, setNewTarget] = useState("20");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: s }, { data: l }] = await Promise.all([
      supabase.from("skill_items").select("*").order("queue_order"),
      supabase.from("skill_logs").select("*").order("date", { ascending: false }),
    ]);
    setSkills(s || []);
    setLogs(l || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const focusSkill = skills.find(s => s.status === "focus") || null;
  const archivedSkills = skills.filter(s => s.status === "archived");
  const queuedSkills = skills.filter(s => s.status === "queued").sort((a, b) => a.queue_order - b.queue_order);

  const getLogsForSkill = (skillId: string) => logs.filter(l => l.skill_id === skillId);

  const getFocusMonthLogs = (skill: SkillItem) => {
    if (!skill.focus_month) return getLogsForSkill(skill.id);
    const monthStart = format(startOfMonth(new Date(skill.focus_month)), "yyyy-MM-dd");
    const monthEnd   = format(endOfMonth(new Date(skill.focus_month)), "yyyy-MM-dd");
    return getLogsForSkill(skill.id).filter(l => l.date >= monthStart && l.date <= monthEnd);
  };

  const getSkillStats = (skill: SkillItem) => {
    const allLogs = getLogsForSkill(skill.id);
    const totalSessions = allLogs.length;
    const totalMinutes  = allLogs.reduce((s, l) => s + l.duration_minutes, 0);
    const lastLog       = allLogs[0];
    const daysSinceLast = lastLog ? differenceInDays(new Date(), new Date(lastLog.date)) : null;

    // Best streak
    let bestStreak = 0, cur = 0;
    const dates = [...new Set(allLogs.map(l => l.date))].sort();
    for (let i = 0; i < dates.length; i++) {
      if (i === 0 || differenceInDays(new Date(dates[i]), new Date(dates[i-1])) === 1) {
        cur++; bestStreak = Math.max(bestStreak, cur);
      } else { cur = 1; }
    }

    const activityLabel = daysSinceLast === null ? "No sessions yet"
      : daysSinceLast <= 7  ? "Still Active"
      : daysSinceLast <= 30 ? "Occasional"
      : `Inactive (${daysSinceLast}d)`;
    const activityColor = daysSinceLast === null ? "bg-muted/40 text-muted-foreground"
      : daysSinceLast <= 7  ? "bg-emerald-500/15 text-emerald-400"
      : daysSinceLast <= 30 ? "bg-amber-500/15 text-amber-400"
      : "bg-muted/30 text-muted-foreground";

    return { totalSessions, totalMinutes, bestStreak, lastLog, daysSinceLast, activityLabel, activityColor };
  };

  const daysLeftInFocus = () => {
    if (!focusSkill?.focus_month) return null;
    return differenceInDays(endOfMonth(new Date(focusSkill.focus_month)), new Date());
  };

  // ── Actions ──────────────────────────────────────────────────────────────────
  const openLogModal = (skill: SkillItem) => {
    setLogTargetSkill(skill);
    setLogDate(format(new Date(), "yyyy-MM-dd"));
    setLogDuration("45"); setLogNotes(""); setLogMood("good");
    setShowLogModal(true);
  };

  const submitLog = async () => {
    if (!logTargetSkill) return;
    setSaving(true);
    const { error } = await supabase.from("skill_logs").insert({
      skill_id: logTargetSkill.id,
      date: logDate,
      duration_minutes: parseInt(logDuration) || 30,
      notes: logNotes || null,
      mood: logMood,
    });
    setSaving(false);
    if (error) { toast.error("Failed to save session"); return; }
    toast.success("Session logged! 💪");
    setShowLogModal(false);
    fetchData();
  };

  const submitAddSkill = async () => {
    if (!newName.trim()) { toast.error("Please enter a skill name"); return; }
    setSaving(true);
    const maxOrder = queuedSkills.length > 0 ? Math.max(...queuedSkills.map(s => s.queue_order)) + 1 : 0;
    const { error } = await supabase.from("skill_items").insert({
      name: newName.trim(), icon: newIcon, color: newColor,
      description: newDesc || null, status: "queued",
      queue_order: maxOrder, target_sessions_per_month: parseInt(newTarget) || 20,
    });
    setSaving(false);
    if (error) { toast.error("Failed to add skill"); return; }
    toast.success(`${newIcon} ${newName} added to queue!`);
    setNewName(""); setNewIcon("🎯"); setNewColor("#7c3aed"); setNewDesc(""); setNewTarget("20");
    setShowAddModal(false);
    fetchData();
  };

  const promoteToFocus = async (skill: SkillItem) => {
    setSaving(true);
    const now = new Date();
    const thisMonth = format(startOfMonth(now), "yyyy-MM-dd");

    // Archive current focus if exists
    if (focusSkill) {
      await supabase.from("skill_items").update({ status: "archived" }).eq("id", focusSkill.id);
    }

    // Promote selected skill to focus
    await supabase.from("skill_items").update({
      status: "focus", focus_month: thisMonth, queue_order: 0,
    }).eq("id", skill.id);

    setSaving(false);
    toast.success(`🎯 ${skill.icon} ${skill.name} is now your Focus Skill!`);
    setShowPromoteConfirm(null);
    router.push("/skills/focus");
    fetchData();
  };

  const moveQueue = async (skill: SkillItem, dir: "up" | "down") => {
    const idx = queuedSkills.findIndex(s => s.id === skill.id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= queuedSkills.length) return;
    const swap = queuedSkills[swapIdx];
    await Promise.all([
      supabase.from("skill_items").update({ queue_order: swap.queue_order }).eq("id", skill.id),
      supabase.from("skill_items").update({ queue_order: skill.queue_order }).eq("id", swap.id),
    ]);
    fetchData();
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="animate-spin text-primary" size={28} />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 font-dm-sans">
      <div className="max-w-lg mx-auto w-full p-4 md:p-6">
        <PageHeader title="Skills" >
        <div className="flex items-center gap-2">

          <Link 
            href="/reports/skills" 
            className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm text-muted-foreground/60 hover:text-primary border border-border/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
            title="View Reports"
          >
            <BarChart2 className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Link>
        </div>
      </PageHeader>

      <div className="-mt-2 mb-6">
        <SectionNav 
          tabs={[
            { title: "Focus", icon: <Target size={16} />, isActive: tab === "Focus", onClick: () => router.push("/skills/focus") },
            { title: "Plan", icon: <CalendarDays size={16} />, isActive: tab === "Plan", onClick: () => router.push("/skills/plan") },
            { title: "Archive", icon: <Archive size={16} />, isActive: tab === "Archive", onClick: () => router.push("/skills/archive") }
          ]}
        />
      </div>

      {/* ── FOCUS TAB ─────────────────────────────────────────────────────────── */}
      {tab === "Focus" && (
        <div className="space-y-5">
          {focusSkill ? (
            <>
              {/* Hero Card */}
              <div className="relative rounded-3xl overflow-hidden p-6"
                style={{ background: `linear-gradient(135deg, ${focusSkill.color}cc 0%, ${focusSkill.color}44 100%)` }}>
                <div className="absolute inset-0 bg-black/30" />
                <div className="relative z-10 flex flex-col items-center text-center gap-3">
                  <div className="text-[10px] font-black uppercase tracking-[4px] text-white/60">
                    Focus · {focusSkill.focus_month ? format(new Date(focusSkill.focus_month), "MMMM yyyy") : "Active"}
                  </div>
                  <div className="text-5xl">{focusSkill.icon}</div>
                  <div className="text-3xl font-black text-white">{focusSkill.name}</div>
                  {focusSkill.description && (
                    <div className="text-[11px] text-white/60 font-medium">{focusSkill.description}</div>
                  )}

                  {/* Progress Ring */}
                  <div className="relative flex items-center justify-center mt-1">
                    <ProgressRing
                      value={getFocusMonthLogs(focusSkill).length}
                      max={focusSkill.target_sessions_per_month}
                      color={focusSkill.color}
                      size={148}
                    />
                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-black text-white">{getFocusMonthLogs(focusSkill).length}</span>
                      <span className="text-[10px] text-white/50 font-bold">/{focusSkill.target_sessions_per_month} Sessions</span>
                    </div>
                  </div>

                  {/* Bottom actions */}
                  <div className="flex items-center gap-3 w-full mt-2">
                    {daysLeftInFocus() !== null && (
                      <div className="flex items-center gap-1 bg-success/15 text-success text-[11px] font-black px-3 py-2 rounded-xl border border-success/20">
                        <CalendarDays size={12} />
                        {daysLeftInFocus()} days left
                      </div>
                    )}
                    <button onClick={() => openLogModal(focusSkill)}
                      className="flex-1 flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white font-black text-[13px] py-3 rounded-xl transition-all active:scale-95 border border-white/20">
                      <Plus size={16} /> Log Session
                    </button>
                  </div>
                </div>
              </div>

              {/* This Month's Sessions */}
              <div>
                <div className="text-[9px] font-black uppercase tracking-[4px] text-muted-foreground mb-3">
                  This Month's Sessions
                </div>
                {getFocusMonthLogs(focusSkill).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-[13px]">
                    No sessions yet this month — log your first one! 🚀
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getFocusMonthLogs(focusSkill).slice(0, 10).map(log => (
                      <div key={log.id} className="flex items-center gap-3 bg-muted/20 border border-border/30 rounded-xl p-3">
                        <div className="flex flex-col items-center justify-center bg-muted/40 rounded-lg px-2 py-1.5 min-w-[40px]">
                          <span className="text-[14px] font-black text-foreground">{format(new Date(log.date), "dd")}</span>
                          <span className="text-[8px] font-bold text-muted-foreground uppercase">{format(new Date(log.date), "MMM")}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                          <Clock size={11} /> {log.duration_minutes} min
                        </div>
                        <span className="text-base">{MOOD_CONFIG[log.mood].emoji}</span>
                        <span className="flex-1 text-[11px] text-foreground/70 font-medium truncate">{log.notes || MOOD_CONFIG[log.mood].label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Next in queue teaser */}
              {queuedSkills.length > 0 && (
                <button onClick={() => router.push("/skills/plan")}
                  className="w-full flex items-center justify-center gap-2 bg-muted/20 border border-border/30 rounded-xl py-3 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-all">
                  Next in Plan: {queuedSkills[0].icon} {queuedSkills[0].name} →
                </button>
              )}
            </>
          ) : (
            /* No focus skill */
            <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
              <div className="text-6xl">🎯</div>
              <div>
                <div className="text-xl font-black text-foreground">No Focus Skill Set</div>
                <div className="text-[13px] text-muted-foreground mt-1">Add a skill to your queue, then promote it to start tracking.</div>
              </div>
              <button onClick={() => router.push("/skills/plan")}
                style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                className="font-black text-[13px] px-6 py-3 rounded-xl active:scale-95 transition-all shadow-sm">
                Set Up Plan →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── ARCHIVE TAB ───────────────────────────────────────────────────────── */}
      {tab === "Archive" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-black text-foreground">Archived Skills</h2>
            <p className="text-[11px] text-muted-foreground">Your past focus months — still trackable</p>
          </div>

          {archivedSkills.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-[13px]">
              No archived skills yet. Complete a focus month to see skills here.
            </div>
          ) : (
            archivedSkills.map(skill => {
              const stats = getSkillStats(skill);
              const isExpanded = expandedArchive.has(skill.id);
              const skillLogs = getLogsForSkill(skill.id);
              return (
                <div key={skill.id} className="bg-card border border-border/40 rounded-2xl overflow-hidden"
                  style={{ borderLeft: `4px solid ${skill.color}` }}>
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{skill.icon}</span>
                        <div>
                          <div className="text-[15px] font-black text-foreground">{skill.name}</div>
                          {skill.focus_month && (
                            <div className="text-[9px] text-muted-foreground font-bold">
                              Focus Month: {format(new Date(skill.focus_month), "MMM yyyy")}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${stats.activityColor}`}>
                        {stats.activityLabel}
                      </span>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[
                        { val: stats.totalSessions, label: "Sessions", icon: <CheckCircle2 size={10}/> },
                        { val: `${Math.round(stats.totalMinutes/60)}h`, label: "Total Hours", icon: <Clock size={10}/> },
                        { val: `${stats.bestStreak}d`, label: "Best Streak", icon: <Flame size={10}/> },
                        { val: stats.lastLog ? format(new Date(stats.lastLog.date), "MMM d") : "—", label: "Last Practiced", icon: <CalendarDays size={10}/> },
                      ].map((s, i) => (
                        <div key={i} className="bg-muted/30 rounded-xl p-2 text-center">
                          <div className="text-[13px] font-black text-foreground">{s.val}</div>
                          <div className="text-[8px] text-muted-foreground font-bold uppercase mt-0.5 flex items-center justify-center gap-0.5">
                            {s.icon}{s.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button onClick={() => openLogModal(skill)}
                        className="flex-1 flex items-center justify-center gap-1 bg-muted/30 hover:bg-muted/60 text-foreground font-bold text-[11px] py-2 rounded-lg transition-all">
                        <Plus size={12} /> Log Session
                      </button>
                      <button onClick={() => setShowPromoteConfirm(skill)}
                        className="flex-1 flex items-center justify-center gap-1 bg-primary/20 hover:bg-primary/30 text-primary font-black text-[11px] py-2 rounded-lg transition-all">
                        🎯 Promote
                      </button>
                      <button onClick={() => {
                        const next = new Set(expandedArchive);
                        isExpanded ? next.delete(skill.id) : next.add(skill.id);
                        setExpandedArchive(next);
                      }} className="flex items-center gap-1 px-3 bg-muted/20 hover:bg-muted/40 text-muted-foreground font-bold text-[11px] py-2 rounded-lg transition-all">
                        History {isExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                      </button>
                    </div>

                    {/* Expanded history */}
                    {isExpanded && (
                      <div className="mt-3 space-y-1.5 border-t border-border/30 pt-3">
                        {skillLogs.length === 0 ? (
                          <div className="text-center text-muted-foreground text-[12px] py-3">No sessions logged yet</div>
                        ) : skillLogs.slice(0, 15).map(log => (
                          <div key={log.id} className="flex items-center gap-2.5 py-2 border-b border-border/20 last:border-0">
                            <span className="text-[11px] font-black text-muted-foreground min-w-[48px]">
                              {format(new Date(log.date), "dd MMM")}
                            </span>
                            <span className="text-[11px] font-bold text-foreground/70">{log.duration_minutes}m</span>
                            <span>{MOOD_CONFIG[log.mood].emoji}</span>
                            <span className="flex-1 text-[11px] text-foreground/50 truncate">{log.notes || MOOD_CONFIG[log.mood].label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── PLAN (QUEUE) TAB ─────────────────────────────────────────────────────────── */}
      {tab === "Plan" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-black text-foreground">Up Next</h2>
            <p className="text-[11px] text-muted-foreground">Plan your focus skills months ahead</p>
          </div>

          {queuedSkills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-[13px]">
              No skills in queue. Add one below!
            </div>
          ) : (
            <div className="space-y-3">
              {queuedSkills.map((skill, idx) => (
                <div key={skill.id}
                  className={`bg-card border rounded-2xl p-4 flex items-center gap-3 transition-all ${ idx === 0 ? "border-primary/40 shadow-lg shadow-primary/5" : "border-border/40" }`}>
                  {/* Drag handle */}
                  <div className="flex flex-col gap-1 text-muted-foreground/40">
                    <AlignJustify size={14} />
                  </div>

                  {/* Number badge */}
                  <div 
                    style={idx === 0 ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' } : {}}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 ${ idx !== 0 ? "bg-muted/50 text-muted-foreground" : "" }`}>#{idx + 1}</div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{skill.icon}</span>
                      <div>
                        <div className="text-[14px] font-black text-foreground">{skill.name}</div>
                        {skill.description && (
                          <div className="text-[10px] text-muted-foreground truncate">{skill.description}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {idx === 0 ? (
                      <button onClick={() => setShowPromoteConfirm(skill)}
                        style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                        className="flex items-center gap-1 text-[10px] font-black px-3 py-2 rounded-lg transition-all active:scale-95 shadow-sm">
                        <ArrowUpCircle size={12} /> Promote
                      </button>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveQueue(skill, "up")} className="p-1 hover:bg-muted rounded transition-all">
                          <ChevronUp size={14} className="text-muted-foreground" />
                        </button>
                        <button onClick={() => moveQueue(skill, "down")} className="p-1 hover:bg-muted rounded transition-all">
                          <ChevronDown size={14} className="text-muted-foreground" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add to queue button */}
          <button onClick={() => setShowAddModal(true)}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border/40 hover:border-primary/40 text-muted-foreground hover:text-primary font-bold text-[13px] py-4 rounded-2xl transition-all cursor-pointer">
            <Plus size={16} /> Add New Skill to Queue
          </button>

          {/* Info tip */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex gap-2 text-[11px] text-muted-foreground">
            <span className="text-primary flex-shrink-0 mt-0.5"><Zap size={13}/></span>
            <span>Press <strong className="text-primary">Promote</strong> on the #1 skill to set it as your Focus.
              {focusSkill ? ` Your current focus (${focusSkill.icon} ${focusSkill.name}) will move to Archive.` : " You have no active focus skill yet."}
            </span>
          </div>
        </div>
      )}

      {/* ══ LOG SESSION MODAL ══════════════════════════════════════════════════ */}
      {showLogModal && logTargetSkill && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4">
          <div className="bg-card border border-border/40 rounded-3xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{logTargetSkill.icon}</span>
                <div>
                  <div className="text-[15px] font-black text-foreground">Log Session</div>
                  <div className="text-[10px] text-muted-foreground">{logTargetSkill.name}</div>
                </div>
              </div>
              <button onClick={() => setShowLogModal(false)} className="p-2 hover:bg-muted rounded-xl"><X size={16}/></button>
            </div>

            {/* Date */}
            <div>
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Date</label>
              <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)}
                className="mt-1 w-full bg-muted/30 border border-border/30 rounded-xl px-3 py-2.5 text-[13px] font-bold text-foreground" />
            </div>

            {/* Duration */}
            <div>
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Duration (minutes)</label>
              <div className="flex gap-2 mt-1">
                {["15","30","45","60","90"].map(d => {
                  const isActive = logDuration === d;
                  return (
                    <button key={d} onClick={() => setLogDuration(d)}
                      style={isActive ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' } : {}}
                      className={`flex-1 py-2 rounded-lg text-[11px] font-black transition-all ${ isActive ? "" : "bg-muted/30 text-muted-foreground hover:bg-muted/60" }`}>{d}m</button>
                  );
                })}
              </div>
            </div>

            {/* Mood */}
            <div>
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Mood</label>
              <div className="flex gap-2 mt-1">
                {(["great","good","okay","hard"] as const).map(m => (
                  <button key={m} onClick={() => setLogMood(m)}
                    className={`flex-1 flex flex-col items-center py-2 rounded-xl text-[10px] font-black transition-all border ${ logMood === m ? "bg-primary/10 border-primary text-primary" : "bg-muted/20 border-transparent text-muted-foreground" }`}>
                    <span className="text-lg">{MOOD_CONFIG[m].emoji}</span>
                    {MOOD_CONFIG[m].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Notes (optional)</label>
              <textarea value={logNotes} onChange={e => setLogNotes(e.target.value)} rows={2}
                placeholder="What did you work on? Any breakthrough?"
                className="mt-1 w-full bg-muted/30 border border-border/30 rounded-xl px-3 py-2.5 text-[13px] text-foreground resize-none" />
            </div>

            <button onClick={submitLog} disabled={saving}
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
              className="w-full font-black text-[14px] py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
              {saving ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle2 size={16}/>}
              {saving ? "Saving..." : "Save Session"}
            </button>
          </div>
        </div>
      )}

      {/* ══ ADD SKILL MODAL ════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4">
          <div className="bg-card border border-border/40 rounded-3xl w-full max-w-md overflow-y-auto" style={{maxHeight: '90vh'}}>
            <div className="p-5 space-y-4">

              {/* Header row: title + close + SAVE BUTTON */}
              <div className="flex items-center gap-3">
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-muted rounded-xl flex-shrink-0">
                  <X size={16}/>
                </button>
                <div className="text-[15px] font-black text-foreground flex-1">Add New Skill</div>
                <button onClick={submitAddSkill} disabled={saving}
                  style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                  className="flex items-center gap-1.5 font-black text-[12px] px-4 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex-shrink-0 shadow-sm">
                  {saving ? <Loader2 size={13} className="animate-spin"/> : <Plus size={13}/>}
                  {saving ? "Saving..." : "Add to Queue"}
                </button>
              </div>

              {/* Skill Name — most important, first */}
              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Skill Name *</label>
                <input value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Reading, Boxing, Spanish..."
                  className="mt-1 w-full bg-muted/30 border border-border/30 rounded-xl px-3 py-2.5 text-[13px] font-bold text-foreground" />
              </div>

              {/* Icon picker */}
              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Icon</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {PRESET_ICONS.map(ic => (
                    <button key={ic} onClick={() => setNewIcon(ic)}
                      className={`text-2xl p-2 rounded-xl transition-all border ${newIcon === ic ? "bg-primary/10 border-primary scale-110" : "border-transparent hover:bg-muted/40"}`}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Color</label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => setNewColor(c)}
                      className={`w-8 h-8 rounded-full transition-all ${newColor === c ? "ring-2 ring-offset-2 ring-offset-card scale-110" : ""}`}
                      style={{ background: c, outline: newColor === c ? `2px solid ${c}` : 'none' }} />
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Description (optional)</label>
                <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
                  placeholder="e.g. 30 pages per session, 3x per week"
                  className="mt-1 w-full bg-muted/30 border border-border/30 rounded-xl px-3 py-2.5 text-[13px] text-foreground" />
              </div>

              {/* Target sessions */}
              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Monthly Session Target</label>
                <div className="flex gap-2 mt-1">
                  {["8","12","16","20","24","30"].map(n => {
                    const isActive = newTarget === n;
                    return (
                      <button key={n} onClick={() => setNewTarget(n)}
                        style={isActive ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' } : {}}
                        className={`flex-1 py-2 rounded-lg text-[11px] font-black transition-all ${ isActive ? "" : "bg-muted/30 text-muted-foreground" }`}>{n}</button>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-3 rounded-xl p-3" style={{background: newColor + '18', border: `1px solid ${newColor}40`}}>
                <span className="text-3xl">{newIcon}</span>
                <div>
                  <div className="text-[14px] font-black text-foreground">{newName || "Your Skill"}</div>
                  <div className="text-[10px] text-muted-foreground">Target: {newTarget} sessions/month</div>
                </div>
                <div className="w-3 h-3 rounded-full ml-auto" style={{ background: newColor }} />
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ══ PROMOTE CONFIRM ════════════════════════════════════════════════════ */}
      {showPromoteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
          <div className="bg-card border border-border/40 rounded-3xl w-full max-w-sm p-6 space-y-4">
            <div className="text-center">
              <div className="text-5xl mb-3">{showPromoteConfirm.icon}</div>
              <div className="text-[18px] font-black text-foreground">Promote to Focus?</div>
              <div className="text-[13px] text-muted-foreground mt-2">
                <strong className="text-foreground">{showPromoteConfirm.name}</strong> will become your Focus Skill for{" "}
                <strong className="text-primary">{format(new Date(), "MMMM yyyy")}</strong>.
                {focusSkill && (
                  <span> Your current focus ({focusSkill.icon} {focusSkill.name}) will be archived.</span>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPromoteConfirm(null)}
                className="flex-1 py-3 bg-muted/30 text-foreground font-bold text-[13px] rounded-xl">
                Cancel
              </button>
              <button onClick={() => promoteToFocus(showPromoteConfirm)} disabled={saving}
                style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                className="flex-1 py-3 font-black text-[13px] rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm">
                {saving ? <Loader2 size={14} className="animate-spin"/> : <ArrowUpCircle size={14}/>}
                {saving ? "Promoting..." : "Promote!"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
