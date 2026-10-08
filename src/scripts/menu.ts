// Menú móvil en un <dialog> modal: foco atrapado y Esc para cerrar (nativos).
// El bloqueo del scroll está en CSS (html:has(dialog[open])).

const dialog = document.querySelector<HTMLDialogElement>("[data-menu]");
const opener = document.querySelector<HTMLButtonElement>("[data-menu-open]");

if (dialog && opener) {
  opener.addEventListener("click", () => {
    dialog.showModal();
    opener.setAttribute("aria-expanded", "true");
  });

  dialog.addEventListener("close", () => opener.setAttribute("aria-expanded", "false"));

  dialog.querySelectorAll("[data-menu-close], a").forEach((el) => {
    el.addEventListener("click", () => dialog.close());
  });

  // Si la ventana se ensancha con el menú abierto, se cierra.
  window.matchMedia("(min-width: 860px)").addEventListener("change", (e) => {
    if (e.matches && dialog.open) dialog.close();
  });
}

export {};
