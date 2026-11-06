import React, { useState } from 'react';
import {
  Printer,
  Save,
  Trash2,
  FileText,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import type { Order, ColorMode, Sides, DocumentInfo } from '../../data/mockData';
import { calculatePrice, formatPrice } from '../../utils/pricing';
import { useCustomerOrder } from '../../context/CustomerOrderContext';
import { Button } from '../../components/ui/Button';
import { Stepper } from '../../components/ui/Stepper';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { StatusBadge } from '../../components/ui/Badge';
import { UniversalFilePreview } from '../../components/customer/UniversalFilePreview';
import { Modal } from '../../components/ui/Modal';

interface JobDetailModalProps {
  order: Order;
  onClose: () => void;
  onSave: (updated: Order) => void;
  onPrint: (order: Order) => void;
  onCancel: (order: Order) => void;
}

export default function JobDetailModal({
  order,
  onClose,
  onSave,
  onPrint,
  onCancel,
}: JobDetailModalProps) {
  const { paperTypes } = useCustomerOrder();

  const allDocs: DocumentInfo[] =
    order.documents && order.documents.length > 0 ? order.documents : [order.document];
  const [selectedDocIdx, setSelectedDocIdx] = useState(0);
  const activeDoc = allDocs[selectedDocIdx] || allDocs[0];

  const [copies, setCopies] = useState(order.settings.copies);
  const [colorMode, setColorMode] = useState<ColorMode>(order.settings.colorMode);
  const [sides, setSides] = useState<Sides>(order.settings.sides);
  const [paperSize, setPaperSize] = useState<string>(
    order.settings.paperSize || paperTypes[0]?.id || 'a4_70'
  );
  const [pageRangeType, setPageRangeType] = useState(order.settings.pageRangeType);
  const [pageFrom, setPageFrom] = useState(order.settings.pageRangeFrom);
  const [pageTo, setPageTo] = useState(order.settings.pageRangeTo);

  const settings = {
    copies,
    colorMode,
    sides,
    paperSize,
    pageRangeType,
    pageRangeFrom: pageFrom,
    pageRangeTo: pageTo,
  };

  const priceResult = calculatePrice(
    settings,
    activeDoc.isImage ? 1 : activeDoc.pageCount,
    undefined,
    paperTypes
  );

  const handleSave = () => {
    const updated: Order = {
      ...order,
      settings,
      price: priceResult.total,
      updatedAt: new Date(),
    };
    onSave(updated);
  };

  const fileSummary =
    allDocs.length > 1
      ? `${allDocs.length} Documents Bundle`
      : `${activeDoc.fileName} • ${activeDoc.isImage ? '1 Photo' : `${activeDoc.pageCount} pgs`} • ${activeDoc.fileSize}`;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`${order.token} — ${order.customerName}`}
      subtitle={fileSummary}
      maxWidth="max-w-4xl"
      footer={
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCancel(order)}
            className="text-red-600 hover:text-red-700 hover:bg-red-500/10 gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Cancel Job</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} className="gap-1.5">
              <span>Close</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={handleSave} className="gap-1.5">
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => onPrint(order)}
              className="gap-1.5 shadow-sm font-bold"
            >
              <Printer className="w-4 h-4" />
              <span>Send to Printer</span>
            </Button>
          </div>
        </div>
      }
    >
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Authentic Universal File Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Live File Inspection
            </span>
            <span className="flex items-center gap-2">
              <StatusBadge status={order.status} />
              <span className="text-xs font-semibold text-primary">
                {activeDoc.fileType}
              </span>
            </span>
          </div>

          {/* If multiple files in order, show switcher */}
          {allDocs.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {allDocs.map((d, i) => (
                <button
                  key={d.id || i}
                  type="button"
                  onClick={() => setSelectedDocIdx(i)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border cursor-pointer ${
                    i === selectedDocIdx
                      ? 'border-primary bg-primary text-primary-foreground shadow-2xs'
                      : 'border-border bg-muted/50 text-foreground hover:bg-muted'
                  }`}
                >
                  #{i + 1} {d.fileName}
                </button>
              ))}
            </div>
          )}

          {/* Universal Preview */}
          <UniversalFilePreview document={activeDoc} className="min-h-[340px]" />
        </div>

        {/* Right: Editable Print Configuration */}
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Modify Job Parameters
          </span>

          {/* Copies */}
          <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-foreground block">Number of Copies</label>
              <span className="text-[11px] text-muted-foreground">Sets to spool</span>
            </div>
            <Stepper value={copies} onChange={setCopies} min={1} max={50} size="sm" />
          </div>

          {/* Color Mode */}
          <div className="p-3.5 rounded-xl border border-border bg-card space-y-2">
            <label className="text-xs font-bold text-foreground block">Color Mode</label>
            <SegmentedControl<ColorMode>
              id="modal-color"
              options={[
                { label: 'Black & White', value: 'bw' },
                { label: 'Color Laser', value: 'color' },
              ]}
              value={colorMode}
              onChange={setColorMode}
            />
          </div>

          {/* Sides */}
          {!activeDoc.isImage && (
            <div className="p-3.5 rounded-xl border border-border bg-card space-y-2">
              <label className="text-xs font-bold text-foreground block">Printing Sides</label>
              <SegmentedControl<Sides>
                id="modal-sides"
                options={[
                  { label: 'Single-Sided', value: 'single' },
                  { label: 'Double-Sided', value: 'double' },
                ]}
                value={sides}
                onChange={setSides}
              />
            </div>
          )}

          {/* Paper Type Selector */}
          <div className="p-3.5 rounded-xl border border-border bg-card space-y-2">
            <label className="text-xs font-bold text-foreground block">Paper Stock &amp; Type</label>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-muted/60 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              {paperTypes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({colorMode === 'bw' ? `Rs. ${p.bwPrice}` : `Rs. ${p.colorPrice}`}/pg)
                </option>
              ))}
            </select>
          </div>

          {/* Price Preview */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Calculated Job Price
              </span>
              <span className="text-xs text-muted-foreground">{priceResult.label}</span>
            </div>
            <span className="text-xl font-black text-primary tabular-nums">
              {formatPrice(priceResult.total)}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
