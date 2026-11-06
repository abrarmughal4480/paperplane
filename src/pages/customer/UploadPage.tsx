import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileCheck,
  Info,
  Clock,
  ArrowRight,
  Shield,
  FileText,
  Image as ImageIcon,
  Table,
  Presentation,
  FileCode,
  Plus,
  Trash2,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { useCustomerOrder } from '../../context/CustomerOrderContext';
import { type DocumentInfo, getFileCategory, type FileCategory } from '../../data/mockData';
import { extractPdfPageCount } from '../../utils/pdfRenderer';
import { extractDocxContent } from '../../utils/docxRenderer';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { RatesModal } from '../../components/customer/RatesModal';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(category: FileCategory) {
  switch (category) {
    case 'image':
      return <ImageIcon className="w-4 h-4 text-blue-500" />;
    case 'pdf':
      return <FileText className="w-4 h-4 text-red-500" />;
    case 'word':
      return <FileText className="w-4 h-4 text-blue-600" />;
    case 'excel':
      return <Table className="w-4 h-4 text-emerald-600" />;
    case 'powerpoint':
      return <Presentation className="w-4 h-4 text-orange-500" />;
    case 'text':
      return <FileCode className="w-4 h-4 text-indigo-500" />;
    default:
      return <FileText className="w-4 h-4 text-muted-foreground" />;
  }
}

export function UploadPage() {
  const navigate = useNavigate();
  const {
    documents,
    addDocuments,
    removeDocument,
    clearDocuments,
    setActiveDocIndex,
  } = useCustomerOrder();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [processingNames, setProcessingNames] = useState<string>('');
  const [showRates, setShowRates] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFileList = async (files: FileList | File[]) => {
    if (files.length === 0 || isUploading) return;
    setIsUploading(true);
    setUploadProgress(20);

    const fileArray = Array.from(files);
    setProcessingNames(
      fileArray.length === 1 ? fileArray[0].name : `${fileArray.length} files selected`
    );

    try {
      setUploadProgress(50);

      const parsedDocs: DocumentInfo[] = await Promise.all(
        fileArray.map(async (file) => {
          const ext = file.name.split('.').pop()?.toLowerCase() || '';
          const category = getFileCategory(file.name);
          const isImg = category === 'image';
          const previewUrl = URL.createObjectURL(file);

          let pageCount = 1;
          if (isImg) {
            pageCount = 1;
          } else if (category === 'pdf') {
            // Real PDF parsing via Mozilla pdfjs-dist
            pageCount = await extractPdfPageCount(file);
          } else if (category === 'word') {
            // Real page estimate from the actual document text, not file size.
            try {
              const content = await extractDocxContent(file);
              pageCount = content.estimatedPages;
            } catch {
              pageCount = Math.max(1, Math.min(100, Math.floor(file.size / 60000) || 2));
            }
          } else if (category === 'excel') {
            pageCount = Math.max(1, Math.floor(file.size / 80000) || 1);
          } else if (category === 'powerpoint') {
            pageCount = Math.max(1, Math.floor(file.size / 150000) || 6);
          } else {
            pageCount = Math.max(1, Math.floor(file.size / 4000) || 1);
          }

          return {
            id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            fileName: file.name,
            fileType: ext.toUpperCase() || (isImg ? 'JPG' : 'PDF'),
            fileSize: formatFileSize(file.size),
            fileSizeBytes: file.size,
            pageCount,
            isImage: isImg,
            category,
            previewUrl,
            file,
            thumbnailColor: isImg ? '#3B82F6' : '#64748B',
          };
        })
      );

      setUploadProgress(100);
      addDocuments(parsedDocs);
    } catch (err) {
      console.error('Error processing files:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleNativeFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFileList(e.target.files);
      // Immediately clear file input value so re-selecting same files does not re-trigger
      e.target.value = '';
    }
  };

  const handleProceedToPreview = () => {
    if (documents.length > 0) {
      setActiveDocIndex(0);
      navigate('/customer/preview');
    }
  };

  const totalPagesCount = documents.reduce(
    (sum, d) => sum + (d.isImage ? 1 : d.pageCount),
    0
  );

  return (
    <div className="py-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-1.5 pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Upload Documents & Photos
        </h1>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          Upload one or multiple files in any format. Instant live preview and print pricing.
        </p>
      </div>

      {/* Hidden File Input (supports multiple files & any common office/photo format) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleNativeFileSelect}
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf,.jpg,.jpeg,.png,.webp,.bmp"
        className="hidden"
      />

      {/* Interactive Upload Box */}
      <Card
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFileList(e.dataTransfer.files);
          }
        }}
        className={`relative overflow-hidden cursor-pointer p-6 sm:p-8 text-center border-2 border-dashed transition-all duration-200 ${
          isDragOver
            ? 'border-primary bg-primary/5 ring-4 ring-primary/10 scale-[1.01]'
            : 'border-border/80 hover:border-primary/50 hover:bg-muted/30 bg-card'
        }`}
      >
        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4 py-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto ring-8 ring-primary/5">
                <FileCheck className="w-7 h-7 animate-pulse text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground truncate max-w-[240px] mx-auto">
                  Processing {processingNames}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Analyzing formats and generating previews...
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden max-w-xs mx-auto">
                <motion.div
                  className="bg-primary h-full rounded-full transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-primary">{uploadProgress}%</span>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto transition-transform group-hover:scale-110">
                <Upload className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">
                  Tap to upload files
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, Word, Excel, PowerPoint, Images (Multiple files supported)
                </p>
              </div>

              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-all">
                  <Plus className="w-3.5 h-3.5" />
                  Select Files from Device
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Uploaded Files Queue (When 1 or more files are present) */}
      {documents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-foreground px-1">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-primary" />
              Files Ready for Printing ({documents.length})
            </span>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground font-medium text-[11px]">
                Total: {totalPagesCount} {totalPagesCount === 1 ? 'Page' : 'Pages'}
              </span>
              <button
                type="button"
                onClick={clearDocuments}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-500/70 bg-red-500/20 text-red-600 dark:text-red-400 text-[11px] font-bold hover:bg-red-500/20 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {documents.map((doc, idx) => (
              <div
                key={doc.id || `${doc.fileName}_${idx}`}
                className="p-3 rounded-xl bg-card border border-border/80 flex items-center justify-between gap-3 shadow-2xs hover:border-border transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/60">
                    {getFileIcon(doc.category || getFileCategory(doc.fileName, doc.fileType))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate max-w-[200px]">
                      {doc.fileName}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <span className="font-semibold uppercase text-foreground/80">{doc.fileType}</span>
                      <span>•</span>
                      <span>{doc.fileSize}</span>
                      <span>•</span>
                      <span>{doc.isImage ? '1 Photo' : `${doc.pageCount} pgs`}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeDocument(idx);
                  }}
                  className="w-8 h-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add more files secondary action */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 rounded-xl border border-dashed border-primary/40 bg-secondary hover:border-primary/60 text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
            <span>Add More Files</span>
          </button>

          {/* Primary Proceed CTA */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleProceedToPreview}
              className="gap-2 shadow-elevation py-5 font-bold"
            >
              <span>Preview & Configure {documents.length} {documents.length === 1 ? 'Document' : 'Documents'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Quick Rate & Info */}
      <div className="flex items-center justify-between text-xs px-1">
        <button
          type="button"
          onClick={() => setShowRates(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary/60 bg-primary/20 text-primary text-xs font-bold hover:bg-primary/30 transition-colors cursor-pointer"
        >
          <Info className="w-3.5 h-3.5" />
          View Print Rates
        </button>
        <span className="text-muted-foreground flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          Ready in ~2 mins
        </span>
      </div>

      {/* Privacy Notice */}
      <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center gap-3 text-xs text-muted-foreground">
        <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>Your files are automatically deleted from the server after printing.</span>
      </div>

      {/* Rates Modal */}
      <RatesModal isOpen={showRates} onClose={() => setShowRates(false)} />
    </div>
  );
}
