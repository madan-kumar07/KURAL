// ResultCard.tsx — Shows the final extracted result, file details, and WhatsApp action cards

import { motion } from 'framer-motion'
import { FileText, IndianRupee, Calendar, Hash, Building2, Clock, CheckCircle, MessageCircle, ExternalLink } from 'lucide-react'
import type { ExtractedData } from '../agent/ExecutionContext'
import type { FileRecord } from '../data/FileRepository'

interface ResultCardProps {
  file?: FileRecord | null
  extractedData?: ExtractedData
  reminderTime?: number
  shareResult?: string
  onShare?: () => void
  onRemind?: () => void
}

const fieldIcons: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  amount: IndianRupee,
  date: Calendar,
  invoice_number: Hash,
  vendor: Building2,
  due_date: Clock,
}

const fieldLabels: Record<string, string> = {
  amount: 'Amount',
  date: 'Date',
  invoice_number: 'Invoice No.',
  vendor: 'Vendor',
  due_date: 'Due Date',
}

export function ResultCard({ file, extractedData, reminderTime, shareResult }: ResultCardProps) {
  const hasExtracted = extractedData && Object.keys(extractedData).some(k => k !== 'rawText' && extractedData[k])
  const displayedFields = extractedData
    ? Object.entries(extractedData).filter(([k, v]) => k !== 'rawText' && v)
    : []

  const isWhatsApp = shareResult && (shareResult.includes('WhatsApp') || shareResult.includes('whatsapp'))

  return (
    <motion.div
      className="glass-card-elevated p-5 space-y-4"
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* File info */}
      {file && (
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(0,136,255,0.10)' }}
          >
            <FileText size={20} color="#0088ff" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink truncate">{file.name}</p>
            <p className="text-xs text-ink-tertiary mt-0.5">
              {file.type.toUpperCase()} · {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <CheckCircle size={18} color="#16a34a" />
        </div>
      )}

      {/* Extracted fields */}
      {hasExtracted && (
        <div className="space-y-2">
          <div className="kural-divider" />
          <div className="grid grid-cols-1 gap-2">
            {displayedFields.map(([key, value]) => {
              const Icon = fieldIcons[key]
              const label = fieldLabels[key] || key.replace('_', ' ')
              return (
                <motion.div
                  key={key}
                  className="flex items-center gap-3 py-1.5"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {Icon && (
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(0,136,255,0.08)' }}
                    >
                      <Icon size={14} color="#0088ff" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-xs text-ink-tertiary">{label}</p>
                    <p className="text-sm font-semibold text-ink">{String(value)}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Reminder result */}
      {reminderTime && (
        <motion.div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.15)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Clock size={16} color="#d97706" />
          <div>
            <p className="text-xs font-medium" style={{ color: '#b45309' }}>Reminder set</p>
            <p className="text-xs text-ink-secondary">
              {new Date(reminderTime).toLocaleString('en-IN', {
                weekday: 'short', day: 'numeric', month: 'short',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        </motion.div>
      )}

      {/* WhatsApp Action Result Card */}
      {isWhatsApp && (
        <motion.div
          className="p-4 rounded-2xl space-y-3"
          style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.20)' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#25D366' }}>
              <MessageCircle size={18} color="white" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#075E54' }}>WhatsApp Action Triggered</p>
              <p className="text-xs text-ink-secondary">{shareResult}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-medium text-emerald-800">
              💬 Message prefilled & chat launched
            </span>
            <a
              href="https://web.whatsapp.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: '#25D366' }}
            >
              Open WhatsApp <ExternalLink size={12} />
            </a>
          </div>
        </motion.div>
      )}

      {/* Generic share result */}
      {shareResult && !isWhatsApp && (
        <motion.div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.15)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <CheckCircle size={16} color="#059669" />
          <p className="text-xs font-medium" style={{ color: '#047857' }}>{shareResult}</p>
        </motion.div>
      )}
    </motion.div>
  )
}
