// ExecutionContext.ts — Carries state across chained actions

import type { FileRecord } from '../data/FileRepository'

export interface ExtractedData {
  amount?: string
  date?: string
  invoice_number?: string
  vendor?: string
  due_date?: string
  rawText?: string
  confidence?: number
  [key: string]: string | number | undefined
}

export interface ExecutionContext {
  // Current file from FIND_FILE
  file?: FileRecord | null
  // Multiple candidates (for disambiguation)
  candidates?: FileRecord[]
  // Extracted data from READ_FILE
  extractedData?: ExtractedData
  // Raw text extracted
  fileText?: string
  // Contact from SHARE_FILE
  contact?: string
  // Reminder ID from CREATE_REMINDER
  reminderId?: string
  // Error if any step failed
  error?: string
}

export function createEmptyContext(): ExecutionContext {
  return {}
}
