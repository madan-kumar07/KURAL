// Activity.tsx — Real operation history from IndexedDB

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
    find_file:       { Icon: Search,       color: '#0088ff', bg: 'rgba(0,136,255,0.10)' },
    read_file:       { Icon: BookOpen,     color: '#7c3aed', bg: 'rgba(124,58,237,0.10)' },
    share_file:      { Icon: Share2,       color: '#059669', bg: 'rgba(5,150,105,0.10)' },
    create_reminder: { Icon: Bell,         color: '#d97706', bg: 'rgba(217,119,6,0.10)' },
    error:           { Icon: AlertCircle,  color: '#dc2626', bg: 'rgba(220,38,38,0.10)' },
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
      <div className="max-w-lg mx-auto px-4 pt-4 pb-4 space-y-4">

        {/* Tabs */}
        <div className="flex gap-2 p-1 rounded-2xl" style={{ background: 'rgba(0,136,255,0.07)' }}>
          {(['history', 'reminders'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: tab === t ? 'white' : 'transparent',
                color: tab === t ? '#005299' : 'rgba(13,31,53,0.55)',
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
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
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {activities.length === 0 ? (
                <motion.div
                  className="glass-card p-10 flex flex-col items-center gap-3 text-center"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                >
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0,136,255,0.08)' }}>
                    <Clock size={32} color="#0088ff" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-semibold text-ink">No activity yet</p>
                  <p className="text-xs text-ink-secondary">Your completed KURAL actions will appear here.</p>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-ink-tertiary">{activities.length} operations</p>
                    <button
                      onClick={() => setConfirmClear(true)}
                      className="btn-ghost text-red-500 text-xs"
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
                            <p className="text-sm font-semibold text-ink leading-snug">{a.description}</p>
                            {a.detail && (
                              <p className="text-xs text-ink-secondary mt-0.5 leading-snug truncate">{a.detail}</p>
                            )}
                            {a.fileName && (
                              <p className="text-xs text-brand mt-1 truncate">{a.fileName}</p>
                            )}
                          </div>
                          <span className="text-xs text-ink-tertiary flex-shrink-0 mt-0.5">{timeAgo(a.timestamp)}</span>
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
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              {reminders.length === 0 ? (
                <motion.div
                  className="glass-card p-10 flex flex-col items-center gap-3 text-center"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                >
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(217,119,6,0.08)' }}>
                    <Bell size={32} color="#d97706" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-semibold text-ink">No reminders yet</p>
                  <p className="text-xs text-ink-secondary">Say "Remind me tomorrow at 9 to pay the bill" to create one.</p>
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
                        style={{ opacity: r.fired ? 0.55 : 1 }}
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: r.fired ? 'rgba(34,197,94,0.10)' : 'rgba(217,119,6,0.10)' }}
                        >
                          {r.fired
                            ? <CheckCircle size={16} color="#16a34a" />
                            : <Bell size={16} color="#d97706" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-ink">{r.title}</p>
                          {r.message && r.message !== r.title && (
                            <p className="text-xs text-ink-secondary mt-0.5">{r.message}</p>
                          )}
                          <p className="text-xs mt-1" style={{ color: isPast && !r.fired ? '#dc2626' : '#d97706' }}>
                            {new Date(r.triggerTime).toLocaleString('en-IN', {
                              weekday: 'short', day: 'numeric', month: 'short',
                              hour: '2-digit', minute: '2-digit',
                            })}
                            {r.fired && ' · Delivered'}
                            {isPast && !r.fired && ' · Missed (tab was closed)'}
                          </p>
                          {r.fileName && (
                            <p className="text-xs text-brand mt-1 truncate">📎 {r.fileName}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteReminder(r.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 flex-shrink-0"
                          aria-label="Delete reminder"
                        >
                          <Trash2 size={13} color="rgba(220,38,38,0.6)" />
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
