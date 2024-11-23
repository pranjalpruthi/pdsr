"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";
import { GradientBentoCard } from "@/components/ui/gradient-bento-card";

interface WeeklyStatsData {
  devotee_name: string;
  total_score: number;
  book_name: string;
  read_count: number;
}

// Update the interface to separate devotee stats from book stats
interface DevoteeStats {
  devotee_name: string;
  total_score: number;
}

// Add this interface above the WeeklyStatsState interface
interface ChartDataItem extends Record<string, string | number> {
  name: string;
}

interface WeeklyStatsState {
  top10: DevoteeStats[];
  favoriteBook: { book_name: string; read_count: number; } | null;
  devoteeOfWeek: DevoteeStats | null;
  chartData: ChartDataItem[]; // Update to use the new interface
  trend: number;
}

export function WeeklyStats() {
  const [weeks, setWeeks] = useState<string[]>([]);
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyStatsState>({
    top10: [],
    favoriteBook: null,
    devoteeOfWeek: null,
    chartData: [],
    trend: 0,
  });

  // Fetch available weeks
  useEffect(() => {
    async function fetchWeeks() {
      const { data } = await supabase
        .from('sadhna_report_view')
        .select('formatted_weekly')
        .order('formatted_weekly', { ascending: false });

      if (data) {
        const uniqueWeeks = Array.from(new Set(data.map(item => item.formatted_weekly)));
        setWeeks(uniqueWeeks);
        // Select the most recent week by default
        setSelectedWeeks([uniqueWeeks[0]]);
      }
    }
    fetchWeeks();
  }, []);

  // Fetch chart data and statistics when selected weeks change
  useEffect(() => {
    async function fetchData() {
      if (selectedWeeks.length === 0) return;

      const { data, error } = await supabase
        .from('sadhna_report_view')
        .select('*')
        .in('formatted_weekly', selectedWeeks)
        .order('formatted_weekly', { ascending: true });

      if (data) {
        // Process data for stacked bar chart
        const devoteeScores: { [key: string]: { [key: string]: number } } = {};
        
        data.forEach(record => {
          if (!devoteeScores[record.devotee_name]) {
            devoteeScores[record.devotee_name] = {};
          }
          if (!devoteeScores[record.devotee_name][record.formatted_weekly]) {
            devoteeScores[record.devotee_name][record.formatted_weekly] = 0;
          }
          devoteeScores[record.devotee_name][record.formatted_weekly] += record.total_score;
        });

        // Transform data for Recharts
        const chartData = Object.keys(devoteeScores)
          .map(devotee => ({
            name: devotee,
            ...selectedWeeks.reduce((acc, week) => ({
              ...acc,
              [week]: devoteeScores[devotee][week] || 0
            }), {})
          }))
          .sort((a, b) => {
            const totalA = selectedWeeks.reduce((sum, week) => 
              sum + ((a as ChartDataItem)[week] as number || 0), 0);
            const totalB = selectedWeeks.reduce((sum, week) => 
              sum + ((b as ChartDataItem)[week] as number || 0), 0);
            return totalB - totalA;
          })
          .slice(0, 10); // Show only top 10 devotees in chart

        // Calculate top 10 devotees
        const devoteeTotal: { [key: string]: number } = {};
        data.forEach(record => {
          if (!devoteeTotal[record.devotee_name]) {
            devoteeTotal[record.devotee_name] = 0;
          }
          devoteeTotal[record.devotee_name] += record.total_score;
        });

        const top10 = Object.entries(devoteeTotal)
          .map(([devotee_name, total_score]) => ({ devotee_name, total_score }))
          .sort((a, b) => b.total_score - a.total_score)
          .slice(0, 10);

        // Calculate most read book
        const bookCounts: { [key: string]: number } = {};
        data.forEach(record => {
          if (record.book_name) {
            bookCounts[record.book_name] = (bookCounts[record.book_name] || 0) + 1;
          }
        });

        const favoriteBook = Object.entries(bookCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([book_name, read_count]) => ({ book_name, read_count }))[0] || null;

        // Get devotee of the week (highest scorer)
        const devoteeOfWeek = top10[0] || null;

        // Calculate trend (compare with previous week)
        const currentWeek = selectedWeeks[0];
        const previousWeek = selectedWeeks[1];
        let trend = 0;

        if (currentWeek && previousWeek) {
          const currentTotal = data
            .filter(record => record.formatted_weekly === currentWeek)
            .reduce((sum, record) => sum + record.total_score, 0);
          
          const previousTotal = data
            .filter(record => record.formatted_weekly === previousWeek)
            .reduce((sum, record) => sum + record.total_score, 0);

          trend = previousTotal ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
        }

        setWeeklyData(prev => ({
          ...prev,
          chartData,
          top10: Object.entries(devoteeTotal)
            .map(([devotee_name, total_score]) => ({ devotee_name, total_score }))
            .sort((a, b) => b.total_score - a.total_score)
            .slice(0, 10),
          favoriteBook,
          devoteeOfWeek: Object.entries(devoteeTotal)
            .map(([devotee_name, total_score]) => ({ devotee_name, total_score }))
            .sort((a, b) => b.total_score - a.total_score)[0] || null,
          trend
        }));
      }
    }

    fetchData();
  }, [selectedWeeks]);

  // Generate colors for bars
  const getBarColor = (index: number) => {
    const colors = [
      { light: '#c084fc', dark: '#8b5cf6' }, // Purple
      { light: '#f472b6', dark: '#ec4899' }, // Pink
      { light: '#22d3ee', dark: '#06b6d4' }, // Cyan
      { light: '#34d399', dark: '#10b981' }, // Emerald
      { light: '#fbbf24', dark: '#f59e0b' }, // Amber
      { light: '#818cf8', dark: '#6366f1' }, // Indigo
      { light: '#f87171', dark: '#ef4444' }, // Red
      { light: '#a3e635', dark: '#84cc16' }, // Lime
      { light: '#2dd4bf', dark: '#14b8a6' }, // Teal
      { light: '#fb923c', dark: '#f97316' }, // Orange
    ];
    return colors[index % colors.length];
  };

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/80 p-3 rounded-lg shadow-lg border border-white/10">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.fill }}
              />
              <span>{entry.name}: {entry.value}</span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-white/10 text-sm">
            Total: {payload.reduce((sum: number, entry: any) => sum + entry.value, 0)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden backdrop-blur-[2px] bg-background/30 border-muted/40 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-primary/5 to-background/5" />
        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Weekly Progress
            </CardTitle>
            <CardDescription>
              <div className="text-sm text-muted-foreground leading-relaxed">
                <div className="flex flex-wrap gap-2">
                  {weeks.map((week) => (
                    <Badge
                      key={week}
                      variant={selectedWeeks.includes(week) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => {
                        setSelectedWeeks(prev => 
                          prev.includes(week) 
                            ? prev.filter(w => w !== week)
                            : [...prev, week]
                        );
                      }}
                    >
                      {week}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-8">
          {/* Chart Section */}
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyData.chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <defs>
                  {selectedWeeks.map((week, index) => (
                    <linearGradient key={week} id={`gradient${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={getBarColor(index).light} />
                      <stop offset="100%" stopColor={getBarColor(index).dark} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={70}
                  tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.7 }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.7 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                {selectedWeeks.map((week, index) => (
                  <Bar
                    key={week}
                    dataKey={week}
                    stackId="a"
                    fill={`url(#gradient${index})`}
                    radius={index === selectedWeeks.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GradientBentoCard
              icon="🏆"
              title="Top Performer"
              gradient="linear-gradient(135deg, #FFD700, #FFA500)"
              value={
                <div className="text-sm font-medium">
                  {weeklyData.devoteeOfWeek?.devotee_name || "N/A"}
                </div>
              }
            >
              <div className="text-xs text-muted-foreground mt-1">
                Score: {weeklyData.devoteeOfWeek?.total_score || 0}
              </div>
            </GradientBentoCard>

            <GradientBentoCard
              icon="📚"
              title="Most Read Book"
              gradient="linear-gradient(135deg, #4ECDC4, #556270)"
              value={
                <div className="text-sm font-medium truncate">
                  {weeklyData.favoriteBook?.book_name || "N/A"}
                </div>
              }
            >
              <div className="text-xs text-muted-foreground mt-1">
                Read {weeklyData.favoriteBook?.read_count || 0} times
              </div>
            </GradientBentoCard>

            <GradientBentoCard
              icon={weeklyData.trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              title="Weekly Trend"
              gradient={weeklyData.trend > 0 
                ? "linear-gradient(135deg, #A8E6CF, #3EECAC)"
                : "linear-gradient(135deg, #FF6B6B, #FFE66D)"}
              value={
                <div className="text-sm font-medium">
                  {weeklyData.trend > 0 ? "+" : ""}{weeklyData.trend.toFixed(1)}%
                </div>
              }
            >
              <div className="text-xs text-muted-foreground mt-1">
                Compared to last week
              </div>
            </GradientBentoCard>
          </div>

          {/* Top 10 Table */}
          <Card className="backdrop-blur-[2px] bg-background/30 border-muted/40">
            <CardHeader>
              <CardTitle className="text-sm font-medium">🏆 Top 10 Devotees</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Devotee</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeklyData.top10.map((devotee, index) => (
                    <TableRow key={devotee.devotee_name}>
                      <TableCell className="font-medium">#{index + 1}</TableCell>
                      <TableCell>{devotee.devotee_name}</TableCell>
                      <TableCell className="text-right">{devotee.total_score}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Quote Section */}
      <blockquote className="relative my-6 border-l-4 pl-4 italic text-muted-foreground">
        <div className="absolute -left-3 -top-3 text-4xl text-muted-foreground/20">"</div>
        <p className="relative z-10">
          The more one makes advancement in Kṛṣṇa consciousness, the more he becomes convinced of the truth of the 
          scriptures and the truth of the science of God.
        </p>
        <footer className="mt-2 text-sm font-medium">
          — Srila Prabhupada (Bhagavad-gita As It Is, 9.2 Purport)
        </footer>
      </blockquote>
    </div>
  );
}
