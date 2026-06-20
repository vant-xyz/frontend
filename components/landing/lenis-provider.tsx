"use client";

import { useEffect } from "react";

export function LenisProvider() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cleanup: (() => void) | undefined;

    import("lenis").then(({ default: Lenis }) => {
      const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      let rafId: number;
      const raf = (time: number) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
      cleanup = () => { lenis.destroy(); cancelAnimationFrame(rafId); };
    });

    return () => cleanup?.();
  }, []);

  return null;
}
