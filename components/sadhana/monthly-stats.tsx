"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, CalendarDays } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";
import { GradientBentoCard } from "@/components/ui/gradient-bento-card";

interface MonthlyStatsData {
  devotee_name: string;
  total_score: number;
  book_name: string;
  read_count: number;
}

export function MonthlyStats() {
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [monthlyData, setMonthlyData] = useState<{
    top10: MonthlyStatsData[];
    favoriteBook: { book_name: string; read_count: number } | null;
    devoteeOfMonth: MonthlyStatsData | null;
    chartData: any;
    trend: number;
    intermediateDevotees: MonthlyStatsData[];
  }>({
    top10: [],
    favoriteBook: null,
    devoteeOfMonth: null,
    chartData: {},
    trend: 0,
    intermediateDevotees: []
  });

  // Fetch available months
  useEffect(() => {
    async function fetchMonths() {
      const { data } = await supabase
        .from('sadhna_report_view')
        .select('formatted_monthly')
        .order('formatted_monthly', { ascending: false });

      if (data) {
        const uniqueMonths = Array.from(new Set(data.map(item => item.formatted_monthly)));
        setMonths(uniqueMonths);
        setSelectedMonths([uniqueMonths[0]]);
      }
    }
    fetchMonths();
  }, []);

  // Fetch data when selected months change
  useEffect(() => {
    async function fetchData() {
      if (selectedMonths.length === 0) return;

      const { data, error } = await supabase
        .from('sadhna_report_view')
        .select('*')
        .in('formatted_monthly', selectedMonths);

      if (data) {
        // Process data for chart
        const devoteeScores: { [key: string]: { [key: string]: number } } = {};
        data.forEach(record => {
          if (!devoteeScores[record.devotee_name]) {
            devoteeScores[record.devotee_name] = {};
          }
          if (!devoteeScores[record.devotee_name][record.formatted_monthly]) {
            devoteeScores[record.devotee_name][record.formatted_monthly] = 0;
          }
          devoteeScores[record.devotee_name][record.formatted_monthly] += record.total_score;
        });

        // Calculate top 10
        const devoteeTotal: { [key: string]: number } = {};
        data.forEach(record => {
          if (!devoteeTotal[record.devotee_name]) {
            devoteeTotal[record.devotee_name] = 0;
          }
          devoteeTotal[record.devotee_name] += record.total_score;
        });

        const top10 = Object.entries(devoteeTotal)
          .map(([devotee_name, total_score]) => ({ 
            devotee_name, 
            total_score,
            book_name: '',
            read_count: 0
          }))
          .sort((a, b) => b.total_score - a.total_score)
          .slice(0, 10);

        // Calculate favorite book
        const bookCounts: { [key: string]: number } = {};
        data.forEach(record => {
          if (record.book_name) {
            bookCounts[record.book_name] = (bookCounts[record.book_name] || 0) + 1;
          }
        });

        const favoriteBook = Object.entries(bookCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([book_name, read_count]) => ({ book_name, read_count }))[0] || null;

        // Calculate intermediate devotees
        const intermediateDevotees = Object.entries(devoteeTotal)
          .filter(([_, score]) => score > 0 && score < 50)
          .map(([devotee_name, total_score]) => ({ 
            devotee_name, 
            total_score,
            book_name: '',
            read_count: 0
          }));

        // Prepare chart data
        const option = {
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' }
          },
          legend: {
            data: selectedMonths,
            textStyle: { color: '#fff' }
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: Object.keys(devoteeScores),
            axisLabel: { rotate: 45 }
          },
          yAxis: {
            type: 'value'
          },
          series: selectedMonths.map(month => ({
            name: month,
            type: 'bar',
            stack: 'total',
            data: Object.keys(devoteeScores).map(devotee => 
              devoteeScores[devotee][month] || 0
            )
          }))
        };

        setMonthlyData({
          top10,
          favoriteBook,
          devoteeOfMonth: top10[0] || null,
          chartData: option,
          trend: 0, // Calculate trend if needed
          intermediateDevotees
        });
      }
    }

    fetchData();
  }, [selectedMonths]);

  // Generate colors for bars
  const getBarColor = (index: number) => {
    const colors = [
      { light: '#c084fc', dark: '#8b5cf6' }, // Purple
      { light: '#f472b6', dark: '#ec4899' }, // Pink
      { light: '#22d3ee', dark: '#06b6d4' }, // Cyan
      { light: '#34d399', dark: '#10b981' }, // Emerald
    ];
    return colors[index % colors.length];
  };

  // Custom tooltip
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
              <CalendarDays className="h-5 w-5 text-primary" />
              Monthly Progress
            </CardTitle>
            <CardDescription>
              <div className="flex flex-wrap gap-2">
                {months.map((month) => (
                  <Badge
                    key={month}
                    variant={selectedMonths.includes(month) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => {
                      setSelectedMonths(prev => 
                        prev.includes(month) 
                          ? prev.filter(m => m !== month)
                          : [...prev, month]
                      );
                    }}
                  >
                    {month}
                  </Badge>
                ))}
              </div>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-8">
          {/* Chart Section */}
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData.top10}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <defs>
                  {selectedMonths.map((month, index) => (
                    <linearGradient key={month} id={`gradient${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={getBarColor(index).light} />
                      <stop offset="100%" stopColor={getBarColor(index).dark} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                <XAxis
                  dataKey="devotee_name"
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
                {selectedMonths.map((month, index) => (
                  <Bar
                    key={month}
                    dataKey="total_score"
                    name={month}
                    stackId="a"
                    fill={`url(#gradient${index})`}
                    radius={[4, 4, 0, 0]}
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
                  {monthlyData.devoteeOfMonth?.devotee_name || "N/A"}
                </div>
              }
            >
              <div className="text-xs text-muted-foreground mt-1">
                Score: {monthlyData.devoteeOfMonth?.total_score || 0}
              </div>
            </GradientBentoCard>

            <GradientBentoCard
              icon="📚"
              title="Most Read Book"
              gradient="linear-gradient(135deg, #4ECDC4, #556270)"
              value={
                <div className="text-sm font-medium truncate">
                  {monthlyData.favoriteBook?.book_name || "N/A"}
                </div>
              }
            >
              <div className="text-xs text-muted-foreground mt-1">
                Read {monthlyData.favoriteBook?.read_count || 0} times
              </div>
            </GradientBentoCard>

            <GradientBentoCard
              icon="🧘‍♂️"
              title="Guidance Required"
              gradient="linear-gradient(135deg, #FF6B6B, #FFE66D)"
              value={
                <div className="text-sm font-medium">
                  {monthlyData.intermediateDevotees.length} Devotees
                </div>
              }
            >
              <div className="text-xs text-muted-foreground mt-1">
                Score below 50
              </div>
            </GradientBentoCard>
          </div>

          {/* Tables Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {monthlyData.top10.map((devotee, index) => (
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

            <Card className="backdrop-blur-[2px] bg-background/30 border-muted/40">
              <CardHeader>
                <CardTitle className="text-sm font-medium">🧘‍♂️ Devotees Requiring Guidance</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Devotee</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyData.intermediateDevotees.map((devotee) => (
                      <TableRow key={devotee.devotee_name}>
                        <TableCell>{devotee.devotee_name}</TableCell>
                        <TableCell className="text-right">{devotee.total_score}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Quote Section */}
      <blockquote className="relative my-6 border-l-4 pl-4 italic text-muted-foreground">
        <div className="absolute -left-3 -top-3 text-4xl text-muted-foreground/20">"</div>
        <p className="relative z-10">
          One should practice Krishna consciousness very seriously, month after month, and should not waste a 
          single moment of this human form of life.
        </p>
        <footer className="mt-2 text-sm font-medium">
          — Srila Prabhupada (Srimad-Bhagavatam 4.29.5, Purport)
        </footer>
      </blockquote>
    </div>
  );
}