"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { gradient?: boolean; glow?: "orange" | "blue" | "green" }
>(({ className, gradient, glow, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-white/10 bg-card text-card-foreground",
      gradient && "bg-gradient-to-b from-white/[0.08] to-white/[0.02]",
      glow === "orange" && "glow-orange",
      glow === "blue" && "glow-blue",
      glow === "green" && "glow-green",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-bold leading-none tracking-tight font-display",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// Animated glass card
const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }
>(({ className, hover = true, children, ...props }, ref) => (
  <motion.div
    ref={ref}
    whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className={cn(
      "glass rounded-2xl p-6 transition-all duration-300",
      hover && "hover:bg-white/[0.06] hover:border-white/20",
      className
    )}
    {...props}
  >
    {children}
  </motion.div>
));
GlassCard.displayName = "GlassCard";

// Stats card
const StatsCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    label: string;
    value: string | number;
    subValue?: string;
    icon?: React.ReactNode;
    trend?: "up" | "down";
    trendValue?: string;
  }
>(({ className, label, value, subValue, icon, trend, trendValue, ...props }, ref) => (
  <GlassCard ref={ref} className={cn("", className)} {...props}>
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold font-display tracking-tight">{value}</p>
        {subValue && (
          <p className="text-sm text-muted-foreground">{subValue}</p>
        )}
        {trend && trendValue && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            trend === "up" ? "text-green-500" : "text-red-500"
          )}>
            {trend === "up" ? "↑" : "↓"} {trendValue}
          </div>
        )}
      </div>
      {icon && (
        <div className="p-3 rounded-xl bg-white/5">
          {icon}
        </div>
      )}
    </div>
  </GlassCard>
));
StatsCard.displayName = "StatsCard";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, GlassCard, StatsCard };

