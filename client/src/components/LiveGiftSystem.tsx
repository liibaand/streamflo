import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWebSocket } from "@/hooks/useWebSocket";
import GiftAnimation from "./GiftAnimation";

interface LiveGift {
  id: string;
  gift: {
    id: string;
    emoji: string;
    name: string;
    amount: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  };
  sender: {
    username: string;
    profileImageUrl?: string;
  };
  x: number;
  y: number;
  timestamp: number;
}

interface LiveGiftSystemProps {
  videoId: number;
  isActive: boolean;
}

export default function LiveGiftSystem({ videoId, isActive }: LiveGiftSystemProps) {
  const [activeGifts, setActiveGifts] = useState<LiveGift[]>([]);
  const [giftQueue, setGiftQueue] = useState<LiveGift[]>([]);
  const [giftRainActive, setGiftRainActive] = useState(false);
  const [comboCount, setComboCount] = useState(0);
  const [lastGiftType, setLastGiftType] = useState<string | null>(null);
  const comboTimeoutRef = useRef<NodeJS.Timeout>();

  const { sendMessage } = useWebSocket((message) => {
    if (message.type === 'gift' && message.videoId === videoId && isActive) {
      handleNewGift(message.data);
    }
  });

  const handleNewGift = (giftData: any) => {
    const newGift: LiveGift = {
      id: `${Date.now()}-${Math.random()}`,
      gift: giftData.gift,
      sender: giftData.sender,
      x: Math.random() * 80 + 10, // 10-90% of screen width
      y: Math.random() * 60 + 20, // 20-80% of screen height
      timestamp: Date.now(),
    };

    // Handle combo system
    if (giftData.gift.id === lastGiftType) {
      setComboCount(prev => prev + 1);
      if (comboTimeoutRef.current) {
        clearTimeout(comboTimeoutRef.current);
      }
    } else {
      setComboCount(1);
      setLastGiftType(giftData.gift.id);
    }

    // Reset combo after 3 seconds
    comboTimeoutRef.current = setTimeout(() => {
      setComboCount(0);
      setLastGiftType(null);
    }, 3000);

    // Trigger gift rain for legendary gifts or high combos
    if (giftData.gift.rarity === 'legendary' || comboCount >= 5) {
      triggerGiftRain(giftData.gift);
    }

    // Add to queue for smooth processing
    setGiftQueue(prev => [...prev, newGift]);
  };

  const triggerGiftRain = (gift: any) => {
    setGiftRainActive(true);
    
    // Create multiple gifts falling from top
    const rainGifts = Array.from({ length: 15 }, (_, i) => ({
      id: `rain-${Date.now()}-${i}`,
      gift,
      sender: { username: 'Gift Rain' },
      x: Math.random() * 100,
      y: -10, // Start above screen
      timestamp: Date.now() + i * 100, // Stagger the drops
    }));

    setTimeout(() => {
      setGiftQueue(prev => [...prev, ...rainGifts]);
    }, 500);

    setTimeout(() => {
      setGiftRainActive(false);
    }, 3000);
  };

  // Process gift queue
  useEffect(() => {
    if (giftQueue.length > 0 && activeGifts.length < 8) { // Limit concurrent gifts
      const nextGift = giftQueue[0];
      setGiftQueue(prev => prev.slice(1));
      setActiveGifts(prev => [...prev, nextGift]);

      // Remove gift after animation completes
      setTimeout(() => {
        setActiveGifts(prev => prev.filter(g => g.id !== nextGift.id));
      }, 4000);
    }
  }, [giftQueue, activeGifts]);

  // Clean up old gifts
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setActiveGifts(prev => prev.filter(gift => now - gift.timestamp < 5000));
    }, 1000);

    return () => clearInterval(cleanup);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {/* Gift Rain Background Effect */}
      <AnimatePresence>
        {giftRainActive && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-yellow-400/10 via-orange-500/5 to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* Active Gift Animations */}
      <AnimatePresence>
        {activeGifts.map((gift) => (
          <GiftAnimation
            key={gift.id}
            giftData={gift}
          />
        ))}
      </AnimatePresence>

      {/* Combo Counter */}
      <AnimatePresence>
        {comboCount > 1 && (
          <motion.div
            className="absolute top-20 right-4 z-50"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-4 py-2 rounded-full text-lg shadow-lg">
              <motion.div
                key={comboCount}
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {comboCount}x COMBO!
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gift Rain Indicator */}
      <AnimatePresence>
        {giftRainActive && (
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <div className="text-center">
              <motion.div
                className="text-6xl mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                🌟
              </motion.div>
              <div className="text-white font-bold text-2xl bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                GIFT RAIN!
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Gift Notifications */}
      <div className="absolute top-4 left-4 max-w-xs space-y-2">
        <AnimatePresence>
          {activeGifts.slice(-3).map((gift) => (
            <motion.div
              key={`notification-${gift.id}`}
              className="bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white text-sm"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{gift.gift.emoji}</span>
                <div>
                  <div className="font-medium">{gift.sender.username}</div>
                  <div className="text-xs text-gray-300">
                    sent {gift.gift.name} (${gift.gift.amount})
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Screen Edge Sparkles for Legendary Gifts */}
      <AnimatePresence>
        {activeGifts.some(g => g.gift.rarity === 'legendary') && (
          <div className="absolute inset-0">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute text-yellow-400 text-2xl"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                initial={{ scale: 0, opacity: 0, rotate: 0 }}
                animate={{ 
                  scale: [0, 1, 0], 
                  opacity: [0, 1, 0], 
                  rotate: 360 
                }}
                transition={{ 
                  duration: 2, 
                  delay: Math.random() * 1,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 3
                }}
              >
                ✨
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}