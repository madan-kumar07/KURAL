// FileIndexer.ts — Indexes real browser-selected files into IndexedDB
// Does NOT fabricate files. Only processes files the user selects.

import { fileRepository } from '../data/FileRepository'
import type { FileRecord } from '../data/FileRepository'
import { nanoid } from '../utils/nanoid'

const MAX_DATA_URL_SIZE = 10 * 1024 * 1024 // 10MB

function detectFileType(mimeType: string, name: string): FileRecord['type'] {
  if (mimeType.includes('pdf') || name.endsWith('.pdf')) return 'pdf'
  if (mimeType.startsWith('image/')) return 'image'
  if (
    mimeType.includes('word') ||
    mimeType.includes('text/plain') ||
    name.endsWith('.docx') || name.endsWith('.doc') ||
    name.endsWith('.txt') || name.endsWith('.rtf')
  ) return 'document'
  return 'other'
}

export async function indexFile(file: File): Promise<FileRecord> {
  const id = nanoid()
  const type = detectFileType(file.type, file.name)

  let dataUrl: string | undefined
  if (file.size <= MAX_DATA_URL_SIZE) {
    dataUrl = await readAsDataUrl(file)
  }

  const record: FileRecord = {
    id,
    name: file.name,
    type,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    modifiedTime: file.lastModified || Date.now(),
    lastIndexed: Date.now(),
    source: 'user-added',
    dataUrl,
  }

  await fileRepository.add(record)
  return record
}

export async function indexFiles(files: File[]): Promise<FileRecord[]> {
  const results: FileRecord[] = []
  for (const file of files) {
    const record = await indexFile(file)
    results.push(record)
  }
  return results
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export async function getFileAsBlob(record: FileRecord): Promise<Blob | null> {
  if (!record.dataUrl) return null
  try {
    const response = await fetch(record.dataUrl)
    return response.blob()
  } catch {
    return null
  }
}

export async function getFileAsFile(record: FileRecord): Promise<File | null> {
  const blob = await getFileAsBlob(record)
  if (!blob) return null
  return new File([blob], record.name, { type: record.mimeType })
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}
