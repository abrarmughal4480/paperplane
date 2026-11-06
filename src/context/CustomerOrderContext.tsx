// ============================================================
// PaperPlane — Unified Store Context
// Manages reactive state across Customer Mobile & Shopkeeper Dashboard
// ============================================================

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import {
  type DocumentInfo,
  type PrintSettings,
  type Order,
  type OrderStatus,
  type PaymentMethod,
  type PricingConfig,
  type ShopConfig,
  type PrinterStatus,
  type DailyStats,
  type PaperType,
  mockOrders,
  mockDocuments,
  defaultPricing,
  defaultShopConfig,
  defaultPrinter,
  defaultPaperTypes,
  getSavedPaperTypes,
  savePaperTypes,
  generateToken,
} from '../data/mockData';
import { calculatePrice, calculateMultiDocumentPrice } from '../utils/pricing';

const STORAGE_KEYS = {
  ORDERS: 'paperplane_orders_data',
  PRICING: 'paperplane_pricing_config',
  SHOP_CONFIG: 'paperplane_shop_config',
  PRINTER_STATUS: 'paperplane_printer_status',
  PAPER_TYPES: 'paperplane_paper_types',
  CUSTOMER_SESSION: 'paperplane_customer_session',
};

// One-time migration from the old PrintDesk keys: read the new
// paperplane_* key first, fall back to the legacy printdesk_* key once
// and copy it forward, so the rename loses no saved shop/pricing data.
function readStored(key: string): string | null {
  try {
    const fresh = localStorage.getItem(key);
    if (fresh) return fresh;
    const legacyKey = key.replace('paperplane_', 'printdesk_');
    const legacy = localStorage.getItem(legacyKey);
    if (legacy) {
      localStorage.setItem(key, legacy);
      localStorage.removeItem(legacyKey);
      return legacy;
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

function loadCustomerSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.CUSTOMER_SESSION);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // safe fallback
  }
  return null;
}

function loadStoredOrders(): Order[] {
  try {
    const raw = readStored(STORAGE_KEYS.ORDERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any) => ({
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
    }));
  } catch {
    return [];
  }
}

function mapBackendOrderToFrontend(o: any): Order {
  const firstDoc = o.documents?.[0];
  const docInfo: DocumentInfo = firstDoc
    ? {
        id: firstDoc.id,
        fileName: firstDoc.file_name || firstDoc.fileName || 'Document',
        fileSizeBytes: firstDoc.file_size || firstDoc.fileSizeBytes || 0,
        fileSize: firstDoc.file_size ? `${Math.round(firstDoc.file_size / 1024)} KB` : '1 MB',
        fileType: firstDoc.file_type || firstDoc.fileType || 'application/pdf',
        pageCount: firstDoc.page_count || firstDoc.pageCount || 1,
        thumbnailColor: 'bg-blue-500',
        isImage: (firstDoc.file_type || '').startsWith('image/'),
        downloadUrl: firstDoc.stored_file_name ? `/api/uploads/${firstDoc.stored_file_name}` : undefined,
      }
    : {
        id: 'doc_1',
        fileName: 'Document',
        fileSizeBytes: 1024,
        fileSize: '1 MB',
        fileType: 'application/pdf',
        pageCount: o.total_pages || 1,
        thumbnailColor: 'bg-blue-500',
        isImage: false,
      };

  const allDocs: DocumentInfo[] = Array.isArray(o.documents) && o.documents.length > 0
    ? o.documents.map((d: any) => ({
        id: d.id,
        fileName: d.file_name || d.fileName || 'Document',
        fileSizeBytes: d.file_size || d.fileSizeBytes || 0,
        fileSize: d.file_size ? `${Math.round(d.file_size / 1024)} KB` : '1 MB',
        fileType: d.file_type || d.fileType || 'application/pdf',
        pageCount: d.page_count || d.pageCount || 1,
        thumbnailColor: 'bg-blue-500',
        isImage: (d.file_type || '').startsWith('image/'),
        downloadUrl: d.stored_file_name ? `/api/uploads/${d.stored_file_name}` : undefined,
      }))
    : [docInfo];

  return {
    id: o.id,
    token: o.token,
    customerName: o.customer_name || o.customerName || 'Walk-in Customer',
    document: docInfo,
    documents: allDocs,
    settings: {
      copies: o.total_copies || 1,
      colorMode: firstDoc?.color_mode || 'bw',
      sides: firstDoc?.sides || 'single',
      paperSize: firstDoc?.paper_size || 'a4_70',
      pageRangeType: 'all',
      pageRangeFrom: 1,
      pageRangeTo: o.total_pages || 1,
    },
    price: Number(o.total_price || o.price || 0),
    status: o.status || 'queued',
    paymentMethod: o.payment_method || o.paymentMethod || 'cash',
    createdAt: new Date(o.created_at || Date.now()),
    updatedAt: new Date(o.updated_at || Date.now()),
  };
}

function loadStoredPricing(): PricingConfig {
  try {
    const raw = readStored(STORAGE_KEYS.PRICING);
    return raw ? { ...defaultPricing, ...JSON.parse(raw) } : defaultPricing;
  } catch {
    return defaultPricing;
  }
}

function loadStoredShopConfig(): ShopConfig {
  try {
    const raw = readStored(STORAGE_KEYS.SHOP_CONFIG);
    return raw ? { ...defaultShopConfig, ...JSON.parse(raw) } : defaultShopConfig;
  } catch {
    return defaultShopConfig;
  }
}

function loadStoredPrinter(): PrinterStatus {
  try {
    const raw = readStored(STORAGE_KEYS.PRINTER_STATUS);
    return raw ? { ...defaultPrinter, ...JSON.parse(raw) } : defaultPrinter;
  } catch {
    return defaultPrinter;
  }
}

export interface CustomerOrderState {
  // Customer flow (multi-file ready)
  documents: DocumentInfo[];
  activeDocIndex: number;
  selectedDocument: DocumentInfo | null;
  printSettings: PrintSettings;
  customerName: string;
  orderToken: string;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  price: number;

  // Dashboard & Shopkeeper store
  orders: Order[];
  pricingConfig: PricingConfig;
  shopConfig: ShopConfig;
  printerStatus: PrinterStatus;
  paperTypes: PaperType[];
  dailyStats: DailyStats;
}

export interface CustomerOrderActions {
  // Customer actions (multi-file ready)
  setDocument: (doc: DocumentInfo) => void;
  addDocuments: (docs: DocumentInfo[]) => void;
  removeDocument: (index: number) => void;
  clearDocuments: () => void;
  setActiveDocIndex: (index: number) => void;
  updateSettings: (partial: Partial<PrintSettings>) => void;
  updateDocSettings: (index: number, partial: Partial<PrintSettings>) => void;
  setCustomerName: (name: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setOrderStatus: (status: OrderStatus) => void;
  submitOrder: (nameOverride?: string) => string;
  resetOrder: () => void;
  findOrderByToken: (token: string) => Order | undefined;

  // Shopkeeper & Dashboard actions
  updatePricingConfig: (partial: Partial<PricingConfig>) => void;
  updateShopConfig: (partial: Partial<ShopConfig>) => void;
  updatePrinterStatus: (partial: Partial<PrinterStatus>) => void;
  updateExistingOrderStatus: (id: string, status: OrderStatus) => void;
  updateExistingOrder: (idOrOrder: string | Order, patch?: Partial<Order>) => void;
  simulateIncomingOrder: () => Order;
  addNewOrder: (order: Order) => void;
  deleteOrder: (id: string) => void;
  resetToDefaults: () => void;

  // Custom Paper Types actions
  addPaperType: (paper: Omit<PaperType, 'id'>) => void;
  updatePaperType: (id: string, partial: Partial<PaperType>) => void;
  deletePaperType: (id: string) => void;
}

export type CustomerOrderContextValue = CustomerOrderState & CustomerOrderActions;

const defaultSettings: PrintSettings = {
  copies: 1,
  colorMode: 'bw',
  sides: 'single',
  paperSize: 'a4_70',
  pageRangeType: 'all',
  pageRangeFrom: 1,
  pageRangeTo: 1,
};

const CustomerOrderContext = createContext<CustomerOrderContextValue | null>(null);

function playSoftNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // safe fallback
  }
}

export function CustomerOrderProvider({ children }: { children: ReactNode }) {
  const session = loadCustomerSession();

  const initialDocs: DocumentInfo[] = session?.documents?.length
    ? session.documents
    : session?.selectedDocument
    ? [session.selectedDocument]
    : [];

  // Customer state initialized with persistent session fallback
  const [documents, setDocuments] = useState<DocumentInfo[]>(initialDocs);
  const [activeDocIndex, setActiveDocIndex] = useState<number>(session?.activeDocIndex ?? 0);
  const [printSettings, setPrintSettings] = useState<PrintSettings>(
    session?.printSettings || defaultSettings
  );
  const [customerName, setCustomerName] = useState<string>(session?.customerName || '');
  const [orderToken, setOrderToken] = useState<string>(session?.orderToken || '');
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(session?.orderStatus || 'queued');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(session?.paymentMethod || 'cash');
  const [price, setPrice] = useState<number>(session?.price || 0);

  // Active selected document derived from activeDocIndex
  const selectedDocument: DocumentInfo | null = documents[activeDocIndex] || documents[0] || null;

  // Dashboard store
  const [orders, setOrders] = useState<Order[]>(loadStoredOrders);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(loadStoredPricing);
  const [shopConfig, setShopConfig] = useState<ShopConfig>(loadStoredShopConfig);
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>(loadStoredPrinter);
  const [paperTypes, setPaperTypes] = useState<PaperType[]>(getSavedPaperTypes);

  // Fetch real, original data from SQLite backend on mount
  useEffect(() => {
    // 1. Fetch live orders from SQLite database
    fetch('/api/orders')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data)) {
          setOrders(data.map(mapBackendOrderToFrontend));
        }
      })
      .catch(() => {});

    // 2. Fetch live paper types from SQLite database
    fetch('/api/paper-types')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPaperTypes(
            data.map((p: any) => ({
              id: p.id,
              name: p.name,
              bwPrice: Number(p.bw_price || p.bwPrice || 5),
              colorPrice: Number(p.color_price || p.colorPrice || 25),
              isDefault: p.id === 'a4_70',
            }))
          );
        }
      })
      .catch(() => {}); 

    // 3. Fetch dynamic pricing from SQLite database
    fetch('/api/pricing')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data === 'object') {
          setPricingConfig((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});

    // 4. Fetch real shop settings from SQLite database
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setShopConfig((prev) => ({
            ...prev,
            name: data.shop_name || prev.name,
            phone: data.phone || prev.phone,
            address: data.address || prev.address,
            counterName: data.counter_name || prev.counterName,
            bankName: data.bank_name || prev.bankName,
            accountTitle: data.bank_title || prev.accountTitle,
            iban: data.bank_iban || prev.iban,
            jazzCashTitle: data.jazzcash_title || prev.jazzCashTitle,
            jazzCashNumber: data.jazzcash_number || prev.jazzCashNumber,
            easypaisaTitle: data.easypaisa_title || prev.easypaisaTitle,
            easypaisaNumber: data.easypaisa_number || prev.easypaisaNumber,
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Dynamic live pricing recalculation across single or multiple documents
  useEffect(() => {
    if (documents.length === 0) {
      setPrice(0);
      return;
    }
    const multi = calculateMultiDocumentPrice(documents, printSettings, pricingConfig, paperTypes);
    setPrice(multi.grandTotal);
  }, [documents, printSettings, pricingConfig, paperTypes]);

  // Persist customer active session across page refreshes (strip DOM File and expired blob URLs)
  useEffect(() => {
    try {
      if (documents.length > 0 || selectedDocument) {
        const safeDocuments = documents.map((d) => ({
          ...d,
          file: undefined,
          previewUrl: undefined,
        }));

        const safeSelected = selectedDocument
          ? { ...selectedDocument, file: undefined, previewUrl: undefined }
          : null;

        sessionStorage.setItem(
          STORAGE_KEYS.CUSTOMER_SESSION,
          JSON.stringify({
            documents: safeDocuments,
            activeDocIndex,
            selectedDocument: safeSelected,
            printSettings,
            customerName,
            orderToken,
            orderStatus,
            paymentMethod,
            price,
          })
        );
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.CUSTOMER_SESSION);
      }
    } catch (e) {
      // safe
    }
  }, [documents, activeDocIndex, selectedDocument, printSettings, customerName, orderToken, orderStatus, paymentMethod, price]);

  // Persist dashboard state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (e) {
      // safe
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRICING, JSON.stringify(pricingConfig));
    } catch (e) {
      // safe
    }
  }, [pricingConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SHOP_CONFIG, JSON.stringify(shopConfig));
    } catch (e) {
      // safe
    }
  }, [shopConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRINTER_STATUS, JSON.stringify(printerStatus));
    } catch (e) {
      // safe
    }
  }, [printerStatus]);

  useEffect(() => {
    savePaperTypes(paperTypes);
  }, [paperTypes]);

  // Live SSE listener for real-time order notifications on dashboard
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/events/dashboard');
      es.addEventListener('new_order', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed?.order) {
            setOrders((prev) => {
              if (prev.some((o) => o.id === parsed.order.id || o.token === parsed.order.token)) {
                return prev;
              }
              playSoftNotificationChime();
              const incoming: Order = {
                id: parsed.order.id,
                token: parsed.order.token,
                customerName: parsed.order.customer_name || parsed.order.customerName || 'Customer',
                document: parsed.order.documents?.[0] || mockDocuments[0],
                documents: parsed.order.documents || [mockDocuments[0]],
                settings: defaultSettings,
                price: Number(parsed.order.total_price || 0),
                status: parsed.order.status || 'queued',
                paymentMethod: parsed.order.payment_method || 'cash',
                createdAt: new Date(parsed.order.created_at || Date.now()),
                updatedAt: new Date(parsed.order.updated_at || Date.now()),
              };
              return [incoming, ...prev];
            });
          }
        } catch {
          // safe
        }
      });
    } catch {
      // offline fallback
    }

    return () => {
      if (es) es.close();
    };
  }, []);

  // Customer actions (multi-file ready)
  const setDocument = useCallback((doc: DocumentInfo) => {
    setDocuments([doc]);
    setActiveDocIndex(0);
    setPrintSettings((prev) => ({
      ...prev,
      pageRangeTo: doc.isImage ? 1 : doc.pageCount,
      pageRangeFrom: 1,
    }));
  }, []);

  const addDocuments = useCallback((newDocs: DocumentInfo[]) => {
    setDocuments((prev) => {
      // Deduplicate by fileName + fileSizeBytes
      const existingKeys = new Set(prev.map((d) => `${d.fileName}_${d.fileSizeBytes}`));
      const uniqueNew = newDocs.filter(
        (d) => !existingKeys.has(`${d.fileName}_${d.fileSizeBytes}`)
      );
      if (uniqueNew.length === 0) return prev;
      return [...prev, ...uniqueNew];
    });
  }, []);

  const clearDocuments = useCallback(() => {
    setDocuments([]);
    setActiveDocIndex(0);
  }, []);

  const removeDocument = useCallback((index: number) => {
    setDocuments((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next;
    });
    setActiveDocIndex((prev) => Math.max(0, prev >= index ? prev - 1 : prev));
  }, []);

  const updateSettings = useCallback((partial: Partial<PrintSettings>) => {
    setPrintSettings((prev) => {
      const updated = { ...prev, ...partial };
      return updated;
    });
    // Also sync to active document if exists
    setDocuments((prev) =>
      prev.map((d, i) => (i === activeDocIndex ? { ...d, settings: { ...(d.settings || printSettings), ...partial } } : d))
    );
  }, [activeDocIndex, printSettings]);

  const updateDocSettings = useCallback((index: number, partial: Partial<PrintSettings>) => {
    setDocuments((prev) =>
      prev.map((d, i) =>
        i === index
          ? { ...d, settings: { ...(d.settings || defaultSettings), ...partial } }
          : d
      )
    );
  }, []);

  const submitOrder = useCallback(
    (nameOverride?: string): string => {
      const token = generateToken();
      const finalName = nameOverride?.trim() || customerName.trim() || 'Walk-in Customer';
      const docs = documents.length > 0 ? documents : (selectedDocument ? [selectedDocument] : [mockDocuments[0]]);
      const multi = calculateMultiDocumentPrice(docs, printSettings, pricingConfig, paperTypes);

      const newOrder: Order = {
        id: `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        token,
        customerName: finalName,
        document: docs[0],
        documents: docs,
        settings: { ...printSettings },
        price: multi.grandTotal,
        status: 'queued',
        paymentMethod,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setOrders((prev) => [newOrder, ...prev]);
      setOrderToken(token);
      setOrderStatus('queued');

      // Asynchronously sync order to local SQLite backend
      try {
        fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: newOrder.id,
            token,
            customerName: finalName,
            price: multi.grandTotal,
            totalPages: multi.totalSheets,
            totalCopies: printSettings.copies,
            paymentMethod,
            status: 'queued',
            documents: docs.map((d) => ({
              fileName: d.fileName,
              fileSizeBytes: d.fileSizeBytes,
              fileType: d.fileType,
              pageCount: d.pageCount,
              colorMode: d.settings?.colorMode || printSettings.colorMode,
              sides: d.settings?.sides || printSettings.sides,
              paperSize: d.settings?.paperSize || printSettings.paperSize,
              copies: d.settings?.copies || printSettings.copies,
            })),
          }),
        }).catch(() => {});
      } catch {
        // safe fallback
      }

      return token;
    },
    [customerName, documents, selectedDocument, printSettings, pricingConfig, paperTypes, paymentMethod]
  );

  const resetOrder = useCallback(() => {
    setDocuments([]);
    setActiveDocIndex(0);
    setPrintSettings(defaultSettings);
    setCustomerName('');
    setOrderToken('');
    setOrderStatus('queued');
    setPaymentMethod('cash');
    setPrice(0);
    try {
      sessionStorage.removeItem(STORAGE_KEYS.CUSTOMER_SESSION);
    } catch (e) {
      // safe
    }
  }, []);

  const findOrderByToken = useCallback(
    (token: string) => {
      return orders.find((o) => o.token.toLowerCase() === token.trim().toLowerCase());
    },
    [orders]
  );

  // Shopkeeper Actions
  const updatePricingConfig = useCallback((partial: Partial<PricingConfig>) => {
    setPricingConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const updateShopConfig = useCallback((partial: Partial<ShopConfig>) => {
    setShopConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const updatePrinterStatus = useCallback((partial: Partial<PrinterStatus>) => {
    setPrinterStatus((prev) => ({ ...prev, ...partial }));
  }, []);

  const updateExistingOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status, updatedAt: new Date() } : o))
    );
    try {
      fetch(`/api/orders/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).catch(() => {});
    } catch {
      // safe fallback
    }
  }, []);

  const updateExistingOrder = useCallback(
    (idOrOrder: string | Order, patch?: Partial<Order>) => {
      setOrders((prev) => {
        if (typeof idOrOrder === 'string') {
          return prev.map((o) =>
            o.id === idOrOrder ? { ...o, ...patch, updatedAt: new Date() } : o
          );
        } else {
          return prev.map((o) =>
            o.id === idOrOrder.id ? { ...idOrOrder, updatedAt: new Date() } : o
          );
        }
      });
    },
    []
  );

  const addNewOrder = useCallback((order: Order) => {
    setOrders((prev) => [order, ...prev]);
  }, []);

  const deleteOrder = useCallback((id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const simulateIncomingOrder = useCallback((): Order => {
    const randomDoc = mockDocuments[Math.floor(Math.random() * mockDocuments.length)];
    const names = ['Hamza Tariq', 'Zubair Shah', 'Alina Faisal', 'Kamran Sheikh'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const token = generateToken();
    const paper = paperTypes[Math.floor(Math.random() * paperTypes.length)] || paperTypes[0];

    const randomSettings: PrintSettings = {
      copies: Math.floor(Math.random() * 2) + 1,
      colorMode: Math.random() > 0.6 ? 'color' : 'bw',
      sides: Math.random() > 0.5 ? 'double' : 'single',
      paperSize: paper.id,
      pageRangeType: 'all',
      pageRangeFrom: 1,
      pageRangeTo: randomDoc.pageCount,
    };

    const breakdown = calculatePrice(randomSettings, randomDoc.pageCount, pricingConfig, paperTypes);
    const newOrd: Order = {
      id: `ord-${Date.now()}`,
      token,
      customerName: randomName,
      document: randomDoc,
      settings: randomSettings,
      price: breakdown.total,
      status: 'queued',
      paymentMethod: 'cash',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setOrders((prev) => [newOrd, ...prev]);
    return newOrd;
  }, [pricingConfig, paperTypes]);

  // Paper Types CRUD
  const addPaperType = useCallback((paper: Omit<PaperType, 'id'>) => {
    const id = `paper_${Date.now()}`;
    setPaperTypes((prev) => [...prev, { ...paper, id }]);
  }, []);

  const updatePaperType = useCallback((id: string, partial: Partial<PaperType>) => {
    setPaperTypes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...partial } : p))
    );
  }, []);

  const deletePaperType = useCallback((id: string) => {
    setPaperTypes((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const resetToDefaults = useCallback(() => {
    setOrders([]);
    setPricingConfig(defaultPricing);
    setShopConfig(defaultShopConfig);
    setPrinterStatus(defaultPrinter);
    setPaperTypes(defaultPaperTypes);
    localStorage.clear();
  }, []);

  // Compute daily stats
  const dailyStats: DailyStats = {
    totalJobs: orders.length,
    revenue: orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.price, 0),
    averageOrder:
      orders.length > 0
        ? Math.round(
            orders
              .filter((o) => o.status !== 'cancelled')
              .reduce((sum, o) => sum + o.price, 0) / (orders.length || 1)
          )
        : 0,
    completed: orders.filter((o) => o.status === 'collected').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
    printing: orders.filter((o) => o.status === 'printing').length,
    ready: orders.filter((o) => o.status === 'ready').length,
    queued: orders.filter((o) => o.status === 'queued').length,
  };

  const value: CustomerOrderContextValue = {
    documents,
    activeDocIndex,
    selectedDocument,
    printSettings,
    customerName,
    orderToken,
    orderStatus,
    paymentMethod,
    price,
    orders,
    pricingConfig,
    shopConfig,
    printerStatus,
    paperTypes,
    dailyStats,
    setDocument,
    addDocuments,
    removeDocument,
    clearDocuments,
    setActiveDocIndex,
    updateSettings,
    updateDocSettings,
    setCustomerName,
    setPaymentMethod,
    setOrderStatus,
    submitOrder,
    resetOrder,
    findOrderByToken,
    updatePricingConfig,
    updateShopConfig,
    updatePrinterStatus,
    updateExistingOrderStatus,
    updateExistingOrder,
    simulateIncomingOrder,
    addNewOrder,
    deleteOrder,
    resetToDefaults,
    addPaperType,
    updatePaperType,
    deletePaperType,
  };

  return (
    <CustomerOrderContext.Provider value={value}>
      {children}
    </CustomerOrderContext.Provider>
  );
}

export function useCustomerOrder(): CustomerOrderContextValue {
  const ctx = useContext(CustomerOrderContext);
  if (!ctx) {
    throw new Error('useCustomerOrder must be used within CustomerOrderProvider');
  }
  return ctx;
}
