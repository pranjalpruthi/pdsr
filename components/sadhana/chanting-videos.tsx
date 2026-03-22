"use client";

import { useState, useEffect } from "react";
import { Marquee } from "@/components/ui/marquee";
import { cn } from "@/lib/utils";
import Image from "next/image";

const videos = [
    "https://youtube.com/watch?v=ll_rOl6oZbQ",
    "https://youtube.com/watch?v=yrx2YqyGs-E",
    "https://youtube.com/watch?v=cgXjcaU2TOU",
    "https://youtube.com/watch?v=SFrZd99l7gk",
    "https://youtube.com/watch?v=9f-Aa-2fVqk",
    // ... add more videos as needed
];

interface VideoData {
    url: string;
    videoId: string;
    title: string;
    thumbnail: string;
}

// Helper function to extract video ID from YouTube URL
function extractVideoId(url: string): string {
    if (url.includes('youtu.be/')) {
        return url.split('youtu.be/')[1].split('?')[0];
    }
    if (url.includes('watch?v=')) {
        return url.split('watch?v=')[1].split('&')[0];
    }
    return '';
}

// Normalize YouTube URL to www.youtube.com format for oEmbed
function normalizeYouTubeUrl(url: string): string {
    if (url.includes('youtube.com')) {
        return url.replace('youtube.com', 'www.youtube.com');
    }
    return url;
}

// Fetch video title from YouTube oEmbed API
async function fetchVideoTitle(url: string): Promise<string> {
    try {
        const normalizedUrl = normalizeYouTubeUrl(url);
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(normalizedUrl)}&format=json`;
        const response = await fetch(oembedUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch video title');
        }
        const data = await response.json();
        return data.title || 'Chanting Video';
    } catch (error) {
        console.error('Error fetching video title:', error);
        return 'Chanting Video';
    }
}

const VideoCard = ({
    video,
}: {
    video: VideoData;
}) => {
    const handleClick = () => {
        window.open(video.url, '_blank', 'noopener,noreferrer');
    };

    return (
        <figure
            className={cn(
                "relative w-64 cursor-pointer overflow-hidden rounded-xl border p-4 transition-all hover:scale-105 flex flex-row items-center gap-3",
                // light styles
                "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
                // dark styles
                "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]"
            )}
            onClick={handleClick}
        >
            <figcaption className="text-sm font-medium dark:text-white line-clamp-2 flex-1 min-w-0">
                {video.title}
            </figcaption>
            <div className="relative w-24 h-16 flex-shrink-0 overflow-hidden rounded-lg">
                <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    className="object-cover"
                    unoptimized
                />
            </div>
        </figure>
    );
};

export function ChantingVideos() {
    const [videoData, setVideoData] = useState<VideoData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchVideoData = async () => {
            setIsLoading(true);
            try {
                const data = await Promise.all(
                    videos.map(async (url) => {
                        const videoId = extractVideoId(url);
                        const title = await fetchVideoTitle(url);
                        const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                        return {
                            url,
                            videoId,
                            title,
                            thumbnail,
                        };
                    })
                );
                setVideoData(data);
            } catch (error) {
                console.error('Error fetching video data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchVideoData();
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-center">
                    🎵 Today&apos;s Chanting Inspiration
                </h2>
                <div className="flex gap-4 overflow-hidden">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="h-48 w-64 animate-pulse rounded-xl border bg-gray-200 dark:bg-gray-800"
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-center">
                🎵 Today&apos;s Chanting Inspiration
            </h2>
            
            <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
                <Marquee pauseOnHover className="[--duration:20s]">
                    {videoData.map((video) => (
                        <VideoCard key={video.videoId} video={video} />
                    ))}
                </Marquee>
                <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r"></div>
                <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l"></div>
            </div>
        </div>
    );
}