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

export default function GlitchGallery({ onLoadComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentImage, setCurrentImage] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setIsComplete(true);
            setTimeout(() => onLoadComplete(), 500);
          }, 300);
          return 100;
        }
        return prev + 3;
      });
    }, 40);

    const imageInterval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % IMAGES.length);
      setGlitch(true);
      setTimeout(() => setGlitch(false), 100);
    }, 200);

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
        >
          {/* VHS Scanlines */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00ff00 2px, #00ff00 4px)',
              }}
            />
          </div>

          {/* Main Image Display */}
          <div className="relative w-full h-full flex items-center justify-center">
            <motion.div
              key={currentImage}
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                x: glitch ? [0, -20, 20, -10, 10, 0] : 0,
                filter: glitch
                  ? 'hue-rotate(90deg) saturate(3) contrast(2)'
                  : 'hue-rotate(0deg) saturate(1) contrast(1)',
              }}
              transition={{ duration: 0.1 }}
              className="relative w-[80vw] h-[80vh]"
            >
              <img
                src={IMAGES[currentImage]}
                alt="Loading"
                className="w-full h-full object-contain"
                style={{
                  filter: 'contrast(1.2) brightness(0.9)',
                }}
              />

              {/* RGB Split Effect */}
              {glitch && (
                <>
                  <div
                    className="absolute inset-0 mix-blend-screen opacity-70"
                    style={{
                      backgroundImage: `url(${IMAGES[currentImage]})`,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      filter: 'brightness(0) invert(1)',
                      transform: 'translateX(-5px)',
                      clipPath: 'inset(0 0 0 50%)',
                    }}
                  />
                  <div
                    className="absolute inset-0 mix-blend-screen opacity-70"
                    style={{
                      backgroundImage: `url(${IMAGES[currentImage]})`,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      filter: 'brightness(0) sepia(1) hue-rotate(60deg) saturate(5)',
                      transform: 'translateX(5px)',
                      clipPath: 'inset(0 50% 0 0)',
                    }}
                  />
                </>
              )}
            </motion.div>
          </div>

          {/* Glitch Branding */}
          <motion.div
            animate={{
              x: glitch ? [0, -10, 10, -5, 5, 0] : 0,
              skewX: glitch ? [0, -5, 5, 0] : 0,
            }}
            className="absolute top-20 left-0 right-0 text-center"
          >
            <h1
              className="text-6xl md:text-8xl font-black uppercase tracking-tighter"
              style={{
                color: '#00ff00',
                textShadow: glitch
                  ? '-2px 0 #ff00ff, 2px 0 #00ffff, 0 0 20px #00ff00'
                  : '0 0 20px #00ff00',
              }}
            >
              VIC LENTAIGNE
            </h1>
          </motion.div>

          {/* Loading Bar - VHS Style */}
          <div className="absolute bottom-20 left-0 right-0 px-20">
            <div className="relative h-8 border-4 border-[#00ff00] bg-black overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-[#00ff00] relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              </motion.div>
              <p className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold text-black mix-blend-difference">
                LOADING... {Math.round(progress)}%
              </p>
            </div>
          </div>

          {/* Tracking Indicator */}
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="absolute top-10 right-10 font-mono text-[#00ff00] text-sm"
          >
            ● REC {new Date().toLocaleTimeString()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
