import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  onLoadComplete: () => void;
}

const POLAROID_IMAGES = [
  { src: '/hwa-1.webp', caption: 'Editorial' },
  { src: '/hwa-3.webp', caption: 'Fashion' },
  { src: '/PERSONAL/Greece_Milos000098110033.jpg', caption: 'Travel' },
  { src: '/PERSONAL/greg-viclentaigne (1).jpg', caption: 'Portrait' },
  { src: '/hwa-5.webp', caption: 'Studio' },
];

export default function PolaroidStack({ onLoadComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentCard, setCurrentCard] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
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
        return prev + 2;
      });
    }, 40);

    const cardInterval = setInterval(() => {
      setCurrentCard((prev) => (prev + 1) % POLAROID_IMAGES.length);
    }, 500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(cardInterval);
    };
  }, [onLoadComplete]);

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-gradient-to-br from-gray-900 to-black flex items-center justify-center"
        >
          {/* Polaroid Stack */}
          <div className="relative w-[350px] h-[450px]">
            {POLAROID_IMAGES.map((polaroid, index) => {
              const offset = (POLAROID_IMAGES.length - 1 - index) * 10;
              const rotation = (index - 2) * 5;
              const isActive = index === currentCard;
              const isPast = index < currentCard;

              return (
                <motion.div
                  key={index}
                  initial={{ y: offset, rotate: rotation, scale: 1 }}
                  animate={
                    isPast
                      ? {
                          x: [0, -1000, -1000],
                          y: [offset, offset - 100, offset - 100],
                          rotate: [rotation, rotation - 45, rotation - 45],
                          opacity: [1, 0.5, 0],
                          scale: [1, 0.8, 0],
                        }
                      : {
                          y: offset,
                          rotate: isActive ? 0 : rotation,
                          scale: isActive ? 1.05 : 1,
                        }
                  }
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0 bg-white p-4 shadow-2xl"
                  style={{
                    boxShadow: isActive
                      ? '0 25px 50px -12px rgba(0, 255, 0, 0.4)'
                      : '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <div className="w-full h-[350px] bg-gray-200 overflow-hidden">
                    <img
                      src={polaroid.src}
                      alt={polaroid.caption}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="mt-4 text-center font-handwriting text-2xl text-gray-800">
                    {polaroid.caption}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Loading Stamp */}
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: -12 }}
            transition={{ delay: 0.3 }}
            className="absolute top-20 right-20 border-4 border-[#00ff00] px-8 py-4 rotate-12"
          >
            <p className="text-4xl font-black uppercase tracking-wider text-[#00ff00]">
              LOADING...
            </p>
          </motion.div>

          {/* Branding */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-10 left-0 right-0 text-center"
          >
            <h1
              className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-transparent"
              style={{ WebkitTextStroke: '2px #00ff00' }}
            >
              VIC LENTAIGNE
            </h1>
            <div className="w-64 mx-auto mt-4 h-1 bg-[#00ff00]/30">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-[#00ff00]"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
