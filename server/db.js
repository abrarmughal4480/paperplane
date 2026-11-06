// ============================================================
// PaperPlane — Embedded SQLite Database Engine
// Powered by Node.js built-in `node:sqlite` (Zero C++ dependency)
// ============================================================

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data and uploads directories exist
const dataDir = path.resolve(__dirname, '../data');
const uploadsDir = path.resolve(__dirname, '../uploads');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'paperplane.sqlite');
export { dbPath };
export const db = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys for high performance local access
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    customer_name TEXT DEFAULT 'Walk-in Customer',
    status TEXT DEFAULT 'queued',
    payment_method TEXT DEFAULT 'cash',
    payment_status TEXT DEFAULT 'pending',
    total_price REAL DEFAULT 0,
    total_pages INTEGER DEFAULT 0,
    total_copies INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS order_documents (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    stored_file_name TEXT,
    file_size INTEGER DEFAULT 0,
    file_type TEXT,
    page_count INTEGER DEFAULT 1,
    color_mode TEXT DEFAULT 'bw',
    sides TEXT DEFAULT 'single',
    paper_size TEXT DEFAULT 'a4_70',
    copies INTEGER DEFAULT 1,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS paper_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    bw_price REAL NOT NULL,
    color_price REAL NOT NULL,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS pricing_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    config_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS shop_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    shop_name TEXT DEFAULT 'Al-Noor Photocopy & Printing',
    phone TEXT DEFAULT '0300-1234567',
    address TEXT DEFAULT 'Shop #4, Main Market, Lahore',
    counter_name TEXT DEFAULT 'Counter 1',
    jazzcash_title TEXT DEFAULT 'Al-Noor Printing',
    jazzcash_number TEXT DEFAULT '03001234567',
    easypaisa_title TEXT DEFAULT 'Al-Noor Printing',
    easypaisa_number TEXT DEFAULT '03451234567',
    bank_name TEXT DEFAULT 'Meezan Bank Limited',
    bank_title TEXT DEFAULT 'Al Noor Print Desk',
    bank_iban TEXT DEFAULT 'PK00MEZN0000001234567890'
  );

  CREATE TABLE IF NOT EXISTS license_sentinel (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    license_key TEXT,
    plan TEXT DEFAULT 'TRIAL_ACTIVE',
    issued_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    max_seen_timestamp INTEGER NOT NULL,
    hardware_id TEXT,
    status TEXT DEFAULT 'active'
  );
`);

// Seed Default Paper Types if empty
const paperCount = db.prepare('SELECT COUNT(*) as count FROM paper_types').get();
if (!paperCount || paperCount.count === 0) {
  const seedPapers = [
    { id: 'a4_70', name: 'A4 70gsm (Standard Document)', bw_price: 5.0, color_price: 25.0, is_active: 1 },
    { id: 'a4_80', name: 'A4 80gsm (Executive / Thesis)', bw_price: 8.0, color_price: 30.0, is_active: 1 },
    { id: 'legal', name: 'Legal 70gsm (Court / Affidavit)', bw_price: 7.0, color_price: 30.0, is_active: 1 },
    { id: 'letter', name: 'Letter (8.5 x 11 in)', bw_price: 6.0, color_price: 25.0, is_active: 1 },
    { id: 'photo', name: 'Glossy Photo Paper (High Res)', bw_price: 30.0, color_price: 60.0, is_active: 1 },
  ];
  const insertPaper = db.prepare('INSERT INTO paper_types (id, name, bw_price, color_price, is_active) VALUES (?, ?, ?, ?, ?)');
  for (const p of seedPapers) {
    insertPaper.run(p.id, p.name, p.bw_price, p.color_price, p.is_active);
  }
}

// Seed Default Pricing Config if empty
const pricingCount = db.prepare('SELECT COUNT(*) as count FROM pricing_config').get();
if (!pricingCount || pricingCount.count === 0) {
  const defaultPricing = {
    bwPerPage: 5.0,
    colorPerPage: 25.0,
    doubleSidedDiscount: 0.15,
    minOrderAmount: 5.0,
    colorDoubleSidedDiscount: 0.10,
    bulkDiscounts: [
      { minPages: 50, discountPercent: 10 },
      { minPages: 100, discountPercent: 15 },
      { minPages: 500, discountPercent: 25 },
    ],
  };
  db.prepare('INSERT INTO pricing_config (id, config_json) VALUES (1, ?)').run(JSON.stringify(defaultPricing));
}

// Seed Default Shop Settings if empty
const settingsCount = db.prepare('SELECT COUNT(*) as count FROM shop_settings').get();
if (!settingsCount || settingsCount.count === 0) {
  db.prepare(`
    INSERT INTO shop_settings (id, shop_name, phone, address, counter_name, jazzcash_title, jazzcash_number, easypaisa_title, easypaisa_number, bank_name, bank_title, bank_iban)
    VALUES (1, 'Al-Noor Photocopy & Printing', '0300-1234567', 'Shop #4, Main Market, Lahore', 'Counter 1', 'Al-Noor Printing', '03001234567', 'Al-Noor Printing', '03451234567', 'Meezan Bank Limited', 'Al Noor Print Desk', 'PK00MEZN0000001234567890')
  `).run();
}

// Seed Initial License Sentinel if empty
const licenseCount = db.prepare('SELECT COUNT(*) as count FROM license_sentinel').get();
if (!licenseCount || licenseCount.count === 0) {
  const now = Date.now();
  const oneYearExpiry = now + (365 * 24 * 60 * 60 * 1000);
  db.prepare(`
    INSERT INTO license_sentinel (id, license_key, plan, issued_at, expires_at, max_seen_timestamp, hardware_id, status)
    VALUES (1, 'PAPERPLANE-OFFLINE-TRIAL-365D', '1_YEAR_STANDARD', ?, ?, ?, 'HW_DEFAULT_LOCAL_STATION', 'active')
  `).run(now, oneYearExpiry, now);
}

// ============================================================
// Database Helper Methods
// ============================================================

export const dbService = {
  // Orders
  getOrders() {
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
    const docStmt = db.prepare('SELECT * FROM order_documents WHERE order_id = ?');
    return orders.map((o) => ({
      ...o,
      documents: docStmt.all(o.id),
    }));
  },

  getOrderById(idOrToken) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? OR token = ?').get(idOrToken, idOrToken);
    if (!order) return null;
    const documents = db.prepare('SELECT * FROM order_documents WHERE order_id = ?').all(order.id);
    return { ...order, documents };
  },

  createOrder(orderData, documents = []) {
    const insertOrder = db.prepare(`
      INSERT INTO orders (id, token, customer_name, status, payment_method, payment_status, total_price, total_pages, total_copies, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertOrder.run(
      orderData.id,
      orderData.token,
      orderData.customer_name || 'Walk-in Customer',
      orderData.status || 'queued',
      orderData.payment_method || 'cash',
      orderData.payment_status || 'pending',
      orderData.total_price || 0,
      orderData.total_pages || 0,
      orderData.total_copies || 1,
      orderData.created_at || Date.now(),
      orderData.updated_at || Date.now()
    );

    const insertDoc = db.prepare(`
      INSERT INTO order_documents (id, order_id, file_name, stored_file_name, file_size, file_type, page_count, color_mode, sides, paper_size, copies)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const doc of documents) {
      insertDoc.run(
        doc.id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        orderData.id,
        doc.fileName || doc.file_name || 'Document',
        doc.storedFileName || doc.stored_file_name || null,
        doc.fileSizeBytes || doc.file_size || 0,
        doc.fileType || doc.file_type || 'application/pdf',
        doc.pageCount || doc.page_count || 1,
        doc.colorMode || doc.color_mode || 'bw',
        doc.sides || 'single',
        doc.paperSize || doc.paper_size || 'a4_70',
        doc.copies || 1
      );
    }

    return this.getOrderById(orderData.id);
  },

  updateOrderStatus(idOrToken, status, paymentStatus) {
    const now = Date.now();
    if (paymentStatus) {
      db.prepare('UPDATE orders SET status = ?, payment_status = ?, updated_at = ? WHERE id = ? OR token = ?')
        .run(status, paymentStatus, now, idOrToken, idOrToken);
    } else {
      db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ? OR token = ?')
        .run(status, now, idOrToken, idOrToken);
    }
    return this.getOrderById(idOrToken);
  },

  deleteOrder(idOrToken) {
    const order = this.getOrderById(idOrToken);
    if (!order) return false;
    db.prepare('DELETE FROM orders WHERE id = ? OR token = ?').run(idOrToken, idOrToken);
    return true;
  },

  // Paper Types
  getPaperTypes() {
    return db.prepare('SELECT * FROM paper_types').all();
  },

  addPaperType(paper) {
    const id = paper.id || `paper_${Date.now()}`;
    db.prepare('INSERT INTO paper_types (id, name, bw_price, color_price, is_active) VALUES (?, ?, ?, ?, ?)')
      .run(id, paper.name, Number(paper.bw_price), Number(paper.color_price), paper.is_active ? 1 : 0);
    return db.prepare('SELECT * FROM paper_types WHERE id = ?').get(id);
  },

  updatePaperType(id, partial) {
    const existing = db.prepare('SELECT * FROM paper_types WHERE id = ?').get(id);
    if (!existing) return null;
    const name = partial.name !== undefined ? partial.name : existing.name;
    const bw_price = partial.bw_price !== undefined ? Number(partial.bw_price) : existing.bw_price;
    const color_price = partial.color_price !== undefined ? Number(partial.color_price) : existing.color_price;
    const is_active = partial.is_active !== undefined ? (partial.is_active ? 1 : 0) : existing.is_active;

    db.prepare('UPDATE paper_types SET name = ?, bw_price = ?, color_price = ?, is_active = ? WHERE id = ?')
      .run(name, bw_price, color_price, is_active, id);
    return db.prepare('SELECT * FROM paper_types WHERE id = ?').get(id);
  },

  deletePaperType(id) {
    db.prepare('DELETE FROM paper_types WHERE id = ?').run(id);
    return true;
  },

  // Pricing
  getPricing() {
    const row = db.prepare('SELECT config_json FROM pricing_config WHERE id = 1').get();
    return row ? JSON.parse(row.config_json) : null;
  },

  updatePricing(newConfig) {
    db.prepare('UPDATE pricing_config SET config_json = ? WHERE id = 1').run(JSON.stringify(newConfig));
    return this.getPricing();
  },

  // Settings
  getShopSettings() {
    return db.prepare('SELECT * FROM shop_settings WHERE id = 1').get();
  },

  updateShopSettings(settings) {
    const cur = this.getShopSettings();
    const updated = { ...cur, ...settings };
    db.prepare(`
      UPDATE shop_settings SET
        shop_name = ?,
        phone = ?,
        address = ?,
        counter_name = ?,
        jazzcash_title = ?,
        jazzcash_number = ?,
        easypaisa_title = ?,
        easypaisa_number = ?,
        bank_name = ?,
        bank_title = ?,
        bank_iban = ?
      WHERE id = 1
    `).run(
      updated.shop_name,
      updated.phone,
      updated.address,
      updated.counter_name,
      updated.jazzcash_title,
      updated.jazzcash_number,
      updated.easypaisa_title,
      updated.easypaisa_number,
      updated.bank_name,
      updated.bank_title,
      updated.bank_iban
    );
    return this.getShopSettings();
  },

  // License Sentinel
  getLicense() {
    return db.prepare('SELECT * FROM license_sentinel WHERE id = 1').get();
  },

  updateLicenseTimestamp(timestamp) {
    db.prepare('UPDATE license_sentinel SET max_seen_timestamp = ? WHERE id = 1').run(timestamp);
  },

  activateLicense(licenseData) {
    db.prepare(`
      UPDATE license_sentinel SET
        license_key = ?,
        plan = ?,
        issued_at = ?,
        expires_at = ?,
        max_seen_timestamp = ?,
        hardware_id = ?,
        status = 'active'
      WHERE id = 1
    `).run(
      licenseData.license_key,
      licenseData.plan,
      licenseData.issued_at,
      licenseData.expires_at,
      Date.now(),
      licenseData.hardware_id
    );
    return this.getLicense();
  },
};

