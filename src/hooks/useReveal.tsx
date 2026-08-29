import { useEffect, useRef, useState } from "react";

/**
 * Fade-and-rise reveal on scroll. Respects prefers-reduced-motion.
 * Usage: const { ref, cls } = useReveal(); <div ref={ref} className={cls}>
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(delayMs = 0) {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            window.setTimeout(() => setShown(true), delayMs);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [delayMs]);

  const cls = `transition-all duration-700 ease-out will-change-transform ${
    shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
  }`;

  return { ref, cls, shown };
}
