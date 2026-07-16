import { formatINR } from "@/lib/utils";

export function Currency({ 
  value, 
  className = "" 
}: { 
  value: number | string; 
  className?: string;
}) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const formatted = formatINR(numValue);
  
  const isNegative = numValue < 0;
  const numericPart = formatted.startsWith('-') ? formatted.substring(1) : formatted;
  
  return (
    <span className={className}>
      {isNegative && "-"}
      <span className="rupee">₹</span>
      {numericPart}
    </span>
  );
}
