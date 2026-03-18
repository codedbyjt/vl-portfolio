// Concept B: Green-tinted static — like night vision / surveillance feed
import { useEffect, useRef } from 'react';

export default function GreenStatic() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        const v = Math.random() * 90;
        d[i] = 0;           // no red
        d[i+1] = v * 1.4;  // green boosted
        d[i+2] = 0;         // no blue
        d[i+3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      id = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}
