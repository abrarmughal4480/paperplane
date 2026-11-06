# PaperPlane — QR-based Photocopy & Print Shop Management System
**Engineered for Pakistani Print & Photocopy Shops (Al-Noor Photocopy & Printing)**

PaperPlane is an offline-first, standalone management system with local Wi-Fi QR intake and embedded SQLite database. Customers can scan a counter QR code from their mobile phone, upload multiple files of any format (PDF, Images, Word, Excel, PowerPoint, Text), get real-time price quotes in PKR, and receive an instant pickup token without installing any application.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v20 or higher (Node v22+ / v26 recommended for built-in `node:sqlite`)
- **OS**: Windows, macOS, or Linux

### 2. Installation
Open terminal inside the project directory and run:
```bash
npm install
```

### 3. Build & Run Production Engine
```bash
# Build the optimized production bundle
npm run build

# Start the local production server & SQLite database
npm start
```

Once started:
- **Shopkeeper POS Dashboard**: `http://localhost:5000/dashboard`
- **Customer Mobile Upload (Local Wi-Fi)**: `http://<YOUR_LAN_IP>:5000/customer/upload`

### 4. Development Mode
To run Vite hot-reload dev server for frontend development:
```bash
npm run dev
```
Dev mode needs the backend too (second terminal), otherwise `/api` calls
(settings, orders, pricing) have nothing to answer and the dashboard
shows stale defaults:
```bash
npm run server
```
The Vite dev server proxies `/api` to `http://localhost:5000` (see
`vite.config.ts`).

---

## 📝 Shop details kaise edit karein (naam, phone, address, bank/IBAN)
Dashboard → **Shop Settings** → fields badlo → **Save Changes** dabao.
Save tabhi "saved" kehta hai jab server confirm kare; server band ho to
amber warning aata hai ("saved on this device only"). Details server ke
SQLite database me save hoti hain, is liye customer ke phone par navbar,
token screen aur rates me bhi update ho jati hain — dobara type nahi karna.

---

## 🌟 Key Architecture & Features

1. **Embedded Local SQLite Database (`server/db.js`):**
   - Uses Node.js built-in `node:sqlite` (zero C++ compile errors).
   - Local data storage in `data/paperplane.sqlite`.
   - Tables: `orders`, `order_documents`, `paper_types`, `pricing_config`, `shop_settings`, `license_sentinel`.

2. **Smart Local Wi-Fi Network & QR Standee (`server/networkHelper.js`):**
   - Automatically detects physical Wi-Fi / Ethernet LAN IP (filters out virtual VPNs like Tailscale/Docker).
   - Generates high-resolution optical QR code with Level H error correction.
   - 1-click printable counter standee for customer scanning.

3. **Multi-Format Document Preview Engine (`src/components/customer/UniversalFilePreview.tsx`):**
   - Mozilla `pdfjs-dist@4.10.38` HTML5 canvas rendering with page count extraction — the PDF worker is **bundled locally**, so previews work on the offline shop PC (no CDN).
   - Real DOCX preview via `mammoth` — the actual Word text, headings, tables and word count (no fake placeholder text). TXT renders real text too.
   - Real zoomable image preview (JPG, PNG, WEBP).
   - Excel/PowerPoint show an honest "preview not available" label instead of invented fake rows.

## 🎨 Brand, fonts & buttons (6 Nov 2026)
- **Logo:** the real v5 PaperPlane PNG (`public/paperplane-logo.png`, favicon; `public/paperplane-logo-mark.png`, navbar mark) — the old SVG is gone.
- **Typography (self-hosted, offline-first — no Google Fonts CDN):** Poppins (600/700) for the "PaperPlane" wordmark, Inter (400–700) for all UI/body text. Font files live in `public/fonts/`, wired via `@font-face` in `src/styles/global.css`.
- **Button contrast rule:** a button's background must never match the surface it sits on. `secondary` is now a clear light-blue tint (was near-white, invisible on white cards), `ghost` buttons have a real background + border, `subtle` is a 20% primary tint with a 60% border, and back buttons use the secondary tint + shadow. Verified by an automated contrast audit (light + dark mode) in `../testing/verify2.js` — 13/13 checks pass, including real previews of the owner's own HCI assignment PDF + DOCX.

4. **Dynamic Tiered Pricing in PKR (`src/utils/pricing.ts`):**
   - B&W vs. Color page rates.
   - Single-sided vs. Double-sided discounts.
   - Multiple copies stepper & paper weight stocks (A4 70gsm, A4 80gsm, Legal, Photo Glossy).

5. **Real-time Live Sync via Server-Sent Events (SSE):**
   - When a customer submits an order, the shopkeeper desktop plays an audio chime and updates the queue immediately.
   - When the shopkeeper marks "Printing" or "Ready for Pickup", the customer's smartphone screen updates in real time.

6. **Anti-Clock Tamper Subscription Guard (`server/licenseGuard.js`):**
   - Monotonic time tracking (`max_seen_timestamp`) prevents bypassing offline license expiration by rolling back the computer's system clock.

---

## 📁 Project Structure

```
├── data/                    # Local SQLite database files
├── server/                  # Embedded local backend engine
│   ├── db.js                # Built-in SQLite database layer
│   ├── index.js             # Express REST API & static file server
│   ├── licenseGuard.js      # Hardware-bound anti-tamper subscription
│   ├── networkHelper.js     # Wi-Fi LAN IP & QR code generator
│   └── sseManager.js        # Real-time SSE live updates broadcaster
├── src/                     # React 18 + Vite + Tailwind frontend
│   ├── components/          # Reusable UI & universal file preview
│   ├── context/             # Unified CustomerOrderContext store
│   ├── data/                # Data types and models
│   ├── pages/
│   │   ├── customer/        # Mobile-first QR customer portal
│   │   └── dashboard/       # Desktop-optimized shopkeeper POS
│   ├── styles/              # Global Tailwind styles
│   └── utils/               # PDF rendering, pricing, and security
├── package.json             # Dependencies and build scripts
└── SYSTEM_SPEC_AND_INSTRUCTIONS.md # Detailed architecture specifications
```
