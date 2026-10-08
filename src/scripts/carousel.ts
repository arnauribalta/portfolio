// Flechas de los carruseles: avanzan un elemento y se deshabilitan al principio y al final.

function setup(root: HTMLElement) {
  const track = root.querySelector<HTMLElement>("[data-carousel-track]");
  const prev = root.querySelector<HTMLButtonElement>("[data-carousel-prev]");
  const next = root.querySelector<HTMLButtonElement>("[data-carousel-next]");
  const controls = root.querySelector<HTMLElement>("[data-carousel-controls]");
  if (!track || !prev || !next || !controls) return;

  const step = () => {
    const first = track.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return first ? first.getBoundingClientRect().width + gap : track.clientWidth;
  };

  const update = () => {
    const max = track.scrollWidth - track.clientWidth;
    controls.hidden = max <= 2;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max - 2;
  };

  prev.addEventListener("click", () => track.scrollBy({ left: -step() }));
  next.addEventListener("click", () => track.scrollBy({ left: step() }));
  track.addEventListener("scroll", update, { passive: true });
  new ResizeObserver(update).observe(track);
  update();
}

document.querySelectorAll<HTMLElement>("[data-carousel]").forEach(setup);

export {};
