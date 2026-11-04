"use client";

import * as React from "react";
import { cn } from "cn";
import { X } from "lucide-react";

type ChipProps = Omit<React.ComponentProps<"button">, "onChange"> & {
  selected: boolean;
  onSelectedChange?: (selected: boolean) => void;
};

// Selectable pill. Selected = orange border, Orange 50 fill, Orange 700 text and ✕.
function Chip({ selected, onSelectedChange, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      data-slot="chip"
      aria-pressed={selected}
      onClick={() => onSelectedChange?.(!selected)}
      className={cn(
        "inline-flex h-[34px] items-center gap-1.5 rounded-pill border-[1.5px] px-3.5 text-small transition-colors outline-none focus-visible:ring-3 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-brand-500 bg-brand-50 font-medium text-brand-700"
          : "border-line bg-white text-ink hover:border-brand-500",
        className
      )}
      {...props}
    >
      {children}
      {selected && <X aria-hidden strokeWidth={2} className="size-3.5" />}
    </button>
  );
}

type ChipGroupProps = {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  /** Accessible name for the group. */
  label: string;
  className?: string;
};

// Multi-select chip group (controlled).
function ChipGroup({ options, value, onChange, label, className }: ChipGroupProps) {
  const toggle = (option: string, selected: boolean) =>
    onChange(selected ? [...value, option] : value.filter((v) => v !== option));

  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => (
        <Chip
          key={option}
          selected={value.includes(option)}
          onSelectedChange={(selected) => toggle(option, selected)}
        >
          {option}
        </Chip>
      ))}
    </div>
  );
}

export { Chip, ChipGroup };
