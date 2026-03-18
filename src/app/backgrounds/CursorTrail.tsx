import { useEffect, useRef } from 'react';

interface Point { x: number; y: number; alpha: number; }

export default function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points = useRef<Point[]>([]);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      for (let i = 0; i < 3; i++) {
        points.current.push({
          x: e.clientX + (Math.random() - 0.5) * 8,
          y: e.clientY + (Math.random() - 0.5) * 8,
          alpha: 1,
        });
      }
      if (points.current.length > 120) points.current.splice(0, points.current.length - 120);
    };
    window.addEventListener('mousemove', onMove);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      points.current.forEach((p, i) => {
        p.alpha -= 0.015;
        if (p.alpha <= 0) return;
        const size = p.alpha * 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,0,${p.alpha * 0.6})`;
        ctx.fill();
        if (i > 0) {
          const prev = points.current[i - 1];
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = `rgba(0,255,0,${p.alpha * 0.3})`;
          ctx.lineWidth = p.alpha * 3;
          ctx.stroke();
        }
      });
      points.current = points.current.filter(p => p.alpha > 0);
      frame = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />;
}
