import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useReducedData } from "@/hooks/useReducedData";
import { heroEffects } from "./hero-effects.config";
import { useSceneVisibility } from "./useSceneVisibility";
import { useOpeningReady } from "./useOpeningReady";
import "./pulsating-frame.css";

// Same shader as the supplied OriginKit example, loaded only for a visible frame.
const BorderShader = lazy(() => import("@paper-design/shaders-react").then((module) => ({ default: module.PulsingBorder })));
const settings = heroEffects.border;

class BorderFallback extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

export function PulsatingFrame({ children, suspended = false }: { children: ReactNode; suspended?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const visible = useSceneVisibility(root);
  const openingReady = useOpeningReady(root);
  const reduced = useReducedMotion();
  const reducedData = useReducedData();
  useEffect(() => {
    const element = root.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const update = () => setSize((previous) => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      return width === previous.width && height === previous.height ? previous : { width, height };
    });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    update();
    return () => observer.disconnect();
  }, []);
  const worldWidth = size.width + settings.spread * 2;
  const worldHeight = size.height + settings.spread * 2;
  const room = Math.min(160, Math.ceil(0.4 * Math.min(worldWidth, worldHeight)));
  const bleed = settings.spread + room;
  const canRender = visible && openingReady && !suspended && !reducedData &&
    typeof WebGL2RenderingContext !== "undefined" && size.width > 0 && size.height > 0;
  return <div ref={root} className="v2-contact-shell" data-opening-copy>
    {children}
    {canRender && <div className="v2-pulsating-light" aria-hidden="true">
      <BorderFallback><Suspense fallback={null}>
        <BorderShader colors={[...settings.colors]} colorBack="rgba(0, 0, 0, 0)"
          speed={reduced ? 0 : settings.speed}
          roundness={settings.radius / 100} thickness={settings.thickness / 100}
          softness={settings.softness / 100} intensity={settings.intensity / 100}
          bloom={settings.bloom / 100} spots={settings.spots} spotSize={settings.spotSize / 200}
          pulse={settings.pulse} smoke={settings.smoke} smokeSize={settings.smokeSize}
          worldWidth={worldWidth} worldHeight={worldHeight} fit="none"
          marginLeft={settings.spread / worldWidth} marginRight={settings.spread / worldWidth}
          marginTop={settings.spread / worldHeight} marginBottom={settings.spread / worldHeight}
          scale={1} rotation={0} offsetX={0} offsetY={0} originX={0.5} originY={0.5} frame={0}
          minPixelRatio={0.5} maxPixelCount={size.width < 600 ? 150000 : 350000}
          style={{ position: "absolute", left: -bleed, top: -bleed,
            width: size.width + bleed * 2, height: size.height + bleed * 2,
            pointerEvents: "none" }} />
      </Suspense></BorderFallback>
    </div>}
  </div>;
}
