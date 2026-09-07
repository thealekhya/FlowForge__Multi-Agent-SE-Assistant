import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "cyan"
    | "glow";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer select-none";

    const variantStyles = {
      default:
        "btn-shimmer relative bg-gradient-to-r from-signal-indigo via-signal-violet to-signal-cyan text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] hover:shadow-[0_0_28px_rgba(6,182,212,0.5)] border border-white/20 hover:border-white/40",
      glow:
        "bg-surface-bedrock hover:bg-black/90 text-white border border-white/20 hover:border-signal-cyan shadow-[0_0_16px_rgba(6,182,212,0.2)] hover:shadow-[0_0_24px_rgba(6,182,212,0.4)]",
      secondary:
        "bg-surface-panel hover:bg-surface-panel-hover text-white border border-white/10 hover:border-white/20 shadow-sm",
      outline:
        "border border-white/15 bg-transparent hover:bg-white/[0.06] text-white hover:border-white/30",
      ghost:
        "hover:bg-white/[0.08] hover:text-white text-on-surface-variant",
      destructive:
        "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]",
      cyan:
        "bg-signal-cyan/15 hover:bg-signal-cyan/25 text-signal-cyan border border-signal-cyan/40 shadow-[0_0_16px_rgba(6,182,212,0.25)]",
    };

    const sizeStyles = {
      default: "h-10 px-4 py-2",
      sm: "h-8 rounded-lg px-3 text-xs",
      lg: "h-12 rounded-xl px-6 text-base font-semibold",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span className="material-symbols-outlined text-base animate-spin mr-2">
            progress_activity
          </span>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
