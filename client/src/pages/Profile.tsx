import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, MessageCircle, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { User, Video } from "@shared/schema";

export default function Profile() {
  const [, params] = useRoute("/profile/:userId?");
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);

  // Use current user if no userId provided
  const profileUserId = params?.userId || currentUser?.id;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: profileUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/users', profileUserId],
    enabled: !!profileUserId,
  });

  const { data: userVideos = [], isLoading: videosLoading } = useQuery<Video[]>({
    queryKey: ['/api/users', profileUserId, 'videos'],
    enabled: !!profileUserId,
  });

  const { data: followingIds = [] } = useQuery<string[]>({
    queryKey: ['/api/user/following'],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (profileUser && currentUser && followingIds) {
      setIsFollowing(followingIds.includes(profileUser.id));
    }
  }, [profileUser, currentUser, followingIds]);

  const handleFollow = async () => {
    if (!profileUser || !currentUser) return;

    try {
      const response = await apiRequest('POST', `/api/users/${profileUser.id}/follow`);
      const data = await response.json();
      setIsFollowing(data.following);
      
      toast({
        title: data.following ? "Following" : "Unfollowed",
        description: `You are ${data.following ? 'now following' : 'no longer following'} @${profileUser.username}`,
      });
    } catch (error) {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    }
  };

  const goBack = () => {
    window.history.back();
  };

  if (authLoading || userLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser || !profileUser) {
    return null;
  }

  const isOwnProfile = currentUser.id === profileUser.id;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button onClick={goBack} className="text-white hover:text-pink-400 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold">
          {profileUser.username || `${profileUser.firstName} ${profileUser.lastName}`.trim() || 'User Profile'}
        </h1>
        <div className="w-6 h-6" /> {/* Spacer */}
      </div>

      {/* Profile Info */}
      <div className="p-6 space-y-6">
        {/* Avatar and Basic Info */}
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
            {profileUser.profileImageUrl ? (
              <img 
                src={profileUser.profileImageUrl} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-white">
                {(profileUser.firstName || profileUser.username || 'U')[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">
              {profileUser.username || `${profileUser.firstName} ${profileUser.lastName}`.trim() || 'User'}
            </h2>
            {profileUser.bio && (
              <p className="text-gray-300 mt-1">{profileUser.bio}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex space-x-8">
          <div className="text-center">
            <div className="text-xl font-bold">{userVideos.length}</div>
            <div className="text-gray-400 text-sm">Videos</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{profileUser.followerCount || 0}</div>
            <div className="text-gray-400 text-sm">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{profileUser.followingCount || 0}</div>
            <div className="text-gray-400 text-sm">Following</div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isOwnProfile && (
          <div className="flex space-x-4">
            <Button
              onClick={handleFollow}
              className={`flex-1 font-semibold py-2 rounded-lg transition-all ${
                isFollowing
                  ? 'bg-gray-600 hover:bg-gray-700 text-white'
                  : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
            <Button
              variant="outline"
              className="px-6 py-2 border-gray-600 text-white hover:bg-gray-800"
            >
              Message
            </Button>
          </div>
        )}
      </div>

      {/* Videos Grid */}
      <div className="px-6">
        <h3 className="text-lg font-semibold mb-4">Videos</h3>
        {videosLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : userVideos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {userVideos.map((video) => (
              <Card key={video.id} className="aspect-[3/4] bg-gray-900 border-gray-700 overflow-hidden">
                <CardContent className="p-0 h-full relative">
                  {video.thumbnailUrl ? (
                    <img 
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                      <Play className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Video Stats Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <div className="flex items-center justify-between text-xs text-white">
                      <div className="flex items-center space-x-2">
                        <Heart className="w-3 h-3" />
                        <span>{video.likeCount || 0}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="w-3 h-3" />
                        <span>{video.commentCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400">No videos yet</p>
            {isOwnProfile && (
              <p className="text-gray-500 text-sm mt-2">Start creating to share your first video!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
