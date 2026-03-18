// Concept C: CRT Scanlines — dark background with horizontal scan bands rolling down
import { useEffect, useRef } from 'react';

export default function ScanLines() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let id: number;
    let offset = 0;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const { width: w, height: h } = canvas;

      // Base dark static
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 40;
        d[i] = v; d[i+1] = v; d[i+2] = v; d[i+3] = 255;
      }
      ctx.putImageData(img, 0, 0);

      // Rolling scanlines on top
      for (let y = 0; y < h; y += 4) {
        const brightness = Math.sin((y + offset) * 0.05) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(0,0,0,${0.6 - brightness * 0.3})`;
        ctx.fillRect(0, y, w, 2);
      }

      // Bright scan band rolling down
      const bandY = (offset * 2) % h;
      const grad = ctx.createLinearGradient(0, bandY - 40, 0, bandY + 40);
      grad.addColorStop(0, 'rgba(0,255,0,0)');
      grad.addColorStop(0.5, 'rgba(0,255,0,0.04)');
      grad.addColorStop(1, 'rgba(0,255,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, bandY - 40, w, 80);

      offset += 1.5;
      id = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}
