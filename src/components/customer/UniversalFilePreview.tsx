import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Image as ImageIcon,
  Table,
  Presentation,
  FileCode,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Loader2,
} from 'lucide-react';
import { type DocumentInfo, getFileCategory, type FileCategory } from '../../data/mockData';
import { renderPdfPageToCanvas } from '../../utils/pdfRenderer';
import { extractDocxContent, type DocxContent } from '../../utils/docxRenderer';

interface UniversalFilePreviewProps {
  document: DocumentInfo;
  className?: string;
  // Multi-file navigation: arrows sit on the preview card itself so
  // switching files needs no scrolling. Only shown when provided.
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function UniversalFilePreview({ document, className = '', onPrev, onNext, hasPrev, hasNext }: UniversalFilePreviewProps) {
  const category: FileCategory = document.category || getFileCategory(document.fileName, document.fileType);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activePage, setActivePage] = useState<number>(1);
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);
  const [isPdfRendering, setIsPdfRendering] = useState<boolean>(false);
  const [pdfRenderSuccess, setPdfRenderSuccess] = useState<boolean>(false);
  // Real document content (not fake placeholder bars)
  const [docxContent, setDocxContent] = useState<DocxContent | null>(null);
  const [docxError, setDocxError] = useState<string | null>(null);
  const [isDocxLoading, setIsDocxLoading] = useState<boolean>(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isTextLoading, setIsTextLoading] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const totalPages = document.isImage ? 1 : Math.max(1, document.pageCount);

  // Reset page & render state when document changes
  useEffect(() => {
    setActivePage(1);
    setImageLoadError(false);
    setPdfRenderSuccess(false);
    setDocxContent(null);
    setDocxError(null);
    setTextContent(null);
  }, [document.id, document.fileName]);

  // Real DOCX rendering: read the actual document text with mammoth.
  // Legacy binary .doc files cannot be converted in the browser — say so
  // plainly instead of showing fake content bars.
  useEffect(() => {
    if (category !== 'word') return;
    const ext = (document.fileName.split('.').pop() || '').toLowerCase();
    if (ext === 'doc') {
      setDocxError('This is an old .doc file. Please save it as .docx in Word to see a live preview here — the file itself is still queued for printing.');
      return;
    }
    let isMounted = true;
    setIsDocxLoading(true);
    setDocxError(null);
    const load = async () => {
      try {
        const source = document.file || document.previewUrl || document.downloadUrl;
        if (!source) throw new Error('No file data available for preview.');
        const buffer =
          typeof source === 'string'
            ? await fetch(source).then((r) => {
                if (!r.ok) throw new Error('Could not download the file for preview.');
                return r.arrayBuffer();
              })
            : source;
        const content = await extractDocxContent(buffer);
        if (isMounted) setDocxContent(content);
      } catch (err) {
        if (isMounted)
          setDocxError('Could not read this Word file for preview. The file itself is still queued for printing.');
      } finally {
        if (isMounted) setIsDocxLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [category, document.file, document.previewUrl, document.downloadUrl, document.fileName]);

  // Real TXT rendering: read the actual file text.
  useEffect(() => {
    if (category !== 'text') return;
    let isMounted = true;
    setIsTextLoading(true);
    const load = async () => {
      try {
        const source = document.file || document.previewUrl || document.downloadUrl;
        if (!source) throw new Error('No file data available for preview.');
        const text =
          typeof source === 'string'
            ? await fetch(source).then((r) => {
                if (!r.ok) throw new Error('Could not download the file for preview.');
                return r.text();
              })
            : await (source as File).text();
        if (isMounted) setTextContent(text);
      } catch {
        if (isMounted) setTextContent(null);
      } finally {
        if (isMounted) setIsTextLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [category, document.file, document.previewUrl, document.downloadUrl, document.fileName]);

  // Real PDF rendering on canvas using pdfjs-dist
  useEffect(() => {
    if (category !== 'pdf') return;

    let isMounted = true;
    // After a reload the File/blob URL is gone — the server copy at
    // downloadUrl (/api/uploads/...) is the fallback that makes the
    // preview work on the shopkeeper PC too.
    const source = document.file || document.previewUrl || document.downloadUrl;

    if (!source || !canvasRef.current) {
      setPdfRenderSuccess(false);
      return;
    }

    setIsPdfRendering(true);

    const canvas = canvasRef.current;
    renderPdfPageToCanvas(source, canvas, activePage, 260)
      .then((res) => {
        if (isMounted) {
          setIsPdfRendering(false);
          setPdfRenderSuccess(res.success);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsPdfRendering(false);
          setPdfRenderSuccess(false);
        }
      });

    return () => {
      isMounted = false;
      if (canvas && (canvas as any)._currentRenderTask) {
        try {
          (canvas as any)._currentRenderTask.cancel();
        } catch {
          // safe
        }
      }
    };
  }, [category, document.file, document.previewUrl, document.downloadUrl, activePage]);

  const handleNextPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePage((prev) => Math.min(totalPages, prev + 1));
  };

  const handlePrevPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePage((prev) => Math.max(1, prev - 1));
  };

  const toggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => (prev === 1 ? 1.25 : 1));
  };

  return (
    <div
      className={`relative w-full rounded-2xl bg-gradient-to-b from-muted/50 via-muted/30 to-muted/10 border border-border/80 flex flex-col items-center justify-center min-h-[320px] p-4 sm:p-6 shadow-subtle overflow-hidden select-none ${className}`}
    >
      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
        {/* Category Pill */}
        <div className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/90 backdrop-blur-md border border-border/80 text-[11px] font-bold text-foreground shadow-sm">
          {category === 'image' && <ImageIcon className="w-3.5 h-3.5 text-blue-500" />}
          {category === 'pdf' && <FileText className="w-3.5 h-3.5 text-red-500" />}
          {category === 'word' && <FileText className="w-3.5 h-3.5 text-blue-600" />}
          {category === 'excel' && <Table className="w-3.5 h-3.5 text-emerald-600" />}
          {category === 'powerpoint' && <Presentation className="w-3.5 h-3.5 text-orange-500" />}
          {category === 'text' && <FileCode className="w-3.5 h-3.5 text-indigo-500" />}
          <span className="capitalize">{category === 'image' ? 'Photo' : category.toUpperCase()}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground uppercase">{document.fileType}</span>
        </div>

        {/* Action icons */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleZoom}
            className="w-7 h-7 rounded-lg bg-card/90 backdrop-blur-md border border-border/80 text-foreground flex items-center justify-center hover:bg-muted shadow-sm transition-colors cursor-pointer"
            title={zoomLevel === 1 ? 'Zoom In' : 'Zoom Out'}
          >
            {zoomLevel === 1 ? <ZoomIn className="w-3.5 h-3.5" /> : <ZoomOut className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Left / Right file arrows (multi-file only) */}
      {onPrev && hasPrev && (
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous file"
          title="Previous file"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-card/95 backdrop-blur-md border border-border shadow-elevation text-foreground flex items-center justify-center hover:bg-muted active:scale-95 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {onNext && hasNext && (
        <button
          type="button"
          onClick={onNext}
          aria-label="Next file"
          title="Next file"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-card/95 backdrop-blur-md border border-border shadow-elevation text-foreground flex items-center justify-center hover:bg-muted active:scale-95 transition-all cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Main Preview Container */}
      <div className="w-full flex items-center justify-center py-4 my-auto overflow-hidden">
        {/* 1. IMAGE PREVIEW */}
        {category === 'image' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: zoomLevel }}
            transition={{ duration: 0.2 }}
            className="relative max-w-[260px] max-h-[300px] rounded-xl shadow-elevation border border-border/80 overflow-hidden bg-card flex items-center justify-center p-1.5"
          >
            {((document.previewUrl || document.downloadUrl) && !imageLoadError) ? (
              <img
                src={document.previewUrl || document.downloadUrl}
                alt={document.fileName}
                onError={() => setImageLoadError(true)}
                className="max-h-[260px] w-auto max-w-full object-contain rounded-lg"
              />
            ) : (
              <div className="w-48 h-60 flex flex-col items-center justify-center gap-2.5 text-muted-foreground p-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground block truncate max-w-[150px]">
                    {document.fileName}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Original Photo Sheet</span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* 2. REAL PDF PREVIEW (Rendered via Mozilla pdfjs-dist on HTML5 Canvas) */}
        {category === 'pdf' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, scale: zoomLevel }}
            transition={{ duration: 0.2 }}
            className="relative bg-card rounded-lg shadow-elevation border border-border/80 overflow-hidden flex flex-col items-center justify-center p-2 min-h-[280px]"
          >
            {isPdfRendering && (
              <div className="absolute inset-0 z-10 bg-card/80 backdrop-blur-2xs flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Rendering PDF Page {activePage}...
                </span>
              </div>
            )}

            {/* Canvas where pdfjs-dist paints real document */}
            <canvas
              ref={canvasRef}
              className={`max-w-full h-auto rounded shadow-2xs border border-border/60 ${
                pdfRenderSuccess ? 'block' : 'hidden'
              }`}
            />

            {/* Shown only when the PDF genuinely cannot be rendered here */}
            {!pdfRenderSuccess && !isPdfRendering && (
              <div className="w-56 min-h-72 p-5 flex flex-col items-center justify-center gap-2 bg-card text-foreground text-center">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold truncate max-w-full px-1">
                  {document.fileName}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Preview could not be rendered on this device, but the file is
                  received ({totalPages} pages • {document.fileSize}) and queued for printing.
                </p>
                <p className="text-[10px] text-muted-foreground/70 font-mono">
                  Page {activePage} of {totalPages}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* 3. WORD / DOCX PREVIEW — real document content via mammoth */}
        {category === 'word' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, scale: zoomLevel }}
            transition={{ duration: 0.2 }}
            className="relative w-56 sm:w-64 h-72 sm:h-80 bg-white text-zinc-900 rounded-lg shadow-elevation border border-border/80 overflow-hidden flex flex-col"
          >
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-200 shrink-0">
              <div className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                W
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold block truncate">
                  {document.fileName}
                </span>
                <span className="text-[9px] text-zinc-500">
                  {docxContent
                    ? `${docxContent.words.toLocaleString()} words • ~${docxContent.estimatedPages} pages`
                    : 'Word Document'}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 text-[11px] leading-relaxed docx-preview">
              {isDocxLoading && (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-400">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-[11px] font-semibold">Reading Word document…</span>
                </div>
              )}
              {docxError && !isDocxLoading && (
                <p className="text-zinc-600 text-center pt-10 px-2">{docxError}</p>
              )}
              {docxContent && !isDocxLoading && (
                <div dangerouslySetInnerHTML={{ __html: docxContent.html || '<p>(This document has no readable text.)</p>' }} />
              )}
            </div>

            <div className="flex justify-between items-center text-[9px] text-zinc-500 border-t border-zinc-200 px-4 py-1.5 font-mono shrink-0">
              <span>Page {activePage} of {docxContent ? docxContent.estimatedPages : totalPages}</span>
              <span>Real Word Preview</span>
            </div>
          </motion.div>
        )}

        {/* 4. EXCEL / SPREADSHEET PREVIEW */}
        {category === 'excel' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, scale: zoomLevel }}
            transition={{ duration: 0.2 }}
            className="relative w-64 sm:w-72 h-72 sm:h-80 bg-card rounded-lg shadow-elevation border border-border/80 overflow-hidden flex flex-col"
          >
            <div className="bg-emerald-600 text-white px-3 py-1.5 flex items-center justify-between text-[10px] font-bold">
              <span className="flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5" /> Microsoft Excel
              </span>
              <span className="font-mono text-[9px] opacity-90">{document.fileType}</span>
            </div>

            <div className="flex-1 p-3 overflow-hidden flex flex-col items-center justify-center gap-2 text-center">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center">
                <Table className="w-5 h-5" />
              </div>
              <p className="text-[11px] font-bold text-foreground px-2 break-all">
                {document.fileName}
              </p>
              <p className="text-[10px] text-muted-foreground leading-relaxed px-2">
                Spreadsheet received ({document.fileSize}). Sheet contents are
                printed as they appear in Excel — this screen does not invent
                sample rows.
              </p>
            </div>

            <div className="bg-muted/70 px-2.5 py-1 border-t border-border/60 flex items-center gap-1.5 text-[9px] font-semibold text-muted-foreground">
              <span className="px-2 py-0.5 rounded bg-card text-foreground border border-border shadow-2xs">
                {document.fileSize}
              </span>
              <span className="ml-auto font-mono text-[8px]">Print as in Excel</span>
            </div>
          </motion.div>
        )}

        {/* 5. POWERPOINT PREVIEW */}
        {category === 'powerpoint' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, scale: zoomLevel }}
            transition={{ duration: 0.2 }}
            className="relative w-64 sm:w-72 h-44 sm:h-52 bg-card rounded-xl shadow-elevation border border-border/80 overflow-hidden flex flex-col p-4 justify-between"
          >
            <div className="space-y-2 text-center">
              <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <Presentation className="w-3.5 h-3.5" /> PowerPoint Slide
                </span>
                <span className="text-[9px] font-mono text-muted-foreground">{document.fileType}</span>
              </div>
              <p className="text-[11px] font-bold text-foreground truncate pt-1">
                {document.fileName}
              </p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Presentation received ({document.fileSize}). Slides print as
                designed in PowerPoint.
              </p>
            </div>

            <div className="flex justify-between items-center text-[9px] text-muted-foreground border-t border-border/40 pt-1 font-mono">
              <span>Slide {activePage} of {totalPages}</span>
              <span>Presentation Deck</span>
            </div>
          </motion.div>
        )}

        {/* 6. TEXT / CODE PREVIEW */}
        {category === 'text' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, scale: zoomLevel }}
            transition={{ duration: 0.2 }}
            className="relative w-56 sm:w-64 h-72 sm:h-80 bg-zinc-950 text-zinc-100 rounded-lg shadow-elevation border border-zinc-800 overflow-hidden flex flex-col p-3 font-mono text-[9px]"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-zinc-400">
              <span className="flex items-center gap-1 font-bold truncate max-w-[150px]">
                <FileCode className="w-3 h-3 text-indigo-400 shrink-0" /> {document.fileName}
              </span>
              <span>UTF-8</span>
            </div>

            <div className="flex-1 py-2 overflow-y-auto whitespace-pre-wrap break-words text-zinc-300">
              {isTextLoading ? (
                <span className="text-zinc-500">Reading file…</span>
              ) : textContent !== null && textContent !== '' ? (
                textContent
              ) : (
                <span className="text-zinc-500">(This file has no readable text, or it could not be read for preview. It is still queued for printing.)</span>
              )}
            </div>

            <div className="text-right text-zinc-500 border-t border-zinc-800 pt-1">
              Page {activePage} of {totalPages}
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom Floating Bar: Multi-page navigation (if > 1 page) */}
      {totalPages > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-md border border-border/80 text-xs font-bold text-foreground shadow-sm">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={activePage <= 1}
            className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] px-1">
            {activePage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={handleNextPage}
            disabled={activePage >= totalPages}
            className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Single Photo or Single Page indicator if 1 page */}
      {totalPages === 1 && (
        <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-card/90 backdrop-blur-md border border-border/80 text-[11px] font-bold text-foreground shadow-sm flex items-center gap-1.5">
          <FileCheck className="w-3.5 h-3.5 text-primary" />
          <span>{category === 'image' ? '1 Photo Sheet' : '1 Page Ready'}</span>
        </div>
      )}
    </div>
  );
}
