import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

export function useVideoFeed() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [page, setPage] = useState(0);

  const { data: videos, isLoading, error } = useQuery({
    queryKey: ["/api/videos", page],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const nextVideo = useCallback(() => {
    if (videos && currentIndex < videos.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (videos && currentIndex === videos.length - 1) {
      // Load more videos
      setPage(prev => prev + 1);
    }
  }, [currentIndex, videos]);

  const previousVideo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const goToVideo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const currentVideo = videos?.[currentIndex];

  return {
    videos,
    currentVideo,
    currentIndex,
    isLoading,
    error,
    nextVideo,
    previousVideo,
    goToVideo,
  };
}
