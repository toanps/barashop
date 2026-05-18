#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('data/roses.json');
const [id, availability, stockArg] = process.argv.slice(2);
const allowed = new Set(['preorder', 'limited_stock', 'sold_out']);
if (!id || !allowed.has(availability)) {
  console.error('Usage: node scripts/update-stock.js <id> <preorder|limited_stock|sold_out> [stock]');
  process.exit(1);
}
const roses = JSON.parse(fs.readFileSync(file, 'utf8'));
const rose = roses.find((item) => item.id === id);
if (!rose) {
  console.error(`Rose not found: ${id}`);
  process.exit(1);
}
rose.availability = availability;
rose.stock = stockArg == null ? (availability === 'preorder' ? 0 : rose.stock || 0) : Number(stockArg);
fs.writeFileSync(file, JSON.stringify(roses, null, 2) + '\n');
console.log(`Updated ${id}: ${availability}, stock=${rose.stock}`);
