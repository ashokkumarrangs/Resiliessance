"use client";

import React, { createContext, useContext, useState } from "react";

interface DialogConfig {
  title: string;
  type: "confirm" | "prompt";
  defaultValue?: string;
  isDestructive?: boolean;
  resolve: (value: any) => void;
}

interface DialogContextType {
  confirm: (message: string, isDestructive?: boolean) => Promise<boolean>;
  prompt: (message: string, defaultValue?: string) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<DialogConfig | null>(null);
  const [inputValue, setInputValue] = useState("");

  const confirm = (message: string, isDestructive = false) => {
    // Standardize checking messages to auto-detect destructive delete prompts
    const destructive = isDestructive || /delete|remove|wipe|permanently|trash/i.test(message);
    return new Promise<boolean>((resolve) => {
      setConfig({
        title: message,
        type: "confirm",
        isDestructive: destructive,
        resolve,
      });
    });
  };

  const prompt = (message: string, defaultValue = "") => {
    return new Promise<string | null>((resolve) => {
      setInputValue(defaultValue);
      setConfig({
        title: message,
        type: "prompt",
        defaultValue,
        resolve,
      });
    });
  };

  const handleCancel = () => {
    if (!config) return;
    config.resolve(config.type === "confirm" ? false : null);
    setConfig(null);
  };

  const handleConfirm = () => {
    if (!config) return;
    config.resolve(config.type === "confirm" ? true : inputValue);
    setConfig(null);
  };

  return (
    <DialogContext.Provider value={{ confirm, prompt }}>
      {children}
      {config && (
        <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border text-card-foreground p-6 rounded-3xl shadow-zenith max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold tracking-tight whitespace-pre-line text-foreground">
              {config.title}
            </h3>
            
            {config.type === "prompt" && (
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirm();
                  if (e.key === "Escape") handleCancel();
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                autoFocus
                onFocus={(e) => e.currentTarget.select()}
              />
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted font-bold text-sm transition-all flex-1 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex-1 cursor-pointer ${
                  config.isDestructive
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {config.isDestructive ? "Delete" : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}
