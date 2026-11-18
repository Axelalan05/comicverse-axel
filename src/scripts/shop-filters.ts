let activeSearch: HTMLInputElement | null = null;

export function mountShopFilters() {
  const search = document.querySelector<HTMLInputElement>('#search');
  const results = document.querySelector('#results');
  const empty = document.querySelector<HTMLElement>('#empty');
  if (search === activeSearch) return;
  activeSearch = search;
  if (!search || !results || !empty) return;

  const filters = document.querySelectorAll<HTMLButtonElement>('.filter');
  const cards = document.querySelectorAll<HTMLElement>('.comic-card');
  const requestedCategory = new URLSearchParams(location.search).get('categoria');
  let category = Array.from(filters).find(button => button.dataset.filter === requestedCategory)?.dataset.filter ?? 'Todos';
  const updateFilters = () => filters.forEach(button => {
    const isActive = button.dataset.filter === category;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  const filter = () => {
    const query = search.value.toLowerCase().trim();
    let visible = 0;
    cards.forEach(card => {
      const matchesCategory = category === 'Todos' || card.dataset.category === category;
      card.hidden = !(matchesCategory && card.dataset.title?.includes(query));
      if (!card.hidden) visible++;
    });
    results.textContent = `${visible} ${visible === 1 ? 'cómic disponible' : 'cómics disponibles'}`;
    empty.hidden = visible !== 0;
  };

  search.addEventListener('input', filter);
  filters.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.filter ?? 'Todos';
    updateFilters();
    filter();
  }));
  updateFilters();
  filter();
}
