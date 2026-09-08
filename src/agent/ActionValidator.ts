// ActionValidator.ts — Validates all 11 action types before execution

import type { ActionPlan, Action } from './ActionPlan'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

const ALLOWED_TYPES = [
  'FIND_FILE', 'READ_FILE', 'SHARE_FILE', 'CREATE_REMINDER',
  'OPEN_APP', 'SEARCH_WEB', 'PLAY_MUSIC', 'SEND_WHATSAPP',
  'SET_TIMER', 'OPEN_MAPS', 'MAKE_CALL',
]

export class ActionValidator {
  validate(plan: ActionPlan): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!plan || !Array.isArray(plan.actions) || plan.actions.length === 0) {
      return { valid: false, errors: ['Invalid or empty action plan'], warnings: [] }
    }

    for (let i = 0; i < plan.actions.length; i++) {
      const a = plan.actions[i]
      const p = `Action[${i}]`
      if (!a?.type || !ALLOWED_TYPES.includes(a.type)) {
        errors.push(`${p}: unknown type "${(a as {type:string}).type}"`)
        continue
      }
      switch (a.type) {
        case 'FIND_FILE':
          if (!a.query) a.query = ''
          break
        case 'READ_FILE':
          if (!a.source) errors.push(`${p}: READ_FILE requires source`)
          break
        case 'CREATE_REMINDER':
          if (!a.title?.trim()) a.title = 'Reminder'
          if (!a.triggerTime) {
            // Default to 1 hour from now
            a.triggerTime = new Date(Date.now() + 3600000).toISOString()
          } else if (isNaN(new Date(a.triggerTime).getTime())) {
            // If it's something like "11:30", it fails date parse. Let's just default to an hour.
            a.triggerTime = new Date(Date.now() + 3600000).toISOString()
          }
          break
        case 'SEARCH_WEB':
          if (!a.query?.trim()) a.query = 'general information'
          break
        case 'PLAY_MUSIC':
          if (!a.query?.trim()) a.query = 'music'
          break
        case 'SET_TIMER':
          if (!a.duration || a.duration <= 0) a.duration = 300 // 5 mins default
          break
        case 'OPEN_MAPS':
          if (!a.destination?.trim()) errors.push(`${p}: OPEN_MAPS requires destination`)
          break
        case 'OPEN_APP':
          if (!a.app?.trim()) errors.push(`${p}: OPEN_APP requires app name`)
          break
        case 'SEND_WHATSAPP':
          if (!a.contact && !a.phone) warnings.push(`${p}: SEND_WHATSAPP has no contact or phone — will open WhatsApp`)
          break
        case 'MAKE_CALL':
          if (!a.contact && !a.phone) warnings.push(`${p}: MAKE_CALL has no contact — may not work`)
          break
        case 'SHARE_FILE':
          break
      }
    }

    return { valid: errors.length === 0, errors, warnings }
  }
}
