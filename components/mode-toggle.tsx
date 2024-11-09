"use client"

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function ModeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="fixed top-4 left-4 sm:top-6 sm:left-6 z-[100]"
        >
            <div className="absolute inset-0 pointer-events-none">
                <div className={`
                    absolute -inset-3 rounded-full blur-3xl
                    animate-pulse-glow opacity-75
                    ${theme === "dark" 
                        ? "bg-amber-500/50" 
                        : "bg-yellow-300/60"
                    }
                `} />
                <div className={`
                    absolute -inset-2 rounded-full blur-2xl
                    animate-pulse-glow-fast opacity-60
                    ${theme === "dark" 
                        ? "bg-amber-400/40" 
                        : "bg-yellow-200/50"
                    }
                `} />
                <div className={`
                    absolute -inset-1 rounded-full blur-xl
                    animate-pulse-slow opacity-50
                    ${theme === "dark" 
                        ? "bg-amber-300/30" 
                        : "bg-yellow-100/40"
                    }
                `} />
            </div>
            <Button 
                variant="ghost" 
                onClick={toggleTheme}
                onPointerDown={() => setIsPressed(true)}
                onPointerUp={() => setIsPressed(false)}
                onPointerLeave={() => setIsPressed(false)}
                className={`
                    rounded-full p-0 overflow-hidden
                    transition-all duration-300
                    w-14 h-14 sm:w-20 sm:h-20
                    hover:shadow-lg hover:shadow-amber-200/20
                    active:scale-95 relative
                    ${theme === "dark" 
                        ? "bg-zinc-900/90 border border-zinc-800" 
                        : "bg-white/90 border border-zinc-200"
                    }
                `}
            >
                <motion.div
                    whileHover={{ scale: 1.1, rotate: 12 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="relative"
                >
                    <Image
                        src="/assets/iskmj.jpg"
                        alt="ISKM Logo"
                        width={85}
                        height={85}
                        className="rounded-full object-cover w-14 h-14 sm:w-20 sm:h-20"
                        priority
                    />
                    
                    {/* Text Overlay on Press */}
                    <AnimatePresence>
                        {isPressed && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                                className={`
                                    absolute inset-0 flex items-center justify-center
                                    rounded-full backdrop-blur-sm
                                    ${theme === "dark" 
                                        ? "bg-zinc-900/80" 
                                        : "bg-white/80"
                                    }
                                `}
                            >
                                <span className={`
                                    text-sm font-medium
                                    ${theme === "dark" 
                                        ? "text-zinc-200" 
                                        : "text-zinc-800"
                                    }
                                `}>
                                    Switch to {theme === "dark" ? "Light" : "Dark"}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
                <span className="sr-only">
                    Switch to {theme === "dark" ? "light" : "dark"} mode
                </span>
            </Button>
        </motion.div>
    );
}
