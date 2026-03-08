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

export default function CameraAperture({ onLoadComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [aperture, setAperture] = useState(0);
  const [currentImage, setCurrentImage] = useState(0);
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
        return prev + 1.5;
      });
    }, 40);

    const imageInterval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % IMAGES.length);
    }, 800);

    return () => {
      clearInterval(progressInterval);
      clearInterval(imageInterval);
    };
  }, [onLoadComplete]);

  useEffect(() => {
    setAperture(progress);
  }, [progress]);

  // Calculate aperture blade positions
  const bladeCount = 8;
  const blades = Array.from({ length: bladeCount }, (_, i) => {
    const angle = (i * 360) / bladeCount;
    const openness = aperture / 100;
    return { angle, openness };
  });

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
        >
          {/* Background Image */}
          <motion.div
            key={currentImage}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.3 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <img
              src={IMAGES[currentImage]}
              alt="Background"
              className="w-full h-full object-cover blur-xl"
            />
          </motion.div>

          {/* Camera Aperture */}
          <div className="relative w-[600px] h-[600px] flex items-center justify-center">
            {/* Center Image visible through aperture */}
            <motion.div
              style={{
                clipPath: `circle(${aperture / 2}% at 50% 50%)`,
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <motion.img
                key={currentImage}
                initial={{ scale: 1.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8 }}
                src={IMAGES[currentImage]}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Aperture Blades */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 600">
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {blades.map((blade, i) => {
                const centerX = 300;
                const centerY = 300;
                const radius = 250;
                const innerRadius = radius * (1 - blade.openness * 0.7);
                
                const angle1 = (blade.angle - 22.5) * (Math.PI / 180);
                const angle2 = (blade.angle + 22.5) * (Math.PI / 180);

                const x1 = centerX + Math.cos(angle1) * radius;
                const y1 = centerY + Math.sin(angle1) * radius;
                const x2 = centerX + Math.cos(angle2) * radius;
                const y2 = centerY + Math.sin(angle2) * radius;
                const x3 = centerX + Math.cos(angle2) * innerRadius;
                const y3 = centerY + Math.sin(angle2) * innerRadius;
                const x4 = centerX + Math.cos(angle1) * innerRadius;
                const y4 = centerY + Math.sin(angle1) * innerRadius;

                return (
                  <motion.path
                    key={i}
                    d={`M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4} Z`}
                    fill="#111"
                    stroke="#00ff00"
                    strokeWidth="2"
                    filter="url(#glow)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                  />
                );
              })}
              
              {/* Outer ring */}
              <circle
                cx="300"
                cy="300"
                r="280"
                fill="none"
                stroke="#00ff00"
                strokeWidth="4"
                filter="url(#glow)"
              />
              
              {/* Inner mechanical details */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <motion.line
                  key={i}
                  x1="300"
                  y1="300"
                  x2={300 + Math.cos((angle * Math.PI) / 180) * 40}
                  y2={300 + Math.sin((angle * Math.PI) / 180) * 40}
                  stroke="#00ff00"
                  strokeWidth="2"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </svg>

            {/* F-Stop Indicator */}
            <motion.div
              animate={{ rotate: progress * 3.6 }}
              className="absolute top-8 right-8"
            >
              <div className="w-20 h-20 rounded-full border-4 border-[#00ff00] flex items-center justify-center bg-black">
                <span className="text-[#00ff00] font-mono text-xl font-bold">
                  f/{(16 - (progress / 100) * 14).toFixed(1)}
                </span>
              </div>
            </motion.div>

            {/* Shutter Speed */}
            <div className="absolute top-8 left-8">
              <div className="px-4 py-2 border-2 border-[#00ff00] bg-black">
                <span className="text-[#00ff00] font-mono text-sm">
                  1/{Math.floor(8000 - (progress / 100) * 7900)}
                </span>
              </div>
            </div>

            {/* ISO */}
            <div className="absolute bottom-8 left-8">
              <div className="px-4 py-2 border-2 border-[#00ff00] bg-black">
                <span className="text-[#00ff00] font-mono text-sm">
                  ISO {Math.floor(100 + (progress / 100) * 3100)}
                </span>
              </div>
            </div>
          </div>

          {/* Branding */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-20 left-0 right-0 text-center"
          >
            <h1
              className="text-6xl md:text-7xl font-black uppercase tracking-tighter text-transparent mb-4"
              style={{ WebkitTextStroke: '3px #00ff00' }}
            >
              VIC LENTAIGNE
            </h1>
            <p className="font-mono text-lg uppercase tracking-widest text-[#00ff00]">
              Focusing... {Math.round(progress)}%
            </p>
          </motion.div>

          {/* Focus Points */}
          {[...Array(9)].map((_, i) => {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const isActive = progress > i * 11;
            return (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: isActive ? 1 : 0 }}
                className="absolute"
                style={{
                  left: `${30 + col * 20}%`,
                  top: `${30 + row * 20}%`,
                }}
              >
                <div className={`w-8 h-8 border-2 ${isActive ? 'border-[#00ff00]' : 'border-gray-600'}`}>
                  {isActive && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-1 h-1 bg-[#00ff00] rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
