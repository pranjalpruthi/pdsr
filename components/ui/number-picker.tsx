"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumberPickerProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  max?: number;
}

export function NumberPicker({ value, onChange, label, max = 16 }: NumberPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {Array.from({ length: max + 1 }, (_, i) => (
          <Button
            key={i}
            type="button"
            variant={value === i ? "default" : "outline"}
            className={cn(
              "h-9 w-9 sm:h-10 sm:w-10 p-0 text-sm font-medium transition-colors",
              value === i && "bg-primary text-primary-foreground shadow-sm"
            )}
            onClick={() => onChange(i)}
          >
            {i}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-1">
        <span className="text-sm text-muted-foreground whitespace-nowrap">Enter manually:</span>
        <Input 
          type="number" 
          value={value === 0 ? "" : value} 
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder="0"
          className="w-24 h-9"
          min={0}
        />
      </div>
    </div>
  );
}