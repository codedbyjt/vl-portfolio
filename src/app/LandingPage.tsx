import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "../lib/supabase";

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
      .from("photos")
      .select("url")
      .eq("home_featured", true)
      .neq("visibility", "hidden")
      .then(({ data }) => {
        if (!data || data.length === 0) return; // nothing featured yet — show blank
        const pool = shuffle(data.map((r: { url: string }) => r.url));
        setImagePool(pool);
        // Pick one unique image for the single homepage carousel.
        const initial = pool
          .filter((url, i, arr) => arr.indexOf(url) === i)
          .slice(0, 1);
        setSlots(initial.map((src, i) => ({ src, key: i })));
      });
  }, []);

  useEffect(() => {
    if (imagePool.length === 0) return;
    const interval = setInterval(() => {
      setSlots((prev) => {
        if (prev.length === 0) return prev;
        const slot = Math.floor(Math.random() * prev.length);
        const currentSrcs = prev.map((s) => s.src);
        // Prefer images not currently shown at all
        const notShown = shuffle(
          imagePool.filter((img) => !currentSrcs.includes(img)),
        );
        // Fallback: images not in this specific slot (avoids same image re-appearing in same position)
        const notInSlot = shuffle(
          imagePool.filter((img) => img !== prev[slot].src),
        );
        const newSrc = notShown[0] ?? notInSlot[0] ?? prev[slot].src;
        keyRef.current += 1;
        return prev.map((s, i) =>
          i === slot ? { src: newSrc, key: keyRef.current } : s,
        );
      });
    }, 2800);
    return () => clearInterval(interval);
  }, [imagePool]);

  if (slots.length === 0)
    return (
      <div
        className="h-[100dvh] overflow-hidden bg-white p-3 cursor-pointer md:p-4"
        onClick={() => navigate("/photography")}
      >
        <div className="h-full bg-white" />
      </div>
    );

  return (
    <div className="bg-white">
      {/* ── Mobile: full-width stacked ── */}
      <div className="h-[100dvh] overflow-hidden p-3 md:hidden" onClick={() => navigate("/photography")}>
        {slots.map((slot, i) => (
          <div key={i} className="relative h-full overflow-hidden bg-white">
            <AnimatePresence>
              <motion.img
                key={slot.key}
                src={slot.src}
                alt=""
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0 h-full w-full object-contain"
              />
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* ── Desktop: 2×2 grid ── */}
      <div
        className="hidden h-[100dvh] cursor-pointer overflow-hidden p-4 md:block"
        onClick={() => navigate("/photography")}
      >
        {slots.map((slot, i) => (
          <div key={i} className="relative h-full overflow-hidden bg-white">
            <AnimatePresence>
              <motion.img
                key={slot.key}
                src={slot.src}
                alt=""
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0 h-full w-full object-contain"
              />
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
