import { heroOpeningMotion as motion } from "./hero-opening.config";

type Phase = "holding" | "film" | "freeze" | "tunnel" | "handoff" | "playing" | "complete";

/** Event-driven film, then one active-time sequence. No seeking or layout reads per frame. */
export function installHeroLightOpening(root: HTMLElement, video: HTMLVideoElement, countdownMs: number,
  remaining: (seconds: number) => void, release: () => void) {
  const started = Date.now();
  let lastTick = started;
  let elapsed = 0;
  let phase: Phase = "holding";
  let disposed = false;
  let failed = false;
  let interval = 0;
  const quiet = window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    window.matchMedia("(prefers-reduced-data: reduce)").matches ||
    Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
  const skip = root.querySelector<HTMLButtonElement>("[data-opening-skip]");
  const variables = new Map<string, string>();
  const variable = (key: string, value: string) => {
    if (!variables.has(key)) variables.set(key, root.style.getPropertyValue(key));
    root.style.setProperty(key, value);
  };
  variable("--light-tunnel-reveal", `${quiet ? 200 : motion.tunnelRevealMs}ms`);
  variable("--light-film-fade", `${quiet ? 200 : motion.filmFadeMs}ms`);

  const frameTunnel = () => {
    const gallery = root.querySelector<HTMLElement>("[data-v2-opening-gallery]");
    if (!gallery) return;
    // Measure the final layout once, without its temporary introduction transform.
    const previous = gallery.style.transform;
    gallery.style.transform = "none";
    const rect = gallery.getBoundingClientRect();
    gallery.style.transform = previous;
    if (!rect.width || !rect.height) return;
    const desktop = window.innerWidth >= 1024;
    const availableWidth = window.innerWidth * (desktop ? 0.57 : 0.96);
    const scale = Math.min(1, availableWidth / rect.width, window.innerHeight * 0.92 / rect.height);
    const centerX = window.innerWidth * (desktop ? 0.715 : 0.5);
    variable("--light-tunnel-x", `${centerX - rect.left - rect.width / 2}px`);
    variable("--light-tunnel-y", `${window.innerHeight * 0.5 - rect.top - rect.height / 2}px`);
    variable("--light-tunnel-scale", String(scale));
  };
  const enter = (next: Phase) => {
    if (disposed || phase === "complete") return;
    phase = next; elapsed = 0; lastTick = Date.now();
    if (next === "freeze") { video.pause(); frameTunnel(); }
    root.setAttribute("data-opening", next);
    if (next === "complete") {
      video.pause(); remaining(0); release(); window.clearInterval(interval);
    }
  };
  const filmEnded = () => { if (phase === "film") enter("freeze"); };
  const play = () => {
    if (disposed || phase !== "film" || document.hidden) return;
    video.muted = true;
    try { void video.play()?.catch(() => { if (!disposed) filmEnded(); }); }
    catch { filmEnded(); }
  };
  const startFilm = () => {
    if (quiet || failed || video.error) { enter("freeze"); return; }
    enter("film"); play();
  };
  const tick = () => {
    const now = Date.now();
    const delta = Math.max(0, now - lastTick);
    lastTick = now;
    if (phase === "holding") {
      remaining(Math.max(0, Math.ceil((countdownMs - (now - started)) / 1000)));
      if (!document.hidden && now - started >= countdownMs) startFilm();
      return;
    }
    if (document.hidden || phase === "complete") return;
    elapsed += delta;
    if (phase === "film" && elapsed >= motion.mediaTimeoutMs) filmEnded();
    else if (phase === "freeze" && elapsed >= (quiet ? 200 : motion.freezeMs)) enter("tunnel");
    else if (phase === "tunnel" && elapsed >= (quiet ? 400 : motion.tunnelRevealMs + motion.tunnelHoldMs)) enter("handoff");
    else if (phase === "handoff" && elapsed >= (quiet ? 200 : motion.filmFadeMs)) enter("playing");
    else if (phase === "playing" && elapsed >= motion.contentRevealMs) enter("complete");
  };
  const visibility = () => {
    lastTick = Date.now();
    if (document.hidden) video.pause();
    else { if (phase === "film") play(); tick(); }
  };
  const error = () => { failed = true; filmEnded(); };
  const finish = () => enter("complete");
  root.setAttribute("data-opening", "holding");
  video.addEventListener("ended", filmEnded);
  video.addEventListener("error", error);
  document.addEventListener("visibilitychange", visibility);
  window.addEventListener("resize", frameTunnel);
  skip?.addEventListener("click", finish);
  interval = window.setInterval(tick, 100);
  return () => {
    disposed = true; window.clearInterval(interval); video.pause();
    video.removeEventListener("ended", filmEnded);
    video.removeEventListener("error", error);
    document.removeEventListener("visibilitychange", visibility);
    window.removeEventListener("resize", frameTunnel);
    skip?.removeEventListener("click", finish);
    for (const [key, previous] of variables) {
      if (previous) root.style.setProperty(key, previous); else root.style.removeProperty(key);
    }
  };
}
