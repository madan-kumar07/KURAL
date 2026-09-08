// Activity.tsx — Real operation history with dark theme styling

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Trash2, Search, BookOpen, Share2, Bell, AlertCircle, CheckCircle } from 'lucide-react'
import { activityRepository } from '../data/ActivityRepository'
import type { ActivityRecord } from '../data/ActivityRepository'
import { reminderRepository } from '../data/ReminderRepository'
import type { ReminderRecord } from '../data/ReminderRepository'
import { ConfirmationDialog } from '../components/ConfirmationDialog'

function ActivityIcon({ type }: { type: ActivityRecord['type'] }) {
  const config = {
    find_file:       { Icon: Search,       color: '#38bdf8', bg: 'rgba(56,189,248,0.15)' },
    read_file:       { Icon: BookOpen,     color: '#c084fc', bg: 'rgba(192,132,252,0.15)' },
    share_file:      { Icon: Share2,       color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
    create_reminder: { Icon: Bell,         color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
    error:           { Icon: AlertCircle,  color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
  }
  const { Icon, color, bg } = config[type] || config.error
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
      <Icon size={16} color={color} strokeWidth={2} />
    </div>
  )
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  const hrs  = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24)  return `${hrs}h ago`
  return `${days}d ago`
}

export function Activity() {
  const [activities, setActivities]     = useState<ActivityRecord[]>([])
  const [reminders, setReminders]       = useState<ReminderRecord[]>([])
  const [confirmClear, setConfirmClear] = useState(false)
  const [tab, setTab]                   = useState<'history' | 'reminders'>('history')

  const load = useCallback(async () => {
    const [acts, rems] = await Promise.all([
      activityRepository.getAll(),
      reminderRepository.getAll(),
    ])
    setActivities(acts)
    setReminders(rems)
  }, [])

  useEffect(() => { load() }, [load])

  const handleClear = async () => {
    await activityRepository.clear()
    setActivities([])
    setConfirmClear(false)
  }

  const handleDeleteReminder = async (id: string) => {
    await reminderRepository.delete(id)
    await load()
  }

  return (
    <div className="page-container">
      <div className="max-w-lg mx-auto px-4 pt-2 pb-4 space-y-4">

        {/* Tabs */}
        <div className="flex gap-2 p-1 rounded-2xl bg-white/5 border border-white/10">
          {(['history', 'reminders'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: tab === t ? 'rgba(56,189,248,0.2)' : 'transparent',
                color: tab === t ? '#38bdf8' : '#94a3b8',
                border: tab === t ? '1px solid rgba(56,189,248,0.3)' : '1px solid transparent',
              }}
            >
              {t === 'history' ? `History (${activities.length})` : `Reminders (${reminders.length})`}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {activities.length === 0 ? (
                <motion.div
                  className="glass-card p-10 flex flex-col items-center gap-3 text-center"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-cyan-500/10 text-cyan-400">
                    <Clock size={28} strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-semibold text-slate-100">No activity yet</p>
                  <p className="text-xs text-slate-400">Your completed KURAL actions will appear here.</p>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">{activities.length} operations</p>
                    <button
                      onClick={() => setConfirmClear(true)}
                      className="btn-ghost text-red-400 text-xs"
                    >
                      <Trash2 size={13} /> Clear all
                    </button>
                  </div>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {activities.map((a, i) => (
                        <motion.div
                          key={a.id}
                          className="glass-card p-4 flex items-start gap-3"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2, delay: i * 0.03 }}
                        >
                          <ActivityIcon type={a.type} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-100 leading-snug">{a.description}</p>
                            {a.detail && (
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug truncate">{a.detail}</p>
                            )}
                            {a.fileName && (
                              <p className="text-[11px] text-cyan-400 mt-1 truncate">{a.fileName}</p>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 flex-shrink-0 mt-0.5">{timeAgo(a.timestamp)}</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {tab === 'reminders' && (
            <motion.div
              key="reminders"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {reminders.length === 0 ? (
                <motion.div
                  className="glass-card p-10 flex flex-col items-center gap-3 text-center"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-amber-500/10 text-amber-400">
                    <Bell size={28} strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-semibold text-slate-100">No reminders yet</p>
                  <p className="text-xs text-slate-400">Say "Remind me tomorrow at 9 to pay the bill" to create one.</p>
                </motion.div>
              ) : (
                <AnimatePresence>
                  {reminders.map((r, i) => {
                    const isPast = r.triggerTime < Date.now()
                    return (
                      <motion.div
                        key={r.id}
                        className="glass-card p-4 flex items-start gap-3"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                        style={{ opacity: r.fired ? 0.6 : 1 }}
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: r.fired ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)' }}
                        >
                          {r.fired
                            ? <CheckCircle size={16} color="#34d399" />
                            : <Bell size={16} color="#fbbf24" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-100">{r.title}</p>
                          {r.message && r.message !== r.title && (
                            <p className="text-[11px] text-slate-400 mt-0.5">{r.message}</p>
                          )}
                          <p className="text-[11px] mt-1" style={{ color: isPast && !r.fired ? '#f87171' : '#fbbf24' }}>
                            {new Date(r.triggerTime).toLocaleString('en-IN', {
                              weekday: 'short', day: 'numeric', month: 'short',
                              hour: '2-digit', minute: '2-digit',
                            })}
                            {r.fired && ' · Delivered'}
                            {isPast && !r.fired && ' · Missed (tab was closed)'}
                          </p>
                          {r.fileName && (
                            <p className="text-[11px] text-cyan-400 mt-1 truncate">📎 {r.fileName}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteReminder(r.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-500/10 flex-shrink-0"
                          aria-label="Delete reminder"
                        >
                          <Trash2 size={13} className="text-red-400" />
                        </button>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmationDialog
        isOpen={confirmClear}
        title="Clear activity history?"
        message="This will permanently remove all operation history. Your files and reminders will not be affected."
        confirmLabel="Clear"
        cancelLabel="Keep"
        variant="danger"
        onConfirm={handleClear}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  )
}
