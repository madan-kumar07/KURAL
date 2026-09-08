// ExecutionTimeline.tsx — Real-time execution steps with dark theme styling

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
    case 'FIND_FILE':       return '#38bdf8'
    case 'READ_FILE':       return '#c084fc'
    case 'SHARE_FILE':      return '#34d399'
    case 'CREATE_REMINDER': return '#fbbf24'
    case 'OPEN_APP':        return '#f87171'
    case 'SEARCH_WEB':      return '#38bdf8'
    case 'PLAY_MUSIC':      return '#f87171'
    case 'SEND_WHATSAPP':   return '#34d399'
    case 'SET_TIMER':       return '#fbbf24'
    case 'OPEN_MAPS':       return '#38bdf8'
    case 'MAKE_CALL':       return '#34d399'
  }
}

function StepIcon({ step }: { step: ActionStepResult }) {
  const Icon = getActionIcon(step.action)
  const color = getActionColor(step.action)

  if (step.status === 'running') {
    return (
      <motion.div className="w-7 h-7 rounded-lg flex items-center justify-center bg-cyan-500/15"
        animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
        <Loader size={14} color={color} />
      </motion.div>
    )
  }
  if (step.status === 'success') {
    return (
      <motion.div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/15"
        initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
        <Check size={14} color="#34d399" strokeWidth={2.5} />
      </motion.div>
    )
  }
  if (step.status === 'error') {
    return (
      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-500/15">
        <AlertCircle size={14} color="#f87171" />
      </div>
    )
  }
  if (step.status === 'waiting') {
    return (
      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-amber-500/15">
        <Clock size={14} color="#fbbf24" />
      </div>
    )
  }
  return (
    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-cyan-500/15">
      <Icon size={14} color={color} />
    </div>
  )
}

export function ExecutionTimeline({ steps, isRunning, currentLabel }: ExecutionTimelineProps) {
  return (
    <motion.div
      className="glass-card p-4 space-y-2"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {isRunning && currentLabel && (
        <div className="flex items-center gap-2 pb-2 mb-1 border-b border-white/10">
          <motion.div className="w-2 h-2 rounded-full bg-cyan-400"
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
          <p className="text-xs font-semibold text-cyan-300">{currentLabel}</p>
        </div>
      )}
      <AnimatePresence>
        {steps.map((step, i) => (
          <motion.div key={i} className="flex items-start gap-3 py-1.5 border-b border-white/5 last:border-0"
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: i * 0.04 }}>
            <StepIcon step={step} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-100 leading-snug">{step.label}</p>
              {step.detail && step.status !== 'running' && (
                <motion.p className="text-[11px] text-slate-400 mt-0.5 leading-snug"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  {step.detail}
                </motion.p>
              )}
              {step.error && (
                <motion.p className="text-[11px] text-red-400 mt-0.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {step.error}
                </motion.p>
              )}
            </div>
            <span className="text-xs font-bold flex-shrink-0" style={{
              color: step.status === 'success' ? '#34d399' : step.status === 'error' ? '#f87171' : step.status === 'waiting' ? '#fbbf24' : '#38bdf8',
            }}>
              {step.status === 'success' ? '✓' : step.status === 'error' ? '✗' : step.status === 'waiting' ? '?' : '…'}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
