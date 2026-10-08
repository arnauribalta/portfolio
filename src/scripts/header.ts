// Cabecera: fondo con desenfoque a partir de 8 px de scroll.

const header = document.querySelector<HTMLElement>("[data-header]");

if (header) {
  const update = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  update();
  window.addEventListener("scroll", update, { passive: true });
}

export {};
