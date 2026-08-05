import React from "react";

interface SubNavProps {
  items: string[];
  activeItem: string;
  onChange: (item: string) => void;
  className?: string;
}

export function SubNav({ items, activeItem, onChange, className }: SubNavProps) {
  const marginClass = className !== undefined ? className : "mb-6";
  return (
    <div className={`flex items-center bg-muted/40 p-1.5 rounded-xl w-full max-w-sm mx-auto shrink-0 border border-border/20 shadow-sm ${marginClass}`}>
      {items.map((tab) => {
        const isActive = activeItem === tab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`flex-1 h-9 text-xs font-black transition-all rounded-lg active:scale-95 flex items-center justify-center ${
              isActive 
                ? "bg-card text-primary shadow-sm border border-border/40 scale-100" 
                : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/30 scale-95 hover:scale-100"
            }`}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
