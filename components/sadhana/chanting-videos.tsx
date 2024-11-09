"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const videos = [
    "https://youtube.com/watch?v=ll_rOl6oZbQ",
    "https://youtube.com/watch?v=yrx2YqyGs-E",
    "https://youtube.com/watch?v=cgXjcaU2TOU",
    "https://youtube.com/watch?v=SFrZd99l7gk",
    "https://youtube.com/watch?v=9f-Aa-2fVqk",
    // ... add more videos as needed
];

export function ChantingVideos() {
    const [currentVideo, setCurrentVideo] = useState(videos[0]);
    
    useEffect(() => {
        const randomVideo = videos[Math.floor(Math.random() * videos.length)];
        setCurrentVideo(randomVideo);
    }, []);

    const videoId = currentVideo.includes('youtu.be') 
        ? currentVideo.split('youtu.be/')[1]
        : currentVideo.split('v=')[1];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
        >
            <h2 className="text-2xl font-semibold text-center">
                🎵 Today&apos;s Chanting Inspiration
            </h2>
            
            <Card className="overflow-hidden">
                <div className="aspect-video">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="Chanting Video"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            </Card>

            <p className="text-center text-muted-foreground">
                New inspiration daily for your japa practice 🙏
            </p>
        </motion.div>
    );
}