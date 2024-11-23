"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase/client"
import { Sparklines, SparklinesLine } from "react-sparklines"
import { BookOpen, Headphones, HeartHandshake, BarChart3 } from "lucide-react"
import { GradientBentoCard } from "@/components/ui/gradient-bento-card"

interface ActivityData {
  date: string
  japa_score: number
  book_score: number
  lecture_score: number
  seva_score: number
  total_score: number
  devotee_name: string
}

interface ChartConfig {
  [key: string]: {
    label: string
    color: string
  }
}

export function DailyStats() {
  const [chartData, setChartData] = React.useState<ActivityData[]>([])
  const [devotees, setDevotees] = React.useState<string[]>([])
  const [selectedDevotee, setSelectedDevotee] = React.useState<string>("")
  const [totalScore, setTotalScore] = React.useState<number>(0)

  // Fetch devotees for dropdown
  React.useEffect(() => {
    async function fetchDevotees() {
      const { data } = await supabase
        .from('sadhna_report_view')
        .select('devotee_name')
        .order('devotee_name')

      if (data) {
        const uniqueDevotees = Array.from(new Set(data.map(item => item.devotee_name)))
        setDevotees(uniqueDevotees)
        if (uniqueDevotees.length > 0) {
          setSelectedDevotee(uniqueDevotees[0])
        }
      }
    }
    fetchDevotees()
  }, [])

  // Fetch daily data when devotee is selected
  React.useEffect(() => {
    async function fetchDailyData() {
      if (!selectedDevotee) return

      const { data } = await supabase
        .from('sadhna_report_view')
        .select('*')
        .eq('devotee_name', selectedDevotee)
        .order('date', { ascending: true })
        .limit(30)

      if (data) {
        const formattedData = data.map(item => ({
          date: item.date,
          japa_score: Number(item.score_a) || 0,
          book_score: Number(item.score_b) || 0,
          lecture_score: Number(item.score_c) || 0,
          seva_score: Number(item.score_d) || 0,
          total_score: Number(item.total_score) || 0,
          devotee_name: item.devotee_name
        }))

        setChartData(formattedData)
        setTotalScore(formattedData.reduce((acc, curr) => acc + curr.total_score, 0))
      }
    }

    fetchDailyData()
  }, [selectedDevotee])

  const chartConfig: ChartConfig = {
    score: {
      label: "Daily Score",
      color: "hsl(var(--primary))"
    }
  }

  const activityCards = [
    {
      title: "Japa Score",
      icon: "📿",
      dataKey: "japa_score",
      maxScore: 25,
      gradient: "linear-gradient(135deg, #FF6B6B, #FFE66D)",
    },
    {
      title: "Book Reading",
      icon: <BookOpen className="h-4 w-4" />,
      dataKey: "book_score",
      maxScore: 30,
      gradient: "linear-gradient(135deg, #4ECDC4, #556270)",
    },
    {
      title: "Lecture Listening",
      icon: <Headphones className="h-4 w-4" />,
      dataKey: "lecture_score",
      maxScore: 30,
      gradient: "linear-gradient(135deg, #A8E6CF, #3EECAC)",
    },
    {
      title: "Seva Activities",
      icon: <HeartHandshake className="h-4 w-4" />,
      dataKey: "seva_score",
      maxScore: 15,
      gradient: "linear-gradient(135deg, #FFD93D, #FF6B6B)",
    },
  ]

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden backdrop-blur-[2px] bg-background/30 border-muted/40 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-primary/5 to-background/5" />
        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Daily Progress
            </CardTitle>
            <CardDescription>Track daily sadhana scores</CardDescription>
          </div>
          <Select
            value={selectedDevotee}
            onValueChange={setSelectedDevotee}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select devotee" />
            </SelectTrigger>
            <SelectContent>
              {devotees.map((devotee) => (
                <SelectItem key={devotee} value={devotee}>
                  {devotee}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="relative">
          <div className="mt-3 flex flex-col">
            <div className="flex items-center gap-4 pb-4">
              <div className="flex-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Total Score
                </div>
                <div className="text-2xl font-bold">
                  {totalScore.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 10,
                    left: 10,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#FF6B6B" />
                      <stop offset="50%" stopColor="#4ECDC4" />
                      <stop offset="100%" stopColor="#FFE66D" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                    opacity={0.1}
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Date
                                </span>
                                <span className="font-bold">
                                  {new Date(label).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Score
                                </span>
                                <span className="font-bold">
                                  {payload[0].value}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total_score"
                    stroke="url(#scoreGradient)"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{
                      r: 6,
                      style: { fill: "#4ECDC4" }
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <blockquote className="relative my-6 border-l-4 pl-4 italic text-muted-foreground">
        <div className="absolute -left-3 -top-3 text-4xl text-muted-foreground/20">"</div>
        <p className="relative z-10">
          One should be enthusiastic about his personal spiritual progress and should be eager to have it daily. 
          Just like a businessman is eager to check his daily profit and loss account, you should be eager to check 
          your spiritual progress daily.
        </p>
        <footer className="mt-2 text-sm font-medium">
          — Srila Prabhupada (Letter to Hamsaduta, 1st October, 1968)
        </footer>
      </blockquote>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {activityCards.map((activity) => (
          <GradientBentoCard
            key={activity.title}
            className="backdrop-blur-[2px] bg-background/30 border-muted/40 shadow-lg hover:shadow-xl transition-all"
            icon={activity.icon}
            title={activity.title}
            gradient={activity.gradient}
            value={
              <div className="text-sm font-medium">
                {chartData.length > 0 && chartData[chartData.length - 1]
                  ? `${chartData[chartData.length - 1][activity.dataKey as keyof ActivityData]}/${activity.maxScore}`
                  : `0/${activity.maxScore}`}
              </div>
            }
          >
            <div className="h-[50px]">
              {chartData.length > 0 && (
                <Sparklines
                  data={chartData.map(d => Number(d[activity.dataKey as keyof ActivityData]) || 0)}
                  width={100}
                  height={50}
                >
                  <SparklinesLine color="currentColor" />
                </Sparklines>
              )}
            </div>
          </GradientBentoCard>
        ))}
      </div>
    </div>
  )
}