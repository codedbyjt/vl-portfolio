import { useEffect, useRef } from 'react';

export default function FilmGrain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame: number;
    let tick = 0;

    const draw = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const w = canvas.width, h = canvas.height;
      tick++;

      // Grain
      const imageData = ctx.createImageData(w, h);
      for (let i = 0; i < imageData.data.length; i += 4) {
        const v = Math.random() * 180;
        imageData.data[i] = v * 0.8;
        imageData.data[i + 1] = v;
        imageData.data[i + 2] = v * 0.7;
        imageData.data[i + 3] = Math.random() * 18;
      }
      ctx.putImageData(imageData, 0, 0);

      // Occasional light leak
      if (tick % 90 < 30) {
        const leakProgress = (tick % 90) / 30;
        const grad = ctx.createRadialGradient(
          w * 0.1, h * 0.1, 0,
          w * 0.1, h * 0.1, w * 0.6
        );
        const peakAlpha = Math.sin(leakProgress * Math.PI) * 0.12;
        grad.addColorStop(0, `rgba(0,255,0,${peakAlpha})`);
        grad.addColorStop(0.5, `rgba(0,255,0,${peakAlpha * 0.3})`);
        grad.addColorStop(1, 'rgba(0,255,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
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
    />
  );
}
