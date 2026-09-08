// FindFileAction.ts — Searches IndexedDB for real indexed files

import { fileRepository } from '../data/FileRepository'
import type { FileRecord } from '../data/FileRepository'
import { activityRepository } from '../data/ActivityRepository'
import type { FindFileAction as FindFileActionType } from '../agent/ActionPlan'
import type { ExecutionContext } from '../agent/ExecutionContext'

export interface FindResult {
  success: boolean
  files: FileRecord[]
  needsClarification: boolean
  error?: string
}

export async function executeFindFile(
  action: FindFileActionType,
  _context: ExecutionContext
): Promise<FindResult> {
  try {
    const results = await fileRepository.search(action.query, {
      type: action.fileType,
      folder: action.folder,
      sort: action.sort ?? 'latest',
      limit: action.limit ?? 10,
    })

    if (results.length === 0) {
      await activityRepository.add({
        type: 'find_file',
        description: `No files found for "${action.query}"`,
        detail: 'Search returned 0 results',
      })
      return {
        success: false,
        files: [],
        needsClarification: false,
        error: `No matching file was found in your indexed files for "${action.query}". Try adding files first.`,
      }
    }

    // If limit is 1 but multiple found, return all for disambiguation
    const needsClarification = (action.limit === 1 && results.length > 1)

    const selectedFile = results[0]
    await activityRepository.add({
      type: 'find_file',
      description: needsClarification
        ? `Found ${results.length} files matching "${action.query}"`
        : `Found: ${selectedFile.name}`,
      detail: needsClarification
        ? results.map(f => f.name).join(', ')
        : `${selectedFile.type.toUpperCase()} · ${(selectedFile.size / 1024).toFixed(1)} KB`,
      fileId: selectedFile.id,
      fileName: selectedFile.name,
    })

    return {
      success: true,
      files: results,
      needsClarification,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      files: [],
      needsClarification: false,
      error: `File search failed: ${message}`,
    }
  }
}
