import React, { useState } from 'react';
import {
  DollarSign,
  Save,
  RotateCcw,
  Sparkles,
  Calculator,
  ArrowRight,
  Info,
  Plus,
  Trash2,
  Layers,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import { type PricingConfig, defaultPricing, type PaperType } from '../../data/mockData';
import { calculatePrice, formatPrice, pricingScenarios } from '../../utils/pricing';
import { useCustomerOrder } from '../../context/CustomerOrderContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Stepper } from '../../components/ui/Stepper';
import { SegmentedControl } from '../../components/ui/SegmentedControl';

export default function PricingPage() {
  const {
    pricingConfig,
    updatePricingConfig,
    paperTypes,
    addPaperType,
    updatePaperType,
    deletePaperType,
  } = useCustomerOrder();

  const [pricing, setPricing] = useState<PricingConfig>(pricingConfig);
  const [toast, setToast] = useState<string | null>(null);

  // New paper modal/inline form state
  const [isAddingPaper, setIsAddingPaper] = useState(false);
  const [newPaperName, setNewPaperName] = useState('');
  const [newPaperDesc, setNewPaperDesc] = useState('');
  const [newPaperBwPrice, setNewPaperBwPrice] = useState(8);
  const [newPaperColorPrice, setNewPaperColorPrice] = useState(30);

  // Preview simulator state
  const [prevCopies, setPrevCopies] = useState(1);
  const [prevPages, setPrevPages] = useState(8);
  const [prevColor, setPrevColor] = useState<'bw' | 'color'>('bw');
  const [prevSides, setPrevSides] = useState<'single' | 'double'>('double');
  const [prevPaper, setPrevPaper] = useState<string>(paperTypes[0]?.id || 'a4_70');

  const update = (field: keyof PricingConfig, val: number) => {
    setPricing((prev) => ({ ...prev, [field]: val }));
  };

  const previewPrice = calculatePrice(
    {
      copies: prevCopies,
      colorMode: prevColor,
      sides: prevSides,
      paperSize: prevPaper,
      pageRangeType: 'all',
      pageRangeFrom: 1,
      pageRangeTo: prevPages,
    },
    prevPages,
    pricing,
    paperTypes
  );

  const handleSave = async () => {
    updatePricingConfig(pricing);

    // Dynamic sync to SQLite backend — toast only what actually happened.
    try {
      const res = await fetch('/api/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricing),
      });
      if (!res.ok) throw new Error(`Server replied ${res.status}`);
      setToast('Pricing matrix saved and broadcasted to counter!');
    } catch {
      setToast('Saved on this device only — server not reachable, counter phones will not see the new rates yet.');
    }
    setTimeout(() => setToast(null), 4000);
  };

  const handleAddPaper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaperName.trim()) return;

    const paperData = {
      name: newPaperName.trim(),
      description: newPaperDesc.trim() || 'Custom paper stock',
      bwPrice: Number(newPaperBwPrice) || 5,
      colorPrice: Number(newPaperColorPrice) || 25,
    };

    addPaperType(paperData);

    // Dynamic sync to SQLite backend
    try {
      fetch('/api/paper-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: paperData.name,
          bw_price: paperData.bwPrice,
          color_price: paperData.colorPrice,
          is_active: 1,
        }),
      }).catch(() => {});
    } catch {
      // safe fallback
    }

    setNewPaperName('');
    setNewPaperDesc('');
    setIsAddingPaper(false);
    setToast(`New paper type "${newPaperName}" added successfully!`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Shop Pricing & Paper Stock Manager
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure per-page rates in PKR and add custom paper stock formats for your shop.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={handleSave} className="gap-1.5 shadow-sm">
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </Button>
      </div>

      {/* Grid: Left Paper Stocks & Rates, Right Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-5">
          {/* Section: Custom Paper Types Manager */}
          <Card className="p-5 space-y-4 border-border/80 shadow-subtle">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Available Paper Stocks ({paperTypes.length})
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Add, edit, or customize paper types shown to counter customers
                </p>
              </div>

              <Button
                variant="subtle"
                size="sm"
                onClick={() => setIsAddingPaper(!isAddingPaper)}
                className="gap-1 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Paper</span>
              </Button>
            </div>

            {/* Inline Add Paper Form */}
            {isAddingPaper && (
              <form
                onSubmit={handleAddPaper}
                className="p-4 rounded-xl bg-muted/40 border border-primary/30 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Add New Paper Stock</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingPaper(false)}
                    className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Paper Stock Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. A3 Large Bond, Ivory Certificate 220gsm"
                      value={newPaperName}
                      onChange={(e) => setNewPaperName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-card border border-border text-foreground focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Description / Weight
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Thick cardstock for certificates & covers"
                      value={newPaperDesc}
                      onChange={(e) => setNewPaperDesc(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-card border border-border text-foreground focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        B&W Rate (Rs/pg)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={newPaperBwPrice}
                        onChange={(e) => setNewPaperBwPrice(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg bg-card border border-border text-foreground font-bold focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Color Rate (Rs/pg)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={newPaperColorPrice}
                        onChange={(e) => setNewPaperColorPrice(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg bg-card border border-border text-foreground font-bold focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingPaper(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Create Stock
                  </Button>
                </div>
              </form>
            )}

            {/* Paper Stocks List */}
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {paperTypes.map((paper) => (
                <div
                  key={paper.id}
                  className="p-3 rounded-xl bg-card border border-border/80 flex items-center justify-between gap-3 shadow-subtle"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground truncate">
                        {paper.name}
                      </span>
                      {paper.isDefault && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-primary/10 text-primary">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {paper.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right text-xs">
                      <div className="font-bold text-foreground tabular-nums">
                        Rs. {paper.bwPrice} <span className="text-[10px] text-muted-foreground font-normal">B&W</span>
                      </div>
                      <div className="font-bold text-primary tabular-nums text-[11px]">
                        Rs. {paper.colorPrice} <span className="text-[10px] text-muted-foreground font-normal">Color</span>
                      </div>
                    </div>

                    {!paper.isDefault && (
                      <button
                        type="button"
                        onClick={() => deletePaperType(paper.id)}
                        className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete stock"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Section: Surcharges & Discounts */}
          <Card className="p-5 space-y-4 border-border/80 shadow-subtle">
            <h3 className="text-sm font-bold text-foreground">Discount & Minimum Thresholds</h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground block">Double-Sided Discount</span>
                  <span className="text-[10px] text-muted-foreground">Discount applied to back-to-back prints</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={pricing.doubleSidedDiscount}
                    onChange={(e) => update('doubleSidedDiscount', Number(e.target.value))}
                    className="w-16 px-2.5 py-1.5 text-center text-xs font-bold rounded-lg bg-muted/60 border border-border text-foreground focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-xs font-bold text-muted-foreground">%</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border/40 pt-3">
                <div>
                  <span className="font-semibold text-foreground block">Minimum Order Charge</span>
                  <span className="text-[10px] text-muted-foreground">Counter base fee floor</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground font-semibold">Rs.</span>
                  <input
                    type="number"
                    value={pricing.minimumCharge}
                    onChange={(e) => update('minimumCharge', Number(e.target.value))}
                    className="w-16 px-2.5 py-1.5 text-center text-xs font-bold rounded-lg bg-muted/60 border border-border text-foreground focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Live Interactive Tester */}
        <div className="space-y-5">
          <Card className="p-5 space-y-4 bg-card border-border shadow-elevation">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Interactive Price Tester</h3>
                  <p className="text-[11px] text-muted-foreground">Test customer calculation with new paper stocks</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-primary px-2.5 py-1 rounded-full bg-primary/10">
                Live Simulator
              </span>
            </div>

            {/* Test Controls */}
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Page Count</span>
                <Stepper value={prevPages} onChange={setPrevPages} min={1} max={100} size="sm" />
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Copies</span>
                <Stepper value={prevCopies} onChange={setPrevCopies} min={1} max={50} size="sm" />
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-foreground block">Paper Stock Format</span>
                <select
                  value={prevPaper}
                  onChange={(e) => setPrevPaper(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-foreground font-semibold text-xs focus:ring-2 focus:ring-primary"
                >
                  {paperTypes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (B&W: Rs.{p.bwPrice} / Color: Rs.{p.colorPrice})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-foreground block">Color Mode</span>
                <SegmentedControl<'bw' | 'color'>
                  id="pricing-color"
                  options={[
                    { label: 'Black & White', value: 'bw' },
                    { label: 'Color Laser', value: 'color' },
                  ]}
                  value={prevColor}
                  onChange={setPrevColor}
                />
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-foreground block">Sides</span>
                <SegmentedControl<'single' | 'double'>
                  id="pricing-sides"
                  options={[
                    { label: 'Single-Sided', value: 'single' },
                    { label: 'Double-Sided', value: 'double' },
                  ]}
                  value={prevSides}
                  onChange={setPrevSides}
                />
              </div>
            </div>

            {/* Simulated Output Card */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between shadow-subtle">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Customer Pays
                </span>
                <span className="text-xs text-muted-foreground">
                  {prevPages} pgs × {prevCopies} copies ({prevColor.toUpperCase()})
                </span>
              </div>
              <span className="text-3xl font-black text-primary tabular-nums">
                {formatPrice(previewPrice.total)}
              </span>
            </div>

            {/* Benchmark Scenarios */}
            <div className="pt-2 border-t border-border/60 space-y-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Standard Benchmark Scenarios
              </span>
              <div className="space-y-1.5 text-xs">
                {pricingScenarios.map((sc, i) => {
                  const res = calculatePrice(
                    {
                      copies: sc.copies,
                      colorMode: sc.colorMode,
                      sides: sc.sides,
                      paperSize: sc.paperSize,
                      pageRangeType: 'all',
                      pageRangeFrom: 1,
                      pageRangeTo: sc.pages,
                    },
                    sc.pages,
                    pricing,
                    paperTypes
                  );
                  return (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-between text-muted-foreground"
                    >
                      <span className="font-medium">{sc.label}</span>
                      <strong className="text-foreground tabular-nums font-bold">
                        {formatPrice(res.total)}
                      </strong>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-floating animate-bounce">
          {toast}
        </div>
      )}
    </div>
  );
}
