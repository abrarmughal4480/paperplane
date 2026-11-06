import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ArrowRight,
  RefreshCw,
  Layers,
  HardDrive,
  CheckCircle,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { useCustomerOrder } from '../../context/CustomerOrderContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { UniversalFilePreview } from '../../components/customer/UniversalFilePreview';
import { getFileCategory } from '../../data/mockData';

export function PreviewPage() {
  const navigate = useNavigate();
  const {
    documents,
    activeDocIndex,
    setActiveDocIndex,
    selectedDocument,
  } = useCustomerOrder();

  const currentDocs = documents.length > 0 ? documents : (selectedDocument ? [selectedDocument] : []);
  const currentDoc = currentDocs[activeDocIndex] || currentDocs[0];

  if (!currentDoc) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-sm text-muted-foreground">No documents currently loaded.</p>
        <Button variant="primary" onClick={() => navigate('/customer/upload')}>
          Upload Documents
        </Button>
      </div>
    );
  }

  const isMulti = currentDocs.length > 1;
  const totalPagesSum = currentDocs.reduce(
    (sum, d) => sum + (d.isImage ? 1 : d.pageCount),
    0
  );

  return (
    <div className="py-2 space-y-5">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/customer/upload')}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-secondary text-sm font-semibold text-foreground hover:bg-secondary/80 shadow-sm transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Upload
        </button>
        <Badge variant="success">All Files Verified</Badge>
      </div>

      {/* Screen Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {isMulti ? 'Multi-Document Preview' : 'Document Preview'}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isMulti
            ? `Viewing document ${activeDocIndex + 1} of ${currentDocs.length}. Tap below to inspect each file.`
            : 'Verify contents and layout before setting print options.'}
        </p>
      </div>

      {/* Multi-Document File Switcher Tabs (Only if multiple files exist) */}
      {isMulti && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs px-1 font-bold text-muted-foreground">
            <span>Uploaded Bundle ({currentDocs.length} Files)</span>
            <span>{totalPagesSum} Pages Combined</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-0.5">
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
                  <span className="font-mono text-[10px] opacity-80">#{idx + 1}</span>
                  <span className="max-w-[120px] truncate">{doc.fileName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {doc.fileType}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Universal Dynamic Preview Canvas */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentDoc.id || currentDoc.fileName || activeDocIndex}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.15 }}
        >
          <UniversalFilePreview document={currentDoc} />
        </motion.div>
      </AnimatePresence>

      {/* Metadata Detail Card for Active Document */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-foreground truncate">{currentDoc.fileName}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span className="font-semibold uppercase">{currentDoc.fileType}</span>
              <span>•</span>
              <span>{currentDoc.fileSize}</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Ready</span>
            </div>
          </div>

          {isMulti && (
            <div className="text-right pl-3 shrink-0">
              <span className="text-xs font-mono font-bold text-primary block">
                Doc {activeDocIndex + 1} of {currentDocs.length}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {currentDoc.isImage ? 'Single Photo' : `${currentDoc.pageCount} Pages`}
              </span>
            </div>
          )}
        </div>

        {/* Multi-doc quick switcher buttons */}
        {isMulti && (
          <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs">
            <button
              type="button"
              disabled={activeDocIndex <= 0}
              onClick={() => setActiveDocIndex(Math.max(0, activeDocIndex - 1))}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-card font-semibold text-foreground hover:bg-muted disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous File
            </button>
            <button
              type="button"
              disabled={activeDocIndex >= currentDocs.length - 1}
              onClick={() => setActiveDocIndex(Math.min(currentDocs.length - 1, activeDocIndex + 1))}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-primary/40 bg-primary/10 font-semibold text-primary hover:bg-primary/20 disabled:opacity-30 cursor-pointer"
            >
              Next File <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="space-y-2 pt-2">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => navigate('/customer/settings')}
          className="gap-2 shadow-elevation py-5 font-bold"
        >
          <span>
            Configure Print Options {isMulti && `(${currentDocs.length} Files)`}
          </span>
          <ArrowRight className="w-4 h-4" />
        </Button>

        <Button
          variant="secondary"
          size="md"
          fullWidth
          onClick={() => navigate('/customer/upload')}
          className="gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Upload or add more files</span>
        </Button>
      </div>
    </div>
  );
}
