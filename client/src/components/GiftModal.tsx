import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface GiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: any;
  sendMessage: (message: any) => void;
}

const GIFTS = [
  { id: "rose", emoji: "🌹", name: "Rose", amount: 1, rarity: "common" },
  { id: "heart", emoji: "❤️", name: "Heart", amount: 5, rarity: "common" },
  { id: "kiss", emoji: "💋", name: "Kiss", amount: 10, rarity: "common" },
  { id: "diamond", emoji: "💎", name: "Diamond", amount: 25, rarity: "rare" },
  { id: "star", emoji: "⭐", name: "Star", amount: 50, rarity: "rare" },
  { id: "crown", emoji: "👑", name: "Crown", amount: 100, rarity: "epic" },
  { id: "rocket", emoji: "🚀", name: "Rocket", amount: 200, rarity: "epic" },
  { id: "fire", emoji: "🔥", name: "Fire", amount: 300, rarity: "epic" },
  { id: "unicorn", emoji: "🦄", name: "Unicorn", amount: 500, rarity: "legendary" },
  { id: "galaxy", emoji: "🌌", name: "Galaxy", amount: 1000, rarity: "legendary" },
  { id: "phoenix", emoji: "🔮", name: "Phoenix", amount: 2000, rarity: "legendary" },
  { id: "dragon", emoji: "🐉", name: "Dragon", amount: 5000, rarity: "legendary" },
] as const;

export default function GiftModal({
  isOpen,
  onClose,
  video,
  sendMessage,
}: GiftModalProps) {
  const { user } = useAuth();
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  const giftMutation = useMutation({
    mutationFn: (giftData: { giftType: string; amount: number; receiverId: string }) =>
      apiRequest("POST", `/api/videos/${video.id}/gift`, giftData),
    onSuccess: (response) => {
      const gift = response.json();
      
      // Trigger gift animation
      setShowAnimation(true);
      setTimeout(() => setShowAnimation(false), 3000);
      
      // Send real-time update
      sendMessage({
        type: "gift",
        videoId: video.id,
        gift,
        timestamp: new Date().toISOString(),
      });
      
      // Close modal after a delay
      setTimeout(() => {
        onClose();
        setSelectedGift(null);
      }, 1000);
    },
  });

  const handleSendGift = () => {
    if (!selectedGift || !video) return;
    
    const gift = GIFTS.find(g => g.id === selectedGift);
    if (!gift) return;
    
    giftMutation.mutate({
      giftType: gift.id,
      amount: gift.amount,
      receiverId: video.userId,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-sm bg-gray-900 rounded-t-3xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-white font-semibold text-lg">Send Gift</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Gift Grid */}
        <div className="p-4">
          <div className="grid grid-cols-3 gap-3 mb-6 max-h-96 overflow-y-auto">
            {GIFTS.map((gift) => {
              const getRarityStyles = () => {
                switch (gift.rarity) {
                  case 'legendary':
                    return {
                      border: 'border-2 border-yellow-400/50',
                      bg: 'bg-gradient-to-br from-yellow-900/30 to-orange-900/30',
                      glow: selectedGift === gift.id ? 'shadow-lg shadow-yellow-400/20' : '',
                      text: 'text-yellow-400'
                    };
                  case 'epic':
                    return {
                      border: 'border-2 border-purple-400/50',
                      bg: 'bg-gradient-to-br from-purple-900/30 to-pink-900/30',
                      glow: selectedGift === gift.id ? 'shadow-lg shadow-purple-400/20' : '',
                      text: 'text-purple-400'
                    };
                  case 'rare':
                    return {
                      border: 'border-2 border-blue-400/50',
                      bg: 'bg-gradient-to-br from-blue-900/30 to-cyan-900/30',
                      glow: selectedGift === gift.id ? 'shadow-lg shadow-blue-400/20' : '',
                      text: 'text-blue-400'
                    };
                  default:
                    return {
                      border: 'border border-gray-600',
                      bg: 'bg-gray-800',
                      glow: selectedGift === gift.id ? 'shadow-lg shadow-pink-500/20' : '',
                      text: 'text-gray-400'
                    };
                }
              };
              
              const styles = getRarityStyles();
              
              return (
                <button
                  key={gift.id}
                  onClick={() => setSelectedGift(gift.id)}
                  className={`flex flex-col items-center space-y-2 p-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    styles.bg
                  } ${styles.border} ${styles.glow} ${
                    selectedGift === gift.id ? "ring-2 ring-pink-500 scale-105" : "hover:bg-gray-700"
                  }`}
                >
                  <div className={`text-4xl ${gift.rarity === 'legendary' ? 'animate-pulse' : ''}`}>
                    {gift.emoji}
                  </div>
                  <span className="text-white text-xs font-medium text-center leading-tight">
                    {gift.name}
                  </span>
                  <span className={`text-xs font-bold ${styles.text}`}>
                    ${gift.amount}
                  </span>
                  <div className={`text-[10px] uppercase tracking-wider font-bold ${styles.text}`}>
                    {gift.rarity}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendGift}
            disabled={!selectedGift || giftMutation.isPending}
            className="w-full bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white border-0 py-3 text-lg font-semibold"
          >
            {giftMutation.isPending ? "Sending..." : "Send Gift"}
          </Button>
        </div>
      </div>

      {/* Gift Animation Overlay */}
      {showAnimation && (
        <div className="fixed inset-0 pointer-events-none z-60 flex items-center justify-center">
          <div className="animate-bounce-in">
            <div className="text-8xl animate-pulse">
              {GIFTS.find(g => g.id === selectedGift)?.emoji}
            </div>
          </div>
          
          {/* Floating particles */}
          <div className="absolute inset-0">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              >
                <div className="text-2xl opacity-80">✨</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
