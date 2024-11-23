"use client";

import { Suspense, useState, useCallback } from "react";
import { SadhanaMetrics } from "@/components/sadhana/metrics";
import { SadhanaForm } from "@/components/sadhana/form";
import { WeeklyStats } from "@/components/sadhana/weekly-stats";
import { MonthlyStats } from "@/components/sadhana/monthly-stats";
import { SadhanaDataTable } from "@/components/sadhana/data-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManageSection } from "@/components/sadhana/manage";
import { motion } from "framer-motion";
import ModeToggle from "@/components/mode-toggle";
import Image from "next/image";
import { ChantingVideos } from "@/components/sadhana/chanting-videos";
import { Leaderboard } from "@/components/sadhana/leaderboard";
import { DailyStats } from "@/components/sadhana/daily-stats";
import { LayoutDashboard, ChartBar, ClipboardList, Trophy, Settings } from "lucide-react";

export default function Home() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  // Add state for active tab
  const [activeTab, setActiveTab] = useState("overview");

  // Add callback for tab navigation
  const navigateToTab = useCallback((tabValue: string) => {
    setActiveTab(tabValue);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden pb-16 md:pb-0">
      {/* Background Image positioned on right edge */}
      <div className="fixed right-0 top-0 h-full w-1/3 -z-10">
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-background" />
        <Image
          src="/assets/krishna-min.jpg"
          alt="Krishna Background"
          fill
          className="object-cover object-center opacity-40 dark:opacity-20"
          priority
          quality={100}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 space-y-6 lg:space-y-8 relative">
        {/* Glass Effect Container */}
        <div 
          className="absolute inset-0 backdrop-blur-sm bg-background/40 
                     dark:bg-background/30 -z-[5] rounded-xl 
                     border border-white/10 dark:border-white/5"
        />
        
        {/* Mode Toggle */}
        <ModeToggle />

        {/* Header Section - Centered */}
        <motion.div 
          className="space-y-4 text-center relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="flex items-center justify-center gap-2"
            variants={itemVariants}
          >
            <img 
              src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Writing%20Hand%20Light%20Skin%20Tone.png" 
              alt="Writing Hand" 
              width="55" 
              height="55"
              className="inline-block"
            />

            <motion.h1 
              className="text-3xl md:text-4xl font-bold tracking-tight"
              variants={itemVariants}
            >
              Daily Sadhana Report
            </motion.h1>
            <img 
              src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People%20with%20professions/Health%20Worker%20Light%20Skin%20Tone.png" 
              alt="Health Worker Light Skin Tone" 
              width="55" 
              height="55"
              className="inline-block"
            />
          </motion.div>

          <motion.div 
            className="flex justify-center gap-2 items-center"
            variants={itemVariants}
          >
            <Badge variant="secondary" className="text-xs md:text-sm">
            v0.0.6 - 🌺 Madhumangala Stage 🌺 [prabhu-edition]
            </Badge>
            
            {/* Operational Status Badge */}
            <Badge 
              variant="secondary" 
              className="text-xs md:text-sm flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/50"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              System Operational
            </Badge>
          </motion.div>

          <motion.div 
            className="text-xl md:text-2xl font-semibold text-muted-foreground"
            variants={itemVariants}
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              💐 Hare Kṛṣṇa Prabhus, Daṇḍavat Praṇāma 🙇🏻‍♂️, Jaya Śrīla Prabhupāda! 🙌
            </motion.span>
          </motion.div>
          
          <motion.div 
            className="flex justify-center"
            variants={itemVariants}
          >
            <Badge variant="secondary" className="text-sm px-4 py-2">
              🫡 Kindly fill this 📝 Hare Krishna DSR before ⏰12 Midnight 🌏 KST
            </Badge>
          </motion.div>
        </motion.div>

        {/* Main Content Tabs - Centered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="relative z-10"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Desktop Navigation */}
            <div className="hidden md:flex justify-center">
              <TabsList className="grid w-full grid-cols-5 max-w-[600px] bg-white/10 dark:bg-black/10 backdrop-blur-md">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
                <TabsTrigger value="records">Records</TabsTrigger>
                <TabsTrigger value="leaderboard" className="relative">
                  Leaderboard
                  <span className="absolute -top-2 -right-2 flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-pink-500 items-center justify-center text-[10px] text-white font-medium">
                      New
                    </span>
                  </span>
                </TabsTrigger>
                <TabsTrigger value="manage">Manage</TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab - Side by Side Layout */}
            <TabsContent value="overview" className="space-y-8">
              {/* Metrics Section */}
              <div className="w-full">
                <Suspense 
                  fallback={
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {[...Array(3)].map((_, i) => (
                        <Card key={i} className="animate-pulse h-[120px]" />
                      ))}
                    </div>
                  }
                >
                  <SadhanaMetrics />
                </Suspense>
              </div>
              
              {/* Form and Videos Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Section */}
                <div className="w-full">
                  <SadhanaForm onNavigateToRecords={() => navigateToTab("records")} />
                </div>

                {/* Chanting Videos Section */}
                <div className="w-full space-y-4">
                  <Suspense
                    fallback={
                      <Card className="h-[400px] animate-pulse" />
                    }
                  >
                    <ChantingVideos />
                  </Suspense>
                </div>
              </div>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="stats">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <Suspense fallback={<Card className="h-[400px] animate-pulse" />}>
                    <DailyStats />
                  </Suspense>
                  <Suspense fallback={<Card className="h-[400px] animate-pulse" />}>
                    <WeeklyStats />
                  </Suspense>
                  <Suspense fallback={<Card className="h-[400px] animate-pulse" />}>
                    <MonthlyStats />
                  </Suspense>
                </div>
              </div>
            </TabsContent>

            {/* Records Tab */}
            <TabsContent value="records">
              <div className="space-y-4">
                <Suspense 
                  fallback={
                    <Card className="h-[400px] animate-pulse" />
                  }
                >
                  <SadhanaDataTable />
                </Suspense>
              </div>
            </TabsContent>

            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard">
              <div className="space-y-4">
                <div className="flex justify-center gap-2 items-center">
                  <Badge variant="secondary" className="text-xs md:text-sm">
                    🏆 Top Devotees
                  </Badge>
                  <Badge 
                    variant="secondary" 
                    className="text-xs md:text-sm flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200/50"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    Updates Every 24 Hours
                  </Badge>
                  <Badge 
                    variant="secondary" 
                    className="text-xs md:text-sm bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400"
                  >
                    Season 1 Active
                  </Badge>
                </div>
                <Suspense fallback={<Card className="h-[400px] animate-pulse" />}>
                  <Leaderboard />
                </Suspense>
              </div>
            </TabsContent>

            {/* Manage Tab */}
            <TabsContent value="manage">
              <div className="space-y-4">
                <Suspense 
                  fallback={
                    <Card className="h-[400px] animate-pulse" />
                  }
                >
                  <ManageSection />
                </Suspense>
              </div>
            </TabsContent>

            {/* Mobile Navigation - Now inside Tabs component */}
            <div className="fixed bottom-0 left-0 right-0 md:hidden bg-background/80 backdrop-blur-lg border-t z-50">
              <nav className="flex justify-around items-center h-16">
                <TabsList className="grid grid-cols-5 w-full h-full bg-transparent border-none">
                  <TabsTrigger 
                    value="overview" 
                    className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-transparent"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Overview</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="stats" 
                    className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-transparent"
                  >
                    <ChartBar className="h-4 w-4" />
                    <span>Stats</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="records" 
                    className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-transparent"
                  >
                    <ClipboardList className="h-4 w-4" />
                    <span>Records</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="leaderboard" 
                    className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-transparent relative"
                  >
                    <Trophy className="h-4 w-4" />
                    <span>Leaders</span>
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="manage" 
                    className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-transparent"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Manage</span>
                  </TabsTrigger>
                </TabsList>
              </nav>
            </div>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
