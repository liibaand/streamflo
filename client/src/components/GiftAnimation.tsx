import { motion } from "framer-motion";
import type { GiftAnimationData } from "@/types";

interface GiftAnimationProps {
  giftData: GiftAnimationData;
}

export default function GiftAnimation({ giftData }: GiftAnimationProps) {
  const { gift, x, y } = giftData;

  return (
    <motion.div
      className="absolute pointer-events-none z-50"
      style={{ left: x, top: y }}
      initial={{ 
        opacity: 0, 
        scale: 0.3,
        rotate: -180,
        x: -50,
        y: -50
      }}
      animate={{ 
        opacity: [0, 1, 1, 0],
        scale: [0.3, 1.2, 1, 0.8],
        rotate: [0, 360, 720],
        y: [-50, -100, -150, -200]
      }}
      transition={{
        duration: 3,
        times: [0, 0.1, 0.8, 1],
        ease: "easeOut"
      }}
    >
      {/* Main Gift */}
      <div className="relative">
        <motion.div
          className="text-6xl filter drop-shadow-lg"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {gift.emoji}
        </motion.div>

        {/* Sparkle Effects */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl"
            style={{
              left: Math.cos(i * 60) * 40,
              top: Math.sin(i * 60) * 40,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 2,
              delay: i * 0.1,
              repeat: Infinity,
              ease: "easeOut"
            }}
          >
            ✨
          </motion.div>
        ))}

        {/* Particle Effects */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full"
            style={{
              left: Math.cos(i * 30) * 60,
              top: Math.sin(i * 30) * 60,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: [0, Math.cos(i * 30) * 100],
              y: [0, Math.sin(i * 30) * 100]
            }}
            transition={{
              duration: 1.5,
              delay: 0.2 + i * 0.05,
              ease: "easeOut"
            }}
          />
        ))}

        {/* Text Label */}
        <motion.div
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/70 px-3 py-1 rounded-full backdrop-blur-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -10] }}
          transition={{
            duration: 3,
            times: [0, 0.2, 0.8, 1]
          }}
        >
          <span className="text-white text-sm font-semibold">
            {gift.name}
          </span>
        </motion.div>

        {/* Price Flash */}
        <motion.div
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 px-2 py-1 rounded-full"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            scale: [0, 1.2, 1, 0.8]
          }}
          transition={{
            duration: 2,
            times: [0, 0.1, 0.7, 1]
          }}
        >
          <span className="text-white text-xs font-bold">
            ${(gift.price / 100).toFixed(2)}
          </span>
        </motion.div>

        {/* Rarity Glow */}
        {gift.rarity === 'legendary' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}

        {gift.rarity === 'epic' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-full blur-lg opacity-40"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </div>
    </motion.div>
  );
}
