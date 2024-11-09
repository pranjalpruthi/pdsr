"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface NumberPickerProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  max?: number;
}

const AnimatedNumber = ({ value }: { value: number }) => {
  return (
    <motion.div
      key={value}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {value}
    </motion.div>
  );
};

const NumberPickerContent = ({ 
  value, 
  onChange, 
  onClose 
}: { 
  value: number; 
  onChange: (value: number) => void;
  onClose?: () => void;
}) => {
  const [localValue, setLocalValue] = React.useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const updateValue = (newValue: number) => {
    const validValue = Math.max(0, Math.min(32, newValue));
    setLocalValue(validValue);
    onChange(validValue);
  };

  return (
    <div className="flex flex-col items-center gap-2 p-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => updateValue(localValue - 1)}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        <div className="relative w-20 h-10">
          <AnimatePresence mode="wait">
            <AnimatedNumber value={localValue} />
          </AnimatePresence>
          <Input
            type="number"
            value={localValue}
            onChange={(e) => updateValue(Number(e.target.value))}
            className="absolute inset-0 opacity-0 cursor-default"
            min={0}
            max={32}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => updateValue(localValue + 1)}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative h-[200px] w-full overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="h-[40%] bg-gradient-to-b from-background to-transparent" />
          <div className="h-[20%]" />
          <div className="h-[40%] bg-gradient-to-t from-background to-transparent" />
        </div>
        
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-12 z-20">
          <div className="absolute inset-0 border-y border-border" />
          <div className="absolute inset-0 bg-primary/5" />
        </div>

        <motion.div
          className="absolute inset-0 py-[82px]"
          drag="y"
          dragConstraints={{ top: -48 * 32, bottom: 0 }}
          dragElastic={0.1}
          dragMomentum={false}
          animate={{ y: -localValue * 48 }}
          transition={{ type: "spring", stiffness: 400, damping: 40 }}
          onDragEnd={(_, info) => {
            const offset = info.offset.y;
            const newIndex = Math.round(-offset / 48);
            updateValue(newIndex);
          }}
        >
          {Array.from({ length: 33 }, (_, i) => (
            <motion.div
              key={i}
              className={cn(
                "h-12 flex items-center justify-center",
                "text-2xl transition-all duration-200",
                localValue === i 
                  ? "text-primary font-bold scale-110" 
                  : "text-muted-foreground/50 hover:text-muted-foreground"
              )}
              animate={{
                opacity: Math.abs(localValue - i) > 4 ? 0.3 : 
                         Math.abs(localValue - i) > 2 ? 0.5 : 
                         localValue === i ? 1 : 0.7
              }}
              onClick={() => {
                updateValue(i);
                onClose?.();
              }}
            >
              {i}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export function NumberPicker({ value, onChange, label, max = 32 }: NumberPickerProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span>{label}</span>
            <span className="font-medium">{value} rounds</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{label}</DrawerTitle>
          </DrawerHeader>
          <NumberPickerContent value={value} onChange={onChange} />
          <DrawerFooter>
            <DrawerClose asChild>
              <Button>Confirm</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span>{label}</span>
          <span className="font-medium">{value} rounds</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-0">
        <NumberPickerContent value={value} onChange={onChange} />
      </PopoverContent>
    </Popover>
  );
}