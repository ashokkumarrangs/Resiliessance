"use client"

import { Select } from "@/components/Select"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { format, addDays, subDays, startOfMonth, endOfMonth } from "date-fns"
import { Input } from "@/components/ui/input"

import { toast } from "sonner"
import { getStatusIcon, getStatusStyles } from "@/lib/habit-ui-utils"
import {
  calculateHabitStatus,
  HabitStatus,
  HabitConfig as ScoringConfig,
  sumDurations,
  isHabitActiveOnDate,
  getFlexiblePeriodBounds,
} from "@/lib/habit-scoring"
import { SaveButton } from "@/components/ui/SaveButton"
import { HABIT_TABS } from "@/lib/navigation"
import { SubNav } from "@/components/SubNav"
import { PageWrapper } from "@/components/PageWrapper"

interface HabitConfig extends ScoringConfig {
  id: string
  group_name: string
  frequency: string
  emoji: string
  unit: string
  group_order: number
  daily_habit_order: number
  habit_color: string
}

const parseDurationStr = (valStr: string) => {
  if (!valStr || !valStr.includes(":")) return { hrs: "", mins: "" }
  const [h, m] = valStr.split(":")
  return { hrs: h || "", mins: m || "" }
}

const formatDurationStr = (hrs: string, mins: string) => {
  if (hrs.trim() === "" && mins.trim() === "") return ""
  const h = hrs.trim() === "" ? "0" : hrs
  const m = mins.trim() === "" ? "0" : mins
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`
}

export default function HabitDailyPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  )
  const [configs, setConfigs] = useState<HabitConfig[]>([])
  const [dailyData, setDailyData] = useState<Record<string, string>>({})
  const [statusMap, setStatusMap] = useState<Record<string, HabitStatus>>({})
  const [eventAggregates, setEventAggregates] = useState<
    Record<string, { count: number; valueDisplay: string; status: HabitStatus }>
  >({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  )
  const [allMonthLogs, setAllMonthLogs] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'daily' | 'off_days'>('daily')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('tab') === 'off-day') {
        setActiveTab('off_days')
      }
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: configData, error: configError } = await supabase
        .from("habit_config")
        .select("*")
        .eq("is_paused", false)
        .eq("is_archived", false)
        .eq("is_deleted", false)
        .order("group_order")
        .order("daily_habit_order")
      if (configError) throw configError

      const fetchedConfigs = configData || []
      setConfigs(fetchedConfigs)

      // Initialize all groups to expanded if not already set
      const groups = Array.from(
        new Set(fetchedConfigs.map((c) => c.group_name))
      )
      setExpandedGroups((prev) => {
        const next = { ...prev }
        groups.forEach((g) => {
          if (next[g] === undefined) next[g] = true
        })
        return next
      })

      const dateObj = new Date(selectedDate)
      const startOfMonthStr = format(startOfMonth(dateObj), "yyyy-MM-dd")
      const endOfMonthStr = format(endOfMonth(dateObj), "yyyy-MM-dd")

      const { data: logData, error: logError } = await supabase
        .from("habit_data")
        .select("*")
        .gte("date", startOfMonthStr)
        .lte("date", endOfMonthStr)
      if (logError) throw logError

      const monthLogs = logData || []
      setAllMonthLogs(monthLogs)

      const dailyLogs = monthLogs.filter((l) => l.date === selectedDate)
      const dataMap: Record<string, string> = {}
      const sMap: Record<string, HabitStatus> = {}
      dailyLogs.forEach((d) => {
        dataMap[d.habit] = d.value
        sMap[d.habit] = d.status as HabitStatus
      })

      fetchedConfigs
        .forEach((c) => {
          const activeToday = isHabitActiveOnDate(c, selectedDate)
          const isFlexible = c.frequency_type === 'flexible_weekly' || c.frequency_type === 'flexible_monthly'
          if (activeToday && !isFlexible && c.unlogged_is_success && !dataMap[c.habit_name]) {
            sMap[c.habit_name] = "Success"
          }
        })
      setDailyData(dataMap)
      setStatusMap(sMap)

      const { data: eventData, error: eventError } = await supabase
        .from("event_log")
        .select("*")
        .eq("date", selectedDate)
        .order("created_at", { ascending: true })
      if (!eventError) {
        const aggs: Record<
          string,
          { count: number; valueDisplay: string; status: HabitStatus }
        > = {}
        ;(eventData || []).forEach((e) => {
          if (!aggs[e.event])
            aggs[e.event] = {
              count: 0,
              valueDisplay: "",
              status: "Not Entered",
            }
          aggs[e.event].count++

          const habitConfig = fetchedConfigs.find(
            (c) => c.habit_name === e.event
          )
          if (habitConfig) {
            if (habitConfig.input_type === "duration") {
              aggs[e.event].valueDisplay = sumDurations(
                aggs[e.event].valueDisplay,
                e.value
              )
            } else if (habitConfig.input_type === "number") {
              const current = parseFloat(aggs[e.event].valueDisplay) || 0
              aggs[e.event].valueDisplay = String(
                current + (parseFloat(e.value) || 0)
              )
            } else {
              // Latest non-empty value for Text, Time, etc.
              if (e.value && e.value !== "1") {
                aggs[e.event].valueDisplay = e.value
              } else if (!aggs[e.event].valueDisplay) {
                aggs[e.event].valueDisplay = e.value || ""
              }
            }
          }
        })

        // Calculate status for each event habit
        Object.keys(aggs).forEach((hName) => {
          const config = fetchedConfigs.find((c) => c.habit_name === hName)
          if (config) {
            let scoreValue = aggs[hName].valueDisplay
            if (config.input_type === "text") {
              scoreValue = String(aggs[hName].count)
            }
            aggs[hName].status = calculateHabitStatus(config, scoreValue)
          }
        })

        setEventAggregates(aggs)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load habit data")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (habitName: string, value: string) => {
    setDailyData((prev) => ({ ...prev, [habitName]: value }))

    // Live Status Update
    const config = configs.find((c) => c.habit_name === habitName)
    if (config) {
      const newStatus = calculateHabitStatus(config, value)
      setStatusMap((prev) => ({ ...prev, [habitName]: newStatus }))
    }
  }

  const getFlexibleProgress = (habit: HabitConfig) => {
    if (habit.frequency_type === 'flexible_weekly') {
      const bounds = getFlexiblePeriodBounds(habit, selectedDate)
      const logs = allMonthLogs.filter(
        (l) => l.habit === habit.habit_name && l.date >= bounds.start && l.date <= bounds.end
      )
      // Count successful days. (We also account for any live unsaved dailyData edits)
      const successDays = new Set<string>()
      logs.forEach(l => {
        if (l.status === 'Success' && l.date !== selectedDate) {
          successDays.add(l.date)
        }
      })
      // Add today's live status if success
      const todayVal = dailyData[habit.habit_name] || ""
      const todayStatus = calculateHabitStatus(habit, todayVal)
      if (todayStatus === 'Success') {
        successDays.add(selectedDate)
      }
      
      const successCount = successDays.size
      const target = habit.flexible_target_count || 3
      return {
        count: successCount,
        target,
        percent: Math.min(Math.round((successCount / target) * 100), 100),
        status: successCount >= target ? 'Success' : (successCount > 0 ? 'Tolerance' : 'Not Entered') as HabitStatus
      }
    }
    
    if (habit.frequency_type === 'flexible_monthly') {
      const bounds = getFlexiblePeriodBounds(habit, selectedDate)
      const logs = allMonthLogs.filter(
        (l) => l.habit === habit.habit_name && l.date >= bounds.start && l.date <= bounds.end
      )
      const successDays = new Set<string>()
      logs.forEach(l => {
        if (l.status === 'Success' && l.date !== selectedDate) {
          successDays.add(l.date)
        }
      })
      const todayVal = dailyData[habit.habit_name] || ""
      const todayStatus = calculateHabitStatus(habit, todayVal)
      if (todayStatus === 'Success') {
        successDays.add(selectedDate)
      }
      
      const successCount = successDays.size
      const target = habit.flexible_target_count || 4
      return {
        count: successCount,
        target,
        percent: Math.min(Math.round((successCount / target) * 100), 100),
        status: successCount >= target ? 'Success' : (successCount > 0 ? 'Tolerance' : 'Not Entered') as HabitStatus
      }
    }
    return { count: 0, target: 1, percent: 0, status: 'Not Entered' as HabitStatus }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const saveableConfigs = configs.filter(
        (c) => c.frequency !== "event"
      )
      const allRecords = saveableConfigs.map((c) => {
        const val = dailyData[c.habit_name] || ""
        return {
          date: selectedDate,
          group_name: c.group_name,
          habit: c.habit_name,
          value: String(val),
          unit: c.unit || "",
          source: "daily",
          status: calculateHabitStatus(c, val),
        }
      })

      const inserts = allRecords.filter((r) => r.value !== "")
      const allHabits = allRecords.map((r) => r.habit)

      // 1. Upsert active values atomically to prevent loss on network failure
      if (inserts.length > 0) {
        const { error: upsertError } = await supabase
          .from("habit_data")
          .upsert(inserts, { onConflict: "date,habit" })

        if (upsertError) throw upsertError
      }

      toast.success("Habit Tracker updated!")
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Failed to update habits")
    } finally {
      setSaving(false)
    }
  }

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }))
  }

  const groups = Array.from(new Set(configs.map((c) => c.group_name)))

  const totalFilteredHabitsCount = configs.filter((habit) => {
    const isFlexible = habit.frequency_type === 'flexible_weekly' || habit.frequency_type === 'flexible_monthly'
    if (isFlexible) return activeTab === 'off_days'
    const isActive = isHabitActiveOnDate(habit, selectedDate)
    if (activeTab === 'daily') return isActive
    // off_days tab: specific_days/interval habits on their scheduled off-days
    return !isActive
  }).length

  return (
    <PageWrapper
      title="Daily Log"
      reportHref="/reports/habits"
      sectionTabs={HABIT_TABS}
      activePath="/habits/daily-log"
    >
      <SubNav
        items={["Daily Log", "Event Log", "Off-Day Habits"]}
        activeItem={activeTab === 'daily' ? "Daily Log" : "Off-Day Habits"}
        onChange={(val) => {
          if (val === "Event Log") router.push("/habits/event-log")
          else if (val === "Off-Day Habits") setActiveTab('off_days')
          else setActiveTab('daily')
        }}
      />

      {loading ? (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Date Swapper */}
          <div className="mt-6 mb-6 flex w-full justify-center">
            <div className="flex w-full max-w-sm items-center justify-between rounded-xl border border-border/40 bg-card px-4 py-1.5 shadow-sm">
              <button
                onClick={() =>
                  setSelectedDate((prev) =>
                    format(subDays(new Date(prev), 1), "yyyy-MM-dd")
                  )
                }
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-2 text-xs font-black tracking-tight text-foreground uppercase">
                <Calendar className="h-3.5 w-3.5 text-primary opacity-50" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="cursor-pointer border-none bg-transparent text-center text-sm font-black text-foreground focus:ring-0"
                />
              </div>
              <button
                onClick={() =>
                  setSelectedDate((prev) =>
                    format(addDays(new Date(prev), 1), "yyyy-MM-dd")
                  )
                }
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {totalFilteredHabitsCount === 0 && (
            <div className="rounded-2xl border border-border/40 bg-card p-12 text-center shadow-sm max-w-lg mx-auto">
              <span className="text-4xl">🎉</span>
              <h3 className="mt-4 text-base font-black text-foreground uppercase tracking-tight">
                {activeTab === 'daily' ? 'No Active Habits Today' : 'No Off-Day Habits Today'}
              </h3>
              <p className="mt-2 text-xs font-bold text-muted-foreground/60 leading-relaxed max-w-sm mx-auto">
                {activeTab === 'daily' 
                  ? 'All your scheduled habits are resting today, or no habits are active.' 
                  : 'All your habits are scheduled for today, or you have no specific days/interval habits configured.'}
              </p>
            </div>
          )}

          {/* Individual Group Cards */}
          {groups.map((group) => {
            const groupHabits = configs.filter((c) => c.group_name === group)
            if (groupHabits.length === 0) return null

            const filteredHabits = groupHabits.filter((habit) => {
              const isFlexible = habit.frequency_type === 'flexible_weekly' || habit.frequency_type === 'flexible_monthly'
              if (isFlexible) return activeTab === 'off_days'
              const isActive = isHabitActiveOnDate(habit, selectedDate)
              if (activeTab === 'daily') return isActive
              return !isActive
            })

            if (filteredHabits.length === 0) return null

            const doneCount = filteredHabits.filter((c) => {
              const isFlexible = c.frequency_type === 'flexible_weekly' || c.frequency_type === 'flexible_monthly'
              if (isFlexible) return false
              const isActive = isHabitActiveOnDate(c, selectedDate)
              if (!isActive) return false
              const stat = statusMap[c.habit_name]
              const evStat = eventAggregates[c.habit_name]?.status
              return (
                (stat !== undefined && stat !== "Not Entered") ||
                (evStat !== undefined && evStat !== "Not Entered")
              )
            }).length

            const isExpanded = expandedGroups[group]

            return (
              <div
                key={group}
                className="rounded-2xl border border-border/40 bg-card shadow-sm transition-all"
              >
                <div
                  onClick={() => toggleGroup(group)}
                  className="flex cursor-pointer items-center justify-between p-4 transition-colors select-none hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black tracking-tight text-foreground/80 uppercase">
                      {group}
                    </h2>
                    {isExpanded ? (
                      <ChevronUp size={18} className="opacity-30" />
                    ) : (
                      <ChevronDown size={18} className="opacity-30" />
                    )}
                  </div>
                  {activeTab === 'daily' ? (
                    <div className="rounded-md bg-primary/10 px-3 py-1 text-sm font-black text-primary">
                      {doneCount}/{filteredHabits.length}
                    </div>
                  ) : (
                    <div className="rounded-md bg-muted px-3 py-1 text-xs font-black text-muted-foreground uppercase">
                      {filteredHabits.some(h => h.frequency_type === 'flexible_weekly' || h.frequency_type === 'flexible_monthly')
                        ? `${filteredHabits.length} Flexible`
                        : `${filteredHabits.length} Off`}
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="space-y-5 p-4 pt-0">
                    <div className="space-y-5 border-t border-border/40 pt-4">
                      {filteredHabits.map((habit) => {
                        const isFlexible = habit.frequency_type === 'flexible_weekly' || habit.frequency_type === 'flexible_monthly'
                        const isActive = isHabitActiveOnDate(habit, selectedDate)
                        // Only specific_days/interval habits on their scheduled rest-days get the greyed Off Day card
                        const isOffDay = !isFlexible && !isActive

                        if (isOffDay) {
                          return (
                            <div
                              key={habit.id}
                              className="flex items-center gap-2 rounded-xl p-2.5 bg-muted/5 opacity-40 select-none"
                            >
                              <div className="flex w-8 shrink-0 flex-col items-center opacity-50">
                                <span className="text-lg">{habit.emoji}</span>
                              </div>
                              <div className="min-w-0 flex-1 pr-2">
                                <div className="flex items-center gap-2">
                                  <div className="truncate text-sm font-bold text-muted-foreground/60 line-through">
                                    {habit.habit_name}
                                  </div>
                                  <span className="text-[8px] font-black uppercase tracking-wider bg-background px-1.5 py-0.5 rounded border border-border/10">
                                    Off Day
                                  </span>
                                </div>
                                <div className="mt-0.5 text-[10px] font-bold text-muted-foreground/40 italic">
                                  {habit.frequency === 'weekly' ? 'Not scheduled for today' : 'Interval rest day'}
                                </div>
                              </div>
                            </div>
                          )
                        }

                        const progress = isFlexible ? getFlexibleProgress(habit) : null
                        const status = isFlexible
                          ? progress!.status
                          : (habit.frequency === "event"
                              ? eventAggregates[habit.habit_name]?.status || "Not Entered"
                              : statusMap[habit.habit_name] || "Not Entered")
                        const styles = getStatusStyles(status)

                        return (
                          <div
                            key={habit.id}
                            className={`group/row flex flex-col gap-2 rounded-xl p-3.5 transition-all ${styles.bg} ${styles.anim}`}
                          >
                            <div className="flex items-center gap-2 w-full">
                              <div className="flex w-8 shrink-0 flex-col items-center opacity-50">
                                <span className="text-lg">{habit.emoji}</span>
                              </div>
                              <div className="min-w-0 flex-1 pr-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`truncate text-sm transition-all ${styles.text} ${styles.weight}`}
                                  >
                                    {habit.habit_name}
                                  </div>
                                  {isFlexible && (
                                    <span className="text-[8px] font-black uppercase tracking-wider bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                                      {habit.frequency_type === 'flexible_weekly' ? 'Flexible Weekly' : 'Flexible Monthly'}
                                    </span>
                                  )}
                                  <div className="shrink-0">
                                    {getStatusIcon(status, 16)}
                                  </div>
                                </div>
                                <div className="mt-0.5 text-[10px] font-bold text-muted-foreground/50 normal-case">
                                  Target:{" "}
                                  {(() => {
                                    if (isFlexible) {
                                      return `${habit.flexible_target_count} times a ${habit.frequency_type === 'flexible_weekly' ? 'week' : 'month'}`
                                    }
                                    const isEvent = habit.frequency === "event"
                                    const isCount =
                                      isEvent &&
                                      habit.condition_type?.endsWith("_count")
                                    let baseCond = isCount
                                      ? habit.condition_type.replace("_count", "")
                                      : habit.condition_type

                                    let suffix = habit.unit
                                      ? ` ${habit.unit}`
                                      : ""
                                    if (isEvent) {
                                      if (isCount) {
                                        suffix = " times"
                                      } else {
                                        suffix = habit.unit
                                          ? ` ${habit.unit} (Sum)`
                                          : " (Sum)"
                                      }
                                    }

                                    if (baseCond === "above_below") {
                                      baseCond =
                                        habit.direction === "less"
                                          ? "at_most_n"
                                          : "at_least_n"
                                    }

                                    if (habit.input_type === "boolean") {
                                      return habit.target_value === 0
                                        ? "No"
                                        : "Yes"
                                    }
                                    if (baseCond === "between") {
                                      return `Between ${habit.suc_min} and ${habit.suc_max}${suffix}`
                                    }
                                    if (baseCond === "at_least_n") {
                                      return `At least ${habit.target_value}${suffix}`
                                    }
                                    if (baseCond === "at_most_n") {
                                      return `At most ${habit.target_value}${suffix}`
                                    }
                                    if (baseCond === "exactly_n") {
                                      return `Exactly ${habit.target_value}${suffix}`
                                    }
                                    return `${habit.target_value}${suffix}`
                                  })()}
                                </div>
                              </div>

                              <div className="ml-auto flex shrink-0 items-center gap-1.5">
                                {habit.frequency === "event" ? (
                                  <div className="flex w-20 shrink-0 items-center justify-end gap-1">
                                    <div className="flex h-8 w-[36px] flex-col items-center justify-center rounded-lg border border-border/5 bg-muted/50 shadow-inner">
                                      <span className="mb-0.5 text-[7px] leading-none font-black uppercase opacity-30">
                                        Logs
                                      </span>
                                      <div className="text-[10px] leading-none font-black text-primary">
                                        {eventAggregates[habit.habit_name]
                                          ?.count || 0}
                                      </div>
                                    </div>
                                    <div className="flex h-8 w-[40px] flex-col items-center justify-center rounded-lg border border-border/5 bg-muted/50 shadow-inner">
                                      <span className="mb-0.5 text-[7px] leading-none font-black uppercase opacity-30">
                                        Val
                                      </span>
                                      <div className="max-w-full truncate px-0.5 text-[10px] leading-none font-black text-accent">
                                        {eventAggregates[habit.habit_name]
                                          ?.valueDisplay ||
                                          (habit.input_type === "text"
                                            ? "--"
                                            : "0")}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex w-25 shrink-0 justify-end">
                                    {habit.input_type === "boolean" ? (
                                      <Select
                                        value={dailyData[habit.habit_name] || ""}
                                        onChange={(e) =>
                                          handleInputChange(
                                            habit.habit_name,
                                            e.target.value
                                          )
                                        }
                                        className="h-8 w-full rounded-lg border-none bg-muted px-2 text-xs font-bold text-foreground shadow-inner transition-all focus:ring-2 focus:ring-primary/10 cursor-pointer"
                                      >
                                        <option value="">
                                          —
                                        </option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                      </Select>
                                    ) : habit.input_type === "duration" ? (
                                      <div className="flex w-full items-center justify-end gap-1">
                                        <input
                                          type="number"
                                          placeholder="0"
                                          value={
                                            parseDurationStr(
                                              dailyData[habit.habit_name] || ""
                                            ).hrs
                                          }
                                          onChange={(e) => {
                                            const current = parseDurationStr(
                                              dailyData[habit.habit_name] || ""
                                            )
                                            handleInputChange(
                                              habit.habit_name,
                                              formatDurationStr(
                                                e.target.value,
                                                current.mins
                                              )
                                            )
                                          }}
                                          inputMode="numeric"
                                          className="h-8 w-7 rounded-lg border-none bg-muted p-0.5 text-center text-xs font-bold text-foreground focus:ring-2 focus:ring-primary/10 shadow-inner"
                                          min="0"
                                        />
                                        <span className="text-[9px] font-bold opacity-40">
                                          h
                                        </span>
                                        <input
                                          type="number"
                                          placeholder="00"
                                          value={
                                            parseDurationStr(
                                              dailyData[habit.habit_name] || ""
                                            ).mins
                                          }
                                          onChange={(e) => {
                                            const current = parseDurationStr(
                                              dailyData[habit.habit_name] || ""
                                            )
                                            handleInputChange(
                                              habit.habit_name,
                                              formatDurationStr(
                                                current.hrs,
                                                e.target.value
                                              )
                                            )
                                          }}
                                          inputMode="numeric"
                                          className="h-8 w-7 rounded-lg border-none bg-muted p-0.5 text-center text-xs font-bold text-foreground focus:ring-2 focus:ring-primary/10 shadow-inner"
                                          min="0"
                                          max="59"
                                        />
                                        <span className="text-[9px] font-bold opacity-40">
                                          m
                                        </span>
                                      </div>
                                    ) : habit.input_type === "time" ? (
                                      <div className="group relative w-full">
                                        <Input
                                          type="time"
                                          value={
                                            dailyData[habit.habit_name] || ""
                                          }
                                          onChange={(e) =>
                                            handleInputChange(
                                              habit.habit_name,
                                              e.target.value
                                            )
                                          }
                                          className="h-8 w-full appearance-none rounded-lg border-none bg-muted px-2 text-center text-xs font-bold text-foreground shadow-inner transition-all focus:ring-2 focus:ring-primary/10"
                                        />
                                        <Clock
                                          size={10}
                                          className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground/30 transition-colors group-hover:text-primary"
                                        />
                                      </div>
                                    ) : (
                                      <Input
                                        type={
                                          habit.input_type === "number"
                                            ? "number"
                                            : "text"
                                        }
                                        value={dailyData[habit.habit_name] || ""}
                                        onChange={(e) =>
                                          handleInputChange(
                                            habit.habit_name,
                                            e.target.value
                                          )
                                        }
                                        className="h-8 w-full rounded-lg border-none bg-muted text-center text-xs font-bold text-foreground focus:ring-2 focus:ring-primary/10 shadow-inner"
                                        placeholder="--"
                                        inputMode={
                                          habit.input_type === "number"
                                            ? "decimal"
                                            : undefined
                                        }
                                      />
                                    )}
                                  </div>
                                )}
                                <span className="w-6 truncate text-right text-[9px] font-black uppercase opacity-30">
                                  {habit.unit || "pt"}
                                </span>
                              </div>
                            </div>

                            {/* Flexible Progress Bar */}
                            {isFlexible && progress && (
                              <div className="mt-1 w-full border-t border-border/5 pt-2">
                                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-muted-foreground/50">
                                  <span>Progress this {habit.frequency_type === 'flexible_weekly' ? 'week' : 'month'}: {progress.count} / {progress.target}</span>
                                  <span>{progress.percent}%</span>
                                </div>
                                <div className="h-1 bg-muted/60 rounded-full overflow-hidden mt-1 w-full">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      progress.status === 'Success'
                                        ? 'bg-emerald-500'
                                        : progress.status === 'Tolerance'
                                        ? 'bg-amber-500'
                                        : 'bg-primary'
                                    }`}
                                    style={{ width: `${progress.percent}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Submit Button Card */}
          <div className="rounded-2xl border border-border/40 bg-card p-8 shadow-sm">
            <div className="flex justify-center">
              <SaveButton
                isSaving={saving}
                label="Save Daily Log"
                className="flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-black text-white shadow-xl shadow-emerald-900/20 transition-all active:scale-[0.98] disabled:bg-muted"
                onClick={handleSave}
              />
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
