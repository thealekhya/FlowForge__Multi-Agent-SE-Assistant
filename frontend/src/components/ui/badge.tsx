import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "cyan"
    | "indigo"
    | "violet"
    | "success"
    | "warning"
    | "destructive";
  dot?: boolean;
  pulse?: boolean;
}

function Badge({
  className,
  variant = "default",
  dot = false,
  pulse = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default:
      "bg-white/[0.08] text-white border-white/[0.15] shadow-[0_0_12px_rgba(255,255,255,0.05)]",
    secondary:
      "bg-surface-panel text-on-surface-variant border-border-subtle hover:bg-surface-panel-hover",
    outline:
      "border-white/[0.15] text-white/90 bg-transparent",
    cyan:
      "bg-signal-cyan/10 text-signal-cyan border-signal-cyan/30 shadow-[0_0_12px_rgba(6,182,212,0.18)]",
    indigo:
      "bg-signal-indigo/10 text-signal-indigo border-signal-indigo/30 shadow-[0_0_12px_rgba(99,102,241,0.18)]",
    violet:
      "bg-signal-violet/10 text-signal-violet border-signal-violet/30 shadow-[0_0_12px_rgba(168,85,247,0.18)]",
    success:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.18)]",
    warning:
      "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.18)]",
    destructive:
      "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.18)]",
  };

  const dotColors = {
    default: "bg-white",
    secondary: "bg-slate-400",
    outline: "bg-white/70",
    cyan: "bg-signal-cyan",
    indigo: "bg-signal-indigo",
    violet: "bg-signal-violet",
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    destructive: "bg-rose-400",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-1 focus:ring-ring select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            dotColors[variant],
            pulse && "animate-pulse"
          )}
        />
      )}
      {children}
    </div>
  );
}

export { Badge };
