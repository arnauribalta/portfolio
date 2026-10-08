// Aparición al hacer scroll: una sola vez, 80 ms entre elementos que entran a la vez.
// Si este script no llega a ejecutarse, todo queda visible (la clase reveal-on la pone él).

const items = document.querySelectorAll<HTMLElement>("[data-reveal]");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (items.length && !reduced && "IntersectionObserver" in window) {
  document.documentElement.classList.add("reveal-on");

  const observer = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry, i) => {
          const el = entry.target as HTMLElement;
          el.style.setProperty("--reveal-delay", `${i * 80}ms`);
          el.classList.add("is-visible");
          observer.unobserve(el);
        });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
  );

  items.forEach((el) => observer.observe(el));
}

export {};
