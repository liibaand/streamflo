import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWebSocket } from "@/hooks/useWebSocket";

interface SyncReaction {
  id: string;
  type: 'wave' | 'cheer' | 'fire' | 'love' | 'mind_blown';
  emoji: string;
  color: string;
  participants: number;
  intensity: number;
  timestamp: number;
}

interface SynchronizedReactionsProps {
  videoId: number;
  isActive: boolean;
}

export default function SynchronizedReactions({ videoId, isActive }: SynchronizedReactionsProps) {
  const [activeReactions, setActiveReactions] = useState<SyncReaction[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [isParticipating, setIsParticipating] = useState(false);
  const reactionTimeoutRef = useRef<NodeJS.Timeout>();

  const { sendMessage } = useWebSocket((message) => {
    if (message.type === 'sync_reaction' && message.videoId === videoId && isActive) {
      handleSyncReaction(message.data);
    } else if (message.type === 'viewer_count' && message.videoId === videoId) {
      setParticipantCount(message.count);
    }
  });

  const handleSyncReaction = (reactionData: any) => {
    const newReaction: SyncReaction = {
      id: `${Date.now()}-${Math.random()}`,
      type: reactionData.type,
      emoji: reactionData.emoji,
      color: reactionData.color,
      participants: reactionData.participants,
      intensity: Math.min(reactionData.participants / 10, 5), // Max intensity of 5
      timestamp: Date.now(),
    };

    setActiveReactions(prev => [...prev, newReaction]);

    // Remove reaction after animation
    setTimeout(() => {
      setActiveReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 4000);
  };

  const triggerReaction = (type: SyncReaction['type']) => {
    if (isParticipating) return; // Prevent spam

    setIsParticipating(true);
    
    const reactionConfig = {
      wave: { emoji: '👋', color: '#3B82F6' },
      cheer: { emoji: '🎉', color: '#10B981' },
      fire: { emoji: '🔥', color: '#EF4444' },
      love: { emoji: '❤️', color: '#EC4899' },
      mind_blown: { emoji: '🤯', color: '#8B5CF6' },
    };

    const config = reactionConfig[type];
    
    // Send reaction to all viewers
    sendMessage({
      type: 'sync_reaction',
      videoId,
      data: {
        type,
        emoji: config.emoji,
        color: config.color,
        participants: 1, // Will be aggregated on server
      },
      timestamp: new Date().toISOString(),
    });

    // Reset participation after cooldown
    if (reactionTimeoutRef.current) {
      clearTimeout(reactionTimeoutRef.current);
    }
    reactionTimeoutRef.current = setTimeout(() => {
      setIsParticipating(false);
    }, 2000);
  };

  // Trigger screen shake for high-intensity reactions
  useEffect(() => {
    const highIntensityReaction = activeReactions.find(r => r.intensity >= 3);
    if (highIntensityReaction) {
      document.body.style.animation = 'shake 0.5s ease-in-out';
      setTimeout(() => {
        document.body.style.animation = '';
      }, 500);
    }
  }, [activeReactions]);

  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
      {/* Synchronized Reaction Waves */}
      <AnimatePresence>
        {activeReactions.map((reaction) => (
          <motion.div
            key={reaction.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Center Burst */}
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.5, 1] }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <div 
                className="text-8xl font-bold filter drop-shadow-lg"
                style={{ color: reaction.color }}
              >
                {reaction.emoji}
              </div>
            </motion.div>

            {/* Ripple Waves */}
            {Array.from({ length: reaction.intensity }).map((_, i) => (
              <motion.div
                key={`ripple-${i}`}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-4 rounded-full"
                style={{ borderColor: reaction.color + '40' }}
                initial={{ width: 0, height: 0, opacity: 0.8 }}
                animate={{ 
                  width: 400 + (i * 100), 
                  height: 400 + (i * 100), 
                  opacity: 0 
                }}
                transition={{ 
                  duration: 2 + (i * 0.3), 
                  delay: i * 0.2,
                  ease: "easeOut" 
                }}
              />
            ))}

            {/* Particle Explosion */}
            {Array.from({ length: Math.min(reaction.participants * 2, 20) }).map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute text-2xl"
                style={{
                  left: '50%',
                  top: '50%',
                  color: reaction.color,
                }}
                initial={{ 
                  scale: 0, 
                  x: 0, 
                  y: 0,
                  rotate: 0
                }}
                animate={{ 
                  scale: [0, 1, 0], 
                  x: (Math.cos(i * (360 / 20) * Math.PI / 180) * (100 + Math.random() * 200)),
                  y: (Math.sin(i * (360 / 20) * Math.PI / 180) * (100 + Math.random() * 200)),
                  rotate: 360
                }}
                transition={{ 
                  duration: 2, 
                  delay: Math.random() * 0.5,
                  ease: "easeOut" 
                }}
              >
                {reaction.emoji}
              </motion.div>
            ))}

            {/* Screen Flash for High Intensity */}
            {reaction.intensity >= 4 && (
              <motion.div
                className="absolute inset-0"
                style={{ backgroundColor: reaction.color + '20' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{ duration: 0.8, times: [0, 0.3, 1] }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Reaction Triggers - Bottom Center */}
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <motion.div
          className="flex space-x-2 bg-black/70 backdrop-blur-sm rounded-full px-6 py-3"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {[
            { type: 'wave' as const, emoji: '👋', color: '#3B82F6' },
            { type: 'cheer' as const, emoji: '🎉', color: '#10B981' },
            { type: 'fire' as const, emoji: '🔥', color: '#EF4444' },
            { type: 'love' as const, emoji: '❤️', color: '#EC4899' },
            { type: 'mind_blown' as const, emoji: '🤯', color: '#8B5CF6' },
          ].map((reaction) => (
            <motion.button
              key={reaction.type}
              onClick={() => triggerReaction(reaction.type)}
              disabled={isParticipating}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-200 ${
                isParticipating ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-95'
              }`}
              style={{ backgroundColor: reaction.color + '30' }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {reaction.emoji}
            </motion.button>
          ))}
        </motion.div>
        
        {/* Participant Counter */}
        {participantCount > 1 && (
          <motion.div
            className="text-center mt-2 text-white/80 text-sm font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {participantCount} viewers watching
          </motion.div>
        )}
      </div>

      {/* Cooldown Indicator */}
      <AnimatePresence>
        {isParticipating && (
          <motion.div
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className="text-white text-sm font-medium">Reaction sent! 🎊</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}