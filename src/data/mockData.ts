// ============================================================
// PaperPlane — Data Layer
// Shared types and real shop defaults. No demo or sample data
// lives here: orders, stats and printer state all come from the
// live server. Defaults below are only the empty starting point
// the shopkeeper fills in through Shop Settings.
// ============================================================

export type OrderStatus = 'queued' | 'printing' | 'ready' | 'collected' | 'cancelled';
export type ColorMode = 'bw' | 'color';
export type Sides = 'single' | 'double';
export type PaymentMethod = 'cash' | 'jazzcash' | 'easypaisa' | 'bank_transfer';

export interface PaperType {
  id: string;
  name: string;
  description?: string;
  bwPrice: number;    // PKR per page
  colorPrice: number; // PKR per page
  isDefault?: boolean;
}

export interface PrintSettings {
  copies: number;
  colorMode: ColorMode;
  sides: Sides;
  paperSize: string; // ID of the PaperType (e.g., 'a4_70', 'legal_75', 'photo_glossy')
  pageRangeType: 'all' | 'custom';
  pageRangeFrom: number;
  pageRangeTo: number;
}

export type FileCategory = 'image' | 'pdf' | 'word' | 'excel' | 'powerpoint' | 'text' | 'document';

export function getFileCategory(fileName: string, fileType?: string): FileCategory {
  const ext = (fileName.split('.').pop() || fileType || '').toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'svg'].includes(ext)) return 'image';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['doc', 'docx', 'rtf', 'odt'].includes(ext)) return 'word';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel';
  if (['ppt', 'pptx', 'key'].includes(ext)) return 'powerpoint';
  if (['txt', 'log', 'md', 'json', 'js', 'ts', 'html'].includes(ext)) return 'text';
  return 'document';
}

export interface DocumentInfo {
  id?: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  fileSizeBytes: number;
  pageCount: number;
  thumbnailColor: string;
  isImage?: boolean;
  category?: FileCategory;
  previewUrl?: string;
  downloadUrl?: string;
  file?: File;
  settings?: PrintSettings;
}

export interface Order {
  id: string;
  token: string;
  customerName: string;
  document: DocumentInfo;
  documents?: DocumentInfo[];
  settings: PrintSettings;
  price: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  createdAt: Date;
  updatedAt: Date;
}

export interface PricingConfig {
  bwA4: number;
  bwLegal: number;
  colorA4: number;
  colorLegal: number;
  doubleSidedDiscount: number; // percentage
  minimumCharge: number;
}

export interface ShopConfig {
  name: string;
  address: string;
  phone: string;
  openingHours: string;
  counterName?: string;
  requireCustomerName: boolean;
  showEstimatedTime: boolean;
  showPaymentOptions: boolean;
  autoDeleteFiles: boolean;
  retentionPeriod: string;
  // Banking / IBAN Payment Details
  accountTitle: string;
  bankName: string;
  iban: string;
  jazzCashTitle: string;
  jazzCashNumber: string;
  easypaisaTitle: string;
  easypaisaNumber: string;
}

export interface PrinterStatus {
  name: string;
  model: string;
  // 'unknown' = no printer detected on this computer yet.
  status: 'online' | 'offline' | 'error' | 'unknown';
  // Levels are null when the printer does not report them —
  // the UI must show "not reported", never an invented number.
  paperLevel: number | null;
  tonerLevel: number | null;
  lastChecked: string;
}

export interface DailyStats {
  totalJobs: number;
  revenue: number;
  averageOrder: number;
  completed: number;
  cancelled: number;
  printing: number;
  ready: number;
  queued: number;
}

export interface WeeklyData {
  day: string;
  revenue: number;
  jobs: number;
}

// ============================================================
// Default Paper Types (Customizable by Shopkeeper)
// ============================================================

export const defaultPaperTypes: PaperType[] = [
  {
    id: 'a4_70',
    name: 'A4 Standard (70-75 gsm)',
    description: 'Standard office & school photocopy paper',
    bwPrice: 5,
    colorPrice: 25,
    isDefault: true,
  },
  {
    id: 'a4_80',
    name: 'A4 Premium Bond (80 gsm)',
    description: 'Crisp, heavy white paper for CVs & reports',
    bwPrice: 7,
    colorPrice: 28,
  },
  {
    id: 'legal_75',
    name: 'Legal Affidavit (8.5 × 14 in)',
    description: 'Long sheet for court, stamp & legal agreements',
    bwPrice: 7,
    colorPrice: 30,
  },
  {
    id: 'photo_glossy',
    name: 'Glossy Photo Sheet (180 gsm)',
    description: 'High-res vivid photo & portfolio paper',
    bwPrice: 20,
    colorPrice: 60,
  },
  {
    id: 'card_250',
    name: 'Heavy Cardstock (250 gsm)',
    description: 'Certificates, covers & visiting card stock',
    bwPrice: 15,
    colorPrice: 45,
  },
];

// In-memory or localStorage persistent Paper Types
export function getSavedPaperTypes(): PaperType[] {
  if (typeof window !== 'undefined') {
    const raw =
      localStorage.getItem('paperplane_paper_types') ||
      localStorage.getItem('printdesk_paper_types'); // legacy key, pre-rename
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        // fallback
      }
    }
  }
  return defaultPaperTypes;
}

export function savePaperTypes(types: PaperType[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('paperplane_paper_types', JSON.stringify(types));
  }
}

// ============================================================
// Default Configs
// ============================================================

export const defaultPricing: PricingConfig = {
  bwA4: 5,
  bwLegal: 7,
  colorA4: 25,
  colorLegal: 30,
  doubleSidedDiscount: 10,
  minimumCharge: 20,
};

export const defaultShopConfig: ShopConfig = {
  name: 'Al-Noor Photocopy & Printing',
  address: '',
  phone: '',
  openingHours: '8:00 AM — 10:00 PM',
  requireCustomerName: false,
  showEstimatedTime: true,
  showPaymentOptions: true,
  autoDeleteFiles: true,
  retentionPeriod: 'After printing',
  // Payment details are empty until the shopkeeper enters the real
  // ones in Shop Settings. Never ship with someone else's IBAN or
  // mobile numbers as defaults.
  accountTitle: '',
  bankName: '',
  iban: '',
  jazzCashTitle: '',
  jazzCashNumber: '',
  easypaisaTitle: '',
  easypaisaNumber: '',
};

export function getSavedShopConfig(): ShopConfig {
  if (typeof window !== 'undefined') {
    const raw =
      localStorage.getItem('paperplane_shop_config') ||
      localStorage.getItem('printdesk_shop_config'); // legacy key, pre-rename
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        // fallback
      }
    }
  }
  return defaultShopConfig;
}

export function saveShopConfig(cfg: ShopConfig): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('paperplane_shop_config', JSON.stringify(cfg));
  }
}

// Shown until the server reports a real detected printer.
export const unknownPrinter: PrinterStatus = {
  name: 'No printer detected',
  model: '',
  status: 'unknown',
  paperLevel: null,
  tonerLevel: null,
  lastChecked: '',
};

// Token numbers come from real orders only: the next token is one
// above the highest existing A-N token, so a server restart can
// never re-issue a token that already exists.
export function nextToken(existingTokens: string[]): string {
  let max = 0;
  for (const t of existingTokens) {
    const m = /^A-(\d+)$/.exec(t.trim());
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `A-${max + 1}`;
}
