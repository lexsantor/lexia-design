// Fixture: scroll-smoothing library adopted without justification
// (motion/scroll-hijack-lib). Native scroll is the default.
import Lenis from "lenis";

export function initSmoothScroll() {
  const lenis = new Lenis({ duration: 1.2 });
  function raf(time: number) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
  return lenis;
}
