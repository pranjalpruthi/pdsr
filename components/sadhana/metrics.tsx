"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { Loader2, TrendingUp, TrendingDown, ChevronDown, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as Collapsible from '@radix-ui/react-collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Metrics {
  reportsThisWeek: number;
  totalDevotees: number;
  devoteesNeedingAttention: number;
}

interface DevoteeReport {
  devotee_id: string;
  devotee_name: string;
  date: string;
  total_score: number;
  total_rounds: number;
  book_name: string;
  seva_name: string;
}

interface Devotee {
  devotee_id: string;
  devotee_name: string;
}

interface DevoteeWithScore {
  devotee_id: string;
  devotee_name: string;
  total_score: number;
  last_report_date: string;
}

interface DevoteeWithScores {
  devotee_id: string;
  devotee_name: string;
  this_week_score: number;
  last_week_score: number;
  last_report_date: string;
}

interface DevoteeNotSubmitted {
  devotee_id: string;
  devotee_name: string;
  last_report_date: string | null;
}

interface DevoteeHealth {
  averageScore: number;
  consistencyRate: number;
  lastFourWeeks: {
    week: string;
    score: number;
    rounds: number;
    reportDate: string;
  }[];
  strengthAreas: string[];
  improvementAreas: string[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

// Helper function to get initials from name
function getInitials(name: string) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Helper function to get random pastel color
function getRandomPastelColor(seed: string) {
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-purple-100 text-purple-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-indigo-100 text-indigo-700",
  ];
  const index = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}

function calculateDevoteeHealth(reports: DevoteeReport[]): DevoteeHealth {
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  
  const recentReports = reports
    .filter(r => new Date(r.date) >= fourWeeksAgo)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const scores = recentReports.map(r => r.total_score);
  const averageScore = scores.length 
    ? scores.reduce((a, b) => a + b, 0) / scores.length 
    : 0;

  const consistencyRate = (recentReports.length / 28) * 100;

  const strengthAreas = [];
  const improvementAreas = [];

  // Analyze patterns
  if (averageScore >= 80) strengthAreas.push("Consistently High Scores");
  if (averageScore < 50) improvementAreas.push("Overall Score Needs Improvement");
  
  const avgRounds = recentReports.reduce((acc, r) => acc + r.total_rounds, 0) / recentReports.length;
  if (avgRounds >= 16) strengthAreas.push("Strong Japa Practice");
  if (avgRounds < 16) improvementAreas.push("Japa Rounds Need Attention");

  return {
    averageScore,
    consistencyRate,
    lastFourWeeks: recentReports.slice(0, 4).map(r => ({
      week: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: r.total_score,
      rounds: r.total_rounds,
      reportDate: r.date
    })),
    strengthAreas,
    improvementAreas
  };
}

export function SadhanaMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [submittedReports, setSubmittedReports] = useState<DevoteeReport[]>([]);
  const [devotees, setDevotees] = useState<Devotee[]>([]);
  const [lowScoreDevotees, setLowScoreDevotees] = useState<DevoteeWithScores[]>([]);
  const [notSubmittedDevotees, setNotSubmittedDevotees] = useState<DevoteeNotSubmitted[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        
        // Get start of current and last week
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfLastWeek = new Date(startOfWeek);
        startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

        // Get devotees list
        const devoteesListResponse = await supabase
          .from('devotees')
          .select('devotee_id, devotee_name')
          .order('devotee_name');

        if (devoteesListResponse.data) {
          setDevotees(devoteesListResponse.data);
        }

        // Fetch reports for both current and last week
        const reportsResponse = await supabase
          .from('sadhna_report_view')
          .select(`
            devotee_id,
            devotee_name,
            total_score,
            date
          `)
          .gte('date', startOfLastWeek.toISOString())
          .lte('date', new Date().toISOString())
          .order('date', { ascending: false });

        if (reportsResponse.data) {
          // Process reports to get this week and last week scores
          const devoteeScores: Record<string, DevoteeWithScores> = {};

          reportsResponse.data.forEach(report => {
            const reportDate = new Date(report.date);
            const isThisWeek = reportDate >= startOfWeek;
            
            if (!devoteeScores[report.devotee_id]) {
              devoteeScores[report.devotee_id] = {
                devotee_id: report.devotee_id,
                devotee_name: report.devotee_name,
                this_week_score: 0,
                last_week_score: 0,
                last_report_date: report.date
              };
            }

            if (isThisWeek) {
              devoteeScores[report.devotee_id].this_week_score = report.total_score;
            } else {
              devoteeScores[report.devotee_id].last_week_score = report.total_score;
            }
          });

          // Filter low score devotees (those who submitted this week but scored < 50)
          const lowScores = Object.values(devoteeScores).filter(
            d => d.this_week_score > 0 && d.this_week_score < 50
          );
          setLowScoreDevotees(lowScores);

          // Calculate not submitted devotees
          const submittedThisWeek = new Set(
            reportsResponse.data
              .filter(r => new Date(r.date) >= startOfWeek)
              .map(r => r.devotee_id)
          );

          const notSubmitted = devoteesListResponse.data
            ?.filter(d => !submittedThisWeek.has(d.devotee_id))
            .map(d => {
              const lastReport = reportsResponse.data
                .filter(r => r.devotee_id === d.devotee_id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

              return {
                devotee_id: d.devotee_id,
                devotee_name: d.devotee_name,
                last_report_date: lastReport?.date || null
              };
            }) || [];

          setNotSubmittedDevotees(notSubmitted);

          // Update metrics
          setMetrics({
            reportsThisWeek: submittedThisWeek.size,
            totalDevotees: devoteesListResponse.data?.length || 0,
            devoteesNeedingAttention: lowScores.length + notSubmitted.length
          });
        }

        // Fetch detailed reports for the dialog
        const reportsDetailResponse = await supabase
          .from('sadhna_report_view')
          .select(`
            report_id,
            devotee_id,
            devotee_name,
            date,
            total_score,
            total_rounds,
            book_name,
            seva_name
          `)
          .gte('date', startOfWeek.toISOString())
          .order('date', { ascending: false });

        if (reportsDetailResponse.data) {
          setSubmittedReports(reportsDetailResponse.data);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const filteredDevotees = devotees.filter(devotee => 
    devotee.devotee_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="flex justify-center"
      >
        <div className="rounded-full bg-red-100 dark:bg-red-900/20 px-4 py-2">
          <p className="text-sm text-destructive text-center">{error}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-wrap justify-center gap-4"
      >
        {/* Reports This Week */}
        <Dialog>
          <DialogTrigger>
            <motion.div variants={item}>
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 px-4 sm:px-6 py-2 hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-blue-600 dark:text-blue-400">📅</span>
                  {isLoading ? (
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs text-blue-600 dark:text-blue-400">...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-blue-800 dark:text-blue-200">
                        {metrics?.reportsThisWeek}
                      </span>
                      <span className="hidden sm:inline text-sm font-medium text-blue-700 dark:text-blue-300">
                        Reports This Week
                      </span>
                      <TrendingUp className="h-4 w-4 text-blue-500 ml-1" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden p-0 gap-0 bg-background/80 backdrop-blur-md border border-muted dark:border-gray-700">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col h-full max-h-[80vh]"
            >
              <DialogHeader className="px-4 py-3 border-b shrink-0 dark:border-gray-700">
                <DialogTitle>Submitted Reports This Week ({submittedReports.length})</DialogTitle>
              </DialogHeader>

              <motion.div 
                className="flex-1 overflow-y-auto p-4 min-h-0"
                initial={false}
              >
                <div className="grid gap-3">
                  {submittedReports.map((report, index) => (
                    <motion.div
                      key={`${report.devotee_id}-${report.date}`}
                      initial={false}
                      className="group relative rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors dark:bg-gray-800/50 dark:hover:bg-gray-800/80"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className={cn(
                                "text-xs font-medium",
                                getRandomPastelColor(report.devotee_name)
                              )}>
                                {getInitials(report.devotee_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground/90 dark:text-gray-200">
                                {report.devotee_name}
                              </p>
                              <p className="text-sm text-muted-foreground dark:text-gray-400">
                                {new Date(report.date).toLocaleDateString(undefined, {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] dark:bg-gray-800 dark:border-gray-700">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 dark:text-gray-200">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className={cn(
                                      "text-xs font-medium",
                                      getRandomPastelColor(report.devotee_name)
                                    )}>
                                      {getInitials(report.devotee_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  {report.devotee_name}
                                </DialogTitle>
                                <p className="text-sm text-muted-foreground dark:text-gray-400">
                                  {new Date(report.date).toLocaleDateString(undefined, {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              </DialogHeader>
                              <div className="grid gap-4">
                                {/* Score Overview */}
                                <Card className="p-4 dark:bg-gray-700">
                                  <h4 className="text-sm font-medium mb-3 dark:text-gray-300">Score Breakdown</h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground dark:text-gray-400">Total Score</span>
                                      <span className={cn(
                                        "text-sm font-medium px-2.5 py-0.5 rounded-full",
                                        report.total_score >= 80 
                                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                          : report.total_score >= 60
                                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                          : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                                      )}>
                                        {report.total_score} points
                                      </span>
                                    </div>
                                  </div>
                                </Card>

                                {/* Japa Details */}
                                <Card className="p-4 dark:bg-gray-700">
                                  <h4 className="text-sm font-medium mb-3 dark:text-gray-300">Japa Practice</h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground dark:text-gray-400">Total Rounds</span>
                                      <span className="text-sm font-medium dark:text-gray-200">
                                        🎯 {report.total_rounds} Rounds
                                      </span>
                                    </div>
                                  </div>
                                </Card>

                                {/* Additional Activities */}
                                <Card className="p-4 dark:bg-gray-700">
                                  <h4 className="text-sm font-medium mb-3 dark:text-gray-300">Additional Activities</h4>
                                  <div className="space-y-3">
                                    {report.book_name && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground dark:text-gray-400">Book Reading</span>
                                        <span className="text-sm font-medium dark:text-gray-200">
                                          📚 {report.book_name}
                                        </span>
                                      </div>
                                    )}
                                    {report.seva_name && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground dark:text-gray-400">Seva Service</span>
                                        <span className="text-sm font-medium dark:text-gray-200">
                                          🙏 {report.seva_name}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </Card>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>

                        {/* Preview Stats */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className={cn(
                            "inline-flex items-center text-sm px-2.5 py-0.5 rounded-full",
                            report.total_score >= 80 
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : report.total_score >= 60
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                          )}>
                            Score: {report.total_score}
                          </span>
                          <span className="inline-flex items-center text-sm px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                            🎯 {report.total_rounds} Rounds
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Total Devotees */}
        <Dialog>
          <DialogTrigger>
            <motion.div variants={item}>
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 px-4 sm:px-6 py-2 hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-green-600 dark:text-green-400">🙏</span>
                  {isLoading ? (
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs text-green-600 dark:text-green-400">...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-green-800 dark:text-green-200">
                        {metrics?.totalDevotees}
                      </span>
                      <span className="hidden sm:inline text-sm font-medium text-green-700 dark:text-green-300">
                        Total Devotees
                      </span>
                      <TrendingUp className="h-4 w-4 text-green-500 ml-1" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden p-0 gap-0 bg-background/80 backdrop-blur-md border border-muted dark:border-gray-700">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col h-full max-h-[80vh]"
            >
              <DialogHeader className="px-4 py-3 border-b shrink-0 dark:border-gray-700">
                <DialogTitle>All Devotees ({filteredDevotees.length})</DialogTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground dark:text-gray-400" />
                  <Input
                    placeholder="Search devotees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 bg-muted/50 dark:bg-gray-800"
                  />
                </div>
              </DialogHeader>

              <motion.div 
                className="flex-1 overflow-y-auto p-4 min-h-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <AnimatePresence mode="popLayout">
                  <motion.div 
                    className="grid gap-2"
                    layout
                  >
                    {filteredDevotees.map((devotee, index) => {
                      const health = calculateDevoteeHealth(
                        submittedReports.filter(r => r.devotee_id === devotee.devotee_id)
                      );
                      
                      return (
                        <motion.div
                          key={devotee.devotee_id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ 
                            duration: 0.3,
                            delay: index * 0.05,
                            ease: "easeOut"
                          }}
                          layout
                          className="group relative flex items-center p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors dark:bg-gray-800 dark:hover:bg-gray-700"
                        >
                          <Avatar className="h-9 w-9 mr-3">
                            <AvatarFallback className={cn(
                              "text-xs font-medium",
                              getRandomPastelColor(devotee.devotee_name)
                            )}>
                              {getInitials(devotee.devotee_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <motion.p 
                              className="font-medium text-foreground/90 truncate dark:text-gray-200"
                              layoutId={`name-${devotee.devotee_id}`}
                            >
                              {devotee.devotee_name}
                            </motion.p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={cn(
                                "text-xs rounded-full px-2 py-0.5",
                                health.averageScore >= 80 
                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                  : health.averageScore >= 60
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                              )}>
                                Avg: {Math.round(health.averageScore)}
                              </span>
                              <span className={cn(
                                "text-xs rounded-full px-2 py-0.5",
                                health.consistencyRate >= 80 
                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                  : health.consistencyRate >= 60
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                              )}>
                                Consistency: {Math.round(health.consistencyRate)}%
                              </span>
                            </div>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] dark:bg-gray-800 dark:border-gray-700">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 dark:text-gray-200">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className={cn(
                                      "text-xs font-medium",
                                      getRandomPastelColor(devotee.devotee_name)
                                    )}>
                                      {getInitials(devotee.devotee_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  {devotee.devotee_name}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4">
                                {/* Overall Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                  <Card className="p-4 dark:bg-gray-700">
                                    <h4 className="text-sm font-medium mb-2 dark:text-gray-300">Average Score</h4>
                                    <p className={cn(
                                      "text-2xl font-bold",
                                      health.averageScore >= 80 ? "text-green-600 dark:text-green-300" :
                                      health.averageScore >= 60 ? "text-blue-600 dark:text-blue-300" :
                                      "text-amber-600 dark:text-amber-300"
                                    )}>
                                      {Math.round(health.averageScore)}
                                    </p>
                                  </Card>
                                  <Card className="p-4 dark:bg-gray-700">
                                    <h4 className="text-sm font-medium mb-2 dark:text-gray-300">Consistency</h4>
                                    <p className={cn(
                                      "text-2xl font-bold",
                                      health.consistencyRate >= 80 ? "text-green-600 dark:text-green-300" :
                                      health.consistencyRate >= 60 ? "text-blue-600 dark:text-blue-300" :
                                      "text-amber-600 dark:text-amber-300"
                                    )}>
                                      {Math.round(health.consistencyRate)}%
                                    </p>
                                  </Card>
                                </div>

                                {/* Recent Progress */}
                                <Card className="p-4 dark:bg-gray-700">
                                  <h4 className="text-sm font-medium mb-3 dark:text-gray-300">Recent Progress</h4>
                                  <div className="space-y-3">
                                    {health.lastFourWeeks.map((week, i) => (
                                      <div key={week.reportDate} className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground dark:text-gray-400">{week.week}</span>
                                        <div className="flex items-center gap-3">
                                          <span className="text-sm dark:text-gray-300">🎯 {week.rounds} Rounds</span>
                                          <span className={cn(
                                            "text-sm font-medium px-2 py-0.5 rounded-full",
                                            week.score >= 80 
                                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                              : week.score >= 60
                                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                              : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                                          )}>
                                            {week.score} pts
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </Card>

                                {/* Areas */}
                                <div className="grid grid-cols-2 gap-4">
                                  <Card className="p-4 dark:bg-gray-700">
                                    <h4 className="text-sm font-medium mb-2 text-green-600 dark:text-green-300">Strength Areas</h4>
                                    <ul className="space-y-1">
                                      {health.strengthAreas.map((area, i) => (
                                        <li key={i} className="text-sm flex items-center gap-1 dark:text-gray-300">
                                          <span className="text-green-500 dark:text-green-300">✓</span> {area}
                                        </li>
                                      ))}
                                    </ul>
                                  </Card>
                                  <Card className="p-4 dark:bg-gray-700">
                                    <h4 className="text-sm font-medium mb-2 text-amber-600 dark:text-amber-300">Needs Improvement</h4>
                                    <ul className="space-y-1">
                                      {health.improvementAreas.map((area, i) => (
                                        <li key={i} className="text-sm flex items-center gap-1 dark:text-gray-300">
                                          <span className="text-amber-500 dark:text-amber-300">!</span> {area}
                                        </li>
                                      ))}
                                    </ul>
                                  </Card>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Devotees Needing Attention */}
        <Dialog>
          <DialogTrigger>
            <motion.div variants={item}>
              <div className="rounded-full bg-amber-100 dark:bg-amber-900/20 px-4 sm:px-6 py-2 hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-amber-600 dark:text-amber-400">🧘‍♂️</span>
                  {isLoading ? (
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs text-amber-600 dark:text-amber-400">...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-amber-800 dark:text-amber-200">
                        {metrics?.devoteesNeedingAttention}
                      </span>
                      <span className="hidden sm:inline text-sm font-medium text-amber-700 dark:text-amber-300">
                        Needs Attention
                      </span>
                      <TrendingDown className="h-4 w-4 text-amber-500 ml-1" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden p-0 gap-0 bg-background/80 backdrop-blur-md border border-muted">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col h-full max-h-[80vh]"
            >
              <DialogHeader className="px-4 py-3 border-b">
                <DialogTitle>Devotees Needing Attention</DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="low-score" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="mx-4 mt-2">
                  <TabsTrigger value="low-score" className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Low Scores
                    <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-xs">
                      {lowScoreDevotees.length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="not-submitted" className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Not Submitted
                    <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-xs">
                      {notSubmittedDevotees.length}
                    </span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent 
                  value="low-score" 
                  className="flex-1 overflow-y-auto p-4 mt-0 min-h-0"
                >
                  <AnimatePresence mode="popLayout">
                    <motion.div className="grid gap-2">
                      {lowScoreDevotees.map((devotee, index) => (
                        <motion.div
                          key={devotee.devotee_id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ 
                            duration: 0.3,
                            delay: index * 0.05,
                            ease: "easeOut"
                          }}
                          className="group relative p-4 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className={cn(
                                  "text-xs font-medium",
                                  getRandomPastelColor(devotee.devotee_name)
                                )}>
                                  {getInitials(devotee.devotee_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-foreground">{devotee.devotee_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Last Report: {new Date(devotee.last_report_date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <div className={cn(
                                "flex items-center gap-2 rounded-full px-3 py-1.5",
                                "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200"
                              )}>
                                <span className="text-sm font-medium">This Week: {devotee.this_week_score}</span>
                                {devotee.this_week_score < devotee.last_week_score ? (
                                  <TrendingDown className="h-4 w-4" />
                                ) : (
                                  <TrendingUp className="h-4 w-4" />
                                )}
                              </div>
                              <div className={cn(
                                "flex items-center gap-2 rounded-full px-3 py-1.5",
                                "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-200"
                              )}>
                                <span className="text-sm font-medium">Last Week: {devotee.last_week_score}</span>
                              </div>
                              <div className={cn(
                                "flex items-center gap-2 rounded-full px-3 py-1.5",
                                devotee.this_week_score >= devotee.last_week_score
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200"
                              )}>
                                <span className="text-sm font-medium">
                                  {devotee.this_week_score >= devotee.last_week_score ? '↗ Improving' : '↘ Needs Help'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </TabsContent>

                <TabsContent 
                  value="not-submitted" 
                  className="flex-1 overflow-y-auto p-4 mt-0 min-h-0"
                >
                  <AnimatePresence mode="popLayout">
                    <motion.div className="grid gap-2">
                      {notSubmittedDevotees.map((devotee, index) => (
                        <motion.div
                          key={devotee.devotee_id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ 
                            duration: 0.3,
                            delay: index * 0.05,
                            ease: "easeOut"
                          }}
                          className="group relative p-4 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className={cn(
                                  "text-xs font-medium",
                                  getRandomPastelColor(devotee.devotee_name)
                                )}>
                                  {getInitials(devotee.devotee_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-foreground">{devotee.devotee_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {devotee.last_report_date 
                                    ? `Last Report: ${new Date(devotee.last_report_date).toLocaleDateString()}`
                                    : 'No previous reports'
                                  }
                                </p>
                              </div>
                            </div>
                            <div className="mt-3">
                              <div className={cn(
                                "inline-flex items-center gap-2 rounded-full px-3 py-1.5",
                                "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200"
                              )}>
                                <span className="text-sm font-medium">
                                  No report this week
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </TabsContent>
              </Tabs>
            </motion.div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}