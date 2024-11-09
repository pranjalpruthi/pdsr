"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";

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

interface WeeklyStatsState {
  top10: DevoteeStats[];
  favoriteBook: { book_name: string; read_count: number; } | null;
  devoteeOfWeek: DevoteeStats | null;
  chartData: any;
  trend: number;
}

export function WeeklyStats() {
  const [weeks, setWeeks] = useState<string[]>([]);
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyStatsState>({
    top10: [],
    favoriteBook: null,
    devoteeOfWeek: null,
    chartData: {},
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
        .in('formatted_weekly', selectedWeeks);

      if (data) {
        // Process data for chart
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

        // Prepare ECharts option
        const option = {
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            }
          },
          legend: {
            data: selectedWeeks
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
            axisLabel: {
              interval: 0,
              rotate: 30
            }
          },
          yAxis: {
            type: 'value'
          },
          series: selectedWeeks.map(week => ({
            name: week,
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: Object.keys(devoteeScores).map(devotee => 
              devoteeScores[devotee][week] || 0
            )
          }))
        };

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
          chartData: option,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>🏅 Weekly Statistics</CardTitle>
        <CardDescription className="space-y-4">
          <span className="block text-sm">Select Weeks for Comparison</span>
          <div className="flex flex-wrap gap-2">
            {weeks.map((week) => (
              <Badge
                key={week}
                variant={selectedWeeks.includes(week) ? "default" : "outline"}
                className="cursor-pointer"
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
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Weekly Chart - Removed Card wrapper */}
        <div className="h-[400px] w-full">
          {weeklyData.chartData.series && (
            <ReactECharts
              option={{
                ...weeklyData.chartData,
                grid: {
                  top: '10%',
                  right: '3%',
                  bottom: '15%',
                  left: '3%',
                  containLabel: true
                }
              }}
              style={{ height: '100%', width: '100%' }}
              theme="dark"
            />
          )}
        </div>

        {/* Top 10 Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">🏆 Top 10 Devotees</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Devotee</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weeklyData.top10.map((devotee, index) => (
                  <TableRow key={devotee.devotee_name}>
                    <TableCell>{devotee.devotee_name}</TableCell>
                    <TableCell className="text-right">{devotee.total_score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📚 Most Read Book</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeklyData.favoriteBook?.book_name}</div>
              <div className="text-sm text-muted-foreground">
                Read {weeklyData.favoriteBook?.read_count} times this week
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">🌟 Devotee of the Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeklyData.devoteeOfWeek?.devotee_name}</div>
              <p className="text-xs text-muted-foreground">
                Score: {weeklyData.devoteeOfWeek?.total_score}
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {weeklyData.trend > 0 ? (
            <>
              Trending up by {weeklyData.trend.toFixed(1)}% this week{" "}
              <TrendingUp className="h-4 w-4 text-green-500" />
            </>
          ) : (
            <>
              Trending down by {Math.abs(weeklyData.trend).toFixed(1)}% this week{" "}
              <TrendingDown className="h-4 w-4 text-red-500" />
            </>
          )}
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total scores for top 10 devotees
        </div>
      </CardFooter>
    </Card>
  );
}
