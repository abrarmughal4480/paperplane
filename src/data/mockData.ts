// ============================================================
// PaperPlane — Mock Data Layer
// All data structures and mock data for the prototype
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
  status: 'online' | 'offline' | 'error';
  paperLevel: number;
  tonerLevel: number;
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
  address: 'Shop 12, University Road, Karachi',
  phone: '+92 321 1234567',
  openingHours: '8:00 AM — 10:00 PM',
  requireCustomerName: false,
  showEstimatedTime: true,
  showPaymentOptions: true,
  autoDeleteFiles: true,
  retentionPeriod: 'After printing',
  // Real Pakistani Payment Details
  accountTitle: 'Al-Noor Printing Services',
  bankName: 'Meezan Bank Ltd',
  iban: 'PK36MEZN0001234567890123',
  jazzCashTitle: 'Muhammad Usman',
  jazzCashNumber: '03211234567',
  easypaisaTitle: 'Muhammad Usman',
  easypaisaNumber: '03457654321',
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

export const defaultPrinter: PrinterStatus = {
  name: 'Main Counter Printer',
  model: 'HP LaserJet Pro MFP M428fdw',
  status: 'online',
  paperLevel: 68,
  tonerLevel: 72,
  lastChecked: '10 seconds ago',
};

export const offlinePrinter: PrinterStatus = {
  name: 'Backup Printer',
  model: 'Canon imageCLASS MF445dw',
  status: 'offline',
  paperLevel: 45,
  tonerLevel: 30,
  lastChecked: '2 minutes ago',
};

// ============================================================
// Mock Documents
// ============================================================

export const mockDocuments: DocumentInfo[] = [
  { fileName: 'Assignment.pdf', fileType: 'PDF', fileSize: '1.8 MB', fileSizeBytes: 1887436, pageCount: 8, thumbnailColor: '#E8E0F0' },
  { fileName: 'Resume.pdf', fileType: 'PDF', fileSize: '420 KB', fileSizeBytes: 430080, pageCount: 3, thumbnailColor: '#E0E8F0' },
  { fileName: 'CNIC_Copy.pdf', fileType: 'PDF', fileSize: '1.2 MB', fileSizeBytes: 1258291, pageCount: 2, thumbnailColor: '#F0E8E0' },
  { fileName: 'Notes.pdf', fileType: 'PDF', fileSize: '3.4 MB', fileSizeBytes: 3565158, pageCount: 12, thumbnailColor: '#E0F0E8' },
  { fileName: 'Application.docx', fileType: 'DOC', fileSize: '890 KB', fileSizeBytes: 911360, pageCount: 5, thumbnailColor: '#E8E8F0' },
  { fileName: 'Document.jpg', fileType: 'JPG', fileSize: '2.1 MB', fileSizeBytes: 2202009, pageCount: 1, thumbnailColor: '#F0E0E8' },
];

export const mockCustomers = [
  'Ahmed Khan',
  'Sara Ali',
  'Muhammad Usman',
  'Hassan Raza',
  'Ayesha Malik',
  'Fatima Noor',
  'Bilal Ahmed',
  'Zainab Shah',
];

const now = new Date();
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60000);

export const mockOrders: Order[] = [
  {
    id: '1', token: 'A-12', customerName: 'Ahmed Khan',
    document: mockDocuments[0],
    settings: { copies: 2, colorMode: 'bw', sides: 'double', paperSize: 'a4_70', pageRangeType: 'all', pageRangeFrom: 1, pageRangeTo: 8 },
    price: 72, status: 'queued', paymentMethod: 'cash',
    createdAt: minutesAgo(5), updatedAt: minutesAgo(5),
  },
  {
    id: '2', token: 'A-13', customerName: 'Sara Ali',
    document: mockDocuments[1],
    settings: { copies: 1, colorMode: 'color', sides: 'single', paperSize: 'a4_80', pageRangeType: 'all', pageRangeFrom: 1, pageRangeTo: 3 },
    price: 84, status: 'printing', paymentMethod: 'jazzcash',
    createdAt: minutesAgo(12), updatedAt: minutesAgo(3),
  },
  {
    id: '3', token: 'A-14', customerName: 'Muhammad Usman',
    document: mockDocuments[3],
    settings: { copies: 1, colorMode: 'bw', sides: 'single', paperSize: 'legal_75', pageRangeType: 'all', pageRangeFrom: 1, pageRangeTo: 12 },
    price: 84, status: 'ready', paymentMethod: 'cash',
    createdAt: minutesAgo(25), updatedAt: minutesAgo(8),
  },
  {
    id: '4', token: 'A-15', customerName: 'Hassan Raza',
    document: mockDocuments[2],
    settings: { copies: 3, colorMode: 'bw', sides: 'single', paperSize: 'a4_70', pageRangeType: 'all', pageRangeFrom: 1, pageRangeTo: 2 },
    price: 30, status: 'collected', paymentMethod: 'easypaisa',
    createdAt: minutesAgo(45), updatedAt: minutesAgo(15),
  },
  {
    id: '5', token: 'A-16', customerName: 'Ayesha Malik',
    document: mockDocuments[4],
    settings: { copies: 2, colorMode: 'color', sides: 'single', paperSize: 'a4_70', pageRangeType: 'custom', pageRangeFrom: 1, pageRangeTo: 3 },
    price: 150, status: 'queued', paymentMethod: 'bank_transfer',
    createdAt: minutesAgo(2), updatedAt: minutesAgo(2),
  },
  {
    id: '6', token: 'A-17', customerName: 'Fatima Noor',
    document: mockDocuments[5],
    settings: { copies: 5, colorMode: 'bw', sides: 'single', paperSize: 'photo_glossy', pageRangeType: 'all', pageRangeFrom: 1, pageRangeTo: 1 },
    price: 100, status: 'collected', paymentMethod: 'cash',
    createdAt: minutesAgo(60), updatedAt: minutesAgo(30),
  },
];

export const mockDailyStats: DailyStats = {
  totalJobs: 42,
  revenue: 6840,
  averageOrder: 163,
  completed: 29,
  cancelled: 3,
  printing: 5,
  ready: 8,
  queued: 4,
};

export const mockWeeklyData: WeeklyData[] = [
  { day: 'Mon', revenue: 5200, jobs: 34 },
  { day: 'Tue', revenue: 6100, jobs: 38 },
  { day: 'Wed', revenue: 4800, jobs: 30 },
  { day: 'Thu', revenue: 7200, jobs: 45 },
  { day: 'Fri', revenue: 8500, jobs: 52 },
  { day: 'Sat', revenue: 9200, jobs: 58 },
  { day: 'Sun', revenue: 3400, jobs: 22 },
];

let tokenCounter = 20;

export function generateToken(): string {
  tokenCounter++;
  return `A-${tokenCounter}`;
}

export const statusBreakdown = [
  { status: 'Queued' as const, count: 4, color: '#8E8E93' },
  { status: 'Printing' as const, count: 5, color: '#0071E3' },
  { status: 'Ready' as const, count: 8, color: '#34C759' },
  { status: 'Collected' as const, count: 29, color: '#5856D6' },
  { status: 'Cancelled' as const, count: 3, color: '#FF3B30' },
];
