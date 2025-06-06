import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Search, TrendingUp, Users, Video, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const TRENDING_HASHTAGS = [
  { tag: "#viral", posts: "2.1M", growth: "+45%" },
  { tag: "#dance", posts: "1.8M", growth: "+32%" },
  { tag: "#comedy", posts: "1.5M", growth: "+28%" },
  { tag: "#cooking", posts: "987K", growth: "+22%" },
  { tag: "#music", posts: "856K", growth: "+18%" },
  { tag: "#fashion", posts: "743K", growth: "+15%" },
  { tag: "#travel", posts: "692K", growth: "+12%" },
  { tag: "#tech", posts: "534K", growth: "+8%" },
];

const CATEGORIES = [
  { id: "trending", name: "Trending", icon: TrendingUp, color: "bg-pink-500" },
  { id: "live", name: "Live", icon: Users, color: "bg-red-500" },
  { id: "music", name: "Music", icon: Video, color: "bg-purple-500" },
  { id: "comedy", name: "Comedy", icon: Play, color: "bg-yellow-500" },
];

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("trending");
  const { user } = useAuth();

  const { data: trendingVideos = [] } = useQuery({
    queryKey: ["/api/videos/trending"],
  });

  const { data: liveStreams = [] } = useQuery({
    queryKey: ["/api/live/streams"],
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ["/api/search", searchQuery],
    enabled: searchQuery.length > 2,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search will be triggered by the query when searchQuery changes
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-y-auto pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-md mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Discover</h1>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos, users, sounds..."
              className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-400"
            />
          </form>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Categories */}
        <div className="grid grid-cols-4 gap-3">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex flex-col items-center p-4 h-20 ${
                  selectedCategory === category.id 
                    ? `${category.color} text-white` 
                    : "bg-gray-900 border-gray-700 hover:bg-gray-800"
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs">{category.name}</span>
              </Button>
            );
          })}
        </div>

        {/* Live Streams Section */}
        {selectedCategory === "live" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Live Now</h2>
              <Badge variant="destructive" className="animate-pulse">
                LIVE
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="relative bg-gray-900 rounded-lg overflow-hidden">
                  <div className="aspect-[4/5] bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <div className="text-center">
                      <Avatar className="w-16 h-16 mx-auto mb-2">
                        <AvatarImage src={`https://picsum.photos/64/64?random=${item}`} />
                        <AvatarFallback>U{item}</AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium">User {item}</p>
                      <p className="text-xs text-gray-300">{Math.floor(Math.random() * 1000 + 100)} viewers</p>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">Live Stream Title {item}</p>
                    <div className="flex items-center mt-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                      <span className="text-xs text-gray-400">Live</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trending Hashtags */}
        {selectedCategory === "trending" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Trending Hashtags</h2>
            <div className="space-y-3">
              {TRENDING_HASHTAGS.map((hashtag, index) => (
                <div key={hashtag.tag} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{hashtag.tag}</p>
                      <p className="text-sm text-gray-400">{hashtag.posts} posts</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-900 text-green-300">
                    {hashtag.growth}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trending Videos Grid */}
        {selectedCategory === "trending" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Trending Videos</h2>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
                <div key={item} className="relative aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden">
                  <img
                    src={`https://picsum.photos/200/300?random=${item}`}
                    alt={`Trending video ${item}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="flex items-center text-xs text-white">
                      <Play className="w-3 h-3 mr-1" />
                      {Math.floor(Math.random() * 1000 + 100)}K
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-black/50 text-white text-xs">
                      {Math.floor(Math.random() * 60 + 10)}s
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchQuery.length > 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Search Results</h2>
            {searchResults.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No results found for "{searchQuery}"</p>
                <p className="text-sm mt-2">Try searching for videos, users, or hashtags</p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((result: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-900 rounded-lg">
                    <Avatar>
                      <AvatarImage src={result.thumbnail || `https://picsum.photos/40/40?random=${index}`} />
                      <AvatarFallback>V</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{result.title || `Search Result ${index + 1}`}</p>
                      <p className="text-sm text-gray-400">{result.username || `User ${index + 1}`}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Music Category */}
        {selectedCategory === "music" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Trending Sounds</h2>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex items-center space-x-3 p-4 bg-gray-900 rounded-lg">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Trending Sound {item}</p>
                    <p className="text-sm text-gray-400">{Math.floor(Math.random() * 500 + 100)}K videos</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Use Sound
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}