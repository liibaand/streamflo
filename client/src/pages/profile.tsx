import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share, Settings, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    enabled: !userId || userId === currentUser?.id,
  });

  const { data: videos } = useQuery({
    queryKey: ["/api/users", userId || currentUser?.id, "videos"],
    enabled: !!(userId || currentUser?.id),
  });

  const isOwnProfile = !userId || userId === currentUser?.id;
  const profileUser = user || currentUser;

  if (!profileUser) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          className="text-white hover:bg-gray-800"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <h1 className="text-lg font-semibold">{profileUser.username || profileUser.firstName}</h1>
        {isOwnProfile && (
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-800"
            onClick={() => window.location.href = "/api/logout"}
          >
            <Settings className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Profile Info */}
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={profileUser.profileImageUrl || ""} />
            <AvatarFallback className="bg-gradient-to-r from-pink-500 to-violet-500 text-white text-xl">
              {(profileUser.firstName?.[0] || profileUser.username?.[0] || "U").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{profileUser.username || `${profileUser.firstName} ${profileUser.lastName}`}</h2>
            {profileUser.bio && (
              <p className="text-gray-400 mt-1">{profileUser.bio}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-around py-4 border-y border-gray-800">
          <div className="text-center">
            <div className="text-xl font-bold text-white">{profileUser.followersCount || 0}</div>
            <div className="text-sm text-gray-400">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-white">{profileUser.followingCount || 0}</div>
            <div className="text-sm text-gray-400">Following</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-white">{videos?.length || 0}</div>
            <div className="text-sm text-gray-400">Videos</div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isOwnProfile && (
          <div className="flex space-x-3">
            <Button className="flex-1 bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600">
              Follow
            </Button>
            <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
              Message
            </Button>
          </div>
        )}
      </div>

      {/* Videos Grid */}
      <div className="px-6">
        <h3 className="text-lg font-semibold mb-4">Videos</h3>
        <div className="grid grid-cols-3 gap-1">
          {videos?.map((video: any) => (
            <div
              key={video.id}
              className="aspect-[9/16] bg-gray-800 rounded-lg overflow-hidden relative group cursor-pointer"
            >
              {video.thumbnailUrl ? (
                <img 
                  src={video.thumbnailUrl} 
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <span className="text-gray-400 text-xs text-center px-2">{video.title}</span>
                </div>
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                <div className="flex items-center space-x-2 text-white text-xs">
                  <div className="flex items-center space-x-1">
                    <Heart className="w-3 h-3" />
                    <span>{video.likesCount}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>{video.commentsCount}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {(!videos || videos.length === 0) && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No videos yet</div>
            {isOwnProfile && (
              <p className="text-gray-500 text-sm">Start creating and sharing your videos!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
