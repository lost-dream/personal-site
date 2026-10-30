import { useEffect, useState, type RefObject } from "react";

/** Start requesting media shortly before it enters view, once per mounted region. */
export function useNearViewport(root: RefObject<HTMLElement | null>, margin = "600px") {
  const [ready, setReady] = useState(() => typeof IntersectionObserver === "undefined");
  useEffect(() => {
    const element = root.current;
    if (!element || ready) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setReady(true);
      observer.disconnect();
    }, { rootMargin: margin });
    observer.observe(element);
    return () => observer.disconnect();
  }, [root, margin, ready]);
  return ready;
}
