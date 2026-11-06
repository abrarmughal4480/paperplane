import React, { useState, useEffect } from 'react';
import {
  Store,
  Sliders,
  ShieldCheck,
  Save,
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  Building2,
  Smartphone,
  CreditCard,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Wifi,
} from 'lucide-react';
import { defaultShopConfig, type ShopConfig, getSavedShopConfig, saveShopConfig } from '../../data/mockData';
import { useCustomerOrder } from '../../context/CustomerOrderContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function SettingsPage() {
  const { shopConfig, updateShopConfig } = useCustomerOrder();
  const [config, setConfig] = useState<ShopConfig>(shopConfig);
  const [toast, setToast] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [netInfo, setNetInfo] = useState<{
    lanIp: string;
    port: number;
    customerUrl: string;
    qrCodeDataUrl: string;
  } | null>(null);

  useEffect(() => {
    setConfig(shopConfig);
  }, [shopConfig]);

  useEffect(() => {
    fetch('/api/network-info')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setNetInfo(data);
      })
      .catch(() => {});
  }, []);

  const update = <K extends keyof ShopConfig>(key: K, val: ShopConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
  };

  const handleCopyLink = () => {
    const url = netInfo?.customerUrl || `http://${netInfo?.lanIp || '10.116.63.104'}:5000/customer/upload`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Save shop details: local first (this browser), then the server.
  // The old code fired the PUT without awaiting it and always showed
  // "updated successfully" — even with the server down, when the
  // customer phone would never see the change. Now the message tells
  // the truth: green only when the server confirms, amber when it was
  // saved on this device only.
  const handleSave = async () => {
    setSaveError(null);
    setIsSaving(true);
    updateShopConfig(config);
    saveShopConfig(config);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_name: config.name,
          phone: config.phone,
          address: config.address,
          counter_name: config.counterName || 'Counter 1',
          bank_name: config.bankName,
          bank_title: config.accountTitle,
          bank_iban: config.iban,
          jazzcash_title: config.jazzCashTitle,
          jazzcash_number: config.jazzCashNumber,
          easypaisa_title: config.easypaisaTitle,
          easypaisa_number: config.easypaisaNumber,
        }),
      });
      if (!res.ok) throw new Error(`Server replied ${res.status}`);
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    } catch {
      setSaveError(
        'Saved on this device only — the server could not be reached, so customer phones will not see the new details yet. Start the server (npm run server) and press Save again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Shop & Station Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure shop profile details, banking IBAN for customer payments and retention policies.
            These details show on the customer phone (navbar, token screen, rates) — edit here, press Save, and they update everywhere.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving…' : 'Save Changes'}</span>
        </Button>
      </div>

      {/* Honest save feedback: green only when the server confirms */}
      {saveError && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-medium">
          {saveError}
        </div>
      )}

      <div className="space-y-6">
        {/* Section 0: Local Wi-Fi Network & Counter QR Card */}
        <Card className="p-6 space-y-4 border-primary/25 bg-gradient-to-br from-primary/5 via-transparent to-transparent shadow-subtle">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Wifi className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Local Wi-Fi Network & Counter Standee</h3>
                <p className="text-[11px] text-muted-foreground">Direct LAN hotspot link for customer mobile phone upload</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Live Wi-Fi IP
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5 text-xs">
            {/* Crisp High-Res QR Thumbnail */}
            <div className="p-3 bg-white rounded-2xl border-2 border-border shadow-xs shrink-0">
              {netInfo?.qrCodeDataUrl ? (
                <img
                  src={netInfo.qrCodeDataUrl}
                  alt="Counter QR Code"
                  className="w-32 h-32 object-contain"
                />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center bg-zinc-50 rounded-lg">
                  <QrCode className="w-8 h-8 text-muted-foreground animate-pulse" />
                </div>
              )}
            </div>

            <div className="space-y-3 flex-1 w-full">
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground block text-[11px]">
                  Local Network Address (Customer Link)
                </label>
                <div className="p-2.5 rounded-xl bg-card border border-border flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-primary text-xs break-all">
                    {netInfo?.customerUrl || `http://${netInfo?.lanIp || '10.116.63.104'}:5000/customer/upload`}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-colors cursor-pointer"
                    title="Copy URL"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-1.5 px-3 rounded-xl border border-border text-foreground hover:bg-muted text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Wi-Fi URL'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-1.5 px-3 rounded-xl border border-border text-foreground hover:bg-muted text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-primary" />
                  <span>Print Standee</span>
                </button>

                <a
                  href={netInfo?.customerUrl || `http://${netInfo?.lanIp || '10.116.63.104'}:5000/customer/upload`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-1.5 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 flex items-center gap-1.5 shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Test Mobile Portal</span>
                </a>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 1: Shop Information */}
        <Card className="p-6 space-y-4 border-border/80 shadow-subtle">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
            <Store className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Shop Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-foreground">Shop Name</label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => update('name', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-foreground">Physical Address</label>
              <input
                type="text"
                value={config.address}
                onChange={(e) => update('address', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Contact Phone</label>
              <input
                type="text"
                value={config.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Business Hours</label>
              <input
                type="text"
                value={config.openingHours}
                onChange={(e) => update('openingHours', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Online Payment Accounts & IBAN */}
        <Card className="p-6 space-y-5 border-border/80 shadow-subtle">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-primary" />
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Online Banking & Digital Payment Accounts
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Displayed on the customer mobile token screen with a 1-click copy button
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Customer Visible
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Bank Transfer / IBAN */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-3">
              <div className="flex items-center gap-2 text-foreground font-bold">
                <CreditCard className="w-4 h-4 text-primary" />
                <span>Bank Transfer (1Link / Raast / IBAN)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Bank Name</label>
                  <input
                    type="text"
                    value={config.bankName}
                    placeholder="e.g. Meezan Bank, HBL, Bank Alfalah"
                    onChange={(e) => update('bankName', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Account Title</label>
                  <input
                    type="text"
                    value={config.accountTitle}
                    placeholder="e.g. Al-Noor Printing Services"
                    onChange={(e) => update('accountTitle', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-muted-foreground">
                    IBAN / Raast Account Number (24 characters)
                  </label>
                  <input
                    type="text"
                    value={config.iban}
                    placeholder="e.g. PK36MEZN0001234567890123"
                    onChange={(e) => update('iban', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground font-mono focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* JazzCash & Easypaisa Mobile Accounts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* JazzCash */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-3">
                <div className="flex items-center gap-2 text-foreground font-bold">
                  <Smartphone className="w-4 h-4 text-primary" />
                  <span>JazzCash Account</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Account Title
                    </label>
                    <input
                      type="text"
                      value={config.jazzCashTitle}
                      onChange={(e) => update('jazzCashTitle', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      value={config.jazzCashNumber}
                      onChange={(e) => update('jazzCashNumber', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground font-mono focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Easypaisa */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-3">
                <div className="flex items-center gap-2 text-foreground font-bold">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span>Easypaisa Account</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Account Title
                    </label>
                    <input
                      type="text"
                      value={config.easypaisaTitle}
                      onChange={(e) => update('easypaisaTitle', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      value={config.easypaisaNumber}
                      onChange={(e) => update('easypaisaNumber', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground font-mono focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 3: Customer Experience Toggles */}
        <Card className="p-6 space-y-4 border-border/80 shadow-subtle">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
            <Sliders className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Customer Experience Configuration</h3>
          </div>

          <div className="divide-y divide-border/50 text-xs">
            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-foreground block">Customer Name Mandatory</span>
                <span className="text-muted-foreground text-[11px]">
                  Requires customer to type name before file upload
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.requireCustomerName}
                onChange={(e) => update('requireCustomerName', e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-foreground block">Show Estimated Completion Time</span>
                <span className="text-muted-foreground text-[11px]">
                  Display calculated wait time on customer mobile tracker
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.showEstimatedTime}
                onChange={(e) => update('showEstimatedTime', e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-foreground block">Enable Digital Payment Options</span>
                <span className="text-muted-foreground text-[11px]">
                  Allow customers to choose Bank Transfer / IBAN, JazzCash & Easypaisa
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.showPaymentOptions}
                onChange={(e) => update('showPaymentOptions', e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
            </div>
          </div>
        </Card>

        {/* Section 4: Privacy & Document Shredding Policy */}
        <Card className="p-6 space-y-4 border-border/80 shadow-subtle">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-foreground">Security & Document Shredding Policy</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-foreground block">Automatic Document Deletion</span>
                <span className="text-muted-foreground text-[11px]">
                  Protects student & customer confidentiality
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Active & Enforced
              </span>
            </div>

            <div className="pt-2">
              <label className="font-semibold text-foreground block mb-1">
                Data Retention Lifetime
              </label>
              <select
                value={config.retentionPeriod}
                onChange={(e) => update('retentionPeriod', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground text-xs"
              >
                <option value="After printing">Immediate (Delete right after spooling)</option>
                <option value="End of day">End of Day (Purge at midnight)</option>
                <option value="24 hours">24 Hours retention</option>
              </select>
            </div>
          </div>
        </Card>
      </div>

      {/* Save Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-floating animate-bounce">
          Shop settings & payment IBAN accounts updated successfully!
        </div>
      )}
    </div>
  );
}
