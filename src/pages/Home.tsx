// Home.tsx — Primary KURAL interaction screen with all 11 capabilities

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, ChevronRight, AlertCircle, Plus, Mic, Video,
  MessageCircle, Search, Music, Timer, MapPin, Phone, Globe,
} from 'lucide-react'

import { VoiceButton } from '../components/VoiceButton'
import { CommandInput } from '../components/CommandInput'
import { ExecutionTimeline } from '../components/ExecutionTimeline'
import { ResultCard } from '../components/ResultCard'
import { ConfirmationDialog } from '../components/ConfirmationDialog'
import { DebugDrawer } from '../components/DebugDrawer'
import { FilePicker } from '../components/FilePicker'

import { SpeechEngine } from '../voice/SpeechEngine'
import type { SpeechState } from '../voice/SpeechEngine'
import { LocalPrototypeIntentEngine } from '../agent/LocalPrototypeIntentEngine'
import { TaskPlanner } from '../agent/TaskPlanner'
import { ActionExecutor } from '../agent/ActionExecutor'
import type { ActionStepResult } from '../agent/ActionExecutor'
import type { ActionPlan } from '../agent/ActionPlan'
import type { ExecutionContext } from '../agent/ExecutionContext'
import type { FileRecord } from '../data/FileRepository'
import { indexFiles } from '../files/FileIndexer'
import { activityRepository } from '../data/ActivityRepository'
import type { ActivityRecord } from '../data/ActivityRepository'

// ── Capability groups ─────────────────────────────────────────────────────────
const SUGGESTION_GROUPS = [
  {
    label: 'Apps & Media',
    color: '#e53e3e',
    icon: Video,
    items: [
      { text: 'Open YouTube', emoji: '▶️' },
      { text: 'Play Deva Tamil songs', emoji: '🎵' },
      { text: 'Open WhatsApp', emoji: '💬' },
      { text: 'Open Instagram', emoji: '📸' },
    ],
  },
  {
    label: 'Search',
    color: '#0088ff',
    icon: Search,
    items: [
      { text: 'Search weather today', emoji: '🌤️' },
      { text: 'Search cricket score', emoji: '🏏' },
      { text: 'Google latest news', emoji: '📰' },
    ],
  },
  {
    label: 'Files',
    color: '#7c3aed',
    icon: Globe,
    items: [
      { text: 'Find my latest invoice', emoji: '🔍' },
      { text: 'Find invoice and tell me the amount', emoji: '📄' },
      { text: 'Find PDF and share it', emoji: '📤' },
    ],
  },
  {
    label: 'Productivity',
    color: '#059669',
    icon: Timer,
    items: [
      { text: 'Set timer for 5 minutes', emoji: '⏱️' },
      { text: 'Remind me tomorrow at 9 AM', emoji: '🔔' },
      { text: 'Navigate to Chennai airport', emoji: '🗺️' },
    ],
  },
]

// Flat list for scroll strip
const QUICK_CHIPS = [
  '💬 Send hi to Rajiv Menon',
  '📄 Open recent file',
  '▶️ Open YouTube',
  '🎵 Play songs',
  '🔍 Find invoice',
  '⏱️ 5 minute timer',
  '🗺️ Open Maps',
  '📰 Search news',
  '📸 Open Instagram',
]

const intentEngine = new LocalPrototypeIntentEngine()
const planner      = new TaskPlanner()
const executor     = new ActionExecutor()

interface HomeProps {
  voiceLanguage: string
  onNavigateToFiles: () => void
  onNavigate?: (page: 'home' | 'files' | 'activity' | 'settings') => void
}

export function Home({ voiceLanguage, onNavigateToFiles, onNavigate }: HomeProps) {
  const [speechState, setSpeechState]         = useState<SpeechState>('idle')
  const [transcript, setTranscript]           = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [inputText, setInputText]             = useState('')
  const [isProcessing, setIsProcessing]       = useState(false)
  const [currentLabel, setCurrentLabel]       = useState('')
  const [steps, setSteps]                     = useState<ActionStepResult[]>([])
  const [plan, setPlan]                       = useState<ActionPlan | null>(null)
  const [showDebug, setShowDebug]             = useState(false)
  const [context, setContext]                 = useState<ExecutionContext>({})
  const [shareResult, setShareResult]         = useState<string | undefined>()
  const [reminderTime, setReminderTime]       = useState<number | undefined>()
  const [error, setError]                     = useState<string | null>(null)
  const [errorCode, setErrorCode]             = useState<string | undefined>()
  const [candidates, setCandidates]           = useState<FileRecord[]>([])
  const [pendingPlan, setPendingPlan]         = useState<ActionPlan | null>(null)
  const [confirmDialog, setConfirmDialog]     = useState<{ message: string; resolve: (v: boolean) => void } | null>(null)
  const [recentActivity, setRecentActivity]   = useState<ActivityRecord[]>([])
  const [activeGroup, setActiveGroup]         = useState(0)

  const speechRef = useRef<SpeechEngine | null>(null)

  // Init speech engine
  useEffect(() => {
    speechRef.current = new SpeechEngine({
      language: voiceLanguage,
      onStateChange: setSpeechState,
      onInterim: setInterimTranscript,
      onFinal: (r) => {
        setTranscript(r.transcript); setInterimTranscript('')
        handleSubmit(r.transcript)
      },
      onError: (msg, code) => {
        setError(msg); setErrorCode(code); setSpeechState('error')
      },
    })
    return () => speechRef.current?.abort()
  }, [voiceLanguage])

  useEffect(() => { loadActivity() }, [])

  const loadActivity = async () => {
    const a = await activityRepository.getRecent(5)
    setRecentActivity(a)
  }

  const resetState = () => {
    setSteps([]); setPlan(null); setContext({})
    setShareResult(undefined); setReminderTime(undefined)
    setCandidates([]); setError(null); setErrorCode(undefined)
  }

  const handleVoiceClick = () => {
    const e = speechRef.current
    if (!e) return
    if (speechState === 'listening') { e.stop(); return }
    resetState(); setTranscript('')
    e.start()
  }

  const handleSubmit = useCallback(async (text: string) => {
    if (!text.trim() || isProcessing) return
    resetState()
    setIsProcessing(true)
    setCurrentLabel('Understanding…')
    setInputText('')
    setTranscript(text)

    try {
      const actionPlan = await intentEngine.understand(text, voiceLanguage)
      setPlan(actionPlan)
      setCurrentLabel('Planning…')

      const ep = planner.plan(actionPlan)
      if (!ep.valid) {
        setError(`I couldn't understand: ${ep.errors.join('. ')}`)
        setIsProcessing(false); return
      }

      const result = await executor.execute(actionPlan, {
        onStepStart: (_i, lbl) => setCurrentLabel(lbl),
        onStepComplete: (_i, step) => {
          setSteps(prev => {
            const next = [...prev]
            const idx = next.findIndex(s => s.action === step.action)
            if (idx >= 0) next[idx] = step; else next.push(step)
            return next
          })
        },
        onNeedsClarification: (_i, files) => {
          setCandidates(files); setPendingPlan(actionPlan)
          setIsProcessing(false); setCurrentLabel('')
        },
        onNeedsConfirmation: async (_i, msg) =>
          new Promise<boolean>(resolve => setConfirmDialog({ message: msg, resolve })),
        onComplete: (ctx, finalSteps) => {
          setContext(ctx); setSteps(finalSteps); setCurrentLabel('')
          for (const s of finalSteps) {
            if (s.action.type === 'SHARE_FILE' && s.status === 'success') setShareResult(s.detail)
            if (s.action.type === 'CREATE_REMINDER' && s.data?.triggerTime) setReminderTime(s.data.triggerTime as number)
            if (s.action.type === 'OPEN_APP' && s.detail?.startsWith('Navigating to ')) {
              const target = s.detail.replace('Navigating to ', '').replace('…', '').trim()
              if (['files', 'activity', 'settings', 'home'].includes(target) && onNavigate) {
                setTimeout(() => onNavigate(target as any), 600)
              }
            }
          }
          loadActivity()
        },
        onError: (err) => { setError(err); setCurrentLabel('') },
      })
      setContext(result.context)
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsProcessing(false); setCurrentLabel('')
    }
  }, [isProcessing, voiceLanguage])

  const handleCandidateSelect = async (file: FileRecord) => {
    if (!pendingPlan) return
    setCandidates([])
    const mod: ActionPlan = {
      ...pendingPlan,
      actions: pendingPlan.actions.map(a =>
        (a.type === 'READ_FILE' || a.type === 'SHARE_FILE') ? { ...a, fileId: file.id } : a
      ),
    }
    setSteps([]); setIsProcessing(true); setContext({ file })

    const result = await executor.execute(mod, {
      onStepStart: (_i, lbl) => setCurrentLabel(lbl),
      onStepComplete: (_i, s) => setSteps(p => { const n=[...p]; const i=n.findIndex(x=>x.action===s.action); if(i>=0) n[i]=s; else n.push(s); return n }),
      onNeedsConfirmation: async (_i, msg) => new Promise<boolean>(r => setConfirmDialog({ message: msg, resolve: r })),
      onComplete: (ctx, fs) => {
        setContext(ctx); setSteps(fs); setCurrentLabel('')
        for (const s of fs) {
          if (s.action.type === 'SHARE_FILE' && s.status === 'success') setShareResult(s.detail)
          if (s.action.type === 'CREATE_REMINDER' && s.data?.triggerTime) setReminderTime(s.data.triggerTime as number)
        }
        loadActivity()
      },
      onError: (e) => { setError(e); setCurrentLabel('') },
    })
    setContext(result.context); setIsProcessing(false); setPendingPlan(null)
  }

  const handleFilesAdded = async (files: File[]) => {
    setIsProcessing(true); setCurrentLabel(`Indexing ${files.length} file(s)…`)
    try {
      const records = await indexFiles(files)
      setIsProcessing(false); setCurrentLabel(''); loadActivity()
      setSteps([{ action: { type: 'FIND_FILE', query: '' }, status: 'success', label: `${records.length} file(s) indexed`, detail: records.map(r => r.name).join(', ') }])
    } catch { setError('Failed to index files.'); setIsProcessing(false) }
  }

  const hasResults    = steps.length > 0
  const showTimeline  = hasResults || isProcessing
  const speechSupported = speechRef.current?.isSupported ?? false

  return (
    <div className="page-container">
      <div className="max-w-lg mx-auto px-4 pt-4 pb-4 flex flex-col gap-4">

        {/* ── Hero ─── */}
        <motion.div className="text-center pt-1" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-base font-semibold text-ink">Speak naturally.</p>
          <p className="text-xs text-ink-tertiary mt-0.5">English · தமிழ் · Tanglish · Apps · Files · Music</p>
        </motion.div>

        {/* ── Voice card ─── */}
        <motion.div
          className="glass-card-elevated p-6 flex flex-col items-center gap-5"
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <VoiceButton state={speechState} isSupported={speechSupported} onClick={handleVoiceClick} size="lg" />

          {/* Live transcript */}
          <AnimatePresence>
            {(transcript || interimTranscript) && (
              <motion.div
                className="w-full text-center"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              >
                <p className="text-sm font-medium text-ink px-2 leading-relaxed"
                  style={{ fontStyle: interimTranscript ? 'italic' : 'normal', color: interimTranscript ? 'rgba(13,31,53,0.55)' : '#0d1f35' }}>
                  "{interimTranscript || transcript}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status */}
          <div className="flex items-center gap-1.5">
            <div className={`status-dot ${speechState === 'listening' ? 'processing' : speechState === 'idle' && speechSupported ? '' : 'inactive'}`} />
            <span className="text-xs text-ink-tertiary">
              {speechState === 'listening' ? 'Listening…'
                : speechState === 'transcribing' ? 'Processing…'
                : speechState === 'requesting_permission' ? 'Requesting mic…'
                : speechSupported ? 'Tap mic to speak'
                : 'Text input mode'}
            </span>
          </div>
        </motion.div>

        {/* ── Text input ─── */}
        <CommandInput
          value={inputText}
          onChange={setInputText}
          onSubmit={handleSubmit}
          onClear={() => setTranscript('')}
          disabled={isProcessing}
          placeholder="Type anything… apps, music, files, search…"
        />

        {/* ── Error state with smart guidance ─── */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="flex items-start gap-3 p-4 rounded-2xl"
              style={{ background: errorCode === 'network' || errorCode === 'brave_localhost' ? 'rgba(217,119,6,0.08)' : 'rgba(220,38,38,0.08)', border: `1px solid ${errorCode === 'network' || errorCode === 'brave_localhost' ? 'rgba(217,119,6,0.20)' : 'rgba(220,38,38,0.15)'}` }}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              <AlertCircle size={16} color={errorCode === 'network' || errorCode === 'brave_localhost' ? '#d97706' : '#dc2626'} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: errorCode === 'network' || errorCode === 'brave_localhost' ? '#92400e' : '#991b1b', whiteSpace: 'pre-line' }}>
                  {error}
                </p>
                {(errorCode === 'network' || errorCode === 'brave_localhost') && (
                  <p className="text-xs mt-2 text-ink-secondary">
                    💡 <strong>Text input works perfectly</strong> — type your command below. Voice works on Chrome/Edge after deployment to HTTPS.
                  </p>
                )}
                {error.includes('No matching file') && (
                  <button onClick={onNavigateToFiles} className="mt-2 text-xs font-semibold text-red-600 flex items-center gap-1">
                    Add files <ChevronRight size={12} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Disambiguation ─── */}
        <AnimatePresence>
          {candidates.length > 0 && (
            <motion.div className="glass-card p-4 space-y-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="text-sm font-semibold text-ink">{candidates.length} files found — which one?</p>
              <div className="space-y-2">
                {candidates.map(file => (
                  <button key={file.id} onClick={() => handleCandidateSelect(file)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 transition-colors text-left"
                    style={{ border: '1px solid rgba(0,136,255,0.12)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,136,255,0.10)' }}>
                      <span className="text-xs font-bold" style={{ color: '#0088ff' }}>{file.type.toUpperCase().slice(0, 3)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{file.name}</p>
                      <p className="text-xs text-ink-tertiary">{new Date(file.modifiedTime).toLocaleDateString('en-IN')}</p>
                    </div>
                    <ChevronRight size={16} color="rgba(0,136,255,0.5)" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Execution timeline ─── */}
        <AnimatePresence>
          {showTimeline && (
            <div className="space-y-2">
              <ExecutionTimeline steps={steps} isRunning={isProcessing} currentLabel={currentLabel} />
              {plan && <DebugDrawer plan={plan} isVisible={showDebug} onToggle={() => setShowDebug(v => !v)} />}
            </div>
          )}
        </AnimatePresence>

        {/* ── Result card ─── */}
        <AnimatePresence>
          {!isProcessing && steps.some(s => s.status === 'success') && (
            <ResultCard
              file={context.file}
              extractedData={context.extractedData}
              reminderTime={reminderTime}
              shareResult={shareResult}
            />
          )}
        </AnimatePresence>

        {/* ── New request button after results ─── */}
        <AnimatePresence>
          {hasResults && !isProcessing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
              <button onClick={resetState} className="btn-ghost">
                <Plus size={16} /> New request
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty state: capabilities + suggestions ─── */}
        <AnimatePresence>
          {!hasResults && !isProcessing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

              {/* Quick chips strip */}
              <div className="chips-scroll pb-1">
                {QUICK_CHIPS.map(chip => (
                  <button
                    key={chip}
                    onClick={() => handleSubmit(chip.replace(/^[^\s]+\s/, ''))}
                    className="suggestion-chip flex-shrink-0 text-xs"
                    disabled={isProcessing}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Capability groups */}
              <div className="glass-card p-4 space-y-3">
                {/* Group tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {SUGGESTION_GROUPS.map((g, i) => {
                    const Icon = g.icon
                    return (
                      <button
                        key={g.label}
                        onClick={() => setActiveGroup(i)}
                        className="flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                        style={{
                          background: activeGroup === i ? g.color : 'rgba(0,0,0,0.04)',
                          color: activeGroup === i ? 'white' : 'rgba(13,31,53,0.55)',
                        }}
                      >
                        <Icon size={12} />
                        {g.label}
                      </button>
                    )
                  })}
                </div>

                {/* Items */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeGroup}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.18 }}
                    className="grid grid-cols-1 gap-2"
                  >
                    {SUGGESTION_GROUPS[activeGroup].items.map(item => (
                      <button
                        key={item.text}
                        onClick={() => handleSubmit(item.text)}
                        disabled={isProcessing}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/4 transition-colors text-left w-full"
                        style={{ border: '1px solid rgba(0,0,0,0.05)' }}
                      >
                        <span className="text-lg">{item.emoji}</span>
                        <span className="text-sm text-ink font-medium">{item.text}</span>
                        <ChevronRight size={14} color="rgba(0,0,0,0.25)" className="ml-auto flex-shrink-0" />
                      </button>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* File add */}
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">📁 Add files to search</p>
                  <button onClick={onNavigateToFiles} className="text-xs text-brand font-medium flex items-center gap-1">
                    Manage <ChevronRight size={12} />
                  </button>
                </div>
                <FilePicker onFiles={handleFilesAdded} />
              </div>

              {/* Recent activity */}
              {recentActivity.length > 0 && (
                <motion.div className="glass-card p-4 space-y-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <p className="text-sm font-semibold text-ink flex items-center gap-2">
                    <Sparkles size={14} color="#0088ff" /> Recent
                  </p>
                  <div className="space-y-2">
                    {recentActivity.map(a => (
                      <div key={a.id} className="flex items-center gap-3 py-0.5">
                        <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(0,136,255,0.08)' }}>
                          <span className="text-xs">
                            {a.type === 'find_file' ? '🔍' : a.type === 'read_file' ? '📄' : a.type === 'share_file' ? '📤' : a.type === 'create_reminder' ? '🔔' : '⚠️'}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-ink truncate flex-1">{a.description}</p>
                        <p className="text-xs text-ink-tertiary flex-shrink-0">
                          {new Date(a.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation dialog */}
      <ConfirmationDialog
        isOpen={!!confirmDialog}
        title="Sensitive Document"
        message={confirmDialog?.message || ''}
        variant="warning"
        confirmLabel="Share anyway"
        cancelLabel="Cancel"
        onConfirm={() => { confirmDialog?.resolve(true); setConfirmDialog(null) }}
        onCancel={() => { confirmDialog?.resolve(false); setConfirmDialog(null) }}
      />
    </div>
  )
}
