"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, suffix, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-4 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-base ring-offset-background",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all duration-200",
            icon && "pl-12",
            suffix && "pr-20",
            className
          )}
          ref={ref}
          {...props}
        />
        {suffix && (
          <div className="absolute right-4 text-muted-foreground font-medium">
            {suffix}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

// Large input for amounts
const AmountInput = React.forwardRef<
  HTMLInputElement,
  InputProps & { token?: string; balance?: string; onMaxClick?: () => void }
>(({ className, token, balance, onMaxClick, ...props }, ref) => {
  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="number"
          className={cn(
            "w-full h-20 rounded-2xl border border-white/10 bg-white/5 px-6",
            "text-3xl font-bold font-display tracking-tight",
            "placeholder:text-muted-foreground/50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all duration-200",
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            className
          )}
          ref={ref}
          {...props}
        />
        {token && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="text-xl font-semibold text-muted-foreground">{token}</span>
          </div>
        )}
      </div>
      {(balance || onMaxClick) && (
        <div className="flex items-center justify-between px-2 text-sm">
          {balance && (
            <span className="text-muted-foreground">Balance: {balance}</span>
          )}
          {onMaxClick && (
            <button
              type="button"
              onClick={onMaxClick}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              MAX
            </button>
          )}
        </div>
      )}
    </div>
  );
});
AmountInput.displayName = "AmountInput";

export { Input, AmountInput };

