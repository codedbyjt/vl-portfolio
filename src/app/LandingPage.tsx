import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [imagePool, setImagePool] = useState<string[]>([]);
  const [slots, setSlots] = useState<{ src: string; key: number }[]>([]);
  const keyRef = useRef(100);

  useEffect(() => {
    supabase
      .from('photos')
      .select('url')
      .eq('home_featured', true)
      .then(({ data }) => {
        if (!data || data.length === 0) return; // nothing featured yet — show blank
        const pool = shuffle(data.map((r: { url: string }) => r.url));
        setImagePool(pool);
        // Pick first 4 unique images (deduplicated)
        const initial = pool.filter((url, i, arr) => arr.indexOf(url) === i).slice(0, 4);
        setSlots(initial.map((src, i) => ({ src, key: i })));
      });
  }, []);

  useEffect(() => {
    if (imagePool.length === 0) return;
    const interval = setInterval(() => {
      setSlots(prev => {
        const slot = Math.floor(Math.random() * 4);
        const currentSrcs = prev.map(s => s.src);
        // Prefer images not currently shown at all
        const notShown = shuffle(imagePool.filter(img => !currentSrcs.includes(img)));
        // Fallback: images not in this specific slot (avoids same image re-appearing in same position)
        const notInSlot = shuffle(imagePool.filter(img => img !== prev[slot].src));
        const newSrc = notShown[0] ?? notInSlot[0] ?? prev[slot].src;
        keyRef.current += 1;
        return prev.map((s, i) =>
          i === slot ? { src: newSrc, key: keyRef.current } : s
        );
      });
    }, 2800);
    return () => clearInterval(interval);
  }, [imagePool]);

  if (slots.length === 0) return (
    <div className="bg-white md:grid md:grid-cols-2 md:grid-rows-2 md:gap-3 md:p-4 md:h-[100dvh] md:cursor-pointer md:overflow-hidden"
      onClick={() => navigate('/photography')}>
      {[0,1,2,3].map(i => <div key={i} className="bg-gray-50" />)}
    </div>
  );

  return (
    <div className="bg-white">

      {/* ── Mobile: full-width stacked ── */}
      <div className="md:hidden flex flex-col gap-3" onClick={() => navigate('/photography')}>
        {slots.map((slot, i) => (
          <div key={i} className="relative">
            <AnimatePresence>
              <motion.img
                key={slot.key}
                src={slot.src}
                alt=""
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                className="w-full h-auto block"
              />
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* ── Desktop: 2×2 grid ── */}
      <div
        className="hidden md:grid grid-cols-2 grid-rows-2 gap-3 p-4 h-[100dvh] cursor-pointer overflow-hidden"
        onClick={() => navigate('/photography')}
      >
        {slots.map((slot, i) => (
          <div key={i} className="relative overflow-hidden bg-gray-50">
            <AnimatePresence>
              <motion.img
                key={slot.key}
                src={slot.src}
                alt=""
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                className="absolute inset-0 w-full h-full object-contain"
              />
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
