// ShareFileAction.ts — Shares real file via Web Share API

import type { ShareFileAction as ShareFileActionType } from '../agent/ActionPlan'
import type { ExecutionContext } from '../agent/ExecutionContext'
import { fileRepository } from '../data/FileRepository'
import { activityRepository } from '../data/ActivityRepository'
import { shareFile, isSensitiveFile } from '../sharing/ShareManager'

export interface ShareResult {
  success: boolean
  method: string
  message: string
  isSensitive: boolean
  requiresConfirmation: boolean
}

export async function executeShareFile(
  action: ShareFileActionType,
  context: ExecutionContext
): Promise<ShareResult> {
  let file = context.file
  if (!file && action.fileId) {
    file = await fileRepository.getById(action.fileId) ?? null
  }

  if (!file) {
    return {
      success: false,
      method: 'none',
      message: 'No file selected to share.',
      isSensitive: false,
      requiresConfirmation: false,
    }
  }

  const sensitive = isSensitiveFile(file)

  const result = await shareFile(file, action.contact)

  await activityRepository.add({
    type: 'share_file',
    description: result.success
      ? `Shared ${file.name}${action.contact ? ` with ${action.contact}` : ''}`
      : `Share cancelled for ${file.name}`,
    detail: result.message,
    fileId: file.id,
    fileName: file.name,
  })

  return {
    ...result,
    isSensitive: sensitive,
    requiresConfirmation: false,
  }
}
