// ActionExecutor.ts — Executes all 11 action types with chaining support

import type { ActionPlan, Action } from './ActionPlan'
import type { ExecutionContext } from './ExecutionContext'
import { createEmptyContext } from './ExecutionContext'
import { executeFindFile } from '../actions/FindFileAction'
import { executeReadFile } from '../actions/ReadFileAction'
import { executeShareFile } from '../actions/ShareFileAction'
import { executeCreateReminder } from '../actions/CreateReminderAction'
import {
  executeOpenApp, executeSearchWeb, executePlayMusic,
  executeSendWhatsApp, executeSetTimer, executeOpenMaps, executeMakeCall,
} from '../actions/BrowserActions'
import { isSensitiveFile } from '../sharing/ShareManager'

export type ActionStatus = 'pending' | 'running' | 'success' | 'error' | 'waiting'

export interface ActionStepResult {
  action: Action
  status: ActionStatus
  label: string
  detail?: string
  error?: string
  data?: Record<string, unknown>
  needsClarification?: boolean
  candidates?: import('../data/FileRepository').FileRecord[]
  isSensitive?: boolean
}

export interface ExecutionCallbacks {
  onStepStart?: (index: number, label: string) => void
  onStepComplete?: (index: number, result: ActionStepResult) => void
  onNeedsClarification?: (index: number, candidates: import('../data/FileRepository').FileRecord[]) => void
  onNeedsConfirmation?: (index: number, message: string) => Promise<boolean>
  onComplete?: (context: ExecutionContext, steps: ActionStepResult[]) => void
  onError?: (error: string, steps: ActionStepResult[]) => void
}

export class ActionExecutor {
  async execute(
    plan: ActionPlan,
    callbacks: ExecutionCallbacks = {}
  ): Promise<{ context: ExecutionContext; steps: ActionStepResult[] }> {
    const context: ExecutionContext = createEmptyContext()
    const steps: ActionStepResult[] = []

    for (let i = 0; i < plan.actions.length; i++) {
      const action = plan.actions[i]
      const label = this.getLabel(action)
      callbacks.onStepStart?.(i, label)

      const step: ActionStepResult = { action, status: 'running', label }
      steps.push(step)

      try {
        switch (action.type) {

          // ── File actions ──────────────────────────────────────────────────
          case 'FIND_FILE': {
            const r = await executeFindFile(action, context)
            if (!r.success) {
              step.status = 'error'; step.error = r.error
              callbacks.onStepComplete?.(i, step)
              callbacks.onError?.(r.error || 'File not found', steps)
              return { context, steps }
            }
            if (r.needsClarification && r.files.length > 1) {
              step.status = 'waiting'; step.needsClarification = true
              step.candidates = r.files; step.detail = `${r.files.length} files found`
              callbacks.onStepComplete?.(i, step)
              callbacks.onNeedsClarification?.(i, r.files)
              return { context, steps }
            }
            context.file = r.files[0]; context.candidates = r.files
            step.status = 'success'; step.detail = r.files[0].name
            step.data = { fileName: r.files[0].name, fileId: r.files[0].id }
            break
          }

          case 'READ_FILE': {
            const r = await executeReadFile(action, context)
            context.fileText = r.text; context.extractedData = r.extractedData
            step.status = r.error && !r.text ? 'error' : 'success'
            step.error = r.error
            const fields = Object.entries(r.extractedData)
              .filter(([k, v]) => k !== 'rawText' && v)
              .map(([k, v]) => `${k.replace('_', ' ')}: ${v}`)
            step.detail = fields.length > 0 ? fields.join(' · ') : (r.error || 'Text extracted')
            step.data = { ...r.extractedData }
            break
          }

          case 'SHARE_FILE': {
            if (context.file && isSensitiveFile(context.file)) {
              const ok = await (callbacks.onNeedsConfirmation?.(i, `Share sensitive document "${context.file.name}"?`) ?? Promise.resolve(true))
              if (!ok) {
                step.status = 'error'; step.error = 'Cancelled.'
                callbacks.onStepComplete?.(i, step)
                return { context, steps }
              }
            }
            const r = await executeShareFile(action, context)
            step.status = r.success ? 'success' : 'error'
            step.detail = r.message; step.error = r.success ? undefined : r.message
            if (action.contact) context.contact = action.contact
            break
          }

          case 'CREATE_REMINDER': {
            const r = await executeCreateReminder(action, context)
            step.status = r.success ? 'success' : 'error'
            step.detail = r.message
            if (r.reminder) {
              context.reminderId = r.reminder.id
              step.data = { reminderId: r.reminder.id, triggerTime: r.reminder.triggerTime }
            }
            break
          }

          // ── Browser actions ───────────────────────────────────────────────
          case 'OPEN_APP': {
            const r = await executeOpenApp(action)
            step.status = r.success ? 'success' : 'error'
            step.detail = r.message; step.error = r.success ? undefined : r.message
            step.data = { url: r.url }
            break
          }

          case 'SEARCH_WEB': {
            const r = await executeSearchWeb(action)
            step.status = 'success'; step.detail = r.message; step.data = { url: r.url }
            break
          }

          case 'PLAY_MUSIC': {
            const r = await executePlayMusic(action)
            step.status = 'success'; step.detail = r.message; step.data = { url: r.url }
            break
          }

          case 'SEND_WHATSAPP': {
            const r = await executeSendWhatsApp(action)
            step.status = r.success ? 'success' : 'error'
            step.detail = r.message; step.error = r.success ? undefined : r.message
            break
          }

          case 'SET_TIMER': {
            const r = await executeSetTimer(action)
            step.status = 'success'; step.detail = r.message
            step.data = { timerDuration: r.timerDuration, timerLabel: r.timerLabel }
            break
          }

          case 'OPEN_MAPS': {
            const r = await executeOpenMaps(action)
            step.status = 'success'; step.detail = r.message; step.data = { url: r.url }
            break
          }

          case 'MAKE_CALL': {
            const r = await executeMakeCall(action)
            step.status = r.success ? 'success' : 'error'
            step.detail = r.message; step.error = r.success ? undefined : r.message
            break
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        step.status = 'error'; step.error = `Error: ${msg}`
        callbacks.onStepComplete?.(i, step)
        callbacks.onError?.(msg, steps)
        return { context, steps }
      }

      callbacks.onStepComplete?.(i, step)
    }

    callbacks.onComplete?.(context, steps)
    return { context, steps }
  }

  private getLabel(action: Action): string {
    switch (action.type) {
      case 'FIND_FILE':       return `Finding "${action.query}"…`
      case 'READ_FILE':       return 'Reading file…'
      case 'SHARE_FILE':      return `Sharing${action.contact ? ` with ${action.contact}` : ''}…`
      case 'CREATE_REMINDER': return `Creating reminder: "${action.title}"…`
      case 'OPEN_APP':        return `Opening ${action.app}…`
      case 'SEARCH_WEB':      return `Searching: "${action.query}"…`
      case 'PLAY_MUSIC':      return `Playing "${action.query}"…`
      case 'SEND_WHATSAPP':   return `WhatsApp${action.contact ? ` → ${action.contact}` : ''}…`
      case 'SET_TIMER':       return `Setting timer: ${action.label || action.duration + 's'}…`
      case 'OPEN_MAPS':       return `Maps → "${action.destination}"…`
      case 'MAKE_CALL':       return `Calling ${action.contact || action.phone || '…'}…`
    }
  }
}
