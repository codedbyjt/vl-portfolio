import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  onLoadComplete: () => void;
}

const PREVIEW_IMAGES = [
  '/hwa-1.webp',
  '/hwa-2.webp',
  '/hwa-3.webp',
  '/hwa-4.webp',
  '/hwa-5.webp',
  '/hwa-6.webp',
  '/PERSONAL/Greece_Milos000098110033.jpg',
  '/PERSONAL/VicLentaigne-Tboys-Roll6 1024.jpg',
  '/PERSONAL/greg-viclentaigne (1).jpg',
  '/PERSONAL/viclentaigne-2.jpg',
  '/PERSONAL/immy vicy.jpg',
  '/PERSONAL/VicLentaigne_capetown_176 (1).jpg',
];

export default function MosaicReveal({ onLoadComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [revealedTiles, setRevealedTiles] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setIsComplete(true);
            setTimeout(() => onLoadComplete(), 600);
          }, 300);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    // Reveal tiles randomly
    const tileInterval = setInterval(() => {
      setRevealedTiles((prev) => {
        if (prev.length >= 12) return prev;
        const remaining = Array.from({ length: 12 }, (_, i) => i).filter(i => !prev.includes(i));
        if (remaining.length === 0) return prev;
        const randomIndex = remaining[Math.floor(Math.random() * remaining.length)];
        return [...prev, randomIndex];
      });
    }, 150);

    return () => {
      clearInterval(progressInterval);
      clearInterval(tileInterval);
    };
  }, [onLoadComplete]);

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
        >
          {/* Mosaic Grid */}
          <div className="grid grid-cols-4 grid-rows-3 gap-2 w-full max-w-4xl h-[60vh] p-4">
            {PREVIEW_IMAGES.map((src, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5, rotateY: -180 }}
                animate={
                  revealedTiles.includes(index)
                    ? { opacity: 1, scale: 1, rotateY: 0 }
                    : { opacity: 0, scale: 0.5, rotateY: -180 }
                }
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="relative overflow-hidden border-2 border-[#00ff00] bg-black"
              >
                <img
                  src={src}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {!revealedTiles.includes(index) && (
                  <div className="absolute inset-0 bg-[#00ff00]/20 animate-pulse" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Branding Overlay */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-20 left-0 right-0 flex flex-col items-center"
          >
            <h1
              className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-transparent mb-6"
              style={{ WebkitTextStroke: '3px #00ff00' }}
            >
              VIC LENTAIGNE
            </h1>

            {/* Progress Bar */}
            <div className="w-96 max-w-[80vw] h-2 bg-black border-2 border-[#00ff00] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-[#00ff00]"
                transition={{ duration: 0.1 }}
              />
            </div>

            <p className="font-mono text-sm uppercase tracking-widest text-[#00ff00] mt-4">
              Loading Portfolio... {Math.round(progress)}%
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
