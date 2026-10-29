import React, { useEffect, useRef } from 'react';
import type { GamePhase } from '../types/werewolf';

interface BackgroundAmbienceProps {
  phase?: GamePhase;
}

export const BackgroundAmbience: React.FC<BackgroundAmbienceProps> = ({ phase = 'LOBBY' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isNight =
    phase === 'NIGHT_START' ||
    phase === 'NIGHT_WOLVES' ||
    phase === 'NIGHT_SEER' ||
    phase === 'NIGHT_GUARD' ||
    phase === 'NIGHT_WITCH' ||
    phase === 'NIGHT_RESOLUTION';

  const isDay =
    phase === 'DAY_ANNOUNCEMENT' ||
    phase === 'DAY_DISCUSSION' ||
    phase === 'DAY_VOTING' ||
    phase === 'VOTE_RESOLUTION';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Stars
    const starCount = 80;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.7),
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
      speed: Math.random() * 0.02 + 0.005,
    }));

    // Fireflies / mist particles
    const particleCount = 25;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.3 - 0.1,
      radius: Math.random() * 2 + 1,
      alpha: Math.random() * 0.6 + 0.2,
      pulse: Math.random() * Math.PI * 2,
    }));

    let frame = 0;

    const render = () => {
      frame += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Sky Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      if (isNight) {
        grad.addColorStop(0, '#060814');
        grad.addColorStop(0.5, '#0c1024');
        grad.addColorStop(1, '#090d16');
      } else if (isDay) {
        grad.addColorStop(0, '#11192e');
        grad.addColorStop(0.5, '#1e293b');
        grad.addColorStop(1, '#0f172a');
      } else {
        grad.addColorStop(0, '#0a0d18');
        grad.addColorStop(0.6, '#131b2e');
        grad.addColorStop(1, '#090d16');
      }

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Twinkling stars
      stars.forEach((star) => {
        star.alpha += star.speed;
        const currentAlpha = Math.abs(Math.sin(star.alpha));
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(254, 240, 138, ${currentAlpha * (isNight ? 0.8 : 0.3)})`;
        ctx.fill();
      });

      // Floating mist / glowing spores
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.03;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const currentAlpha = (Math.sin(p.pulse) * 0.3 + 0.5) * p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = isNight
          ? `rgba(168, 85, 247, ${currentAlpha * 0.4})`
          : `rgba(250, 204, 21, ${currentAlpha * 0.3})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isNight, isDay]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Full Moon or Rising Sun Glow */}
      <div
        className={`absolute top-6 right-8 md:right-24 w-32 h-32 md:w-48 md:h-48 rounded-full blur-2xl transition-all duration-1000 ${isNight
            ? 'bg-amber-300/10 opacity-70 scale-110'
            : isDay
              ? 'bg-amber-400/20 opacity-90 scale-125'
              : 'bg-indigo-500/10 opacity-50'
          }`}
      />

      {/* Atmospheric Fog Drift */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-transparent to-transparent animate-fog" />
    </div>
  );
};
