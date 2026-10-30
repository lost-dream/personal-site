import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function installPracticeScroll(root: HTMLElement) {
  const section = root.querySelector<HTMLElement>(".v2-practice");
  const stage = root.querySelector<HTMLElement>(".v2-practice-stage");
  const viewport = root.querySelector<HTMLElement>(".v2-practice-viewport");
  const track = root.querySelector<HTMLElement>(".v2-practice-track");
  const progress = root.querySelector<HTMLElement>(".v2-progress span");
  if (!section || !stage || !viewport || !track) return () => undefined;
  const media = gsap.matchMedia();
  media.add(
    "(min-width: 1024px) and (min-height: 740px) and (prefers-reduced-motion: no-preference) and (pointer: fine)",
    () => {
      const distance = () =>
        Math.max(0, track.scrollWidth - viewport.clientWidth);
      if (distance() < 1 || stage.scrollHeight > window.innerHeight + 2) return;
      let released = false;
      viewport.scrollLeft = 0;
      section.classList.add("is-pinned");
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1.1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            if (progress) progress.style.transform = `scaleX(${self.progress})`;
          },
        },
      });
      // Keyboard users keep a native scroll region; the wheel scene never traps focus.
      const release = () => {
        if (released) return;
        released = true;
        tween.scrollTrigger?.kill();
        tween.revert();
        section.classList.remove("is-pinned");
        if (progress) progress.style.removeProperty("transform");
      };
      const releaseForKeyboard = (event: FocusEvent | KeyboardEvent) => {
        if (released) return;
        if (
          event.type === "focusin" &&
          !(event.target as HTMLElement).matches(":focus-visible")
        )
          return;
        if (
          event.type === "keydown" &&
          !["ArrowLeft", "ArrowRight", "Tab"].includes(
            (event as KeyboardEvent).key,
          )
        )
          return;
        const topBefore = stage.getBoundingClientRect().top;
        const offsetBefore = Math.abs(Number(gsap.getProperty(track, "x")));
        release();
        // Keep the same chapter visible after removing its long pin spacer.
        window.scrollTo({
          top:
            window.scrollY +
            stage.getBoundingClientRect().top -
            Math.min(80, Math.max(0, topBefore)),
          behavior: "instant",
        });
        const figure = (event.target as HTMLElement).closest<HTMLElement>(
          "figure",
        );
        viewport.scrollLeft = figure
          ? Math.max(0, figure.offsetLeft - 24)
          : offsetBefore;
        // ScrollTrigger reparents the pinned node; restore focus lost in that move.
        (event.target as HTMLElement).focus({ preventScroll: true });
      };
      viewport.addEventListener("focusin", releaseForKeyboard);
      viewport.addEventListener("keydown", releaseForKeyboard);
      let frame = 0;
      const resize = new ResizeObserver(() => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          if (stage.scrollHeight > window.innerHeight + 2) release();
          else if (!released) ScrollTrigger.refresh();
        });
      });
      resize.observe(viewport);
      resize.observe(track);
      return () => {
        cancelAnimationFrame(frame);
        resize.disconnect();
        viewport.removeEventListener("focusin", releaseForKeyboard);
        viewport.removeEventListener("keydown", releaseForKeyboard);
        release();
      };
    },
  );
  return () => media.revert();
}
