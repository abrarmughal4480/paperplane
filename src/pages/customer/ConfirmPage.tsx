import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Printer,
  ArrowRight,
  Layers,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { useCustomerOrder } from '../../context/CustomerOrderContext';
import {
  calculatePrice,
  calculateMultiDocumentPrice,
  formatPrice,
} from '../../utils/pricing';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export function ConfirmPage() {
  const navigate = useNavigate();
  const {
    documents,
    selectedDocument,
    printSettings,
    submitOrder,
    paperTypes,
    pricingConfig,
    shopConfig,
  } = useCustomerOrder();

  const currentDocs = documents.length > 0 ? documents : (selectedDocument ? [selectedDocument] : []);
  const isMulti = currentDocs.length > 1;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentDocs.length === 0) {
      navigate('/customer/upload');
    }
  }, [currentDocs, navigate]);

  if (currentDocs.length === 0) return null;

  const multiBreakdown = calculateMultiDocumentPrice(
    currentDocs,
    printSettings,
    pricingConfig,
    paperTypes
  );

  const singleDoc = currentDocs[0];
  const singleBreakdown = calculatePrice(
    printSettings,
    singleDoc.isImage ? 1 : singleDoc.pageCount,
    pricingConfig,
    paperTypes
  );

  const handleConfirm = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    const token = await submitOrder();
    setIsSubmitting(false);
    if (!token) {
      setSubmitError(
        'Order could not reach the counter — check the shop Wi-Fi connection and try again. Your files are still staged here, nothing was lost.'
      );
      return;
    }
    navigate('/customer/token');
  };

  return (
    <div className="py-2 space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/customer/settings')}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-secondary text-sm font-semibold text-foreground hover:bg-secondary/80 shadow-sm transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Edit Settings
        </button>
      </div>

      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Confirm Print Order
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isMulti
            ? `Please review your ${currentDocs.length} documents before generating your token.`
            : 'Please review your document configuration before generating your token.'}
        </p>
      </div>

      {/* Clean Receipt Summary Card */}
      <Card className="overflow-hidden border-border shadow-elevation">
        {/* Receipt Header */}
        <div className="bg-muted/40 p-4 border-b border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                {isMulti ? `Print Order Bundle (${currentDocs.length} Files)` : 'Print Order Summary'}
              </p>
              <p className="text-[10px] text-muted-foreground">{shopConfig.name}</p>
            </div>
          </div>
        </div>

        {/* Multi-document detailed receipt rows */}
        {isMulti ? (
          <div className="p-4 space-y-3 divide-y divide-border/40 text-xs">
            {multiBreakdown.items.map((item, idx) => {
              const docSettings = item.document.settings || printSettings;
              return (
                <div key={item.document.id || idx} className="pt-3 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground flex items-center gap-1.5 truncate max-w-[200px]">
                      {item.document.isImage ? <ImageIcon className="w-3.5 h-3.5 text-blue-500" /> : <FileText className="w-3.5 h-3.5 text-primary" />}
                      #{idx + 1} {item.document.fileName}
                    </span>
                    <span className="font-bold text-foreground tabular-nums">
                      {formatPrice(item.breakdown.total)}
                    </span>
                  </div>

                  <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-2 gap-y-0.5">
                    <span>
                      {item.document.isImage
                        ? '1 Photo'
                        : `${item.breakdown.totalPages} pgs`}
                    </span>
                    <span>•</span>
                    <span>{docSettings.copies} {docSettings.copies === 1 ? 'Copy' : 'Copies'}</span>
                    <span>•</span>
                    <span>{docSettings.colorMode === 'bw' ? 'B&W' : 'Laser Color'}</span>
                    <span>•</span>
                    <span>{item.breakdown.paperName}</span>
                    {!item.document.isImage && (
                      <>
                        <span>•</span>
                        <span>{docSettings.sides === 'single' ? 'Single-Sided' : 'Double-Sided'}</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="pt-3 flex justify-between items-center text-muted-foreground">
              <span>Counter Destination</span>
              <span className="font-semibold text-foreground">{shopConfig.name}</span>
            </div>
          </div>
        ) : (
          /* Single document detailed receipt */
          <div className="p-4 divide-y divide-border/40 text-xs">
            <div className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Document Name</span>
              <span className="text-right font-bold text-foreground truncate max-w-[200px]">
                {singleDoc.fileName}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-muted-foreground">
                {singleDoc.isImage ? 'Print Format' : 'Selected Pages'}
              </span>
              <span className="text-right font-medium text-foreground">
                {singleDoc.isImage
                  ? 'Single Photo Sheet'
                  : printSettings.pageRangeType === 'all'
                  ? `All ${singleDoc.pageCount} Pages`
                  : `Pages ${printSettings.pageRangeFrom} to ${printSettings.pageRangeTo} (${singleBreakdown.totalPages} pgs)`}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Copies Count</span>
              <span className="text-right font-medium text-foreground">
                {printSettings.copies} {printSettings.copies === 1 ? 'Copy' : 'Copies'}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Print Quality</span>
              <span className="text-right font-medium text-foreground">
                {printSettings.colorMode === 'bw' ? 'Black & White Photocopy' : 'Full Laser Color'}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Paper Stock</span>
              <span className="text-right font-bold text-foreground">
                {singleBreakdown.paperName}
              </span>
            </div>
            {!singleDoc.isImage && (
              <div className="py-2.5 flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Sides Format</span>
                <span className="text-right font-medium text-foreground">
                  {printSettings.sides === 'single' ? 'Single-Sided' : 'Double-Sided (10% off)'}
                </span>
              </div>
            )}
            <div className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Shop Counter</span>
              <span className="text-right font-medium text-foreground">
                {shopConfig.name}
              </span>
            </div>
          </div>
        )}

        {/* Total Banner */}
        <div className="bg-primary/5 p-4 border-t border-primary/20 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Payable Total
            </span>
            <span className="text-xs text-muted-foreground">Cash, IBAN or Mobile at counter</span>
          </div>
          <span className="text-2xl font-bold text-primary tabular-nums">
            {formatPrice(isMulti ? multiBreakdown.grandTotal : singleBreakdown.total)}
          </span>
        </div>
      </Card>

      {/* Confirmation Actions */}
      <div className="space-y-3">
        {submitError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
            {submitError}
          </div>
        )}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleConfirm}
          isLoading={isSubmitting}
          className="gap-2 shadow-elevation py-6 text-base font-bold"
        >
          <span>{isSubmitting ? 'Sending to Counter…' : 'Confirm & Generate Token'}</span>
          <ArrowRight className="w-4 h-4" />
        </Button>

        <p className="text-[11px] text-center text-muted-foreground">
          By confirming, your order will be placed into the shop's live queue.
        </p>
      </div>
    </div>
  );
}
