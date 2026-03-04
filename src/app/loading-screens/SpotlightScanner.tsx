import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  onLoadComplete: () => void;
}

const IMAGES = [
  '/hwa-1.webp',
  '/hwa-2.webp',
  '/PERSONAL/Greece_Milos000098110033.jpg',
  '/hwa-4.webp',
  '/PERSONAL/VicLentaigne-Tboys-Roll6 1024.jpg',
  '/hwa-6.webp',
];

export default function SpotlightScanner({ onLoadComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [scanPosition, setScanPosition] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setIsComplete(true);
            setTimeout(() => onLoadComplete(), 800);
          }, 500);
          return 100;
        }
        return prev + 1.5;
      });
    }, 40);

    const scanInterval = setInterval(() => {
      setScanPosition((prev) => (prev >= 100 ? 0 : prev + 2));
    }, 30);

    return () => {
      clearInterval(progressInterval);
      clearInterval(scanInterval);
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
          {/* Red darkroom light effect */}
          <div className="absolute inset-0 bg-red-950/20" />

          {/* Image Collage */}
          <div className="relative grid grid-cols-3 grid-rows-2 gap-4 w-full max-w-5xl h-[70vh] p-8">
            {IMAGES.map((src, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, filter: 'brightness(0) contrast(1.5)' }}
                animate={{
                  opacity: 1,
                  filter: `brightness(${Math.max(0, 1 - Math.abs(scanPosition - (index * 16.66)) / 50)}) contrast(1.5) grayscale(${Math.max(0, Math.abs(scanPosition - (index * 16.66)) / 50)})`,
                }}
                className="relative overflow-hidden border-2 border-[#00ff00]"
              >
                <img src={src} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50" />
              </motion.div>
            ))}

            {/* Scanning Light Beam */}
            <motion.div
              animate={{ x: `${scanPosition * 10}px`, y: `${scanPosition * 5}px` }}
              className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-transparent via-[#00ff00]/60 to-transparent blur-xl pointer-events-none"
              style={{
                boxShadow: '0 0 100px 50px rgba(0, 255, 0, 0.3)',
              }}
            />
          </div>

          {/* Developing Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black"
            />
          </div>

          {/* Development Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-10 left-0 right-0 text-center"
          >
            <h1
              className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-transparent mb-4"
              style={{ WebkitTextStroke: '3px #00ff00' }}
            >
              VIC LENTAIGNE
            </h1>
            <p className="font-mono text-sm uppercase tracking-widest text-[#00ff00]">
              Developing... {Math.round(progress)}%
            </p>
          </motion.div>

          {/* Vintage Dev Timer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-4"
          >
            <div className="font-mono text-6xl text-[#00ff00] tabular-nums">
              {Math.floor(progress / 60)}:{String(Math.floor(progress % 60)).padStart(2, '0')}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
