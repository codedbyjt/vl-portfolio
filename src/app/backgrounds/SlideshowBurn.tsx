import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const IMAGES = [
  '/hwa-1.webp',
  '/hwa-2.webp',
  '/hwa-3.webp',
  '/hwa-4.webp',
  '/hwa-5.webp',
  '/hwa-6.webp',
  '/landing-pic-2.webp',
  '/torsoa3poster.webp',
  '/wrestlea3poster.webp',
  '/17thboys.webp',
];

// Shuffle so it's random every load
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Random Ken Burns: each image gets a unique slow zoom+pan
const KB_VARIANTS = [
  { initial: { scale: 1.08, x: '2%',  y: '2%'  }, animate: { scale: 1,    x: '-2%', y: '-2%' } },
  { initial: { scale: 1,    x: '-2%', y: '-1%' }, animate: { scale: 1.08, x: '2%',  y: '1%'  } },
  { initial: { scale: 1.06, x: '0%',  y: '3%'  }, animate: { scale: 1,    x: '0%',  y: '-3%' } },
  { initial: { scale: 1,    x: '3%',  y: '0%'  }, animate: { scale: 1.07, x: '-3%', y: '0%'  } },
];

export default function SlideshowBurn() {
  const [images] = useState(() => shuffle(IMAGES));
  const [index, setIndex] = useState(0);
  const [burning, setBurning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Advance slide every 5s with a brief burn flash
  useEffect(() => {
    const interval = setInterval(() => {
      setBurning(true);
      setTimeout(() => {
        setIndex(i => (i + 1) % images.length);
        setBurning(false);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, [images]);

  // Animated grain canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let id: number;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const { width: w, height: h } = canvas;
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255;
        d[i] = v; d[i + 1] = v; d[i + 2] = v;
        d[i + 3] = Math.floor(Math.random() * 28);
      }
      ctx.putImageData(img, 0, 0);
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize); };
  }, []);

  const kb = KB_VARIANTS[index % KB_VARIANTS.length];

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">

      {/* Crossfading images with Ken Burns */}
      <AnimatePresence mode="sync">
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        >
          <motion.img
            src={images[index]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            initial={kb.initial}
            animate={kb.animate}
            transition={{ duration: 5.5, ease: 'linear' }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Dark overlay so text stays readable */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Film burn flash on transition */}
      <AnimatePresence>
        {burning && (
          <motion.div
            key="burn"
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, times: [0, 0.3, 1] }}
            style={{ background: 'radial-gradient(ellipse at 60% 40%, rgba(0,255,0,0.6) 0%, rgba(255,255,255,0.3) 40%, transparent 70%)' }}
          />
        )}
      </AnimatePresence>

      {/* Animated grain */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ mixBlendMode: 'overlay', opacity: 0.4 }}
      />

      {/* Subtle vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)' }}
      />
    </div>
  );
}
