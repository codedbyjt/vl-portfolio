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

export default function QuantumSplitter({ onLoadComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [splitCount, setSplitCount] = useState(1);
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
        return prev + 2;
      });
    }, 40);

    return () => clearInterval(progressInterval);
  }, [onLoadComplete]);

  useEffect(() => {
    // Increase splits as progress increases
    setSplitCount(Math.min(16, Math.floor(progress / 6.25) + 1));
  }, [progress]);

  const splits = Array.from({ length: splitCount }, (_, i) => ({
    index: i,
    offset: (i - splitCount / 2) * 20,
    rotation: (i - splitCount / 2) * 5,
    opacity: 1 - Math.abs(i - splitCount / 2) / (splitCount / 2),
    scale: 1 - Math.abs(i - splitCount / 2) * 0.05,
    imageIndex: i % IMAGES.length,
  }));

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
          style={{
            background: 'radial-gradient(circle at 50% 50%, #1a0033 0%, #000000 100%)',
          }}
        >
          {/* Quantum Field Background */}
          <div className="absolute inset-0">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  x: [0, Math.random() * 100 - 50],
                  y: [0, Math.random() * 100 - 50],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              >
                <div className="w-2 h-2 bg-[#00ff00] rounded-full blur-sm" />
              </motion.div>
            ))}
          </div>

          {/* Split Images */}
          <div className="relative w-[600px] h-[400px]">
            {splits.map((split) => (
              <motion.div
                key={split.index}
                className="absolute inset-0"
                initial={{ x: 0, opacity: 0 }}
                animate={{
                  x: split.offset,
                  rotate: split.rotation,
                  opacity: split.opacity,
                  scale: split.scale,
                  z: split.index * 10,
                }}
                transition={{ duration: 0.3 }}
                style={{
                  transformStyle: 'preserve-3d',
                }}
              >
                <img
                  src={IMAGES[split.imageIndex]}
                  alt={`Split ${split.index}`}
                  className="w-full h-full object-cover"
                  style={{
                    filter: `hue-rotate(${split.index * 20}deg) brightness(${0.8 + split.opacity * 0.4})`,
                    boxShadow: `0 0 ${20 + split.index * 5}px rgba(0, 255, 0, ${split.opacity * 0.5})`,
                    border: '2px solid rgba(0, 255, 0, 0.5)',
                  }}
                />
                
                {/* Quantum Lines connecting splits */}
                {split.index < splitCount - 1 && (
                  <svg
                    className="absolute top-1/2 left-full w-20 h-2"
                    style={{ transform: 'translateY(-50%)' }}
                  >
                    <motion.line
                      x1="0"
                      y1="1"
                      x2="80"
                      y2="1"
                      stroke="#00ff00"
                      strokeWidth="2"
                      animate={{
                        strokeDashoffset: [0, -20],
                      }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      strokeDasharray="10 10"
                    />
                  </svg>
                )}
              </motion.div>
            ))}
          </div>

          {/* Particle Connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
            {splits.slice(0, -1).map((split, i) => (
              <motion.line
                key={i}
                x1={`${50 + (split.offset / 12)}%`}
                y1="50%"
                x2={`${50 + (splits[i + 1].offset / 12)}%`}
                y2="50%"
                stroke="#00ff00"
                strokeWidth="1"
                animate={{
                  opacity: [0.2, 0.8, 0.2],
                }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </svg>

          {/* Branding */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute top-16 left-0 right-0 text-center"
          >
            <motion.h1
              animate={{
                textShadow: [
                  '0 0 20px rgba(0, 255, 0, 0.5)',
                  '0 0 40px rgba(0, 255, 0, 0.8), 0 0 60px rgba(0, 255, 0, 0.4)',
                  '0 0 20px rgba(0, 255, 0, 0.5)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-7xl md:text-8xl font-black uppercase tracking-tighter text-[#00ff00]"
            >
              VIC LENTAIGNE
            </motion.h1>
            <p className="font-mono text-sm uppercase tracking-widest text-[#00ff00] mt-4 opacity-70">
              [ QUANTUM IMAGE SYNTHESIS ]
            </p>
          </motion.div>

          {/* Progress Display */}
          <div className="absolute bottom-16 left-0 right-0">
            <div className="max-w-2xl mx-auto px-8">
              {/* Split Counter */}
              <div className="text-center mb-4">
                <span className="font-mono text-3xl text-[#00ff00] tabular-nums">
                  {splitCount} DIMENSION{splitCount !== 1 ? 'S' : ''}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative h-1 bg-black border border-[#00ff00] overflow-hidden">
                {[...Array(splitCount)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-full bg-[#00ff00]"
                    style={{
                      left: `${(i / splitCount) * 100}%`,
                      width: `${100 / splitCount}%`,
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{
                      scaleX: progress >= (i / splitCount) * 100 ? 1 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </div>

              <div className="flex justify-between mt-2 font-mono text-xs text-[#00ff00]">
                <span>COLLAPSING WAVEFORM</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          </div>

          {/* Quantum Equations Floating */}
          {['E=mc²', 'Ψ(x,t)', 'ℏω', '∆x∆p≥ℏ/2'].map((eq, i) => (
            <motion.div
              key={i}
              className="absolute font-mono text-[#00ff00] opacity-20"
              style={{
                left: `${20 + i * 20}%`,
                top: `${30 + (i % 2) * 40}%`,
              }}
              animate={{
                y: [-20, 20, -20],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            >
              {eq}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
