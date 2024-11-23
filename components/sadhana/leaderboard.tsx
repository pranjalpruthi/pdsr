"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, Crown, Star, Sparkles, Rocket, Award, Bell, BookOpen, Headphones, Heart, QuoteIcon } from "lucide-react";
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
interface Improvement {
  devotee_name: string;
  improvement: number;
  percentageIncrease: number;
  date: string;
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
  onClick: () => void;
}

const ImprovementCard = ({ improvement, index, onClick }: ImprovementCardProps) => {
  const gradients = [
    "from-pink-500 via-purple-500 to-blue-500 dark:from-pink-600 dark:via-purple-600 dark:to-blue-600",
    "from-blue-500 via-teal-500 to-green-500 dark:from-blue-600 dark:via-teal-600 dark:to-green-600",
    "from-yellow-500 via-orange-500 to-red-500 dark:from-yellow-600 dark:via-orange-600 dark:to-red-600",
    "from-purple-500 via-pink-500 to-red-500 dark:from-purple-600 dark:via-pink-600 dark:to-red-600",
    "from-green-500 via-emerald-500 to-teal-500 dark:from-green-600 dark:via-emerald-600 dark:to-teal-600",
  ];

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-64 mx-2 overflow-hidden rounded-xl border p-4",
        "transform transition-all hover:scale-[1.02] active:scale-[0.98]",
        "bg-gradient-to-br",
        gradients[index % gradients.length],
        "text-white cursor-pointer"
      )}
    >
      <div className="space-y-2">
        <Badge variant="outline" className="w-fit backdrop-blur-sm bg-white/10 border-white/20 text-white">
          {improvement.devotee_name}
        </Badge>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={cn(
                "bg-green-500/20 text-white",
                "animate-pulse-subtle shadow-[0_0_15px_rgba(34,197,94,0.5)]",
                "backdrop-blur-sm border-green-400/30"
              )}
            >
              +{improvement.percentageIncrease.toFixed(0)}%
            </Badge>
            <span className="text-xs text-white/80">improvement</span>
          </div>
          <p className="text-xs text-white/70">
            Increased by {improvement.improvement} points on {improvement.date}
          </p>
        </div>
      </div>
    </button>
  );
};

const fetchLeaderboardData = async () => {
  const { data, error } = await supabase
    .from('leaderboard_view')
    .select('*')
    .order('total_score', { ascending: false });
  
  if (error) {
    console.error('Error fetching leaderboard:', error);
    return null;
  }
  
  return data;
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
}: {
  quote: string;
  author: string;
}) => {
  return (
    <blockquote className={cn(
      "rounded-xl border-l-4 px-4 py-3",
      "border-purple-500/70 bg-purple-500/15 text-purple-700",
      "dark:bg-purple-500/10 dark:text-purple-400",
      "transition-all duration-300"
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

export function Leaderboard() {
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDevotee, setSelectedDevotee] = useState<string>("");
  const [personalStats, setPersonalStats] = useState<PersonalStats | null>(null);
  const [scoresByDevotee, setScoresByDevotee] = useState<Record<string, number[]>>({});
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isImprovementDialogOpen, setIsImprovementDialogOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [topThreeView, setTopThreeView] = useState<'weekly' | 'monthly' | 'overall'>('overall');
  const [selectedImprovement, setSelectedImprovement] = useState<Improvement | null>(null);

  const fetchLeaderboardStats = async () => {
    setIsLoading(true);
    
    // Calculate current week's start date (Sunday)
    const currentWeekStart = new Date();
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);

    const [records, leaderboardData] = await Promise.all([
      supabase
        .from('sadhna_report_view')
        .select('*')
        .order('date', { ascending: false }),
      fetchLeaderboardData()
    ]);

    if (records.data && !records.error && leaderboardData) {
      // Initialize all variables at the start
      const devoteeScores: Record<string, number[]> = {};
      const allTimeHigh = {
        score: 0,
        devotee_name: '',
        date: ''
      };
      const weeklyHigh = {
        score: 0,
        devotee_name: '',
        date: ''
      };
      const monthlyHigh = {
        score: 0,
        devotee_name: '',
        date: ''
      };
      const personalBests: Record<string, { current: number, previous: number, date: string }> = {};
      const significantImprovements: Improvement[] = [];

      // First pass: collect all scores by devotee
      records.data.forEach(record => {
        if (!devoteeScores[record.devotee_name]) {
          devoteeScores[record.devotee_name] = [];
        }
        devoteeScores[record.devotee_name].push(record.total_score);

        // Update all-time high
        if (record.total_score > allTimeHigh.score) {
          allTimeHigh.score = record.total_score;
          allTimeHigh.devotee_name = record.devotee_name;
          allTimeHigh.date = new Date(record.date).toLocaleDateString();
        }

        // Check weekly high
        const recordDate = new Date(record.date);
        if (recordDate >= currentWeekStart && record.total_score > weeklyHigh.score) {
          weeklyHigh.score = record.total_score;
          weeklyHigh.devotee_name = record.devotee_name;
          weeklyHigh.date = recordDate.toLocaleDateString();
        }
      });

      setScoresByDevotee(devoteeScores);

      // Get monthly high score from leaderboard view
      const monthlyLeader = leaderboardData
        .sort((a, b) => b.monthly_score - a.monthly_score)[0];

      // Process significant improvements
      Object.entries(devoteeScores).forEach(([devotee, scores]) => {
        if (scores.length >= 3) {
          const latestScore = scores[0];
          const previousScores = scores.slice(1);
          const avgPreviousScore = previousScores.reduce((a, b) => a + b, 0) / previousScores.length;
          const improvement = latestScore - avgPreviousScore;
          const percentageIncrease = (improvement / avgPreviousScore) * 100;

          if (percentageIncrease > 20) {
            significantImprovements.push({
              devotee_name: devotee,
              improvement,
              percentageIncrease,
              date: new Date(records.data.find(r => r.total_score === latestScore)?.date || '').toLocaleDateString(),
            });
          }
        }
      });

      // Track if this is a new all-time record
      const previousAllTimeHigh = Math.max(...records.data.slice(1).map(r => r.total_score));
      const isNewRecord = records.data[0]?.total_score > previousAllTimeHigh;

      setStats({
        allTimeHighScore: allTimeHigh,
        weeklyHighScore: weeklyHigh,
        monthlyHighScore: {
          score: monthlyLeader.monthly_score,
          devotee_name: monthlyLeader.devotee_name,
        },
        recentPersonalBests: Object.entries(personalBests).map(([name, stats]) => ({
          devotee_name: name,
          newBest: stats.current,
          previousBest: stats.previous,
          date: stats.date,
        })),
        newAllTimeRecord: isNewRecord,
        significantImprovements: significantImprovements,
      });
    }
    setIsLoading(false);
  };

  const fetchPersonalStats = async (devoteeName: string) => {
    const { data, error } = await supabase
      .from('sadhna_report_view')
      .select('*')
      .eq('devotee_name', devoteeName)
      .order('date', { ascending: false });

    if (data && data.length > 0) {
      const currentScore = data[0].total_score;
      const previousScores = data.slice(1).map(r => r.total_score);
      const previousBest = previousScores.length > 0 ? Math.max(...previousScores) : currentScore;
      const improvement = currentScore - previousBest;
      const percentageIncrease = previousBest === 0 ? 0 : (improvement / previousBest) * 100;

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
      });
    }
  };

  const fetchFullLeaderboard = async () => {
    const { data, error } = await supabase
      .from('leaderboard_view')
      .select('*')
      .order('total_score', { ascending: false });
    
    if (error) {
      console.error('Error fetching leaderboard:', error);
      return;
    }
    
    setLeaderboardData(data);
  };

  const getTopThree = () => {
    if (!leaderboardData?.length) return [];
    
    const sortedData = [...leaderboardData].sort((a, b) => {
      switch (topThreeView) {
        case 'weekly':
          return b.weekly_score - a.weekly_score;
        case 'monthly':
          return b.monthly_score - a.monthly_score;
        default:
          return b.total_score - a.total_score;
      }
    });
    
    return sortedData.slice(0, 3);
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
            className="flex justify-center gap-2"
          >
            <Badge
              variant={topThreeView === 'weekly' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-accent"
              onClick={() => setTopThreeView('weekly')}
            >
              Weekly
            </Badge>
            <Badge
              variant={topThreeView === 'monthly' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-accent"
              onClick={() => setTopThreeView('monthly')}
            >
              Monthly
            </Badge>
            <Badge
              variant={topThreeView === 'overall' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-accent"
              onClick={() => setTopThreeView('overall')}
            >
              Overall
            </Badge>
          </motion.div>

          {/* Podium Section */}
          <motion.div variants={itemVariants} className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/20 rounded-xl -z-10" />
            <div className="p-4 sm:p-8">
              {leaderboardData?.length > 0 ? (
                <div className="flex items-end justify-center gap-2 sm:gap-6">
                  {/* 2nd Place */}
                  <motion.button
                    variants={podiumVariants}
                    key={getTopThree()[1]?.devotee_name}
                    onClick={() => triggerConfetti(["#C0C0C0", "#E8E8E8"])}
                    className={cn(
                      "relative w-[120px] sm:w-[200px] px-3 sm:px-6 py-3 sm:py-4 rounded-xl",
                      "transition-all hover:scale-105 hover:-translate-y-1",
                      "border-2 border-[#C0C0C0]",
                      "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-900/30",
                      "flex flex-col items-center gap-2 sm:gap-3",
                      "group shadow-lg"
                    )}
                  >
                    <Star className="h-4 w-4 sm:h-6 sm:w-6 text-[#C0C0C0] group-hover:text-[#E8E8E8]" />
                    <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 truncate w-full text-center">
                      {getTopThree()[1]?.devotee_name}
                    </span>
                    <Badge variant="secondary" className="bg-[#C0C0C0]/10 text-[#808080] text-xs sm:text-sm">
                      {topThreeView === 'weekly' 
                        ? getTopThree()[1]?.weekly_score 
                        : topThreeView === 'monthly'
                        ? getTopThree()[1]?.monthly_score
                        : getTopThree()[1]?.total_score} pts
                    </Badge>
                  </motion.button>

                  {/* 1st Place - Special Treatment */}
                  <motion.button
                    variants={podiumVariants}
                    key={getTopThree()[0]?.devotee_name}
                    onClick={() => triggerConfetti(["#FFD700", "#FFED4A"])}
                    className={cn(
                      "relative w-[140px] sm:w-[200px] px-3 sm:px-6 py-3 sm:py-4 rounded-xl",
                      "transition-all hover:scale-105 hover:-translate-y-2",
                      "border-2 border-[#FFD700]",
                      "bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/50 dark:to-amber-900/30",
                      "flex flex-col items-center gap-2 sm:gap-3",
                      "group shadow-xl",
                      "transform scale-105 -translate-y-4"
                    )}
                  >
                    <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-[#FFD700] group-hover:text-[#FFED4A]" />
                    <SparklesText 
                      text={getTopThree()[0]?.devotee_name}
                      className="text-base sm:text-lg font-semibold truncate w-full text-center"
                      colors={{ first: "#FFD700", second: "#FFED4A" }}
                    />
                    <Badge 
                      variant="secondary" 
                      className="bg-[#FFD700]/20 text-[#B8860B] px-3 sm:px-4 py-0.5 sm:py-1 text-sm sm:text-base"
                    >
                      {topThreeView === 'weekly' 
                        ? getTopThree()[0]?.weekly_score 
                        : topThreeView === 'monthly'
                        ? getTopThree()[0]?.monthly_score
                        : getTopThree()[0]?.total_score} pts
                    </Badge>
                    <Meteors number={5} />
                  </motion.button>

                  {/* 3rd Place */}
                  <motion.button
                    variants={podiumVariants}
                    key={getTopThree()[2]?.devotee_name}
                    onClick={() => triggerConfetti(["#CD7F32", "#DFA878"])}
                    className={cn(
                      "relative w-[120px] sm:w-[200px] px-3 sm:px-6 py-3 sm:py-4 rounded-xl",
                      "transition-all hover:scale-105 hover:-translate-y-1",
                      "border-2 border-[#CD7F32]",
                      "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/50 dark:to-orange-900/30",
                      "flex flex-col items-center gap-2 sm:gap-3",
                      "group shadow-lg"
                    )}
                  >
                    <Trophy className="h-4 w-4 sm:h-6 sm:w-6 text-[#CD7F32] group-hover:text-[#DFA878]" />
                    <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 truncate w-full text-center">
                      {getTopThree()[2]?.devotee_name}
                    </span>
                    <Badge variant="secondary" className="bg-[#CD7F32]/10 text-[#8B4513] text-xs sm:text-sm">
                      {topThreeView === 'weekly' 
                        ? getTopThree()[2]?.weekly_score 
                        : topThreeView === 'monthly'
                        ? getTopThree()[2]?.monthly_score
                        : getTopThree()[2]?.total_score} pts
                    </Badge>
                  </motion.button>
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
        <div className="py-8 relative">
          {stats?.significantImprovements && stats.significantImprovements.length > 0 && (
            <Marquee className="py-4">
              {stats.significantImprovements.map((improvement, index) => (
                <ImprovementCard
                  key={`${improvement.devotee_name}-${index}`}
                  improvement={improvement}
                  index={index}
                  onClick={() => {
                    setSelectedImprovement(improvement);
                    setIsImprovementDialogOpen(true);
                  }}
                />
              ))}
            </Marquee>
          )}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-background"></div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-background"></div>
        </div>

        {/* Personal Progress Tracker */}
        <div className="w-full">
          <Card className="border bg-background/30 backdrop-blur-[2px]">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Personal Progress Tracker
                </CardTitle>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline">
                    Track Your Growth
                  </Badge>
                  <span className="text-xs italic text-muted-foreground max-w-[300px] text-right">
                    "One should be enthusiastic to make progress in spiritual life. This is called utsāhān dhairyāt."
                    <span className="block mt-0.5 font-medium">
                      - Srila Prabhupada
                    </span>
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Devotee Selection - Left aligned */}
                <div className="text-sm text-muted-foreground">
                  Select your name to see your progress and compare with your previous best scores.
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full sm:max-w-[300px]"
                >
                  <Select
                    value={selectedDevotee}
                    onValueChange={(value) => {
                      setSelectedDevotee(value);
                      fetchPersonalStats(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a devotee" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(scoresByDevotee)
                        .sort()
                        .map((devotee) => (
                          <SelectItem key={devotee} value={devotee}>
                            {devotee}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </motion.div>

                {personalStats && (
                  <motion.div 
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6"
                  >
                    {/* Score Cards - Make responsive */}
                    <motion.div 
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      variants={fadeInScale}
                    >
                      {/* Current Score */}
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="space-y-2 p-4 rounded-lg bg-white/50 dark:bg-black/10"
                      >
                        <p className="text-sm text-muted-foreground">Current Score</p>
                        <motion.p 
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 200, damping: 15 }}
                          className="text-3xl font-bold text-green-600"
                        >
                          {personalStats.currentScore}
                        </motion.p>
                        <p className="text-xs text-muted-foreground">Latest achievement</p>
                      </motion.div>
                      
                      {/* Previous Best */}
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="space-y-2 p-4 rounded-lg bg-white/50 dark:bg-black/10"
                      >
                        <p className="text-sm text-muted-foreground">Previous Best</p>
                        <motion.p 
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 200, damping: 15 }}
                          className="text-3xl font-bold text-blue-600"
                        >
                          {personalStats.previousBest}
                        </motion.p>
                        <p className="text-xs text-muted-foreground">Your record to beat</p>
                      </motion.div>
                    </motion.div>

                    {/* Bento Grid Layout - Make responsive */}
                    <motion.div 
                      variants={staggerContainer}
                      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
                    >
                      {/* Lecture Card */}
                      <GradientBentoCard
                        size="default"
                        className="col-span-1 sm:col-span-1"
                        icon={
                          <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20">
                            <Headphones className="h-4 w-4 text-purple-600" />
                          </div>
                        }
                        title="Lecture"
                        value={`${personalStats.score_c || 0}/30`}
                        gradient="linear-gradient(135deg, #9333EA, #C084FC, #E879F9, #FAE8FF)"
                      >
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground truncate">
                            {personalStats.lecture_speaker || 'No lecture'}
                          </div>
                          <div className="text-2xl font-semibold">
                            {personalStats.lecture_time_min || 0}
                            <span className="text-sm font-normal text-muted-foreground ml-1">min</span>
                          </div>
                          <motion.div 
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            className="h-2 bg-purple-100 rounded-full overflow-hidden"
                          >
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(personalStats.score_c || 0) / 30 * 100}%` }}
                              className="h-full bg-purple-500"
                            />
                          </motion.div>
                        </div>
                      </GradientBentoCard>

                      {/* Seva Card */}
                      <GradientBentoCard
                        size="default"
                        className="col-span-1 sm:col-span-1"
                        icon={
                          <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                            <Heart className="h-4 w-4 text-green-600" />
                          </div>
                        }
                        title="Seva"
                        value={
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            {personalStats.score_d || 0}/15
                          </Badge>
                        }
                        gradient="linear-gradient(135deg, #22C55E, #4ADE80, #86EFAC, #DCFCE7)"
                      >
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground truncate">
                            {personalStats.seva_name || 'No seva'}
                          </div>
                          <div className="text-2xl font-semibold">
                            {personalStats.seva_time_min || 0}
                            <span className="text-sm font-normal text-muted-foreground ml-1">min</span>
                          </div>
                          <motion.div 
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            className="h-2 bg-green-100 rounded-full overflow-hidden"
                          >
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(personalStats.score_d || 0) / 15 * 100}%` }}
                              className="h-full bg-green-500"
                            />
                          </motion.div>
                        </div>
                      </GradientBentoCard>

                      {/* Book Reading Card */}
                      <GradientBentoCard
                        size="double"
                        className="col-span-1 sm:col-span-2"
                        icon={
                          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                          </div>
                        }
                        title="Book Reading"
                        value={
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            {personalStats.score_b || 0}/30
                          </Badge>
                        }
                        gradient="linear-gradient(135deg, #2563EB, #60A5FA, #93C5FD, #DBEAFE)"
                      >
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm gap-2">
                            <span className="text-muted-foreground">{personalStats.book_name || 'No book selected'}</span>
                            <span className="font-medium">{personalStats.book_reading_time_min || 0} min</span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                            <div>1-15 min: 7 pts</div>
                            <div>15-30 min: 15 pts</div>
                            <div>30-45 min: 20 pts</div>
                            <div>45+ min: 30 pts</div>
                          </div>
                          <motion.div 
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            className="h-2 bg-blue-100 rounded-full overflow-hidden"
                          >
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(personalStats.score_b || 0) / 30 * 100}%` }}
                              className="h-full bg-blue-500"
                            />
                          </motion.div>
                        </div>
                      </GradientBentoCard>

                      {/* Japa Progress Card */}
                      <GradientBentoCard
                        size="full"
                        className="col-span-1 sm:col-span-4"
                        icon={
                          <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/20">
                            <Bell className="h-4 w-4 text-orange-600" />
                          </div>
                        }
                        title="Japa Progress"
                        value={
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            {personalStats.score_a || 0}/25 points
                          </Badge>
                        }
                        gradient="linear-gradient(135deg, #EA580C, #FB923C, #FDBA74, #FED7AA)"
                      >
                        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="p-3 rounded-lg bg-orange-50/50 dark:bg-orange-900/10">
                            <div className="text-xs text-muted-foreground">Before 7 AM (Japa)</div>
                            <div className="text-lg font-semibold text-orange-600">
                              {personalStats.before_7_am_japa_session || 0}
                            </div>
                            <div className="text-xs text-orange-600/70">2.5 points/round</div>
                          </div>
                          <div className="p-3 rounded-lg bg-orange-50/50 dark:bg-orange-900/10">
                            <div className="text-xs text-muted-foreground">Before 7 AM</div>
                            <div className="text-lg font-semibold text-orange-600">
                              {personalStats.before_7_am || 0}
                            </div>
                            <div className="text-xs text-orange-600/70">2.0 points/round</div>
                          </div>
                          <div className="p-3 rounded-lg bg-orange-50/50 dark:bg-orange-900/10">
                            <div className="text-xs text-muted-foreground">7-9 AM</div>
                            <div className="text-lg font-semibold text-orange-600">
                              {personalStats.from_7_to_9_am || 0}
                            </div>
                            <div className="text-xs text-orange-600/70">1.5 points/round</div>
                          </div>
                          <div className="p-3 rounded-lg bg-orange-50/50 dark:bg-orange-900/10">
                            <div className="text-xs text-muted-foreground">After 9 AM</div>
                            <div className="text-lg font-semibold text-orange-600">
                              {personalStats.after_9_am || 0}
                            </div>
                            <div className="text-xs text-orange-600/70">1.0 points/round</div>
                          </div>
                        </div>
                        <motion.div 
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          className="mt-4 h-2 bg-orange-100 rounded-full overflow-hidden"
                        >
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(personalStats.score_a || 0) / 25 * 100}%` }}
                            className="h-full bg-orange-500"
                          />
                        </motion.div>
                      </GradientBentoCard>
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dialogs */}
        <Dialog open={isImprovementDialogOpen} onOpenChange={setIsImprovementDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Improvement Details 🌟
              </DialogTitle>
              <DialogDescription>
                Detailed view of {selectedImprovement?.devotee_name}'s improvement
              </DialogDescription>
            </DialogHeader>

            {selectedImprovement && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Achievement Details</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Improvement</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          +{selectedImprovement.improvement}
                        </div>
                        <p className="text-sm text-muted-foreground">Points increased</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Growth Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedImprovement.percentageIncrease}%
                        </div>
                        <p className="text-sm text-muted-foreground">Percentage increase</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Achievement Date</h4>
                    <p className="text-muted-foreground">{selectedImprovement.date}</p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <ShinyButton 
                onClick={() => {
                  setIsImprovementDialogOpen(false);
                  setSelectedImprovement(null);
                }}
                className="w-full"
              >
                Close
              </ShinyButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Drawer open={isLeaderboardOpen} onOpenChange={setIsLeaderboardOpen}>
          <DrawerContent className="max-h-[96vh]">
            <DrawerHeader>
              <DrawerTitle className="text-center text-xl font-bold">
                Sadhana Leaderboard 🏆
              </DrawerTitle>
              <DrawerDescription className="text-center">
                All devotees' scores for different time periods
              </DrawerDescription>
            </DrawerHeader>

            <ScrollArea className="h-[60vh] px-4">
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
                  {leaderboardData.map((entry, index) => (
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
            </ScrollArea>

            <DrawerFooter className="pt-2">
              <DrawerClose asChild>
                <ShinyButton className="w-full">
                  Close
                </ShinyButton>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

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