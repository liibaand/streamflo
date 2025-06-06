import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import VideoFeed from "@/components/VideoFeed";
import BottomNavigation from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [feedType, setFeedType] = useState<'foryou' | 'following'>('foryou');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="h-screen bg-black relative overflow-hidden">
      {/* Top Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div className="flex space-x-6">
            <button 
              className={`text-lg font-medium transition-colors ${
                feedType === 'following' ? 'text-white/70' : 'text-white'
              }`}
              onClick={() => setFeedType('following')}
            >
              Following
            </button>
            <button 
              className={`text-lg font-bold transition-colors ${
                feedType === 'foryou' 
                  ? 'text-white border-b-2 border-pink-500 pb-1' 
                  : 'text-white/70'
              }`}
              onClick={() => setFeedType('foryou')}
            >
              For You
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-white hover:text-pink-400 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button 
              className="text-white hover:text-pink-400 transition-colors"
              onClick={() => {
                window.location.href = "/api/logout";
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Video Feed */}
      <VideoFeed feedType={feedType} />

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
