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
  { id: "rose", emoji: "🌹", name: "Rose", amount: 1 },
  { id: "heart", emoji: "❤️", name: "Heart", amount: 5 },
  { id: "diamond", emoji: "💎", name: "Diamond", amount: 10 },
  { id: "star", emoji: "⭐", name: "Star", amount: 25 },
  { id: "crown", emoji: "👑", name: "Crown", amount: 50 },
  { id: "rocket", emoji: "🚀", name: "Rocket", amount: 100 },
  { id: "fire", emoji: "🔥", name: "Fire", amount: 200 },
  { id: "unicorn", emoji: "🦄", name: "Unicorn", amount: 500 },
];

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
          <div className="grid grid-cols-4 gap-3 mb-6">
            {GIFTS.map((gift) => (
              <button
                key={gift.id}
                onClick={() => setSelectedGift(gift.id)}
                className={`flex flex-col items-center space-y-2 p-3 rounded-xl transition-all duration-200 ${
                  selectedGift === gift.id
                    ? "bg-pink-500/20 border-2 border-pink-500"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                <div className="text-3xl">{gift.emoji}</div>
                <span className="text-white text-xs font-medium">{gift.name}</span>
                <span className="text-yellow-400 text-xs font-bold">${gift.amount}</span>
              </button>
            ))}
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
