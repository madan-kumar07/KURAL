// ExecutionTimeline.tsx — Real-time execution steps for all 11 action types

import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader, AlertCircle, Clock, Search, BookOpen, Share2, Bell,
         Globe, Music, MessageCircle, Timer, MapPin, Phone } from 'lucide-react'
import type { ActionStepResult } from '../agent/ActionExecutor'
import type { Action } from '../agent/ActionPlan'

interface ExecutionTimelineProps {
  steps: ActionStepResult[]
  isRunning: boolean
  currentLabel?: string
}

function getActionIcon(action: Action) {
  switch (action.type) {
    case 'FIND_FILE':       return Search
    case 'READ_FILE':       return BookOpen
    case 'SHARE_FILE':      return Share2
    case 'CREATE_REMINDER': return Bell
    case 'OPEN_APP':        return Globe
    case 'SEARCH_WEB':      return Search
    case 'PLAY_MUSIC':      return Music
    case 'SEND_WHATSAPP':   return MessageCircle
    case 'SET_TIMER':       return Timer
    case 'OPEN_MAPS':       return MapPin
    case 'MAKE_CALL':       return Phone
  }
}

function getActionColor(action: Action): string {
  switch (action.type) {
    case 'FIND_FILE':       return '#0088ff'
    case 'READ_FILE':       return '#7c3aed'
    case 'SHARE_FILE':      return '#059669'
    case 'CREATE_REMINDER': return '#d97706'
    case 'OPEN_APP':        return '#e53e3e'
    case 'SEARCH_WEB':      return '#0088ff'
    case 'PLAY_MUSIC':      return '#e53e3e'
    case 'SEND_WHATSAPP':   return '#25d366'
    case 'SET_TIMER':       return '#d97706'
    case 'OPEN_MAPS':       return '#0088ff'
    case 'MAKE_CALL':       return '#059669'
  }
}

function StepIcon({ step }: { step: ActionStepResult }) {
  const Icon = getActionIcon(step.action)
  const color = getActionColor(step.action)

  if (step.status === 'running') {
    return (
      <motion.div className="timeline-icon" style={{ background: `${color}15` }}
        animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
        <Loader size={14} color={color} />
      </motion.div>
    )
  }
  if (step.status === 'success') {
    return (
      <motion.div className="timeline-icon" style={{ background: 'rgba(34,197,94,0.12)' }}
        initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
        <Check size={14} color="#16a34a" strokeWidth={2.5} />
      </motion.div>
    )
  }
  if (step.status === 'error') {
    return (
      <div className="timeline-icon" style={{ background: 'rgba(220,38,38,0.10)' }}>
        <AlertCircle size={14} color="#dc2626" />
      </div>
    )
  }
  if (step.status === 'waiting') {
    return (
      <div className="timeline-icon" style={{ background: 'rgba(217,119,6,0.10)' }}>
        <Clock size={14} color="#d97706" />
      </div>
    )
  }
  return (
    <div className="timeline-icon" style={{ background: `${color}12` }}>
      <Icon size={14} color={color} />
    </div>
  )
}

export function ExecutionTimeline({ steps, isRunning, currentLabel }: ExecutionTimelineProps) {
  return (
    <motion.div
      className="glass-card p-4 space-y-1"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {isRunning && currentLabel && (
        <div className="flex items-center gap-2 pb-2 mb-1 border-b border-black/5">
          <motion.div className="w-2 h-2 rounded-full bg-sky-500"
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
          <p className="text-xs font-medium text-ink-secondary">{currentLabel}</p>
        </div>
      )}
      <AnimatePresence>
        {steps.map((step, i) => (
          <motion.div key={i} className="timeline-step"
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: i * 0.04 }}>
            <StepIcon step={step} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink leading-snug">{step.label}</p>
              {step.detail && step.status !== 'running' && (
                <motion.p className="text-xs text-ink-secondary mt-0.5 leading-snug"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  {step.detail}
                </motion.p>
              )}
              {step.error && (
                <motion.p className="text-xs text-red-600 mt-0.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {step.error}
                </motion.p>
              )}
            </div>
            <span className="text-xs font-semibold flex-shrink-0" style={{
              color: step.status === 'success' ? '#16a34a' : step.status === 'error' ? '#dc2626' : step.status === 'waiting' ? '#d97706' : '#0088ff',
            }}>
              {step.status === 'success' ? '✓' : step.status === 'error' ? '✗' : step.status === 'waiting' ? '?' : '…'}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
