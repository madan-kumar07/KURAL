// DebugDrawer.tsx — JSON plan inspector for hackathon demo

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Code2, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import type { ActionPlan } from '../agent/ActionPlan'

interface DebugDrawerProps {
  plan: ActionPlan | null
  isVisible: boolean
  onToggle: () => void
}

export function DebugDrawer({ plan, isVisible, onToggle }: DebugDrawerProps) {
  const [copied, setCopied] = useState(false)

  const json = plan ? JSON.stringify(plan, null, 2) : null

  const handleCopy = async () => {
    if (json) {
      await navigator.clipboard.writeText(json)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!plan) return null

  return (
    <div className="mt-2">
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-xs font-semibold w-full text-slate-400 hover:text-cyan-400 transition-colors py-1"
        aria-expanded={isVisible}
        aria-controls="debug-drawer"
      >
        <Code2 size={13} />
        <span>JSON Action Plan</span>
        {isVisible ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        <span className="ml-auto kural-badge text-[10px]">
          {plan.actions.length} action{plan.actions.length !== 1 ? 's' : ''}
        </span>
      </button>

      {/* Drawer */}
      <AnimatePresence>
        {isVisible && json && (
          <motion.div
            id="debug-drawer"
            className="relative mt-2 rounded-xl overflow-hidden bg-black/60 border border-cyan-500/20"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors"
              aria-label="Copy JSON"
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            <pre
              className="text-[11px] p-4 overflow-auto max-h-60 font-mono leading-relaxed text-cyan-200"
            >
              <code>{json}</code>
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
