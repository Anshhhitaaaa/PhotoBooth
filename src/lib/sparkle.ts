import { useEffect } from 'react';

const HEART_GLYPHS = ['❤️', '💕', '💖', '💗', '💘', '🤍', '✨', '🌸'];
const SPARKLES = ['✨', '⭐', '💫', '❤️', '💖'];

let lastSparkle = 0;

function spawnHeart() {
  const el = document.createElement('span');
  el.textContent = HEART_GLYPHS[Math.floor(Math.random() * HEART_GLYPHS.length)];
  el.className = 'heart-float';
  const size = 14 + Math.random() * 26;
  el.style.fontSize = `${size}px`;
  el.style.left = `${Math.random() * 100}vw`;
  el.style.setProperty('--rot', `${(Math.random() * 60 - 30).toFixed(0)}deg`);
  const dur = 6 + Math.random() * 5;
  el.style.animationDuration = `${dur}s`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), dur * 1000 + 200);
}

function spawnSparkle(x: number, y: number) {
  const el = document.createElement('span');
  el.textContent = SPARKLES[Math.floor(Math.random() * SPARKLES.length)];
  el.className = 'sparkle-burst';
  el.style.left = `${x - 12}px`;
  el.style.top = `${y - 12}px`;
  el.style.fontSize = `${16 + Math.random() * 10}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 650);
}

/** Ambient floating hearts that drift up the page periodically. */
export function useFloatingHearts(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      if (Math.random() < 0.7) spawnHeart();
    }, 1400);
    return () => clearInterval(interval);
  }, [enabled]);
}

/** Sparkle burst wherever the user clicks (throttled). */
export function useClickSparkles(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastSparkle < 120) return;
      lastSparkle = now;
      spawnSparkle(e.clientX, e.clientY);
    };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [enabled]);
}
