import roses from '../data/roses.json' assert { type: 'json' };

const roseGrid = document.querySelector('#roseGrid');
const form = document.querySelector('#checkoutForm');
const status = document.querySelector('#formStatus');
const cartItems = document.querySelector('#cartItems');
const cartTotal = document.querySelector('#cartTotal');
const clearCart = document.querySelector('#clearCart');
document.querySelector('#year').textContent = new Date().getFullYear();

const CART_KEY = 'barashop-cart-v1';
let cart = loadCart();

const availabilityLabel = {
  preorder: 'Preorder',
  limited_stock: 'Còn ít',
  sold_out: 'Tạm hết'
};

function priceText(rose) {
  return rose.price ? `${rose.price.toLocaleString('ja-JP')} ${rose.currency}` : 'Giá xác nhận sau';
}

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getRose(id) {
  return roses.find((rose) => rose.id === id);
}

function cartCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function cartAmount() {
  return cart.reduce((sum, item) => {
    const rose = getRose(item.id);
    return sum + (rose?.price || 0) * item.quantity;
  }, 0);
}

function renderProducts() {
  roseGrid.innerHTML = roses.slice(0, 16).map((rose) => `
    <article class="rose-card">
      <img src="${rose.images?.[0] || '/images/hong-do-naomi.png'}" alt="${rose.name}" />
      <div class="rose-body">
        <div class="rose-meta">
          <span>${rose.color}</span>
          <strong>${availabilityLabel[rose.availability] || rose.availability}</strong>
        </div>
        <h3>${rose.name}</h3>
        <p>${rose.description}</p>
        <div class="rose-footer">
          <span>${priceText(rose)}</span>
          <small>${rose.leadTime}</small>
        </div>
        <button class="button primary add-cart" type="button" data-id="${rose.id}">Thêm vào giỏ</button>
      </div>
    </article>
  `).join('');
}

function renderCart() {
  if (!cart.length) {
    cartItems.textContent = 'Chưa có sản phẩm nào.';
    cartTotal.textContent = '0 JPY';
    return;
  }

  cartItems.innerHTML = cart.map((item) => {
    const rose = getRose(item.id);
    if (!rose) return '';
    return `
      <div class="cart-row">
        <div>
          <strong>${rose.name}</strong>
          <small>${priceText(rose)}</small>
        </div>
        <div class="qty-control">
          <button type="button" data-action="decrease" data-id="${rose.id}">−</button>
          <span>${item.quantity}</span>
          <button type="button" data-action="increase" data-id="${rose.id}">+</button>
        </div>
      </div>
    `;
  }).join('');

  cartTotal.textContent = `${cartAmount().toLocaleString('ja-JP')} JPY`;
}

function addToCart(id) {
  const existing = cart.find((item) => item.id === id);
  if (existing) existing.quantity += 1;
  else cart.push({ id, quantity: 1 });
  saveCart();
  renderCart();
  status.textContent = `Đã thêm vào giỏ (${cartCount()} sản phẩm).`;
}

function changeQty(id, delta) {
  cart = cart.map((item) => item.id === id ? { ...item, quantity: item.quantity + delta } : item)
    .filter((item) => item.quantity > 0);
  saveCart();
  renderCart();
}

roseGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-id]');
  if (!button) return;
  addToCart(button.dataset.id);
  document.querySelector('#checkout').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

cartItems.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  changeQty(button.dataset.id, button.dataset.action === 'increase' ? 1 : -1);
});

clearCart.addEventListener('click', () => {
  cart = [];
  saveCart();
  renderCart();
  status.textContent = 'Đã xóa giỏ hàng.';
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!cart.length) {
    status.textContent = 'Vui lòng thêm ít nhất 1 sản phẩm vào giỏ.';
    document.querySelector('#roses').scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  status.textContent = 'Đang gửi đơn...';
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.items = cart.map((item) => {
    const rose = getRose(item.id);
    return {
      id: item.id,
      name: rose?.name || item.id,
      price: rose?.price || null,
      currency: rose?.currency || 'JPY',
      quantity: item.quantity
    };
  });
  payload.total = cartAmount();

  try {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Không gửi được đơn.');
    form.reset();
    cart = [];
    saveCart();
    renderCart();
    status.textContent = 'Đã gửi đơn. Barashop sẽ liên hệ xác nhận sớm.';
  } catch (error) {
    status.textContent = `Lỗi: ${error.message}`;
  }
});

renderProducts();
renderCart();
