import { useEffect, useState, type RefObject } from "react";

export function useOpeningReady(root: RefObject<HTMLElement | null>) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const page = root.current?.closest(".portfolio-v2");
    const update = () => setReady(!page || page.getAttribute("data-opening") === "complete");
    update();
    if (!page) return;
    const observer = new MutationObserver(update);
    observer.observe(page, { attributes: true, attributeFilter: ["data-opening"] });
    return () => observer.disconnect();
  }, [root]);
  return ready;
}
