"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  Activity,
  Plus,
  Trash2,
  Calendar,
  Utensils,
  BookOpen,
  Settings,
  Scale
} from "lucide-react";
import {
  dietService,
  BiometricDefinition,
  BiometricLog,
  BiometricTarget
} from "@/lib/services/diet";
import { PageWrapper } from "@/components/PageWrapper";
import { SubNav } from "@/components/SubNav";

const sectionTabs = [
  {
    title: "Daily Log",
    icon: <Utensils size={18} />,
    href: "/nutrition/logs"
  },
  {
    title: "Biometrics & Body",
    icon: <Activity size={18} />,
    href: "/nutrition/biometrics"
  },
  {
    title: "Library & Combos",
    icon: <BookOpen size={18} />,
    href: "/nutrition/library"
  }
];

function BiometricsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeMetricId = searchParams.get("metric") || "weight";

  const setActiveMetricId = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) {
      params.set("metric", id);
    } else {
      params.delete("metric");
    }
    router.push(`/nutrition/biometrics?${params.toString()}`);
  };

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Biometrics & Body Tracking States
  const [biometricDefs, setBiometricDefs] = useState<BiometricDefinition[]>([]);
  const [biometricLogs, setBiometricLogs] = useState<BiometricLog[]>([]);
  const [biometricTargets, setBiometricTargets] = useState<BiometricTarget[]>([]);

  // Logging Form for active biometric
  const [biometricInputVal, setBiometricInputVal] = useState<string>("");
  const [biometricInputDate, setBiometricInputDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [biometricInputNotes, setBiometricInputNotes] = useState<string>("");

  // Target Form
  const [isEditingBiometricTarget, setIsEditingBiometricTarget] = useState<boolean>(false);
  const [biometricTargetInput, setBiometricTargetInput] = useState<string>("");

  // Modal State for creating a new metric type
  const [isCreateMetricModalOpen, setIsCreateMetricModalOpen] = useState<boolean>(false);
  const [newMetricName, setNewMetricName] = useState<string>("");
  const [newMetricUnit, setNewMetricUnit] = useState<string>("");

  // Load Data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const loadedDefs = await dietService.getBiometricDefinitions();
        const loadedBiometricLogs = await dietService.getBiometricsLogs();
        const loadedBiometricTargets = await dietService.getBiometricTargets();

        setBiometricDefs(loadedDefs);
        setBiometricLogs(loadedBiometricLogs);
        setBiometricTargets(loadedBiometricTargets);

        if (!searchParams.get("metric") && loadedDefs.length > 0) {
          const hasWeight = loadedDefs.some(d => d.id === "weight");
          const defaultId = hasWeight ? "weight" : loadedDefs[0].id;
          setActiveMetricId(defaultId);
        }
      } catch (err) {
        console.error("Error loading biometrics data:", err);
        toast.error("Failed to load biometrics data");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [searchParams]);

  const activeMetric = useMemo(() => {
    return biometricDefs.find(d => d.id === activeMetricId) || { id: "", name: "", unit: "" };
  }, [biometricDefs, activeMetricId]);

  const activeLogs = useMemo(() => {
    return biometricLogs.filter(l => l.metric_type === activeMetricId);
  }, [biometricLogs, activeMetricId]);

  const latestLog = useMemo(() => {
    return activeLogs[0]; // Ordered descending by date in dietService
  }, [activeLogs]);

  const activeTarget = useMemo(() => {
    return biometricTargets.find(t => t.metric_type === activeMetricId);
  }, [biometricTargets, activeMetricId]);

  // Handlers
  const handleSaveBiometricLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(biometricInputVal);
    if (isNaN(val)) {
      toast.error("Please enter a valid numeric value");
      return;
    }

    setIsSaving(true);
    try {
      await dietService.saveBiometricLog(
        activeMetricId,
        val,
        biometricInputDate,
        biometricInputNotes
      );
      
      const refreshedLogs = await dietService.getBiometricsLogs();
      setBiometricLogs(refreshedLogs);
      
      setBiometricInputVal("");
      setBiometricInputNotes("");
      toast.success("Measurement logged successfully! ✅");
    } catch {
      toast.error("Failed to log measurement");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBiometricLog = async (id: string) => {
    try {
      await dietService.deleteBiometricLog(id);
      const refreshedLogs = await dietService.getBiometricsLogs();
      setBiometricLogs(refreshedLogs);
      toast.success("Log deleted");
    } catch {
      toast.error("Failed to delete log");
    }
  };

  const handleSaveBiometricTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(biometricTargetInput);
    if (isNaN(val)) {
      toast.error("Please enter a valid numeric value");
      return;
    }

    setIsSaving(true);
    try {
      await dietService.saveBiometricTarget(activeMetricId, val);
      const refreshedTargets = await dietService.getBiometricTargets();
      setBiometricTargets(refreshedTargets);
      
      setIsEditingBiometricTarget(false);
      setBiometricTargetInput("");
      toast.success("Target goal updated! ✅");
    } catch {
      toast.error("Failed to save target goal");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateMetricType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMetricName.trim() || !newMetricUnit.trim()) {
      toast.error("Please fill in both name and unit");
      return;
    }

    setIsSaving(true);
    try {
      const newDef = await dietService.addBiometricDefinition(newMetricName, newMetricUnit);
      const refreshedDefs = await dietService.getBiometricDefinitions();
      setBiometricDefs(refreshedDefs);
      setActiveMetricId(newDef.id);
      
      setNewMetricName("");
      setNewMetricUnit("");
      setIsCreateMetricModalOpen(false);
      toast.success(`Metric type "${newDef.name}" created! 🚀`);
    } catch {
      toast.error("Failed to create metric type");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBiometricDefinition = async (id: string) => {
    if (!id) return;
    const confirm = window.confirm(`Are you sure you want to delete the metric "${activeMetric.name}" and all its logged history? This cannot be undone.`);
    if (!confirm) return;

    setIsSaving(true);
    try {
      await dietService.deleteBiometricDefinition(id);
      toast.success(`Metric "${activeMetric.name}" deleted`);

      const refreshedDefs = await dietService.getBiometricDefinitions();
      setBiometricDefs(refreshedDefs);

      if (refreshedDefs.length > 0) {
        const hasWeight = refreshedDefs.some(d => d.id === "weight");
        if (hasWeight) {
          setActiveMetricId("weight");
        } else {
          setActiveMetricId(refreshedDefs[0].id);
        }
      } else {
        setActiveMetricId("");
      }

      const refreshedLogs = await dietService.getBiometricsLogs();
      setBiometricLogs(refreshedLogs);
    } catch {
      toast.error("Failed to delete metric");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageWrapper title="Nutrition" reportHref="/reports/nutrition" sectionTabs={sectionTabs} activePath="/nutrition/biometrics">
        <div className="py-24 text-center text-xs font-bold text-muted-foreground/60">
          Loading biometrics profiles...
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Nutrition"
      reportHref="/reports/nutrition"
      sectionTabs={sectionTabs}
      activePath="/nutrition/biometrics"
    >
      <div className="space-y-6">
        {/* Dynamic Horizontal SubNav Component (Unified) */}
        <SubNav
          items={[...biometricDefs.map(d => d.name), "+ Add Metric"]}
          activeItem={activeMetric.name}
          onChange={(val) => {
            if (val === "+ Add Metric") {
              setIsCreateMetricModalOpen(true);
            } else {
              const def = biometricDefs.find(d => d.name === val);
              if (def) {
                setActiveMetricId(def.id);
                setIsEditingBiometricTarget(false);
              }
            }
          }}
          className="mb-6 cursor-pointer"
        />

        {biometricDefs.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <Activity size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase text-foreground leading-none">No Custom Metrics Yet</h3>
              <p className="text-[10px] font-bold text-muted-foreground/60 max-w-xs mx-auto mt-1.5">
                Define custom body or health metrics (e.g. Body Weight, Blood Sugar, Chest Size) to start tracking.
              </p>
            </div>
            <button
              onClick={() => setIsCreateMetricModalOpen(true)}
              className="py-2.5 px-5 rounded-xl text-xs font-black bg-primary text-white shadow-lg shadow-primary/10 hover:bg-primary/95 transition-all"
            >
              + Create First Metric
            </button>
          </div>
        ) : (
          <>
            {/* Current & Target Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Value Display */}
              <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-6 flex flex-col justify-center min-h-[140px] relative group">
                <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">Current {activeMetric.name}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteBiometricDefinition(activeMetricId)}
                  className="absolute right-4 top-4 text-[10px] font-black text-rose-500 hover:text-rose-600 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Delete Metric
                </button>
                <span className="text-3xl font-black text-foreground mt-2">
                  {latestLog ? `${latestLog.value} ${activeMetric.unit}` : `-- ${activeMetric.unit}`}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground/40 mt-2">
                  {latestLog ? `Logged on ${format(parseISO(latestLog.date), "MMM d, yyyy")}` : "No entries logged yet"}
                </span>
              </div>

              {/* Target Goal Display */}
              <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-6 flex flex-col justify-center min-h-[140px] relative group">
                <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">Target Goal</span>
                {isEditingBiometricTarget ? (
                  <form onSubmit={handleSaveBiometricTarget} className="mt-2 flex gap-2 w-full">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Goal value"
                      value={biometricTargetInput}
                      onChange={(e) => setBiometricTargetInput(e.target.value)}
                      className="bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20 w-full"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-4 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-black shadow-sm"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingBiometricTarget(false);
                        setBiometricTargetInput("");
                      }}
                      className="px-3 bg-muted hover:bg-muted/70 text-foreground rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <span className="text-3xl font-black text-foreground mt-2">
                      {activeTarget ? `${activeTarget.target_value} ${activeMetric.unit}` : `-- ${activeMetric.unit}`}
                    </span>
                    <button
                      onClick={() => {
                        setBiometricTargetInput(activeTarget ? String(activeTarget.target_value) : "");
                        setIsEditingBiometricTarget(true);
                      }}
                      className="absolute right-4 top-4 text-[10px] font-black text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Set Goal
                    </button>
                    <span className="text-[10px] font-bold text-muted-foreground/45 mt-2">
                      {latestLog && activeTarget ? (
                        <>
                          {latestLog.value === activeTarget.target_value ? (
                            "Goal achieved! 🎉"
                          ) : (
                            `${Math.abs(latestLog.value - activeTarget.target_value).toFixed(1)} ${activeMetric.unit} to target`
                          )}
                        </>
                      ) : (
                        "No goal threshold set yet"
                      )}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Log & History Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Log Entry Form */}
              <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-black uppercase text-foreground leading-none">Log {activeMetric.name}</h3>
                  <p className="text-[10px] font-bold text-muted-foreground/60 mt-1">
                    Record a new entry for this biometric category
                  </p>
                </div>

                <form onSubmit={handleSaveBiometricLog} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground/60">Date</label>
                      <input
                        type="date"
                        value={biometricInputDate}
                        onChange={(e) => setBiometricInputDate(e.target.value)}
                        className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground/60">Value ({activeMetric.unit})</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 74.5"
                        value={biometricInputVal}
                        onChange={(e) => setBiometricInputVal(e.target.value)}
                        className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground/60">Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Morning fasting, post training"
                      value={biometricInputNotes}
                      onChange={(e) => setBiometricInputNotes(e.target.value)}
                      className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-accent/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-black shadow-lg shadow-primary/10 transition-all duration-300"
                  >
                    Save Entry
                  </button>
                </form>
              </div>

              {/* Scrollable list of logs */}
              <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-6 flex flex-col justify-between h-[310px] overflow-hidden">
                <div>
                  <h3 className="text-sm font-black uppercase text-foreground leading-none">History Logs</h3>
                  <p className="text-[10px] font-bold text-muted-foreground/60 mt-1">
                    Recent readings list for {activeMetric.name}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar mt-4 divide-y divide-border/20">
                  {activeLogs.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground/50 italic text-center py-12">
                      No logs recorded for this metric yet.
                    </p>
                  ) : (
                    activeLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between py-2.5">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-foreground">
                            {log.value} {activeMetric.unit}
                          </span>
                          <span className="text-[9px] font-bold text-muted-foreground/60 mt-0.5">
                            {format(parseISO(log.date), "EEEE, MMM d, yyyy")}
                          </span>
                          {log.notes && (
                            <span className="text-[9px] font-medium text-muted-foreground/45 italic mt-0.5">
                              "{log.notes}"
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteBiometricLog(log.id)}
                          className="text-muted-foreground hover:text-rose-500 p-2 rounded-lg hover:bg-rose-500/10 transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── MODAL: CREATE BIOMETRIC METRIC TYPE ─── */}
      {isCreateMetricModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-border/40 shadow-xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in duration-300">
            <div>
              <h3 className="text-sm font-black uppercase text-foreground leading-none">Add New Metric Type</h3>
              <p className="text-[10px] font-bold text-muted-foreground/60 mt-1">
                Define a custom health or body metric to track over time
              </p>
            </div>

            <form onSubmit={handleCreateMetricType} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/60">Metric Name</label>
                <input
                  type="text"
                  placeholder="e.g. Left Bicep, Blood Sugar"
                  value={newMetricName}
                  onChange={(e) => setNewMetricName(e.target.value)}
                  className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/60">Unit of Measurement</label>
                <input
                  type="text"
                  placeholder="e.g. inches, mmHg, %, cm"
                  value={newMetricUnit}
                  onChange={(e) => setNewMetricUnit(e.target.value)}
                  className="w-full bg-muted border-none rounded-xl h-10 px-3 text-xs font-bold focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateMetricModalOpen(false);
                    setNewMetricName("");
                    setNewMetricUnit("");
                  }}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-muted hover:bg-muted/70 text-foreground transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-black shadow-lg shadow-primary/10 transition-all duration-300"
                >
                  Create Metric
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

export default function BiometricsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center font-black animate-pulse">LOADING BIOMETRICS...</div>}>
      <BiometricsPageContent />
    </Suspense>
  );
}
