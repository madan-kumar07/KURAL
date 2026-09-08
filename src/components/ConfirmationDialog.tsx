// ConfirmationDialog.tsx — Modal for sensitive file confirmation

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmationDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'warning' | 'danger' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

const variantConfig = {
  warning: { color: '#d97706', bg: 'rgba(217,119,6,0.10)', icon: AlertTriangle },
  danger:  { color: '#dc2626', bg: 'rgba(220,38,38,0.10)', icon: AlertTriangle },
  info:    { color: '#0088ff', bg: 'rgba(0,136,255,0.10)', icon: AlertTriangle },
}

export function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  variant = 'warning',
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="glass-card-elevated w-full max-w-sm p-6"
            initial={{ y: 40, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: config.bg }}
                >
                  <Icon size={20} color={config.color} />
                </div>
                <h3 className="text-base font-semibold text-ink">{title}</h3>
              </div>
              <button
                onClick={onCancel}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5"
                aria-label="Close"
              >
                <X size={16} color="rgba(13,31,53,0.5)" />
              </button>
            </div>

            {/* Message */}
            <p className="text-sm text-ink-secondary leading-relaxed mb-6">{message}</p>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={onCancel} className="btn-secondary flex-1">
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-2.5 px-4 rounded-full text-sm font-semibold text-white transition-all"
                style={{
                  background: config.color,
                  boxShadow: `0 4px 16px ${config.color}40`,
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
