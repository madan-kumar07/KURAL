// TaskPlanner.ts — Validates and sequences actions, producing an execution plan

import type { ActionPlan } from './ActionPlan'
import { ActionValidator } from './ActionValidator'

export interface ExecutionPlan {
  valid: boolean
  plan: ActionPlan
  errors: string[]
  warnings: string[]
}

export class TaskPlanner {
  private validator = new ActionValidator()

  plan(actionPlan: ActionPlan): ExecutionPlan {
    const validation = this.validator.validate(actionPlan)
    return {
      valid: validation.valid,
      plan: actionPlan,
      errors: validation.errors,
      warnings: validation.warnings,
    }
  }
}
