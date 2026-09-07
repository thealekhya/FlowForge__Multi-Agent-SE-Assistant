import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-3 text-sm text-white placeholder:text-outline/70 transition-all duration-150 focus-visible:outline-none focus-visible:border-signal-cyan focus-visible:ring-2 focus-visible:ring-signal-cyan/20 focus-visible:shadow-[0_0_16px_rgba(6,182,212,0.15)] disabled:cursor-not-allowed disabled:opacity-50 resize-y font-mono leading-relaxed",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
