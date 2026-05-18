import roses from '../data/roses.json' assert { type: 'json' };

const roseGrid = document.querySelector('#roseGrid');
const roseSelect = document.querySelector('#roseSelect');
const form = document.querySelector('#checkoutForm');
const status = document.querySelector('#formStatus');
document.querySelector('#year').textContent = new Date().getFullYear();

const availabilityLabel = {
  preorder: 'Preorder',
  limited_stock: 'Còn ít',
  sold_out: 'Tạm hết'
};

function priceText(rose) {
  return rose.price ? `${rose.price.toLocaleString('ja-JP')} ${rose.currency}` : 'Giá xác nhận sau';
}

roseGrid.innerHTML = roses.map((rose) => `
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
    </div>
  </article>
`).join('');

roseSelect.innerHTML = roses.map((rose) => `<option value="${rose.id}">${rose.name} — ${priceText(rose)}</option>`).join('');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  status.textContent = 'Đang gửi đơn...';
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.quantity = Number(payload.quantity || 1);

  try {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Không gửi được đơn.');
    form.reset();
    status.textContent = 'Đã gửi đơn. Barashop sẽ liên hệ xác nhận sớm.';
  } catch (error) {
    status.textContent = `Lỗi: ${error.message}`;
  }
});
