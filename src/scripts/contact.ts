// Envío del formulario a Formspree sin recargar. Sin JavaScript, el formulario hace un POST normal.

const form = document.querySelector<HTMLFormElement>("[data-contact-form]");

if (form) {
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const status = form.querySelector<HTMLElement>("[data-status]");
  const { sending = "", success = "", error = "" } = form.dataset;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!button || !status) return;

    const idleLabel = button.textContent;
    button.disabled = true;
    button.textContent = sending;
    status.textContent = "";
    status.removeAttribute("data-state");

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      form.reset();
      status.textContent = success;
      status.dataset.state = "success";
    } catch {
      status.textContent = error;
      status.dataset.state = "error";
    } finally {
      button.disabled = false;
      button.textContent = idleLabel;
    }
  });
}

export {};
