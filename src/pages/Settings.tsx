// Settings.tsx — Functional settings: voice language, contacts, notifications, data, privacy

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Database, Globe, Shield, Trash2, Check, Info, Users, Phone, Plus, MessageCircle } from 'lucide-react'
import { fileRepository } from '../data/FileRepository'
import { activityRepository } from '../data/ActivityRepository'
import { reminderRepository } from '../data/ReminderRepository'
import { contactRepository, type ContactRecord } from '../data/ContactRepository'
import { clearAllData } from '../data/indexedDb'
import { requestNotificationPermission } from '../reminders/ReminderManager'
import { ConfirmationDialog } from '../components/ConfirmationDialog'

export type VoiceLanguage = 'en-IN' | 'ta-IN' | 'en-US'

interface SettingsProps {
  voiceLanguage: VoiceLanguage
  onLanguageChange: (lang: VoiceLanguage) => void
}

const VOICE_LANGUAGES: { value: VoiceLanguage; label: string; native: string }[] = [
  { value: 'en-IN', label: 'English (India)', native: 'English' },
  { value: 'ta-IN', label: 'Tamil',           native: 'தமிழ்'  },
  { value: 'en-US', label: 'English (US)',    native: 'English (US)' },
]

interface DataStats {
  files: number
  activity: number
  reminders: number
  contacts: number
}

export function Settings({ voiceLanguage, onLanguageChange }: SettingsProps) {
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unavailable'>('default')
  const [stats, setStats] = useState<DataStats>({ files: 0, activity: 0, reminders: 0, contacts: 0 })
  const [contacts, setContacts] = useState<ContactRecord[]>([])
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContactName, setNewContactName] = useState('')
  const [newContactPhone, setNewContactPhone] = useState('')
  const [confirmClearAll, setConfirmClearAll] = useState(false)
  const [clearDone, setClearDone] = useState(false)
  const [requestingPermission, setRequestingPermission] = useState(false)

  useEffect(() => {
    if (!('Notification' in window)) {
      setNotifPermission('unavailable')
    } else {
      setNotifPermission(Notification.permission)
    }
    loadData()
  }, [])

  const loadData = async () => {
    const [files, activity, reminders, contactsCount, allContacts] = await Promise.all([
      fileRepository.count(),
      activityRepository.count(),
      reminderRepository.count(),
      contactRepository.count(),
      contactRepository.getAll(),
    ])
    setStats({ files, activity, reminders, contacts: contactsCount })
    setContacts(allContacts)
  }

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newContactName.trim() || !newContactPhone.trim()) return
    await contactRepository.add({
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
    })
    setNewContactName('')
    setNewContactPhone('')
    setShowAddContact(false)
    await loadData()
  }

  const handleDeleteContact = async (id: string) => {
    await contactRepository.delete(id)
    await loadData()
  }

  const handleRequestNotification = async () => {
    setRequestingPermission(true)
    const result = await requestNotificationPermission()
    setNotifPermission(result)
    setRequestingPermission(false)
  }

  const handleClearAll = async () => {
    await clearAllData()
    await loadData()
    setConfirmClearAll(false)
    setClearDone(true)
    setTimeout(() => setClearDone(false), 3000)
  }

  const speechSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  const shareSupported  = 'share' in navigator
  const notifSupported  = 'Notification' in window
  const idbSupported    = 'indexedDB' in window

  return (
    <div className="page-container">
      <div className="max-w-lg mx-auto px-4 pt-4 pb-4 space-y-4">

        {/* ── Voice Language ─── */}
        <Section icon={<Globe size={18} color="#0088ff" />} title="Voice Language">
          <p className="text-xs text-ink-secondary mb-3">
            Language used for speech recognition. KURAL understands all three in text mode regardless.
          </p>
          <div className="space-y-2">
            {VOICE_LANGUAGES.map(lang => (
              <button
                key={lang.value}
                onClick={() => onLanguageChange(lang.value)}
                className="w-full flex items-center justify-between p-3 rounded-xl transition-colors"
                style={{
                  background: voiceLanguage === lang.value
                    ? 'rgba(0,136,255,0.10)'
                    : 'rgba(0,0,0,0.02)',
                  border: voiceLanguage === lang.value
                    ? '1.5px solid rgba(0,136,255,0.25)'
                    : '1px solid rgba(0,0,0,0.06)',
                }}
              >
                <div>
                  <p className="text-sm font-medium text-ink text-left">{lang.label}</p>
                  <p className="text-xs text-ink-tertiary text-left">{lang.native}</p>
                </div>
                {voiceLanguage === lang.value && <Check size={16} color="#0088ff" />}
              </button>
            ))}
          </div>
          {!speechSupported && (
            <p className="text-xs text-amber-600 mt-3 p-2 rounded-lg" style={{ background: 'rgba(217,119,6,0.07)' }}>
              ⚠ Voice recognition is not supported in this browser.
            </p>
          )}
        </Section>

        {/* ── WhatsApp & Voice Contacts ─── */}
        <Section
          icon={<Users size={18} color="#25D366" />}
          title={`WhatsApp Contacts (${contacts.length})`}
        >
          <p className="text-xs text-ink-secondary mb-3">
            Saved contacts for WhatsApp messaging ("Send hi to Rajiv Menon") and voice calls.
          </p>

          <div className="space-y-2">
            {contacts.map(contact => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.15)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: 'rgba(37,211,102,0.18)', color: '#128C7E' }}>
                    {contact.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{contact.name}</p>
                    <p className="text-xs text-ink-tertiary">+{contact.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://api.whatsapp.com/send?phone=${contact.phone}&text=${encodeURIComponent('hi')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5"
                    title="Test WhatsApp"
                  >
                    <MessageCircle size={14} color="#25D366" />
                  </a>
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-red-500"
                    title="Delete contact"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {showAddContact ? (
              <motion.form
                onSubmit={handleAddContact}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-3 glass-card space-y-3"
              >
                <p className="text-xs font-semibold text-ink">Add New Contact</p>
                <input
                  type="text"
                  placeholder="Contact Name (e.g. Rajiv Menon)"
                  value={newContactName}
                  onChange={e => setNewContactName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-black/10 focus:outline-none focus:border-brand"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number (e.g. 919876543210)"
                  value={newContactPhone}
                  onChange={e => setNewContactPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-black/10 focus:outline-none focus:border-brand"
                  required
                />
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary flex-1 justify-center text-xs py-1.5">
                    Save Contact
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddContact(false)}
                    className="btn-ghost text-xs py-1.5"
                  >
                    Cancel
                  </button>
                </div>
              </motion.form>
            ) : (
              <button
                onClick={() => setShowAddContact(true)}
                className="btn-ghost mt-3 w-full justify-center text-xs"
              >
                <Plus size={14} /> Add new contact
              </button>
            )}
          </AnimatePresence>
        </Section>

        {/* ── Notifications ─── */}
        <Section icon={<Bell size={18} color="#d97706" />} title="Notifications">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Browser Notifications</p>
              <p className="text-xs text-ink-secondary mt-0.5">
                {notifPermission === 'unavailable' ? 'Not supported in this browser'
                  : notifPermission === 'granted'  ? 'Enabled — KURAL can notify you'
                  : notifPermission === 'denied'   ? 'Blocked — enable in browser settings'
                  : 'Not yet requested'}
              </p>
            </div>
            <PermissionBadge permission={notifPermission} />
          </div>

          {notifPermission === 'default' && notifSupported && (
            <button
              onClick={handleRequestNotification}
              disabled={requestingPermission}
              className="btn-primary mt-3 w-full justify-center"
            >
              {requestingPermission ? 'Requesting…' : 'Enable Notifications'}
            </button>
          )}
          {notifPermission === 'denied' && (
            <p className="text-xs text-ink-secondary mt-2">
              Open your browser settings and allow notifications for this site, then reload.
            </p>
          )}
          <p className="text-xs text-ink-tertiary mt-3">
            ⚠ Browser-scheduled notifications only fire while this tab is open.
          </p>
        </Section>

        {/* ── Local Data ─── */}
        <Section icon={<Database size={18} color="#7c3aed" />} title="Local Data">
          <div className="grid grid-cols-4 gap-1.5 mb-4">
            {[
              { label: 'Files', value: stats.files },
              { label: 'Activity', value: stats.activity },
              { label: 'Reminders', value: stats.reminders },
              { label: 'Contacts', value: stats.contacts },
            ].map(({ label, value }) => (
              <div key={label} className="glass-card-blue p-2.5 rounded-xl text-center">
                <p className="text-lg font-bold text-brand">{value}</p>
                <p className="text-[10px] text-ink-tertiary mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {clearDone && (
              <motion.p
                className="text-xs text-green-600 font-medium mb-2"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                ✓ All local data cleared.
              </motion.p>
            )}
          </AnimatePresence>

          <button
            onClick={() => setConfirmClearAll(true)}
            className="btn-ghost text-red-500 w-full justify-center"
          >
            <Trash2 size={15} /> Clear all local data
          </button>
        </Section>

        {/* ── Browser Capabilities ─── */}
        <Section icon={<Info size={18} color="#059669" />} title="Browser Capabilities">
          <div className="space-y-2">
            {[
              { label: 'Speech Recognition',  ok: speechSupported },
              { label: 'Web Share API',        ok: shareSupported  },
              { label: 'Notifications API',    ok: notifSupported  },
              { label: 'IndexedDB Storage',    ok: idbSupported    },
              { label: 'File System Access',   ok: 'showOpenFilePicker' in window },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center justify-between py-1">
                <p className="text-sm text-ink">{label}</p>
                <span
                  className="kural-badge text-xs"
                  style={{
                    background: ok ? 'rgba(34,197,94,0.10)' : 'rgba(220,38,38,0.08)',
                    color: ok ? '#15803d' : '#b91c1c',
                    borderColor: ok ? 'rgba(34,197,94,0.20)' : 'rgba(220,38,38,0.15)',
                  }}
                >
                  {ok ? '✓ Supported' : '✗ Unavailable'}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Privacy ─── */}
        <Section icon={<Shield size={18} color="#0088ff" />} title="Privacy">
          <div className="space-y-2 text-xs text-ink-secondary leading-relaxed">
            <p>
              <strong className="text-ink">Local-first.</strong> Your indexed file metadata and contacts stay in this browser's local IndexedDB storage.
            </p>
            <p>
              <strong className="text-ink">No uploads.</strong> KURAL does not upload your files or document contents to any server.
            </p>
            <p>
              <strong className="text-ink">No analytics.</strong> KURAL does not collect usage data or tracking information.
            </p>
          </div>
        </Section>

        {/* ── About ─── */}
        <div className="glass-card p-4 text-center space-y-1">
          <p className="text-sm font-bold text-ink" style={{ letterSpacing: '-0.01em' }}>KURAL</p>
          <p className="text-xs text-ink-tertiary">Multilingual Personal AI Agent · iQOO Hackathon Prototype</p>
          <p className="text-xs text-ink-tertiary">Local-first · No uploads · No tracking</p>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={confirmClearAll}
        title="Clear all local data?"
        message="This will permanently delete all indexed files, activity history, reminders, and contacts from this browser."
        confirmLabel="Clear everything"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleClearAll}
        onCancel={() => setConfirmClearAll(false)}
      />
    </div>
  )
}

// ── Reusable section wrapper ───────────────────────────────────────────────────
function Section({
  icon, title, children,
}: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm font-semibold text-ink">{title}</p>
      </div>
      <div className="kural-divider" />
      {children}
    </div>
  )
}

// ── Notification badge ─────────────────────────────────────────────────────────
function PermissionBadge({ permission }: { permission: NotificationPermission | 'unavailable' }) {
  const config = {
    granted:     { label: 'Enabled',    cls: 'kural-badge-green' },
    denied:      { label: 'Blocked',    cls: 'kural-badge-red'   },
    default:     { label: 'Not set',    cls: 'kural-badge'       },
    unavailable: { label: 'N/A',        cls: 'kural-badge'       },
  }
  const { label, cls } = config[permission] || config.default
  return <span className={`kural-badge ${cls}`}>{label}</span>
}
