import * as pdfjsLib from 'pdfjs-dist';
// Bundle the PDF worker locally instead of loading it from a CDN.
// The shop PC is offline-first: the old cdnjs worker URL failed with no
// internet, pdfjs silently failed, and NO preview rendered on PC at all.
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure worker safely
try {
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  }
} catch (e) {
  console.warn('pdfjs worker configuration fallback', e);
}

/**
 * Extracts real page count from an uploaded File or ArrayBuffer
 */
export async function extractPdfPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      isEvalSupported: false,
    });
    const pdfDoc = await loadingTask.promise;
    return pdfDoc.numPages || 1;
  } catch (error) {
    console.warn('Could not parse PDF page count via pdfjs-dist:', error);
    return Math.max(1, Math.min(200, Math.floor(file.size / 100000) || 1));
  }
}

/**
 * Renders a specific page of a PDF file onto an HTML Canvas element
 */
export async function renderPdfPageToCanvas(
  source: File | ArrayBuffer | string,
  canvas: HTMLCanvasElement,
  pageNumber: number = 1,
  targetWidth: number = 280
): Promise<{ success: boolean; totalPages: number }> {
  try {
    let loadingTask;
    if (source instanceof File) {
      const buffer = await source.arrayBuffer();
      loadingTask = pdfjsLib.getDocument({
        data: buffer,
        useSystemFonts: true,
        isEvalSupported: false,
      });
    } else if (source instanceof ArrayBuffer) {
      loadingTask = pdfjsLib.getDocument({
        data: source,
        useSystemFonts: true,
        isEvalSupported: false,
      });
    } else {
      loadingTask = pdfjsLib.getDocument({
        url: source,
        useSystemFonts: true,
        isEvalSupported: false,
      });
    }

    const pdfDoc = await loadingTask.promise;
    const clampedPage = Math.max(1, Math.min(pdfDoc.numPages, pageNumber));
    const page = await pdfDoc.getPage(clampedPage);

    const initialViewport = page.getViewport({ scale: 1 });
    const scale = targetWidth / (initialViewport.width || 1);
    const viewport = page.getViewport({ scale });

    const ctx = canvas.getContext('2d');
    if (!ctx) return { success: false, totalPages: pdfDoc.numPages };

    // Cancel any ongoing render on this canvas to prevent conflict
    if ((canvas as any)._currentRenderTask) {
      try {
        (canvas as any)._currentRenderTask.cancel();
      } catch {
        // safe
      }
    }

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };

    const renderTask = page.render(renderContext);
    (canvas as any)._currentRenderTask = renderTask;

    await renderTask.promise;
    (canvas as any)._currentRenderTask = null;
    return { success: true, totalPages: pdfDoc.numPages };
  } catch (error: any) {
    if (error?.name === 'RenderingCancelledException') {
      return { success: true, totalPages: 1 };
    }
    console.warn('renderPdfPageToCanvas error:', error);
    return { success: false, totalPages: 1 };
  }
}
