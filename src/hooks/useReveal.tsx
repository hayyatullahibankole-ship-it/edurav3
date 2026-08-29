import { useCallback, useRef, useState } from "react";

/**
 * Fade-and-rise reveal on scroll. Respects prefers-reduced-motion.
 * Uses a callback ref so it also works for nodes mounted after data loads.
 * Usage: const { ref, cls } = useReveal(); <div ref={ref} className={cls}>
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(delayMs = 0) {
  const [shown, setShown] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: T | null) => {
      observerRef.current?.disconnect();
      if (!node || shown) return;

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
        { rootMargin: "0px 0px -8% 0px", threshold: 0.02 }
      );

      observer.observe(node);
      observerRef.current = observer;

      // Safety net: never leave content invisible.
      window.setTimeout(() => setShown(true), 1200 + delayMs);
    },
    [delayMs, shown]
  );

  const cls = `transition-all duration-700 ease-out will-change-transform ${
    shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
  }`;

  return { ref, cls, shown };
}
