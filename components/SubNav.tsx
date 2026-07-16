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
    <div className={`flex items-center bg-muted/80 p-1 rounded-lg w-full max-w-sm mx-auto shrink-0 border border-border/40 shadow-sm ${marginClass}`}>
      {items.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`flex-1 py-1.5 px-3 text-xs font-black transition-all rounded-md ${
            activeItem === tab 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground/80"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
