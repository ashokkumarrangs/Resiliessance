import React from "react";
import { CheckCircle2 } from "lucide-react";

interface SaveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isSaving: boolean;
  label?: string;
  savingLabel?: string;
}

export function SaveButton({ 
  isSaving, 
  label = "Save Entry", 
  savingLabel = "Processing...", 
  className = "",
  disabled,
  ...props 
}: SaveButtonProps) {
  return (
    <button
      disabled={isSaving || disabled}
      className={`w-full h-12 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none disabled:active:scale-100 mt-8 ${className}`}
      {...props}
    >
      {isSaving ? (
        <>
          <div className="w-5 h-5 border-2 border-current/20 border-t-current rounded-full animate-spin"></div>
          {savingLabel}
        </>
      ) : (
        <>
          <CheckCircle2 className="w-5 h-5" />
          {label}
        </>
      )}
    </button>
  );
}
