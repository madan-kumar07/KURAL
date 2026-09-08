// CreateReminderAction.ts — Creates real browser reminder/notification

import type { CreateReminderAction as CreateReminderActionType } from '../agent/ActionPlan'
import type { ExecutionContext } from '../agent/ExecutionContext'
import { createReminder } from '../reminders/ReminderManager'
import type { ReminderCreateResult } from '../reminders/ReminderManager'

export async function executeCreateReminder(
  action: CreateReminderActionType,
  context: ExecutionContext
): Promise<ReminderCreateResult> {
  const triggerTime = new Date(action.triggerTime).getTime()
  const file = action.source === 'previous_result' ? context.file : undefined

  return createReminder({
    title: action.title,
    message: action.message,
    triggerTime,
    fileId: file?.id,
    fileName: file?.name,
  })
}
