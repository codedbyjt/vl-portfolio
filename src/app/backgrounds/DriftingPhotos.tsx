import { useEffect, useRef, useState } from 'react';

const IMAGES = [
  '/hwa-1.webp', '/hwa-2.webp', '/hwa-3.webp', '/hwa-4.webp',
  '/hwa-5.webp', '/hwa-6.webp', '/landing-pic-2.webp', '/torsoa3poster.webp',
];

interface Particle {
  x: number; y: number; vx: number; vy: number;
  w: number; h: number; opacity: number; src: string; rotate: number;
  // colour flicker state
  colourFlicker: boolean; flickerTimer: number; flickerDuration: number;
  nextFlicker: number;
}

export default function DriftingPhotos() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const frameRef = useRef(0);

  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const initial: Particle[] = Array.from({ length: 10 }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 0.8,
      w: 160 + Math.random() * 140,
      h: 110 + Math.random() * 90,
      opacity: 0.08 + Math.random() * 0.12,
      src: IMAGES[i % IMAGES.length],
      rotate: (Math.random() - 0.5) * 10,
      colourFlicker: false,
      flickerTimer: 0,
      flickerDuration: 0,
      nextFlicker: 60 + Math.random() * 180, // frames until next flicker
    }));
    setParticles(initial);

    let raf: number;
    const tick = () => {
      frameRef.current++;
      setParticles(prev => prev.map(p => {
        let { colourFlicker, flickerTimer, flickerDuration, nextFlicker } = p;

        flickerTimer++;

        if (!colourFlicker && flickerTimer >= nextFlicker) {
          // start a colour flicker
          colourFlicker = true;
          flickerDuration = 8 + Math.floor(Math.random() * 20);
          flickerTimer = 0;
        } else if (colourFlicker && flickerTimer >= flickerDuration) {
          // end flicker
          colourFlicker = false;
          flickerTimer = 0;
          nextFlicker = 80 + Math.random() * 220;
        }

        return {
          ...p,
          x: ((p.x + p.vx + window.innerWidth) % window.innerWidth),
          y: ((p.y + p.vy + window.innerHeight) % window.innerHeight),
          colourFlicker,
          flickerTimer,
          flickerDuration,
          nextFlicker,
        };
      }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="absolute inset-0 bg-black overflow-hidden">
      {/* Muted autoplay YouTube video as base layer */}
      <iframe
        src="https://www.youtube.com/embed/iHMOYP-L4jc?autoplay=1&mute=1&loop=1&playlist=iHMOYP-L4jc&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1"
        className="absolute pointer-events-none"
        style={{
          top: '50%', left: '50%',
          width: '177.78vh', height: '100vh',
          minWidth: '100%', minHeight: '56.25vw',
          transform: 'translate(-50%, -50%)',
          opacity: 0.25,
          border: 'none',
        }}
        allow="autoplay; encrypted-media"
        title="background"
      />
      {/* Subtle green vignette pulse */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,255,0,0.04) 100%)',
        }}
      />

      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute pointer-events-none overflow-hidden"
          style={{
            left: p.x, top: p.y, width: p.w, height: p.h,
            transform: `rotate(${p.rotate}deg)`,
            opacity: p.colourFlicker ? p.opacity * 2.5 : p.opacity,
            transition: 'opacity 0.05s',
            willChange: 'transform, opacity',
          }}
        >
          <img
            src={p.src}
            alt=""
            className="w-full h-full object-cover"
            style={{
              filter: p.colourFlicker
                ? 'none'
                : 'grayscale(100%)',
              transition: 'filter 0.05s',
            }}
          />
          {/* Green tint overlay during flicker */}
          {p.colourFlicker && (
            <div className="absolute inset-0"
              style={{ background: 'rgba(0,255,0,0.15)', mixBlendMode: 'screen' }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
