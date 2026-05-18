#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { DatabaseSync } from 'node:sqlite';

const root = path.resolve(import.meta.dirname, '..');
const dbFile = path.join(root, 'data', 'barashop.sqlite');
const catalogFile = path.join(root, 'data', 'roses.json');
const validStatuses = new Set(['instock', 'preorder', 'out_of_order']);
const legacyToLocal = {
  preorder: 'preorder',
  limited_stock: 'instock',
  sold_out: 'out_of_order',
  instock: 'instock',
  out_of_order: 'out_of_order'
};
const localToLegacy = {
  instock: 'limited_stock',
  preorder: 'preorder',
  out_of_order: 'sold_out'
};

const db = new DatabaseSync(dbFile);
db.exec('PRAGMA foreign_keys = ON');

typecheckNodeSqlite();

const command = process.argv[2];
const args = process.argv.slice(3);

const commands = {
  init,
  import: importCatalog,
  export: exportCatalog,
  list: listItems,
  search: searchItems,
  add: addItem,
  update: updateItem,
  delete: deleteItem,
  status: changeStatus,
  'stock': changeStock,
  customers: listCustomers,
  'customer:add': addCustomer,
  'customer:update': updateCustomer,
  orders: listOrders,
  'order:add': addOrder,
  help
};

try {
  if (!command || command === 'help' || command === '--help' || command === '-h') help();
  else if (!commands[command]) fail(`Unknown command: ${command}\nRun: npm run bara -- help`);
  else commands[command](args);
} finally {
  db.close();
}

function typecheckNodeSqlite() {
  if (typeof DatabaseSync !== 'function') {
    fail('This CLI requires Node.js with node:sqlite support. Current Node should be v22+ or newer.');
  }
}

function ensureSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '',
      price INTEGER,
      currency TEXT NOT NULL DEFAULT 'JPY',
      status TEXT NOT NULL DEFAULT 'preorder' CHECK (status IN ('instock', 'preorder', 'out_of_order')),
      stock INTEGER NOT NULL DEFAULT 0,
      lead_time TEXT NOT NULL DEFAULT 'Preorder 2–4 ngày',
      featured INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL DEFAULT '',
      payment_methods TEXT NOT NULL DEFAULT 'PayPay,COD',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      customer_name TEXT NOT NULL,
      contact TEXT NOT NULL,
      items_json TEXT NOT NULL,
      total INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'JPY',
      payment_method TEXT NOT NULL DEFAULT 'PayPay',
      status TEXT NOT NULL DEFAULT 'new',
      address TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      ordered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    );
  `);
}

function init() {
  ensureSchema();
  if (rowCount('items') === 0 && fs.existsSync(catalogFile)) {
    importCatalog([], { silent: true });
  }
  console.log(`Database ready: ${relative(dbFile)}`);
}

function importCatalog(_args = [], options = {}) {
  ensureSchema();
  if (!fs.existsSync(catalogFile)) fail(`Catalog not found: ${relative(catalogFile)}`);
  const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8'));
  const upsert = db.prepare(`
    INSERT INTO items (id, name, color, price, currency, status, stock, lead_time, featured, description, image, payment_methods, sort_order, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      color = excluded.color,
      price = excluded.price,
      currency = excluded.currency,
      status = excluded.status,
      stock = excluded.stock,
      lead_time = excluded.lead_time,
      featured = excluded.featured,
      description = excluded.description,
      image = excluded.image,
      payment_methods = excluded.payment_methods,
      sort_order = excluded.sort_order,
      updated_at = CURRENT_TIMESTAMP
  `);
  db.exec('BEGIN');
  try {
    for (const [index, item] of catalog.entries()) {
      upsert.run(
        item.id,
        item.name,
        item.color || '',
        item.price == null ? null : Number(item.price),
        item.currency || 'JPY',
        legacyToLocal[item.availability] || 'preorder',
        Number(item.stock || 0),
        item.leadTime || '',
        item.featured ? 1 : 0,
        item.description || '',
        item.images?.[0] || '',
        (item.paymentMethods || ['PayPay', 'COD']).join(','),
        index
      );
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  if (!options.silent) console.log(`Imported ${catalog.length} catalog items into ${relative(dbFile)}`);
}

function exportCatalog() {
  ensureSchema();
  const rows = db.prepare('SELECT * FROM items ORDER BY sort_order, created_at, id').all();
  const catalog = rows.map(toCatalogItem);
  fs.writeFileSync(catalogFile, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`Exported ${catalog.length} items to ${relative(catalogFile)}`);
}

function listItems(args) {
  ensureSchema();
  const status = valueArg(args, '--status');
  const rows = status
    ? db.prepare('SELECT * FROM items WHERE status = ? ORDER BY id').all(normalizeStatus(status))
    : db.prepare('SELECT * FROM items ORDER BY id').all();
  printItems(rows);
}

function searchItems(args) {
  ensureSchema();
  const query = args.join(' ').trim();
  if (!query) fail('Usage: npm run bara -- search <keyword>');
  const like = `%${query}%`;
  const rows = db.prepare(`
    SELECT * FROM items
    WHERE id LIKE ? OR name LIKE ? OR color LIKE ? OR description LIKE ?
    ORDER BY id
  `).all(like, like, like, like);
  printItems(rows);
}

function addItem(args) {
  ensureSchema();
  const item = parseKeyValues(args);
  if (!item.id || !item.name) fail('Usage: npm run bara -- add --id <id> --name <name> [--color <color>] [--price <jpy>] [--image /images/file.png]');
  const status = normalizeStatus(item.status || 'preorder');
  const sortOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM items').get().next;
  db.prepare(`
    INSERT INTO items (id, name, color, price, currency, status, stock, lead_time, featured, description, image, payment_methods, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    item.id,
    item.name,
    item.color || '',
    item.price == null ? null : Number(item.price),
    item.currency || 'JPY',
    status,
    Number(item.stock || 0),
    item.leadTime || item['lead-time'] || defaultLeadTime(status),
    truthy(item.featured) ? 1 : 0,
    item.description || `${item.name} tinh tế, phù hợp làm quà tặng tại Nhật.`,
    item.image || '',
    item.paymentMethods || item['payment-methods'] || 'PayPay,COD',
    sortOrder
  );
  exportCatalog();
  console.log(`Added item: ${item.id}`);
}

function updateItem(args) {
  ensureSchema();
  const id = args[0];
  if (!id) fail('Usage: npm run bara -- update <id> --name <name> --price <jpy> ...');
  const changes = parseKeyValues(args.slice(1));
  const allowed = new Map([
    ['name', 'name'], ['color', 'color'], ['price', 'price'], ['currency', 'currency'],
    ['status', 'status'], ['stock', 'stock'], ['leadTime', 'lead_time'], ['lead-time', 'lead_time'],
    ['featured', 'featured'], ['description', 'description'], ['image', 'image'],
    ['paymentMethods', 'payment_methods'], ['payment-methods', 'payment_methods']
  ]);
  const sets = [];
  const values = [];
  for (const [key, raw] of Object.entries(changes)) {
    const column = allowed.get(key);
    if (!column) fail(`Unsupported item field: ${key}`);
    sets.push(`${column} = ?`);
    values.push(normalizeValue(column, raw));
  }
  if (!sets.length) fail('No changes provided.');
  values.push(id);
  const result = db.prepare(`UPDATE items SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);
  if (!result.changes) fail(`Item not found: ${id}`);
  exportCatalog();
  console.log(`Updated item: ${id}`);
}

function deleteItem(args) {
  ensureSchema();
  const id = args[0];
  if (!id) fail('Usage: npm run bara -- delete <id>');
  const result = db.prepare('DELETE FROM items WHERE id = ?').run(id);
  if (!result.changes) fail(`Item not found: ${id}`);
  exportCatalog();
  console.log(`Deleted item: ${id}`);
}

function changeStatus(args) {
  ensureSchema();
  const [id, rawStatus] = args;
  if (!id || !rawStatus) fail('Usage: npm run bara -- status <id> <instock|preorder|out_of_order> [stock]');
  const status = normalizeStatus(rawStatus);
  const stock = args[2] == null ? (status === 'preorder' || status === 'out_of_order' ? 0 : null) : Number(args[2]);
  const result = stock == null
    ? db.prepare('UPDATE items SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id)
    : db.prepare('UPDATE items SET status = ?, stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, stock, id);
  if (!result.changes) fail(`Item not found: ${id}`);
  exportCatalog();
  console.log(`Updated ${id}: ${status}${stock == null ? '' : `, stock=${stock}`}`);
}

function changeStock(args) {
  ensureSchema();
  const [id, stockArg] = args;
  if (!id || stockArg == null) fail('Usage: npm run bara -- stock <id> <quantity>');
  const stock = Number(stockArg);
  if (!Number.isInteger(stock) || stock < 0) fail('Stock must be a non-negative integer.');
  const status = stock > 0 ? 'instock' : 'out_of_order';
  const result = db.prepare('UPDATE items SET stock = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(stock, status, id);
  if (!result.changes) fail(`Item not found: ${id}`);
  exportCatalog();
  console.log(`Updated ${id}: ${status}, stock=${stock}`);
}

function listCustomers() {
  ensureSchema();
  const rows = db.prepare('SELECT id, name, contact, email, address, notes FROM customers ORDER BY updated_at DESC, id DESC').all();
  printTable(rows, ['id', 'name', 'contact', 'email', 'address', 'notes']);
}

function addCustomer(args) {
  ensureSchema();
  const customer = parseKeyValues(args);
  if (!customer.name || !customer.contact) fail('Usage: npm run bara -- customer:add --name <name> --contact <phone/line> [--email <email>] [--address <address>]');
  const result = db.prepare('INSERT INTO customers (name, contact, email, address, notes) VALUES (?, ?, ?, ?, ?)')
    .run(customer.name, customer.contact, customer.email || '', customer.address || '', customer.notes || '');
  console.log(`Added customer #${result.lastInsertRowid}: ${customer.name}`);
}

function updateCustomer(args) {
  ensureSchema();
  const id = args[0];
  if (!id) fail('Usage: npm run bara -- customer:update <id> --name <name> ...');
  const changes = parseKeyValues(args.slice(1));
  const allowed = new Set(['name', 'contact', 'email', 'address', 'notes']);
  const sets = [];
  const values = [];
  for (const [key, value] of Object.entries(changes)) {
    if (!allowed.has(key)) fail(`Unsupported customer field: ${key}`);
    sets.push(`${key} = ?`);
    values.push(value);
  }
  if (!sets.length) fail('No changes provided.');
  values.push(id);
  const result = db.prepare(`UPDATE customers SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);
  if (!result.changes) fail(`Customer not found: ${id}`);
  console.log(`Updated customer #${id}`);
}

function listOrders() {
  ensureSchema();
  const rows = db.prepare('SELECT id, customer_name, contact, total, currency, payment_method, status, ordered_at FROM orders ORDER BY ordered_at DESC, id DESC').all();
  printTable(rows, ['id', 'customer_name', 'contact', 'total', 'currency', 'payment_method', 'status', 'ordered_at']);
}

function addOrder(args) {
  ensureSchema();
  const order = parseKeyValues(args);
  if (!order.name || !order.contact || !order.items) {
    fail('Usage: npm run bara -- order:add --name <name> --contact <phone> --items <item-id:qty,item-id:qty> [--customer-id <id>]');
  }
  const items = parseOrderItems(order.items);
  const total = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const result = db.prepare(`
    INSERT INTO orders (customer_id, customer_name, contact, items_json, total, currency, payment_method, status, address, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    order.customerId || order['customer-id'] || null,
    order.name,
    order.contact,
    JSON.stringify(items),
    order.total == null ? total : Number(order.total),
    order.currency || 'JPY',
    order.payment || order.paymentMethod || order['payment-method'] || 'PayPay',
    order.status || 'new',
    order.address || '',
    order.notes || ''
  );
  console.log(`Added order #${result.lastInsertRowid}: ${Number(order.total == null ? total : order.total).toLocaleString('ja-JP')} JPY`);
}

function parseOrderItems(value) {
  return String(value).split(',').filter(Boolean).map((entry) => {
    const [id, qty = '1'] = entry.split(':');
    const item = db.prepare('SELECT id, name, price, currency FROM items WHERE id = ?').get(id);
    if (!item) fail(`Item not found for order: ${id}`);
    return { id: item.id, name: item.name, quantity: Number(qty), price: item.price, currency: item.currency };
  });
}

function toCatalogItem(row) {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    price: row.price,
    currency: row.currency,
    availability: localToLegacy[row.status] || 'preorder',
    stock: row.stock,
    leadTime: row.lead_time,
    featured: Boolean(row.featured),
    description: row.description,
    images: row.image ? [row.image] : [],
    paymentMethods: row.payment_methods ? row.payment_methods.split(',').map((item) => item.trim()).filter(Boolean) : ['PayPay', 'COD']
  };
}

function normalizeStatus(status) {
  const normalized = legacyToLocal[String(status).trim()] || String(status).trim();
  if (!validStatuses.has(normalized)) fail(`Status must be one of: ${[...validStatuses].join(', ')}`);
  return normalized;
}

function normalizeValue(column, raw) {
  if (column === 'status') return normalizeStatus(raw);
  if (column === 'price') return raw === '' ? null : Number(raw);
  if (column === 'stock') return Number(raw);
  if (column === 'featured') return truthy(raw) ? 1 : 0;
  return raw;
}

function parseKeyValues(args) {
  const values = {};
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (!key.startsWith('--')) fail(`Expected --key, got: ${key}`);
    const name = key.slice(2);
    const next = args[index + 1];
    if (next == null || next.startsWith('--')) {
      values[name] = 'true';
    } else {
      values[name] = next;
      index += 1;
    }
  }
  return values;
}

function valueArg(args, key) {
  const index = args.indexOf(key);
  return index === -1 ? null : args[index + 1];
}

function rowCount(table) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
}

function defaultLeadTime(status) {
  if (status === 'instock') return 'Có sẵn tại Nhật';
  if (status === 'out_of_order') return 'Tạm hết hàng';
  return 'Preorder 2–4 ngày';
}

function truthy(value) {
  return ['1', 'true', 'yes', 'y'].includes(String(value).toLowerCase());
}

function printItems(rows) {
  printTable(rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    price: row.price == null ? '' : `${Number(row.price).toLocaleString('ja-JP')} ${row.currency}`,
    status: row.status,
    stock: row.stock
  })), ['id', 'name', 'color', 'price', 'status', 'stock']);
}

function printTable(rows, columns) {
  if (!rows.length) {
    console.log('No records found.');
    return;
  }
  const widths = columns.map((column) => Math.max(column.length, ...rows.map((row) => String(row[column] ?? '').length)));
  console.log(columns.map((column, index) => column.padEnd(widths[index])).join('  '));
  console.log(widths.map((width) => '-'.repeat(width)).join('  '));
  for (const row of rows) {
    console.log(columns.map((column, index) => String(row[column] ?? '').padEnd(widths[index])).join('  '));
  }
}

function relative(file) {
  return path.relative(root, file);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function help() {
  console.log(`Barashop local CLI

Setup:
  npm run bara -- init
  npm run bara -- import
  npm run bara -- export

Catalog:
  npm run bara -- list [--status instock|preorder|out_of_order]
  npm run bara -- search <keyword>
  npm run bara -- add --id <id> --name <name> --color <color> --price <jpy> --image /images/file.png
  npm run bara -- update <id> --name <name> --price <jpy> --description <text>
  npm run bara -- status <id> <instock|preorder|out_of_order> [stock]
  npm run bara -- stock <id> <quantity>
  npm run bara -- delete <id>

CRM:
  npm run bara -- customers
  npm run bara -- customer:add --name <name> --contact <phone/line> [--email <email>] [--address <address>]
  npm run bara -- customer:update <id> --notes <notes>
  npm run bara -- orders
  npm run bara -- order:add --name <name> --contact <phone> --items <item-id:qty,item-id:qty> [--payment PayPay|COD]

Statuses for Toan: instock, preorder, out_of_order.
Static site compatibility: export writes data/roses.json using the existing availability values.
Local database: data/barashop.sqlite (ignored by git).
`);
}
