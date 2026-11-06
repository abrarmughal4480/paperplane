// ============================================================
// PaperPlane — Local Network & Counter QR Code Generator
// Detects real LAN Wi-Fi IP (filters VPNs) for smartphone access
// ============================================================

import os from 'node:os';
import QRCode from 'qrcode';

// Virtual / VPN adapters to ignore when picking local Wi-Fi / LAN IP
const IGNORED_ADAPTERS = [
  'tailscale',
  'docker',
  'vethernet',
  'virtualbox',
  'vmnet',
  'zerotier',
  'tap',
  'tun',
  'wireguard',
  'openvpn',
];

export function getAllNetworkInterfaces() {
  const interfaces = os.networkInterfaces();
  const list = [];

  for (const [name, netList] of Object.entries(interfaces)) {
    if (!netList) continue;
    const lowerName = name.toLowerCase();
    const isVirtual = IGNORED_ADAPTERS.some((bad) => lowerName.includes(bad));

    for (const net of netList) {
      if (net.family === 'IPv4' && !net.internal) {
        list.push({
          name,
          address: net.address,
          isVirtual,
          isWifiOrEthernet:
            lowerName.includes('wi-fi') ||
            lowerName.includes('wifi') ||
            lowerName.includes('wlan') ||
            lowerName.includes('ethernet') ||
            lowerName.includes('lan'),
        });
      }
    }
  }

  return list;
}

export function getLocalIpAddress() {
  const all = getAllNetworkInterfaces();

  // 1. Highest priority: Non-virtual Wi-Fi or Ethernet adapter
  const physicalAdapter = all.find((i) => !i.isVirtual && i.isWifiOrEthernet);
  if (physicalAdapter) return physicalAdapter.address;

  // 2. Second priority: Any standard private subnet IPv4 (192.168.x.x, 10.x.x.x, 172.16-31.x.x) that isn't virtual
  const privateAdapter = all.find(
    (i) =>
      !i.isVirtual &&
      (i.address.startsWith('192.168.') ||
        i.address.startsWith('10.') ||
        i.address.startsWith('172.'))
  );
  if (privateAdapter) return privateAdapter.address;

  // 3. Third priority: Any non-virtual IPv4
  const nonVirtual = all.find((i) => !i.isVirtual);
  if (nonVirtual) return nonVirtual.address;

  // 4. Fallback to any found IPv4, otherwise LAN default
  return all.length > 0 ? all[0].address : '192.168.1.100';
}

export async function getNetworkConfig(port = 5000) {
  const lanIp = getLocalIpAddress();
  const customerUrl = `http://${lanIp}:${port}/customer/upload`;
  const dashboardUrl = `http://${lanIp}:${port}/dashboard`;
  const allInterfaces = getAllNetworkInterfaces();

  let qrCodeDataUrl = '';
  let qrCodeSvg = '';

  try {
    // Generate high-resolution, high-contrast QR code for instant camera autofocus
    qrCodeDataUrl = await QRCode.toDataURL(customerUrl, {
      errorCorrectionLevel: 'H',
      margin: 3,
      width: 600,
      color: {
        dark: '#09090b', // Deep zinc black for instant optical scanning
        light: '#ffffff', // Crisp white quiet zone
      },
    });

    qrCodeSvg = await QRCode.toString(customerUrl, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 3,
      color: {
        dark: '#09090b',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR code data URL:', err);
  }

  return {
    lanIp,
    port,
    customerUrl,
    dashboardUrl,
    qrCodeDataUrl,
    qrCodeSvg,
    allInterfaces,
  };
}
