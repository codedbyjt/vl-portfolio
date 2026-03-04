import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  onLoadComplete: () => void;
}

const IMAGES = [
  '/hwa-1.webp',
  '/hwa-2.webp',
  '/hwa-3.webp',
  '/PERSONAL/Greece_Milos000098110033.jpg',
  '/hwa-5.webp',
  '/PERSONAL/VicLentaigne-Tboys-Roll6 1024.jpg',
];

export default function HolographicProjection({ onLoadComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentImage, setCurrentImage] = useState(0);
  const [particles, setParticles] = useState<Array<{ x: number; y: number; delay: number }>>([]);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Generate particles
    const newParticles = Array.from({ length: 100 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
    }));
    setParticles(newParticles);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setIsComplete(true);
            setTimeout(() => onLoadComplete(), 1000);
          }, 500);
          return 100;
        }
        return prev + 1.5;
      });
    }, 40);

    const imageInterval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % IMAGES.length);
    }, 600);

    return () => {
      clearInterval(progressInterval);
      clearInterval(imageInterval);
    };
  }, [onLoadComplete]);

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
          style={{
            background: 'radial-gradient(circle at 50% 50%, #001a00 0%, #000000 100%)',
          }}
        >
          {/* Particle Field */}
          {particles.map((particle, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-[#00ff00] rounded-full"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: particle.delay,
              }}
            />
          ))}

          {/* 3D Holographic Image */}
          <div className="relative perspective-[1000px]">
            <motion.div
              animate={{
                rotateY: [0, 360],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="relative w-[400px] h-[500px]"
              style={{
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Front Face */}
              <motion.div
                key={`front-${currentImage}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0"
                style={{
                  transform: 'translateZ(50px)',
                  backfaceVisibility: 'hidden',
                }}
              >
                <img
                  src={IMAGES[currentImage]}
                  alt="Hologram"
                  className="w-full h-full object-cover"
                  style={{
                    filter: 'brightness(1.5) contrast(1.2) hue-rotate(90deg)',
                    mixBlendMode: 'screen',
                    opacity: 0.8,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#00ff00]/30 via-transparent to-[#00ff00]/30" />
              </motion.div>

              {/* Holographic Scan Lines */}
              <motion.div
                animate={{ y: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  background: 'repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0, 255, 0, 0.1) 4px, rgba(0, 255, 0, 0.1) 8px)',
                  transform: 'translateZ(60px)',
                }}
              />

              {/* Glowing Edges */}
              <div
                className="absolute inset-0"
                style={{
                  transform: 'translateZ(50px)',
                  boxShadow: '0 0 50px rgba(0, 255, 0, 0.5), inset 0 0 50px rgba(0, 255, 0, 0.3)',
                  border: '2px solid #00ff00',
                }}
              />
            </motion.div>

            {/* Projection Base */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute bottom-[-50px] left-1/2 transform -translate-x-1/2 w-[200px] h-[200px]"
            >
              <div className="w-full h-full rounded-full border-4 border-[#00ff00] bg-[#00ff00]/10"
                style={{
                  boxShadow: '0 0 100px rgba(0, 255, 0, 0.5)',
                }}
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-4 rounded-full border-2 border-[#00ff00]/50"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-8 rounded-full border-2 border-[#00ff00]/30"
              />
            </motion.div>
          </div>

          {/* Branding with Glitch */}
          <motion.div
            animate={{
              x: [0, -2, 2, -1, 1, 0],
              textShadow: [
                '0 0 20px rgba(0, 255, 0, 0.5)',
                '-5px 0 20px rgba(255, 0, 255, 0.5)',
                '5px 0 20px rgba(0, 255, 255, 0.5)',
                '0 0 20px rgba(0, 255, 0, 0.5)',
              ],
            }}
            transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 3 }}
            className="absolute top-20 left-0 right-0 text-center"
          >
            <h1
              className="text-7xl md:text-8xl font-black uppercase tracking-tighter"
              style={{
                color: '#00ff00',
                textShadow: '0 0 30px rgba(0, 255, 0, 0.8)',
              }}
            >
              VIC LENTAIGNE
            </h1>
            <p className="font-mono text-sm uppercase tracking-widest text-[#00ff00] mt-4">
              [ HOLOGRAPHIC PROJECTION INITIALIZING ]
            </p>
          </motion.div>

          {/* Loading Progress */}
          <div className="absolute bottom-20 left-0 right-0 px-20">
            <div className="relative">
              {/* Main Progress Bar */}
              <div className="h-2 bg-black border-2 border-[#00ff00] overflow-hidden relative"
                style={{ boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)' }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-[#00ff00] relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse" />
                </motion.div>
              </div>

              {/* Progress Text */}
              <div className="flex justify-between mt-2 font-mono text-xs text-[#00ff00]">
                <span>LOADING...</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          </div>

          {/* Data Stream Effect */}
          <div className="absolute left-10 top-1/4 h-1/2 overflow-hidden opacity-30">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 500, opacity: [0, 1, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: 'linear',
                }}
                className="font-mono text-[#00ff00] text-xs"
              >
                {Math.random().toString(36).substring(7)}
              </motion.div>
            ))}
          </div>

          <div className="absolute right-10 top-1/4 h-1/2 overflow-hidden opacity-30">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 500, opacity: [0, 1, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.1 + 1,
                  ease: 'linear',
                }}
                className="font-mono text-[#00ff00] text-xs"
              >
                {Math.random().toString(36).substring(7)}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
