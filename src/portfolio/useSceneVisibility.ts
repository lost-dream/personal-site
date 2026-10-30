import { useEffect, useState, type RefObject } from "react";

/** Stop expensive effects when their region or the browser tab is hidden. */
export function useSceneVisibility(root: RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(() => document.hidden);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(element);
    const update = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [root]);
  return visible && !hidden;
}
