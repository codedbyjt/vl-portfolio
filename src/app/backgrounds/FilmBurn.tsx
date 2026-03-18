// Concept D: Film burn — dark grain with occasional light leak bleeds from edges
import { useEffect, useRef } from 'react';

export default function FilmBurn() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let id: number;
    let frame = 0;
    let leakIntensity = 0;
    let leakTarget = 0;
    let leakX = 0;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const { width: w, height: h } = canvas;

      // Dark grain base
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 60;
        d[i] = v * 0.9; d[i+1] = v * 0.8; d[i+2] = v * 0.6; // warm dark tone
        d[i+3] = 255;
      }
      ctx.putImageData(img, 0, 0);

      // Random light leak trigger
      if (frame % 180 === 0) {
        leakTarget = 0.4 + Math.random() * 0.4;
        leakX = Math.random() > 0.5 ? 0 : w;
      }
      leakIntensity += (leakTarget - leakIntensity) * 0.05;
      leakTarget *= 0.98;

      if (leakIntensity > 0.01) {
        const leak = ctx.createRadialGradient(leakX, h * 0.3, 0, leakX, h * 0.3, w * 0.6);
        leak.addColorStop(0, `rgba(0,255,0,${leakIntensity * 0.3})`);
        leak.addColorStop(0.4, `rgba(0,180,0,${leakIntensity * 0.1})`);
        leak.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = leak;
        ctx.fillRect(0, 0, w, h);
      }

      frame++;
      id = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}
