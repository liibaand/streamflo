import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Heart, MessageCircle, Gift, Users, Star } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
              SomaliStream
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              The ultimate vertical video platform for creative expression, stunning gifts, and real-time connections
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white border-0 px-8 py-3 text-lg"
              onClick={() => window.location.href = "/api/login"}
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10 px-8 py-3 text-lg"
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full flex items-center justify-center mx-auto">
                <Play className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Vertical Videos</h3>
              <p className="text-gray-300 text-sm">Share your creativity with stunning vertical video content</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full flex items-center justify-center mx-auto">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Gift Animations</h3>
              <p className="text-gray-300 text-sm">Send spectacular animated gifts to your favorite creators</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full flex items-center justify-center mx-auto">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Real-time Chat</h3>
              <p className="text-gray-300 text-sm">Connect instantly with live comments and reactions</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Social Features</h3>
              <p className="text-gray-300 text-sm">Follow, like, and build your community</p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 text-center">
          <div className="space-y-2">
            <div className="text-3xl font-bold text-pink-400">10M+</div>
            <div className="text-gray-300">Videos Shared</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-violet-400">5M+</div>
            <div className="text-gray-300">Active Users</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-cyan-400">100M+</div>
            <div className="text-gray-300">Gifts Sent</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-yellow-400">1B+</div>
            <div className="text-gray-300">Interactions</div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16 space-y-6">
          <h2 className="text-3xl font-bold text-white">Ready to Get Started?</h2>
          <p className="text-gray-300 max-w-md mx-auto">
            Join millions of creators sharing their stories through vertical video
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white border-0 px-8 py-3 text-lg"
            onClick={() => window.location.href = "/api/login"}
          >
            <Star className="w-5 h-5 mr-2" />
            Start Creating
          </Button>
        </div>
      </div>
    </div>
  );
}
