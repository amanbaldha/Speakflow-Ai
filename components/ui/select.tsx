import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SimpleSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  options: SelectOption[];
  onChange: (value: string) => void;
}

/** A plain, fully-controlled native <select> styled to match the rest of
 *  the UI — deliberately not a custom-rendered listbox, so it stays
 *  keyboard- and screen-reader-accessible with zero extra work. */
export const Select = React.forwardRef<HTMLSelectElement, SimpleSelectProps>(
  ({ className, options, onChange, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "h-11 w-full appearance-none rounded-xl border border-border bg-surface-2 px-3.5 pr-9 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent",
          className
        )}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
);
Select.displayName = "Select";
