'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface CinematicIntroProps {
  onComplete: () => void;
  skipLabel: string;
  forceFullMotion?: boolean;
}

interface IntroParticle {
  nx: number;
  ny: number;
  vx: number;
  vy: number;
  radialPush: number;
  radius: number;
  baseAlpha: number;
  depth: 0 | 1 | 2;
  phase: number;
  appearAt: number;
}

interface IntroStreak {
  x0: number;
  y0: number;
  dx: number;
  dy: number;
  length: number;
  start: number;
  duration: number;
  peakAlpha: number;
}

interface IntroGlint {
  nx: number;
  ny: number;
  size: number;
  start: number;
  duration: number;
  peakAlpha: number;
}

interface IntroWave {
  start: number;
  duration: number;
  aspectX: number;
  ringAlpha: number;
  glowAlpha: number;
  lineWidth: number;
}

const INTRO_WAVES: IntroWave[] = [
  { start: 0.2, duration: 1.55, aspectX: 1.08, ringAlpha: 0.2, glowAlpha: 0.12, lineWidth: 1.2 },
  { start: 0.5, duration: 1.62, aspectX: 1.2, ringAlpha: 0.24, glowAlpha: 0.14, lineWidth: 1.3 },
  { start: 0.88, duration: 1.58, aspectX: 1.12, ringAlpha: 0.42, glowAlpha: 0.22, lineWidth: 1.8 },
  { start: 1.38, duration: 1.36, aspectX: 1.16, ringAlpha: 0.22, glowAlpha: 0.12, lineWidth: 1.2 },
];

const INTRO_GLINTS: IntroGlint[] = [
  { nx: 0.14, ny: 0.2, size: 7, start: 0.34, duration: 0.72, peakAlpha: 0.68 },
  { nx: 0.86, ny: 0.18, size: 8, start: 0.52, duration: 0.78, peakAlpha: 0.72 },
  { nx: 0.18, ny: 0.79, size: 6.5, start: 0.68, duration: 0.75, peakAlpha: 0.62 },
  { nx: 0.83, ny: 0.77, size: 7.5, start: 0.86, duration: 0.8, peakAlpha: 0.7 },
  { nx: 0.31, ny: 0.3, size: 6, start: 1.02, duration: 0.7, peakAlpha: 0.65 },
  { nx: 0.71, ny: 0.32, size: 6.5, start: 1.18, duration: 0.74, peakAlpha: 0.68 },
  { nx: 0.27, ny: 0.67, size: 6, start: 1.48, duration: 0.76, peakAlpha: 0.58 },
  { nx: 0.74, ny: 0.66, size: 7, start: 1.68, duration: 0.75, peakAlpha: 0.62 },
];

const INTRO_STREAKS: IntroStreak[] = [
  { x0: -0.05, y0: 0.26, dx: 0.42, dy: -0.18, length: 92, start: 0.3, duration: 0.76, peakAlpha: 0.48 },
  { x0: 0.62, y0: 0.92, dx: 0.38, dy: -0.17, length: 88, start: 0.44, duration: 0.78, peakAlpha: 0.44 },
  { x0: 0.08, y0: 0.84, dx: 0.36, dy: -0.16, length: 78, start: 0.58, duration: 0.72, peakAlpha: 0.46 },
  { x0: 0.58, y0: 0.34, dx: 0.4, dy: -0.18, length: 96, start: 0.74, duration: 0.74, peakAlpha: 0.5 },
  { x0: -0.02, y0: 0.58, dx: 0.38, dy: -0.16, length: 105, start: 0.92, duration: 0.82, peakAlpha: 0.54 },
  { x0: 0.52, y0: 0.72, dx: 0.42, dy: -0.18, length: 94, start: 1.12, duration: 0.78, peakAlpha: 0.48 },
  { x0: 0.14, y0: 0.38, dx: 0.34, dy: -0.15, length: 82, start: 1.36, duration: 0.76, peakAlpha: 0.42 },
  { x0: 0.64, y0: 0.22, dx: 0.34, dy: -0.15, length: 76, start: 1.62, duration: 0.74, peakAlpha: 0.4 },
  { x0: 0.18, y0: 0.76, dx: 0.36, dy: -0.16, length: 84, start: 1.84, duration: 0.68, peakAlpha: 0.38 },
];

// Deterministic pseudo-random helper so every session feels curated and balanced across all corners
function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function buildStratifiedParticles(width: number): IntroParticle[] {
  const cols = width < 480 ? 6 : width < 900 ? 8 : 10;
  const rows = width < 480 ? 7 : 7;
  const rand = seededRandom(20261023);
  const particles: IntroParticle[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Stratified placement across 100% of viewport width & height (including outer corners)
      const nx = (c + 0.14 + rand() * 0.72) / cols;
      const ny = (r + 0.14 + rand() * 0.72) / rows;
      const dx = nx - 0.5;
      const dy = ny - 0.5;
      const dist = Math.hypot(dx, dy) || 0.001;
      const ux = dx / dist;
      const uy = dy / dist;

      const roll = rand();
      const depth: 0 | 1 | 2 = roll < 0.3 ? 0 : roll < 0.74 ? 1 : 2;

      const radius =
        depth === 0
          ? 2.8 + rand() * 2.6
          : depth === 1
          ? 1.25 + rand() * 1.25
          : 0.8 + rand() * 0.75;

      const baseAlpha =
        depth === 0
          ? 0.16 + rand() * 0.14
          : depth === 1
          ? 0.34 + rand() * 0.28
          : 0.56 + rand() * 0.34;

      const speedScale = depth === 0 ? 0.55 : depth === 1 ? 0.95 : 1.3;

      particles.push({
        nx,
        ny,
        vx: (ux * 0.036 + (rand() - 0.5) * 0.028) * speedScale,
        vy: (uy * 0.028 - 0.022 + (rand() - 0.5) * 0.02) * speedScale,
        radialPush: (0.026 + rand() * 0.028) * speedScale,
        radius,
        baseAlpha,
        depth,
        phase: rand() * Math.PI * 2,
        appearAt: rand() * 0.36,
      });
    }
  }

  return particles;
}

function easeOutCubic(x: number): number {
  const t = Math.max(0, Math.min(1, x));
  return 1 - Math.pow(1 - t, 3);
}

function easeOutQuart(x: number): number {
  const t = Math.max(0, Math.min(1, x));
  return 1 - Math.pow(1 - t, 4);
}

export function CinematicIntro({
  onComplete,
  skipLabel,
  forceFullMotion = false,
}: CinematicIntroProps) {
  const [phase, setPhase] = useState<'waiting-visible' | 'active' | 'exiting' | 'skipping'>(() => {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      return 'waiting-visible';
    }
    return 'active';
  });
  const [interactionReleased, setInteractionReleased] = useState(false);
  const [useFallbackLogo, setUseFallbackLogo] = useState(false);
  const [isReducedMotion] = useState<boolean>(() => {
    if (forceFullMotion || typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const finishIntro = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('intro-booting');
    }
    onCompleteRef.current();
  }, []);

  // Remove the HTML boot curtain class on the exact layout pass this z-[10000] overlay mounts,
  // revealing the true Light/Dark page background underneath while the red intro covers 100% of the screen.
  useLayoutEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('intro-booting');
    }
  }, []);

  // If page loaded in a hidden background tab, start the 3.00s choreography as soon as the tab becomes visible
  useEffect(() => {
    if (phase !== 'waiting-visible' || typeof document === 'undefined') return;

    if (document.visibilityState === 'visible') {
      setPhase('active');
      return;
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        setPhase('active');
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [phase]);

  // Prevent scroll/wheel/keyboard interaction with underlying website without mutating body layout
  useEffect(() => {
    const el = overlayRef.current;
    if (!el || interactionReleased) return;

    const preventScroll = (e: Event) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (phase === 'active' || phase === 'waiting-visible') {
          setPhase('skipping');
        }
        return;
      }
      if (
        e.key === 'ArrowDown' ||
        e.key === 'ArrowUp' ||
        e.key === 'PageDown' ||
        e.key === 'PageUp' ||
        e.key === ' '
      ) {
        if ((e.target as HTMLElement)?.tagName !== 'BUTTON') {
          e.preventDefault();
        }
      }
    };

    el.addEventListener('wheel', preventScroll, { passive: false });
    el.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      el.removeEventListener('wheel', preventScroll);
      el.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [interactionReleased, phase]);

  // Master 3.00-second timeline orchestration (or 1.85s simplified reduced-motion timeline)
  useEffect(() => {
    if (phase !== 'active') return;

    const exitStartMs = isReducedMotion ? 1450 : 2500;
    const releasePointerMs = isReducedMotion ? 1580 : 2660;
    const totalDurationMs = isReducedMotion ? 1850 : 3000;
    const watchdogMs = isReducedMotion ? 2300 : 3500;

    const exitTimer = window.setTimeout(() => {
      setPhase('exiting');
    }, exitStartMs);

    const pointerTimer = window.setTimeout(() => {
      setInteractionReleased(true);
    }, releasePointerMs);

    const completeTimer = window.setTimeout(() => {
      finishIntro();
    }, totalDurationMs);

    const watchdogTimer = window.setTimeout(() => {
      finishIntro();
    }, watchdogMs);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(pointerTimer);
      window.clearTimeout(completeTimer);
      window.clearTimeout(watchdogTimer);
    };
  }, [phase, isReducedMotion, finishIntro]);

  // Fast skip timeline (~340ms curtain sweep)
  useEffect(() => {
    if (phase !== 'skipping') return;
    setInteractionReleased(true);
    const doneTimer = window.setTimeout(() => {
      finishIntro();
    }, 340);
    return () => {
      window.clearTimeout(doneTimer);
    };
  }, [phase, finishIntro]);

  // Full-Viewport 60fps Canvas Choreography (Particles, Expanding Ripples, Light Streaks & Glints)
  useEffect(() => {
    if (isReducedMotion || phase === 'waiting-visible') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let rafId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const syncCanvasSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    syncCanvasSize();
    const particles = buildStratifiedParticles(width);
    const startTime = performance.now();

    const onResize = () => {
      syncCanvasSize();
    };
    window.addEventListener('resize', onResize);

    const renderFrame = (now: number) => {
      const t = (now - startTime) / 1000; // Elapsed seconds (0.000 -> 3.000)
      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.5;
      const maxDiag = Math.hypot(width, height);

      // 1. ENERGY LAYER: Expanding Full-Viewport Circular & Elliptical Ripples
      for (let i = 0; i < INTRO_WAVES.length; i++) {
        const w = INTRO_WAVES[i];
        if (t < w.start || t > w.start + w.duration) continue;

        const progress = (t - w.start) / w.duration;
        const eased = easeOutQuart(progress);
        const radius = 32 + eased * (maxDiag * 0.66);
        const fade = Math.sin(Math.min(1, progress) * Math.PI) * (1 - progress * 0.45);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(w.aspectX, 1);

        // Soft diffused wave halo
        const bandWidth = Math.max(26, radius * 0.18);
        const innerR = Math.max(0, radius - bandWidth);
        const outerR = radius + bandWidth * 0.45;
        const grad = ctx.createRadialGradient(0, 0, innerR, 0, 0, outerR);
        grad.addColorStop(0, 'rgba(255, 95, 118, 0)');
        grad.addColorStop(0.65, `rgba(255, 130, 148, ${(w.glowAlpha * fade).toFixed(4)})`);
        grad.addColorStop(0.88, `rgba(255, 235, 238, ${(w.ringAlpha * 0.55 * fade).toFixed(4)})`);
        grad.addColorStop(1, 'rgba(255, 95, 118, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, outerR, 0, Math.PI * 2);
        ctx.fill();

        // Crisp luminous wavefront ring
        ctx.strokeStyle = `rgba(255, 240, 243, ${(w.ringAlpha * fade).toFixed(4)})`;
        ctx.lineWidth = w.lineWidth;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      }

      // 2. HIGHLIGHT LAYER: Controlled Diagonal Light Streaks Across Outer & Mid Zones
      for (let i = 0; i < INTRO_STREAKS.length; i++) {
        const s = INTRO_STREAKS[i];
        if (t < s.start || t > s.start + s.duration) continue;

        const p = (t - s.start) / s.duration;
        const travel = easeOutCubic(p);
        const alpha = Math.sin(p * Math.PI) * s.peakAlpha;

        const headX = (s.x0 + s.dx * travel) * width;
        const headY = (s.y0 + s.dy * travel) * height;
        const dirLen = Math.hypot(s.dx * width, s.dy * height) || 1;
        const ux = (s.dx * width) / dirLen;
        const uy = (s.dy * height) / dirLen;
        const tailX = headX - ux * s.length;
        const tailY = headY - uy * s.length;

        const lineGrad = ctx.createLinearGradient(tailX, tailY, headX, headY);
        lineGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        lineGrad.addColorStop(0.65, `rgba(255, 210, 218, ${(alpha * 0.65).toFixed(4)})`);
        lineGrad.addColorStop(0.92, `rgba(255, 255, 255, ${alpha.toFixed(4)})`);
        lineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 1.35;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.stroke();
      }

      // 3. PARTICLE LAYER: Multi-Depth White & Crimson-Rose Particles Across Entire Screen
      const pulseBoost = t > 0.85 ? easeOutCubic(Math.min(1, (t - 0.85) / 1.1)) : 0;

      for (let i = 0; i < particles.length; i++) {
        const pt = particles[i];
        if (t < pt.appearAt) continue;

        const lifeT = t - pt.appearAt;
        const fadeIn = Math.min(1, lifeT / 0.38);
        const shimmer = 0.78 + 0.22 * Math.sin(t * 3.4 + pt.phase);
        const alpha = pt.baseAlpha * fadeIn * shimmer;

        const dxCenter = pt.nx - 0.5;
        const dyCenter = pt.ny - 0.5;
        const normDist = Math.hypot(dxCenter, dyCenter) || 0.001;
        const rx = (dxCenter / normDist) * pt.radialPush * pulseBoost;
        const ry = (dyCenter / normDist) * pt.radialPush * pulseBoost;

        // Gentle organic curved drift across viewport
        const swayX = Math.sin(t * 1.6 + pt.phase) * 0.008;
        const swayY = Math.cos(t * 1.4 + pt.phase) * 0.008;

        const px = ((pt.nx + pt.vx * lifeT + rx + swayX + 1) % 1) * width;
        const py = ((pt.ny + pt.vy * lifeT + ry + swayY + 1) % 1) * height;

        if (pt.depth === 0) {
          // Deep soft crimson-rose atmospheric orb
          const orbR = pt.radius * 2.2;
          const orbGrad = ctx.createRadialGradient(px, py, 0, px, py, orbR);
          orbGrad.addColorStop(0, `rgba(255, 165, 180, ${alpha.toFixed(4)})`);
          orbGrad.addColorStop(0.5, `rgba(255, 70, 98, ${(alpha * 0.45).toFixed(4)})`);
          orbGrad.addColorStop(1, 'rgba(200, 16, 46, 0)');
          ctx.fillStyle = orbGrad;
          ctx.beginPath();
          ctx.arc(px, py, orbR, 0, Math.PI * 2);
          ctx.fill();
        } else if (pt.depth === 1) {
          // Mid-depth warm ivory-white mote with subtle blush halo
          ctx.fillStyle = `rgba(255, 232, 236, ${(alpha * 0.28).toFixed(4)})`;
          ctx.beginPath();
          ctx.arc(px, py, pt.radius * 2.1, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgba(255, 250, 251, ${alpha.toFixed(4)})`;
          ctx.beginPath();
          ctx.arc(px, py, pt.radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Foreground crisp pure-white micro spark
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(4)})`;
          ctx.beginPath();
          ctx.arc(px, py, pt.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 4. STARLIGHT GLINTS: Brief Controlled Specular Glints in Outer & Mid Quadrants
      for (let i = 0; i < INTRO_GLINTS.length; i++) {
        const g = INTRO_GLINTS[i];
        if (t < g.start || t > g.start + g.duration) continue;

        const p = (t - g.start) / g.duration;
        const env = Math.sin(p * Math.PI);
        const alpha = env * g.peakAlpha;
        const arm = g.size * (0.65 + 0.35 * env);
        const gx = g.nx * width;
        const gy = g.ny * height;

        ctx.save();
        ctx.translate(gx, gy);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(4)})`;
        ctx.lineWidth = 1.1;

        ctx.beginPath();
        ctx.moveTo(-arm, 0);
        ctx.lineTo(arm, 0);
        ctx.moveTo(0, -arm);
        ctx.lineTo(0, arm);
        ctx.stroke();

        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha * 1.15).toFixed(4)})`;
        ctx.beginPath();
        ctx.arc(0, 0, 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (t < 3.2) {
        rafId = window.requestAnimationFrame(renderFrame);
      }
    };

    rafId = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  }, [isReducedMotion, phase]);

  const handleSkipClick = () => {
    if (isReducedMotion) {
      finishIntro();
      return;
    }
    if (phase === 'active' || phase === 'waiting-visible') {
      setPhase('skipping');
    }
  };

  if (typeof document === 'undefined') return null;

  const rootPhaseClass =
    phase === 'exiting'
      ? isReducedMotion
        ? 'pannello-intro-reduced-exiting'
        : 'pannello-intro-exiting'
      : phase === 'skipping'
      ? 'pannello-intro-skipping'
      : '';

  const pointerClass = interactionReleased ? 'pointer-events-none' : 'pointer-events-auto';

  const seamClass =
    !isReducedMotion && phase === 'exiting'
      ? 'pannello-intro-seam-active'
      : !isReducedMotion && phase === 'skipping'
      ? 'pannello-intro-seam-skip'
      : '';

  return createPortal(
    <>
      <div
        ref={overlayRef}
        role="region"
        aria-label="PANNELLO — Taste The Best"
        data-testid="pannello-cinematic-intro"
        className={`pannello-cinematic-intro ${rootPhaseClass} ${pointerClass}`}
      >
        {/* Stage Wrapper */}
        <div className="pannello-intro-stage relative w-full h-full flex items-center justify-center">
          {/* Layer 1: Deep Saturated PANNELLO Red Base */}
          <div className="pannello-intro-base" aria-hidden="true" />

          {/* Layer 2: Full-Canvas Travelling Crimson & Burgundy Atmospheric Gradients */}
          {!isReducedMotion && (
            <>
              <div className="pannello-intro-atmos-a" aria-hidden="true" />
              <div className="pannello-intro-atmos-b" aria-hidden="true" />
            </>
          )}
          <div className="pannello-intro-vignette" aria-hidden="true" />

          {/* Layer 7: Restrained Architectural Grid Texture */}
          <div className="pannello-intro-texture-grid" aria-hidden="true" />

          {/* Layer 3: Full-Viewport Diagonal Light Beams & Expanding Central Bloom */}
          {!isReducedMotion && (
            <>
              <div className="pannello-intro-radial-bloom" aria-hidden="true" />
              <div className="pannello-intro-beam-primary" aria-hidden="true" />
              <div className="pannello-intro-beam-secondary" aria-hidden="true" />
            </>
          )}

          {/* Layers 4, 5 & 6: 60fps High-DPI Canvas (Particles, Energy Ripples & Light Streaks Across Entire Screen) */}
          {!isReducedMotion && phase !== 'waiting-visible' && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              aria-hidden="true"
            />
          )}

          {/* Central Hero: Pure White PANNELLO Brand Logo (Includes "TASTE THE BEST" Artwork) */}
          {phase !== 'waiting-visible' && (
            <div className="relative z-10 flex items-center justify-center px-6 sm:px-10 w-full">
              <div className="relative w-[min(80vw,336px)] sm:w-[min(64vw,450px)] md:w-[min(50vw,550px)] lg:w-[590px] max-h-[34dvh] aspect-[960/252] flex items-center justify-center">
                {/* Soft Expanding Halo Behind Logo */}
                {!isReducedMotion && (
                  <div className="pannello-intro-logo-halo" aria-hidden="true" />
                )}

                {/* Genuine White PANNELLO Logo Artwork */}
                <div
                  className={`relative w-full h-full ${
                    isReducedMotion ? 'pannello-intro-reduced-logo' : 'pannello-intro-logo-reveal'
                  }`}
                >
                  <img
                    src={
                      useFallbackLogo
                        ? '/assets/pannello_logo_hero.png'
                        : '/assets/pannello_logo_white_cinema.png'
                    }
                    alt="PANNELLO — TASTE THE BEST"
                    width={960}
                    height={252}
                    loading="eager"
                    decoding="sync"
                    fetchPriority="high"
                    onError={() => {
                      if (!useFallbackLogo) {
                        setUseFallbackLogo(true);
                      }
                    }}
                    className={`w-full h-full object-contain select-none pointer-events-none ${
                      useFallbackLogo ? 'brightness-0 invert' : ''
                    }`}
                  />

                  {/* Masked Specular White Highlight Sweep Across Logo Artwork */}
                  {!isReducedMotion && !useFallbackLogo && (
                    <div className="pannello-intro-logo-sheen" aria-hidden="true" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Discreet Accessible Skip Button (Respecting iPhone Safe-Area Insets) */}
          {!interactionReleased && (
            <button
              type="button"
              onClick={handleSkipClick}
              aria-label={skipLabel}
              className="absolute bottom-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+0.85rem))] right-[max(1.25rem,calc(env(safe-area-inset-right,0px)+1rem))] z-20 min-h-[40px] px-3.5 py-1.5 rounded-lg bg-black/18 hover:bg-black/32 active:scale-95 border border-white/22 text-white/85 hover:text-white text-xs font-semibold tracking-wide backdrop-blur-xs transition-all cursor-pointer whitespace-nowrap"
            >
              {skipLabel}
            </button>
          )}
        </div>
      </div>

      {/* Luminous Seam Accent Following the Rising Full-Screen Curtain */}
      {seamClass && <div className={`pannello-intro-curtain-seam ${seamClass}`} aria-hidden="true" />}
    </>,
    document.body
  );
}

export default CinematicIntro;
