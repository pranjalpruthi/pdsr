"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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


const formSchema = z.object({
  date: z.date({
    required_error: "Date is required",
  }),
  devotee_id: z.string({
    required_error: "Please select a devotee",
  }),
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
  PERSONAL: 0,
  JAPA: 1,
  READING: 2,
  LECTURE: 3,
  SEVA: 4,
  CONFIRM: 5,
} as const;

const STEPS_TITLES = [
  "Personal Details",
  "Japa Rounds",
  "Book Reading",
  "Lecture",
  "Seva",
  "Confirm",
];

interface SadhanaFormProps {
  onNavigateToRecords: () => void;
}

function ConfirmationStep({ values }: { values: z.infer<typeof formSchema> }) {
  const totalRounds = 
    values.before_7_am_japa_session + 
    values.before_7_am + 
    values.from_7_to_9_am + 
    values.after_9_am;

  return (
    <div className="space-y-6">
      <Alert>
        <CheckCircledIcon className="h-4 w-4" />
        <AlertTitle>Please review your sadhana report</AlertTitle>
        <AlertDescription>
          Verify all details before submitting
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="font-medium">Date:</div>
          <div>{format(values.date, 'PPP')}</div>
          
          <div className="font-medium">Total Japa Rounds:</div>
          <div>{totalRounds} rounds</div>
          
          {values.book_reading_time_min > 0 && (
            <>
              <div className="font-medium">Book Reading:</div>
              <div>{values.book_name} ({values.book_reading_time_min} min)</div>
            </>
          )}
          
          {values.lecture_time_min > 0 && (
            <>
              <div className="font-medium">Lecture:</div>
              <div>{values.lecture_speaker} ({values.lecture_time_min} min)</div>
            </>
          )}
          
          {values.seva_time_min > 0 && (
            <>
              <div className="font-medium">Seva:</div>
              <div>{values.seva_name} ({values.seva_time_min} min)</div>
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
  const [step, setStep] = useState<number>(STEPS.PERSONAL);

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

      const scores = calculateScores(
        submissionValues.before_7_am_japa_session,
        submissionValues.before_7_am,
        submissionValues.from_7_to_9_am,
        submissionValues.after_9_am,
        submissionValues.book_reading_time_min,
        submissionValues.lecture_time_min,
        submissionValues.seva_time_min
      );

      const { data, error } = await supabase
        .from('sadhna_report')
        .insert([{
          ...submissionValues,
          ...scores,
        }])
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
        setStep(STEPS.PERSONAL); // Reset to first step after successful submission
      }

    } catch (error) {
      console.error('Submission error:', error);
      if (loadingToast) toast.dismiss(loadingToast);
      toast.error("Submission Failed", {
        description: error instanceof Error ? error.message : "Please try submitting your report again."
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
    switch(step) {
      case STEPS.PERSONAL:
        const personalValid = await form.trigger(['date', 'devotee_id']);
        if (!personalValid) {
          toast.error("Please select a devotee and date");
          return false;
        }
        return true;

      case STEPS.JAPA:
        const japaValid = await form.trigger([
          'before_7_am_japa_session',
          'before_7_am',
          'from_7_to_9_am',
          'after_9_am'
        ]);
        if (!japaValid) {
          toast.error("Please enter valid japa rounds");
          return false;
        }
        return true;

      case STEPS.READING:
        const bookTime = form.getValues('book_reading_time_min');
        if (bookTime > 0) {
          const bookValid = await form.trigger(['book_name']);
          if (!bookValid) {
            toast.error("Please enter the book name");
            return false;
          }
        }
        return true;

      case STEPS.LECTURE:
        const lectureTime = form.getValues('lecture_time_min');
        if (lectureTime > 0) {
          const lectureValid = await form.trigger(['lecture_speaker']);
          if (!lectureValid) {
            toast.error("Please enter the lecture speaker");
            return false;
          }
        }
        return true;

      case STEPS.SEVA:
        const sevaTime = form.getValues('seva_time_min');
        if (sevaTime > 0) {
          const sevaValid = await form.trigger(['seva_name']);
          if (!sevaValid) {
            toast.error("Please enter the seva name");
            return false;
          }
        }
        return true;

      default:
        return true;
    }
  }

  return (
    <div className="pt-6">
      <Card className="p-2 mt-6">
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
                  {step === STEPS.PERSONAL && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>📅 Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full h-9 pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
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
                          <FormItem>
                            <FormLabel>🙏 Devotee Name</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select devotee" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {devotees.map((devotee) => (
                                  <SelectItem
                                    key={devotee.devotee_id}
                                    value={devotee.devotee_id.toString()}
                                  >
                                    {devotee.devotee_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {step === STEPS.JAPA && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="before_7_am_japa_session"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>🌅 Before 7 am (Japa Session)</FormLabel>
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
                            <FormLabel>🌄 Before 7 am</FormLabel>
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
                            <FormLabel>🕖 7 to 09 am</FormLabel>
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
                            <FormLabel>🌞 After 9 am</FormLabel>
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
                  )}

                  {step === STEPS.READING && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="book_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>📚 Book Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                            <FormLabel>📖 Book Reading Time (min)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {step === STEPS.LECTURE && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="lecture_speaker"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>🎤 Lecture Speaker</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                            <FormLabel>🕰️ Lecture Time (min)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {step === STEPS.SEVA && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="seva_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>🛠️ Seva Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                            <FormLabel>⏳ Seva Time (min)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {step === STEPS.CONFIRM && (
                    <ConfirmationStep values={form.getValues()} />
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-between pt-4 space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleStepChange('prev')}
                  disabled={step === 0}
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
                  >
                    {isLoading ? "Submitting..." : "Submit Report"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => handleStepChange('next')}
                  >
                    Next
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}