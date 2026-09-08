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
    <div className="mt-3">
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-xs font-medium w-full text-ink-tertiary hover:text-brand transition-colors py-1"
        aria-expanded={isVisible}
        aria-controls="debug-drawer"
      >
        <Code2 size={12} />
        <span>JSON Action Plan</span>
        {isVisible ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        <span className="ml-auto kural-badge text-xs">
          {plan.actions.length} action{plan.actions.length !== 1 ? 's' : ''}
        </span>
      </button>

      {/* Drawer */}
      <AnimatePresence>
        {isVisible && json && (
          <motion.div
            id="debug-drawer"
            className="relative mt-2 rounded-xl overflow-hidden"
            style={{ background: 'rgba(13,31,53,0.92)', border: '1px solid rgba(0,136,255,0.20)' }}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
              style={{ background: 'rgba(0,136,255,0.15)', color: '#93c5fd' }}
              aria-label="Copy JSON"
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            <pre
              className="text-xs p-4 overflow-auto max-h-60 font-mono leading-relaxed"
              style={{ color: '#93c5fd', scrollbarWidth: 'thin' }}
            >
              <code>{json}</code>
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
