// ShareManager.ts — Real file sharing via Web Share API with fallback

import type { FileRecord } from '../data/FileRepository'
import { getFileAsFile } from '../files/FileIndexer'

export interface ShareResult {
  success: boolean
  method: 'web-share' | 'download' | 'copy' | 'clipboard'
  message: string
}

const SENSITIVE_PATTERNS = [
  /aadhaar/i, /aadhar/i, /pan\b/i, /passport/i,
  /bank\s*statement/i, /salary/i, /payslip/i,
  /medical/i, /health\s*record/i, /private/i,
  /identity/i, /id\s*proof/i, /financial/i,
]

export function isSensitiveFile(record: FileRecord): boolean {
  const name = record.name.toLowerCase()
  return SENSITIVE_PATTERNS.some(p => p.test(name))
}

export async function shareFile(record: FileRecord, contact?: string): Promise<ShareResult> {
  const file = await getFileAsFile(record)

  // Try Web Share API with files
  if (navigator.share && file) {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: record.name,
          text: contact ? `Sharing ${record.name} with ${contact}` : `Sharing ${record.name}`,
        })
        return {
          success: true,
          method: 'web-share',
          message: 'Share sheet opened.',
        }
      } catch (err) {
        const e = err as Error
        if (e.name === 'AbortError') {
          return {
            success: false,
            method: 'web-share',
            message: 'Sharing was cancelled.',
          }
        }
        // Fall through to next method
      }
    }
  }

  // Try Web Share without files (share URL/text)
  if (navigator.share) {
    try {
      await navigator.share({
        title: record.name,
        text: contact
          ? `${contact}: Please find the file "${record.name}"`
          : `File: ${record.name}`,
      })
      return {
        success: true,
        method: 'web-share',
        message: 'Share sheet opened (file info shared, not the file itself).',
      }
    } catch (err) {
      const e = err as Error
      if (e.name === 'AbortError') {
        return {
          success: false,
          method: 'web-share',
          message: 'Sharing was cancelled.',
        }
      }
    }
  }

  // Fallback: trigger download
  if (record.dataUrl) {
    const a = document.createElement('a')
    a.href = record.dataUrl
    a.download = record.name
    a.click()
    return {
      success: true,
      method: 'download',
      message: `"${record.name}" downloaded to your device.`,
    }
  }

  // Last resort: copy filename
  try {
    await navigator.clipboard.writeText(record.name)
    return {
      success: true,
      method: 'clipboard',
      message: `Filename "${record.name}" copied to clipboard (file too large to share directly).`,
    }
  } catch {
    return {
      success: false,
      method: 'copy',
      message: 'File sharing is not supported in this browser.',
    }
  }
}
