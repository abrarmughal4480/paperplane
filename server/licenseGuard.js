// ============================================================
// PaperPlane — Hardware-Bound Anti-Clock Tamper License Guard
// Protects offline subscriptions from system clock manipulation
// ============================================================

import crypto from 'node:crypto';
import os from 'node:os';
import { dbService } from './db.js';

const LICENSE_SECRET = 'PAPERPLANE_PAKISTAN_AL_NOOR_SECURE_HMAC_KEY_2026';

export function getHardwareFingerprint() {
  const cpus = os.cpus();
  const cpuModel = cpus && cpus.length > 0 ? cpus[0].model : 'GENERIC_CPU';
  const hostname = os.hostname();
  const totalMem = os.totalmem();

  const raw = `${cpuModel}::${hostname}::${totalMem}`;
  return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 24).toUpperCase();
}

export function generateOfflineLicense(plan = '1_YEAR', customHardwareId = null) {
  const hwId = customHardwareId || getHardwareFingerprint();
  const issuedAt = Date.now();
  
  let durationDays = 365;
  if (plan === '1_MONTH') durationDays = 30;
  if (plan === '6_MONTHS') durationDays = 182;
  if (plan === '1_YEAR') durationDays = 365;

  const expiresAt = issuedAt + (durationDays * 24 * 60 * 60 * 1000);

  const payload = {
    plan,
    issuedAt,
    expiresAt,
    hwId,
    shop: 'Al-Noor Photocopy & Printing',
  };

  const payloadStr = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', LICENSE_SECRET).update(payloadStr).digest('hex');
  const encoded = Buffer.from(payloadStr).toString('base64');

  const licenseKey = `PD-${plan}-${encoded}.${signature.substring(0, 16)}`;
  return { licenseKey, payload };
}

export function verifyLicenseKey(licenseKey) {
  try {
    if (!licenseKey || !licenseKey.startsWith('PD-')) {
      return { valid: false, reason: 'Invalid license format' };
    }

    const parts = licenseKey.replace(/^PD-[A-Z0-9_]+-/, '').split('.');
    if (parts.length !== 2) {
      return { valid: false, reason: 'Malformed license structure' };
    }

    const [encodedPayload, signatureShort] = parts;
    const payloadStr = Buffer.from(encodedPayload, 'base64').toString('utf8');
    const expectedSig = crypto.createHmac('sha256', LICENSE_SECRET).update(payloadStr).digest('hex').substring(0, 16);

    if (signatureShort !== expectedSig) {
      return { valid: false, reason: 'Tampered or forged license signature' };
    }

    const payload = JSON.parse(payloadStr);
    return { valid: true, payload };
  } catch (err) {
    return { valid: false, reason: 'License parse exception: ' + err.message };
  }
}

export function checkLicenseHealth() {
  const licenseRecord = dbService.getLicense();
  const now = Date.now();
  const hwId = getHardwareFingerprint();

  if (!licenseRecord) {
    return {
      status: 'tampered',
      message: 'License record missing. Database integrity error.',
      daysRemaining: 0,
      hardwareId: hwId,
    };
  }

  // 1. Monotonic Anti-Clock Rewind Check:
  // If the current system time is behind the highest timestamp we've recorded,
  // the user has set their Windows clock backwards!
  const SKEW_TOLERANCE_MS = 5 * 60 * 1000; // 5 min skew allowance
  if (now < (licenseRecord.max_seen_timestamp - SKEW_TOLERANCE_MS)) {
    return {
      status: 'tampered',
      tamperType: 'CLOCK_REWIND_DETECTED',
      message: 'Windows system clock manipulation detected! System clock has been moved backwards. Please synchronize your system time to resume.',
      daysRemaining: 0,
      hardwareId: hwId,
    };
  }

  // Update monotonic timestamp
  if (now > licenseRecord.max_seen_timestamp) {
    dbService.updateLicenseTimestamp(now);
  }

  // 2. Expiry check
  if (now > licenseRecord.expires_at) {
    return {
      status: 'expired',
      message: 'Your PaperPlane subscription has expired. Please contact support to renew.',
      daysRemaining: 0,
      hardwareId: hwId,
      expiresAt: licenseRecord.expires_at,
    };
  }

  const daysRemaining = Math.max(0, Math.ceil((licenseRecord.expires_at - now) / (1000 * 60 * 60 * 24)));

  return {
    status: 'active',
    plan: licenseRecord.plan,
    daysRemaining,
    expiresAt: licenseRecord.expires_at,
    issuedAt: licenseRecord.issued_at,
    hardwareId: hwId,
    licenseKey: licenseRecord.license_key,
    message: `Subscription active (${daysRemaining} days remaining)`,
  };
}

