// Fixture: locale-aware formatting without an explicit locale. The count-up
// utility generates intermediate values in JS, so every frame renders with
// the browser default instead of the active locale.
export function animateCount(el: HTMLElement, target: number, locale: string) {
  let current = 0;
  const step = () => {
    current = Math.min(target, current + Math.ceil(target / 40));
    el.textContent = current.toLocaleString();
    if (current < target) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  // correct form, for contrast (must not add findings):
  el.setAttribute("aria-label", target.toLocaleString(locale));
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat().format(value);
}

export function formatDate(d: Date) {
  return d.toLocaleDateString();
}
