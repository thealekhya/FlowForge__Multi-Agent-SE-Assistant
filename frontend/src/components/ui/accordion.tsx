'use client';

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextValue {
  expandedItems: string[];
  toggleItem: (value: string) => void;
  variant: "default" | "separated";
}

const AccordionContext = React.createContext<AccordionContextValue | undefined>(undefined);

interface AccordionItemContextValue {
  value: string;
  isExpanded: boolean;
}

const AccordionItemContext = React.createContext<AccordionItemContextValue | undefined>(undefined);

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  collapsible?: boolean;
  variant?: "default" | "separated";
}

export function Accordion({
  type = "single",
  defaultValue,
  value,
  onValueChange,
  collapsible = true,
  variant = "separated",
  className,
  children,
  ...props
}: AccordionProps) {
  const [internalExpanded, setInternalExpanded] = React.useState<string[]>(() => {
    if (defaultValue) {
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
    }
    return [];
  });

  const expandedItems = React.useMemo(() => {
    if (value !== undefined) {
      return Array.isArray(value) ? value : [value];
    }
    return internalExpanded;
  }, [value, internalExpanded]);

  const toggleItem = React.useCallback(
    (itemValue: string) => {
      let next: string[];
      if (type === "single") {
        if (expandedItems.includes(itemValue)) {
          next = collapsible ? [] : [itemValue];
        } else {
          next = [itemValue];
        }
      } else {
        if (expandedItems.includes(itemValue)) {
          next = expandedItems.filter((i) => i !== itemValue);
        } else {
          next = [...expandedItems, itemValue];
        }
      }

      if (value === undefined) {
        setInternalExpanded(next);
      }
      onValueChange?.(type === "single" ? (next[0] || "") : next);
    },
    [type, collapsible, expandedItems, value, onValueChange]
  );

  return (
    <AccordionContext.Provider value={{ expandedItems, toggleItem, variant }}>
      <div
        className={cn(
          variant === "separated"
            ? "flex flex-col gap-3.5"
            : "flex flex-col divide-y divide-white/[0.08]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
}

export function AccordionItem({
  value: propValue,
  className,
  children,
  ...props
}: AccordionItemProps) {
  const generatedId = React.useId();
  const itemValue = propValue || generatedId;

  const ctx = React.useContext(AccordionContext);
  const isExpanded = ctx?.expandedItems.includes(itemValue) ?? false;
  const isSeparated = ctx?.variant === "separated";

  return (
    <AccordionItemContext.Provider value={{ value: itemValue, isExpanded }}>
      <div
        className={cn(
          "transition-all duration-300 relative overflow-hidden",
          isSeparated && [
            "rounded-2xl metallic-card border border-white/[0.1] px-5 sm:px-6",
            "hover:-translate-y-0.5 hover:border-white/25",
            isExpanded
              ? "border-signal-cyan/50 shadow-[0_12px_32px_-4px_rgba(6,182,212,0.18)]"
              : "hover:border-signal-cyan/30"
          ],
          className
        )}
        data-state={isExpanded ? "open" : "closed"}
        {...props}
      >
        {/* Accent left highlight beacon when open */}
        {isSeparated && (
          <div
            className={cn(
              "absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-signal-cyan via-signal-violet to-signal-indigo transition-opacity duration-300",
              isExpanded ? "opacity-100" : "opacity-0"
            )}
          />
        )}
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export interface AccordionTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  index?: string | number;
}

export function AccordionTrigger({
  index,
  className,
  children,
  ...props
}: AccordionTriggerProps) {
  const accordionCtx = React.useContext(AccordionContext);
  const itemCtx = React.useContext(AccordionItemContext);

  if (!itemCtx) {
    throw new Error("AccordionTrigger must be used within AccordionItem");
  }

  const { value, isExpanded } = itemCtx;

  return (
    <button
      type="button"
      onClick={() => accordionCtx?.toggleItem(value)}
      className={cn(
        "flex w-full items-center justify-between py-4 sm:py-5 text-left font-header font-bold text-base sm:text-lg text-white hover:text-signal-cyan transition-colors duration-200 group cursor-pointer select-none",
        isExpanded && "text-signal-cyan",
        className
      )}
      aria-expanded={isExpanded}
      {...props}
    >
      <div className="flex items-center gap-3.5 flex-1 pr-4">
        {index !== undefined && (
          <span
            className={cn(
              "font-mono text-xs font-bold px-2 py-0.5 rounded-md border transition-colors shrink-0",
              isExpanded
                ? "bg-signal-cyan/15 text-signal-cyan border-signal-cyan/40"
                : "bg-white/[0.04] text-outline border-white/10 group-hover:text-signal-cyan group-hover:border-signal-cyan/30"
            )}
          >
            {typeof index === "number" ? String(index).padStart(2, "0") : index}
          </span>
        )}
        <span className="leading-snug">{children}</span>
      </div>

      <div
        className={cn(
          "w-8 h-8 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-outline group-hover:text-signal-cyan group-hover:border-signal-cyan/40 transition-all duration-300 shrink-0",
          isExpanded && "rotate-180 bg-signal-cyan/15 text-signal-cyan border-signal-cyan/35 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
        )}
      >
        <ChevronDown className="w-4 h-4 transition-transform duration-300" />
      </div>
    </button>
  );
}

export interface AccordionPanelProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function AccordionPanel({
  className,
  children,
  ...props
}: AccordionPanelProps) {
  const itemCtx = React.useContext(AccordionItemContext);

  if (!itemCtx) {
    throw new Error("AccordionPanel must be used within AccordionItem");
  }

  const { isExpanded } = itemCtx;

  return (
    <div
      className={cn(
        "grid transition-all duration-300 ease-in-out",
        isExpanded
          ? "grid-rows-[1fr] opacity-100 pb-5 pt-0"
          : "grid-rows-[0fr] opacity-0 pb-0 pt-0 pointer-events-none"
      )}
      {...props}
    >
      <div className={cn("overflow-hidden text-xs sm:text-sm text-slate-300/90 leading-relaxed font-normal", className)}>
        {children}
      </div>
    </div>
  );
}

// Alias AccordionContent for standard Shadcn compatibility
export const AccordionContent = AccordionPanel;
