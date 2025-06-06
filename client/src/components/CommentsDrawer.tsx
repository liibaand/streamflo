import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Heart } from "lucide-react";

interface CommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: number;
  sendMessage: (message: any) => void;
}

export default function CommentsDrawer({
  isOpen,
  onClose,
  videoId,
  sendMessage,
}: CommentsDrawerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const { data: comments } = useQuery({
    queryKey: ["/api/videos", videoId, "comments"],
    enabled: isOpen && !!videoId,
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) =>
      apiRequest("POST", `/api/videos/${videoId}/comments`, { content }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos", videoId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      setNewComment("");
      
      // Send real-time update
      sendMessage({
        type: "comment",
        videoId,
        comment: response.json(),
        timestamp: new Date().toISOString(),
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      commentMutation.mutate(newComment.trim());
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Drawer */}
      <div className="relative w-full max-w-sm bg-gray-900 rounded-t-3xl max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-white font-semibold text-lg">
            {comments?.length || 0} comments
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments?.map((comment: any) => (
            <div key={comment.id} className="flex space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={comment.user?.profileImageUrl || ""} />
                <AvatarFallback className="bg-gradient-to-r from-pink-500 to-violet-500 text-white text-xs">
                  {(comment.user?.firstName?.[0] || comment.user?.username?.[0] || "U").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium text-sm">
                    {comment.user?.username || comment.user?.firstName}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {formatTimeAgo(comment.createdAt)}
                  </span>
                </div>
                <p className="text-gray-300 text-sm mt-1">{comment.content}</p>
              </div>
              <button className="text-gray-400 hover:text-pink-500 transition-colors">
                <Heart className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          {(!comments || comments.length === 0) && (
            <div className="text-center py-8">
              <p className="text-gray-400">No comments yet</p>
              <p className="text-gray-500 text-sm mt-1">Be the first to comment!</p>
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className="border-t border-gray-700 p-4">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.profileImageUrl || ""} />
              <AvatarFallback className="bg-gradient-to-r from-pink-500 to-violet-500 text-white text-xs">
                {(user?.firstName?.[0] || user?.username?.[0] || "U").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex space-x-2">
              <Input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-pink-500"
              />
              <Button
                type="submit"
                disabled={!newComment.trim() || commentMutation.isPending}
                className="bg-pink-500 hover:bg-pink-600 text-white border-0"
              >
                Post
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
