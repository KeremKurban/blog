"use client";

import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.getElementById("article-body");
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const total = height - window.innerHeight * 0.6;
      setP(Math.min(1, Math.max(0, -top / Math.max(total, 1))));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div className="fixed inset-x-0 top-16 z-30 h-0.5 bg-transparent" aria-hidden="true">
      <div className="h-full origin-left bg-accent" style={{ transform: `scaleX(${p})` }} />
    </div>
  );
}
