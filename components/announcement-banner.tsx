"use client";

import { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(false);

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="relative overflow-hidden z-50"
        >
          <div className="relative bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white px-4 py-2.5">
            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.08)_50%,transparent_100%)] bg-[length:200%_100%] animate-[shimmer_2.5s_infinite_linear]" />

            <div className="flex items-center justify-center gap-3 text-sm font-medium pr-8">
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <Sparkles className="h-4 w-4 shrink-0 text-yellow-300" />
              </motion.span>

              <div className="overflow-hidden">
                <motion.p
                  className="whitespace-nowrap"
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{
                    repeat: Infinity,
                    duration: 20,
                    ease: "linear",
                  }}
                >
                  <span className="font-bold text-yellow-300">Vernium</span> is coming soon 🔥 — A new Daily Sadhna Chart submission dashboard with enhanced accessibility for physically disabled users, AI integration with&nbsp;
                  <span className="font-bold text-yellow-300">OpenClaw</span> &amp; MCP support — speak to fill your Sadhna chart automatically&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <span className="font-bold text-yellow-300">Vernium</span> is coming soon 🔥 — A new Daily Sadhna Chart submission dashboard with enhanced accessibility for physically disabled users, AI integration with&nbsp;
                  <span className="font-bold text-yellow-300">OpenClaw</span> &amp; MCP support — speak to fill your Sadhna chart automatically
                </motion.p>
              </div>

              <motion.span
                animate={{ rotate: [0, -15, 15, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 1 }}
              >
                <Sparkles className="h-4 w-4 shrink-0 text-yellow-300" />
              </motion.span>
            </div>

            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss banner"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
