import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Users, 
  Heart, 
  Gift, 
  Send,
  Settings,
  Share,
  Coins,
  Crown,
  Sparkles,
  Diamond
} from "lucide-react";

const GIFT_PACKAGES = [
  { id: "rose", name: "Rose", emoji: "🌹", coins: 1, rarity: "common", color: "text-pink-500" },
  { id: "heart", name: "Heart", emoji: "❤️", coins: 5, rarity: "common", color: "text-red-500" },
  { id: "thumbs_up", name: "Thumbs Up", emoji: "👍", coins: 10, rarity: "common", color: "text-blue-500" },
  { id: "fire", name: "Fire", emoji: "🔥", coins: 25, rarity: "rare", color: "text-orange-500" },
  { id: "star", name: "Star", emoji: "⭐", coins: 50, rarity: "rare", color: "text-yellow-500" },
  { id: "diamond", name: "Diamond", emoji: "💎", coins: 100, rarity: "epic", color: "text-cyan-500" },
  { id: "crown", name: "Crown", emoji: "👑", coins: 250, rarity: "epic", color: "text-purple-500" },
  { id: "rocket", name: "Rocket", emoji: "🚀", coins: 500, rarity: "legendary", color: "text-indigo-500" },
  { id: "unicorn", name: "Unicorn", emoji: "🦄", coins: 1000, rarity: "legendary", color: "text-pink-600" },
];

export default function Live() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userCoins = { amount: 0 } } = useQuery({
    queryKey: ["/api/coins/balance"],
    enabled: !!user,
  });

  const { data: liveStreams = [] } = useQuery({
    queryKey: ["/api/live/streams"],
  });

  const { data: activeStream } = useQuery({
    queryKey: ["/api/live/my-stream"],
    enabled: !!user && isStreaming,
  });

  const { sendMessage: sendWebSocketMessage } = useWebSocket((message) => {
    if (message.type === "live_message") {
      // Handle incoming live messages
    } else if (message.type === "live_gift") {
      // Handle incoming gifts
    } else if (message.type === "viewer_count") {
      setViewerCount(message.count);
    }
  });

  const startStreamMutation = useMutation({
    mutationFn: async (streamData: any) => {
      return apiRequest("/api/live/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(streamData),
      });
    },
    onSuccess: () => {
      setIsStreaming(true);
      toast({
        title: "Stream Started",
        description: "You're now live!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/live/streams"] });
    },
  });

  const endStreamMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/live/end", {
        method: "POST",
      });
    },
    onSuccess: () => {
      setIsStreaming(false);
      toast({
        title: "Stream Ended",
        description: "Your live stream has ended.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/live/streams"] });
    },
  });

  const sendGiftMutation = useMutation({
    mutationFn: async ({ streamId, giftId }: { streamId: number; giftId: string }) => {
      const gift = GIFT_PACKAGES.find(g => g.id === giftId);
      return apiRequest("/api/live/gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          liveStreamId: streamId,
          giftType: giftId,
          coinCost: gift?.coins,
          rarity: gift?.rarity,
          emoji: gift?.emoji,
          name: gift?.name,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Gift Sent!",
        description: "Your gift has been sent to the streamer.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/coins/balance"] });
      setShowGiftPanel(false);
      setSelectedGift(null);
    },
  });

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      startStreamMutation.mutate({
        title: "Live Stream",
        description: "Broadcasting live now!",
        category: "general",
      });
    } catch (error) {
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera and microphone access to start streaming.",
        variant: "destructive",
      });
    }
  };

  const endStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    endStreamMutation.mutate();
  };

  const sendChatMessage = () => {
    if (message.trim() && activeStream) {
      sendWebSocketMessage({
        type: "live_message",
        liveStreamId: activeStream.id,
        data: {
          message: message.trim(),
          user: user,
        },
      });
      setMessage("");
    }
  };

  const sendGift = (giftId: string, streamId: number) => {
    const gift = GIFT_PACKAGES.find(g => g.id === giftId);
    if (gift && userCoins.amount >= gift.coins) {
      sendGiftMutation.mutate({ streamId, giftId });
    } else {
      toast({
        title: "Insufficient Coins",
        description: "You need more coins to send this gift.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Live</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gray-900 rounded-full px-3 py-1">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">{userCoins.amount}</span>
            </div>
            {!isStreaming ? (
              <Button onClick={startStream} className="bg-red-500 hover:bg-red-600">
                <Video className="w-4 h-4 mr-2" />
                Go Live
              </Button>
            ) : (
              <Button onClick={endStream} variant="destructive">
                <VideoOff className="w-4 h-4 mr-2" />
                End Stream
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {isStreaming ? (
          /* Streaming Interface */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Stream View */}
            <div className="lg:col-span-2 space-y-4">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 flex items-center space-x-4">
                  <Badge variant="destructive" className="animate-pulse">
                    LIVE
                  </Badge>
                  <div className="flex items-center space-x-2 bg-black/50 rounded-full px-3 py-1">
                    <Users className="w-4 h-4" />
                    <span>{viewerCount}</span>
                  </div>
                </div>
                
                {/* Stream Controls */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button size="sm" variant="secondary" className="bg-black/50">
                      <Mic className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="secondary" className="bg-black/50">
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="secondary" className="bg-black/50">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button size="sm" variant="secondary" className="bg-black/50">
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>

            {/* Chat & Interaction Panel */}
            <div className="space-y-4">
              {/* Live Chat */}
              <div className="bg-gray-900 rounded-lg p-4 h-96 flex flex-col">
                <h3 className="font-semibold mb-3">Live Chat</h3>
                <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                  {/* Chat messages would go here */}
                  <div className="text-sm text-gray-400 text-center">
                    Chat messages will appear here
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Say something..."
                    className="flex-1 bg-gray-800 border-gray-700"
                    onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
                  />
                  <Button size="sm" onClick={sendChatMessage}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Live Streams Grid */
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Live Streams</h2>
            
            {liveStreams.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold mb-2">No Live Streams</h3>
                <p className="text-gray-400 mb-6">Be the first to go live!</p>
                <Button onClick={startStream} className="bg-red-500 hover:bg-red-600">
                  <Video className="w-4 h-4 mr-2" />
                  Start Your Stream
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveStreams.map((stream: any) => (
                  <div key={stream.id} className="bg-gray-900 rounded-lg overflow-hidden">
                    <div className="relative aspect-video bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                      <div className="absolute top-3 left-3">
                        <Badge variant="destructive" className="animate-pulse">
                          LIVE
                        </Badge>
                      </div>
                      <div className="absolute top-3 right-3 flex items-center space-x-1 bg-black/50 rounded-full px-2 py-1">
                        <Users className="w-3 h-3" />
                        <span className="text-xs">{stream.viewerCount || 0}</span>
                      </div>
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={stream.user?.profileImageUrl} />
                        <AvatarFallback>{stream.user?.firstName?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold truncate">{stream.title}</h3>
                      <p className="text-sm text-gray-400 truncate">{stream.user?.firstName || 'Unknown'}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowGiftPanel(true)}
                          >
                            <Gift className="w-4 h-4 mr-1" />
                            Gift
                          </Button>
                        </div>
                        <Button size="sm" className="bg-red-500 hover:bg-red-600">
                          Watch
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Gift Panel Modal */}
        {showGiftPanel && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Send Gift</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGiftPanel(false)}
                >
                  ×
                </Button>
              </div>
              
              <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Your Balance</span>
                  <div className="flex items-center space-x-1">
                    <Coins className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">{userCoins.amount} coins</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {GIFT_PACKAGES.map((gift) => (
                  <button
                    key={gift.id}
                    onClick={() => setSelectedGift(gift.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedGift === gift.id
                        ? 'border-pink-500 bg-pink-500/10'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }`}
                  >
                    <div className="text-2xl mb-1">{gift.emoji}</div>
                    <div className="text-xs font-medium">{gift.name}</div>
                    <div className="text-xs text-gray-400 flex items-center justify-center">
                      <Coins className="w-3 h-3 mr-1" />
                      {gift.coins}
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs mt-1 ${
                        gift.rarity === 'legendary' ? 'bg-purple-900 text-purple-300' :
                        gift.rarity === 'epic' ? 'bg-blue-900 text-blue-300' :
                        gift.rarity === 'rare' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {gift.rarity}
                    </Badge>
                  </button>
                ))}
              </div>

              {selectedGift && (
                <div className="mt-4 flex space-x-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      // Send gift to selected stream
                      const gift = GIFT_PACKAGES.find(g => g.id === selectedGift);
                      if (gift) {
                        toast({
                          title: "Gift Sent!",
                          description: `You sent a ${gift.name}!`,
                        });
                        setShowGiftPanel(false);
                        setSelectedGift(null);
                      }
                    }}
                  >
                    Send Gift
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedGift(null)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}