// ConfirmationDialog.tsx — Modal for sensitive file confirmation with dark theme

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
  warning: { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', icon: AlertTriangle },
  danger:  { color: '#f87171', bg: 'rgba(248,113,113,0.15)', icon: AlertTriangle },
  info:    { color: '#38bdf8', bg: 'rgba(56,189,248,0.15)', icon: AlertTriangle },
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
                <h3 className="text-sm font-bold text-slate-100">{title}</h3>
              </div>
              <button
                onClick={onCancel}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10"
                aria-label="Close"
              >
                <X size={16} className="text-slate-400" />
              </button>
            </div>

            {/* Message */}
            <p className="text-xs text-slate-300 leading-relaxed mb-6">{message}</p>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={onCancel} className="btn-secondary flex-1 text-xs justify-center">
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-2 px-4 rounded-full text-xs font-semibold text-white transition-all"
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
