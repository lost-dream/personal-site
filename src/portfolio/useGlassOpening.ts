import { useLayoutEffect, useState, type RefObject } from "react";

export const openingHoldDuration = 8000;
export const openingRevealDuration = 1400;
export const openingDuration = openingHoldDuration + openingRevealDuration;

/** Wall-clock countdown: background tabs don't turn eight seconds into eight ticks. */
export function useGlassOpening(root: RefObject<HTMLDivElement | null>) {
  const [remaining, setRemaining] = useState(openingHoldDuration / 1000);
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    if (!element.querySelector(".v2-glass-opening")) {
      element.setAttribute("data-opening", "complete");
      return;
    }
    const start = Date.now();
    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    const content = [...element.children].filter(child => !child.classList.contains("v2-glass-opening"));
    const previouslyInert = content.map(child => child.hasAttribute("inert"));
    content.forEach(child => child.setAttribute("inert", ""));
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    element.setAttribute("data-opening", "holding");
    const release = () => {
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
      content.forEach((child, index) => { if (!previouslyInert[index]) child.removeAttribute("inert"); });
    };
    let interval = 0;
    const update = () => {
      const elapsed = Date.now() - start;
      setRemaining(Math.max(0, Math.ceil((openingHoldDuration - elapsed) / 1000)));
      if (elapsed >= openingDuration) {
        element.setAttribute("data-opening", "complete");
        release();
        window.clearInterval(interval);
      } else if (elapsed >= openingHoldDuration && element.getAttribute("data-opening") !== "playing") {
        element.setAttribute("data-opening", "playing");
      }
    };
    interval = window.setInterval(update, 100);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", update);
      release();
    };
  }, [root]);
  return remaining;
}
