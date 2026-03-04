import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  onLoadComplete: () => void;
}

const PREVIEW_ITEMS = [
  { type: 'image', src: '/hwa-1.webp', alt: 'Editorial Work' },
  { type: 'image', src: '/hwa-2.webp', alt: 'Editorial Work' },
  { type: 'image', src: '/hwa-3.webp', alt: 'Editorial Work' },
  { type: 'image', src: '/PERSONAL/Greece_Milos000098110033.jpg', alt: 'Personal Work' },
  { type: 'image', src: '/hwa-4.webp', alt: 'Editorial Work' },
  { type: 'image', src: '/PERSONAL/VicLentaigne-Tboys-Roll6 1024.jpg', alt: 'Personal Work' },
  { type: 'image', src: '/hwa-5.webp', alt: 'Editorial Work' },
  { type: 'video', src: '/shorts-placeholder.jpg', alt: 'Film Work' }, // Placeholder for video
];

export default function LoadingScreen({ onLoadComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Simulate loading progress
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
        return prev + 2;
      });
    }, 40); // Complete in ~2 seconds

    // Cycle through images faster for film strip effect
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % PREVIEW_ITEMS.length);
    }, 300); // Change image every 300ms for dynamic feel

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
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Film strip effect - scrolling images */}
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            
            {/* Film strip perforation lines - top */}
            <div className="absolute top-0 left-0 right-0 h-8 flex gap-4 px-4 bg-black border-b-2 border-[#00ff00] z-10">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={`top-${i}`} className="w-4 h-4 bg-[#00ff00] rounded-sm my-2 flex-shrink-0" />
              ))}
            </div>

            {/* Film strip perforation lines - bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-8 flex gap-4 px-4 bg-black border-t-2 border-[#00ff00] z-10">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={`bottom-${i}`} className="w-4 h-4 bg-[#00ff00] rounded-sm my-2 flex-shrink-0" />
              ))}
            </div>

            {/* Scrolling film strip */}
            <motion.div
              animate={{ x: [0, -100] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-0 flex items-center"
            >
              <div className="flex gap-2 h-full py-12">
                {[...PREVIEW_ITEMS, ...PREVIEW_ITEMS].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0.3, scale: 0.95 }}
                    animate={{ 
                      opacity: index === currentImageIndex || index === currentImageIndex + PREVIEW_ITEMS.length ? 1 : 0.3,
                      scale: index === currentImageIndex || index === currentImageIndex + PREVIEW_ITEMS.length ? 1 : 0.95,
                    }}
                    className="relative flex-shrink-0 h-full aspect-[3/4] border-4 border-[#00ff00] bg-black overflow-hidden"
                  >
                    <img
                      src={item.src}
                      alt={item.alt}
                      className="w-full h-full object-cover"
                    />
                    {item.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <svg className="w-16 h-16 text-[#00ff00]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Center overlay with branding */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/80 backdrop-blur-sm px-12 py-8 border-4 border-[#00ff00] shadow-[0_0_50px_rgba(0,255,0,0.5)]">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter text-transparent mb-4"
                  style={{ WebkitTextStroke: "3px #00ff00" }}
                >
                  VIC LENTAIGNE
                </motion.h1>

                {/* Loading bar */}
                <div className="w-full h-3 bg-black border-2 border-[#00ff00] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-[#00ff00]"
                    transition={{ duration: 0.1 }}
                  />
                </div>

                {/* Loading text */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center font-mono text-xs md:text-sm uppercase tracking-widest text-[#00ff00] mt-4"
                >
                  Loading Portfolio... {Math.round(progress)}%
                </motion.p>

                {/* Film roll indicator */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-8 -right-8 w-16 h-16 border-4 border-[#00ff00] rounded-full flex items-center justify-center bg-black"
                >
                  <div className="w-8 h-8 border-2 border-[#00ff00] rounded-full" />
                </motion.div>

                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute -bottom-8 -left-8 w-16 h-16 border-4 border-[#00ff00] rounded-full flex items-center justify-center bg-black"
                >
                  <div className="w-8 h-8 border-2 border-[#00ff00] rounded-full" />
                </motion.div>
              </div>
            </div>
          </div>

          {/* Scanline effect */}
          <motion.div
            animate={{ y: ['0%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00ff00]/10 to-transparent h-20 pointer-events-none"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
