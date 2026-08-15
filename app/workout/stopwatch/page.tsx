"use client";

import React, { useState, useEffect, useRef } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { WORKOUT_TABS } from "@/lib/navigation";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Flag, 
  Flame, 
  TrendingUp, 
  TrendingDown,
  Info
} from "lucide-react";

interface LapLog {
  lapNo: number;
  splitTime: number; // ms since last lap
  cumulativeTime: number; // total ms
}

export default function WorkoutStopwatchPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [laps, setLaps] = useState<LapLog[]>([]);

  // Refs for tracking background timing accurately
  const elapsedTimeRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  // Core Stopwatch Timing loop
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsedTimeRef.current;
      intervalId = setInterval(() => {
        if (startTimeRef.current !== null) {
          const delta = Date.now() - startTimeRef.current;
          setTime(delta);
          elapsedTimeRef.current = delta;
        }
      }, 10);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning]);

  const handleStartPause = () => {
    setIsRunning(prev => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setLaps([]);
    elapsedTimeRef.current = 0;
    startTimeRef.current = null;
  };

  const handleLap = () => {
    if (!isRunning) return;

    setLaps(prevLaps => {
      const lapNo = prevLaps.length + 1;
      const cumulativeTime = time;
      const lastLapCumulative = prevLaps.length > 0 
        ? prevLaps[prevLaps.length - 1].cumulativeTime 
        : 0;
      const splitTime = cumulativeTime - lastLapCumulative;

      return [...prevLaps, { lapNo, splitTime, cumulativeTime }];
    });
  };

  // Helper formats: MM:SS.CC (or HH:MM:SS.CC if > 1 hour)
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);

    const pad = (num: number) => num.toString().padStart(2, "0");

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
  };

  // Identify fastest and slowest laps for UI highlighting
  let fastestLapIdx = -1;
  let slowestLapIdx = -1;
  if (laps.length > 1) {
    let minTime = Infinity;
    let maxTime = -Infinity;
    laps.forEach((lap, idx) => {
      if (lap.splitTime < minTime) {
        minTime = lap.splitTime;
        fastestLapIdx = idx;
      }
      if (lap.splitTime > maxTime) {
        maxTime = lap.splitTime;
        slowestLapIdx = idx;
      }
    });
  }

  return (
    <PageWrapper title="Stopwatch" sectionTabs={WORKOUT_TABS}>
      <div className="w-full space-y-6">
        
        {/* Core Digital Clock Card */}
        <div className="bg-card rounded-3xl p-8 border border-border/40 shadow-xl flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
          
          {/* Subtle Ambient Background glow */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-accent opacity-[0.03] blur-3xl pointer-events-none transition-all duration-500 ${
            isRunning ? 'scale-125 opacity-[0.05]' : 'scale-100'
          }`} />

          <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest leading-none block">
            Stopwatch Time
          </span>

          <div className="font-mono text-5xl sm:text-6xl font-black text-foreground tracking-tighter bg-muted/40 border border-border/20 px-6 py-8 rounded-2xl shadow-inner text-center w-full max-w-sm select-none">
            {formatTime(time)}
          </div>

          {/* Action Control Board */}
          <div className="flex items-center justify-center gap-4 w-full relative z-10 pt-2">
            
            {/* Left Button: Lap or Reset */}
            {isRunning ? (
              <button
                type="button"
                onClick={handleLap}
                className="w-14 h-14 bg-muted hover:bg-muted/70 text-foreground rounded-full flex items-center justify-center transition-all border border-border/30 active:scale-90"
                title="Lap Split"
              >
                <Flag size={20} className="text-muted-foreground" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                disabled={time === 0}
                className="w-14 h-14 bg-muted hover:bg-muted/70 text-foreground disabled:opacity-40 disabled:pointer-events-none rounded-full flex items-center justify-center transition-all border border-border/30 active:scale-90"
                title="Reset Stopwatch"
              >
                <RotateCcw size={20} className="text-muted-foreground" />
              </button>
            )}

            {/* Play/Pause Center Trigger */}
            <button
              type="button"
              onClick={handleStartPause}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 ${
                isRunning 
                  ? 'bg-amber-500 shadow-amber-500/20 text-white' 
                  : 'bg-accent shadow-accent/25 text-white'
              }`}
            >
              {isRunning ? (
                <Pause size={28} fill="currentColor" />
              ) : (
                <Play size={28} fill="currentColor" className="ml-1" />
              )}
            </button>

            {/* Dummy space right for balance */}
            <div className="w-14 h-14 opacity-0 pointer-events-none" />

          </div>
        </div>

        {/* Lap splits History Section */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/40 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h3 className="font-black text-base text-foreground flex items-center gap-1.5">
              <Flag size={16} className="text-accent" />
              Lap Splits
            </h3>
            {laps.length > 0 && (
              <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-wider">
                {laps.length} Splits
              </span>
            )}
          </div>

          {laps.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 border border-border/30 flex items-center justify-center text-muted-foreground/30">
                <Info size={20} />
              </div>
              <p className="text-xs text-muted-foreground max-w-[250px]">
                No splits logged yet. Tap the Flag icon while the stopwatch is ticking to record lap details.
              </p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto pr-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/20 text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">
                    <th className="py-2 px-2 text-center">Lap</th>
                    <th className="py-2 px-2">Split duration</th>
                    <th className="py-2 px-2 text-right">Cumulative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 font-bold">
                  {laps.slice().reverse().map((lap, index) => {
                    const originalIndex = laps.length - 1 - index;
                    const isFastest = originalIndex === fastestLapIdx;
                    const isSlowest = originalIndex === slowestLapIdx;

                    let rowStyle = "text-foreground";
                    let splitIcon = null;
                    if (isFastest) {
                      rowStyle = "text-emerald-500 bg-emerald-500/5";
                      splitIcon = <TrendingUp size={12} className="inline mr-1" />;
                    } else if (isSlowest) {
                      rowStyle = "text-rose-500 bg-rose-500/5";
                      splitIcon = <TrendingDown size={12} className="inline mr-1" />;
                    }

                    return (
                      <tr key={lap.lapNo} className={`transition-colors ${rowStyle}`}>
                        <td className="py-3 px-2 text-center font-black text-muted-foreground/60">
                          {lap.lapNo}
                        </td>
                        <td className="py-3 px-2 font-mono">
                          {splitIcon}
                          {formatTime(lap.splitTime)}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-muted-foreground/80">
                          {formatTime(lap.cumulativeTime)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </PageWrapper>
  );
}
