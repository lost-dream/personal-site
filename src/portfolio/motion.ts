import { useEffect, type RefObject } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useGlassOpening } from "./useGlassOpening";

export function useV2Motion(root: RefObject<HTMLDivElement | null>) {
  const reduced = useReducedMotion();
  const remaining = useGlassOpening(root);
  useEffect(() => {
    const element = root.current;
    if (!element || reduced) return;
    let active = true;
    const cleanup: Array<() => void> = [];
    void import("animejs")
      .then(({ animate, stagger }) => {
        if (!active) return;
        try {
          const observer = new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                observer.unobserve(entry.target);
                const target = entry.target as HTMLElement;
                try {
                  if (target.hasAttribute("data-v2-title")) {
                    const animation = animate(target, {
                      x: ["18vw", 0],
                      scaleX: [0.76, 1],
                      opacity: [0, 1],
                      duration: 1400,
                      ease: "outExpo",
                    });
                    cleanup.push(() => animation.revert());
                  } else {
                    const items = target.querySelectorAll("[data-v2-item]");
                    if (items.length) {
                      const animation = animate(items, {
                        y: [70, 0],
                        opacity: [0, 1],
                        duration: 1200,
                        delay: stagger(160, { start: 250 }),
                        ease: "outExpo",
                      });
                      cleanup.push(() => animation.revert());
                    }
                  }
                } catch {
                  /* Content is visible by default if animation initialization fails. */
                }
              }
            },
            { threshold: 0, rootMargin: "0px 0px -7% 0px" },
          );
          element
            .querySelectorAll("[data-v2-title], [data-v2-group]")
            .forEach((item) => observer.observe(item));
          cleanup.push(() => observer.disconnect());
        } catch {
          /* Opening is progressive enhancement. */
        }
      })
      .catch(() => undefined);
    // Legacy previews still use the horizontal track. The main gallery does not.
    if (element.querySelector(".v2-practice-track")) void import("./practiceScroll")
      .then(({ installPracticeScroll }) => {
        if (!active) return;
        try {
          cleanup.push(installPracticeScroll(element));
        } catch {
          /* Native scrolling stays available. */
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
      for (const dispose of cleanup.reverse()) {
        try {
          dispose();
        } catch {
          /* Always clean up the remaining systems. */
        }
      }
    };
  }, [reduced, root]);
  return remaining;
}
