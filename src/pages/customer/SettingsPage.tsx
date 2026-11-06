import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ArrowRight,
  FileText,
  Layers,
  Check,
  Image as ImageIcon,
  Sliders,
} from 'lucide-react';
import { useCustomerOrder } from '../../context/CustomerOrderContext';
import {
  calculatePrice,
  calculateMultiDocumentPrice,
  formatPrice,
} from '../../utils/pricing';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Stepper } from '../../components/ui/Stepper';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import type { ColorMode, Sides } from '../../data/mockData';

export function SettingsPage() {
  const navigate = useNavigate();
  const {
    documents,
    activeDocIndex,
    setActiveDocIndex,
    selectedDocument,
    printSettings,
    updateSettings,
    updateDocSettings,
    paperTypes,
    pricingConfig,
  } = useCustomerOrder();

  const currentDocs = documents.length > 0 ? documents : (selectedDocument ? [selectedDocument] : []);
  const activeDoc = currentDocs[activeDocIndex] || currentDocs[0];

  useEffect(() => {
    if (!activeDoc) {
      navigate('/customer/upload');
    }
  }, [activeDoc, navigate]);

  if (!activeDoc) return null;

  const isMulti = currentDocs.length > 1;
  const isImageDoc = activeDoc.isImage;
  const pageCount = isImageDoc ? 1 : activeDoc.pageCount;

  // Active settings for current document
  const effectiveSettings = activeDoc.settings || printSettings;

  // Multi-document consolidated price breakdown
  const multiBreakdown = calculateMultiDocumentPrice(
    currentDocs,
    printSettings,
    pricingConfig,
    paperTypes
  );

  const activeSingleBreakdown = calculatePrice(
    effectiveSettings,
    pageCount,
    pricingConfig,
    paperTypes
  );

  return (
    <div className="py-2 space-y-6">
      {/* Top Header */}
      <div>
        <button
          onClick={() => navigate('/customer/preview')}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-secondary text-sm font-semibold text-foreground hover:bg-secondary/80 shadow-sm transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Preview
        </button>
      </div>

      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Print Configuration
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isMulti
            ? `Configure settings for each file or apply across the entire bundle.`
            : 'Select copies, paper stock and color mode. Price updates live.'}
        </p>
      </div>

      {/* Multi-document File Tabs Switcher */}
      {isMulti && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs px-1 font-bold text-muted-foreground">
            <span>Configuring File {activeDocIndex + 1} of {currentDocs.length}</span>
            <span className="text-primary font-mono">{activeDoc.fileName}</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {currentDocs.map((doc, idx) => {
              const isActive = idx === activeDocIndex;
              return (
                <button
                  key={doc.id || idx}
                  type="button"
                  onClick={() => setActiveDocIndex(idx)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border cursor-pointer shrink-0 ${
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground shadow-subtle ring-2 ring-primary/20'
                      : 'border-border/80 bg-card text-foreground hover:bg-muted/60'
                  }`}
                >
                  <span>#{idx + 1} {doc.fileName}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {doc.isImage ? 'Photo' : `${doc.pageCount}p`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Options Stack */}
      <div className="space-y-4">
        {/* Copies Counter */}
        <Card className="p-4 flex items-center justify-between">
          <div>
            <label className="text-sm font-bold text-foreground block">
              Copies
            </label>
            <span className="text-xs text-muted-foreground">
              Number of identical sets {isMulti && `for this file`}
            </span>
          </div>
          <Stepper
            value={effectiveSettings.copies}
            onChange={(val) => {
              updateSettings({ copies: val });
              updateDocSettings(activeDocIndex, { copies: val });
            }}
            min={1}
            max={100}
            size="md"
          />
        </Card>

        {/* Color Mode */}
        <Card className="p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-foreground block">
              Color Mode
            </label>
            <span className="text-xs text-muted-foreground">
              {effectiveSettings.colorMode === 'bw' ? 'Black & White' : 'Laser Color'}
            </span>
          </div>
          <SegmentedControl<ColorMode>
            id="color-mode"
            options={[
              { label: 'Black & White', value: 'bw' },
              { label: 'Color Laser', value: 'color' },
            ]}
            value={effectiveSettings.colorMode}
            onChange={(val) => {
              updateSettings({ colorMode: val });
              updateDocSettings(activeDocIndex, { colorMode: val });
            }}
          />
        </Card>

        {/* Sides Mode (Only for multi-page documents) */}
        {!isImageDoc && (
          <Card className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-foreground block">
                Printing Sides
              </label>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                10% Double-Sided Discount
              </span>
            </div>
            <SegmentedControl<Sides>
              id="sides-mode"
              options={[
                { label: 'Single-Sided', value: 'single' },
                { label: 'Double-Sided', value: 'double' },
              ]}
              value={effectiveSettings.sides}
              onChange={(val) => {
                updateSettings({ sides: val });
                updateDocSettings(activeDocIndex, { sides: val });
              }}
            />
          </Card>
        )}

        {/* Dynamic Paper Types Selector */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-bold text-foreground block">
                Paper Stock & Size
              </label>
              <span className="text-xs text-muted-foreground">
                Select from shop's available paper types
              </span>
            </div>
            <Layers className="w-4 h-4 text-primary" />
          </div>

          <div className="space-y-2">
            {paperTypes.map((paper) => {
              const isSelected = effectiveSettings.paperSize === paper.id;
              const rate = effectiveSettings.colorMode === 'bw' ? paper.bwPrice : paper.colorPrice;
              return (
                <button
                  key={paper.id}
                  type="button"
                  onClick={() => {
                    updateSettings({ paperSize: paper.id });
                    updateDocSettings(activeDocIndex, { paperSize: paper.id });
                  }}
                  className={`w-full p-3 rounded-xl border text-left transition-all duration-150 flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary shadow-subtle'
                      : 'border-border/70 bg-card hover:bg-muted/40 text-foreground'
                  }`}
                >
                  <div className="space-y-0.5 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">{paper.name}</span>
                      {paper.isDefault && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-muted text-muted-foreground">
                          Standard
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">
                      {paper.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-foreground tabular-nums">
                      Rs. {rate}/pg
                    </span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-primary bg-primary text-white' : 'border-muted-foreground/30'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Page Range (Only for multi-page documents) */}
        {!isImageDoc && pageCount > 1 && (
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-foreground block">
                Page Range
              </label>
              <span className="text-xs text-muted-foreground">
                Total {pageCount} Pages
              </span>
            </div>

            <SegmentedControl<'all' | 'custom'>
              id="page-range"
              options={[
                { label: `All Pages (1–${pageCount})`, value: 'all' },
                { label: 'Custom Range', value: 'custom' },
              ]}
              value={effectiveSettings.pageRangeType}
              onChange={(val) => {
                const patch = {
                  pageRangeType: val,
                  pageRangeFrom: 1,
                  pageRangeTo: pageCount,
                };
                updateSettings(patch);
                updateDocSettings(activeDocIndex, patch);
              }}
            />

            {effectiveSettings.pageRangeType === 'custom' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-3 pt-2"
              >
                <div className="flex-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    From Page
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={pageCount}
                    value={effectiveSettings.pageRangeFrom}
                    onChange={(e) => {
                      const from = Math.max(1, Math.min(pageCount, parseInt(e.target.value) || 1));
                      updateSettings({ pageRangeFrom: from });
                      updateDocSettings(activeDocIndex, { pageRangeFrom: from });
                    }}
                    className="w-full px-3 py-2 text-sm font-semibold rounded-xl bg-muted/60 border border-border text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <span className="text-muted-foreground text-sm font-bold pt-4">—</span>

                <div className="flex-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    To Page
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={pageCount}
                    value={effectiveSettings.pageRangeTo}
                    onChange={(e) => {
                      const to = Math.max(1, Math.min(pageCount, parseInt(e.target.value) || 1));
                      updateSettings({ pageRangeTo: to });
                      updateDocSettings(activeDocIndex, { pageRangeTo: to });
                    }}
                    className="w-full px-3 py-2 text-sm font-semibold rounded-xl bg-muted/60 border border-border text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </motion.div>
            )}
          </Card>
        )}
      </div>

      {/* Prominent Live Price Breakdown Card */}
      <Card className="p-5 bg-card border-primary/30 shadow-elevation space-y-3">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              {isMulti ? 'Combined Order Total' : 'Estimated Total'}
            </span>
            <span className="text-3xl font-black tracking-tight text-primary tabular-nums">
              {formatPrice(multiBreakdown.grandTotal)}
            </span>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
            {isMulti ? `${currentDocs.length} Documents` : 'Live Quote'}
          </span>
        </div>

        {/* Multi-document breakdown items */}
        {isMulti ? (
          <div className="space-y-2 text-xs divide-y divide-border/40">
            {multiBreakdown.items.map((item, idx) => (
              <div key={item.document.id || idx} className="pt-2 first:pt-0 flex justify-between items-center text-muted-foreground">
                <div className="min-w-0 pr-2">
                  <span className="font-semibold text-foreground truncate block max-w-[180px]">
                    #{idx + 1} {item.document.fileName}
                  </span>
                  <span className="text-[10px]">
                    {item.document.isImage
                      ? `1 photo × ${item.breakdown.totalPages * (item.document.settings?.copies || printSettings.copies)}`
                      : `${item.breakdown.totalPages} pgs × ${item.document.settings?.copies || printSettings.copies} copies`}
                    {' · '}{item.breakdown.paperName}
                  </span>
                </div>
                <span className="font-bold text-foreground tabular-nums shrink-0">
                  {formatPrice(item.breakdown.total)}
                </span>
              </div>
            ))}

            <div className="pt-2 flex justify-between text-muted-foreground text-xs font-semibold">
              <span>Combined Total ({multiBreakdown.totalSheets} sheets)</span>
              <span className="text-primary font-bold">{formatPrice(multiBreakdown.grandTotal)}</span>
            </div>
          </div>
        ) : (
          /* Single document breakdown */
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>
                {activeDoc.isImage
                  ? `1 photo × ${effectiveSettings.copies} ${effectiveSettings.copies === 1 ? 'copy' : 'copies'}`
                  : `${activeSingleBreakdown.totalPages} pgs × ${effectiveSettings.copies} ${
                      effectiveSettings.copies === 1 ? 'copy' : 'copies'
                    }`}{' '}
                ({effectiveSettings.colorMode.toUpperCase()})
              </span>
              <span className="font-semibold text-foreground tabular-nums">
                {formatPrice(activeSingleBreakdown.pricePerPage * activeSingleBreakdown.totalPages * effectiveSettings.copies)}
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>Selected Stock</span>
              <span className="font-semibold text-foreground">
                {activeSingleBreakdown.paperName}
                {!activeDoc.isImage &&
                  ` · ${effectiveSettings.sides === 'single' ? 'Single-Sided' : 'Double-Sided'}`}
              </span>
            </div>

            {!activeDoc.isImage && activeSingleBreakdown.doubleSidedDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Double-Sided Discount (10%)</span>
                <span className="tabular-nums">-{formatPrice(activeSingleBreakdown.doubleSidedDiscount)}</span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Primary CTA */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={() => navigate('/customer/confirm')}
        className="gap-2 shadow-elevation py-5 font-bold"
      >
        <span>Review Order Summary</span>
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
