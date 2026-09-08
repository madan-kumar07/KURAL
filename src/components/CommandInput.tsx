// CommandInput.tsx — Futuristic dark text input

import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, X } from 'lucide-react'

interface CommandInputProps {
  value: string
  onChange: (v: string) => void
  onSubmit: (text: string) => void
  onClear?: () => void
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
}

export function CommandInput({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = 'Or type a command…',
  disabled = false,
  autoFocus = false,
}: CommandInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const handleSubmit = () => {
    const text = value.trim()
    if (text && !disabled) {
      onSubmit(text)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <motion.div
      className="relative flex items-center w-full"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        disabled={disabled}
        aria-label="Type a command"
        className="kural-input"
        style={{ paddingRight: value ? '5.5rem' : '3.5rem' }}
      />

      {/* Clear button */}
      {value && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => { onChange(''); onClear?.() }}
          className="absolute right-12 p-1.5 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Clear input"
        >
          <X size={14} color="#94a3b8" />
        </motion.button>
      )}

      {/* Send button */}
      <button
        onClick={handleSubmit}
        disabled={!value.trim() || disabled}
        aria-label="Send command"
        className="absolute right-2 w-9 h-9 rounded-full flex items-center justify-center transition-all"
        style={{
          background: value.trim() && !disabled
            ? 'linear-gradient(135deg, #6366f1, #38bdf8)'
            : 'rgba(255,255,255,0.06)',
          boxShadow: value.trim() && !disabled ? '0 2px 12px rgba(56,189,248,0.35)' : 'none',
          cursor: !value.trim() || disabled ? 'not-allowed' : 'pointer',
          opacity: !value.trim() || disabled ? 0.4 : 1,
        }}
      >
        <Send
          size={15}
          color="#ffffff"
          strokeWidth={2}
        />
      </button>
    </motion.div>
  )
}
