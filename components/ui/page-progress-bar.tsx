"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Phase = "idle" | "running" | "completing";

export function PageProgressBar() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [width, setWidth] = useState(0);
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAll = () => {
    clearInterval(intervalRef.current);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const start = () => {
    clearAll();
    setPhase("running");
    setWidth(8);
    let w = 8;
    intervalRef.current = setInterval(() => {
      w = w + (85 - w) * 0.07;
      setWidth(Math.min(w, 84));
    }, 120);
  };

  const complete = () => {
    clearAll();
    setWidth(100);
    const t1 = setTimeout(() => setPhase("completing"), 80);
    const t2 = setTimeout(() => { setPhase("idle"); setWidth(0); }, 500);
    timersRef.current = [t1, t2];
  };

  // Patch pushState/replaceState so programmatic router.push() triggers the bar
  useEffect(() => {
    const origPush = window.history.pushState.bind(window.history);
    const origReplace = window.history.replaceState.bind(window.history);

    window.history.pushState = (...args: Parameters<typeof window.history.pushState>) => {
      start();
      return origPush(...args);
    };
    window.history.replaceState = (...args: Parameters<typeof window.history.replaceState>) => {
      start();
      return origReplace(...args);
    };

    return () => {
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
      clearAll();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Complete when the new pathname is rendered
  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;
    complete();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (phase === "idle") return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: 2,
        zIndex: 99999,
        pointerEvents: "none",
        background: "#dc2626",
        boxShadow: "0 0 8px #dc2626, 0 0 4px #dc2626",
        width: `${width}%`,
        opacity: phase === "completing" ? 0 : 1,
        transition: phase === "completing"
          ? "opacity 0.35s ease"
          : "width 0.25s ease",
      }}
    />
  );
}
