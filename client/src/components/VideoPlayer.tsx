import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import VideoActions from "./VideoActions";
import LiveGiftSystem from "./LiveGiftSystem";
import SynchronizedReactions from "./SynchronizedReactions";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";

interface VideoPlayerProps {
  video: any;
  isActive: boolean;
  onOpenComments: () => void;
  onOpenGifts: () => void;
  onOpenUpload: () => void;
  sendMessage: (message: any) => void;
}

export default function VideoPlayer({
  video,
  isActive,
  onOpenComments,
  onOpenGifts,
  onOpenUpload,
  sendMessage,
}: VideoPlayerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHearts, setShowHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const { data: likeStatus } = useQuery({
    queryKey: ["/api/videos", video.id, "like-status"],
    enabled: !!user,
  });

  const { data: followStatus } = useQuery({
    queryKey: ["/api/users", video.userId, "follow-status"],
    enabled: !!user && user.id !== video.userId,
  });

  const likeMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/videos/${video.id}/like`),
    onSuccess: (response) => {
      const data = response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/videos", video.id, "like-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      
      if (data.liked) {
        createHeartAnimation();
      }
    },
  });

  const followMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/users/${video.userId}/follow`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", video.userId, "follow-status"] });
    },
  });

  const viewMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/videos/${video.id}/view`),
  });

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
      viewMutation.mutate();
    } else if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const createHeartAnimation = () => {
    const id = Date.now();
    const x = Math.random() * 300 + 50;
    const y = Math.random() * 400 + 200;
    
    setShowHearts(prev => [...prev, { id, x, y }]);
    
    setTimeout(() => {
      setShowHearts(prev => prev.filter(heart => heart.id !== id));
    }, 2000);
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleDoubleClick = () => {
    likeMutation.mutate();
  };

  return (
    <div className="relative w-full h-full bg-black">
      {/* Video Background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src={video.videoUrl}
        loop
        muted
        playsInline
        onClick={handleVideoClick}
        onDoubleClick={handleDoubleClick}
      />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

      {/* Content Layout */}
      <div className="absolute inset-0 flex">
        {/* Left Side - Video Info */}
        <div className="flex-1 flex flex-col justify-end p-4 pb-24 max-w-[calc(100%-80px)]">
          {/* User Info */}
          <div className="flex items-center space-x-3 mb-4">
            <Avatar className="w-12 h-12 border-2 border-white">
              <AvatarImage src={video.user?.profileImageUrl || ""} />
              <AvatarFallback className="bg-gradient-to-r from-pink-500 to-violet-500 text-white">
                {(video.user?.firstName?.[0] || video.user?.username?.[0] || "U").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-white">
                @{video.user?.username || video.user?.firstName}
              </p>
              <p className="text-sm text-white/80">
                {new Date(video.createdAt).toLocaleDateString()}
              </p>
            </div>
            {user?.id !== video.userId && (
              <Button
                size="sm"
                className="bg-pink-500 hover:bg-pink-600 text-white border-0"
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
              >
                {followStatus?.following ? "Following" : "Follow"}
              </Button>
            )}
          </div>

          {/* Video Description */}
          <p className="text-white mb-2 text-sm leading-relaxed line-clamp-3">
            {video.description || video.title}
          </p>

          {/* Music Info */}
          <div className="flex items-center space-x-2 text-white/80 text-sm">
            <Music className="w-4 h-4" />
            <span className="truncate">Original Audio - {video.user?.username}</span>
          </div>
        </div>

        {/* Right Side - Actions */}
        <VideoActions
          video={video}
          isLiked={likeStatus?.liked}
          onLike={() => likeMutation.mutate()}
          onComment={onOpenComments}
          onShare={() => {
            if (navigator.share) {
              navigator.share({
                title: video.title,
                text: video.description,
                url: window.location.href,
              });
            }
          }}
          onGift={onOpenGifts}
          onUpload={onOpenUpload}
          sendMessage={sendMessage}
        />
      </div>

      {/* Live Gift System */}
      <LiveGiftSystem videoId={video.id} isActive={isActive} />

      {/* Synchronized Community Reactions */}
      <SynchronizedReactions videoId={video.id} isActive={isActive} />

      {/* Heart Animations */}
      {showHearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute pointer-events-none animate-pulse"
          style={{
            left: heart.x,
            top: heart.y,
            animation: "heartFloat 2s ease-out forwards",
          }}
        >
          <div className="text-pink-500 text-4xl">❤️</div>
        </div>
      ))}

      {/* Play/Pause Indicator */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
            <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1" />
          </div>
        </div>
      )}
    </div>
  );
}
