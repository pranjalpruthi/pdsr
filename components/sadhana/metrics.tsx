"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { Loader2, TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as Collapsible from '@radix-ui/react-collapsible';

interface Metrics {
  reportsThisWeek: number;
  totalDevotees: number;
  devoteesNeedingAttention: number;
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

export function SadhanaMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

        const [reportsResponse, devoteesResponse, intermediateResponse] = await Promise.all([
          supabase
            .from('sadhna_report')
            .select('*', { count: 'exact' })
            .gte('date', startOfWeek.toISOString()),
          supabase
            .from('devotees')
            .select('*', { count: 'exact' }),
          supabase
            .from('sadhna_report')
            .select('devotee_id, total_score')
            .gt('total_score', 0)
            .lt('total_score', 50)
        ]);

        setMetrics({
          reportsThisWeek: reportsResponse.count || 0,
          totalDevotees: devoteesResponse.count || 0,
          devoteesNeedingAttention: intermediateResponse.data?.length || 0,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

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
        <motion.div variants={item}>
          <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 px-4 sm:px-6 py-2 hover:shadow-lg transition-all hover:scale-105">
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

        {/* Total Devotees */}
        <motion.div variants={item}>
          <div className="rounded-full bg-green-100 dark:bg-green-900/20 px-4 sm:px-6 py-2 hover:shadow-lg transition-all hover:scale-105">
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

        {/* Devotees Needing Attention */}
        <motion.div variants={item}>
          <div className="rounded-full bg-amber-100 dark:bg-amber-900/20 px-4 sm:px-6 py-2 hover:shadow-lg transition-all hover:scale-105">
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
      </motion.div>
    </div>
  );
}