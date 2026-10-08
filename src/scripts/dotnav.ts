// Navegación por puntos: marca la sección que cruza el centro de la pantalla.
// El scroll suave al hacer clic lo da CSS (y es instantáneo con reduced motion).

const links = [...document.querySelectorAll<HTMLAnchorElement>("[data-dotnav] a[data-dot]")];

if (links.length) {
  const setActive = (id: string) => {
    for (const link of links) {
      if (link.dataset.dot === id) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setActive(entry.target.id);
      }
    },
    { rootMargin: "-50% 0px -50% 0px" },
  );

  for (const link of links) {
    const section = document.getElementById(link.dataset.dot ?? "");
    if (section) observer.observe(section);
  }
}

export {};
