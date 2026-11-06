// Real Word (.docx) content extraction via mammoth.
// Previously the DOCX preview was fake grey bars and the page count was
// guessed from file size (size / 60000) — the user rightly reported that
// "docx ka preview nhi arha". This reads the actual document text.
import * as mammoth from 'mammoth';

export interface DocxContent {
  /** Sanitised-ish HTML produced by mammoth (headings, bold, lists, tables). */
  html: string;
  /** Plain text of the whole document. */
  text: string;
  /** Word count, used for a real page estimate. */
  words: number;
  /** Estimated printed pages at ~450 words per A4 page. */
  estimatedPages: number;
  /** True when the file is a legacy binary .doc — mammoth cannot read it. */
  unsupportedLegacyDoc?: boolean;
}

function countWords(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

export async function extractDocxContent(
  source: File | ArrayBuffer,
): Promise<DocxContent> {
  const arrayBuffer =
    source instanceof ArrayBuffer ? source : await source.arrayBuffer();

  const [{ value: html }, { value: text }] = await Promise.all([
    mammoth.convertToHtml({ arrayBuffer: arrayBuffer.slice(0) }),
    mammoth.extractRawText({ arrayBuffer: arrayBuffer.slice(0) }),
  ]);

  const words = countWords(text);
  return {
    html,
    text,
    words,
    estimatedPages: Math.max(1, Math.ceil(words / 450)),
  };
}
