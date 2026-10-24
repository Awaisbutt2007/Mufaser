/**
 * Site-wide motion (all pages). Content is fully visible without JavaScript;
 * everything here is skipped when the visitor prefers reduced motion.
 */

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)] as T[];

// ------------------------------------------------------------ reveal (CSS)
const reveals = $$('.reveal');
if (reduced || !('IntersectionObserver' in window)) {
  reveals.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target as HTMLElement;
      const siblings = [...(el.parentElement?.children ?? [])].filter((c) => c.classList.contains('reveal'));
      el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 6) * 80}ms`;
      el.classList.add('is-in');
      io.unobserve(el);
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  reveals.forEach((el) => io.observe(el));
}

// -------------------------------------------------- header hide / show
const header = document.querySelector<HTMLElement>('[data-header]');
if (header && !reduced) {
  let last = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    const menuOpen = header.querySelector('[aria-expanded="true"]') || document.body.dataset.menuOpen === 'true';
    if (!menuOpen && Math.abs(y - last) > 6) header.dataset.hidden = String(y > last && y > 240);
    last = y;
  }, { passive: true });
  header.addEventListener('focusin', () => { header.dataset.hidden = 'false'; });
}

/** Run non-critical motion setup once the page is idle, so it never delays first paint. */
const whenIdle = (fn: () => void) => {
  // Two frames after load guarantees a paint has happened before heavy work starts.
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200));
  const go = () => requestAnimationFrame(() => requestAnimationFrame(idle));
  if (document.readyState === 'complete') go();
  else addEventListener('load', go, { once: true });
};

// The GSAP-powered layer is loaded lazily once the page is idle.
if (!reduced) whenIdle(() => { void import('./motion-gsap').then((m) => m.setupMotion()); });
