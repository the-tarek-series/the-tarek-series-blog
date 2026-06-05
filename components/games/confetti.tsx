'use client';

import { useEffect, useRef } from 'react';

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  rotation: number;
  vrotation: number;
}

export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confetti: ConfettiPiece[] = [];
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA502', '#FF6348', '#32E0C4'];

    // Create confetti pieces
    for (let i = 0; i < 100; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 3 + 2,
        life: 0,
        maxLife: 2.5 + Math.random() * 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vrotation: (Math.random() - 0.5) * 0.1,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      confetti.forEach((piece) => {
        piece.life += 0.016; // ~60fps
        const progress = piece.life / piece.maxLife;

        if (progress <= 1) {
          piece.x += piece.vx;
          piece.y += piece.vy;
          piece.vy += 0.1; // gravity
          piece.rotation += piece.vrotation;

          ctx.save();
          ctx.translate(piece.x, piece.y);
          ctx.rotate(piece.rotation);
          ctx.globalAlpha = 1 - progress;

          ctx.fillStyle = piece.color;
          ctx.fillRect(-5, -5, 10, 10);

          ctx.restore();
        }
      });

      if (confetti.some((p) => p.life < p.maxLife)) {
        requestAnimationFrame(animate);
      }
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 50 }}
    />
  );
}
