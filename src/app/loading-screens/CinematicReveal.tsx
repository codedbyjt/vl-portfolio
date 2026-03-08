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
  '/hwa-6.webp',
  '/PERSONAL/greg-viclentaigne (1).jpg',
];

export default function CinematicReveal({ onLoadComplete }: LoadingScreenProps) {
  const [stage, setStage] = useState('countdown');
  const [countdown, setCountdown] = useState(3);
  const [currentImage, setCurrentImage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Stage 1: Countdown (3-2-1)
    if (stage === 'countdown') {
      const countInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countInterval);
            setTimeout(() => setStage('iris'), 500);
            return 0;
          }
          return prev - 1;
        });
      }, 800);
      return () => clearInterval(countInterval);
    }

    // Stage 2: Iris Opening
    if (stage === 'iris') {
      setTimeout(() => setStage('gallery'), 1500);
    }

    // Stage 3: Rapid Gallery
    if (stage === 'gallery') {
      const imageInterval = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % IMAGES.length);
      }, 150);

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            clearInterval(imageInterval);
            setTimeout(() => setStage('explode'), 300);
            return 100;
          }
          return prev + 4;
        });
      }, 50);

      return () => {
        clearInterval(imageInterval);
        clearInterval(progressInterval);
      };
    }

    // Stage 4: Explode to Site
    if (stage === 'explode') {
      setTimeout(() => onLoadComplete(), 800);
    }
  }, [stage, onLoadComplete]);

  return (
    <AnimatePresence mode="wait">
      {stage !== 'explode' ? (
        <motion.div
          key="loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 10 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] bg-black overflow-hidden"
        >
          {/* Stage 1: Film Countdown */}
          {stage === 'countdown' && countdown > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {/* Film Leader Circle */}
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, ease: 'linear' }}
                  className="w-96 h-96 border-8 border-[#00ff00] rounded-full relative"
                >
                  {/* Cross hair marks */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-1 bg-[#00ff00]" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-full w-1 bg-[#00ff00]" />
                  </div>
                  
                  {/* Corner marks */}
                  <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-[#00ff00]" />
                  <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-[#00ff00]" />
                  <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-[#00ff00]" />
                  <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-[#00ff00]" />
                </motion.div>

                {/* Countdown Number */}
                <motion.div
                  key={countdown}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="text-[200px] font-black text-[#00ff00]">
                    {countdown}
                  </span>
                </motion.div>
              </div>

              {/* Film grain overlay */}
              <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] animate-pulse" />
              </div>
            </motion.div>
          )}

          {/* Stage 2: Camera Iris Opening */}
          {stage === 'iris' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 100 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-20 h-20 rounded-full bg-[#00ff00] shadow-[0_0_100px_50px_rgba(0,255,0,0.8)]">
                {/* Central iris point */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, ease: 'linear', repeat: Infinity }}
                  className="w-full h-full rounded-full border-4 border-black"
                />
              </div>
            </motion.div>
          )}

          {/* Stage 3: High-Speed Gallery with Effects */}
          {stage === 'gallery' && (
            <>
              {/* Background Image Display */}
              <motion.div
                key={currentImage}
                initial={{ opacity: 0, scale: 1.2, rotate: Math.random() * 10 - 5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0"
              >
                <img
                  src={IMAGES[currentImage]}
                  alt="Loading"
                  className="w-full h-full object-cover"
                  style={{
                    filter: 'brightness(0.7) contrast(1.3) saturate(1.2)',
                  }}
                />
                {/* Color overlay */}
                <div className="absolute inset-0 bg-[#00ff00] mix-blend-color opacity-20" />
              </motion.div>

              {/* Particle Effects */}
              <div className="absolute inset-0 overflow-hidden">
                {Array.from({ length: 30 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      x: Math.random() * window.innerWidth,
                      y: window.innerHeight + 100,
                      opacity: 0,
                    }}
                    animate={{
                      y: -100,
                      opacity: [0, 1, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      delay: Math.random() * 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="absolute w-1 h-20 bg-[#00ff00]"
                    style={{
                      boxShadow: '0 0 10px #00ff00',
                    }}
                  />
                ))}
              </div>

              {/* Center Branding with Glow */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    textShadow: [
                      '0 0 20px #00ff00',
                      '0 0 40px #00ff00',
                      '0 0 20px #00ff00',
                    ],
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="relative"
                >
                  <h1
                    className="text-7xl md:text-9xl font-black uppercase tracking-tighter"
                    style={{
                      color: '#00ff00',
                      textShadow: '0 0 30px #00ff00, 0 0 60px #00ff00',
                    }}
                  >
                    VIC LENTAIGNE
                  </h1>
                  
                  {/* Animated underline */}
                  <motion.div
                    animate={{ scaleX: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-2 bg-[#00ff00] mt-4 origin-left"
                    style={{
                      boxShadow: '0 0 20px #00ff00',
                    }}
                  />
                </motion.div>

                {/* Circular Progress Bar */}
                <div className="relative w-64 h-64 mt-12">
                  <svg className="transform -rotate-90 w-full h-full">
                    <circle
                      cx="128"
                      cy="128"
                      r="120"
                      stroke="#333"
                      strokeWidth="8"
                      fill="none"
                    />
                    <motion.circle
                      cx="128"
                      cy="128"
                      r="120"
                      stroke="#00ff00"
                      strokeWidth="8"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: progress / 100 }}
                      style={{
                        filter: 'drop-shadow(0 0 10px #00ff00)',
                      }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl font-black text-[#00ff00]">
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>

                <p className="text-xl font-mono uppercase tracking-widest text-[#00ff00] mt-8">
                  Preparing Experience...
                </p>
              </div>

              {/* Scanlines */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <div
                  className="h-full w-full"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(0deg, transparent, transparent 2px, #00ff00 2px, #00ff00 4px)',
                  }}
                />
              </div>

              {/* Edge Vignette */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-radial from-transparent via-transparent to-black" />
            </>
          )}

          {/* Stage 4: Explosion Transition */}
          {stage === 'explode' && (
            <motion.div
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 50, opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeIn' }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-40 h-40 rounded-full bg-[#00ff00]" style={{
                boxShadow: '0 0 200px 100px rgba(0, 255, 0, 0.8)',
              }} />
            </motion.div>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
