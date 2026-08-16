"use client"

import React, { useState, useEffect, useRef } from "react"
import { ChevronDown, CheckCircle2 } from "lucide-react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Select({
  value,
  onChange,
  className,
  disabled,
  dropdownClassName,
  children,
  ...props
}: {
  value: any
  onChange: (e: any) => void
  className?: string
  disabled?: boolean
  dropdownClassName?: string
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Extract options from children <option value="X">Label</option>
  const options = React.Children.toArray(children)
    .map((child) => {
      const el = child as React.ReactElement<any>
      if (el && el.type === "option") {
        return {
          value:
            el.props.value !== undefined ? el.props.value : el.props.children,
          label: el.props.children,
        }
      }
      return null
    })
    .filter(Boolean) as { value: string | number; label: string }[]

  const selectedLabel =
    options.find((o) => String(o.value) === String(value))?.label || value

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      setIsOpen(!isOpen)
    } else if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  return (
    <div
      ref={containerRef}
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-controls={isOpen ? "select-options" : undefined}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      className={`relative z-30 flex cursor-pointer items-center justify-between outline-none select-none ${disabled ? "pointer-events-none cursor-not-allowed opacity-50" : ""} ${className || "h-11 w-full rounded-md border border-border bg-muted px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/20"}`}
      onClick={(e) => {
        if (disabled) return
        e.preventDefault()
        e.stopPropagation()
        setIsOpen(!isOpen)
      }}
      {...props}
    >
      <span className="truncate">{selectedLabel}</span>
      <ChevronDown
        size={14}
        className="pointer-events-none ml-2 shrink-0 opacity-50"
      />

      {isOpen && (
        <div
          id="select-options"
          role="listbox"
          className={`absolute top-full left-0 z-[100] mt-1 max-h-72 w-max min-w-full max-w-[260px] overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-md before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150 ${dropdownClassName || ""}`}
        >
          {options.map((opt, i) => (
            <div
              key={i}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                containerRef.current?.focus()
                if (onChange) onChange({ target: { value: opt.value } })
                setIsOpen(false)
              }}
              className={`mb-0.5 flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-xs font-bold whitespace-nowrap transition-all last:mb-0 ${
                String(value) === String(opt.value)
                  ? "bg-accent font-black text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className="whitespace-nowrap">{opt.label}</span>
              {String(value) === String(opt.value) && (
                <CheckCircle2
                  size={12}
                  className="shrink-0 text-accent-foreground"
                />
              )}
            </div>
          ))}
          {options.length === 0 && (
            <div className="px-3 py-4 text-center">
              <p className="text-[10px] font-black tracking-widest text-muted-foreground/30 uppercase">
                Empty List
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
