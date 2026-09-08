// PdfReader.ts — Real PDF text extraction using PDF.js
// Lazy-loaded to avoid startup cost

import type { FileRecord } from '../data/FileRepository'

export interface PdfReadResult {
  text: string
  pageCount: number
  confidence: 'high' | 'low' | 'none'
  error?: string
}

export async function readPdfText(record: FileRecord): Promise<PdfReadResult> {
  if (!record.dataUrl) {
    return {
      text: '',
      pageCount: 0,
      confidence: 'none',
      error: 'File data not available. File may be too large to store locally.',
    }
  }

  if (record.type !== 'pdf') {
    return {
      text: '',
      pageCount: 0,
      confidence: 'none',
      error: 'Not a PDF file.',
    }
  }

  try {
    // Lazy-load pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist')

    // Set worker — use a CDN worker for the prototype
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
    }

    // Convert dataUrl to ArrayBuffer
    const base64 = record.dataUrl.split(',')[1]
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const loadingTask = pdfjsLib.getDocument({ data: bytes })
    const pdf = await loadingTask.promise

    let fullText = ''
    let hasRealText = false

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item) => ('str' in item ? (item as { str: string }).str : ''))
        .join(' ')
      fullText += pageText + '\n'
      if (pageText.trim().length > 10) hasRealText = true
    }

    const cleanText = fullText.replace(/\s+/g, ' ').trim()

    if (!hasRealText || cleanText.length < 20) {
      return {
        text: cleanText,
        pageCount: pdf.numPages,
        confidence: 'none',
        error: "This PDF appears to be a scanned image. I couldn't extract readable text. OCR may be needed.",
      }
    }

    return {
      text: cleanText,
      pageCount: pdf.numPages,
      confidence: 'high',
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      text: '',
      pageCount: 0,
      confidence: 'none',
      error: `PDF reading failed: ${message}`,
    }
  }
}

export interface ExtractedFields {
  amount?: string
  date?: string
  invoice_number?: string
  vendor?: string
  due_date?: string
  [key: string]: string | undefined
}

export function extractFieldsFromText(text: string, fields: string[]): ExtractedFields {
  const result: ExtractedFields = {}

  for (const field of fields) {
    switch (field) {
      case 'amount':
        result.amount = extractAmount(text) ?? undefined
        break
      case 'date':
        result.date = extractDate(text) ?? undefined
        break
      case 'invoice_number':
        result.invoice_number = extractInvoiceNumber(text) ?? undefined
        break
      case 'vendor':
        result.vendor = extractVendor(text) ?? undefined
        break
      case 'due_date':
        result.due_date = extractDueDate(text) ?? undefined
        break
    }
  }

  return result
}

function extractAmount(text: string): string | null {
  // Common amount patterns: ₹10,500  Rs. 1500  $1,200.00  Total: 5000
  const patterns = [
    /(?:total|amount|grand total|net amount|payable|balance due)[:\s]*[₹$Rs.]*\s*([\d,]+(?:\.\d{1,2})?)/i,
    /[₹$]\s*([\d,]+(?:\.\d{1,2})?)/,
    /Rs\.?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /INR\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]+(?:\.\d{2})?)\s*(?:INR|₹)/,
  ]

  for (const pattern of patterns) {
    const m = text.match(pattern)
    if (m) {
      const raw = m[1].replace(/,/g, '')
      const num = parseFloat(raw)
      if (!isNaN(num) && num > 0 && num < 100_000_000) {
        return `₹${num.toLocaleString('en-IN')}`
      }
    }
  }
  return null
}

function extractDate(text: string): string | null {
  const patterns = [
    /(?:date|invoice date|bill date)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/,
    /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i,
  ]
  for (const pattern of patterns) {
    const m = text.match(pattern)
    if (m) return m[1]
  }
  return null
}

function extractInvoiceNumber(text: string): string | null {
  const m = text.match(/(?:invoice\s*(?:no|number|#|num)[:\s#]*|inv[:\s#]*)([\w\-\/]+)/i)
  return m ? m[1] : null
}

function extractVendor(text: string): string | null {
  // Look for common vendor header patterns in first 200 chars
  const head = text.substring(0, 400)
  const m = head.match(/(?:from|billed by|vendor|company|business)[:\s]*([A-Z][A-Za-z0-9\s&.,]{2,40})/i)
  return m ? m[1].trim() : null
}

function extractDueDate(text: string): string | null {
  const m = text.match(/(?:due date|pay by|payment due)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i)
  return m ? m[1] : null
}
