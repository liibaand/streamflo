import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GiftAnimationData {
  id: string;
  gift: {
    id: string;
    emoji: string;
    name: string;
    amount: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  };
  x: number;
  y: number;
  timestamp: number;
}

interface GiftAnimationProps {
  giftData: GiftAnimationData;
}

export default function GiftAnimation({ giftData }: GiftAnimationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    // Generate particles based on gift rarity
    const particleCount = {
      common: 8,
      rare: 15,
      epic: 25,
      legendary: 50
    }[giftData.gift.rarity] || 8;

    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.5,
    }));

    setParticles(newParticles);
  }, [giftData]);

  const getAnimationVariants = () => {
    const baseVariants = {
      initial: { scale: 0, opacity: 0, rotate: 0 },
      animate: { 
        scale: [0, 1.2, 1], 
        opacity: [0, 1, 1, 0], 
        rotate: [0, 360],
        transition: { duration: 3, ease: "easeOut" }
      },
      exit: { scale: 0, opacity: 0 }
    };

    // Enhanced animations for higher rarities
    switch (giftData.gift.rarity) {
      case 'legendary':
        return {
          ...baseVariants,
          animate: {
            ...baseVariants.animate,
            scale: [0, 1.5, 1.2, 1],
            rotate: [0, 720],
            filter: [
              "hue-rotate(0deg) brightness(1) drop-shadow(0 0 0px gold)",
              "hue-rotate(180deg) brightness(1.5) drop-shadow(0 0 20px gold)",
              "hue-rotate(360deg) brightness(1.2) drop-shadow(0 0 10px gold)"
            ],
            transition: { duration: 4, ease: "easeOut" }
          }
        };
      case 'epic':
        return {
          ...baseVariants,
          animate: {
            ...baseVariants.animate,
            scale: [0, 1.4, 1.1],
            filter: [
              "hue-rotate(0deg) brightness(1)",
              "hue-rotate(270deg) brightness(1.3)",
              "hue-rotate(0deg) brightness(1.1)"
            ],
            transition: { duration: 3.5, ease: "easeOut" }
          }
        };
      case 'rare':
        return {
          ...baseVariants,
          animate: {
            ...baseVariants.animate,
            scale: [0, 1.3, 1.05],
            transition: { duration: 3.2, ease: "easeOut" }
          }
        };
      default:
        return baseVariants;
    }
  };

  const getParticleColor = () => {
    switch (giftData.gift.rarity) {
      case 'legendary': return '#FFD700'; // Gold
      case 'epic': return '#9B59B6'; // Purple
      case 'rare': return '#3498DB'; // Blue
      default: return '#FFFFFF'; // White
    }
  };

  const getGlowEffect = () => {
    switch (giftData.gift.rarity) {
      case 'legendary':
        return {
          boxShadow: [
            "0 0 0px gold",
            "0 0 30px gold, 0 0 60px gold",
            "0 0 15px gold"
          ]
        };
      case 'epic':
        return {
          boxShadow: [
            "0 0 0px purple",
            "0 0 20px purple, 0 0 40px purple",
            "0 0 10px purple"
          ]
        };
      case 'rare':
        return {
          boxShadow: [
            "0 0 0px blue",
            "0 0 15px blue, 0 0 30px blue",
            "0 0 8px blue"
          ]
        };
      default:
        return {};
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {/* Main Gift Animation */}
        <motion.div
          className="absolute"
          style={{
            left: `${giftData.x}%`,
            top: `${giftData.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
          variants={getAnimationVariants()}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <motion.div
            className="relative"
            animate={getGlowEffect()}
            transition={{ duration: 3, ease: "easeOut" }}
          >
            <div className="text-8xl font-bold filter drop-shadow-lg">
              {giftData.gift.emoji}
            </div>
            
            {/* Gift Name and Value */}
            <motion.div
              className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <div className="text-white font-bold text-lg bg-black/50 rounded-full px-4 py-2 backdrop-blur-sm">
                {giftData.gift.name}
              </div>
              <div className="text-yellow-400 font-bold text-sm mt-1">
                ${giftData.gift.amount}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Particle Effects */}
        {particles.map((particle) => (
          <motion.div
            key={`${giftData.id}-particle-${particle.id}`}
            className="absolute w-3 h-3 rounded-full"
            style={{
              left: `${giftData.x + (particle.x - 50) * 0.5}%`,
              top: `${giftData.y + (particle.y - 50) * 0.5}%`,
              backgroundColor: getParticleColor(),
            }}
            initial={{ 
              scale: 0, 
              opacity: 0,
              x: 0,
              y: 0
            }}
            animate={{ 
              scale: [0, 1, 0], 
              opacity: [0, 1, 0],
              x: (particle.x - 50) * 4,
              y: (particle.y - 50) * 4,
            }}
            transition={{ 
              duration: 2.5, 
              delay: particle.delay,
              ease: "easeOut"
            }}
          />
        ))}

        {/* Screen Flash for Legendary Gifts */}
        {giftData.gift.rarity === 'legendary' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-orange-500/20 to-red-500/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.5, repeat: 2 }}
          />
        )}

        {/* Ripple Effect */}
        <motion.div
          className="absolute border-4 border-white/30 rounded-full"
          style={{
            left: `${giftData.x}%`,
            top: `${giftData.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
          initial={{ width: 0, height: 0, opacity: 0.8 }}
          animate={{ 
            width: 300, 
            height: 300, 
            opacity: 0,
            borderColor: getParticleColor()
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />

        {/* Secondary Ripple */}
        <motion.div
          className="absolute border-2 border-white/20 rounded-full"
          style={{
            left: `${giftData.x}%`,
            top: `${giftData.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
          initial={{ width: 0, height: 0, opacity: 0.6 }}
          animate={{ 
            width: 200, 
            height: 200, 
            opacity: 0,
            borderColor: getParticleColor()
          }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
        />

        {/* Streak Effects for Epic+ Gifts */}
        {(giftData.gift.rarity === 'epic' || giftData.gift.rarity === 'legendary') && (
          <motion.div
            className="absolute"
            style={{
              left: `${giftData.x}%`,
              top: `${giftData.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={`streak-${i}`}
                className="absolute w-1 bg-gradient-to-r from-transparent via-white to-transparent"
                style={{
                  height: '100px',
                  transform: `rotate(${i * 45}deg)`,
                  transformOrigin: 'bottom center'
                }}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: [0, 1, 0], opacity: [0, 0.8, 0] }}
                transition={{ 
                  duration: 1, 
                  delay: 0.3 + i * 0.1,
                  ease: "easeOut"
                }}
              />
            ))}
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}