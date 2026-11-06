import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  ArrowRight,
  Banknote,
  Smartphone,
  Copy,
  Check,
  Building2,
  CreditCard,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useCustomerOrder } from '../../context/CustomerOrderContext';
import { calculatePrice, calculateMultiDocumentPrice, formatPrice } from '../../utils/pricing';
import type { PaymentMethod } from '../../data/mockData';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const paymentOptions: {
  value: PaymentMethod;
  label: string;
  badge: string;
  desc: string;
  icon: React.ElementType;
}[] = [
  {
    value: 'cash',
    label: 'Cash at Counter',
    badge: 'Popular',
    desc: 'Pay cash when collecting your physical document',
    icon: Banknote,
  },
  {
    value: 'jazzcash',
    label: 'JazzCash Mobile',
    badge: 'Instant',
    desc: 'Send to shop JazzCash account or scan QR',
    icon: Smartphone,
  },
  {
    value: 'easypaisa',
    label: 'Easypaisa Mobile',
    badge: 'Instant',
    desc: 'Send to shop Easypaisa account or scan QR',
    icon: Smartphone,
  },
  {
    value: 'bank_transfer',
    label: 'Direct Bank / IBAN Transfer',
    badge: 'Raast / 1Link',
    desc: 'Interbank fund transfer directly to shop IBAN',
    icon: Building2,
  },
];

export function TokenPage() {
  const navigate = useNavigate();
  const {
    documents,
    selectedDocument,
    printSettings,
    orderToken,
    paymentMethod,
    setPaymentMethod,
    shopConfig,
    paperTypes,
    pricingConfig,
    price,
  } = useCustomerOrder();

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const currentDocs = documents.length > 0 ? documents : (selectedDocument ? [selectedDocument] : []);

  useEffect(() => {
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#0071E3', '#34C759', '#5856D6'],
      });
    } catch (e) {
      // safe fallback
    }
  }, []);

  if (currentDocs.length === 0 || !orderToken) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-sm text-muted-foreground">No active order found.</p>
        <Button variant="primary" onClick={() => navigate('/customer/upload')}>
          Start New Print Job
        </Button>
      </div>
    );
  }

  const multiBreakdown = calculateMultiDocumentPrice(
    currentDocs,
    printSettings,
    pricingConfig,
    paperTypes
  );

  const displayPrice = price > 0 ? price : multiBreakdown.grandTotal;

  const copyToClipboard = (text: string, fieldId: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  return (
    <div className="py-2 space-y-6">
      {/* Success Badge Banner */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center space-y-2 pt-2"
      >
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500/20 shadow-elevation">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Order Placed Successfully!
        </h1>
        <p className="text-xs text-muted-foreground">
          {currentDocs.length > 1
            ? `Your bundle of ${currentDocs.length} files is now in the print queue.`
            : 'Your file is now in the print queue. Please keep this token handy.'}
        </p>
      </motion.div>

      {/* Hero Token Ticket Card */}
      <Card className="relative overflow-hidden p-6 text-center bg-card border-primary/40 shadow-elevation">
        {/* Ticket punch hole notches */}
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background border border-border" />
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background border border-border" />

        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Pickup Token
          </span>
          <div className="text-5xl font-black tracking-tight text-foreground font-mono py-1">
            {orderToken}
          </div>
          <p className="text-xs text-muted-foreground">
            {shopConfig.name} • {currentDocs.length > 1 ? `${currentDocs.length} Files in Queue` : 'Counter Queue'}
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-dashed border-border flex items-center justify-between text-xs px-2">
          <span className="text-muted-foreground font-medium">Estimated Payable</span>
          <span className="text-xl font-black text-primary tabular-nums">
            {formatPrice(displayPrice)}
          </span>
        </div>
      </Card>

      {/* Payment Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider">
            Choose Payment Method
          </label>
          <span className="text-[11px] text-muted-foreground">Pay online or at counter</span>
        </div>

        <div className="space-y-2">
          {paymentOptions.map((opt) => {
            const isSelected = paymentMethod === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPaymentMethod(opt.value)}
                className={`w-full p-3.5 rounded-xl border text-left transition-all duration-150 flex items-center gap-3.5 cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary shadow-subtle'
                    : 'border-border/70 bg-card hover:bg-muted/40 text-foreground'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{opt.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-muted text-muted-foreground">
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {opt.desc}
                  </p>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-primary' : 'border-muted-foreground/30'
                  }`}
                >
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Shop Account / IBAN Card with 1-Click Copy */}
        <AnimatePresence mode="wait">
          {paymentMethod === 'bank_transfer' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 rounded-2xl bg-card border border-border shadow-elevation space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">
                    Shop Bank Account (Raast / IBAN)
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Bank Name</span>
                  <span className="font-bold text-foreground">{shopConfig.bankName}</span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Account Title</span>
                  <span className="font-bold text-foreground">{shopConfig.accountTitle}</span>
                </div>

                {/* IBAN Box with Copy Button */}
                <div className="pt-1">
                  <span className="text-muted-foreground block text-[11px] mb-1 font-semibold">
                    IBAN / Raast ID
                  </span>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/60 border border-border">
                    <span className="font-mono text-xs font-bold text-foreground flex-1 break-all">
                      {shopConfig.iban}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(shopConfig.iban, 'iban')}
                      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-[11px] flex items-center gap-1 shrink-0 active:scale-95 transition-transform cursor-pointer"
                    >
                      {copiedField === 'iban' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {paymentMethod === 'jazzcash' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 rounded-2xl bg-card border border-border shadow-elevation space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-primary" />
                  Shop JazzCash Account
                </span>
                <span className="text-[10px] text-primary font-bold">JazzCash Mobile</span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Account Title</span>
                  <span className="font-bold text-foreground">{shopConfig.jazzCashTitle}</span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px] mb-1 font-semibold">
                    JazzCash Mobile Number
                  </span>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/60 border border-border">
                    <span className="font-mono text-sm font-bold text-foreground flex-1">
                      {shopConfig.jazzCashNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(shopConfig.jazzCashNumber, 'jazz')}
                      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-[11px] flex items-center gap-1 shrink-0 active:scale-95 transition-transform cursor-pointer"
                    >
                      {copiedField === 'jazz' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {paymentMethod === 'easypaisa' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 rounded-2xl bg-card border border-border shadow-elevation space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  Shop Easypaisa Account
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  Easypaisa Mobile
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Account Title</span>
                  <span className="font-bold text-foreground">{shopConfig.easypaisaTitle}</span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px] mb-1 font-semibold">
                    Easypaisa Mobile Number
                  </span>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/60 border border-border">
                    <span className="font-mono text-sm font-bold text-foreground flex-1">
                      {shopConfig.easypaisaNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(shopConfig.easypaisaNumber, 'easy')}
                      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-[11px] flex items-center gap-1 shrink-0 active:scale-95 transition-transform cursor-pointer"
                    >
                      {copiedField === 'easy' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CTA to Live Status */}
      <div className="space-y-2 pt-2">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => navigate('/customer/status')}
          className="gap-2 shadow-elevation py-5 font-bold"
        >
          <span>Track Live Order Status</span>
          <ArrowRight className="w-4 h-4" />
        </Button>

        <p className="text-[11px] text-center text-muted-foreground">
          Show this token number to the counter staff when collecting your documents.
        </p>
      </div>
    </div>
  );
}
