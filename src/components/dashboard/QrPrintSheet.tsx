import React from 'react';

// Print-only QR sheet: the shopkeeper prints this once and pastes it
// anywhere on the counter (or the shop window). A customer scans it
// with their phone camera and lands straight on the upload page.
//
// The sheet is kept off-screen in the normal view and only becomes
// visible when printing (see the .qr-print-sheet rules in
// src/styles/global.css). It is rendered once in DashboardLayout so
// every "Print QR" button on the dashboard prints the same sheet.
export function QrPrintSheet({
  shopName,
  qrCodeDataUrl,
  customerUrl,
}: {
  shopName: string;
  qrCodeDataUrl: string | null;
  customerUrl: string | null;
}) {
  return (
    <div className="qr-print-sheet" aria-hidden="true">
      <div style={{ textAlign: 'center', padding: '24px 16px', fontFamily: 'sans-serif' }}>
        <img
          src="/paperplane-logo.png"
          alt=""
          style={{ width: 72, height: 72, objectFit: 'contain', margin: '0 auto' }}
        />
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '12px 0 2px', color: '#111' }}>
          {shopName}
        </h1>
        <p style={{ fontSize: 16, margin: '0 0 20px', color: '#444' }}>
          Scan to print your documents
        </p>

        {qrCodeDataUrl ? (
          <img
            src={qrCodeDataUrl}
            alt="Scan to upload documents"
            style={{ width: 280, height: 280, margin: '0 auto', display: 'block' }}
          />
        ) : (
          <p style={{ fontSize: 14, color: '#666' }}>QR code not available</p>
        )}

        <p style={{ fontSize: 15, fontWeight: 700, margin: '16px 0 4px', color: '#111', wordBreak: 'break-all' }}>
          {customerUrl || ''}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 20, fontSize: 13, color: '#333' }}>
          <span><strong>1.</strong> Connect to shop Wi-Fi</span>
          <span><strong>2.</strong> Scan with your camera</span>
          <span><strong>3.</strong> Upload &amp; get your token</span>
        </div>

        <p style={{ fontSize: 12, color: '#888', marginTop: 24 }}>
          No app needed — your phone camera opens the upload page directly.
        </p>
      </div>
    </div>
  );
}
