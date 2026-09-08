// ReadFileAction.ts — Reads real file content using PDF.js / text fallback

import type { ReadFileAction as ReadFileActionType } from '../agent/ActionPlan'
import type { ExecutionContext, ExtractedData } from '../agent/ExecutionContext'
import { fileRepository } from '../data/FileRepository'
import { activityRepository } from '../data/ActivityRepository'
import { readPdfText, extractFieldsFromText } from '../files/PdfReader'

export interface ReadResult {
  success: boolean
  text: string
  extractedData: ExtractedData
  pageCount?: number
  confidence: 'high' | 'low' | 'none'
  error?: string
  warning?: string
}

export async function executeReadFile(
  action: ReadFileActionType,
  context: ExecutionContext
): Promise<ReadResult> {
  // Resolve file from context or fileId
  let file = context.file
  if (!file && action.fileId) {
    file = await fileRepository.getById(action.fileId) ?? null
  }

  if (!file) {
    return {
      success: false,
      text: '',
      extractedData: {},
      confidence: 'none',
      error: 'No file selected. Run FIND_FILE first.',
    }
  }

  if (!file.dataUrl) {
    return {
      success: false,
      text: '',
      extractedData: {},
      confidence: 'none',
      error: 'File data is not stored locally (file may be too large). Cannot extract text.',
    }
  }

  let text = ''
  let confidence: ReadResult['confidence'] = 'none'
  let pageCount: number | undefined
  let error: string | undefined
  let warning: string | undefined

  if (file.type === 'pdf') {
    const pdfResult = await readPdfText(file)
    text = pdfResult.text
    confidence = pdfResult.confidence
    pageCount = pdfResult.pageCount
    if (pdfResult.error) {
      if (pdfResult.confidence === 'none') {
        error = pdfResult.error
      } else {
        warning = pdfResult.error
      }
    }
  } else if (file.type === 'document' && file.mimeType.includes('text')) {
    // Plain text file
    try {
      const base64 = file.dataUrl.split(',')[1]
      text = atob(base64)
      confidence = 'high'
    } catch {
      error = 'Failed to decode text file.'
    }
  } else {
    error = `Cannot extract text from ${file.type} files. PDF.js only supports PDF documents.`
    confidence = 'none'
  }

  // Extract requested fields
  const fields = action.extract ?? ['amount', 'date']
  const extractedData: ExtractedData = {}

  if (text) {
    const extracted = extractFieldsFromText(text, fields)
    Object.assign(extractedData, extracted)
    extractedData.rawText = text.substring(0, 2000) // store first 2000 chars

    // Store searchText in DB for future searches
    await fileRepository.updateSearchText(file.id, text.substring(0, 5000))
  }

  await activityRepository.add({
    type: 'read_file',
    description: error
      ? `Could not read ${file.name}`
      : `Read ${file.name}`,
    detail: error
      ? error
      : Object.entries(extractedData)
          .filter(([k]) => k !== 'rawText')
          .map(([k, v]) => `${k}: ${v}`)
          .join(' · ') || 'Text extracted',
    fileId: file.id,
    fileName: file.name,
  })

  return {
    success: !error || text.length > 0,
    text,
    extractedData,
    pageCount,
    confidence,
    error,
    warning,
  }
}
