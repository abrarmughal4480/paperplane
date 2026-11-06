// ============================================================
// PaperPlane — Dynamic Pricing Engine
// Calculates real-time order quotes based on paper stocks,
// copies, color mode, sides discounts & minimum charge
// ============================================================

import {
  PricingConfig,
  PrintSettings,
  defaultPricing,
  getSavedPaperTypes,
  type PaperType,
} from '../data/mockData';

export interface PriceBreakdown {
  pricePerPage: number;
  totalPages: number;
  subtotal: number;
  doubleSidedDiscount: number;
  total: number;
  label: string;
  paperName: string;
}

export function calculatePrice(
  settings: PrintSettings,
  pageCount: number,
  pricing: PricingConfig = defaultPricing,
  paperTypesList?: PaperType[]
): PriceBreakdown {
  const paperTypes = paperTypesList || getSavedPaperTypes();

  // Find selected paper stock
  const foundPaper =
    paperTypes.find((p) => p.id === settings.paperSize) ||
    paperTypes.find((p) => p.isDefault) ||
    paperTypes[0];

  // Determine price per page based on color mode & paper
  let pricePerPage: number;
  if (foundPaper) {
    pricePerPage = settings.colorMode === 'bw' ? foundPaper.bwPrice : foundPaper.colorPrice;
  } else {
    // Fallback to legacy
    const isA4 = settings.paperSize.toLowerCase().includes('a4');
    if (settings.colorMode === 'bw') {
      pricePerPage = isA4 ? pricing.bwA4 : pricing.bwLegal;
    } else {
      pricePerPage = isA4 ? pricing.colorA4 : pricing.colorLegal;
    }
  }

  // Calculate effective page count
  let totalPages: number;
  if (settings.pageRangeType === 'custom') {
    const from = Math.max(1, settings.pageRangeFrom);
    const to = Math.min(pageCount, settings.pageRangeTo);
    totalPages = Math.max(0, to - from + 1);
  } else {
    totalPages = pageCount;
  }

  // Calculate subtotal before discounts
  let subtotal = pricePerPage * totalPages * settings.copies;

  // Apply double-sided discount
  let doubleSidedDiscount = 0;
  if (settings.sides === 'double') {
    doubleSidedDiscount = Math.round(subtotal * (pricing.doubleSidedDiscount / 100));
    subtotal = subtotal - doubleSidedDiscount;
  }

  // Apply minimum charge guarantee
  const total = Math.max(subtotal, pricing.minimumCharge);

  // Friendly human labels
  const colorLabel = settings.colorMode === 'bw' ? 'B&W' : 'Color Laser';
  const sidesLabel = settings.sides === 'single' ? 'Single-sided' : 'Double-sided';
  const paperName = foundPaper ? foundPaper.name : settings.paperSize.toUpperCase();
  const label = `${colorLabel} · ${paperName} · ${sidesLabel}`;

  return {
    pricePerPage,
    totalPages,
    subtotal: subtotal + doubleSidedDiscount,
    doubleSidedDiscount,
    total,
    label,
    paperName,
  };
}

export function formatPrice(amount: number): string {
  return `Rs. ${amount.toLocaleString()}`;
}

export interface MultiPriceBreakdown {
  items: {
    document: import('../data/mockData').DocumentInfo;
    breakdown: PriceBreakdown;
  }[];
  totalSheets: number;
  totalCopies: number;
  combinedSubtotal: number;
  combinedDiscount: number;
  grandTotal: number;
}

export function calculateMultiDocumentPrice(
  documents: import('../data/mockData').DocumentInfo[],
  globalSettings: PrintSettings,
  pricing: PricingConfig = defaultPricing,
  paperTypesList?: PaperType[]
): MultiPriceBreakdown {
  if (!documents || documents.length === 0) {
    return {
      items: [],
      totalSheets: 0,
      totalCopies: 0,
      combinedSubtotal: 0,
      combinedDiscount: 0,
      grandTotal: 0,
    };
  }

  let totalSheets = 0;
  let totalCopies = 0;
  let combinedSubtotal = 0;
  let combinedDiscount = 0;

  const items = documents.map((doc) => {
    const effectiveSettings = doc.settings || globalSettings;
    const pageCount = doc.isImage ? 1 : doc.pageCount;
    const b = calculatePrice(effectiveSettings, pageCount, pricing, paperTypesList);

    totalSheets += b.totalPages;
    totalCopies += effectiveSettings.copies;
    combinedSubtotal += b.subtotal;
    combinedDiscount += b.doubleSidedDiscount;

    return {
      document: doc,
      breakdown: b,
    };
  });

  const rawSum = items.reduce((acc, curr) => acc + curr.breakdown.total, 0);
  const grandTotal = Math.max(rawSum, pricing.minimumCharge);

  return {
    items,
    totalSheets,
    totalCopies,
    combinedSubtotal,
    combinedDiscount,
    grandTotal,
  };
}

export interface PricingScenario {
  label: string;
  pages: number;
  copies: number;
  colorMode: 'bw' | 'color';
  sides: 'single' | 'double';
  paperSize: string;
}

export const pricingScenarios: PricingScenario[] = [
  { label: '1 page B&W Standard A4', pages: 1, copies: 1, colorMode: 'bw', sides: 'single', paperSize: 'a4_70' },
  { label: '10 pages B&W Standard A4', pages: 10, copies: 1, colorMode: 'bw', sides: 'single', paperSize: 'a4_70' },
  { label: '10 pages Color Standard A4', pages: 10, copies: 1, colorMode: 'color', sides: 'single', paperSize: 'a4_70' },
  { label: '20 pages B&W Legal Affidavit', pages: 20, copies: 1, colorMode: 'bw', sides: 'single', paperSize: 'legal_75' },
];
