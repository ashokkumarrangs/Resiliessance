"use client";

import React, { useEffect, useState } from "react";

interface LoadingScreenProps {
  message?: string;
}

const DEFAULT_MESSAGES = [
  "Reindexing grid nodes...",
  "Loading secure databases...",
  "Preparing reports and metrics...",
  "Optimizing layout variables...",
];

export function LoadingScreen({ message }: LoadingScreenProps) {
  const [displayMessage, setDisplayMessage] = useState(message || DEFAULT_MESSAGES[0]);

  useEffect(() => {
    if (message) {
      setDisplayMessage(message);
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % DEFAULT_MESSAGES.length;
      setDisplayMessage(DEFAULT_MESSAGES[index]);
    }, 2000);

    return () => clearInterval(interval);
  }, [message]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] py-20 px-6 w-full animate-[fadeIn_0.3s_ease-out]">
      <div className="grid grid-cols-2 gap-1.5 mb-6 animate-pulse">
        <div className="w-4 h-4 bg-primary rounded-sm animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="w-4 h-4 bg-primary/80 rounded-sm animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="w-4 h-4 bg-primary/60 rounded-sm animate-bounce" style={{ animationDelay: "300ms" }}></div>
        <div className="w-4 h-4 bg-primary/40 rounded-sm animate-bounce" style={{ animationDelay: "450ms" }}></div>
      </div>
      <p className="text-[10px] font-bold text-muted-foreground/60 tracking-widest uppercase select-none text-center">
        {displayMessage}
      </p>
    </div>
  );
}
