import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share, Gift, Plus } from "lucide-react";

interface VideoActionsProps {
  video: any;
  isLiked?: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onGift: () => void;
  onUpload: () => void;
  sendMessage: (message: any) => void;
}

export default function VideoActions({
  video,
  isLiked,
  onLike,
  onComment,
  onShare,
  onGift,
  onUpload,
  sendMessage,
}: VideoActionsProps) {
  const [isGiftAnimating, setIsGiftAnimating] = useState(false);

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const handleLike = () => {
    onLike();
    // Send real-time update
    sendMessage({
      type: "like",
      videoId: video.id,
      timestamp: new Date().toISOString(),
    });
  };

  const handleGift = () => {
    setIsGiftAnimating(true);
    setTimeout(() => setIsGiftAnimating(false), 1000);
    onGift();
  };

  return (
    <div className="flex flex-col justify-end items-center space-y-6 p-4 pb-24 w-20">
      {/* Profile Avatar with Follow Button */}
      <div className="relative">
        <Avatar className="w-12 h-12 border-2 border-white">
          <AvatarImage src={video.user?.profileImageUrl || ""} />
          <AvatarFallback className="bg-gradient-to-r from-pink-500 to-violet-500 text-white">
            {(video.user?.firstName?.[0] || video.user?.username?.[0] || "U").toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center border-2 border-black">
          <Plus className="w-3 h-3 text-white" />
        </div>
      </div>

      {/* Like Button */}
      <div className="flex flex-col items-center space-y-1">
        <button
          onClick={handleLike}
          className={`w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center transition-all duration-200 ${
            isLiked ? "scale-110" : "hover:scale-105"
          }`}
        >
          <Heart
            className={`w-6 h-6 ${
              isLiked ? "fill-pink-500 text-pink-500" : "text-white"
            }`}
          />
        </button>
        <span className="text-white text-xs font-medium">
          {formatCount(video.likesCount || 0)}
        </span>
      </div>

      {/* Comment Button */}
      <div className="flex flex-col items-center space-y-1">
        <button
          onClick={onComment}
          className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:scale-105 transition-transform duration-200"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </button>
        <span className="text-white text-xs font-medium">
          {formatCount(video.commentsCount || 0)}
        </span>
      </div>

      {/* Share Button */}
      <div className="flex flex-col items-center space-y-1">
        <button
          onClick={onShare}
          className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:scale-105 transition-transform duration-200"
        >
          <Share className="w-6 h-6 text-white" />
        </button>
        <span className="text-white text-xs font-medium">Share</span>
      </div>

      {/* Gift Button */}
      <div className="flex flex-col items-center space-y-1">
        <button
          onClick={handleGift}
          className={`w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-pink-500 flex items-center justify-center transition-all duration-200 ${
            isGiftAnimating ? "animate-bounce scale-110" : "hover:scale-105"
          }`}
        >
          <Gift className="w-6 h-6 text-white" />
        </button>
        <span className="text-white text-xs font-medium">Gift</span>
      </div>

      {/* Upload Button (Plus) */}
      <div className="mt-4">
        <button
          onClick={onUpload}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center hover:scale-105 transition-transform duration-200"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Rotating Music Disc */}
      <div className="mt-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center animate-spin-slow">
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
