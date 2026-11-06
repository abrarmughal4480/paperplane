// ============================================================
// PaperPlane — Local Embedded Production Server
// REST APIs, Multipart File Uploads, SQLite DB, Real-time SSE, Anti-Tamper Guard
// ============================================================

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { dbService, dbPath } from './db.js';
import { getNetworkConfig } from './networkHelper.js';
import { sseManager } from './sseManager.js';
import {
  checkLicenseHealth,
  verifyLicenseKey,
  generateOfflineLicense,
  getHardwareFingerprint,
} from './licenseGuard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Storage configuration for uploaded customer documents
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uniqueSuffix}_${sanitized}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB per file
});

// Serve uploaded customer files statically (protected/accessible to dashboard)
app.use('/api/uploads', express.static(uploadsDir));

// ============================================================
// API Endpoints
// ============================================================

// 1. Health & Anti-Tamper License Check
app.get('/api/health', (_req, res) => {
  const license = checkLicenseHealth();
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: Date.now(),
    license,
  });
});

// 2. Local Network Info & QR Code for Counter
app.get('/api/network-info', async (_req, res) => {
  try {
    const config = await getNetworkConfig(PORT);
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve network config', details: err.message });
  }
});

// 3. Multi-file Document Upload
app.post('/api/upload', upload.array('files', 20), (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploaded = files.map((f) => ({
      storedFileName: f.filename,
      originalName: f.originalname,
      size: f.size,
      mimeType: f.mimetype,
      downloadUrl: `/api/uploads/${f.filename}`,
    }));

    res.json({ success: true, files: uploaded });
  } catch (err) {
    res.status(500).json({ error: 'File upload failed', details: err.message });
  }
});

// 4. Orders CRUD & Real-Time Token Generation
app.get('/api/orders', (_req, res) => {
  try {
    const orders = dbService.getOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders', details: err.message });
  }
});

app.post('/api/orders', (req, res) => {
  try {
    const body = req.body;
    const now = Date.now();

    // Check license status before creating orders
    const license = checkLicenseHealth();
    if (license.status === 'tampered' || license.status === 'expired') {
      return res.status(403).json({
        error: 'Subscription restricted',
        license,
      });
    }

    // Auto generate token if missing (e.g., #A-101)
    let token = body.token;
    if (!token) {
      const letters = ['A', 'B', 'C', 'D'];
      const prefix = letters[Math.floor(Math.random() * letters.length)];
      const num = Math.floor(100 + Math.random() * 900);
      token = `#${prefix}-${num}`;
    }

    const orderId = body.id || `ord_${now}_${Math.random().toString(36).substring(2, 6)}`;

    const orderData = {
      id: orderId,
      token,
      customer_name: body.customerName || body.customer_name || 'Walk-in Customer',
      status: body.status || 'queued',
      payment_method: body.paymentMethod || body.payment_method || 'cash',
      payment_status: body.paymentStatus || body.payment_status || 'pending',
      total_price: Number(body.price || body.total_price || 0),
      total_pages: Number(body.totalPages || body.total_pages || 0),
      total_copies: Number(body.totalCopies || body.total_copies || 1),
      created_at: now,
      updated_at: now,
    };

    const documents = body.documents || [];
    const newOrder = dbService.createOrder(orderData, documents);

    // Broadcast instant real-time notification to shopkeeper desktop POS
    sseManager.broadcastNewOrder(newOrder);

    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create order', details: err.message });
  }
});

app.get('/api/orders/:idOrToken', (req, res) => {
  try {
    const order = dbService.getOrderById(req.params.idOrToken);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve order', details: err.message });
  }
});

app.patch('/api/orders/:idOrToken/status', (req, res) => {
  try {
    const { status, payment_status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const updated = dbService.updateOrderStatus(req.params.idOrToken, status, payment_status);
    if (!updated) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Broadcast real-time status update to both shopkeeper and customer's phone
    sseManager.broadcastOrderStatus(updated);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status', details: err.message });
  }
});

app.delete('/api/orders/:idOrToken', (req, res) => {
  try {
    const success = dbService.deleteOrder(req.params.idOrToken);
    if (!success) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete order', details: err.message });
  }
});

// 5. Paper Types Manager
app.get('/api/paper-types', (_req, res) => {
  res.json(dbService.getPaperTypes());
});

app.post('/api/paper-types', (req, res) => {
  try {
    const paper = dbService.addPaperType(req.body);
    res.status(201).json(paper);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create paper type', details: err.message });
  }
});

app.put('/api/paper-types/:id', (req, res) => {
  try {
    const updated = dbService.updatePaperType(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Paper type not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update paper type', details: err.message });
  }
});

app.delete('/api/paper-types/:id', (req, res) => {
  try {
    dbService.deletePaperType(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete paper type', details: err.message });
  }
});

// 6. Pricing Config
app.get('/api/pricing', (_req, res) => {
  res.json(dbService.getPricing());
});

app.put('/api/pricing', (req, res) => {
  try {
    const updated = dbService.updatePricing(req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update pricing', details: err.message });
  }
});

// 7. Shop Settings & Bank Account Details
app.get('/api/settings', (_req, res) => {
  res.json(dbService.getShopSettings());
});

app.put('/api/settings', (req, res) => {
  try {
    const updated = dbService.updateShopSettings(req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings', details: err.message });
  }
});

// 8. License Management & Offline Activation
app.get('/api/license', (_req, res) => {
  res.json(checkLicenseHealth());
});

app.post('/api/license/activate', (req, res) => {
  const { licenseKey } = req.body;
  if (!licenseKey) {
    return res.status(400).json({ error: 'License key is required' });
  }

  const verification = verifyLicenseKey(licenseKey);
  if (!verification.valid) {
    return res.status(400).json({ error: verification.reason });
  }

  const activated = dbService.activateLicense({
    license_key: licenseKey,
    plan: verification.payload.plan || '1_YEAR',
    issued_at: verification.payload.issuedAt || Date.now(),
    expires_at: verification.payload.expiresAt,
    hardware_id: getHardwareFingerprint(),
  });

  res.json({ success: true, license: checkLicenseHealth() });
});

// Helper route to generate license keys (for shop owner administration)
app.post('/api/license/generate-demo', (req, res) => {
  const { plan } = req.body;
  const gen = generateOfflineLicense(plan || '1_YEAR');
  res.json(gen);
});

// ============================================================
// Real-time SSE Streams
// ============================================================

// Dashboard stream: Shopkeeper desktop connects here to hear chimes & get instant new orders
app.get('/api/events/dashboard', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.write(': connected to dashboard stream\n\n');
  sseManager.addDashboardClient(res);
});

// Customer stream: Customer phone connects here using token to watch status in real time
app.get('/api/events/order/:token', (req, res) => {
  const token = req.params.token;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.write(`: connected to order stream for ${token}\n\n`);
  sseManager.addCustomerClient(token, res);
});

// ============================================================
// Production Static File Serving (Vite `dist/` fallback)
// ============================================================
const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res) => {
    // If it's an API route that reached here, return 404
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Start Server
app.listen(PORT, '0.0.0.0', async () => {
  const net = await getNetworkConfig(PORT);
  console.log('============================================================');
  console.log('  PAPERPLANE — LOCAL PRODUCTION ENGINE RUNNING');
  console.log('  Al-Noor Photocopy & Printing, Pakistan');
  console.log('============================================================');
  console.log(`  -> Shopkeeper POS Dashboard: ${net.dashboardUrl}`);
  console.log(`  -> Customer Mobile Upload:  ${net.customerUrl}`);
  console.log(`  -> Local IP:                ${net.lanIp}:${PORT}`);
  console.log(`  -> SQLite DB:               ${dbPath}`);
  console.log('============================================================\n');
});
