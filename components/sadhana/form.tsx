"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from 'motion/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, Minus, Type, MousePointerClick, Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase, calculateScores } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Devotee } from "@/types/sadhana";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoCircledIcon, CheckCircledIcon } from "@radix-ui/react-icons"
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress"
import { NumberPicker } from "@/components/ui/number-picker";
import { Separator } from "@/components/ui/separator";


const formSchema = z.object({
  date: z.date({ message: "Date is required" }),
  devotee_id: z.string({ message: "Please select a devotee" }),
  before_7_am_japa_session: z.number().min(0, "Must be 0 or greater"),
  before_7_am: z.number().min(0, "Must be 0 or greater"),
  from_7_to_9_am: z.number().min(0, "Must be 0 or greater"),
  after_9_am: z.number().min(0, "Must be 0 or greater"),
  book_name: z.string().optional(),
  book_reading_time_min: z.number().min(0),
  lecture_speaker: z.string().optional(),
  lecture_time_min: z.number().min(0),
  seva_name: z.string().optional(),
  seva_time_min: z.number().min(0),
}).refine((data) => {
  if (data.book_reading_time_min > 0 && !data.book_name) {
    return false;
  }
  if (data.lecture_time_min > 0 && !data.lecture_speaker) {
    return false;
  }
  if (data.seva_time_min > 0 && !data.seva_name) {
    return false;
  }
  return true;
}, {
  message: "Please fill in all required fields",
  path: ["form"]
});

const STEPS = {
  INPUT: 0,
  CONFIRM: 1,
} as const;

const STEPS_TITLES = [
  "Fill Details",
  "Confirm & Submit",
];

interface SadhanaFormProps {
  onNavigateToRecords: () => void;
}

function ConfirmationStep({ values, textSize }: { values: z.infer<typeof formSchema>, textSize: number }) {
  const totalRounds =
    values.before_7_am_japa_session +
    values.before_7_am +
    values.from_7_to_9_am +
    values.after_9_am;

  return (
    <div className="space-y-6">
      <Alert>
        <CheckCircledIcon className="h-5 w-5" />
        <AlertTitle style={{ fontSize: `${textSize}rem` }}>Please review your sadhana report</AlertTitle>
        <AlertDescription style={{ fontSize: `${textSize * 0.875}rem` }}>
          Verify all details before submitting
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="font-semibold" style={{ fontSize: `${textSize}rem` }}>Date:</div>
            <div style={{ fontSize: `${textSize}rem` }}>{format(values.date, 'PPP')}</div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="font-semibold" style={{ fontSize: `${textSize}rem` }}>Total Japa Rounds:</div>
            <div className="font-bold text-primary" style={{ fontSize: `${textSize * 1.1}rem` }}>{totalRounds} rounds</div>
          </div>

          {values.book_reading_time_min > 0 && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="font-semibold" style={{ fontSize: `${textSize}rem` }}>Book Reading:</div>
                <div style={{ fontSize: `${textSize}rem` }}>{values.book_name} ({values.book_reading_time_min} min)</div>
              </div>
            </>
          )}

          {values.lecture_time_min > 0 && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="font-semibold" style={{ fontSize: `${textSize}rem` }}>Lecture:</div>
                <div style={{ fontSize: `${textSize}rem` }}>{values.lecture_speaker} ({values.lecture_time_min} min)</div>
              </div>
            </>
          )}

          {values.seva_time_min > 0 && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="font-semibold" style={{ fontSize: `${textSize}rem` }}>Seva:</div>
                <div style={{ fontSize: `${textSize}rem` }}>{values.seva_name} ({values.seva_time_min} min)</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function SadhanaForm({ onNavigateToRecords }: SadhanaFormProps) {
  const [devotees, setDevotees] = useState<Devotee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [step, setStep] = useState<number>(STEPS.INPUT);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Accessibility states
  const [textSize, setTextSize] = useState(1); // rem units
  const [buttonSize, setButtonSize] = useState(1); // multiplier
  const [openDevotee, setOpenDevotee] = useState(false);

  // Add dimension tracking
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        setDimensions({ width: offsetWidth, height: offsetHeight });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      devotee_id: "",
      before_7_am_japa_session: 0,
      before_7_am: 0,
      from_7_to_9_am: 0,
      after_9_am: 0,
      book_name: "",
      book_reading_time_min: 0,
      lecture_speaker: "",
      lecture_time_min: 0,
      seva_name: "",
      seva_time_min: 0,
    },
  });

  useEffect(() => {
    async function loadDevotees() {
      const { data, error } = await supabase
        .from('devotees')
        .select('devotee_id, devotee_name');
      
      if (data && !error) {
        setDevotees(data);
      }
    }
    
    loadDevotees();
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Convert the date to UTC before submission
    const utcDate = new Date(Date.UTC(
      values.date.getFullYear(),
      values.date.getMonth(),
      values.date.getDate()
    ));

    const submissionValues = {
      ...values,
      date: utcDate, // Use the UTC date
    };

    // First validate the current step
    const isCurrentStepValid = await validateCurrentStep();
    if (!isCurrentStepValid) {
      toast.error("Please fill in all required fields for this step");
      setIsLoading(false);
      return;
    }

    let loadingToast: string | number | null = null;

    try {
      setIsLoading(true);
      loadingToast = toast.loading("Submitting your sadhana report", {
        description: "Please wait while we process your submission..."
      });

      // Validate total rounds (sum of all japa fields)
      const totalRounds = 
        submissionValues.before_7_am_japa_session + 
        submissionValues.before_7_am + 
        submissionValues.from_7_to_9_am + 
        submissionValues.after_9_am;

      if (totalRounds === 0) {
        if (loadingToast) toast.dismiss(loadingToast);
        toast.error("Invalid Japa Rounds", {
          description: "Please enter at least one round of japa"
        });
        setIsLoading(false);
        return;
      }

      if (!submissionValues.devotee_id) {
        if (loadingToast) toast.dismiss(loadingToast);
        toast.error("Required Field Missing", {
          description: "Please select a devotee name"
        });
        setIsLoading(false);
        return;
      }

      const devoteeIdParsed = parseInt(submissionValues.devotee_id, 10);
      if (isNaN(devoteeIdParsed)) {
        if (loadingToast) toast.dismiss(loadingToast);
        toast.error("Required Field Missing", {
          description: "Please select a valid devotee"
        });
        setIsLoading(false);
        return;
      }

      const scores = calculateScores(
        submissionValues.before_7_am_japa_session,
        submissionValues.before_7_am,
        submissionValues.from_7_to_9_am,
        submissionValues.after_9_am,
        submissionValues.book_reading_time_min,
        submissionValues.lecture_time_min,
        submissionValues.seva_time_min
      );

      const insertPayload = {
        date: submissionValues.date,
        devotee_id: devoteeIdParsed,
        before_7_am_japa_session: submissionValues.before_7_am_japa_session,
        before_7_am: submissionValues.before_7_am,
        from_7_to_9_am: submissionValues.from_7_to_9_am,
        after_9_am: submissionValues.after_9_am,
        book_name: submissionValues.book_name || null,
        book_reading_time_min: submissionValues.book_reading_time_min,
        lecture_speaker: submissionValues.lecture_speaker || null,
        lecture_time_min: submissionValues.lecture_time_min,
        seva_name: submissionValues.seva_name || null,
        seva_time_min: submissionValues.seva_time_min,
        ...scores,
      };

      const { data, error } = await supabase
        .from('sadhna_report')
        .insert([insertPayload])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        toast.dismiss(loadingToast);
        toast.success("Hare Krishna! 🙏", {
          description: "Your sadhana report has been submitted successfully.",
          action: {
            label: "View Reports",
            onClick: () => {
              onNavigateToRecords();
              router.refresh();
            },
          },
        });

        form.reset();
        setStep(STEPS.INPUT); // Reset to first step after successful submission
      }

    } catch (error: any) {
      console.error('Submission error:', error);
      if (loadingToast) toast.dismiss(loadingToast);
      toast.error("Submission Failed", {
        description: error?.message || (typeof error === 'string' ? error : "Please try submitting your report again.")
      });

    } finally {
      setIsLoading(false);
    }
  }

  const progress = ((step + 1) / Object.keys(STEPS).length) * 100;

  // Helper function to handle step navigation
  const handleStepChange = async (direction: 'next' | 'prev') => {
    if (direction === 'next' && step < Object.keys(STEPS).length - 1) {
      const currentStepValid = await validateCurrentStep();
      if (currentStepValid) {
        setStep((prevStep) => prevStep + 1);
      }
    } else if (direction === 'prev' && step > 0) {
      setStep((prevStep) => prevStep - 1);
    }
  };

  // Validate current step fields
  async function validateCurrentStep() {
    if (step === STEPS.INPUT) {
      // Validate personal details
      const personalValid = await form.trigger(['date', 'devotee_id']);
      if (!personalValid) {
        toast.error("Please select a devotee and date");
        return false;
      }

      // Validate japa
      const totalRounds =
        form.getValues('before_7_am_japa_session') +
        form.getValues('before_7_am') +
        form.getValues('from_7_to_9_am') +
        form.getValues('after_9_am');

      if (totalRounds === 0) {
        toast.error("Please enter at least one round of japa");
        return false;
      }

      // Validate reading
      const bookTime = form.getValues('book_reading_time_min');
      if (bookTime > 0 && !form.getValues('book_name')) {
        toast.error("Please enter the book name");
        return false;
      }

      // Validate lecture
      const lectureTime = form.getValues('lecture_time_min');
      if (lectureTime > 0 && !form.getValues('lecture_speaker')) {
        toast.error("Please enter the lecture speaker");
        return false;
      }

      // Validate seva
      const sevaTime = form.getValues('seva_time_min');
      if (sevaTime > 0 && !form.getValues('seva_name')) {
        toast.error("Please enter the seva name");
        return false;
      }

      return true;
    }
    return true;
  }

  // Helper functions for accessibility
  const increaseTextSize = () => {
    setTextSize(prev => Math.min(prev + 0.1, 1.5));
  };

  const decreaseTextSize = () => {
    setTextSize(prev => Math.max(prev - 0.1, 0.8));
  };

  const increaseButtonSize = () => {
    setButtonSize(prev => Math.min(prev + 0.1, 1.5));
  };

  const decreaseButtonSize = () => {
    setButtonSize(prev => Math.max(prev - 0.1, 0.8));
  };

  return (
    <div className="pt-6">
      <Card 
        ref={containerRef}
        className="p-2 mt-6 relative z-10 size-full rounded-[20px]"
        style={{
          "--border-size": "2px",
          "--border-radius": "20px",
          "--neon-first-color": "#ff00aa",
          "--neon-second-color": "#00FFF1",
          "--card-width": `${dimensions.width}px`,
          "--card-height": `${dimensions.height}px`,
          "--card-content-radius": "18px",
          "--pseudo-element-width": `calc(100% + 4px)`,
          "--pseudo-element-height": `calc(100% + 4px)`,
          "--after-blur": `${Math.max(dimensions.width / 12, 15)}px`,
        } as React.CSSProperties}
      >
        <div
          className={cn(
            "relative size-full min-h-[inherit] rounded-[var(--card-content-radius)] bg-gray-100 p-6",
            "dark:bg-black",
            "before:absolute before:inset-[-2px] before:-z-10 before:block",
            "before:rounded-[var(--border-radius)] before:content-['']",
            "before:bg-[linear-gradient(0deg,var(--neon-first-color),var(--neon-second-color))] before:bg-[length:100%_200%]",
            "before:animate-background-position-spin",
            "after:absolute after:inset-[-2px] after:-z-10 after:block",
            "after:rounded-[var(--border-radius)] after:blur-[var(--after-blur)] after:content-['']",
            "after:bg-[linear-gradient(0deg,var(--neon-first-color),var(--neon-second-color))] after:bg-[length:100%_200%]",
            "after:opacity-40",
            "after:animate-background-position-spin",
          )}
        >
          <CardHeader className="pb-6 pt-8 text-center space-y-3">
            <CardTitle className="flex items-center justify-center gap-3 text-2xl font-bold">
              <span className="animate-pulse">📝</span>
              Fill Your Daily Sadhna Report
              <span className="animate-pulse">📿</span>
            </CardTitle>
            <CardDescription className="text-center pt-3 text-base">
              Hare Krishna! Please fill in your daily spiritual activities
            </CardDescription>
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Step {step + 1} of {Object.keys(STEPS).length}: {STEPS_TITLES[step]}
              </p>
            </div>

            {/* Accessibility Controls */}
            <div className="flex flex-wrap justify-center gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Text Size:</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={decreaseTextSize}
                  disabled={textSize <= 0.8}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={increaseTextSize}
                  disabled={textSize >= 1.5}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Button Size:</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={decreaseButtonSize}
                  disabled={buttonSize <= 0.8}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={increaseButtonSize}
                  disabled={buttonSize >= 1.5}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-2 pb-6 px-4 sm:px-6">
            <Form {...form}>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -50, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {step === STEPS.INPUT && (
                      <div className="space-y-8">
                        {/* Personal Details Section */}
                        <div className="space-y-4">
                          <h3
                            className="font-semibold text-lg border-b pb-2"
                            style={{ fontSize: `${textSize * 1.125}rem` }}
                          >
                            👤 Personal Details
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="date"
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel style={{ fontSize: `${textSize}rem` }}>📅 Date</FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant={"outline"}
                                          className="w-full pl-3 text-left font-normal"
                                          style={{
                                            height: `${buttonSize * 2.5}rem`,
                                            fontSize: `${textSize}rem`
                                          }}
                                        >
                                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="devotee_id"
                              render={({ field }) => (
                                <FormItem className="flex flex-col pt-2.5">
                                  <FormLabel style={{ fontSize: `${textSize}rem` }}>🙏 Devotee Name</FormLabel>
                                  <Popover open={openDevotee} onOpenChange={setOpenDevotee}>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant="outline"
                                          role="combobox"
                                          className={cn(
                                            "w-full justify-between",
                                            !field.value && "text-muted-foreground"
                                          )}
                                          style={{
                                            height: `${buttonSize * 2.5}rem`,
                                            fontSize: `${textSize}rem`
                                          }}
                                        >
                                          {field.value
                                            ? devotees.find(
                                                (devotee) => devotee.devotee_id.toString() === field.value
                                              )?.devotee_name
                                            : "Select devotee"}
                                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0">
                                      <Command>
                                        <CommandInput placeholder="Search devotee..." />
                                        <CommandList>
                                          <CommandEmpty>No devotee found.</CommandEmpty>
                                          <CommandGroup>
                                            {devotees.map((devotee) => (
                                              <CommandItem
                                                value={devotee.devotee_name}
                                                key={devotee.devotee_id}
                                                onSelect={() => {
                                                  form.setValue("devotee_id", devotee.devotee_id.toString());
                                                  setOpenDevotee(false);
                                                }}
                                                onMouseDown={(e) => {
                                                  e.preventDefault();
                                                  form.setValue("devotee_id", devotee.devotee_id.toString());
                                                  setOpenDevotee(false);
                                                }}
                                              >
                                                <Check
                                                  className={cn(
                                                    "mr-2 h-4 w-4",
                                                    devotee.devotee_id.toString() === field.value
                                                      ? "opacity-100"
                                                      : "opacity-0"
                                                  )}
                                                />
                                                {devotee.devotee_name}
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* JAPA Section */}
                        <div className="space-y-4">
                          <h3
                            className="font-semibold text-lg border-b pb-2"
                            style={{ fontSize: `${textSize * 1.125}rem` }}
                          >
                            📿 JAPA
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="before_7_am_japa_session"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel style={{ fontSize: `${textSize}rem` }}>🌅 Before 7 am (Japa Session)</FormLabel>
                                  <FormControl>
                                    <NumberPicker
                                      value={field.value}
                                      onChange={field.onChange}
                                      label="Japa Session Rounds"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="before_7_am"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel style={{ fontSize: `${textSize}rem` }}>🌄 Before 7 am</FormLabel>
                                  <FormControl>
                                    <NumberPicker
                                      value={field.value}
                                      onChange={field.onChange}
                                      label="Before 7 am Rounds"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="from_7_to_9_am"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel style={{ fontSize: `${textSize}rem` }}>🕖 7 to 09 am</FormLabel>
                                  <FormControl>
                                    <NumberPicker
                                      value={field.value}
                                      onChange={field.onChange}
                                      label="7-9 am Rounds"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="after_9_am"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel style={{ fontSize: `${textSize}rem` }}>🌞 After 9 am</FormLabel>
                                  <FormControl>
                                    <NumberPicker
                                      value={field.value}
                                      onChange={field.onChange}
                                      label="After 9 am Rounds"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* READING Section */}
                        <div className="space-y-4">
                          <h3
                            className="font-semibold text-lg border-b pb-2"
                            style={{ fontSize: `${textSize * 1.125}rem` }}
                          >
                            📚 READING
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="book_name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel style={{ fontSize: `${textSize}rem` }}>📚 Book Name</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      style={{
                                        height: `${buttonSize * 2.5}rem`,
                                        fontSize: `${textSize}rem`
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="book_reading_time_min"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel style={{ fontSize: `${textSize}rem` }}>📖 Reading Time (min)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      style={{
                                        height: `${buttonSize * 2.5}rem`,
                                        fontSize: `${textSize}rem`
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* LECTURE Section */}
                        <div className="space-y-4">
                          <h3
                            className="font-semibold text-lg border-b pb-2"
                            style={{ fontSize: `${textSize * 1.125}rem` }}
                          >
                            🎤 LECTURE
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="lecture_speaker"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel style={{ fontSize: `${textSize}rem` }}>🎤 Lecture Speaker</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      style={{
                                        height: `${buttonSize * 2.5}rem`,
                                        fontSize: `${textSize}rem`
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="lecture_time_min"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel style={{ fontSize: `${textSize}rem` }}>🕰️ Lecture Time (min)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      style={{
                                        height: `${buttonSize * 2.5}rem`,
                                        fontSize: `${textSize}rem`
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* SEVA Section */}
                        <div className="space-y-4">
                          <h3
                            className="font-semibold text-lg border-b pb-2"
                            style={{ fontSize: `${textSize * 1.125}rem` }}
                          >
                            🛠️ SEVA
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="seva_name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel style={{ fontSize: `${textSize}rem` }}>🛠️ Seva Name</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      style={{
                                        height: `${buttonSize * 2.5}rem`,
                                        fontSize: `${textSize}rem`
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="seva_time_min"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel style={{ fontSize: `${textSize}rem` }}>⏳ Seva Time (min)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      style={{
                                        height: `${buttonSize * 2.5}rem`,
                                        fontSize: `${textSize}rem`
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {step === STEPS.CONFIRM && (
                      <ConfirmationStep values={form.getValues()} textSize={textSize} />
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-between pt-4 space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleStepChange('prev')}
                    disabled={step === 0}
                    style={{
                      height: `${buttonSize * 2.5}rem`,
                      fontSize: `${textSize}rem`,
                      minWidth: `${buttonSize * 6}rem`
                    }}
                  >
                    Previous
                  </Button>

                  {step === STEPS.CONFIRM ? (
                    <Button
                      type="submit"
                      disabled={isLoading}
                      onClick={(e) => {
                        e.preventDefault();
                        form.handleSubmit(onSubmit)(e);
                      }}
                      style={{
                        height: `${buttonSize * 2.5}rem`,
                        fontSize: `${textSize}rem`,
                        minWidth: `${buttonSize * 8}rem`
                      }}
                    >
                      {isLoading ? "Submitting..." : "Submit Report"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => handleStepChange('next')}
                      style={{
                        height: `${buttonSize * 2.5}rem`,
                        fontSize: `${textSize}rem`,
                        minWidth: `${buttonSize * 6}rem`
                      }}
                    >
                      Review & Confirm
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}