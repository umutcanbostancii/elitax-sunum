const filters = document.querySelector("[data-filters]");
if (filters) {
  const cards = [...document.querySelectorAll("[data-publication-type]")];
  const options = [...filters.querySelectorAll("button[data-filter]")];
  const status = document.querySelector("[data-filter-status]");
  function select(button) {
    const kind = button.dataset.filter;
    for (const option of options) {
      option.setAttribute("aria-pressed", String(option === button));
    }
    for (const card of cards) {
      card.hidden = Boolean(kind && card.dataset.publicationType !== kind);
    }
    status.textContent = `${cards.filter(card => !card.hidden).length} yayın`;
  }

  filters.hidden = false;
  const query = new URLSearchParams(location.search).get("tur");
  if (query) select(options.find(option => option.dataset.filter === query) || options[0]);
  filters.addEventListener("click", event => {
    const button = event.target.closest("button[data-filter]");
    if (button) select(button);
  });
}
