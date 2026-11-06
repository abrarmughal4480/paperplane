import React from 'react';
import { Sparkles } from 'lucide-react';
import { useCustomerOrder } from '../../context/CustomerOrderContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface RatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RatesModal({ isOpen, onClose }: RatesModalProps) {
  const { paperTypes, shopConfig, pricingConfig } = useCustomerOrder();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Shop Printing & Paper Rates"
      subtitle={shopConfig.name}
      footer={
        <Button variant="primary" fullWidth onClick={onClose}>
          Got It
        </Button>
      }
    >
      <div className="p-5 space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            <span>Paper Stocks</span>
            <span>Rates (PKR)</span>
          </div>

          <div className="space-y-2">
            {paperTypes.map((paper) => (
              <div
                key={paper.id}
                className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="font-bold text-foreground truncate">{paper.name}</div>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">
                    {paper.description}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-bold text-foreground tabular-nums">
                    Rs. {paper.bwPrice} <span className="text-[10px] text-muted-foreground font-normal">B&amp;W</span>
                  </div>
                  <div className="font-bold text-primary tabular-nums text-[11px]">
                    Rs. {paper.colorPrice} <span className="text-[10px] text-muted-foreground font-normal">Color</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Special Discounts Banner */}
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
          <Sparkles className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>
            {pricingConfig.doubleSidedDiscount}% discount automatically applied for back-to-back (double-sided) prints!
          </span>
        </div>
      </div>
    </Modal>
  );
}
