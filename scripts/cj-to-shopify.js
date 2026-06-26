#!/usr/bin/env node
/**
 * CJDropshipping → Shopify product import CSV
 *
 * Usage:
 *   node scripts/cj-to-shopify.js input.csv [output.csv]
 *
 * CJDropshipping export columns expected (flexible — script maps by header name):
 *   Product Name, SKU, Selling Price, Category, Description, Image URL,
 *   Weight (g), Inventory, Variant Name, Variant Value
 *
 * Output: Shopify product import CSV (same format as glowrig-products.csv)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Config ───────────────────────────────────────────────────────────────────

const VENDOR   = 'GlowRig';
const MARGINS  = { default: 2.5, lighting: 2.8, mat: 2.2 }; // drop cost multipliers
const ROUND_TO = 0.05; // round retail price to nearest $0.05
const TAGS_MAP = {
  'mat':        'desk mat, gaming desk mat, aesthetic, battlestation, extended mousepad, GlowRig',
  'light':      'monitor light bar, RGB lighting, desk lighting, aesthetic, GlowRig',
  'rgb':        'RGB lighting, ambient lighting, bias lighting, aesthetic, GlowRig',
  'stand':      'headphone stand, desk organisation, aesthetic, GlowRig',
  'bundle':     'bundle, starter kit, best value, desk setup, GlowRig',
  'default':    'gaming accessories, desk setup, aesthetic, battlestation, GlowRig',
};

// ── CSV parser (no dependencies) ─────────────────────────────────────────────

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuote = false, i = 0;
  const push = () => { row.push(field); field = ''; };
  while (i < text.length) {
    const ch = text[i];
    if (inQuote) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 2; continue; }
      if (ch === '"') { inQuote = false; i++; continue; }
      field += ch;
    } else {
      if (ch === '"') { inQuote = true; i++; continue; }
      if (ch === ',') { push(); i++; continue; }
      if (ch === '\r' && text[i + 1] === '\n') { push(); rows.push(row); row = []; i += 2; continue; }
      if (ch === '\n') { push(); rows.push(row); row = []; i++; continue; }
      field += ch;
    }
    i++;
  }
  if (field || row.length) { push(); rows.push(row); }
  return rows;
}

function toObject(headers, row) {
  const obj = {};
  headers.forEach((h, i) => { obj[h.trim()] = (row[i] || '').trim(); });
  return obj;
}

function quoteCSV(val) {
  if (val === undefined || val === null) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function roundPrice(p) {
  return Math.ceil(p / ROUND_TO) * ROUND_TO;
}

function getMargin(category, name) {
  const key = (category + name).toLowerCase();
  if (key.includes('light') || key.includes('rgb') || key.includes('bias')) return MARGINS.lighting;
  if (key.includes('mat')) return MARGINS.mat;
  return MARGINS.default;
}

function getTags(category, name) {
  const key = (category + name).toLowerCase();
  for (const [k, v] of Object.entries(TAGS_MAP)) {
    if (key.includes(k)) return v;
  }
  return TAGS_MAP.default;
}

function buildDescription(name, features) {
  const lines = features.length
    ? `<ul>${features.map(f => `<li>${f}</li>`).join('')}</ul>`
    : '';
  return `<p>${name} — curated by GlowRig for setups that take aesthetics seriously.</p>${lines}<p>Fast shipping Australia-wide. 30-day returns.</p>`;
}

// ── Column name aliases (CJDropshipping uses inconsistent headers) ────────────

function col(obj, ...keys) {
  for (const k of keys) {
    const found = Object.keys(obj).find(h => h.toLowerCase().includes(k.toLowerCase()));
    if (found && obj[found]) return obj[found];
  }
  return '';
}

// ── Shopify CSV row builder ───────────────────────────────────────────────────

const SHOPIFY_HEADERS = [
  'Handle','Title','Body (HTML)','Vendor','Product Category','Type','Tags','Published',
  'Option1 Name','Option1 Value','Option2 Name','Option2 Value',
  'Variant SKU','Variant Grams','Variant Inventory Tracker','Variant Inventory Qty',
  'Variant Inventory Policy','Variant Fulfillment Service','Variant Price','Variant Compare At Price',
  'Variant Requires Shipping','Variant Taxable','Image Src','Image Position','Image Alt Text',
  'Gift Card','SEO Title','SEO Description','Status',
];

function makeRow(fields) {
  return SHOPIFY_HEADERS.map(h => quoteCSV(fields[h] ?? '')).join(',');
}

// ── Main ─────────────────────────────────────────────────────────────────────

function convert(inputPath, outputPath) {
  const raw = fs.readFileSync(inputPath, 'utf8');
  const rows = parseCSV(raw);
  if (rows.length < 2) { console.error('Input CSV has no data rows.'); process.exit(1); }

  const headers = rows[0];
  const records = rows.slice(1).map(r => toObject(headers, r)).filter(r => col(r, 'name', 'title', 'product name'));

  // Group variants by product name
  const products = new Map();
  for (const r of records) {
    const name = col(r, 'product name', 'name', 'title');
    if (!products.has(name)) products.set(name, []);
    products.get(name).push(r);
  }

  const outputRows = [SHOPIFY_HEADERS.join(',')];

  for (const [name, variants] of products) {
    const first   = variants[0];
    const handle  = slugify(name);
    const dropCost = parseFloat(col(first, 'cost', 'price', 'selling price') || '0');
    const margin  = getMargin(col(first, 'category', 'type'), name);
    const retail  = dropCost > 0 ? roundPrice(dropCost * margin) : '';
    const grams   = parseInt(col(first, 'weight', 'grams') || '0') || 500;
    const imgSrc  = col(first, 'image url', 'image', 'img');
    const sku     = col(first, 'sku', 'item number', 'product id');
    const qty     = col(first, 'inventory', 'stock', 'quantity') || '50';
    const category= col(first, 'category', 'type') || '';
    const tags    = getTags(category, name);
    const rawDesc = col(first, 'description', 'body', 'detail');
    const features = rawDesc
      ? rawDesc.replace(/<[^>]+>/g, '').split(/[\n;•·]+/).map(s => s.trim()).filter(Boolean)
      : [];
    const body    = buildDescription(name, features.slice(0, 6));
    const seoTitle = `${name} | GlowRig`;
    const seoDesc  = `${name} — aesthetic gaming desk accessories. Fast AU shipping. 30-day returns. Shop GlowRig.`;

    // Determine variant option
    const hasVariants = variants.length > 1;
    const variantOptionName = hasVariants
      ? (col(first, 'variant name', 'option name', 'attribute name') || 'Style')
      : null;

    variants.forEach((v, idx) => {
      const variantSku   = col(v, 'sku', 'item number') || (idx === 0 ? sku : `${sku}-${idx}`);
      const variantCost  = parseFloat(col(v, 'cost', 'price', 'selling price') || dropCost || '0');
      const variantPrice = variantCost > 0 ? roundPrice(variantCost * margin) : retail;
      const variantValue = col(v, 'variant value', 'option value', 'attribute value') || col(v, 'sku');
      const variantGrams = parseInt(col(v, 'weight', 'grams') || '0') || grams;
      const variantImg   = col(v, 'image url', 'image', 'img') || (idx === 0 ? imgSrc : '');

      const row = {
        'Handle'                      : handle,
        'Title'                       : idx === 0 ? name : '',
        'Body (HTML)'                 : idx === 0 ? body : '',
        'Vendor'                      : idx === 0 ? VENDOR : '',
        'Type'                        : idx === 0 ? 'Gaming Accessories' : '',
        'Tags'                        : idx === 0 ? tags : '',
        'Published'                   : idx === 0 ? 'TRUE' : '',
        'Option1 Name'                : hasVariants && idx === 0 ? variantOptionName : '',
        'Option1 Value'               : hasVariants ? variantValue : 'Default Title',
        'Variant SKU'                 : variantSku,
        'Variant Grams'               : variantGrams,
        'Variant Inventory Tracker'   : 'shopify',
        'Variant Inventory Qty'       : qty,
        'Variant Inventory Policy'    : 'deny',
        'Variant Fulfillment Service' : 'manual',
        'Variant Price'               : variantPrice,
        'Variant Compare At Price'    : '',
        'Variant Requires Shipping'   : 'TRUE',
        'Variant Taxable'             : 'TRUE',
        'Image Src'                   : variantImg,
        'Image Position'              : variantImg ? '1' : '',
        'Image Alt Text'              : variantImg ? `${name}` : '',
        'Gift Card'                   : idx === 0 ? 'FALSE' : '',
        'SEO Title'                   : idx === 0 ? seoTitle : '',
        'SEO Description'             : idx === 0 ? seoDesc : '',
        'Status'                      : idx === 0 ? 'active' : '',
      };
      outputRows.push(makeRow(row));
    });
  }

  fs.writeFileSync(outputPath, outputRows.join('\n'), 'utf8');
  console.log(`✓ Converted ${products.size} products → ${outputPath}`);
}

// ── CLI entry ─────────────────────────────────────────────────────────────────

const [,, inputArg, outputArg] = process.argv;
if (!inputArg) {
  console.error('Usage: node scripts/cj-to-shopify.js <input.csv> [output.csv]');
  process.exit(1);
}
const inputPath  = path.resolve(inputArg);
const outputPath = path.resolve(outputArg || inputArg.replace(/\.csv$/i, '-shopify.csv'));
convert(inputPath, outputPath);
