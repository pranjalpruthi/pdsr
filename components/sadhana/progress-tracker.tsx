"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, Bell, BookOpen, Headphones, Heart, QuoteIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { GradientBentoCard } from "@/components/ui/gradient-bento-card";
import { cn } from "@/lib/utils";

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

interface ScoreData {
  id: string;
  date: string;
  fullDate: string;
  score: number;
  improvement: number;
}

// Animation variants
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

interface ProgressTrackerProps {
  scoresByDevotee: Record<string, number[]>;
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function getWeekDates(weekNumber: number, year: number) {
  const firstDayOfYear = new Date(year, 0, 1);
  const firstWeekDay = firstDayOfYear.getDay();
  const daysToAdd = (weekNumber - 1) * 7 - firstWeekDay;
  
  const weekStart = new Date(year, 0, 1 + daysToAdd);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  return {
    start: weekStart.toISOString().split('T')[0],
    end: weekEnd.toISOString().split('T')[0]
  };
}

export function ProgressTracker({ scoresByDevotee }: ProgressTrackerProps) {
  const [selectedDevotee, setSelectedDevotee] = useState<string>("");
  const [personalStats, setPersonalStats] = useState<PersonalStats | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(getWeekNumber(new Date()));
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);
  const [weeklyTotal, setWeeklyTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNoData, setHasNoData] = useState(false);

  useEffect(() => {
    const currentWeek = getWeekNumber(new Date());
    const weeks = Array.from({ length: currentWeek }, (_, i) => currentWeek - i);
    setAvailableWeeks(weeks);
  }, []);

  const fetchPersonalStats = async (devoteeName: string, weekNum?: number) => {
    setIsLoading(true);
    setHasNoData(false);
    
    let query = supabase
      .from('sadhna_report_view')
      .select('*')
      .eq('devotee_name', devoteeName)
      .order('date', { ascending: false });

    if (weekNum) {
      const year = new Date().getFullYear();
      const { start, end } = getWeekDates(weekNum, year);
      query = query
        .gte('date', start)
        .lte('date', end);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching stats:', error);
      setIsLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setHasNoData(true);
      setPersonalStats(null);
      setIsLoading(false);
      return;
    }

    const weekTotal = data.reduce((sum, day) => sum + (day.total_score || 0), 0);
    setWeeklyTotal(weekTotal);

    const currentDayScore = data[0].total_score || 0;

    const previousScores = data.slice(1).map(r => r.total_score || 0);
    
    const previousBest = previousScores.length > 0 ? Math.max(...previousScores) : currentDayScore;
    
    const improvement = currentDayScore - previousBest;
    
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
      score: entry.total_score || 0,
      improvement: index < data.length - 1 
        ? (entry.total_score || 0) - (data[index + 1].total_score || 0)
        : 0
    })).reverse();

    setPersonalStats({
      devotee_name: devoteeName,
      currentScore: currentDayScore,
      previousBest: previousBest,
      improvement,
      percentageIncrease,
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
    setIsLoading(false);
  };

  return (
    <Card className="border bg-background/30 backdrop-blur-xl">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Progress Tracker
          </CardTitle>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className="whitespace-nowrap">
              Track Your Growth
            </Badge>
            <span className="text-xs italic text-muted-foreground max-w-[200px] sm:max-w-[300px] text-right">
              "One should be enthusiastic to make progress in spiritual life."
              <span className="block mt-0.5 font-medium">
                - Srila Prabhupada
              </span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 sm:space-y-6">
          <div className="text-sm text-muted-foreground">
            Select your name to see your progress:
          </div>
          
          <div className="space-y-4">
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
                  fetchPersonalStats(value, selectedWeek);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a devotee" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
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

            {selectedDevotee && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-4"
              >
                <Select
                  value={selectedWeek.toString()}
                  onValueChange={(value) => {
                    const weekNum = parseInt(value);
                    setSelectedWeek(weekNum);
                    fetchPersonalStats(selectedDevotee, weekNum);
                  }}
                >
                  <SelectTrigger className="w-[140px]">
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

                {weeklyTotal > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2"
                  >
                    <Badge 
                      variant="secondary" 
                      className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    >
                      Week Total: {weeklyTotal} points
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      ({new Date().getFullYear()})
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 p-4 sm:p-8"
            >
              <div className="flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Fetching bhakta data...
              </p>
            </motion.div>
          )}

          {hasNoData && selectedDevotee && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center p-4 sm:p-8 space-y-3"
            >
              <div className="flex justify-center">
                <QuoteIcon className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/30" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg">No Data Available</h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-[280px] sm:max-w-md mx-auto">
                {selectedDevotee} hasn't submitted any sadhana reports for Week {selectedWeek} yet.
                Please check back later or select a different week.
              </p>
            </motion.div>
          )}

          {personalStats && !isLoading && (
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-4 sm:space-y-6"
            >
              {/* Score Cards */}
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

              {/* Bento Grid Layout */}
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
                  value={
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                      {personalStats.score_c || 0}/30
                    </Badge>
                  }
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
  );
} 