// Settings.tsx — Functional settings page with dark theme

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Database, Globe, Shield, Trash2, Check, Info, Users, Plus, MessageCircle } from 'lucide-react'
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
      <div className="max-w-lg mx-auto px-4 pt-2 pb-4 space-y-4">

        {/* ── Voice Language ─── */}
        <Section icon={<Globe size={18} className="text-cyan-400" />} title="Voice Language">
          <p className="text-xs text-slate-400 mb-3">
            Language used for speech recognition. KURAL understands all three in text mode regardless.
          </p>
          <div className="space-y-2">
            {VOICE_LANGUAGES.map(lang => (
              <button
                key={lang.value}
                onClick={() => onLanguageChange(lang.value)}
                className="w-full flex items-center justify-between p-3 rounded-xl transition-all"
                style={{
                  background: voiceLanguage === lang.value
                    ? 'rgba(56,189,248,0.15)'
                    : 'rgba(255,255,255,0.03)',
                  border: voiceLanguage === lang.value
                    ? '1px solid rgba(56,189,248,0.4)'
                    : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div>
                  <p className="text-xs font-semibold text-slate-100 text-left">{lang.label}</p>
                  <p className="text-[10px] text-slate-400 text-left">{lang.native}</p>
                </div>
                {voiceLanguage === lang.value && <Check size={16} className="text-cyan-400" />}
              </button>
            ))}
          </div>
          {!speechSupported && (
            <p className="text-xs text-amber-400 mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              ⚠ Voice recognition is not supported in this browser.
            </p>
          )}
        </Section>

        {/* ── WhatsApp & Voice Contacts ─── */}
        <Section
          icon={<Users size={18} className="text-emerald-400" />}
          title={`WhatsApp Contacts (${contacts.length})`}
        >
          <p className="text-xs text-slate-400 mb-3">
            Saved contacts for WhatsApp messaging ("Send hi to Rajiv Menon") and voice calls.
          </p>

          <div className="space-y-2">
            {contacts.map(contact => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-emerald-500/20 text-emerald-400">
                    {contact.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-100">{contact.name}</p>
                    <p className="text-[10px] text-slate-400">+{contact.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://api.whatsapp.com/send?phone=${contact.phone}&text=${encodeURIComponent('hi')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10"
                    title="Test WhatsApp"
                  >
                    <MessageCircle size={14} className="text-emerald-400" />
                  </a>
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-red-400"
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
                <p className="text-xs font-semibold text-slate-200">Add New Contact</p>
                <input
                  type="text"
                  placeholder="Contact Name (e.g. Rajiv Menon)"
                  value={newContactName}
                  onChange={e => setNewContactName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-black/40 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number (e.g. 919876543210)"
                  value={newContactPhone}
                  onChange={e => setNewContactPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-black/40 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
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
        <Section icon={<Bell size={18} className="text-amber-400" />} title="Notifications">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-100">Browser Notifications</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
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
              className="btn-primary mt-3 w-full justify-center text-xs"
            >
              {requestingPermission ? 'Requesting…' : 'Enable Notifications'}
            </button>
          )}
          {notifPermission === 'denied' && (
            <p className="text-xs text-slate-400 mt-2">
              Open browser settings and allow notifications for this site, then reload.
            </p>
          )}
          <p className="text-[10px] text-slate-400 mt-3">
            ⚠ Browser notifications fire while this tab is open.
          </p>
        </Section>

        {/* ── Local Data ─── */}
        <Section icon={<Database size={18} className="text-purple-400" />} title="Local Data">
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: 'Files', value: stats.files },
              { label: 'Activity', value: stats.activity },
              { label: 'Reminders', value: stats.reminders },
              { label: 'Contacts', value: stats.contacts },
            ].map(({ label, value }) => (
              <div key={label} className="glass-card-blue p-2.5 rounded-xl text-center">
                <p className="text-base font-bold text-cyan-300">{value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {clearDone && (
              <motion.p
                className="text-xs text-emerald-400 font-medium mb-2"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                ✓ All local data cleared.
              </motion.p>
            )}
          </AnimatePresence>

          <button
            onClick={() => setConfirmClearAll(true)}
            className="btn-ghost text-red-400 w-full justify-center text-xs"
          >
            <Trash2 size={14} /> Clear all local data
          </button>
        </Section>

        {/* ── Browser Capabilities ─── */}
        <Section icon={<Info size={18} className="text-emerald-400" />} title="Browser Capabilities">
          <div className="space-y-2">
            {[
              { label: 'Speech Recognition',  ok: speechSupported },
              { label: 'Web Share API',        ok: shareSupported  },
              { label: 'Notifications API',    ok: notifSupported  },
              { label: 'IndexedDB Storage',    ok: idbSupported    },
              { label: 'File System Access',   ok: 'showOpenFilePicker' in window },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                <p className="text-xs text-slate-200">{label}</p>
                <span
                  className="kural-badge text-[10px]"
                  style={{
                    background: ok ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                    color: ok ? '#34d399' : '#f87171',
                    borderColor: ok ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)',
                  }}
                >
                  {ok ? '✓ Supported' : '✗ Unavailable'}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Privacy ─── */}
        <Section icon={<Shield size={18} className="text-cyan-400" />} title="Privacy">
          <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
            <p>
              <strong className="text-slate-200">Local-first.</strong> Indexed file metadata and contacts stay inside this browser's local IndexedDB.
            </p>
            <p>
              <strong className="text-slate-200">No uploads.</strong> KURAL does not upload files or document contents to external storage servers.
            </p>
            <p>
              <strong className="text-slate-200">No analytics.</strong> KURAL does not collect usage tracking data.
            </p>
          </div>
        </Section>

        {/* ── About ─── */}
        <div className="glass-card p-4 text-center space-y-1">
          <p className="text-sm font-bold text-slate-100">KURAL</p>
          <p className="text-xs text-slate-400">Multilingual Personal AI Agent · iQOO Hackathon Prototype</p>
          <p className="text-[10px] text-slate-400">Local-first · No uploads · No tracking</p>
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

function Section({
  icon, title, children,
}: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs font-bold text-slate-200">{title}</p>
      </div>
      <div className="kural-divider" />
      {children}
    </div>
  )
}

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
