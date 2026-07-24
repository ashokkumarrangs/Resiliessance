"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface TabItem {
  title: string;
  icon: React.ReactNode;
  href?: string;
  id?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function SectionNav({ tabs, activePath }: { tabs: TabItem[], activePath?: string }) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentPath = activePath || pathname;
  
  let activeIndex = -1;
  let maxMatchLength = -1;

  tabs.forEach((tab, index) => {
    if (tab.isActive !== undefined) {
      if (tab.isActive) {
        activeIndex = index;
        maxMatchLength = Infinity;
      }
      return;
    }
    if (tab.href) {
      if (currentPath === tab.href) {
        activeIndex = index;
        maxMatchLength = Infinity;
      } else if (currentPath.startsWith(tab.href + '/')) {
        if (maxMatchLength !== Infinity && tab.href.length > maxMatchLength) {
          activeIndex = index;
          maxMatchLength = tab.href.length;
        }
      }
    }
  });

  const checkActive = (tab: TabItem, index: number) => {
    if (tab.isActive !== undefined) return tab.isActive;
    return index === activeIndex;
  };

  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        setTimeout(() => {
          activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }, 50);
      }
    }
  }, [pathname]);

  return (
    <div className="w-full mb-6">
      <div 
        ref={scrollRef}
        className="flex bg-muted/40 p-1.5 rounded-xl border border-border/20 w-full overflow-x-auto no-scrollbar gap-1.5 snap-x snap-mandatory"
      >
        {tabs.map((t, index) => {
          const isActive = checkActive(t, index);
          const baseClasses = `snap-center flex-1 min-w-[85px] sm:min-w-[100px] h-14 rounded-lg font-black flex flex-col items-center justify-center gap-1 transition-all shrink-0 active:scale-95 ${
            isActive 
              ? 'bg-card text-primary shadow-sm border border-border/40 scale-100' 
              : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 scale-95 hover:scale-100'
          }`;

          const content = (
            <>
              <div className={`${isActive ? "text-primary" : "opacity-60"}`}>
                {t.icon}
              </div>
              <span 
                style={{
                  fontSize: "var(--nav-font-size)",
                  fontWeight: "var(--nav-font-weight)" as any,
                  letterSpacing: "var(--nav-letter-spacing)"
                }}
                className="uppercase text-center px-1 truncate w-full"
              >
                {t.title}
              </span>
            </>
          );

          if (t.onClick) {
            return (
              <button 
                key={t.id || t.title} 
                onClick={t.onClick}
                data-active={isActive}
                type="button"
                className={baseClasses}
              >
                {content}
              </button>
            );
          }

          return (
            <Link 
              key={t.href || t.title} 
              href={t.href || "#"} 
              prefetch 
              data-active={isActive}
              className={baseClasses}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
