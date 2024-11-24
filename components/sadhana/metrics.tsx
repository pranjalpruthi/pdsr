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
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        // Update devotees query to match form.tsx
        const devoteesListResponse = await supabase
          .from('devotees')
          .select('devotee_id, devotee_name')
          .order('devotee_name');

        if (devoteesListResponse.data) {
          setDevotees(devoteesListResponse.data);
        }

        const [reportsResponse, lowScoreResponse] = await Promise.all([
          supabase
            .from('sadhna_report')
            .select('*', { count: 'exact' })
            .gte('date', startOfWeek.toISOString()),
          supabase
            .from('sadhna_report_view')
            .select(`
              devotee_id,
              devotee_name,
              total_score,
              date
            `)
            .gt('total_score', 0)
            .lt('total_score', 50)
            .order('date', { ascending: false })
        ]);

        // Process low score devotees
        let uniqueLowScoreDevotees: DevoteeWithScores[] = [];
        if (lowScoreResponse.data) {
          const latestReports = lowScoreResponse.data.reduce((acc, curr) => {
            if (!acc[curr.devotee_id] || new Date(curr.date) > new Date(acc[curr.devotee_id].last_report_date)) {
              acc[curr.devotee_id] = {
                devotee_id: curr.devotee_id,
                devotee_name: curr.devotee_name,
                this_week_score: curr.total_score,
                last_week_score: 0,
                last_report_date: curr.date
              };
            }
            return acc;
          }, {} as Record<string, DevoteeWithScores>);

          uniqueLowScoreDevotees = Object.values(latestReports);
          setLowScoreDevotees(uniqueLowScoreDevotees);
        }

        // Set metrics with the correct devotees count
        setMetrics({
          reportsThisWeek: reportsResponse.count || 0,
          totalDevotees: devoteesListResponse.data?.length || 0,
          devoteesNeedingAttention: uniqueLowScoreDevotees.length
        });

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

        // Get devotees who haven't submitted this week
        const notSubmittedResponse = await supabase
          .from('devotees')
          .select(`
            devotee_id,
            devotee_name,
            sadhna_report!left(
              date,
              report_id
            )
          `)
          .not('sadhna_report.date', 'gt', startOfWeek.toISOString());

        if (notSubmittedResponse.data) {
          const notSubmitted = notSubmittedResponse.data.map(d => ({
            devotee_id: d.devotee_id,
            devotee_name: d.devotee_name,
            last_report_date: d.sadhna_report?.[0]?.date || null
          }));
          setNotSubmittedDevotees(notSubmitted);
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
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden p-0 gap-0 bg-background/80 backdrop-blur-md border border-muted">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col h-full max-h-[80vh]"
            >
              <DialogHeader className="px-4 py-3 border-b shrink-0">
                <DialogTitle>Submitted Reports This Week ({submittedReports.length})</DialogTitle>
              </DialogHeader>

              <motion.div 
                className="flex-1 overflow-y-auto p-4 min-h-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <AnimatePresence mode="popLayout">
                  <motion.div className="grid gap-2">
                    {submittedReports.map((report, index) => (
                      <motion.div
                        key={`${report.devotee_id}-${report.date}`}
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
                                getRandomPastelColor(report.devotee_name)
                              )}>
                                {getInitials(report.devotee_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <motion.p 
                                className="font-medium text-foreground/90"
                                layoutId={`report-${report.devotee_id}`}
                              >
                                {report.devotee_name}
                              </motion.p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(report.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-sm font-medium rounded-full px-3 py-1",
                              report.total_score >= 80 
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200 dark:border dark:border-green-800" :
                              report.total_score >= 60 
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 dark:border dark:border-blue-800" :
                              "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200 dark:border dark:border-amber-800"
                            )}>
                              Score: {report.total_score}
                            </span>
                          </div>
                        </div>
                        <motion.div 
                          className="mt-3 grid grid-cols-3 gap-2 text-sm"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <div className={cn(
                            "flex items-center gap-1 rounded-full px-2 py-1",
                            "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200 dark:border dark:border-purple-800"
                          )}>
                            <span>🎯 {report.total_rounds} Rounds</span>
                          </div>
                          {report.book_name && (
                            <div className={cn(
                              "flex items-center gap-1 rounded-full px-2 py-1",
                              "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border dark:border-indigo-800"
                            )}>
                              <span>📚 {report.book_name}</span>
                            </div>
                          )}
                          {report.seva_name && (
                            <div className={cn(
                              "flex items-center gap-1 rounded-full px-2 py-1",
                              "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200 dark:border dark:border-rose-800"
                            )}>
                              <span>🙏 {report.seva_name}</span>
                            </div>
                          )}
                        </motion.div>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
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
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden p-0 gap-0 bg-background/80 backdrop-blur-md border border-muted">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col h-full max-h-[80vh]"
            >
              <DialogHeader className="px-4 py-3 border-b shrink-0">
                <DialogTitle>All Devotees ({filteredDevotees.length})</DialogTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search devotees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 bg-muted/50"
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
                    {filteredDevotees.map((devotee, index) => (
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
                        className="group relative flex items-center p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
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
                            className="font-medium text-foreground/90 truncate"
                            layoutId={`name-${devotee.devotee_id}`}
                          >
                            {devotee.devotee_name}
                          </motion.p>
                        </div>
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                        >
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-2"
                          >
                            View Details
                          </Button>
                        </motion.div>
                      </motion.div>
                    ))}
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