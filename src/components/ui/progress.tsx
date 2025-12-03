"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    indicatorClassName?: string;
  }
>(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-3 w-full overflow-hidden rounded-full bg-white/10",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 bg-primary transition-all duration-500 ease-out",
        indicatorClassName
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

// Health Factor gauge
const HealthFactorGauge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: number;
    label?: string;
  }
>(({ className, value, label, ...props }, ref) => {
  const getColor = () => {
    if (value < 1.1) return "bg-red-500";
    if (value < 1.5) return "bg-yellow-500";
    if (value < 2.5) return "bg-green-500";
    return "bg-cyan-500";
  };

  const getLabel = () => {
    if (value < 1.1) return "Critical";
    if (value < 1.5) return "Warning";
    if (value < 2.5) return "Good";
    return "Excellent";
  };

  const percentage = Math.min(((value - 1) / 3) * 100, 100);

  return (
    <div ref={ref} className={cn("space-y-2", className)} {...props}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Health Factor</span>
        <div className="flex items-center gap-2">
          <span className="font-bold font-display text-lg">
            {value === Infinity ? "∞" : value.toFixed(2)}
          </span>
          <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            value < 1.1 && "bg-red-500/20 text-red-400",
            value >= 1.1 && value < 1.5 && "bg-yellow-500/20 text-yellow-400",
            value >= 1.5 && value < 2.5 && "bg-green-500/20 text-green-400",
            value >= 2.5 && "bg-cyan-500/20 text-cyan-400"
          )}>
            {label || getLabel()}
          </span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={cn("h-full transition-all duration-500", getColor())}
          style={{ width: `${Math.max(percentage, 5)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Liquidation</span>
        <span>Safe</span>
      </div>
    </div>
  );
});
HealthFactorGauge.displayName = "HealthFactorGauge";

export { Progress, HealthFactorGauge };

