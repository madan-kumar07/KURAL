// IntentEngine.ts — Abstract interface for the intent engine
// This abstraction allows swapping LocalPrototypeIntentEngine for a real LLM later

import type { ActionPlan } from './ActionPlan'

export interface IntentEngine {
  understand(input: string, language?: string): Promise<ActionPlan>
}
