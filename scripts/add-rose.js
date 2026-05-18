#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('data/roses.json');
const roses = JSON.parse(fs.readFileSync(file, 'utf8'));
const [id, name, color] = process.argv.slice(2);
if (!id || !name || !color) {
  console.error('Usage: node scripts/add-rose.js <id> <name> <color> [price] [image]');
  process.exit(1);
}
if (roses.some((rose) => rose.id === id)) {
  console.error(`Rose already exists: ${id}`);
  process.exit(1);
}
const [, , , , , priceArg, imageArg] = process.argv;
roses.push({
  id,
  name,
  color,
  price: priceArg ? Number(priceArg) : null,
  currency: 'JPY',
  availability: 'preorder',
  stock: 0,
  leadTime: 'Đặt trước: thời gian giao sẽ xác nhận sau',
  featured: false,
  description: `${name} tinh tế, phù hợp làm quà tặng tại Nhật.`,
  images: imageArg ? [imageArg] : [],
  paymentMethods: ['PayPay', 'COD']
});
fs.writeFileSync(file, JSON.stringify(roses, null, 2) + '\n');
console.log(`Added rose: ${id}`);
