const required = ['name', 'contact', 'roseId', 'quantity', 'paymentMethod', 'address'];

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

async function sendTelegram(env, order) {
  if (!env.BARA_TELEGRAM_BOT_TOKEN || !env.BARA_TELEGRAM_CHAT_ID) return { skipped: true };
  const text = [
    '🌹 Barashop preorder mới',
    `Tên: ${order.name}`,
    `Liên hệ: ${order.contact}`,
    `Email: ${order.email || '-'}`,
    `Mẫu hoa: ${order.roseId}`,
    `Số lượng: ${order.quantity}`,
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

async function sendEmail(env, order) {
  // Preferred for Cloudflare Pages: configure RESEND_API_KEY + ORDER_TO_EMAIL.
  // If not configured, checkout still sends Telegram and returns success.
  if (!env.RESEND_API_KEY) return { skipped: true };
  const to = env.ORDER_TO_EMAIL || 'thucao@iccjpn.com';
  const html = `
    <h1>Barashop preorder mới</h1>
    <ul>
      <li><b>Tên:</b> ${escapeHtml(order.name)}</li>
      <li><b>Liên hệ:</b> ${escapeHtml(order.contact)}</li>
      <li><b>Email:</b> ${escapeHtml(order.email || '-')}</li>
      <li><b>Mẫu hoa:</b> ${escapeHtml(order.roseId)}</li>
      <li><b>Số lượng:</b> ${escapeHtml(order.quantity)}</li>
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
      subject: `Barashop preorder — ${order.name}`,
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

  const missing = required.filter((key) => !order[key]);
  if (missing.length) return json({ error: `Missing fields: ${missing.join(', ')}` }, 400);
  if (!['PayPay', 'COD'].includes(order.paymentMethod)) return json({ error: 'Invalid payment method' }, 400);

  const telegram = await sendTelegram(env, order);
  const email = await sendEmail(env, order);

  if (telegram.ok === false && email.ok === false) {
    return json({ error: 'Could not send checkout notifications' }, 502);
  }

  return json({ ok: true, telegram, email });
}

export function onRequestGet() {
  return json({ ok: true, service: 'barashop checkout' });
}
