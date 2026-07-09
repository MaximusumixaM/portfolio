export function initSite(): void {
  initViewToggle();
  initProjectModal();
}

function initViewToggle(): void {
  const navButtons =
    document.querySelectorAll<HTMLButtonElement>("[data-view-target]");
  const panels = document.querySelectorAll<HTMLElement>("[data-view-panel]");

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.viewTarget;

      navButtons.forEach((btn) =>
        btn.setAttribute("aria-pressed", String(btn === button)),
      );
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.viewPanel !== target;
      });
    });
  });
}

function initProjectModal(): void {
  const modal = document.querySelector<HTMLDialogElement>(
    "[data-project-modal]",
  );
  const closeButton =
    modal?.querySelector<HTMLButtonElement>("[data-modal-close]");
  const cards = document.querySelectorAll<HTMLButtonElement>(
    "[data-project-slug]",
  );
  const panels = modal?.querySelectorAll<HTMLElement>("[data-project-panel]");

  if (!modal || !panels) return;

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const slug = card.dataset.projectSlug;
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.projectPanel !== slug;
      });
      modal.showModal();
    });
  });

  closeButton?.addEventListener("click", () => modal.close());

  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.close();
  });
}
