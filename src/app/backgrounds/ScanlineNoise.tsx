import { useEffect, useRef } from 'react';

export default function ScanlineNoise({ opacity = 0.06 }: { opacity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame: number;

    const draw = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const w = canvas.width, h = canvas.height;

      // Noise
      const imageData = ctx.createImageData(w, h);
      for (let i = 0; i < imageData.data.length; i += 4) {
        const v = Math.random() * 255;
        imageData.data[i] = v;
        imageData.data[i + 1] = v;
        imageData.data[i + 2] = v;
        imageData.data[i + 3] = 30;
      }
      ctx.putImageData(imageData, 0, 0);

      // Scanlines
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      for (let y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1);
      }

      frame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity }}
    />
  );
}
