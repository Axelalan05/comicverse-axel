import { comics } from '../data/comics.js';

const cartKey = 'comicverse-cart';
type CartItem = { id: number; title: string };

function getCart(): CartItem[] {
  try {
    const items = JSON.parse(localStorage.getItem(cartKey) || '[]');
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function updateCart(cart = getCart()) {
  const badge = document.querySelector('#cart-count');
  const count = cart.length;
  const label = `${count} ${count === 1 ? 'cómic' : 'cómics'}`;

  if (badge) {
    badge.textContent = String(count);
    badge.closest('a')?.setAttribute('aria-label', `Ver carrito, ${label}`);
  }

  const items = document.querySelector('#cart-items');
  const template = document.querySelector<HTMLTemplateElement>('#cart-item-template');
  if (!items || !template) return;

  document.querySelector('#cart-empty')?.toggleAttribute('hidden', count !== 0);
  document.querySelector('#cart-panel')?.toggleAttribute('hidden', count === 0);
  const total = document.querySelector('#cart-total');
  if (total) total.textContent = label;

  items.replaceChildren(...cart.map((item, index) => {
    const row = template.content.cloneNode(true) as DocumentFragment;
    const comic = comics.find(({ id }) => id === item.id);
    const cover = row.querySelector<HTMLImageElement>('.cart-cover')!;
    cover.hidden = !comic;
    if (comic) cover.src = comic.image;
    row.querySelector('.cart-item-title')!.textContent = item.title;
    row.querySelector('.cart-item-category')!.textContent = comic?.category ?? '';
    const remove = row.querySelector<HTMLButtonElement>('[data-cart-remove]')!;
    remove.dataset.cartRemove = String(index);
    remove.setAttribute('aria-label', `Quitar ${item.title} del carrito`);
    return row;
  }));
}

const feedbackTimers = new WeakMap<HTMLButtonElement, number>();

export function handleCartClick(event: MouseEvent) {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest<HTMLButtonElement>('.add-cart, [data-cart-remove], #clear-cart');
  if (!button) return;

  const cart = getCart();
  const index = Number(button.dataset.cartRemove);
  if (button.classList.contains('add-cart')) {
    cart.push({ id: Number(button.dataset.id), title: button.dataset.title! });
    window.clearTimeout(feedbackTimers.get(button));
    button.textContent = '✓ Agregado';
    feedbackTimers.set(button, window.setTimeout(() => {
      button.textContent = '+ Agregar al carrito';
    }, 1100));
  } else if (button.id === 'clear-cart') {
    cart.length = 0;
  } else {
    cart.splice(index, 1);
  }

  if (cart.length) localStorage.setItem(cartKey, JSON.stringify(cart));
  else localStorage.removeItem(cartKey);
  updateCart(cart);

  if (!cart.length) {
    document.querySelector<HTMLElement>('#cart-empty a')?.focus();
  } else if (Number.isInteger(index)) {
    const nextIndex = Math.min(index, cart.length - 1);
    document.querySelector<HTMLElement>(`[data-cart-remove="${nextIndex}"]`)?.focus();
  }
}

export function syncCartOnStorage(event: StorageEvent) {
  if (event.key === cartKey || event.key === null) updateCart();
}
