const required = ['name', 'contact', 'items', 'paymentMethod', 'address'];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);
}

function normalizeItems(order) {
  if (Array.isArray(order.items) && order.items.length) {
    return order.items.map((item) => ({
      id: item.id,
      name: item.name || item.id,
      quantity: Number(item.quantity || 1),
      price: item.price,
      currency: item.currency || 'JPY'
    }));
  }
  if (order.roseId) {
    return [{ id: order.roseId, name: order.roseId, quantity: Number(order.quantity || 1), price: null, currency: 'JPY' }];
  }
  return [];
}

function itemLines(items) {
  return items.map((item) => {
    const price = item.price ? `${Number(item.price).toLocaleString('ja-JP')} ${item.currency}` : 'Giá xác nhận sau';
    return `- ${item.name} x ${item.quantity} (${price})`;
  }).join('\n');
}

function itemHtml(items) {
  return items.map((item) => {
    const price = item.price ? `${Number(item.price).toLocaleString('ja-JP')} ${escapeHtml(item.currency)}` : 'Giá xác nhận sau';
    return `<li>${escapeHtml(item.name)} x ${escapeHtml(item.quantity)} — ${escapeHtml(price)}</li>`;
  }).join('');
}

async function sendTelegram(env, order, items) {
  if (!env.BARA_TELEGRAM_BOT_TOKEN || !env.BARA_TELEGRAM_CHAT_ID) return { skipped: true };
  const total = order.total ? `${Number(order.total).toLocaleString('ja-JP')} JPY` : 'Xác nhận sau';
  const text = [
    '🌹 Barashop đơn hàng mới',
    `Tên: ${order.name}`,
    `SĐT: ${order.contact}`,
    `Email: ${order.email || '-'}`,
    'Sản phẩm:',
    itemLines(items),
    `Tạm tính: ${total}`,
    `Thanh toán: ${order.paymentMethod}`,
    `Địa chỉ: ${order.address}`,
    `Ghi chú: ${order.message || '-'}`
  ].join('\n');

  const response = await fetch(`https://api.telegram.org/bot${env.BARA_TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.BARA_TELEGRAM_CHAT_ID, text })
  });
  return { ok: response.ok, status: response.status };
}

async function sendEmail(env, order, items) {
  if (!env.RESEND_API_KEY) return { skipped: true };
  const to = env.ORDER_TO_EMAIL || 'thucao@iccjpn.com';
  const total = order.total ? `${Number(order.total).toLocaleString('ja-JP')} JPY` : 'Xác nhận sau';
  const html = `
    <h1>Barashop đơn hàng mới</h1>
    <ul>
      <li><b>Tên:</b> ${escapeHtml(order.name)}</li>
      <li><b>SĐT:</b> ${escapeHtml(order.contact)}</li>
      <li><b>Email:</b> ${escapeHtml(order.email || '-')}</li>
      <li><b>Sản phẩm:</b><ul>${itemHtml(items)}</ul></li>
      <li><b>Tạm tính:</b> ${escapeHtml(total)}</li>
      <li><b>Thanh toán:</b> ${escapeHtml(order.paymentMethod)}</li>
      <li><b>Địa chỉ:</b> ${escapeHtml(order.address)}</li>
      <li><b>Ghi chú:</b> ${escapeHtml(order.message || '-')}</li>
    </ul>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.ORDER_FROM_EMAIL || 'Barashop <orders@barashop.pages.dev>',
      to,
      subject: `Barashop order — ${order.name}`,
      html
    })
  });
  return { ok: response.ok, status: response.status };
}

export async function onRequestPost({ request, env }) {
  let order;
  try {
    order = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const items = normalizeItems(order);
  order.items = items;

  const missing = required.filter((key) => key === 'items' ? !items.length : !order[key]);
  if (missing.length) return json({ error: `Missing fields: ${missing.join(', ')}` }, 400);
  if (!['PayPay', 'COD'].includes(order.paymentMethod)) return json({ error: 'Invalid payment method' }, 400);

  const telegram = await sendTelegram(env, order, items);
  const email = await sendEmail(env, order, items);

  if (telegram.ok === false && email.ok === false) {
    return json({ error: 'Could not send checkout notifications' }, 502);
  }

  return json({ ok: true, telegram, email });
}

export function onRequestGet() {
  return json({ ok: true, service: 'barashop checkout' });
}
