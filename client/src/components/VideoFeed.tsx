import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import VideoPlayer from "./VideoPlayer";
import CommentsDrawer from "./CommentsDrawer";
import GiftModal from "./GiftModal";
import UploadModal from "./UploadModal";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function VideoFeed() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isDragging = useRef(false);

  const { data: videos, isLoading } = useQuery({
    queryKey: ["/api/videos"],
  });

  const { sendMessage } = useWebSocket((message) => {
    // Handle real-time updates like new comments, gifts, etc.
    console.log("Received WebSocket message:", message);
  });

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      startY.current = e.touches[0].clientY;
      isDragging.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;

      const endY = e.changedTouches[0].clientY;
      const diff = startY.current - endY;

      if (Math.abs(diff) > 50 && videos) {
        if (diff > 0 && currentVideoIndex < videos.length - 1) {
          setCurrentVideoIndex(currentVideoIndex + 1);
        } else if (diff < 0 && currentVideoIndex > 0) {
          setCurrentVideoIndex(currentVideoIndex - 1);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videos) return;
      
      if (e.key === "ArrowDown" && currentVideoIndex < videos.length - 1) {
        setCurrentVideoIndex(currentVideoIndex + 1);
      } else if (e.key === "ArrowUp" && currentVideoIndex > 0) {
        setCurrentVideoIndex(currentVideoIndex - 1);
      }
    };

    const feedElement = feedRef.current;
    if (feedElement) {
      feedElement.addEventListener("touchstart", handleTouchStart, { passive: false });
      feedElement.addEventListener("touchmove", handleTouchMove, { passive: false });
      feedElement.addEventListener("touchend", handleTouchEnd, { passive: false });
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (feedElement) {
        feedElement.removeEventListener("touchstart", handleTouchStart);
        feedElement.removeEventListener("touchmove", handleTouchMove);
        feedElement.removeEventListener("touchend", handleTouchEnd);
      }
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentVideoIndex, videos]);

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">No videos available</h2>
          <p className="text-gray-400">Be the first to upload a video!</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Top Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex justify-between items-center max-w-sm mx-auto">
          <div className="flex space-x-4">
            <button className="text-white/70 text-lg font-medium">Following</button>
            <button className="text-white text-lg font-bold border-b-2 border-pink-500">For You</button>
          </div>
          <div className="flex items-center space-x-3">
            <button className="text-white text-xl">🔍</button>
            <button className="text-white text-xl">☰</button>
          </div>
        </div>
      </div>

      {/* Video Feed */}
      <div
        ref={feedRef}
        className="h-screen overflow-hidden transition-transform duration-300"
        style={{
          transform: `translateY(-${currentVideoIndex * 100}vh)`,
        }}
      >
        {videos.map((video: any, index: number) => (
          <div key={video.id} className="h-screen w-full relative">
            <VideoPlayer
              video={video}
              isActive={index === currentVideoIndex}
              onOpenComments={() => setShowComments(true)}
              onOpenGifts={() => setShowGifts(true)}
              onOpenUpload={() => setShowUpload(true)}
              sendMessage={sendMessage}
            />
          </div>
        ))}
      </div>

      {/* Modals */}
      <CommentsDrawer
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        videoId={videos[currentVideoIndex]?.id}
        sendMessage={sendMessage}
      />

      <GiftModal
        isOpen={showGifts}
        onClose={() => setShowGifts(false)}
        video={videos[currentVideoIndex]}
        sendMessage={sendMessage}
      />

      <UploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
      />
    </>
  );
}
