# PaperPlane — Complete System Specification, Architecture & Instructions Manual
**Project:** PaperPlane (Al-Noor Photocopy & Printing, Pakistan)  
**Target Environment:** Standalone Offline Local System (.exe) + Local LAN QR-code Customer Web Access  
**Currency:** PKR (Rs. / Pakistani Rupee)  
**Language of Operation & Interaction:** Roman English / Roman Urdu strictly for user communication  

---

## 1. Executive Summary & Core Philosophy

PaperPlane is a high-performance, offline-first print and photocopy shop management system designed specifically for Pakistani print shops (starting with Al-Noor Photocopy & Printing). 

### Key Characteristics:
1. **Zero Cloud Dependency:** Runs 100% locally on the shopkeeper's Windows PC. No external internet or cloud server is required for everyday shop operations.
2. **Local Wi-Fi / Hotspot Connectivity:** The shopkeeper's PC hosts both the local web server and database. Customers connect to the shop's Wi-Fi / Mobile Hotspot, scan a counter QR code displaying the local LAN IP (e.g., `http://192.168.1.50:5000`), upload their documents directly from their smartphone browsers without installing an app, and receive a live pickup token.
3. **Multi-Format Document Engine:** Handles single and multiple file uploads of any format (PDF, JPG, PNG, WEBP, DOCX, XLSX, PPTX, TXT), generates instant canvas/image previews, computes exact page counts via Mozilla `pdfjs-dist`, and prevents duplicate file uploads.
4. **Dynamic Tiered Pricing (PKR):** Automatic calculation of B&W vs. Color, single-sided vs. double-sided discounts, multiple copies, and custom paper weights (A4 70gsm, A4 80gsm, Legal, Letter, Photo Glossy).
5. **Anti-Tamper Hardware-Bound Subscription:** Cryptographically verified offline license (1 Month, 6 Months, 1 Year). Includes an encrypted monotonic time guard (`max_seen_timestamp`) that prevents users from resetting the Windows system clock backwards to extend expired licenses.
6. **Anti-Reverse Engineering & Obfuscation:** Production bundles use deep AST obfuscation, anti-debugger loops, right-click and keyboard shortcut locks (F12, DevTools, Ctrl+Shift+I, Ctrl+U).

---

## 2. User Instructions & Commitments ("Do Not Revert" Policy)

1. **Undone Changes Memory:** The user has previously undone certain changes. The current working frontend codebase (`src/` with `UploadPage.tsx`, `UniversalFilePreview.tsx`, `CustomerOrderContext.tsx`, `App.tsx`, etc.) is fully verified and clean (0 TypeScript errors, passing production build). **Do NOT re-introduce old bugs or discarded structures.**
2. **Communication Policy:** All conversations and explanations with the user must strictly be conducted in **Roman English / Roman Urdu**.
3. **No AI Fluff / Clean Design:** The UI strictly adheres to Apple-style minimalist aesthetics: rounded corners, subtle shadows, crisp typography, intuitive status badges, and zero unnecessary wizard steps.

---

## 3. System Architecture & Components

```
+-----------------------------------------------------------------------------+
|                               SHOPKEEPER PC                                 |
|                                                                             |
|  +-----------------------------------------------------------------------+  |
|  |                     Electron / Tauri / Standalone .EXE                |  |
|  |                                                                       |  |
|  |  [ Chromium POS Dashboard ]         [ Local Express / Node.js Engine ]|  |
|  |  - Real-time Queue Monitor          - Binds to 0.0.0.0:5000           |  |
|  |  - Audio Chime on New Order         - Serves Static React Dist        |  |
|  |  - Dynamic Pricing Manager          - Local REST API + SSE / WS       |  |
|  |  - Shop & Banking Profile           - Monotonic Anti-Tamper Guard     |  |
|  |  - Local Printer Integration        - Real-time Order Broadcaster     |  |
|  +-------------------+-----------------------------------+---------------+  |
|                      |                                   |                  |
|                      | (Reads/Writes)                    | (Stores Files)   |
|                      v                                   v                  |
|             +-----------------+                 +-----------------+         |
|             |  Local SQLite   |                 | Local Storage   |         |
|             |  Database (DB)  |                 | /uploads folder |         |
|             +-----------------+                 +-----------------+         |
|                                                                             |
+-----------------------------------------------------------------------------+
                                       ^
                                       | Local Wi-Fi / Hotspot
                                       | (HTTP: 192.168.x.x:5000)
                                       v
                     +-----------------------------------+
                     |      CUSTOMER SMARTPHONES         |
                     |   (Scans Counter QR Code)         |
                     | - Uploads multi-format files      |
                     | - Instant document preview        |
                     | - Selects paper & B&W/Color       |
                     | - Receives Live Token (#A-101)    |
                     | - Live pickup status via SSE      |
                     +-----------------------------------+
```

---

## 4. Anti-Tamper Hardware-Bound Subscription Engine

### The Problem in Pakistan Print Shops:
Shopkeepers operating offline desktop software often attempt to bypass monthly/annual subscription expirations by rolling back the computer's system clock in Windows Control Panel (e.g., rolling back from 2026 to 2024).

### The PaperPlane Solution:
1. **Cryptographic License Payload:**
   Each license key is an encrypted/signed JSON string containing:
   ```json
   {
     "shopId": "SHOP_AL_NOOR_01",
     "plan": "1_YEAR",
     "issuedAt": 1741257600000,
     "expiresAt": 1772793600000,
     "hardwareFingerprint": "CPU_BFEBFBFF000906EA_MB_L1HF872004",
     "signature": "3a8f...[Ed25519 or HMAC-SHA256 signature]"
   }
   ```
2. **Encrypted Monotonic Time Guard (`time_sentinel.dat`):**
   - The backend records `max_seen_timestamp` inside an encrypted file on the local disk every 60 seconds and on every order creation.
   - On startup and before every critical action:
     - If `Current_System_Time < max_seen_timestamp - 300` (allowing 5 min tolerance for NTP jitter):
       -> **FLAG CLOCK TAMPERING!** Lock the system and show: *"System clock manipulation detected. Please synchronize your system time to continue."*
     - If `Current_System_Time > license.expiresAt`:
       -> **LICENSE EXPIRED!** Display renewal prompt and contact WhatsApp.

---

## 5. Local Database Schema (SQLite)

### Table: `orders`
- `id` (TEXT PRIMARY KEY) - e.g. `ord_1741257600000`
- `token` (TEXT UNIQUE) - e.g. `#A-101`
- `customer_name` (TEXT) - e.g. `Muhammad Bilal`
- `status` (TEXT) - `queued` | `printing` | `ready` | `completed` | `cancelled`
- `payment_method` (TEXT) - `cash` | `jazzcash` | `easypaisa` | `bank`
- `payment_status` (TEXT) - `pending` | `paid`
- `total_price` (REAL) - in PKR
- `total_pages` (INTEGER)
- `total_copies` (INTEGER)
- `created_at` (INTEGER - Unix timestamp)
- `updated_at` (INTEGER - Unix timestamp)

### Table: `order_documents`
- `id` (TEXT PRIMARY KEY)
- `order_id` (TEXT, FOREIGN KEY)
- `file_name` (TEXT)
- `file_path` (TEXT) - path inside local `uploads/`
- `file_size` (INTEGER)
- `file_type` (TEXT) - e.g. `application/pdf`, `image/jpeg`
- `page_count` (INTEGER)
- `color_mode` (TEXT) - `bw` | `color`
- `sides` (TEXT) - `single` | `double`
- `paper_size` (TEXT) - e.g. `a4_70`, `a4_80`, `legal`
- `copies` (INTEGER)

### Table: `pricing_config`
- `key` (TEXT PRIMARY KEY)
- `value_json` (TEXT) - dynamic prices for bw, color, discounts, etc.

### Table: `paper_types`
- `id` (TEXT PRIMARY KEY)
- `name` (TEXT) - e.g. `A4 80gsm`
- `bw_price` (REAL) - e.g. 10.0
- `color_price` (REAL) - e.g. 35.0
- `is_active` (INTEGER)

### Table: `shop_settings`
- `id` (TEXT PRIMARY KEY)
- `shop_name` (TEXT) - Al-Noor Photocopy & Printing
- `phone` (TEXT)
- `address` (TEXT)
- `jazzcash_title` (TEXT)
- `jazzcash_number` (TEXT)
- `easypaisa_title` (TEXT)
- `easypaisa_number` (TEXT)
- `bank_name` (TEXT)
- `bank_title` (TEXT)
- `bank_iban` (TEXT)

### Table: `license_data`
- `id` (INTEGER PRIMARY KEY)
- `license_key` (TEXT)
- `max_seen_timestamp` (INTEGER)
- `expiry_timestamp` (INTEGER)
- `status` (TEXT) - `active` | `expired` | `tampered`

---

## 6. Frontend Features & Verified Code Inventory

1. **Universal File Preview Engine (`UniversalFilePreview.tsx`):**
   - PDF: Mozilla `pdfjs-dist` HTML5 canvas rendering with page navigation (Prev/Next page) and auto-cancellation of conflicting render tasks.
   - Images: Direct object-contain preview with Zoom In / Zoom Out controls.
   - Word, Excel, PowerPoint: Realistic simulated office document renderers showing sheets, slides, and formatting.
2. **Multi-File Queue (`UploadPage.tsx`):**
   - Multi-format file selection (PDF, Images, Office Docs).
   - Instant file deduplication (by filename + size).
   - Individual document removal and full "Clear All" capability.
   - Total pages and documents counter.
3. **Multi-Document Preview Tab Bar (`PreviewPage.tsx`):**
   - Tab pills for every uploaded document (`[ #1 Resume.pdf ] [ #2 Photo.jpg ]`).
   - One-click active document switching.
4. **Dynamic Live Pricing Engine (`pricing.ts` & `SettingsPage.tsx`):**
   - Live recalculation for single or multiple files based on active paper stocks.
   - PKR currency formatting across the entire app.
5. **Token Generation & Pakistani Payment Details (`TokenPage.tsx`):**
   - Live token generation (`#A-101`).
   - Easy 1-click clipboard copy for JazzCash, Easypaisa, and Bank IBAN.
6. **Shopkeeper Real-time Dashboard (`QueuePage.tsx`, `DashboardHome.tsx`):**
   - Instant queue monitoring.
   - Job detail inspector modal (`JobDetailModal.tsx`).
   - Paper stock manager (`PricingPage.tsx`).
   - Payment account settings (`SettingsPage.tsx`).

---

## 7. Packaging & Standalone Execution Instructions

To run the complete system as a local desktop executable:
1. The Node.js Express backend serves the Vite production bundle (`dist/`) and provides all SQLite and WebSocket endpoints on port `5000`.
2. Electron or lightweight webview wraps `http://localhost:5000/dashboard` in a dedicated native window with auto-start capability.
3. The server prints its LAN IP address to the console and generates the QR code for counter placement.

