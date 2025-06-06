import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Heart, MessageCircle, Share, Gift } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-pink-900/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/80 border-purple-500/20 backdrop-blur-xl">
        <CardContent className="pt-8 pb-8 px-8">
          <div className="text-center space-y-6">
            {/* Logo */}
            <div className="flex items-center justify-center space-x-2 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Play className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                SomaliStream
              </h1>
            </div>

            {/* Hero Text */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">
                Discover Amazing Videos
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                Join our vibrant community to share vertical videos, connect with creators, 
                and send stunning gifts with spectacular animations.
              </p>
            </div>

            {/* Features Preview */}
            <div className="grid grid-cols-2 gap-4 py-6">
              <div className="flex flex-col items-center space-y-2 p-3 rounded-lg bg-white/5">
                <Heart className="w-6 h-6 text-pink-400" />
                <span className="text-xs text-gray-300">Like & React</span>
              </div>
              <div className="flex flex-col items-center space-y-2 p-3 rounded-lg bg-white/5">
                <MessageCircle className="w-6 h-6 text-blue-400" />
                <span className="text-xs text-gray-300">Live Comments</span>
              </div>
              <div className="flex flex-col items-center space-y-2 p-3 rounded-lg bg-white/5">
                <Gift className="w-6 h-6 text-yellow-400" />
                <span className="text-xs text-gray-300">Send Gifts</span>
              </div>
              <div className="flex flex-col items-center space-y-2 p-3 rounded-lg bg-white/5">
                <Share className="w-6 h-6 text-green-400" />
                <span className="text-xs text-gray-300">Share Videos</span>
              </div>
            </div>

            {/* Login Button */}
            <Button 
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
              onClick={() => {
                window.location.href = "/api/login";
              }}
            >
              Get Started
            </Button>

            <p className="text-xs text-gray-400 mt-4">
              Experience the future of vertical video sharing
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
