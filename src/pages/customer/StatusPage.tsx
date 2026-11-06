import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Loader2,
  Package,
  Printer,
  ClipboardList,
  RotateCcw,
} from 'lucide-react';
import { useCustomerOrder } from '../../context/CustomerOrderContext';
import { calculatePrice, calculateMultiDocumentPrice, formatPrice } from '../../utils/pricing';
import type { OrderStatus } from '../../data/mockData';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

const STEPS = (printerName: string) => [
  {
    status: 'queued' as OrderStatus,
    label: 'Order in Queue',
    desc: 'Waiting for available printer at counter',
    icon: ClipboardList,
  },
  {
    status: 'printing' as OrderStatus,
    label: 'Printing in Progress',
    desc: `${printerName} is spooling your document`,
    icon: Printer,
  },
  {
    status: 'ready' as OrderStatus,
    label: 'Ready for Collection',
    desc: 'Documents printed & sorted at counter',
    icon: Package,
  },
];

const ORDER_FLOW: OrderStatus[] = ['queued', 'printing', 'ready'];

export function StatusPage() {
  const navigate = useNavigate();
  const {
    documents,
    selectedDocument,
    printSettings,
    orderToken,
    orderStatus,
    setOrderStatus,
    paymentMethod,
    price,
    resetOrder,
    paperTypes,
    pricingConfig,
    printerStatus,
  } = useCustomerOrder();

  const currentDocs = documents.length > 0 ? documents : (selectedDocument ? [selectedDocument] : []);

  // Real-time SSE listener connecting to local server
  useEffect(() => {
    if (!orderToken) return;
    let es: EventSource | null = null;
    try {
      es = new EventSource(`/api/events/order/${encodeURIComponent(orderToken)}`);
      es.addEventListener('status_change', (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed?.order?.status) {
            setOrderStatus(parsed.order.status);
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
  }, [orderToken, setOrderStatus]);

  if (currentDocs.length === 0 || !orderToken) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-sm text-muted-foreground">No active order to track.</p>
        <Button variant="primary" onClick={() => navigate('/customer/upload')}>
          Place an Order
        </Button>
      </div>
    );
  }

  const isMulti = currentDocs.length > 1;
  const multiBreakdown = calculateMultiDocumentPrice(currentDocs, printSettings, pricingConfig, paperTypes);
  const totalAmount = price > 0 ? price : multiBreakdown.grandTotal;
  const isReady = orderStatus === 'ready';

  const currentIdx = ORDER_FLOW.indexOf(orderStatus);
  const steps = STEPS(
    printerStatus.status === 'unknown' ? 'The counter printer' : printerStatus.model || printerStatus.name
  );

  return (
    <div className="py-2 space-y-6">
      {/* Ready Banner State vs Active Status */}
      <AnimatePresence mode="wait">
        {isReady ? (
          <motion.div
            key="ready-state"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-center space-y-3 shadow-elevation"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
              <Check className="w-9 h-9 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <Badge variant="success" className="text-xs px-3 py-1">
                Print Completed
              </Badge>
              <h2 className="text-2xl font-black text-foreground pt-1">
                Ready for Pickup!
              </h2>
              <div className="text-4xl font-black text-foreground font-mono tracking-tight">
                {orderToken}
              </div>
              <p className="text-xs text-muted-foreground pt-1 max-w-xs mx-auto">
                Please show this token at the counter to collect your pages and pay{' '}
                <strong className="text-foreground">{formatPrice(totalAmount)}</strong>.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="tracking-header"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Live Order Status
              </h1>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                Token {orderToken}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Real-time progression of your print job.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vertical Animated Progress Tracker */}
      <Card className="p-6 space-y-6 border-border/80 shadow-elevation">
        <div className="space-y-6">
          {steps.map((st, idx) => {
            const isCompleted = currentIdx > idx;
            const isCurrent = currentIdx === idx;
            const isUpcoming = currentIdx < idx;
            const Icon = st.icon;

            return (
              <div key={st.status} className="flex gap-4 relative">
                {/* Connecting Line */}
                {idx < steps.length - 1 && (
                  <div
                    className={`absolute left-[19px] top-10 bottom-[-24px] w-0.5 transition-colors duration-300 ${
                      currentIdx > idx ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}

                {/* Node Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all duration-300 z-10 ${
                    isCompleted
                      ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                      : isCurrent
                      ? 'bg-card border-primary text-primary ring-4 ring-primary/15 shadow-subtle'
                      : 'bg-card border-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  ) : (
                    <Icon className="w-4 h-4 text-muted-foreground/60" />
                  )}
                </div>

                {/* Node Text */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-sm font-bold ${
                        isCurrent
                          ? 'text-primary'
                          : isCompleted
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {st.label}
                    </h3>
                    {isCurrent && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-primary/10 text-primary">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{st.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Order Snapshot Card */}
      <Card className="p-4 space-y-2 text-xs border-border/70">
        <div className="flex justify-between items-center text-muted-foreground">
          <span>{isMulti ? 'Documents' : 'Document'}</span>
          <span className="font-semibold text-foreground truncate max-w-[200px]">
            {isMulti
              ? `${currentDocs.length} Files (${currentDocs.map((d) => d.fileName).join(', ')})`
              : currentDocs[0]?.fileName}
          </span>
        </div>
        <div className="flex justify-between items-center text-muted-foreground">
          <span>Configuration</span>
          <span className="font-semibold text-foreground">
            {printSettings.copies}x · {printSettings.colorMode.toUpperCase()} · {printSettings.paperSize.toUpperCase()}
          </span>
        </div>
        <div className="flex justify-between items-center text-muted-foreground">
          <span>Payment Selected</span>
          <span className="font-semibold text-foreground capitalize">
            {paymentMethod === 'cash' ? 'Cash at Counter' : paymentMethod}
          </span>
        </div>
        <div className="flex justify-between items-center border-t border-border/60 pt-2 text-foreground font-bold text-sm">
          <span>Total Payable</span>
          <span className="text-primary tabular-nums">{formatPrice(totalAmount)}</span>
        </div>
      </Card>

      {/* Start New Order */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => {
            resetOrder();
            navigate('/customer/upload');
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card text-xs font-bold text-foreground hover:bg-muted cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Print another document
        </button>
      </div>
    </div>
  );
}
