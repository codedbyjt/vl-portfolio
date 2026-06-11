import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import { loadSiteSettings } from "../lib/siteSettings";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function uniqueUrls(urls: string[]) {
  return urls.filter((url, index, arr) => arr.indexOf(url) === index);
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [modeChecked, setModeChecked] = useState(false);
  const [imagePool, setImagePool] = useState<string[]>([]);
  const [slots, setSlots] = useState<{ src: string; key: number }[]>([]);
  const keyRef = useRef(100);
  const queueRef = useRef<string[]>([]);

  useEffect(() => {
    loadSiteSettings()
      .then((settings) => {
        if (settings.home_page_mode === "photography") {
          navigate("/photography", {
            replace: true,
            state: { collapsePhotographyNav: true },
          });
          return;
        }
        setModeChecked(true);
      })
      .catch((error) => {
        console.error("Failed to load site settings:", error);
        navigate("/photography", {
          replace: true,
          state: { collapsePhotographyNav: true },
        });
      });
  }, [navigate]);

  useEffect(() => {
    if (!modeChecked) return;
    supabase
      .from("photos")
      .select("url")
      .eq("home_featured", true)
      .neq("visibility", "hidden")
      .then(({ data }) => {
        if (!data || data.length === 0) return; // nothing featured yet — show blank
        const pool = shuffle(uniqueUrls(data.map((r: { url: string }) => r.url)));
        setImagePool(pool);
        // Pick one unique image for the single homepage carousel.
        const initial = pool.slice(0, 1);
        queueRef.current = pool.slice(1);
        setSlots(initial.map((src, i) => ({ src, key: i })));
      });
  }, [modeChecked]);

  useEffect(() => {
    if (imagePool.length === 0) return;
    const interval = setInterval(() => {
      setSlots((prev) => {
        if (prev.length === 0) return prev;
        const slot = Math.floor(Math.random() * prev.length);
        const currentSrc = prev[slot].src;

        if (queueRef.current.length === 0) {
          queueRef.current = shuffle(
            imagePool.length > 1
              ? imagePool.filter((img) => img !== currentSrc)
              : imagePool,
          );
        }

        const newSrc = queueRef.current.shift() ?? currentSrc;
        keyRef.current += 1;
        return prev.map((s, i) =>
          i === slot ? { src: newSrc, key: keyRef.current } : s,
        );
      });
    }, 2800);
    return () => clearInterval(interval);
  }, [imagePool]);

  if (!modeChecked) {
    return <div className="h-[100dvh] bg-white" />;
  }

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
