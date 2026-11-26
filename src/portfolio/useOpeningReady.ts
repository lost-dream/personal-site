import { useEffect, useState, type RefObject } from "react";

export function useOpeningReady(root: RefObject<HTMLElement | null>, duringTunnelReveal = false) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const page = root.current?.closest(".portfolio-v2");
    const update = () => {
      const phase = page?.getAttribute("data-opening");
      setReady(!page || phase === "complete" || (duringTunnelReveal && page.classList.contains("v2-cinematic-site") && ["tunnel", "handoff", "playing"].includes(phase || "")));
    };
    update();
    if (!page) return;
    const observer = new MutationObserver(update);
    observer.observe(page, { attributes: true, attributeFilter: ["data-opening"] });
    return () => observer.disconnect();
  }, [root, duringTunnelReveal]);
  return ready;
}
