"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trophy, TrendingUp, Crown, Star, Sparkles, Rocket, Award, Bell, BookOpen, Headphones, Heart, QuoteIcon, ArrowRight, Medal, ListIcon, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import Marquee from "@/components/ui/marquee";
import Meteors from "@/components/ui/meteors";
import { cn } from "@/lib/utils";
import ShinyButton from "@/components/ui/shiny-button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { SparklesText } from "@/components/ui/sparkles-text";
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { GradientBentoCard } from "@/components/ui/gradient-bento-card";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "@/components/ui/loader-circle";
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Cell, 
  LabelList,
  Line,
  ComposedChart,
  ResponsiveContainer,
  XAxis,
  YAxis
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ProgressTracker } from "./progress-tracker";

interface Improvement {
  devotee_name: string;
  improvement: number;
  percentageIncrease: number;
  date: string;
  scoreData: ScoreData[];
}

interface PersonalStats {
  devotee_name: string;
  currentScore: number;
  previousBest: number;
  improvement: number;
  percentageIncrease: number;
  before_7_am_japa_session: number;
  before_7_am: number;
  from_7_to_9_am: number;
  after_9_am: number;
  score_a: number;
  book_name: string;
  book_reading_time_min: number;
  score_b: number;
  lecture_speaker: string;
  lecture_time_min: number;
  score_c: number;
  seva_name: string;
  seva_time_min: number;
  score_d: number;
  scoreData: ScoreData[];
}

interface LeaderboardEntry {
  devotee_name: string;
  total_score: number;
  weekly_score: number;
  monthly_score: number;
}

interface ImprovementCardProps {
  improvement: Improvement;
  index: number;
  onClick: (improvement: Improvement) => void;
}

const ImprovementCard = ({ improvement, index, onClick }: ImprovementCardProps) => {
  const gradients = [
    "from-pink-500 via-purple-500 to-blue-500 dark:from-pink-600 dark:via-purple-600 dark:to-blue-600",
    "from-blue-500 via-teal-500 to-green-500 dark:from-blue-600 dark:via-teal-600 dark:to-green-600",
    "from-yellow-500 via-orange-500 to-red-500 dark:from-yellow-600 dark:via-orange-600 dark:to-red-600",
    "from-purple-500 via-pink-500 to-red-500 dark:from-purple-600 dark:via-pink-600 dark:to-red-600",
    "from-green-500 via-emerald-500 to-teal-500 dark:from-green-600 dark:via-emerald-600 dark:to-teal-600",
    "from-indigo-500 via-blue-500 to-cyan-500 dark:from-indigo-600 dark:via-blue-600 dark:to-cyan-600",
    "from-rose-500 via-red-500 to-orange-500 dark:from-rose-600 dark:via-red-600 dark:to-orange-600",
    "from-teal-500 via-cyan-500 to-blue-500 dark:from-teal-600 dark:via-cyan-600 dark:to-blue-600",
  ];

  return (
    <button
      onClick={async () => {
        const scoreData = await fetchScoreData(improvement.devotee_name);
        onClick({ ...improvement, scoreData });
      }}
      className={cn(
        "relative w-44 mx-2 overflow-hidden rounded-xl border p-3",
        "transform transition-all hover:scale-[1.02] active:scale-[0.98]",
        "bg-gradient-to-br",
        gradients[index % gradients.length],
        "text-white cursor-pointer"
      )}
    >
      <div className="space-y-1.5">
        <Badge variant="outline" className="w-fit backdrop-blur-sm bg-white/10 border-white/20 text-white text-xs">
          {improvement.devotee_name}
        </Badge>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Badge 
              variant="secondary" 
              className={cn(
                "bg-green-500/20 text-white text-xs",
                "animate-pulse-subtle shadow-[0_0_15px_rgba(34,197,94,0.5)]",
                "backdrop-blur-sm border-green-400/30"
              )}
            >
              +{improvement.percentageIncrease.toFixed(0)}%
            </Badge>
            <span className="text-[10px] text-white/80">improvement</span>
          </div>
          <p className="text-[10px] text-white/70">
            Increased by {improvement.improvement} points on {improvement.date}
          </p>
        </div>
      </div>
    </button>
  );
};

const fetchLeaderboardData = async (weekNumber?: number) => {
  // Get the current year
  const year = new Date().getFullYear();
  
  // Fetch all-time scores first
  const { data: allTimeData, error: allTimeError } = await supabase
    .from('leaderboard_view')
    .select('*')
    .order('total_score', { ascending: false });

  if (allTimeError) {
    console.error('Error fetching all-time leaderboard:', allTimeError);
    return null;
  }

  // If a specific week is selected
  if (weekNumber) {
    const { start, end } = getWeekDates(weekNumber, year);
    
    // Fetch weekly data
    const { data: weeklyData, error: weeklyError } = await supabase
      .from('sadhna_report_view')
      .select(`
        devotee_name,
        total_score,
        date
      `)
      .gte('date', start)
      .lte('date', end)
      .order('total_score', { ascending: false });
    
    if (weeklyError) {
      console.error('Error fetching weekly leaderboard:', weeklyError);
      return null;
    }

    // Calculate monthly range (4 weeks from the selected week)
    const monthStart = new Date(start);
    monthStart.setDate(monthStart.getDate() - 21); // Go back 3 weeks
    
    // Fetch monthly data
    const { data: monthlyData, error: monthlyError } = await supabase
      .from('sadhna_report_view')
      .select(`
        devotee_name,
        total_score,
        date
      `)
      .gte('date', monthStart.toISOString().split('T')[0])
      .lte('date', end)
      .order('total_score', { ascending: false });

    if (monthlyError) {
      console.error('Error fetching monthly leaderboard:', monthlyError);
      return null;
    }

    // Aggregate weekly scores
    const weeklyScores = weeklyData.reduce((acc: Record<string, number>, curr) => {
      acc[curr.devotee_name] = (acc[curr.devotee_name] || 0) + curr.total_score;
      return acc;
    }, {});

    // Aggregate monthly scores
    const monthlyScores = monthlyData.reduce((acc: Record<string, number>, curr) => {
      acc[curr.devotee_name] = (acc[curr.devotee_name] || 0) + curr.total_score;
      return acc;
    }, {});

    // Combine all data
    const combinedData = allTimeData.map(entry => ({
      devotee_name: entry.devotee_name,
      total_score: entry.total_score,
      weekly_score: weeklyScores[entry.devotee_name] || 0,
      monthly_score: monthlyScores[entry.devotee_name] || 0,
    }));

    // Sort by weekly score since we're viewing a specific week
    return combinedData.sort((a, b) => b.weekly_score - a.weekly_score);
  }

  // Default current week behavior
  const currentDate = new Date();
  const { start: currentWeekStart, end: currentWeekEnd } = getWeekDates(getWeekNumber(currentDate), year);
  
  const { data: currentWeekData, error: currentWeekError } = await supabase
    .from('sadhna_report_view')
    .select(`
      devotee_name,
      total_score,
      date
    `)
    .gte('date', currentWeekStart)
    .lte('date', currentWeekEnd)
    .order('total_score', { ascending: false });

  if (currentWeekError) {
    console.error('Error fetching current week leaderboard:', currentWeekError);
    return null;
  }

  // Calculate monthly range for current week
  const monthStart = new Date(currentWeekStart);
  monthStart.setDate(monthStart.getDate() - 21);

  const { data: currentMonthData, error: currentMonthError } = await supabase
    .from('sadhna_report_view')
    .select(`
      devotee_name,
      total_score,
      date
    `)
    .gte('date', monthStart.toISOString().split('T')[0])
    .lte('date', currentWeekEnd)
    .order('total_score', { ascending: false });

  if (currentMonthError) {
    console.error('Error fetching current month leaderboard:', currentMonthError);
    return null;
  }

  // Aggregate current week scores
  const currentWeekScores = currentWeekData.reduce((acc: Record<string, number>, curr) => {
    acc[curr.devotee_name] = (acc[curr.devotee_name] || 0) + curr.total_score;
    return acc;
  }, {});

  // Aggregate current month scores
  const currentMonthScores = currentMonthData.reduce((acc: Record<string, number>, curr) => {
    acc[curr.devotee_name] = (acc[curr.devotee_name] || 0) + curr.total_score;
    return acc;
  }, {});

  // Combine all data for current week
  const combinedCurrentData = allTimeData.map(entry => ({
    devotee_name: entry.devotee_name,
    total_score: entry.total_score,
    weekly_score: currentWeekScores[entry.devotee_name] || 0,
    monthly_score: currentMonthScores[entry.devotee_name] || 0,
  }));

  return combinedCurrentData.sort((a, b) => b.weekly_score - a.weekly_score);
};

const triggerConfetti = (colors: string[]) => {
  const end = Date.now() + 3 * 1000;
  const frame = () => {
    if (Date.now() > end) return;
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      startVelocity: 60,
      origin: { x: 0, y: 0.5 },
      colors: colors,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      startVelocity: 60,
      origin: { x: 1, y: 0.5 },
      colors: colors,
    });
    requestAnimationFrame(frame);
  };
  frame();
};

// Add these animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: "spring",
      bounce: 0.4
    }
  }
};

// Add these variants for staggered animations
const podiumVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      bounce: 0.4
    }
  }
};

// Add these animation variants at the top with other variants
const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      mass: 1
    }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const fadeInScale = {
  hidden: { 
    opacity: 0,
    scale: 0.95
  },
  visible: { 
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const BlockQuote = ({
  quote,
  author,
  className,
}: {
  quote: string;
  author: string;
  className?: string;
}) => {
  return (
    <blockquote className={cn(
      "rounded-xl border-l-4 px-4 py-3",
      "border-purple-500/70 bg-purple-500/15 text-purple-700",
      "dark:bg-purple-500/10 dark:text-purple-400",
      "transition-all duration-300",
      className
    )}>
      <p className="inline italic">
        <QuoteIcon
          aria-hidden="true"
          className="-translate-y-1 mr-1 inline size-3 fill-purple-700 stroke-none dark:fill-purple-400"
        />
        {quote}
        <QuoteIcon
          aria-hidden="true"
          className="ml-1 inline size-3 translate-y-1 fill-purple-700 stroke-none dark:fill-purple-400"
        />
      </p>
      <p className="mt-1.5 text-end font-semibold text-sm italic tracking-tighter">
        {author}
      </p>
    </blockquote>
  );
};

interface LeaderboardStats {
  allTimeHighScore: {
    score: number;
    devotee_name: string;
    date: string;
  };
  weeklyHighScore: {
    score: number;
    devotee_name: string;
    date: string;
  };
  monthlyHighScore: {
    score: number;
    devotee_name: string;
  };
  recentPersonalBests: Array<{
    devotee_name: string;
    newBest: number;
    previousBest: number;
    date: string;
  }>;
  newAllTimeRecord: boolean;
  significantImprovements: Array<Improvement>;
}

// Add this helper function at the top level
function getWeekNumber(date = new Date()) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const firstMonday = new Date(firstDayOfYear);
  firstMonday.setDate(1 + (8 - firstDayOfYear.getDay()) % 7);
  
  if (date < firstMonday) {
    // If the date is before the first Monday, it's part of the last week of previous year
    return getWeekNumber(new Date(date.getFullYear() - 1, 11, 31));
  }
  
  const daysSinceFirstMonday = Math.floor(
    (date.getTime() - firstMonday.getTime()) / (24 * 60 * 60 * 1000)
  );
  
  return Math.floor(daysSinceFirstMonday / 7) + 1;
}

// Add these gradient configurations
const positionGradients = {
  4: {
    badge: "from-emerald-500 via-teal-500 to-cyan-500",
    text: "text-emerald-50",
    border: "border-emerald-400/30",
    background: "bg-emerald-500/20",
  },
  5: {
    badge: "from-violet-500 via-purple-500 to-fuchsia-500",
    text: "text-violet-50",
    border: "border-violet-400/30",
    background: "bg-violet-500/20",
  },
  6: {
    badge: "from-rose-500 via-pink-500 to-red-500",
    text: "text-rose-50",
    border: "border-rose-400/30",
    background: "bg-rose-500/20",
  },
  7: {
    badge: "from-blue-500 via-indigo-500 to-violet-500",
    text: "text-blue-50",
    border: "border-blue-400/30",
    background: "bg-blue-500/20",
  },
  8: {
    badge: "from-amber-500 via-orange-500 to-yellow-500",
    text: "text-amber-50",
    border: "border-amber-400/30",
    background: "bg-amber-500/20",
  },
  9: {
    badge: "from-lime-500 via-green-500 to-emerald-500",
    text: "text-lime-50",
    border: "border-lime-400/30",
    background: "bg-lime-500/20",
  },
  10: {
    badge: "from-cyan-500 via-sky-500 to-blue-500",
    text: "text-cyan-50",
    border: "border-cyan-400/30",
    background: "bg-cyan-500/20",
  },
};

// Update the position styles to include gradients
const positionStyles = {
  4: {
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    text: "text-emerald-50",
    loaderColor: "text-emerald-500",
    hoverBg: "hover:bg-emerald-50 dark:hover:bg-emerald-900/10",
  },
  5: {
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    text: "text-violet-50",
    loaderColor: "text-violet-500",
    hoverBg: "hover:bg-violet-50 dark:hover:bg-violet-900/10",
  },
  6: {
    gradient: "from-rose-500 via-pink-500 to-red-500",
    text: "text-rose-50",
    loaderColor: "text-rose-500",
    hoverBg: "hover:bg-rose-50 dark:hover:bg-rose-900/10",
  },
  7: {
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    text: "text-blue-50",
    loaderColor: "text-blue-500",
    hoverBg: "hover:bg-blue-50 dark:hover:bg-blue-900/10",
  },
  8: {
    gradient: "from-amber-500 via-orange-500 to-yellow-500",
    text: "text-amber-50",
    loaderColor: "text-amber-500",
    hoverBg: "hover:bg-amber-50 dark:hover:bg-amber-900/10",
  },
  9: {
    gradient: "from-lime-500 via-green-500 to-emerald-500",
    text: "text-lime-50",
    loaderColor: "text-lime-500",
    hoverBg: "hover:bg-lime-50 dark:hover:bg-lime-900/10",
  },
  10: {
    gradient: "from-cyan-500 via-sky-500 to-blue-500",
    text: "text-cyan-50",
    loaderColor: "text-cyan-500",
    hoverBg: "hover:bg-cyan-50 dark:hover:bg-cyan-900/10",
  },
};

// Add interface for chart data
interface ScoreData {
  id: string;
  date: string;
  fullDate: string;
  score: number;
  improvement: number;
}

// Update the formatDate helper function
function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return `${date.toLocaleDateString('en-US', {
    weekday: 'short',
  })},${date.getDate()}`;
}

// Update the fetchScoreData function
const fetchScoreData = async (devoteeName: string) => {
  const { data, error } = await supabase
    .from('sadhna_report_view')
    .select('*')
    .eq('devotee_name', devoteeName)
    .order('date', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching score data:', error);
    return [];
  }

  return data.map((entry, index) => {
    const date = new Date(entry.date);
    const formattedDate = `${date.toLocaleDateString('en-US', {
      weekday: 'short',
    })},${date.getDate()}`; // Format: "Mon,24"

    return {
      id: `${entry.date}-${index}`,
      date: formattedDate,
      fullDate: formattedDate, // Keep consistent format
      score: entry.total_score,
      improvement: data.indexOf(entry) < data.length - 1 
        ? entry.total_score - data[data.indexOf(entry) + 1].total_score 
        : 0,
    };
  }).reverse();
};

// Add these helper functions at the top level
function getWeekDates(weekNumber: number, year: number) {
  // Get the first day of the year
  const firstDayOfYear = new Date(year, 0, 1);
  
  // Calculate the offset to the first Monday of the year
  const firstMonday = new Date(year, 0, 1 + (8 - firstDayOfYear.getDay()) % 7);
  
  // Calculate the start date for the given week
  const weekStart = new Date(firstMonday);
  weekStart.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);
  
  // Calculate the end date (Sunday) for the given week
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  // If it's the current week and today is before Sunday,
  // adjust the end date to today
  const today = new Date();
  if (
    weekNumber === getWeekNumber(today) &&
    today < weekEnd
  ) {
    weekEnd.setTime(today.getTime());
  }
  
  return {
    start: weekStart.toISOString().split('T')[0],
    end: weekEnd.toISOString().split('T')[0]
  };
}

// Add this interface for loading states
interface LoadingStates {
  drawer: boolean;
  improvements: boolean;
  personalStats: boolean;
}

// Add this helper function to format week display
function formatWeekDisplay(weekNumber: number, year: number) {
  return `Week ${weekNumber} of ${year}`;
}

export function Leaderboard() {
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDevotee, setSelectedDevotee] = useState<string>("");
  const [personalStats, setPersonalStats] = useState<PersonalStats | null>(null);
  const [scoresByDevotee, setScoresByDevotee] = useState<Record<string, number[]>>({});
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isImprovementDialogOpen, setIsImprovementDialogOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [selectedImprovement, setSelectedImprovement] = useState<Improvement | null>(null);
  const [currentWeek] = useState(getWeekNumber());
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [loadingPositions, setLoadingPositions] = useState<Record<number, boolean>>({});
  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek);
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    drawer: false,
    improvements: false,
    personalStats: false,
  });

  // Add this useEffect to calculate available weeks
  useEffect(() => {
    const calculateAvailableWeeks = () => {
      const weeks = [];
      for (let i = 1; i <= currentWeek; i++) {
        weeks.push(i);
      }
      setAvailableWeeks(weeks.reverse()); // Most recent first
    };
    calculateAvailableWeeks();
  }, [currentWeek]);

  const fetchLeaderboardStats = async () => {
    setIsLoading(true);
    
    try {
      // Get all devotees' data for the last 7 days
      const { data: recentData, error: recentError } = await supabase
        .from('sadhna_report_view')
        .select('*')
        .order('date', { ascending: false });

      if (recentError) throw recentError;

      // Group scores by devotee
      const devoteeScores: Record<string, { scores: number[], dates: string[] }> = {};
      
      recentData?.forEach(record => {
        if (!devoteeScores[record.devotee_name]) {
          devoteeScores[record.devotee_name] = { scores: [], dates: [] };
        }
        devoteeScores[record.devotee_name].scores.push(record.total_score);
        devoteeScores[record.devotee_name].dates.push(record.date);
      });

      // Calculate improvements for each devotee
      const significantImprovements: Improvement[] = Object.entries(devoteeScores)
        .map(([devotee_name, data]): Improvement | null => {
          if (data.scores.length < 2) return null;

          const latestScore = data.scores[0];
          const previousScores = data.scores.slice(1);
          const avgPreviousScore = previousScores.reduce((a, b) => a + b, 0) / previousScores.length;
          const improvement = latestScore - avgPreviousScore;
          const percentageIncrease = (improvement / avgPreviousScore) * 100;

          return {
            devotee_name,
            improvement,
            percentageIncrease,
            date: new Date(data.dates[0]).toLocaleDateString(),
            scoreData: []
          };
        })
        .filter((imp): imp is Improvement => imp !== null)
        .sort((a, b) => b.percentageIncrease - a.percentageIncrease);

      // Rest of your stats calculations...
      const allTimeHigh = {
        score: Math.max(...recentData.map(r => r.total_score)),
        devotee_name: recentData.reduce((a, b) => a.total_score > b.total_score ? a : b).devotee_name,
        date: recentData.reduce((a, b) => a.total_score > b.total_score ? a : b).date
      };

      const currentWeekStart = new Date();
      currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
      currentWeekStart.setHours(0, 0, 0, 0);

      const weeklyHigh = recentData
        .filter(r => new Date(r.date) >= currentWeekStart)
        .reduce((high, current) => 
          current.total_score > high.score 
            ? { score: current.total_score, devotee_name: current.devotee_name, date: current.date }
            : high,
          { score: 0, devotee_name: '', date: '' }
        );

      setStats({
        allTimeHighScore: {
          score: allTimeHigh.score,
          devotee_name: allTimeHigh.devotee_name,
          date: new Date(allTimeHigh.date).toLocaleDateString()
        },
        weeklyHighScore: weeklyHigh,
        monthlyHighScore: {
          score: weeklyHigh.score, // You might want to adjust this based on your needs
          devotee_name: weeklyHigh.devotee_name
        },
        recentPersonalBests: [], // Populate if needed
        newAllTimeRecord: false, // Calculate as needed
        significantImprovements
      });

      setScoresByDevotee(
        Object.fromEntries(
          Object.entries(devoteeScores).map(([name, data]) => [name, data.scores])
        )
      );

    } catch (error) {
      console.error('Error fetching leaderboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPersonalStats = async (devoteeName: string) => {
    const { data, error } = await supabase
      .from('sadhna_report_view')
      .select('*')
      .eq('devotee_name', devoteeName)
      .order('date', { ascending: false })
      .limit(7);

    if (data && data.length > 0) {
      const currentScore = data[0].total_score;
      const previousScores = data.slice(1).map(r => r.total_score);
      const previousBest = previousScores.length > 0 ? Math.max(...previousScores) : currentScore;
      const improvement = currentScore - previousBest;
      const percentageIncrease = previousBest === 0 ? 0 : (improvement / previousBest) * 100;

      const scoreData: ScoreData[] = data.map((entry, index) => ({
        id: `${entry.date}-${index}`,
        date: new Date(entry.date).toLocaleDateString('en-US', { 
          weekday: 'short'
        }),
        shortDate: new Date(entry.date).toLocaleDateString('en-US', { 
          month: 'short',
          day: 'numeric'
        }),
        fullDate: entry.date,
        score: entry.total_score,
        improvement: data.indexOf(entry) < data.length - 1 
          ? entry.total_score - data[data.indexOf(entry) + 1].total_score 
          : 0
      })).reverse();

      setPersonalStats({
        devotee_name: devoteeName,
        currentScore,
        previousBest: previousScores.length > 0 ? previousBest : 0,
        improvement,
        percentageIncrease: isFinite(percentageIncrease) ? percentageIncrease : 0,
        before_7_am_japa_session: data[0].before_7_am_japa_session,
        before_7_am: data[0].before_7_am,
        from_7_to_9_am: data[0].from_7_to_9_am,
        after_9_am: data[0].after_9_am,
        score_a: data[0].score_a,
        book_name: data[0].book_name,
        book_reading_time_min: data[0].book_reading_time_min,
        score_b: data[0].score_b,
        lecture_speaker: data[0].lecture_speaker,
        lecture_time_min: data[0].lecture_time_min,
        score_c: data[0].score_c,
        seva_name: data[0].seva_name,
        seva_time_min: data[0].seva_time_min,
        score_d: data[0].score_d,
        scoreData,
      });
    }
  };

  const fetchFullLeaderboard = async (weekNum?: number) => {
    setLoadingStates(prev => ({ ...prev, drawer: true }));
    try {
      const data = await fetchLeaderboardData(weekNum);
      if (data) {
        setLeaderboardData(data);
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, drawer: false }));
    }
  };

  const getTopThree = () => {
    if (!leaderboardData?.length) return [];
    return [...leaderboardData]
      .sort((a, b) => b.weekly_score - a.weekly_score)
      .slice(0, 3);
  };

  const handleBadgeClick = async (position: number, devoteeName: string) => {
    setLoadingStates(prev => ({ ...prev, personalStats: true }));
    setLoadingPositions(prev => ({ ...prev, [position]: true }));

    try {
      const { data, error } = await supabase
        .from('sadhna_report_view')
        .select('*')
        .eq('devotee_name', devoteeName)
        .order('date', { ascending: false })
        .limit(7);

      if (data && data.length > 0) {
        // Format the date for the latest entry
        const latestDate = new Date(data[0].date);
        const formattedDate = `${latestDate.toLocaleDateString('en-US', {
          weekday: 'short',
        })},${latestDate.getDate()}`; // Format: "Mon,24"

        const scoreData: ScoreData[] = data.map((entry, index) => {
          const date = new Date(entry.date);
          const entryFormattedDate = `${date.toLocaleDateString('en-US', {
            weekday: 'short',
          })},${date.getDate()}`; // Format: "Mon,24"

          return {
            id: `${entry.date}-${index}`,
            date: entryFormattedDate,
            shortDate: entryFormattedDate,
            fullDate: entryFormattedDate,
            score: entry.total_score,
            improvement: data.indexOf(entry) < data.length - 1 
              ? entry.total_score - data[data.indexOf(entry) + 1].total_score 
              : 0
          };
        }).reverse();

        const latestScore = data[0].total_score;
        const previousScores = data.slice(1);
        const avgPreviousScore = previousScores.length > 0
          ? previousScores.reduce((a, b) => a + b.total_score, 0) / previousScores.length
          : latestScore;
        
        const improvement = latestScore - avgPreviousScore;
        const percentageIncrease = (improvement / avgPreviousScore) * 100;

        setSelectedImprovement({
          devotee_name: devoteeName,
          improvement,
          percentageIncrease,
          date: formattedDate,
          scoreData,
        });
        setIsImprovementDialogOpen(true);
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, personalStats: false }));
      setTimeout(() => {
        setLoadingPositions(prev => ({ ...prev, [position]: false }));
      }, 500);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      await Promise.all([
        fetchLeaderboardStats(),
        fetchFullLeaderboard()
      ]);
    };

    fetchInitialData();

    const channel = supabase
      .channel('leaderboard_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sadhna_report',
        },
        async () => {
          await Promise.all([
            fetchLeaderboardStats(),
            fetchFullLeaderboard()
          ]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return <LeaderboardSkeleton />;
  }

  // Update the leaderboard drawer content
  const renderLeaderboardDrawer = () => (
    <Drawer open={isLeaderboardOpen} onOpenChange={setIsLeaderboardOpen}>
      <DrawerContent className="max-h-[96vh]">
        <DrawerHeader>
          <DrawerTitle className="text-center text-xl font-bold">
            Sadhana Leaderboard 🏆
          </DrawerTitle>
          <div className="text-center space-y-2">
            <span className="text-sm text-muted-foreground">
              {formatWeekDisplay(selectedWeek, new Date().getFullYear())}
            </span>
            <Select
              value={selectedWeek.toString()}
              onValueChange={(value) => {
                const weekNum = parseInt(value);
                setSelectedWeek(weekNum);
                setLoadingStates(prev => ({ ...prev, drawer: true }));
                fetchFullLeaderboard(weekNum).finally(() => {
                  setLoadingStates(prev => ({ ...prev, drawer: false }));
                });
              }}
            >
              <SelectTrigger className="w-[180px] mx-auto">
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                {availableWeeks.map((week) => (
                  <SelectItem key={week} value={week.toString()}>
                    Week {week}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DrawerHeader>

        <ScrollArea className="h-[60vh] px-4">
          {loadingStates.drawer ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-lg border animate-pulse"
                >
                  <div className="w-1/3 h-4 bg-muted rounded" />
                  <div className="flex gap-4">
                    <div className="w-16 h-4 bg-muted rounded" />
                    <div className="w-16 h-4 bg-muted rounded" />
                    <div className="w-16 h-4 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Devotee</TableHead>
                  <TableHead className="text-right">Weekly</TableHead>
                  <TableHead className="text-right">Monthly</TableHead>
                  <TableHead className="text-right">All Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboardData
                  .sort((a, b) => b.weekly_score - a.weekly_score)
                  .map((entry, index) => (
                    <TableRow key={entry.devotee_name} className="group hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {index < 3 && (
                            <span className="text-lg">
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                            </span>
                          )}
                          {entry.devotee_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="group-hover:bg-background">
                          {entry.weekly_score}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="group-hover:bg-background">
                          {entry.monthly_score}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="group-hover:bg-background">
                          {entry.total_score}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button className="w-full">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );

  return (
    <div className="space-y-4 relative">
      <Meteors number={20} />
      
      {stats?.newAllTimeRecord && (
        <Alert className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200">
          <Meteors number={10} />
          <SparklesText 
            text={`New Record: ${stats.allTimeHighScore.score} points by ${stats.allTimeHighScore.devotee_name}!`}
            colors={{ first: "#FFB800", second: "#FF8A00" }}
          />
        </Alert>
      )}

      <div className="space-y-4">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* Toggle Buttons */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col items-center gap-2"
          >
            {/* Add Week Number Display */}
            <div className="text-sm text-muted-foreground mb-2">
              Week {currentWeek} of {new Date().getFullYear()}
            </div>
          </motion.div>

          {/* Podium Section */}
          <motion.div variants={itemVariants} className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/20 rounded-xl -z-10" />
            <div className="p-4 sm:p-8">
              {leaderboardData?.length > 0 ? (
                <div className="space-y-8">
                  {/* Top 3 Podium */}
                  <div className="flex items-end justify-center gap-2 sm:gap-6">
                    {/* 2nd Place */}
                    <motion.button
                      variants={podiumVariants}
                      key={getTopThree()[1]?.devotee_name}
                      onClick={() => handleBadgeClick(2, getTopThree()[1]?.devotee_name)}
                      className={cn(
                        "relative w-[120px] sm:w-[200px] px-3 sm:px-6 py-3 sm:py-4 rounded-xl",
                        "transition-all hover:scale-105 hover:-translate-y-1",
                        "border-2 border-[#C0C0C0]",
                        "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-900/30",
                        "flex flex-col items-center gap-2 sm:gap-3",
                        "group shadow-lg"
                      )}
                      disabled={loadingPositions[2]}
                    >
                      {loadingPositions[2] ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#C0C0C0] border-r-transparent" />
                      ) : (
                        <Star className="h-4 w-4 sm:h-6 sm:w-6 text-[#C0C0C0] group-hover:text-[#E8E8E8]" />
                      )}
                      <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 truncate w-full text-center">
                        {getTopThree()[1]?.devotee_name}
                      </span>
                      <Badge variant="secondary" className="bg-[#C0C0C0]/10 text-[#808080] text-xs sm:text-sm">
                        {getTopThree()[1]?.weekly_score} pts
                      </Badge>
                    </motion.button>

                    {/* 1st Place */}
                    <motion.button
                      variants={podiumVariants}
                      key={getTopThree()[0]?.devotee_name}
                      onClick={() => handleBadgeClick(1, getTopThree()[0]?.devotee_name)}
                      className={cn(
                        "relative w-[140px] sm:w-[200px] px-3 sm:px-6 py-3 sm:py-4 rounded-xl",
                        "transition-all hover:scale-105 hover:-translate-y-2",
                        "border-2 border-[#FFD700]",
                        "bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/50 dark:to-amber-900/30",
                        "flex flex-col items-center gap-2 sm:gap-3",
                        "group shadow-xl",
                        "transform scale-105 -translate-y-4"
                      )}
                      disabled={loadingPositions[1]}
                    >
                      {loadingPositions[1] ? (
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#FFD700] border-r-transparent" />
                      ) : (
                        <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-[#FFD700] group-hover:text-[#FFED4A]" />
                      )}
                      <SparklesText 
                        text={getTopThree()[0]?.devotee_name}
                        className="text-base sm:text-lg font-semibold truncate w-full text-center"
                        colors={{ first: "#FFD700", second: "#FFED4A" }}
                      />
                      <Badge variant="secondary" className="bg-[#FFD700]/20 text-[#B8860B] px-3 sm:px-4 py-0.5 sm:py-1 text-sm sm:text-base">
                        {getTopThree()[0]?.weekly_score} pts
                      </Badge>
                    </motion.button>

                    {/* 3rd Place */}
                    <motion.button
                      variants={podiumVariants}
                      key={getTopThree()[2]?.devotee_name}
                      onClick={() => handleBadgeClick(3, getTopThree()[2]?.devotee_name)}
                      className={cn(
                        "relative w-[120px] sm:w-[200px] px-3 sm:px-6 py-3 sm:py-4 rounded-xl",
                        "transition-all hover:scale-105 hover:-translate-y-1",
                        "border-2 border-[#CD7F32]",
                        "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/50 dark:to-orange-900/30",
                        "flex flex-col items-center gap-2 sm:gap-3",
                        "group shadow-lg"
                      )}
                      disabled={loadingPositions[3]}
                    >
                      {loadingPositions[3] ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#CD7F32] border-r-transparent" />
                      ) : (
                        <Medal className="h-4 w-4 sm:h-6 sm:w-6 text-[#CD7F32] group-hover:text-[#DDA15E]" />
                      )}
                      <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 truncate w-full text-center">
                        {getTopThree()[2]?.devotee_name}
                      </span>
                      <Badge variant="secondary" className="bg-[#CD7F32]/10 text-[#8B4513] text-xs sm:text-sm">
                        {getTopThree()[2]?.weekly_score} pts
                      </Badge>
                    </motion.button>
                  </div>

                  {/* Positions 4-10 */}
                  <motion.div 
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-wrap justify-center gap-3 px-4"
                  >
                    {leaderboardData
                      .filter(entry => !getTopThree().find(top => top.devotee_name === entry.devotee_name))
                      .slice(0, 7)
                      .map((entry, index) => {
                        const position = index + 4;
                        const style = positionStyles[position as keyof typeof positionStyles];
                        const isLoading = loadingPositions[position] || false;
                        
                        if (entry.weekly_score === 0) return null;
                        
                        return (
                          <motion.div
                            key={entry.devotee_name}
                            variants={fadeInScale}
                            className="relative"
                          >
                            <Button
                              onClick={() => handleBadgeClick(position, entry.devotee_name)}
                              disabled={isLoading}
                              data-loading={isLoading}
                              className={cn(
                                "group relative w-64 h-10 disabled:opacity-100",
                                "rounded-full overflow-hidden",
                                "border-0",
                                "bg-gradient-to-r bg-[size:200%] bg-right hover:bg-left",
                                "transition-[background-position] duration-300",
                                style.gradient
                              )}
                            >
                              <span className={cn(
                                "group-data-[loading=true]:text-transparent",
                                "flex items-center justify-center gap-2",
                                "text-white font-medium"
                              )}>
                                <span className="text-sm opacity-80">#{position}</span>
                                <span className="truncate">{entry.devotee_name}</span>
                                <span className="text-sm font-normal opacity-90">
                                  {entry.weekly_score} pts
                                </span>
                              </span>

                              {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <LoaderCircle 
                                    className="animate-spin text-white" 
                                    size={16} 
                                    strokeWidth={2} 
                                    aria-hidden="true" 
                                  />
                                </div>
                              )}

                              {/* Add subtle shine effect */}
                              <div className={cn(
                                "absolute inset-0 opacity-0 group-hover:opacity-20",
                                "bg-gradient-to-r from-transparent via-white to-transparent",
                                "translate-x-[-100%] group-hover:translate-x-[100%]",
                                "transition-all duration-1000"
                              )} />
                            </Button>
                          </motion.div>
                        );
                      })}
                  </motion.div>
                </div>
              ) : (
                <div className="flex gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "h-10 w-32 rounded-lg",
                        "animate-pulse bg-muted"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* View Leaderboard Button */}
          <motion.div variants={itemVariants} className="flex justify-center">
            <ShinyButton 
              onClick={() => {
                setIsLeaderboardOpen(true);
                fetchFullLeaderboard();
              }}
              className={cn(
                "bg-gradient-to-br from-indigo-50 to-indigo-100",
                "dark:from-indigo-900/10 dark:to-indigo-900/20",
                "inline-flex items-center gap-2",
                "px-6 py-2.5",
                "min-w-[200px] justify-center"
              )}
            >
              <span>View Full Leaderboard</span>
            </ShinyButton>
          </motion.div>
        </motion.div>

        {/* Move Marquee here, above Personal Progress Tracker */}
        <div className="py-6 relative">
          {stats?.significantImprovements && stats.significantImprovements.length > 0 && (
            <div className="space-y-4">
              <Marquee className="py-2" velocity={20}>
                {[...stats.significantImprovements].map((improvement, index) => (
                  <ImprovementCard
                    key={`top-${improvement.devotee_name}-${index}`}
                    improvement={improvement}
                    index={index}
                    onClick={async (improvementWithData) => {
                      setSelectedImprovement(improvementWithData);
                      setIsImprovementDialogOpen(true);
                    }}
                  />
                ))}
              </Marquee>
              <Marquee className="py-2" velocity={15} reverse>
                {[...stats.significantImprovements].map((improvement, index) => (
                  <ImprovementCard
                    key={`bottom-${improvement.devotee_name}-${index}`}
                    improvement={improvement}
                    index={index + stats.significantImprovements.length}
                    onClick={async (improvementWithData) => {
                      setSelectedImprovement(improvementWithData);
                      setIsImprovementDialogOpen(true);
                    }}
                  />
                ))}
              </Marquee>
            </div>
          )}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background"></div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background"></div>
        </div>

        {/* Personal Progress Tracker */}
        <div className="w-full">
          <ProgressTracker scoresByDevotee={scoresByDevotee} />
        </div>

        {/* Dialogs */}
        <Drawer open={isImprovementDialogOpen} onOpenChange={setIsImprovementDialogOpen}>
          <DrawerContent>
            <div className="max-h-[90vh] flex flex-col">
              <DrawerHeader className="border-b bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-red-500/10 py-3 flex-none">
                <DrawerTitle className="text-xl font-bold flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-yellow-500" />
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span>Improvement Details</span>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        {selectedImprovement?.devotee_name}
                      </Badge>
                    </div>
                    <span className="text-sm font-normal text-muted-foreground">
                      {selectedImprovement?.date}
                    </span>
                  </div>
                </DrawerTitle>
              </DrawerHeader>

              <div className="flex-1 overflow-y-auto">
                {selectedImprovement && (
                  <div className="flex flex-col lg:flex-row">
                    {/* Left Side - Details & List */}
                    <div className="flex-1 p-6 lg:border-r">
                      <motion.div variants={staggerContainer} className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid gap-4 md:grid-cols-2">
                          {/* Improvement Card */}
                          <motion.div variants={cardVariants}>
                            <Card className="overflow-hidden">
                              <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                                  </div>
                                  <div>
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{
                                        type: "spring",
                                        stiffness: 200,
                                        damping: 15,
                                        delay: 0.2
                                      }}
                                      className="text-2xl font-bold text-green-600 dark:text-green-400"
                                    >
                                      +{selectedImprovement.improvement.toFixed(1)}
                                    </motion.div>
                                    <p className="text-sm text-muted-foreground">Points increased</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                          
                          {/* Growth Rate Card */}
                          <motion.div variants={cardVariants}>
                            <Card className="overflow-hidden">
                              <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                    <Rocket className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div>
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{
                                        type: "spring",
                                        stiffness: 200,
                                        damping: 15,
                                        delay: 0.4
                                      }}
                                      className="text-2xl font-bold text-blue-600 dark:text-blue-400"
                                    >
                                      {selectedImprovement.percentageIncrease.toFixed(1)}%
                                    </motion.div>
                                    <p className="text-sm text-muted-foreground">Growth rate</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        </div>

                        {/* Quote Card - Moved here */}
                        <motion.div variants={fadeInScale}>
                          <Card className="bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/20">
                            <CardContent className="pt-6">
                              <BlockQuote
                                quote="Every step forward in Krishna consciousness is eternally preserved and never lost."
                                author="Srila Prabhupada"
                                className="text-purple-800 dark:text-purple-200"
                              />
                            </CardContent>
                          </Card>
                        </motion.div>

                        {/* Score List */}
                        <motion.div variants={cardVariants}>
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm flex items-center gap-2">
                                <ListIcon className="h-4 w-4" />
                                Score History
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ScrollArea className="h-[300px] pr-4">
                                <div className="space-y-2">
                                  {selectedImprovement.scoreData.map((entry, index) => {
                                    const prevScore = index > 0 ? selectedImprovement.scoreData[index - 1].score : entry.score;
                                    const change = entry.score - prevScore;
                                    const changePercent = ((change / prevScore) * 100).toFixed(1);
                                    
                                    return (
                                      <motion.div
                                        key={`${entry.date}-${index}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={cn(
                                          "flex items-center justify-between p-2 rounded-lg",
                                          "border border-border/50",
                                          "bg-card/50 dark:bg-card/10",
                                          "hover:bg-accent/50 dark:hover:bg-accent/20",
                                          "transition-colors"
                                        )}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center",
                                            "bg-gradient-to-br backdrop-blur-sm",
                                            change > 0 
                                              ? "from-green-500/20 to-emerald-500/20 text-green-500 dark:from-green-500/10 dark:to-emerald-500/10 dark:text-green-400"
                                              : change < 0
                                              ? "from-red-500/20 to-rose-500/20 text-red-500 dark:from-red-500/10 dark:to-rose-500/10 dark:text-red-400"
                                              : "from-gray-500/20 to-slate-500/20 text-gray-500 dark:from-gray-500/10 dark:to-slate-500/10 dark:text-gray-400"
                                          )}>
                                            {change > 0 ? <TrendingUp className="h-4 w-4" /> :
                                             change < 0 ? <TrendingDown className="h-4 w-4" /> :
                                             <Minus className="h-4 w-4" />}
                                          </div>
                                          <div>
                                            <div className="font-medium text-foreground flex items-center gap-2">
                                              <span>{entry.fullDate}</span>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                              Score: {entry.score}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className={cn(
                                            "font-medium",
                                            change > 0 
                                              ? "text-green-600 dark:text-green-400" 
                                              : change < 0 
                                              ? "text-red-600 dark:text-red-400" 
                                              : "text-gray-600 dark:text-gray-400"
                                          )}>
                                            {change > 0 ? "+" : ""}{change}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {change !== 0 ? `${changePercent}%` : "No change"}
                                          </div>
                                        </div>
                                      </motion.div>
                                    );
                                  })}
                                </div>
                              </ScrollArea>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </motion.div>
                    </div>

                    {/* Right Side - Chart */}
                    <div className="flex-1 p-6">
                      <motion.div variants={fadeInScale}>
                        <Card className="h-full">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <TrendingUp className="h-5 w-5 text-green-500" />
                              Score Progression
                            </CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline" className="bg-background">
                                Last {selectedImprovement.scoreData.length} entries
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <ChartContainer
                              config={{
                                score: {
                                  label: "Score",
                                },
                              }}
                            >
                              <div className="h-[200px] sm:h-[250px] md:h-[300px] lg:h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <ComposedChart
                                    data={selectedImprovement.scoreData}
                                    margin={{
                                      top: 10,
                                      right: 5,
                                      left: 5,
                                      bottom: 20,
                                    }}
                                  >
                                    <defs>
                                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                      </linearGradient>
                                      <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0.3} />
                                      </linearGradient>
                                      <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="hsl(346.8 77.2% 49.8%)" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="hsl(346.8 77.2% 49.8%)" stopOpacity={0.3} />
                                      </linearGradient>
                                    </defs>
                                    
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                                    
                                    <XAxis 
                                      dataKey="date" 
                                      angle={-45} 
                                      textAnchor="end" 
                                      height={60}
                                      tick={{ 
                                        fontSize: 20, // Increased font size
                                        fill: 'hsl(var(--muted-foreground))'
                                      }}
                                      interval={0}
                                      dy={8}
                                      tickFormatter={(value, index) => {
                                        if (window.innerWidth < 640 && index % 2 !== 0) return '';
                                        return value;
                                      }}
                                    />
                                    
                                    <YAxis 
                                      tick={{ 
                                        fontSize: 12, // Increased font size
                                        fill: 'hsl(var(--muted-foreground))'
                                      }}
                                      width={35} // Slightly increased to accommodate larger font
                                    />

                                    <ChartTooltip
                                      content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        const data = payload[0].payload;
                                        return (
                                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                                            <div className="grid grid-cols-2 gap-1 text-xs sm:text-sm">
                                              <div className="flex flex-col">
                                                <span className="text-[0.65rem] uppercase text-muted-foreground">
                                                  Date
                                                </span>
                                                <span className="font-bold">{data.date}</span> {/* Using the short date format */}
                                              </div>
                                              <div className="flex flex-col">
                                                <span className="text-[0.65rem] uppercase text-muted-foreground">
                                                  Score
                                                </span>
                                                <span className="font-bold">{data.score}</span>
                                              </div>
                                              <div className="flex flex-col col-span-2">
                                                <span className="text-[0.65rem] uppercase text-muted-foreground">
                                                  Change
                                                </span>
                                                <span className={cn(
                                                  "font-bold",
                                                  data.improvement > 0 ? "text-green-500" : 
                                                  data.improvement < 0 ? "text-red-500" : "text-muted-foreground"
                                                )}>
                                                  {data.improvement > 0 ? "+" : ""}{data.improvement} points
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      }}
                                    />

                                    <Bar 
                                      dataKey="score" 
                                      barSize={window.innerWidth < 640 ? 30 : 40}
                                    >
                                      {selectedImprovement.scoreData.map((entry, index) => (
                                        <Cell
                                          key={`cell-${entry.date}-${index}`}
                                          fill={`url(#${
                                            entry.improvement > 0
                                              ? "positiveGradient"
                                              : entry.improvement < 0
                                              ? "negativeGradient"
                                              : "barGradient"
                                          })`}
                                        />
                                      ))}
                                    </Bar>

                                    <Line
                                      type="monotone"
                                      dataKey="score"
                                      stroke="hsl(var(--primary))"
                                      strokeWidth={1.5}
                                      dot={{
                                        fill: "hsl(var(--background))",
                                        stroke: "hsl(var(--primary))",
                                        strokeWidth: 1.5,
                                        r: 2,
                                      }}
                                      activeDot={{
                                        fill: "hsl(var(--primary))",
                                        stroke: "hsl(var(--background))",
                                        strokeWidth: 1.5,
                                        r: 4,
                                      }}
                                    />
                                  </ComposedChart>
                                </ResponsiveContainer>
                              </div>
                            </ChartContainer>
                          </CardContent>
                          <CardFooter className="flex-col items-start gap-2 text-sm">
                            <div className="flex items-center gap-2 font-medium">
                              {selectedImprovement.percentageIncrease > 0 ? (
                                <>
                                  <TrendingUp className="h-4 w-4 text-green-500" />
                                  <span>Trending up by {selectedImprovement.percentageIncrease.toFixed(1)}%</span>
                                </>
                              ) : (
                                <>
                                  <Bell className="h-4 w-4 text-orange-500" />
                                  <span>Maintaining steady progress</span>
                                </>
                              )}
                            </div>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    </div>
                  </div>
                )}
              </div>

              <DrawerFooter className="border-t mt-auto py-2 flex-none">
                <DrawerClose asChild>
                  <Button className="w-full">
                    Close
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>

        {renderLeaderboardDrawer()}

        <div className="mt-6">
          <BlockQuote
            quote="In this age of quarrel and hypocrisy, the only means of deliverance is chanting of the holy name of the Lord. There is no other way. There is no other way. There is no other way."
            author="Śrī Caitanya Mahāprabhu"
          />
          <p className="mt-4 text-sm text-center text-muted-foreground">
            Keep up the wonderful service! Every point counts in devotional service. 🙏
          </p>
        </div>
      </div>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className={i === 2 ? "md:col-span-2 lg:col-span-1" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-[200px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-8 w-[100px]" />
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}