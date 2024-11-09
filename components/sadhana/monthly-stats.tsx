"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>🪖 Monthly Statistics</CardTitle>
        <CardDescription>
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium">Select Months for Comparison</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {months.map((month) => (
                  <Badge
                    key={month}
                    variant={selectedMonths.includes(month) ? "default" : "outline"}
                    className="cursor-pointer"
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
            </div>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Monthly Chart - Removed Card wrapper */}
        <div className="h-[400px] w-full">
          {monthlyData.chartData.series && (
            <ReactECharts
              option={{
                ...monthlyData.chartData,
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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">🏆 Top 10 Devotees</CardTitle>
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
                  {monthlyData.top10.map((devotee) => (
                    <TableRow key={devotee.devotee_name}>
                      <TableCell>{devotee.devotee_name}</TableCell>
                      <TableCell className="text-right">{devotee.total_score}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">🧘‍♂️ Devotees Requiring Guidance</CardTitle>
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
  );
}