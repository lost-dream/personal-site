import { useEffect, useRef, type CSSProperties } from "react";
import posters from "./works-background-photos.json";
import { emissionIntervalMs, posterLayout, posterPosition, worksBackgroundConfig as config } from "./works-background.config";
import "./works-floating-background.css";

type Flight = { start: number; sequence: number; layout: ReturnType<typeof posterLayout> };

/** A fixed-size decorative pool; no React updates or layout reads in the frame loop. */
export function WorksFloatingBackground({ paused, contained = false }: { paused: boolean; contained?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    const container = root.current;
    if (!container) return;
    const images = Array.from(container.querySelectorAll<HTMLImageElement>(".v2-paper-stream-image"));
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const flights: Array<Flight | null> = images.map(() => null);
    let viewport = { width: window.innerWidth, height: window.innerHeight };
    let clock = 0;
    let nextEmission = 0;
    let sequence = 0;
    let lastFrame: number | null = null;
    let frame = 0;
    let stopped = false;
    let inView = !contained;

    function setImage(index: number, sequenceNumber: number) {
      // 37 is coprime to the 88-item catalog: visit every image before repeating.
      const photo = posters[(sequenceNumber * 37) % posters.length];
      const layout = posterLayout(sequenceNumber, viewport, photo.width / photo.height);
      const img = images[index];
      img.src = `${import.meta.env.BASE_URL}media/works-background/${photo.file}`;
      img.style.width = `${layout.width}px`;
      img.style.height = `${layout.height}px`;
      return layout;
    }

    function reset() {
      cancelAnimationFrame(frame);
      images.forEach((img, index) => { img.style.opacity = "0"; flights[index] = null; });
      clock = 0; nextEmission = 0; sequence = 0; lastFrame = null;
      if (motion.matches) {
        // Static, subdued fallback. No conveyor, no bobbing, no running RAF.
        [0, 1, 2].forEach((index) => {
          const layout = setImage(index, index * 2);
          images[index].style.transform = `translate3d(${viewport.width * (0.12 + index * 0.34)}px, ${layout.top}px, 0) rotate(${layout.rotation}deg)`;
          images[index].style.opacity = "0.14";
        });
      } else frame = requestAnimationFrame(tick);
    }

    function tick(now: number) {
      if (stopped) return;
      if (document.hidden || pausedRef.current || !inView) { lastFrame = null; return; }
      // A delayed frame never produces a catch-up burst or a large positional jump.
      clock += lastFrame === null ? 0 : Math.min(1000, now - lastFrame);
      lastFrame = now;
      if (clock >= nextEmission) {
        const index = flights.findIndex((flight) => !flight);
        if (index >= 0) flights[index] = { start: clock, sequence, layout: setImage(index, sequence) };
        sequence += 1;
        nextEmission += emissionIntervalMs;
        if (nextEmission <= clock) nextEmission = clock + emissionIntervalMs;
      }
      flights.forEach((flight, index) => {
        if (!flight) return;
        const position = posterPosition(clock - flight.start, viewport.width, flight.layout);
        if (position.expired) { images[index].style.opacity = "0"; flights[index] = null; return; }
        const y = flight.layout.top + Math.sin(clock / config.floatPeriodMs * Math.PI * 2 + flight.sequence) * config.floatPx;
        images[index].style.transform = `translate3d(${position.x}px, ${y}px, 0) rotate(${flight.layout.rotation}deg)`;
        images[index].style.opacity = String(position.opacity);
      });
      frame = requestAnimationFrame(tick);
    }

    const resize = () => { viewport = { width: window.innerWidth, height: window.innerHeight }; reset(); };
    const visibility = () => {
      cancelAnimationFrame(frame); lastFrame = null;
      if (!document.hidden && !pausedRef.current && inView && !motion.matches) frame = requestAnimationFrame(tick);
    };
    // Observe the whole module boundary, not the sticky viewport inside it.
    // Preserve the active clock when users leave and return to this section.
    const observer = contained ? new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      visibility();
    }) : null;
    observer?.observe(container);
    // Event resumes after an explicit pause without recreating the pool or its clock.
    container.addEventListener("stream-resume", visibility);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("resize", resize);
    motion.addEventListener("change", reset);
    reset();
    return () => {
      stopped = true; cancelAnimationFrame(frame);
      observer?.disconnect();
      container.removeEventListener("stream-resume", visibility);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("resize", resize);
      motion.removeEventListener("change", reset);
    };
  }, [contained]);

  useEffect(() => { root.current?.dispatchEvent(new Event("stream-resume")); }, [paused]);

  return <div className={`v2-paper-stream${contained ? " is-section-contained" : ""}`} aria-hidden="true" ref={root} style={{
    "--paper-blur": `${config.blurPx}px`, "--paper-radius": `${config.radiusPx}px`, "--paper-feather": `${config.featherPx}px`,
  } as CSSProperties}>
    <div className="v2-paper-stream-viewport">
      {Array.from({ length: config.poolSize }, (_, index) => <img className="v2-paper-stream-image" key={index} alt="" decoding="async" draggable={false} />)}
      <div className="v2-paper-stream-veil" />
    </div>
  </div>;
}
